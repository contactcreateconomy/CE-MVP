/**
 * qualify — SLICE-P4-07: the M3 qualification orchestrator + live/replay
 * split (two distinct write paths sharing the evaluators and schema).
 *
 * CAP-064 (quoted): "Action; runs hard then soft; fail-closed on any
 * dependency error; immutable run + results written." — hence
 * internalAction: vectorSearch and the classifier/GLM seams run in the
 * action; every db write funnels through ONE transactional internal
 * mutation (persistRun), which preserves CAP-083's atomic immutable write
 * (run + results + candidate snapshot together or not at all).
 *
 * LIVE path (CAP-064→CAP-083): called from forge completion (P4-09). Runs
 * hard rules first — short-circuit to fail on any hard fail (M3: "still
 * record all for evidence where cheap": deterministic rules all run; the
 * classifier call is skipped once a fail exists and H-SAFE records a
 * flag) — then soft scores ONLY when no hard rule failed. Writes
 * qualificationRuns + qualificationRuleResults (source=live, permanently
 * immutable — no update/delete path exists in this module by construction)
 * + contentCandidates.evaluation snapshot.
 *
 * REPLAY path (CAP-085): replays calibrationExamples' candidateSnapshots
 * against the CURRENT live rule config, writing source=replay rows only —
 * never mutating or deleting any pre-existing row (E4 segregation enforced
 * at the write-path level: this path has no patch/delete on runs/results).
 * Hard rules only — expectedOutcome labels are pass/fail per rule, and
 * soft scores have no binary outcome to drift against (flagged in-slice).
 *
 * Rule enablement: seeded rules run when their row says enabled; the eight
 * thin hard rules have no qualificationRules rows (P4-06 seeded the five
 * consolidated tunables) and run default-enabled — absent rows can only
 * mean default-on or never-run, and never-run would void the 2026-09-04
 * orphan disposition that assigns them here (flagged).
 */

import { internalAction, internalMutation, internalQuery } from "./../_generated/server";
import { internal } from "./../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { classifySafety } from "../lib/classifier";
import { glmScore } from "../lib/glm";
import { HARD_RULES, SOFT_RULES, type CandidateContext, type RuleOutcome } from "./rules";
import { jaccard, shingles } from "./similarity";

interface PersistResultInput {
  ruleKey: string;
  result: "pass" | "fail" | "flag";
  score?: number;
  threshold?: number;
  evidence: string;
  failureCode?: string;
}

interface PersistArgs {
  live: boolean;
  run: {
    contentCandidateId: string;
    candidateRevision: number;
    rulebookVersion: number;
    overallResult: "pass" | "fail";
    generationRunId?: string;
  };
  results: PersistResultInput[];
}

/**
 * The single transactional writer (CAP-083). Insert-only on runs/results;
 * the one patch is the candidate's evaluation SNAPSHOT projection (bible
 * l.162: "contentCandidates.evaluation remains the latest snapshot
 * projection") — snapshot updates never rewrite result rows.
 */
export const persistRun = internalMutation({
  args: {
    live: v.boolean(),
    run: v.object({
      contentCandidateId: v.string(),
      candidateRevision: v.number(),
      rulebookVersion: v.number(),
      overallResult: v.union(v.literal("pass"), v.literal("fail")),
      generationRunId: v.optional(v.string()),
    }),
    results: v.array(v.object({
      ruleKey: v.string(),
      result: v.union(v.literal("pass"), v.literal("fail"), v.literal("flag")) ,
      score: v.optional(v.number()),
      threshold: v.optional(v.number()),
      evidence: v.string(),
      failureCode: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const runId = await ctx.db.insert("qualificationRuns", {
      contentCandidateId: args.run.contentCandidateId as Id<"contentCandidates">,
      candidateRevision: args.run.candidateRevision,
      rulebookVersion: args.run.rulebookVersion,
      overallResult: args.run.overallResult,
      startedAt: now,
      completedAt: now,
      generationRunId: args.run.generationRunId,
    });
    for (const r of args.results) {
      await ctx.db.insert("qualificationRuleResults", {
        qualificationRunId: runId,
        ruleKey: r.ruleKey,
        result: r.result,
        source: args.live ? "live" : "replay",
        score: r.score,
        threshold: r.threshold,
        evidence: r.evidence,
        failureCode: r.failureCode,
      });
    }
    // Snapshot projection — live runs only (replay must not touch the
    // candidate's live evaluation state).
    if (args.live) {
      await ctx.db.patch(args.run.contentCandidateId as Id<"contentCandidates">, {
        evaluation: {
          overallResult: args.run.overallResult,
          ruleResults: args.results,
          runId,
          evaluatedAt: now,
        },
      });
    }
    return { runId, overallResult: args.run.overallResult };
  },
});

/** Context loader — candidate + rules + refs. Fail-closed on missing rows. */
export const loadContext = internalQuery({
  args: { contentCandidateId: v.string() },
  handler: async (ctx, { contentCandidateId }) => {
    const candidate = await ctx.db.get(contentCandidateId as Id<"contentCandidates">);
    if (!candidate) throw new Error(`qualify: candidate ${contentCandidateId} not found (fail-closed)`);
    const rules = await ctx.db.query("qualificationRules").collect();
    const refs = await ctx.db
      .query("draftClaimRefs")
      .withIndex("by_candidate", (q: any) =>
        q.eq("contentCandidateId", contentCandidateId as Id<"contentCandidates">),
      )
      .collect();
    const embedding = await ctx.db
      .query("contentEmbeddings")
      .filter((q: any) =>
        q.and(q.eq(q.field("refType"), "contentCandidate"), q.eq(q.field("refId"), contentCandidateId)),
      )
      .first();
    return { candidate, rules, refs, embedding };
  },
});

/** Evaluate the hard set against a context (pure core, shared by both
 *  paths). Deterministic rules always run for evidence; the classifier is
 *  skipped after a hard fail (H-SAFE records a flag, M3 "where cheap"). */
export async function evaluateHard(
  ctxInput: CandidateContext,
  rules: { ruleKey: string; enabled: boolean; thresholdConfig: Record<string, unknown> }[],
): Promise<PersistResultInput[]> {
  const outcomes: PersistResultInput[] = [];
  let failed = false;
  for (const ruleKey of Object.keys(HARD_RULES)) {
    const rule = rules.find((r) => r.ruleKey === ruleKey);
    if (rule && !rule.enabled) continue; // seeded + disabled → skip
    // unseeded (the thin eight) → default-enabled (module header flag)
    if (ruleKey === "H-SAFE" && failed) {
      outcomes.push({ ruleKey, result: "flag", evidence: "skipped — hard fail short-circuit (classifier call not cheap)", failureCode: "H-SAFE/skipped_after_hard_fail" });
      continue;
    }
    let outcome: RuleOutcome;
    if (ruleKey === "H-SAFE") {
      const classification = await classifySafety(ctxInput.prose);
      outcome = HARD_RULES[ruleKey]({ ...ctxInput, safetyClassification: classification }, rule?.thresholdConfig ?? {});
    } else {
      outcome = HARD_RULES[ruleKey](ctxInput, rule?.thresholdConfig ?? {});
    }
    if (outcome.result === "fail") failed = true;
    outcomes.push({ ruleKey, ...outcome });
  }
  return outcomes;
}

/** Evaluate the soft set (advisory) — GLM/DISC/VAL dependency errors
 *  propagate to the caller, which fails the run closed (CAP-064). */
export async function evaluateSoft(
  ctxInput: CandidateContext,
): Promise<PersistResultInput[]> {
  const outcomes: PersistResultInput[] = [];
  for (const [ruleKey, evaluator] of Object.entries(SOFT_RULES)) {
    const outcome = await evaluator(ctxInput, { glmScore });
    outcomes.push({ ruleKey, ...outcome });
  }
  return outcomes;
}

/** Build the CandidateContext from loaded rows + vectorSearch results. */
function buildContext(
  loaded: any,
  semanticSimilarities: number[],
  dupComparisons: { semantic: number; jaccard: number }[],
): CandidateContext {
  const draft = (loaded.candidate.draft ?? {}) as any;
  const snapshotFields = (draft.presentFields ?? {}) as Record<string, string[]>;
  return {
    candidateRevision: draft.candidateRevision ?? 1,
    postType: loaded.candidate.postType ?? draft.postType,
    authorType: draft.authorType ?? "editorial",
    body: draft.body ?? "",
    title: draft.title,
    presentFields: snapshotFields,
    categoryConfidences: draft.categoryConfidences ?? [],
    categoryOverride: draft.categoryOverride === true,
    quotes: draft.quotes ?? [],
    claimRefs: loaded.refs.map((r: any) => ({
      assertionText: r.assertionText,
      sourceClaimIds: r.sourceClaimIds,
      exactValidation: r.exactValidation,
    })),
    sources: draft.sources ?? [],
    semanticSimilarities,
    dupComparisons,
    surfaceComparisonTexts: draft.surfaceComparisonTexts ?? [],
    prose: draft.prose ?? draft.body ?? "",
    aiDisclosed: draft.aiDisclosed === true,
    generationRunRecorded: draft.generationRunRecorded === true,
    hasEmbedding: Boolean(loaded.embedding),
  };
}

/** H-SIM-semantic + H-DUP semantic neighbor search (action-only API). */
async function neighborSimilarities(
  ctx: any,
  embeddingVector: number[],
  categoryId: string | undefined,
  limit: number,
): Promise<number[]> {
  const results = await ctx.vectorSearch("contentEmbeddings", "by_embedding", {
    vector: embeddingVector,
    limit,
    filter: categoryId ? { eq: categoryId } : undefined,
  });
  // The candidate's own embedding may be returned — scores are similarities
  // of OTHER docs; the loader's candidate row is included in results only
  // if it was indexed before this run (acceptable evidence either way).
  return results.map((r: any) => r.score);
}

/**
 * CAP-064 — `qualify(candidateId, revision)`: the LIVE path. Called from
 * forge completion (P4-09) via runAction; fail-closed on any dependency
 * error (embedding missing, GLM unset, classifier unreachable all resolve
 * to recorded rule-level fails; loader errors throw before any write).
 */
export const run = internalAction({
  args: {
    contentCandidateId: v.string(),
    candidateRevision: v.optional(v.number()),
    generationRunId: v.optional(v.string()),
  },
  // explicit return type: the inferred one self-references through the
  // generated internal API (same class as the P4-06 triggerCalibrate fix)
  handler: async (ctx, args): Promise<{ runId: string; overallResult: "pass" | "fail" }> => {
    const loaded = await ctx.runQuery(internal.qualify.orchestrator.loadContext, {
      contentCandidateId: args.contentCandidateId,
    });

    let semanticSimilarities: number[] = [];
    let dupComparisons: { semantic: number; jaccard: number }[] = [];
    if (loaded.embedding) {
      const categoryId = (loaded.candidate.draft as any)?.categoryId;
      const scores = await neighborSimilarities(ctx, loaded.embedding.embedding, categoryId, 20);
      semanticSimilarities = scores;
      dupComparisons = scores.map((s) => ({ semantic: s, jaccard: 0 }));
    }

    const context = buildContext(loaded, semanticSimilarities, dupComparisons);
    const ruleRows = loaded.rules.map((r: any) => ({
      ruleKey: r.ruleKey,
      enabled: r.enabled,
      thresholdConfig: r.thresholdConfig ?? {},
    }));
    const rulebookVersion = Math.max(0, ...loaded.rules.map((r: any) => r.ruleVersion ?? 0), 0);

    const hardResults = await evaluateHard(context, ruleRows);
    const hardFailed = hardResults.some((r) => r.result === "fail");

    // M3 §8: short-circuit to fail on any hard fail — soft scores skipped.
    let softResults: PersistResultInput[] = [];
    if (!hardFailed) {
      softResults = await evaluateSoft(context);
    }

    const overallResult: "pass" | "fail" = hardFailed ? "fail" : "pass";
    return await ctx.runMutation(internal.qualify.orchestrator.persistRun, {
      live: true,
      run: {
        contentCandidateId: args.contentCandidateId,
        candidateRevision: args.candidateRevision ?? context.candidateRevision,
        rulebookVersion,
        overallResult,
        generationRunId: args.generationRunId,
      },
      results: [...hardResults, ...softResults],
    });
  },
});

/**
 * CAP-085 — the REPLAY path (calibrate). Replays every calibrationExample
 * snapshot against the CURRENT live rule config, writing source=replay
 * rows; returns the drift report (expected vs actual per rule). Never
 * patches or deletes anything (E4 segregation at the write-path level).
 */
export const replay = internalAction({
  args: {},
  handler: async (ctx) => {
    const examples = await ctx.runQuery(internal.qualify.orchestrator.loadCalibrationSet, {});
    const rules = examples.rules as any[];
    const ruleRows = rules.map((r: any) => ({
      ruleKey: r.ruleKey,
      enabled: r.enabled,
      thresholdConfig: r.thresholdConfig ?? {},
    }));
    const rulebookVersion = Math.max(0, ...rules.map((r: any) => r.ruleVersion ?? 0), 0);

    const report: { exampleId: string; drift: { ruleKey: string; expected: string; actual: string }[] }[] = [];
    for (const example of examples.examples as any[]) {
      const snapshot = example.candidateSnapshot as any;
      const context: CandidateContext = {
        candidateRevision: snapshot.candidateRevision ?? 1,
        postType: snapshot.postType,
        authorType: snapshot.authorType ?? "editorial",
        body: snapshot.body ?? "",
        title: snapshot.title,
        presentFields: snapshot.presentFields ?? {},
        categoryConfidences: snapshot.categoryConfidences ?? [],
        categoryOverride: snapshot.categoryOverride === true,
        quotes: snapshot.quotes ?? [],
        claimRefs: snapshot.claimRefs ?? [],
        sources: snapshot.sources ?? [],
        semanticSimilarities: snapshot.semanticSimilarities ?? [],
        dupComparisons: snapshot.dupComparisons ?? [],
        surfaceComparisonTexts: snapshot.surfaceComparisonTexts ?? [],
        prose: snapshot.prose ?? snapshot.body ?? "",
        aiDisclosed: snapshot.aiDisclosed === true,
        generationRunRecorded: snapshot.generationRunRecorded === true,
        hasEmbedding: snapshot.hasEmbedding === true,
        safetyClassification: snapshot.safetyClassification,
      };
      const hardResults = await evaluateHard(context, ruleRows);
      const overallResult = hardResults.some((r) => r.result === "fail") ? "fail" : "pass";

      await ctx.runMutation(internal.qualify.orchestrator.persistRun, {
        live: false,
        run: {
          // The example id stands in for the candidate id in replay runs —
          // insert-only, never resolves to a real candidate row.
          contentCandidateId: example._id,
          candidateRevision: context.candidateRevision,
          rulebookVersion,
          overallResult,
        },
        results: hardResults,
      });

      const drift = hardResults
        .filter((r) => example.expectedOutcome[r.ruleKey] !== undefined)
        .filter((r) => (r.result === "fail" ? "fail" : "pass") !== example.expectedOutcome[r.ruleKey])
        .map((r) => ({ ruleKey: r.ruleKey, expected: example.expectedOutcome[r.ruleKey], actual: r.result === "fail" ? "fail" : "pass" }));
      report.push({ exampleId: example._id, drift });
    }

    return {
      replayed: report.length,
      drifted: report.filter((r) => r.drift.length > 0).length,
      report,
    };
  },
});

/** Calibration-set loader for the replay path. */
export const loadCalibrationSet = internalQuery({
  args: {},
  handler: async (ctx) => {
    const examples = await ctx.db
      .query("calibrationExamples")
      .withIndex("by_addedAt")
      .order("desc")
      .take(100);
    const rules = await ctx.db.query("qualificationRules").collect();
    return { examples, rules };
  },
});
