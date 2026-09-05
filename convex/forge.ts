/**
 * forge — SLICE-P4-09: forge.draft (CAP-038/039/040) — the claims-first
 * draft generator.
 *
 * CAP-038 (quoted): "Synthesizes from claimClusters.claimIds; prompt
 *   forbids source wording reuse; records inputClaims; never emits URLs."
 *   Server-side URL enforcement on top of the prompt constraint: a draft
 *   body containing URL-like text is REJECTED (counts as a failed GLM
 *   attempt), never silently stripped.
 * CAP-039 (quoted): "every factual assertion → sourceClaimId[]; M3
 *   H-TRACE validates." — draftClaimRefs rows, operatorConfirmed=false
 *   (CAP-542's blank slate), exactValidation recorded as GLM-reported.
 * CAP-040 (quoted): "Calls M3 `qualify(candidate, revision)`
 *   synchronously." — forge is an action, so the qualify orchestrator is
 *   invoked with runAction in the same execution; the candidate then moves
 *   drafting → review (CAP-041's gate is "qualify HAS RUN" — a failed
 *   evaluation renders in the workspace with regen available; the M2
 *   sheet's "hard-fail → not reviewable" describes the human flow, not an
 *   auto-action — register-faithful reading, flagged).
 *
 * INV-1 (M2): forge input = claimClusters.claimIds ONLY; the candidate
 * links contentCandidateSources + generationRuns.inputClaims (provenance).
 *
 * Embeddings writer (owned here per the slice graph): the candidate draft
 * is embedded via the GLM embedding seam (1024 dims — must match the
 * by_embedding vector index; a model swap bumps embeddingVersion and
 * re-indexes). Failure to embed fails H-SIM-semantic closed at qualify —
 * correct posture, not a forge failure.
 */

import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { hashContent } from "./lib/hash";

const URL_LIKE = /https?:\/\/|www\.|\b[a-z0-9-]+(\.[a-z0-9-]+)+\b/i;

export interface ForgeAssertion {
  assertionText: string;
  sourceClaimIds: string[];
  exactValidation?: Record<string, "pass" | "fail">;
}

export interface ForgeOutput {
  title: string;
  body: string;
  postType: string;
  assertions: ForgeAssertion[];
}

/**
 * Parse + enforce the GLM forge response (pure, unit-tested). Throws on:
 * non-strict JSON, missing draft fields, URL-like text in the body
 * (CAP-038 "never emits URLs"), assertions without citations (CAP-039's
 * every-assertion-must-cite — H-TRACE's fail-closed is downstream, forge
 * refuses to emit an uncited draft at all).
 */
export function parseForgeResponse(raw: string): ForgeOutput {
  const parsed = JSON.parse(raw) as Partial<ForgeOutput> & { draft?: { title?: string; body?: string; postType?: string } };
  const title = parsed.draft?.title ?? parsed.title;
  const body = parsed.draft?.body ?? parsed.body;
  const postType = parsed.draft?.postType ?? parsed.postType;
  const assertions = parsed.assertions ?? [];
  if (typeof title !== "string" || !title.trim()) throw new Error("forge: missing draft title");
  if (typeof body !== "string" || !body.trim()) throw new Error("forge: missing draft body");
  if (!postType) throw new Error("forge: missing postType");
  if (URL_LIKE.test(body)) throw new Error("forge: draft body contains a URL (CAP-038: never emits URLs)");
  if (!Array.isArray(assertions) || assertions.length === 0) {
    throw new Error("forge: no assertions emitted (CAP-039: every factual assertion must cite claims)");
  }
  for (const [i, a] of assertions.entries()) {
    if (typeof a?.assertionText !== "string" || !Array.isArray(a.sourceClaimIds) || a.sourceClaimIds.length === 0) {
      throw new Error(`forge: assertion #${i + 1} has no sourceClaimIds (CAP-039)`);
    }
  }
  return { title, body, postType, assertions };
}

/** Cluster + claims loader (fail-closed on non-ready clusters). */
export const loadCluster = internalMutation({
  args: { clusterId: v.id("claimClusters") },
  handler: async (ctx, { clusterId }) => {
    const cluster = await ctx.db.get(clusterId);
    if (!cluster) throw new Error(`forge: cluster ${clusterId} not found`);
    if (cluster.status !== "ready") throw new Error(`forge: cluster status ${cluster.status} ≠ ready`);
    const claims = [];
    const sources = new Map<string, { sourceId: Id<"sources">; extractionId: Id<"contentExtractions"> }>();
    for (const claimId of cluster.claimIds) {
      const claim = await ctx.db.get(claimId);
      if (!claim) continue;
      claims.push(claim);
      const extraction = await ctx.db.get(claim.contentExtractionId);
      if (extraction) {
        sources.set(extraction.sourceId, { sourceId: extraction.sourceId, extractionId: claim.contentExtractionId });
      }
    }
    return { cluster, claims, sources: [...sources.values()] };
  },
});

/** The GLM forge call (strict JSON). */
async function glmForge(claims: { claimText: string; evidenceText: string; claimType: string }[]): Promise<string> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) throw new Error("forge: GLM_API_KEY unset (dependency error, fail-closed)");
  const baseUrl = process.env.GLM_API_BASE ?? "https://open.bigmodel.cn/api/paas/v4";
  const model = process.env.GLM_MODEL ?? "glm-4";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a fact-checked article writer. Write ONLY from the supplied claims. " +
            "NEVER reuse source wording verbatim; paraphrase everything. NEVER include URLs or links. " +
            'Reply with STRICT JSON only: {"draft": {"title": string, "body": string (markdown, no URLs), "postType": "news"}, ' +
            '"assertions": [{"assertionText": string, "sourceClaimIds": string[] (the claim ids supporting it), ' +
            '"exactValidation": {"numbers": "pass"|"fail", "dates": "pass"|"fail", "quotes": "pass"|"fail", "entities": "pass"|"fail"}}]} — ' +
            "every factual assertion in the body MUST appear in assertions with its supporting claim ids.",
        },
        {
          role: "user",
          content: "CLAIMS:\n" + claims.map((c) => `[${(c as any)._id}] (${c.claimType}) ${c.claimText}\n  evidence: ${c.evidenceText}`).join("\n"),
        },
      ],
      temperature: 0.4,
    }),
  });
  if (!response.ok) throw new Error(`forge: GLM ${response.status}`);
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

/** GLM embedding (1024-dim — must match the vector index dims). */
async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) throw new Error("forge: GLM_API_KEY unset — embedding skipped (H-SIM fails closed at qualify)");
  const baseUrl = process.env.GLM_API_BASE ?? "https://open.bigmodel.cn/api/paas/v4";
  const model = process.env.GLM_EMBEDDING_MODEL ?? "embedding-2";
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, input: text.slice(0, 8000) }),
  });
  if (!response.ok) throw new Error(`forge: embedding ${response.status}`);
  const data = (await response.json()) as { data?: { embedding?: number[] }[] };
  const vector = data.data?.[0]?.embedding;
  if (!vector || vector.length !== 1024) {
    throw new Error(`forge: embedding dims ${vector?.length ?? 0} ≠ index 1024 (model-bound dims — re-index on model swap)`);
  }
  return vector;
}

/** Persist candidate + refs + sources + run + embedding (one transaction). */
export const persistForgedCandidate = internalMutation({
  args: {
    clusterId: v.id("claimClusters"),
    postType: v.string(),
    title: v.string(),
    body: v.string(),
    inputClaimIds: v.array(v.id("sourceClaims")),
    sources: v.array(v.object({ sourceId: v.id("sources"), extractionId: v.id("contentExtractions") })),
    assertions: v.array(v.object({
      assertionText: v.string(),
      sourceClaimIds: v.array(v.id("sourceClaims")),
      exactValidation: v.optional(v.any()),
    })),
    embedding: v.optional(v.array(v.float64())),
    embeddingModel: v.optional(v.string()),
    textHash: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const candidateId = await ctx.db.insert("contentCandidates", {
      status: "drafting",
      draft: { title: args.title, body: args.body, candidateRevision: 1 },
      claimClusterId: args.clusterId,
      postType: args.postType,
      createdAt: now,
    });
    for (const a of args.assertions) {
      await ctx.db.insert("draftClaimRefs", {
        contentCandidateId: candidateId,
        candidateRevision: 1,
        assertionText: a.assertionText,
        sourceClaimIds: a.sourceClaimIds,
        exactValidation: a.exactValidation ?? {},
        operatorConfirmed: false, // CAP-542's blank slate
        createdAt: now,
      });
    }
    for (const s of args.sources) {
      await ctx.db.insert("contentCandidateSources", {
        contentCandidateId: candidateId,
        sourceId: s.sourceId,
        relationshipType: "primary",
        extractionId: s.extractionId,
        createdAt: now,
      });
    }
    await ctx.db.insert("generationRuns", {
      runType: "forge.draft",
      provider: "glm",
      model: process.env.GLM_MODEL ?? "glm-4",
      promptVersion: "forge/1",
      inputClaims: args.inputClaimIds,
      inputRef: args.clusterId,
      outputRef: candidateId,
      status: "succeeded",
      attemptNumber: 1,
      tokenUsage: 0,
      estimatedCost: 0,
      startedAt: now,
      completedAt: now,
    });
    if (args.embedding && args.embeddingModel) {
      await ctx.db.insert("contentEmbeddings", {
        refType: "contentCandidate",
        refId: candidateId,
        categoryId: "uncategorized", // H-CAT assigns at qualify; index filter field requires a value
        embedding: args.embedding,
        embeddingModel: args.embeddingModel,
        embeddingVersion: 1,
        textHash: args.textHash,
      });
    }
    await ctx.db.patch(args.clusterId, { status: "drafted" });
    return candidateId;
  },
});

/** Candidate → review transition after qualify ran (CAP-040→CAP-041). */
export const markReviewable = internalMutation({
  args: { candidateId: v.id("contentCandidates") },
  handler: async (ctx, { candidateId }) => {
    await ctx.db.patch(candidateId, { status: "review" });
  },
});

/** CAP-038/039/040 — forge.draft on a ready cluster. */
export const draft = internalAction({
  args: { clusterId: v.id("claimClusters") },
  handler: async (ctx, { clusterId }): Promise<{ candidateId: string; evaluation: { overallResult: string } }> => {
    const loaded = await ctx.runMutation(internal.forge.loadCluster, { clusterId });
    const raw = await glmForge(loaded.claims);
    const output = parseForgeResponse(raw); // URL/citation enforcement (throws = failed attempt)

    let embedding: number[] | undefined;
    let embeddingModel: string | undefined;
    try {
      embedding = await embedText(`${output.title}\n\n${output.body}`);
      embeddingModel = process.env.GLM_EMBEDDING_MODEL ?? "embedding-2";
    } catch {
      embedding = undefined; // H-SIM-semantic fails closed at qualify — honest posture
    }

    const candidateId = await ctx.runMutation(internal.forge.persistForgedCandidate, {
      clusterId,
      postType: output.postType,
      title: output.title,
      body: output.body,
      inputClaimIds: loaded.claims.map((c: any) => c._id),
      sources: loaded.sources,
      assertions: output.assertions as any,
      embedding,
      embeddingModel,
      textHash: hashContent(output.body),
    });

    // CAP-040: qualify synchronously (same execution; an action may runAction)
    const evaluation = await ctx.runAction(internal.qualify.orchestrator.run, {
      contentCandidateId: candidateId,
      candidateRevision: 1,
      generationRunId: undefined,
    });
    await ctx.runMutation(internal.forge.markReviewable, { candidateId });
    return { candidateId, evaluation: { overallResult: evaluation.overallResult } };
  },
});
