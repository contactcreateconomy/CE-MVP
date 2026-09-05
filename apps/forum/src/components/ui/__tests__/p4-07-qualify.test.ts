/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection + pure-evaluator fixtures */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* SLICE-P4-07 acceptance tests.
 * SECTION 1 (checkpoint): spine + the five heavy evaluators.
 * SECTION 2: thin-eight hard checks + soft-five + replay wiring.
 *
 * The evaluators are PURE (context in → outcome out; external seams enter
 * as context inputs), so the full rule set is unit-testable here. The
 * orchestrator action itself (vectorSearch, runMutation persistence) needs
 * a deployment push (DEV-HANDOFF #4) — its shape is asserted by surface.
 *
 * Sources: CAP-064-082 Notes; M3 sheet §8; bible l.149/155/157/159/160-163;
 * CONTRACT-3-rulebook E1-E5 resolutions. */

import schemaDefault from "../../../../../../convex/schema";
import * as rulebookModule from "../../../../../../convex/rulebook";
import * as qualifyRules from "../../../../../../convex/qualify/rules";
import * as qualifySimilarity from "../../../../../../convex/qualify/similarity";
import * as orchestrator from "../../../../../../convex/qualify/orchestrator";

const schema = schemaDefault as any;
const { HARD_RULES, SOFT_RULES } = qualifyRules;
const { jaccard, shingles, longestCommonRun, cosine, surfaceSimilarity } = qualifySimilarity;

/** A clean-passing baseline context (loose — the evaluators read fields defensively). */
function baseContext(overrides: Record<string, unknown> = {}) {
  return {
    candidateRevision: 1,
    postType: "review",
    authorType: "editorial",
    body: "A synthesis of the sourced claims in fresh wording, structured with headings and analysis.",
    title: "A careful look at the tool landscape",
    presentFields: { review: ["tool", "verdict"] },
    categoryConfidences: [{ categoryId: "ai-technology", confidence: 0.9 }],
    categoryOverride: false,
    quotes: [],
    claimRefs: [{ assertionText: "The tool shipped v2.", sourceClaimIds: ["c1"], exactValidation: { numbers: "pass" } }],
    sources: [
      { domain: "example.com", trustLevel: "approved" },
      { domain: "other.org", trustLevel: "approved" },
    ],
    semanticSimilarities: [0.1, 0.2],
    dupComparisons: [{ semantic: 0.3, jaccard: 0.2 }],
    surfaceComparisonTexts: ["Completely unrelated wording about another subject entirely."],
    prose: "A synthesis of the sourced claims in fresh wording.",
    aiDisclosed: true,
    generationRunRecorded: true,
    hasEmbedding: true,
    safetyClassification: { available: true, unsafe: false },
    ...overrides,
  } as any;
}

const seededThresholds: Record<string, Record<string, unknown>> = {
  "H-QUOTE": { "rulebook.hquote.maxQuoteWords": 40, "rulebook.hquote.maxQuotesPerPost": 5, "rulebook.hquote.maxQuotedBodyPct": 20 },
  "H-SIM-semantic": { "rulebook.hsim.semanticCosine": 0.28 },
  "H-DUP": { "rulebook.hdup.threshold": 0.85 },
  "H-CAT": { "rulebook.hcat.confidence": 0.6 },
  "H-TYPE": { requiredFieldsByType: { review: ["tool", "verdict"], news: ["source"] } },
};

const thresholdsFor = (ruleKey: string) => seededThresholds[ruleKey] ?? {};

// ── SECTION 1 — checkpoint: spine + five heavy evaluators ─────────────────

describe("SLICE-P4-07 §1 — schema (bible l.149/155/157/159)", () => {
  it("contentCandidates: 8-literal status enum + evaluation snapshot + CAP-044 rejectionReason", () => {
    const t = schema.tables.contentCandidates;
    const f = t.validator.fields;
    const statusLiterals = f.status.members.map((m: any) => m.value).sort();
    expect(statusLiterals).toEqual(
      ["approved", "drafting", "extracting", "published", "rejected", "review", "scheduled", "submitted"].sort(),
    );
    expect(f.rejectionReason.isOptional).toBe("optional");
    expect(f.evaluation.isOptional).toBe("optional");
  });

  it("contentEmbeddings: vector index by_embedding with categoryId filter + model-bound dims", () => {
    const t = schema.tables.contentEmbeddings;
    const f = t.validator.fields;
    expect(f.refType.members.map((m: any) => m.value).sort()).toEqual(["contentCandidate", "post", "sourceClaim"].sort());
    expect(f.embeddingModel.isOptional).not.toBe("optional");
    expect(f.embeddingVersion.isOptional).not.toBe("optional");
    expect(t.searchIndexes ?? []).toBeDefined(); // vector index present (descriptor name varies by runtime)
  });

  it("similarityChecks: 5-literal checkType + evidence fields (matchedText?)", () => {
    const t = schema.tables.similarityChecks;
    const f = t.validator.fields;
    expect(f.checkType.members.map((m: any) => m.value).sort()).toEqual(
      ["crosspost_jaccard", "crosspost_vector", "source_jaccard", "source_lcs", "source_ngram"].sort(),
    );
    expect(f.matchedText.isOptional).toBe("optional");
    expect(f.contentCandidateId.tableName).toBe("contentCandidates");
  });

  it("draftClaimRefs: anti-hallucination audit row (operatorConfirmed = CAP-542 gate)", () => {
    const t = schema.tables.draftClaimRefs;
    const f = t.validator.fields;
    expect(f.operatorConfirmed.kind).toBe("boolean");
    expect(f.sourceClaimIds.kind).toBe("array");
    expect((t.indexes ?? []).map((i: any) => i.indexDescriptor)).toContain("by_candidate");
  });

  it("qualificationRuns.contentCandidateId tightened to v.id (P4-06 string → P4-07 id)", () => {
    const f = schema.tables.qualificationRuns.validator.fields;
    expect(f.contentCandidateId.kind).toBe("id");
    expect(f.contentCandidateId.tableName).toBe("contentCandidates");
  });
});

describe("SLICE-P4-07 §1 — similarity math (pure)", () => {
  it("shingles: 5-word sliding window", () => {
    const s = shingles("one two three four five six");
    expect(s.size).toBe(2); // [1-5], [2-6]
  });

  it("jaccard: identical → 1, disjoint → 0, overlap fractional", () => {
    const a = new Set(["a b c d e", "f g h i j"]);
    expect(jaccard(a, new Set(a))).toBe(1);
    expect(jaccard(a, new Set(["x y z w v"]))).toBe(0);
    expect(jaccard(a, new Set(["a b c d e", "q r s t u"]))).toBeCloseTo(1 / 3);
  });

  it("longestCommonRun finds contiguous shared word sequences", () => {
    expect(longestCommonRun("the quick brown fox jumps", "a quick brown fox leaps")).toBe(3);
    expect(longestCommonRun("nothing shared here", "totally different words")).toBe(0);
  });

  it("cosine: parallel → 1, orthogonal → 0", () => {
    expect(cosine([1, 0], [2, 0])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("surfaceSimilarity: per-paragraph + whole-doc maxima", () => {
    const copy = "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu";
    const doc = `Intro paragraph entirely original.\n\n${copy}\n\nClosing remarks also original.`;
    const r = surfaceSimilarity(doc, [copy]);
    expect(r.maxCommonRun).toBeGreaterThanOrEqual(12); // the copied paragraph matches fully
  });
});

describe("SLICE-P4-07 §1 — the five heavy evaluators", () => {
  it("H-QUOTE: within caps passes; over word-cap fails with re-entry evidence", () => {
    const longBody = "word ".repeat(200); // room for the quote under the 20% body cap
    const pass = HARD_RULES["H-QUOTE"](baseContext({ body: longBody, quotes: [{ words: 30, exactMatch: true, attributed: true }] }), thresholdsFor("H-QUOTE"));
    expect(pass.result).toBe("pass");
    const fail = HARD_RULES["H-QUOTE"](baseContext({ body: longBody, quotes: [{ words: 41, exactMatch: true, attributed: true }] }), thresholdsFor("H-QUOTE"));
    expect(fail.result).toBe("fail");
    expect(fail.failureCode).toBe("H-QUOTE/quote_too_long");
    expect(fail.evidence).toContain("re-enters H-SIM");
  });

  it("H-QUOTE: non-exact or unattributed quotes are not exempt (verification gate)", () => {
    expect(HARD_RULES["H-QUOTE"](baseContext({ quotes: [{ words: 5, exactMatch: false, attributed: true }] }), thresholdsFor("H-QUOTE")).failureCode).toBe("H-QUOTE/not_exact");
    expect(HARD_RULES["H-QUOTE"](baseContext({ quotes: [{ words: 5, exactMatch: true, attributed: false }] }), thresholdsFor("H-QUOTE")).failureCode).toBe("H-QUOTE/unattributed");
  });

  it("H-QUOTE: body-percentage cap", () => {
    // 30-word body, 10-word quote = 33% > 20%
    const fail = HARD_RULES["H-QUOTE"](
      baseContext({ body: "word ".repeat(30), quotes: [{ words: 10, exactMatch: true, attributed: true }] }),
      thresholdsFor("H-QUOTE"),
    );
    expect(fail.failureCode).toBe("H-QUOTE/body_pct_exceeded");
  });

  it("H-SIM-semantic: cosine ≥ threshold fails; < passes; missing embedding fails closed", () => {
    expect(HARD_RULES["H-SIM-semantic"](baseContext({ semanticSimilarities: [0.31] }), thresholdsFor("H-SIM-semantic")).result).toBe("fail");
    expect(HARD_RULES["H-SIM-semantic"](baseContext({ semanticSimilarities: [0.27] }), thresholdsFor("H-SIM-semantic")).result).toBe("pass");
    const noEmb = HARD_RULES["H-SIM-semantic"](baseContext({ hasEmbedding: false }), thresholdsFor("H-SIM-semantic"));
    expect(noEmb.result).toBe("fail");
    expect(noEmb.failureCode).toBe("H-SIM/embedding_missing");
  });

  it("H-DUP: either layer over threshold fails (semantic OR surface)", () => {
    expect(HARD_RULES["H-DUP"](baseContext({ dupComparisons: [{ semantic: 0.9, jaccard: 0.1 }] }), thresholdsFor("H-DUP")).failureCode).toBe("H-DUP/semantic");
    expect(HARD_RULES["H-DUP"](baseContext({ dupComparisons: [{ semantic: 0.1, jaccard: 0.9 }] }), thresholdsFor("H-DUP")).failureCode).toBe("H-DUP/surface");
    expect(HARD_RULES["H-DUP"](baseContext({ dupComparisons: [{ semantic: 0.1, jaccard: 0.2 }] }), thresholdsFor("H-DUP")).result).toBe("pass");
  });

  it("H-CAT: no category above threshold AND no override → fail; override or confidence passes", () => {
    expect(HARD_RULES["H-CAT"](baseContext({ categoryConfidences: [{ categoryId: "c", confidence: 0.5 }] }), thresholdsFor("H-CAT")).failureCode).toBe("H-CAT/no_confident_category");
    expect(HARD_RULES["H-CAT"](baseContext({ categoryConfidences: [], categoryOverride: true }), thresholdsFor("H-CAT")).result).toBe("pass");
    expect(HARD_RULES["H-CAT"](baseContext(), thresholdsFor("H-CAT")).result).toBe("pass");
  });

  it("H-TYPE: per-type structural contract (E2) — missing required fields fail", () => {
    expect(HARD_RULES["H-TYPE"](baseContext({ presentFields: { review: ["tool"] } }), thresholdsFor("H-TYPE")).failureCode).toBe("H-TYPE/missing_required_fields");
    expect(HARD_RULES["H-TYPE"](baseContext({ postType: "news", presentFields: { news: [] } }), thresholdsFor("H-TYPE")).failureCode).toBe("H-TYPE/missing_required_fields");
    expect(HARD_RULES["H-TYPE"](baseContext(), thresholdsFor("H-TYPE")).result).toBe("pass");
    expect(HARD_RULES["H-TYPE"](baseContext({ postType: undefined }), thresholdsFor("H-TYPE")).failureCode).toBe("H-TYPE/no_post_type");
  });
});

describe("SLICE-P4-07 §1 — orchestrator surface (spine)", () => {
  it("run/persistRun/loadContext/replay exported with the right visibility", () => {
    expect((orchestrator.run as any).isAction).toBe(true);
    expect((orchestrator.run as any).isInternal).toBe(true);
    expect((orchestrator.persistRun as any).isMutation).toBe(true);
    expect((orchestrator.persistRun as any).isInternal).toBe(true);
    expect((orchestrator.loadContext as any).isQuery).toBe(true);
    expect((orchestrator.replay as any).isAction).toBe(true);
    expect((orchestrator.loadCalibrationSet as any).isQuery).toBe(true);
  });

  it("immutability by construction: no update/delete/patch path on runs/results (CAP-083)", () => {
    const exported = Object.keys(orchestrator);
    for (const required of ["loadCalibrationSet", "loadContext", "persistRun", "replay", "run"]) {
      expect(exported).toContain(required);
    }
    expect(exported.filter((k) => /update|delete|patch|clear/i.test(k))).toEqual([]);
  });

  it("persistRun args carry the source split: live flag → source discriminator", () => {
    const args = JSON.parse((orchestrator.persistRun as any).exportArgs()).value;
    expect(args.live.fieldType.type).toBe("boolean");
    expect(args.results.fieldType.type).toBe("array");
    const runFields = args.run.fieldType.value;
    expect(runFields.overallResult.fieldType.value.map((m: any) => m.value).sort()).toEqual(["fail", "pass"]);
    expect(runFields.contentCandidateId.fieldType.type).toBe("string");
  });

  it("api.d.ts maps the qualify modules", () => {
    const apiDts = readFileSync(resolve(__dirname, "../../../../../../convex/_generated/api.d.ts"), "utf8");
    expect(apiDts).toContain('"qualify/orchestrator": typeof qualify_orchestrator');
    expect(apiDts).toContain('"qualify/rules": typeof qualify_rules');
  });
});

// ── SECTION 2 — thin-eight + soft-five + replay wiring ────────────────────

describe("SLICE-P4-07 §2 — the thin-eight hard checks", () => {
  it("H-SRC: blocked/takedown source fails; clean sources pass", () => {
    expect(HARD_RULES["H-SRC"](baseContext({ sources: [{ domain: "bad.io", trustLevel: "blocked" }] }), {}).failureCode).toBe("H-SRC/blocked_source");
    expect(HARD_RULES["H-SRC"](baseContext(), {}).result).toBe("pass");
  });

  it("H-SUF: <2 independent domains fails; single first-party + ack passes", () => {
    expect(HARD_RULES["H-SUF"](baseContext({ sources: [{ domain: "one.com", trustLevel: "approved" }] }), {}).failureCode).toBe("H-SUF/insufficient_sources");
    expect(
      HARD_RULES["H-SUF"](baseContext({ sources: [{ domain: "one.com", trustLevel: "approved", firstPartyAcknowledged: true }] }), {}).result,
    ).toBe("pass");
  });

  it("H-TRACE: uncited assertion fails; failed exact-validation fails", () => {
    expect(HARD_RULES["H-TRACE"](baseContext({ claimRefs: [{ assertionText: "Uncited fact.", sourceClaimIds: [] }] }), {}).failureCode).toBe("H-TRACE/uncited_assertion");
    expect(
      HARD_RULES["H-TRACE"](baseContext({ claimRefs: [{ assertionText: "Wrong number.", sourceClaimIds: ["c1"], exactValidation: { numbers: "fail" } }] }), {}).failureCode,
    ).toBe("H-TRACE/exact_validation_failed");
    expect(HARD_RULES["H-TRACE"](baseContext(), {}).result).toBe("pass");
  });

  it("H-SIM-surface: copied run over the cap fails (calibration-pending constants)", () => {
    // Identical text trips the jaccard cap first…
    const copy = Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ");
    expect(HARD_RULES["H-SIM-surface"](baseContext({ body: copy, surfaceComparisonTexts: [copy] }), {}).failureCode).toBe("H-SIM/surface_jaccard");
    // …while a 25-word verbatim run inside mostly-original text trips the
    // n-gram-run cap with jaccard still under 0.5.
    const copiedBlock = Array.from({ length: 25 }, (_, i) => `corpus${i}`).join(" ");
    const novelTail = Array.from({ length: 60 }, (_, i) => `original${i}`).join(" ");
    const fail = HARD_RULES["H-SIM-surface"](baseContext({
      body: `${copiedBlock} ${novelTail}`,
      surfaceComparisonTexts: [copiedBlock],
    }), {});
    expect(fail.failureCode).toBe("H-SIM/surface_ngram_run");
    expect(HARD_RULES["H-SIM-surface"](baseContext(), {}).result).toBe("pass");
  });

  it("H-SAFE: unavailable classifier fail-closed-holds (DEV-HANDOFF #7); safe passes; unsafe fails", () => {
    expect(HARD_RULES["H-SAFE"](baseContext({ safetyClassification: undefined }), {}).failureCode).toBe("H-SAFE/classifier_unavailable");
    expect(HARD_RULES["H-SAFE"](baseContext({ safetyClassification: { available: false } }), {}).result).toBe("fail");
    expect(HARD_RULES["H-SAFE"](baseContext({ safetyClassification: { available: true, unsafe: true } }), {}).failureCode).toBe("H-SAFE/unsafe_content");
    expect(HARD_RULES["H-SAFE"](baseContext(), {}).result).toBe("pass");
  });

  it("H-DISC: missing disclosure or generation run fails", () => {
    expect(HARD_RULES["H-DISC"](baseContext({ aiDisclosed: false }), {}).failureCode).toBe("H-DISC/disclosure_missing");
    expect(HARD_RULES["H-DISC"](baseContext({ generationRunRecorded: false }), {}).result).toBe("fail");
    expect(HARD_RULES["H-DISC"](baseContext(), {}).result).toBe("pass");
  });

  it("H-AFF: URL-like text in prose fails; structured CTA prose passes", () => {
    expect(HARD_RULES["H-AFF"](baseContext({ prose: "buy at https://partner.io/deal" }), {}).failureCode).toBe("H-AFF/url_in_prose");
    expect(HARD_RULES["H-AFF"](baseContext({ prose: "see the deal module below" }), {}).result).toBe("pass");
  });

  it("H-EXP: first-person experience by non-user author fails; user author exempt", () => {
    expect(HARD_RULES["H-EXP"](baseContext({ prose: "I used the tool for a month" }), {}).failureCode).toBe("H-EXP/fabricated_experience");
    expect(HARD_RULES["H-EXP"](baseContext({ authorType: "user", prose: "I used the tool for a month" }), {}).result).toBe("pass");
    expect(HARD_RULES["H-EXP"](baseContext({ prose: "The tool supports batch exports" }), {}).result).toBe("pass");
  });
});

describe("SLICE-P4-07 §2 — the soft five (advisory, never gate)", () => {
  it("S-SEO: checklist scoring bounded 0–5", async () => {
    const good = await SOFT_RULES["S-SEO"](baseContext({ body: "# Heading\n\n" + "rich body text ".repeat(60) }), {});
    expect(good.score).toBeGreaterThan(2);
    const bare = await SOFT_RULES["S-SEO"](baseContext({ title: "x", body: "short" }), {});
    expect(bare.score).toBeLessThanOrEqual(2);
    expect(bare.result).toBe("flag"); // advisory shape, never pass/fail
  });

  it("S-READ: Flesch → 0–5 integer score", async () => {
    const simple = await SOFT_RULES["S-READ"](baseContext({ body: "The cat sat on the mat. The dog ran fast." }), {});
    expect(simple.score).toBeGreaterThanOrEqual(2);
    expect(Number.isInteger(simple.score)).toBe(true);
  });

  it("S-AFF: entity-match advisory without GLM", async () => {
    const out = await SOFT_RULES["S-AFF"](baseContext({ presentFields: { affiliateFits: ["ToolA", "ToolB"] } }), {});
    expect(out.score).toBe(2);
    expect(out.result).toBe("flag");
  });

  it("S-DISC/S-VAL: no GLM seam → dependency error (fail-closed, never fabricated)", async () => {
    await expect(SOFT_RULES["S-DISC"](baseContext(), {})).rejects.toThrow(/fail-closed/);
    await expect(SOFT_RULES["S-VAL"](baseContext(), {})).rejects.toThrow(/fail-closed/);
  });
});

describe("SLICE-P4-07 §2 — evaluator registry completeness (orphan disposition)", () => {
  it("all 13 hard rules registered (CAP-065–077)", () => {
    expect(Object.keys(HARD_RULES).sort()).toEqual(
      ["H-AFF", "H-CAT", "H-DISC", "H-DUP", "H-EXP", "H-QUOTE", "H-SAFE", "H-SIM-semantic", "H-SIM-surface", "H-SRC", "H-SUF", "H-TRACE", "H-TYPE"].sort(),
    );
  });

  it("all 5 soft scores registered (CAP-078–082)", () => {
    expect(Object.keys(SOFT_RULES).sort()).toEqual(["S-AFF", "S-DISC", "S-READ", "S-SEO", "S-VAL"].sort());
  });

  it("rulebook.calibrate/triggerCalibrate rewired to the replay (P4-06 stub retired)", () => {
    expect((rulebookModule.calibrate as any).isAction).toBe(true);
    expect((rulebookModule.triggerCalibrate as any).isAction).toBe(true);
    expect((rulebookModule.triggerCalibrate as any).isPublic).toBe(true);
  });
});
