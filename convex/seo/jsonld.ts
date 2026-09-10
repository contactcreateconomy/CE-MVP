/**
 * jsonld + sitemap + slugs — SLICE-P7G-02: CAP-471/472/473/474/475.
 *
 * CAP-471 / FATAL-M17-C1 (quoted, R-AGGREGATE-RATING): AggregateRating
 *   **only if** distinctHumanCommunityRaterCount ≥ 3 AND aggregates from
 *   M5 community fields only AND authorType=human. Personas / staff /
 *   editorial NEVER enter ratingValue/ratingCount. Else OMIT entirely
 *   (the page may still index). Visible copy states the EXACT count.
 * CAP-472 (quoted): FAQ/HowTo only with visible real Q&A (≥2 pairs) or
 *   Help accepted-answer steps.
 * CAP-473 (quoted): sitemap includes ONLY assertIndexable=true URLs;
 *   ISR 3600s.
 * CAP-474 (quoted): slug change appends previousSlugs; 301; admin audit
 *   if indexed ≥7d.
 * CAP-475 (quoted): substantive post-publish edit → flag / light re-run
 *   M3 similarity vs sources AND own corpus — never silently bypass
 *   anti-doorway/plagiarism.
 */

import { assertIndexable, type IndexableEntity } from "./assertIndexable";

export type CommunityRatings = {
  distinctHumanRaterCount: number; // M5 community only (human authors)
  ratingSum: number; // summed over those human raters only
};

/** FATAL-M17-C1 — the AggregateRating emission (pure). */
export function toolAggregateRating(ratings: CommunityRatings): {
  emit: boolean;
  ratingValue?: number;
  ratingCount?: number;
} {
  // n < 3 → OMIT (quoted AC: "communityRatingCount=2 humans → NO AggregateRating")
  if (ratings.distinctHumanRaterCount < 3) return { emit: false };
  // Aggregate from M5 community fields ONLY — the caller computes the sum
  // over human-rater rows; personas/staff/editorial never reach here
  // (structural: this function receives ONLY the human-community subset).
  const value = ratings.ratingSum / ratings.distinctHumanRaterCount;
  return {
    emit: true,
    ratingValue: Math.round(value * 10) / 10,
    ratingCount: ratings.distinctHumanRaterCount,
  };
}

/** The tool-page JSON-LD (Article/Product family per M17 §3 — only the
 *  sheet's types; none invented). */
export function toolJsonLd(input: {
  name: string;
  slug: string;
  description: string;
  communityRatings: CommunityRatings;
}): Record<string, unknown> {
  const agg = toolAggregateRating(input.communityRatings);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: `/tools/${input.slug}`,
  };
  if (agg.emit) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: agg.ratingValue,
      ratingCount: agg.ratingCount, // the EXACT count (visible copy mirrors it)
    };
  }
  return node;
}

/** CAP-472 — FAQ JSON-LD: only with visible real Q&A (≥2 pairs) or Help
 *  accepted-answer steps. The pairs come from the page's real content —
 *  a v1 pass over Help accepted answers. */
export function faqJsonLd(pairs: { question: string; answer: string }[]): Record<string, unknown> | null {
  if (pairs.length < 2) return null; // <2 visible pairs → omit entirely
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((p) => ({
      "@type": "Question",
      name: p.question,
      acceptedAnswer: { "@type": "Answer", text: p.answer },
    })),
  };
}

/** CAP-473 — the sitemap entry list: ONLY assertIndexable=true URLs. */
export function sitemapEntries(
  candidates: (IndexableEntity & { slug: string; kind: "post" | "tool" | "resource" })[],
): string[] {
  return candidates
    .filter((c) => assertIndexable(c).indexable)
    .map((c) => (c.kind === "post" ? `/discussions/${c.slug}` : c.kind === "tool" ? `/tools/${c.slug}` : `/resources/${c.slug}/view`));
}

/** CAP-474 — slug change: append previousSlugs (the 301 source list).
 *  Returns the audit event when the old slug was indexed ≥7d (admin
 *  audit required — the caller records it). */
export function slugChange(input: {
  previousSlugs: string[];
  oldSlug: string;
  newSlug: string;
  wasIndexed: boolean;
  firstIndexedAt?: number;
}): { nextPreviousSlugs: string[]; auditRequired: boolean } {
  const next = [...new Set([...input.previousSlugs, input.oldSlug])].filter((s) => s !== input.newSlug);
  const indexedDays = input.firstIndexedAt ? (Date.now() - input.firstIndexedAt) / 86_400_000 : 0;
  const auditRequired = input.wasIndexed && indexedDays >= 7; // (quoted)
  return { nextPreviousSlugs: next, auditRequired };
}

/** CAP-475 — post-publish edit triage (pure): substantive edits flag a
 *  light M3 similarity re-run (vs sources AND own corpus); cosmetic
 *  edits do not. The re-run itself is the P4-07 qualify evaluator — this
 *  is the flag the post-edit hook sets, never a bypass. */
export function editRequiresSimilarityRerun(input: {
  addedWords: number;
  removedWords: number;
  bodyChangedFraction: number;
}): boolean {
  const substantive = input.bodyChangedFraction >= 0.3 || input.addedWords >= 200 || input.removedWords >= 200;
  return substantive;
}
