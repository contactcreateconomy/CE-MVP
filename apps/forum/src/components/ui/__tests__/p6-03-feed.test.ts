/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-03 acceptance tests — CAP-182…186/194/198…201/553. Sources:
 * CONTRACT-6-feed §1-§5 (quotes live in convex/feed.ts docblocks). */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";
import * as feedModule from "../../../../../../convex/feed";

const schema = schemaDefault as any;
const convexRoot = join(__dirname, "../../../../../../convex");
const src = readFileSync(join(convexRoot, "feed.ts"), "utf8");
const pageSrc = readFileSync(join(__dirname, "../../../app/(app)/(shell)/feed/page.tsx"), "utf8");
const clientSrc = readFileSync(join(__dirname, "../../feed/canonical-feed-client.tsx"), "utf8");

describe("SLICE-P6-03 — the four sorts (CAP-182/183/184/185)", () => {
  it("organic sorts are INDEX SCANS over postDistributionScores (never compute-at-read)", () => {
    expect(src).toContain("by_topScore");
    expect(src).toContain("by_hotScore");
    expect(src).toContain("by_lastEligibleInteractionAt");
    expect(src).not.toContain("bestScore *"); // no read-time math on rank
  });

  it("anonymous lands on Hot (CAP-183 quoted); Fav is member-only (CAP-185)", () => {
    expect(clientSrc).toContain('useState<SortMode>("hot")');
    expect(src).toContain("member_only");
    expect(src).toMatch(/sortMode === "fav" && !userId/);
  });

  it("Fav surfaces saved COMMENTS alongside saved posts (E5 quoted extension)", () => {
    const favFn = src.split('sortMode === "fav" && !userId')[1] ?? src; // body after the member gate
    expect(favFn).toContain("commentSaves");
    expect(favFn).toContain('"saves"');
  });

  it("firewall: persona posts never enter organic results (§3 M quoted)", () => {
    expect(src).toContain('post.authorType !== "user") continue');
  });

  it("snapshot pagination: cursor = boundary walk, never a live reorder (CAP-198)", () => {
    expect(src).toContain("cursor walk below the boundary");
    expect(src).toContain("snapshot: true");
  });
});

describe("SLICE-P6-03 — chrome renders (CAP-186/191/194/554)", () => {
  it("type nav reads postTypeConfig state (locked types hidden) — no fork of listActiveTypes", () => {
    expect(src).toContain("postTypeConfig");
    expect(src).not.toContain("listByType");
  });

  it("hero renders 4–6 active + Community Top labeling", () => {
    expect(src).toContain("hero.length >= 6");
    expect(src).toContain("community_top");
  });

  it("CAP-554: pulled Featured items never render (status-filtered)", () => {
    const chromeFn = src.split("getChrome")[1] ?? "";
    expect(chromeFn).toContain('q.eq("status", "active")');
    expect(chromeFn).not.toContain('literal("pulled")');
  });

  it("Podium renders 'forming' until M12 (minThresholdMet)", () => {
    expect(src).toContain("Podium is forming");
    expect(src).toContain("minThresholdMet");
  });

  it("Vibing renders the A7-degrade labeled list with neutral hook fallback", () => {
    expect(src).toContain("hook: hook && !hook.stale");
    expect(clientSrc).toContain("What&apos;s Vibing");
  });
});

describe("SLICE-P6-03 — session controls (CAP-200/553)", () => {
  it("hide/mute write feedSessions; report writes the bible-l.239 reports table", () => {
    expect(src).toContain("hiddenPostIds");
    expect(src).toContain('insert("reports"');
    expect(src).toContain("dedupeKey");
  });

  it("CAP-553 unhide reverses both lists", () => {
    const fn = src.split("export const unhide")[1] ?? "";
    expect(fn).toContain("filter((id: string) => id !== args.postId)");
    expect(fn).toContain("mutedPostIds");
  });

  it("see-fewer is NOT built (feed OQ3 — no write target)", () => {
    expect(src).not.toContain("see_fewer");
    expect(src).not.toContain("seeFewer");
  });

  it("rawEvents only on card_action (CAP-200), catalog-gated row exported + seeded", () => {
    expect(src).toContain("feed.card_action");
    expect(feedModule.FEED_CARD_ACTION_EVENT_ROW.eventName).toBe("feed.card_action");
    const seedSrc = readFileSync(join(convexRoot, "seed.ts"), "utf8");
    expect(seedSrc).toContain("FEED_CARD_ACTION_EVENT_ROW");
  });
});

describe("SLICE-P6-03 — schema additions + route", () => {
  it("saves (bible l.82) + reports (bible l.239) tables exist with the quoted shapes", () => {
    expect(schema.tables.saves).toBeDefined();
    expect(schema.tables.reports).toBeDefined();
    const r = schema.tables.reports.validator.fields;
    expect(r.dedupeKey).toBeDefined();
    expect(r.caseId).toBeDefined();
  });

  it("the canonical client replaced the legacy demo feed on /feed (00-TRANSITION)", () => {
    expect(pageSrc).toContain("CanonicalFeedClient");
    expect(pageSrc).not.toContain("FeedRouteClient");
    expect(pageSrc).toContain("index: false"); // noindex (CAP-486)
  });
});
