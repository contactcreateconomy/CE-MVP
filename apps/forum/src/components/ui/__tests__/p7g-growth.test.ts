/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P7G-01…06 acceptance tests — the M17 indexability engine + the
 * M14 retention layer. FATAL-M17-C1 is the precision item. */

const convexRoot = join(__dirname, "../../../../../../convex");
const forumRoot = join(__dirname, "../../../..");
const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");

const schemaSrc = read(convexRoot, "schema.ts");
const evaluatorSrc = read(convexRoot, "seo/assertIndexable.ts");
const jsonldSrc = read(convexRoot, "seo/jsonld.ts");
const visitSrc = read(convexRoot, "retention/visit.ts");
const dripSrc = read(convexRoot, "jobs/dripRelease.ts");
const newsletterSrc = read(convexRoot, "newsletter.ts");
const cronsSrc = read(convexRoot, "crons.ts");
const seedSrc = read(convexRoot, "seed.ts");

const baseEntity = {
  kind: "post" as const,
  lifecycleStatus: "published",
  moderationStatus: "passed",
  visibility: "public",
  wordCount: 400,
};

describe("SLICE-P7G-01 — assertIndexable (CAP-466/467/470/476/481/482)", () => {
  it("the quoted predicate: published ∧ passed ∧ public ∧ !dup ∧ !doorway ∧ !thin ∧ 200 ∧ affiliate-survivable ∧ persona-density", async () => {
    const { assertIndexable } = await import("../../../../../../convex/seo/assertIndexable");
    expect(assertIndexable(baseEntity).indexable).toBe(true);
    expect(assertIndexable({ ...baseEntity, lifecycleStatus: "draft" }).indexable).toBe(false);
    expect(assertIndexable({ ...baseEntity, moderationStatus: "held" }).indexable).toBe(false);
    expect(assertIndexable({ ...baseEntity, visibility: "private" }).indexable).toBe(false);
    expect(assertIndexable({ ...baseEntity, isDuplicate: true }).indexable).toBe(false);
    expect(assertIndexable({ ...baseEntity, isDoorway: true }).indexable).toBe(false);
    // M17 AC (quoted): "Given affiliate-only thin, When assertIndexable, Then false"
    expect(assertIndexable({ ...baseEntity, wordCount: 20, affiliateBlockFraction: 0.9 }).indexable).toBe(false);
    // CAP-481: persona-heavy + zero community ratings → noindex
    expect(assertIndexable({ ...baseEntity, personaDensity: 0.8, communityRatingCount: 0 }).indexable).toBe(false);
    expect(assertIndexable({ ...baseEntity, personaDensity: 0.8, communityRatingCount: 5 }).indexable).toBe(true);
    // CAP-482: tool/hub thin floor
    expect(assertIndexable({ ...baseEntity, kind: "tool", wordCount: 100 }).indexable).toBe(false);
  });
  it("CAP-467/470: false → 404/410 + noindex,nofollow + generic OG; was-public → 410", async () => {
    const { assertIndexable } = await import("../../../../../../convex/seo/assertIndexable");
    const gone = assertIndexable({ ...baseEntity, lifecycleStatus: "archived", wasEverPublic: true });
    expect(gone.httpStatus).toBe(410);
    expect(gone.genericOg).toBe(true);
    expect(assertIndexable({ ...baseEntity, isDoorway: true }).httpStatus).toBe(404);
  });
  it("FATAL-M17-01: indexable requires the provenance destinations (fail-closed constant)", () => {
    expect(evaluatorSrc).toContain("PROVENANCE_DESTINATIONS_LIVE");
    expect(evaluatorSrc).toContain("/how-we-review");
    expect(evaluatorSrc).toContain("/ai-disclosure");
  });
  it("indexable-entity deepen columns on tools + resources (bible l.288)", () => {
    for (const table of ["tools: defineTable", "resources: defineTable"]) {
      const region = schemaSrc.split(table)[1].split("\n  })")[0];
      for (const col of ["previousSlugs", "lastReviewedAt", "reviewedByUserId", "provenanceVersion"]) {
        expect(region).toContain(col);
      }
    }
  });
});

describe("SLICE-P7G-02 — JSON-LD / sitemap / slugs (CAP-471-475) — FATAL-M17-C1", () => {
  it("n=2 humans → NO AggregateRating (quoted AC)", async () => {
    const { toolAggregateRating } = await import("../../../../../../convex/seo/jsonld");
    expect(toolAggregateRating({ distinctHumanRaterCount: 2, ratingSum: 8 }).emit).toBe(false);
  });
  it("≥3 distinct humans → AggregateRating from M5 community only", async () => {
    const { toolAggregateRating } = await import("../../../../../../convex/seo/jsonld");
    const out = toolAggregateRating({ distinctHumanRaterCount: 5, ratingSum: 20 });
    expect(out.emit).toBe(true);
    expect(out.ratingValue).toBe(4);
    expect(out.ratingCount).toBe(5);
  });
  it("persona-only ratings NEVER emit — structural: the function receives only the human subset", () => {
    // The aggregate input type names the human subset explicitly; the
    // caller (tool page) computes it from authorType=human rows only.
    expect(jsonldSrc).toContain("distinctHumanRaterCount");
    expect(jsonldSrc).toContain("M5 community fields only");
    const fn = jsonldSrc.split("toolAggregateRating")[1].split("export function toolJsonLd")[0];
    expect(fn).not.toContain("editorialVerdictScore"); // editorial verdicts never feed the aggregate
    expect(fn).not.toContain("isPersona"); // no persona flag input exists structurally
  });
  it("visible copy states the EXACT count — ratingCount IS the distinct human count", async () => {
    const { toolJsonLd } = await import("../../../../../../convex/seo/jsonld");
    const node = toolJsonLd({
      name: "T", slug: "t", description: "d",
      communityRatings: { distinctHumanRaterCount: 7, ratingSum: 30.1 },
    });
    expect((node.aggregateRating as any).ratingCount).toBe(7);
  });
  it("CAP-472: FAQ only with ≥2 real pairs", async () => {
    const { faqJsonLd } = await import("../../../../../../convex/seo/jsonld");
    expect(faqJsonLd([{ question: "q", answer: "a" }])).toBeNull();
    expect(faqJsonLd([{ question: "q", answer: "a" }, { question: "q2", answer: "a2" }])).not.toBeNull();
  });
  it("CAP-473: sitemap includes ONLY assertIndexable=true", async () => {
    const { sitemapEntries } = await import("../../../../../../convex/seo/jsonld");
    const out = sitemapEntries([
      { ...baseEntity, kind: "tool", slug: "good" },
      { ...baseEntity, kind: "tool", slug: "bad", isDoorway: true },
    ]);
    expect(out).toEqual(["/tools/good"]);
  });
  it("CAP-474: slug change appends previousSlugs + audit at ≥7d indexed", async () => {
    const { slugChange } = await import("../../../../../../convex/seo/jsonld");
    const out = slugChange({
      previousSlugs: [], oldSlug: "old", newSlug: "new",
      wasIndexed: true, firstIndexedAt: Date.now() - 8 * 86_400_000,
    });
    expect(out.nextPreviousSlugs).toEqual(["old"]);
    expect(out.auditRequired).toBe(true);
  });
  it("CAP-475: substantive edit → similarity re-run flag (never a silent bypass)", async () => {
    const { editRequiresSimilarityRerun } = await import("../../../../../../convex/seo/jsonld");
    expect(editRequiresSimilarityRerun({ addedWords: 50, removedWords: 5, bodyChangedFraction: 0.1 })).toBe(false);
    expect(editRequiresSimilarityRerun({ addedWords: 300, removedWords: 0, bodyChangedFraction: 0.5 })).toBe(true);
  });
});

describe("SLICE-P7G-03 — rel / OG / noindex family (CAP-477/485-488)", () => {
  it("CAP-485 quoted rel values; the Showcase shares the sponsored shape", async () => {
    const { OUTBOUND_REL } = await import("../../../../../../convex/seo/assertIndexable");
    expect(OUTBOUND_REL.userAuthored).toBe("ugc nofollow");
    expect(OUTBOUND_REL.affiliate).toContain("sponsored nofollow");
    expect(OUTBOUND_REL.showcase).toBe(OUTBOUND_REL.affiliate); // shared, not forked
  });
  it("CAP-486: profiles · feed/search · admin · UTM-URLs noindex (one helper)", async () => {
    const { isNoindexRoute } = await import("../../../../../../convex/seo/assertIndexable");
    expect(isNoindexRoute("/u/handle")).toBe(true);
    expect(isNoindexRoute("/users/handle")).toBe(true);
    expect(isNoindexRoute("/feed")).toBe(true);
    expect(isNoindexRoute("/search?q=x")).toBe(true);
    expect(isNoindexRoute("/admin/config")).toBe(true);
    expect(isNoindexRoute("/landing?utm_source=x")).toBe(true);
    expect(isNoindexRoute("/tools/some-tool")).toBe(false);
  });
  it("CAP-487: storefront cards default noindex unless substantive", async () => {
    const { storefrontCardIndexable } = await import("../../../../../../convex/seo/assertIndexable");
    expect(storefrontCardIndexable(20)).toBe(false);
    expect(storefrontCardIndexable(150)).toBe(true);
  });
  it("CAP-477/488: drafts get the generic card; OG keys are immutable state/version", async () => {
    const { ogKeys } = await import("../../../../../../convex/seo/assertIndexable");
    const draft = ogKeys({ status: "draft", version: 1, slug: "s" });
    expect(draft.card).toBe("generic_createconomy");
    const live = ogKeys({ status: "published", version: 3, slug: "s" });
    expect(live.ogImage).toContain("v=3");
    expect(Object.keys(live.stableKeys)).toEqual(["slug", "version", "status"]);
  });
});

describe("SLICE-P7G-04 — empty-states + visit/since (CAP-371-375)", () => {
  it("thread empty = the quoted 'No human comments yet'; personas never read as human activity", async () => {
    const { emptyStateCopy } = await import("../../../../../../convex/retention/visit");
    expect(emptyStateCopy({ surface: "thread", humanCount: 0 }).heading).toBe("No human comments yet");
    const withPersonas = emptyStateCopy({ surface: "thread", humanCount: 0, personaCount: 3 });
    expect(withPersonas.heading).toBe("No human comments yet"); // heading stays honest
    expect(withPersonas.body).toContain("AI perspectives");
  });
  it("feed empty points at Hot/Top/New FIRST; podium hidden <25 (quoted)", async () => {
    const { emptyStateCopy } = await import("../../../../../../convex/retention/visit");
    const feed = emptyStateCopy({ surface: "feed", humanCount: 10 });
    expect(feed.body).toContain("Hot, Top, or New");
    expect(feed.showPodium).toBe(false);
    expect(emptyStateCopy({ surface: "feed", humanCount: 40 }).showPodium).toBe(true);
  });
  it("visit.commit: ≥30s OR qualified action; ≥30m write throttle; prior anchor preserved", () => {
    expect(visitSrc).toContain("VISIT_QUALIFY_MS = 30_000");
    expect(visitSrc).toContain("VISIT_THROTTLE_MS = 30 * 60_000");
    expect(visitSrc).toContain("priorVisitAt: prior"); // the anchor write (quoted)
  });
  it("CAP-374: ≥3 REAL events → module; else suppressed + the retention event", () => {
    expect(visitSrc).toContain("retention.since_last_visit_suppressed");
    expect(visitSrc).toContain("events.length >= 3");
  });
});

describe("SLICE-P7G-05 — drip.release (CAP-380, PRIMARY)", () => {
  it("hourly cron wired; the job gates on the release hour", () => {
    expect(cronsSrc).toContain("internal.jobs.dripRelease.release");
    expect(dripSrc).toContain("DEFAULT_RELEASE_HOUR_UTC");
    expect(dripSrc).toContain("getUTCHours()");
  });
  it("default itemsPerDay=1; launch floor 40 banked; scheduled supply stays countable", () => {
    expect(dripSrc).toContain("DEFAULT_ITEMS_PER_DAY = 1");
    expect(dripSrc).toContain("LAUNCH_FLOOR = 40");
    expect(dripSrc).toContain("scheduledSupplyDays");
  });
  it("batch 0 → no notif; supply-announcement copy (never social proof); one per batch", () => {
    const fn = dripSrc.split("release = internalMutation")[1];
    expect(fn).toContain('if (scheduled.length === 0) return { released: 0 }');
    expect(dripSrc).toContain("never a human actor");
    expect(dripSrc).toContain("dedupeScope: batchId");
  });
  it("CAP-381 NOT duplicated — no second supply alert here", () => {
    expect(dripSrc).not.toContain("interventionCreateTx");
    expect(dripSrc).not.toContain("drip supply low");
  });
});

describe("SLICE-P7G-06 — newsletter + knobs (CAP-384/385/388/389)", () => {
  it("single ask after first acquire; any consent row → never re-prompt", () => {
    const fn = newsletterSrc.split("overlayState")[1].split("export const consent")[0];
    expect(fn).toContain("existing.length > 0) return { show: false }");
    expect(fn).toContain("acquires.length >= 1");
  });
  it("CAP-385: unsubscribe terminal + pre-send; idempotent", () => {
    const fn = newsletterSrc.split("unsubscribe = mutation")[1].split("});")[0];
    expect(fn).toContain("unsubscribe_direct");
    expect(fn).toContain("unsubscribed");
  });
  it("trigger-based copy version (quoted: 'No fixed schedule, no marketing') + unsubscribe BEFORE capture in the overlay", () => {
    expect(newsletterSrc).toContain("trigger.v1");
    const overlay = read(forumRoot, "src/components/newsletter/newsletter-overlay.tsx");
    expect(overlay).toContain("No fixed schedule, no marketing");
    expect(overlay.indexOf("Unsubscribe")).toBeLessThan(overlay.indexOf("Keep me posted"));
  });
  it("CAP-388/389: the M14 l.64 key set on the registry (no invented knobs)", () => {
    for (const key of [
      "drip.itemsPerDay", "drip.releaseHourUtc", "drip.minScheduledDays", "drip.launchInventoryFloor",
      "coach.maxLifetime", "coach.maxPreActivation", "checklist.visibleMax", "sinceLastVisit.minItems",
      "leaderboard.minParticipants", "visit.qualifyMs", "visit.writeThrottleMs", "interestTiles.enabled",
    ]) {
      expect(seedSrc).toContain(`"${key}"`);
    }
  });
  it("schema: newsletterConsents + dripBatches per bible l.51-52", () => {
    expect(schemaSrc).toContain("newsletterConsents: defineTable");
    expect(schemaSrc).toContain("dripBatches: defineTable");
  });
});
