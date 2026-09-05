/**
 * rules — SLICE-P4-07: the typed M3 evaluator registry (pure).
 *
 * Every hard rule (CAP-065–077) and every soft score (CAP-078–082) is a
 * PURE function: (context, thresholds, deps?) → RuleOutcome. External
 * dependencies (H-SAFE's moderation classifier; S-DISC/S-VAL's GLM) enter
 * via an injected `deps` seam so the whole rule set is unit-testable and
 * the Convex action layer stays thin.
 *
 * INV-1 (M3): the LLM never decides a hard gate — hard rules are
 * deterministic code; GLM appears only in soft scores. INV-3: soft scores
 * never gate. Short-circuit/evaluator ordering is the orchestrator's.
 *
 * Threshold keys read from qualificationRules.thresholdConfig (P4-06's
 * seeded rows); rules without a seeded row (the eight thin hard checks)
 * are pure-code checks with no thresholds — the orchestrator runs them
 * default-enabled (flagged in-slice: "only enabled rules run" presumes a
 * row; absent rows can only mean default-on or never-run, and never-run
 * would void the orphan disposition).
 */

import { surfaceSimilarity } from "./similarity";

// ── types ─────────────────────────────────────────────────────────────────

export interface SourceRef {
  domain: string;
  trustLevel: string; // approved | blocked | conditional (bible l.147)
  firstPartyAcknowledged?: boolean;
}

export interface QuoteRef {
  words: number;
  exactMatch: boolean;
  attributed: boolean;
}

export interface ClaimRefInput {
  assertionText: string;
  sourceClaimIds: string[];
  exactValidation?: Record<string, "pass" | "fail">;
}

export interface CandidateContext {
  candidateRevision: number;
  postType?: string;
  authorType: "editorial" | "persona" | "user";
  body: string;
  title?: string;
  /** Present extension fields for H-TYPE (per-type present-field list). */
  presentFields: Record<string, string[]>;
  categoryConfidences: { categoryId: string; confidence: number }[];
  categoryOverride: boolean; // operator category override (H-CAT escape)
  quotes: QuoteRef[];
  claimRefs: ClaimRefInput[];
  sources: SourceRef[];
  /** semantic cosine similarities vs published posts (vectorSearch results). */
  semanticSimilarities: number[];
  /** H-DUP inputs vs recent-window posts. */
  dupComparisons: { semantic: number; jaccard: number }[];
  /** surface-comparison texts for H-SIM (sourceQuotes + recent posts). */
  surfaceComparisonTexts: string[];
  /** prose-only body for H-AFF/H-EXP scans (quotes may be exempted by the loader). */
  prose: string;
  aiDisclosed: boolean;
  generationRunRecorded: boolean;
  /** The candidate's own embedding exists (H-SIM-semantic dependency). */
  hasEmbedding: boolean;
  /** H-SAFE classifier result (the orchestrator's async seam, injected as
   *  context so the evaluator stays pure). Absent = unavailable = fail-closed. */
  safetyClassification?: { available: boolean; unsafe?: boolean };
}

export interface RuleOutcome {
  result: "pass" | "fail" | "flag";
  score?: number; // soft scores 0–5
  threshold?: number;
  evidence: string;
  failureCode?: string;
}

export interface RuleDeps {
  /** H-SAFE's dedicated moderation classifier (NOT GLM — M3 §8). */
  classifySafety?: (text: string) => Promise<{ available: boolean; unsafe?: boolean }>;
  /** S-DISC/S-VAL GLM scoring seam. */
  glmScore?: (ruleKey: string, prompt: string) => Promise<{ score: number; evidence: string }>;
}

export type HardEvaluator = (ctx: CandidateContext, thresholds: Record<string, unknown>) => RuleOutcome;
export type SoftEvaluator = (ctx: CandidateContext, deps: RuleDeps) => Promise<RuleOutcome>;

const num = (thresholds: Record<string, unknown>, key: string, fallback: number): number =>
  typeof thresholds[key] === "number" ? (thresholds[key] as number) : fallback;

// ── the five heavy hard evaluators ────────────────────────────────────────

/** CAP-068 — H-QUOTE: per-quote ≤ maxQuoteWords; ≤ maxQuotesPerPost; total
 *  ≤ maxQuotedBodyPct; exact-span equality + attribution present. Exceeding
 *  any cap or failing verification → NOT exempt; re-enters H-SIM as
 *  ordinary text (the loader includes unexempt quotes in the surface
 *  comparison corpus) and this rule fails. */
export const H_QUOTE: HardEvaluator = (ctx, t) => {
  const maxWords = num(t, "rulebook.hquote.maxQuoteWords", 40);
  const maxQuotes = num(t, "rulebook.hquote.maxQuotesPerPost", 5);
  const maxPct = num(t, "rulebook.hquote.maxQuotedBodyPct", 20);
  const bodyWords = ctx.body.trim() ? ctx.body.trim().split(/\s+/).length : 0;
  const totalQuoteWords = ctx.quotes.reduce((acc, q) => acc + q.words, 0);
  const pct = bodyWords === 0 ? 0 : (totalQuoteWords / bodyWords) * 100;

  for (const [i, q] of ctx.quotes.entries()) {
    if (!q.exactMatch) {
      return { result: "fail", threshold: maxWords, evidence: `quote #${i + 1}: not an exact evidence span`, failureCode: "H-QUOTE/not_exact" };
    }
    if (!q.attributed) {
      return { result: "fail", threshold: maxWords, evidence: `quote #${i + 1}: attribution missing`, failureCode: "H-QUOTE/unattributed" };
    }
    if (q.words > maxWords) {
      return { result: "fail", threshold: maxWords, evidence: `quote #${i + 1}: ${q.words} words > cap ${maxWords} — re-enters H-SIM`, failureCode: "H-QUOTE/quote_too_long" };
    }
  }
  if (ctx.quotes.length > maxQuotes) {
    return { result: "fail", threshold: maxQuotes, evidence: `${ctx.quotes.length} quotes > cap ${maxQuotes}`, failureCode: "H-QUOTE/too_many_quotes" };
  }
  if (pct > maxPct) {
    return { result: "fail", threshold: maxPct, evidence: `quoted body ${pct.toFixed(1)}% > cap ${maxPct}%`, failureCode: "H-QUOTE/body_pct_exceeded" };
  }
  return { result: "pass", evidence: `${ctx.quotes.length} quotes, ${totalQuoteWords} words (${pct.toFixed(1)}%) — within caps, all exact + attributed` };
};

/** CAP-070 — H-SIM semantic: cosine threshold vs published posts (same
 *  category). Thresholds from qualificationRules (register verbatim). */
export const H_SIM_SEMANTIC: HardEvaluator = (ctx, t) => {
  const threshold = num(t, "rulebook.hsim.semanticCosine", 0.28);
  if (!ctx.hasEmbedding) {
    return { result: "fail", threshold, evidence: "no contentEmbeddings row for candidate — dependency missing (fail-closed)", failureCode: "H-SIM/embedding_missing" };
  }
  const worst = ctx.semanticSimilarities.length === 0 ? 0 : Math.max(...ctx.semanticSimilarities);
  if (worst >= threshold) {
    return { result: "fail", threshold, evidence: `max cosine ${worst.toFixed(3)} ≥ threshold ${threshold} vs published posts`, failureCode: "H-SIM/semantic_above_threshold" };
  }
  return { result: "pass", threshold, evidence: `max cosine ${worst.toFixed(3)} < ${threshold} across ${ctx.semanticSimilarities.length} comparisons` };
};

/** CAP-071 — H-DUP: cross-post duplicate — "Semantic + surface over dup
 *  threshold vs recent window." Either layer breaching fails the rule. */
export const H_DUP: HardEvaluator = (ctx, t) => {
  const threshold = num(t, "rulebook.hdup.threshold", 0.85);
  for (const [i, c] of ctx.dupComparisons.entries()) {
    if (c.semantic >= threshold) {
      return { result: "fail", threshold, evidence: `recent post #${i + 1}: semantic ${c.semantic.toFixed(3)} ≥ ${threshold}`, failureCode: "H-DUP/semantic" };
    }
    if (c.jaccard >= threshold) {
      return { result: "fail", threshold, evidence: `recent post #${i + 1}: surface jaccard ${c.jaccard.toFixed(3)} ≥ ${threshold}`, failureCode: "H-DUP/surface" };
    }
  }
  return { result: "pass", threshold, evidence: `${ctx.dupComparisons.length} recent-window comparisons under ${threshold} on both layers` };
};

/** CAP-072 — H-CAT: "No locked category (of 5) above confidence threshold
 *  AND no operator override" → fail. The override is editorial-side input. */
export const H_CAT: HardEvaluator = (ctx, t) => {
  const threshold = num(t, "rulebook.hcat.confidence", 0.6);
  const above = ctx.categoryConfidences.filter((c) => c.confidence > threshold);
  if (above.length === 0 && !ctx.categoryOverride) {
    return {
      result: "fail", threshold,
      evidence: `no locked category above ${threshold} (best: ${ctx.categoryConfidences.length ? Math.max(...ctx.categoryConfidences.map((c) => c.confidence)).toFixed(2) : "n/a"}) and no operator override`,
      failureCode: "H-CAT/no_confident_category",
    };
  }
  return { result: "pass", threshold, evidence: ctx.categoryOverride ? "operator category override active" : `${above.length} categor(ies) above ${threshold}` };
};

/** CAP-074 — H-TYPE: structural per-type required-field contract (E2). The
 *  thresholdConfig carries requiredFieldsByType (P4-06's H_TYPE_DEFAULT). */
export const H_TYPE: HardEvaluator = (ctx, t) => {
  const mapping = (t.requiredFieldsByType ?? {}) as Record<string, string[]>;
  if (!ctx.postType) {
    return { result: "fail", evidence: "candidate has no postType", failureCode: "H-TYPE/no_post_type" };
  }
  const required = mapping[ctx.postType];
  if (!required) {
    return { result: "fail", evidence: `no H-TYPE contract entry for type "${ctx.postType}" (8 active types mapped)`, failureCode: "H-TYPE/type_unmapped" };
  }
  const present = ctx.presentFields[ctx.postType] ?? [];
  const missing = required.filter((f) => !present.includes(f));
  if (missing.length > 0) {
    return { result: "fail", evidence: `type ${ctx.postType}: missing required fields [${missing.join(", ")}]`, failureCode: "H-TYPE/missing_required_fields" };
  }
  return { result: "pass", evidence: `type ${ctx.postType}: all required fields present [${required.join(", ")}]` };
};

// ── the thin-eight hard evaluators ────────────────────────────────────────

/** CAP-065 — H-SRC: blocked/unauthorized source (trustLevel=blocked or
 *  active takedown — the loader folds legalIntake takedowns into
 *  trustLevel=blocked entries). */
export const H_SRC: HardEvaluator = (ctx) => {
  const blocked = ctx.sources.filter((s) => s.trustLevel === "blocked");
  if (blocked.length > 0) {
    return { result: "fail", evidence: `blocked/takedown sources: ${blocked.map((s) => s.domain).join(", ")}`, failureCode: "H-SRC/blocked_source" };
  }
  return { result: "pass", evidence: `${ctx.sources.length} linked sources, none blocked` };
};

/** CAP-066 — H-SUF: < 2 INDEPENDENT domains (syndication-collapsed) unless
 *  first-party + operator ack. */
export const H_SUF: HardEvaluator = (ctx) => {
  const domains = new Set(ctx.sources.map((s) => s.domain));
  if (domains.size >= 2) {
    return { result: "pass", evidence: `${domains.size} independent domains` };
  }
  const firstPartyAcked = ctx.sources.some((s) => s.firstPartyAcknowledged === true);
  if (domains.size === 1 && firstPartyAcked) {
    return { result: "pass", evidence: "single first-party source with operator ack" };
  }
  return { result: "fail", evidence: `${domains.size} independent domain(s) < 2, no first-party ack`, failureCode: "H-SUF/insufficient_sources" };
};

/** CAP-067 — H-TRACE: every factual assertion cites ≥1 sourceClaim AND
 *  exact-validation (numbers/dates/quotes/entities) passes. Vector search
 *  is RETRIEVAL, not proof. */
export const H_TRACE: HardEvaluator = (ctx) => {
  for (const [i, ref] of ctx.claimRefs.entries()) {
    if (ref.sourceClaimIds.length === 0) {
      return { result: "fail", evidence: `assertion #${i + 1} cites no sourceClaim: "${ref.assertionText.slice(0, 80)}"`, failureCode: "H-TRACE/uncited_assertion" };
    }
    const failed = Object.entries(ref.exactValidation ?? {}).filter(([, v]) => v === "fail");
    if (failed.length > 0) {
      return { result: "fail", evidence: `assertion #${i + 1} exact-validation failed on [${failed.map(([k]) => k).join(", ")}]`, failureCode: "H-TRACE/exact_validation_failed" };
    }
  }
  return { result: "pass", evidence: `${ctx.claimRefs.length} assertions all cited + exact-validated` };
};

/** CAP-069 — H-SIM surface: n-gram/shingle Jaccard + LCS vs each
 *  sourceClaim.sourceQuote + recent published posts (per-paragraph +
 *  whole-doc). Quotes exempted by H-QUOTE re-enter here (the loader keeps
 *  unexempt spans in the corpus). Surface caps are evaluator constants —
 *  the register E1-stamped only the five consolidated numeric rows, so
 *  these are calibration-pending constants (DECISIONS-LOCKED #11 ethos),
 *  flagged for the first ~100 calibration pass. */
export const H_SIM_SURFACE: HardEvaluator = (ctx) => {
  const JACCARD_FAIL = 0.5;
  const MIN_RUN_FAIL = 25; // consecutive-word exact run that close to proves copying
  const { maxJaccard, maxCommonRun } = surfaceSimilarity(ctx.body, ctx.surfaceComparisonTexts);
  if (maxJaccard >= JACCARD_FAIL) {
    return { result: "fail", threshold: JACCARD_FAIL, evidence: `surface jaccard ${maxJaccard.toFixed(3)} ≥ ${JACCARD_FAIL}`, failureCode: "H-SIM/surface_jaccard" };
  }
  if (maxCommonRun >= MIN_RUN_FAIL) {
    return { result: "fail", threshold: MIN_RUN_FAIL, evidence: `exact run of ${maxCommonRun} consecutive words ≥ ${MIN_RUN_FAIL}`, failureCode: "H-SIM/surface_ngram_run" };
  }
  return { result: "pass", threshold: JACCARD_FAIL, evidence: `max jaccard ${maxJaccard.toFixed(3)}, max run ${maxCommonRun} — under surface caps` };
};

/** CAP-073 — H-SAFE: dedicated moderation classifier (NOT GLM). Classifier
 *  result enters as context (the orchestrator's async seam); absent or
 *  unavailable → FAIL (fail-closed hold per M3 §8: "unavailable → hold") —
 *  the pipeline blocks all content until the seam is wired (DEV-HANDOFF #7). */
export const H_SAFE: HardEvaluator = (ctx) => {
  const c = ctx.safetyClassification;
  if (!c || !c.available) {
    return { result: "fail", evidence: "moderation classifier unavailable — fail-closed hold (M3 §8; DEV-HANDOFF #7)", failureCode: "H-SAFE/classifier_unavailable" };
  }
  if (c.unsafe) {
    return { result: "fail", evidence: "moderation classifier flagged content unsafe", failureCode: "H-SAFE/unsafe_content" };
  }
  return { result: "pass", evidence: "moderation classifier: safe" };
};

/** CAP-075 — H-DISC: AI-disclosure/provenance present (byline/label +
 *  generationRuns recorded). */
export const H_DISC: HardEvaluator = (ctx) => {
  if (!ctx.aiDisclosed || !ctx.generationRunRecorded) {
    return { result: "fail", evidence: `aiDisclosed=${ctx.aiDisclosed}, generationRunRecorded=${ctx.generationRunRecorded}`, failureCode: "H-DISC/disclosure_missing" };
  }
  return { result: "pass", evidence: "byline/label + generationRuns recorded" };
};

/** CAP-076 — H-AFF: no affiliate URL in prose (structured CTA only). */
export const H_AFF: HardEvaluator = (ctx) => {
  const urlLike = /https?:\/\/|www\.|\b[a-z0-9-]+(\.[a-z0-9-]+)+\b/i;
  if (urlLike.test(ctx.prose)) {
    return { result: "fail", evidence: "URL-like text in prose — affiliate links must be structured CTAs (CAP-049)", failureCode: "H-AFF/url_in_prose" };
  }
  return { result: "pass", evidence: "no URLs in prose" };
};

/** CAP-077 — H-EXP: persona-experience fabrication — first-person
 *  experience patterns by a non-user author ⇒ fail/flag for review. */
export const H_EXP: HardEvaluator = (ctx) => {
  if (ctx.authorType === "user") {
    return { result: "pass", evidence: "user-authored — first-person experience is genuine" };
  }
  const pattern = /\b(i|we)\s+(used|tried|tested|bought|switched to|have been using)\b/i;
  if (pattern.test(ctx.prose)) {
    return { result: "fail", evidence: `first-person experience claim by ${ctx.authorType} author — fabrication risk`, failureCode: "H-EXP/fabricated_experience" };
  }
  return { result: "pass", evidence: `no first-person experience patterns (${ctx.authorType} author)` };
};

// ── the soft scores (advisory ONLY — never gate, INV-3) ──────────────────

/** CAP-080 — S-SEO: deterministic checklist (title/meta length, keyword
 *  placement, headings, internal-link suggestion present). Score 0–5. */
export const S_SEO: SoftEvaluator = async (ctx) => {
  let score = 0;
  const checks: string[] = [];
  const title = ctx.title ?? "";
  if (title.length >= 20 && title.length <= 70) { score++; checks.push("title length"); }
  if (/\b[A-Za-z]{4,}\b.*\b[A-Za-z]{4,}\b/.test(title)) { score++; checks.push("keyword-bearing title"); }
  if (/^#{1,3}\s/m.test(ctx.body)) { score++; checks.push("headings present"); }
  if (ctx.body.length >= 300) { score++; checks.push("body depth"); }
  if (/\[\[internal:/i.test(ctx.body) || /\]\]\(/.test(ctx.body)) { score++; checks.push("link scaffolding"); }
  return { result: "flag", score, evidence: `SEO checklist: [${checks.join("; ") || "none passed"}]` };
};

/** CAP-081 — S-READ: Flesch reading-ease → 0–5 advisory score (pure). */
export const S_READ: SoftEvaluator = async (ctx) => {
  const sentences = ctx.body.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const tokens = ctx.body.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (sentences.length === 0 || tokens.length === 0) {
    return { result: "flag", score: 0, evidence: "no measurable text" };
  }
  const syllables = tokens.reduce((acc, w) => acc + Math.max(1, (w.match(/[aeiouy]+/g) ?? []).length), 0);
  const flesch = 206.835 - 1.015 * (tokens.length / sentences.length) - 84.6 * (syllables / tokens.length);
  const score = Math.max(0, Math.min(5, Math.round(flesch / 20)));
  return { result: "flag", score, evidence: `Flesch ${flesch.toFixed(1)} → advisory ${score}/5` };
};

/** CAP-082 — S-AFF: affiliate fit — entity name-match; only 3–5 eligible
 *  for placement; NEVER affects publication. Fit presence is context input
 *  (the loader supplies tool-name matches). */
export const S_AFF: SoftEvaluator = async (ctx, deps) => {
  const matches = (ctx.presentFields["affiliateFits"] ?? []) as string[];
  if (deps?.glmScore) {
    const glm = await deps.glmScore("S-AFF", ctx.title ?? "");
    return { result: "flag", ...glm };
  }
  return { result: "flag", score: matches.length, evidence: `${matches.length} name-matched entit(ies); placement eligibility 3–5 (M11 consumes)` };
};

/** CAP-078 / CAP-079 — S-DISC / S-VAL: GLM multi-dim scores. No seam
 *  configured → dependency error → the orchestrator fails the run closed
 *  (CAP-064); these never return a fabricated score. */
export const S_DISC: SoftEvaluator = async (ctx, deps) => {
  if (!deps?.glmScore) throw new Error("S-DISC: GLM seam unavailable (dependency error — fail-closed)");
  return { result: "flag", ...(await deps.glmScore("S-DISC", ctx.title ?? "")) };
};

export const S_VAL: SoftEvaluator = async (ctx, deps) => {
  if (!deps?.glmScore) throw new Error("S-VAL: GLM seam unavailable (dependency error — fail-closed)");
  return { result: "flag", ...(await deps.glmScore("S-VAL", ctx.title ?? "")) };
};

// ── the registry ──────────────────────────────────────────────────────────

/** Hard rules in evaluation order (cheap deterministic first; H-SAFE's
 *  classifier call is the orchestrator's short-circuit exception). */
export const HARD_RULES: Record<string, HardEvaluator> = {
  "H-SRC": H_SRC,
  "H-SUF": H_SUF,
  "H-TRACE": H_TRACE,
  "H-QUOTE": H_QUOTE,
  "H-SIM-surface": H_SIM_SURFACE,
  "H-SIM-semantic": H_SIM_SEMANTIC,
  "H-DUP": H_DUP,
  "H-CAT": H_CAT,
  "H-TYPE": H_TYPE,
  "H-SAFE": H_SAFE,
  "H-DISC": H_DISC,
  "H-AFF": H_AFF,
  "H-EXP": H_EXP,
};

/** Soft scores (advisory). */
export const SOFT_RULES: Record<string, SoftEvaluator> = {
  "S-DISC": S_DISC,
  "S-VAL": S_VAL,
  "S-SEO": S_SEO,
  "S-READ": S_READ,
  "S-AFF": S_AFF,
};
