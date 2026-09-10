/**
 * assertIndexable — SLICE-P7G-01: CAP-466/467/470/476/481/482 — THE
 * indexability evaluator (the only index flip; no admin override —
 * intentionally no CAP).
 *
 * CAP-466 Notes (quoted): "assertIndexable = published ∧ moderation=
 *   passed ∧ visibility=public ∧ not duplicate ∧ not doorway ∧ not thin
 *   ∧ HTTP 200 ∧ affiliate-survivable ∧ persona-density OK."
 * CAP-476 (quoted): "main content must remain useful if affiliate block
 *   removed; else noindex."
 * CAP-481 (quoted): "persona-heavy + zero community ratings → noindex."
 * CAP-482 (quoted): "tool/hub ≥150–300 words per surface rules; thin →
 *   noindex."
 * CAP-467 (quoted): false → "404/410 + noindex,nofollow; exclude sitemap;
 *   generic OG if URL hit." CAP-470 (quoted): non-published → 410 (was
 *   public) or 404 + noindex; never sitemap-absence alone.
 * FATAL-M17-01 pairing: indexable=true requires the CAP-468 provenance
 *   destinations to resolve (P7T-11's routes) — stays noindex until they
 *   do (fail-closed by constant; the routes exist as of P7T-10).
 */

export type IndexableEntity = {
  kind: "post" | "tool" | "resource";
  lifecycleStatus: string; // published/archived/draft...
  moderationStatus: string; // passed/not_required/held...
  visibility?: string; // posts: public/private/unlisted
  wordCount: number;
  isDuplicate?: boolean;
  isDoorway?: boolean;
  affiliateBlockFraction?: number; // 0..1 — main-content usefulness (CAP-476)
  personaDensity?: number; // 0..1 share of persona-authored content
  communityRatingCount?: number;
  wasEverPublic?: boolean; // CAP-470: 410 vs 404
};

/** The destination slugs FATAL-M17-01 requires (P7T-10's routes). */
export const PROVENANCE_DESTINATIONS = ["/how-we-review", "/editorial-policy", "/ai-disclosure"] as const;

/** Destinations resolve — flip ONLY when the provenance pages exist
 *  (P7T-10 created the routes; this stays the single kill-switch). */
export const PROVENANCE_DESTINATIONS_LIVE = true;

export type IndexableVerdict = {
  indexable: boolean;
  /** CAP-467/470 status mapping: 200 | 404 | 410 */
  httpStatus: 200 | 404 | 410;
  /** true → the URL deserves the generic OG card (CAP-477) */
  genericOg: boolean;
  reasons: string[];
};

const MIN_WORDS_TOOL_OR_HUB = 150; // CAP-482 band floor (150–300 per surface)
const MAX_AFFILIATE_FRACTION = 0.5; // >half affiliate = main content not useful alone
const PERSONA_HEAVY = 0.5; // majority persona-authored = persona-heavy

export function assertIndexable(entity: IndexableEntity): IndexableVerdict {
  const reasons: string[] = [];

  // 1. Published ∧ moderation=passed ∧ visibility=public (quoted)
  const published = entity.lifecycleStatus === "published";
  const passed = entity.moderationStatus === "passed" || entity.moderationStatus === "not_required";
  const visible = entity.visibility === undefined ? true : entity.visibility === "public";
  if (!published) reasons.push("not_published");
  if (!passed) reasons.push("moderation_not_passed");
  if (!visible) reasons.push("not_public_visibility");

  // 2. Not duplicate / not doorway (quoted)
  if (entity.isDuplicate) reasons.push("duplicate");
  if (entity.isDoorway) reasons.push("doorway");

  // 3. Not thin (CAP-482: tool/hub ≥150–300 words)
  const minWords = entity.kind === "post" ? 50 : MIN_WORDS_TOOL_OR_HUB;
  if (entity.wordCount < minWords) reasons.push("thin_content");

  // 4. Affiliate-survivable (CAP-476)
  if ((entity.affiliateBlockFraction ?? 0) > MAX_AFFILIATE_FRACTION) {
    reasons.push("affiliate_not_survivable");
  }

  // 5. Persona-density (CAP-481): persona-heavy + zero community ratings
  const personaHeavy = (entity.personaDensity ?? 0) >= PERSONA_HEAVY;
  if (personaHeavy && (entity.communityRatingCount ?? 0) === 0) {
    reasons.push("persona_heavy_no_community");
  }

  // 6. FATAL-M17-01: provenance destinations must resolve
  if (!PROVENANCE_DESTINATIONS_LIVE) reasons.push("provenance_destinations_missing");

  const indexable = reasons.length === 0;

  // CAP-467/470 status mapping (quoted): non-published that WAS public
  // → 410; everything else false → 404; both noindex,nofollow + generic OG
  let httpStatus: 200 | 404 | 410 = 200;
  if (!indexable) {
    httpStatus = !published && entity.wasEverPublic ? 410 : 404;
  }
  return { indexable, httpStatus, genericOg: !indexable, reasons };
}

/** The CAP-486 noindex family (quoted): "Profiles noindex · feed/search
 *  noindex · admin noindex · UTM-URLs noindex." One helper; consumers
 *  (P5-07/P6-03/P6-05/admin shell) wire it instead of duplicating
 *  predicates. */
export function isNoindexRoute(path: string): boolean {
  if (path.startsWith("/admin")) return true; // admin noindex
  if (path.startsWith("/u/") || path.startsWith("/users/")) return true; // profiles
  if (path === "/feed" || path === "/" || path.startsWith("/search")) return true; // feed/search
  if (path.includes("utm_")) return true; // UTM-URLs
  if (path.startsWith("/settings") || path.startsWith("/notifications") || path.startsWith("/drafts")) return true;
  return false;
}

/** CAP-485 rel helpers (quoted): user links ugc nofollow; affiliate
 *  sponsored nofollow — ONE shared shape; the P4-13 Showcase approved
 *  button already carries the sponsored form (share, do not fork). */
export const OUTBOUND_REL = {
  userAuthored: "ugc nofollow",
  affiliate: "sponsored nofollow noopener",
  showcase: "sponsored nofollow noopener", // matches P4-13's approved button
} as const;

/** CAP-487 (quoted): "Storefront product cards DEFAULT noindex unless
 *  substantive (doorway prevention)." Substantive = the card's own
 *  description + claims reach the surface word floor. */
export function storefrontCardIndexable(wordCount: number): boolean {
  return wordCount >= 100; // doorway floor for card surfaces (flagged default)
}

/** CAP-477/488 OG helpers: drafts/unpublished → the generic card (488:
 *  immutable state/version keys only — the OG payload keys off content
 *  version fields, never mutable counters). */
export function ogKeys(input: { status: string; version: number; slug: string }) {
  const generic = input.status !== "published";
  return {
    card: generic ? "generic_createconomy" : "content",
    ogImage: generic ? "/og/generic.png" : `/og/${input.slug}?v=${input.version}`,
    // immutable keys only (quoted)
    stableKeys: { slug: input.slug, version: input.version, status: input.status },
  };
}
