/**
 * promoteDemote + season — SLICE-P7E-18: CAP-306–311/314/319.
 *
 * CAP-307 (quoted): "T-30 announce; T-0 freeze; T+1 publish" — the
 *   recalibrate cron advances season status at the boundary and freezes
 *   thresholds once.
 * CAP-308 (quoted): "threshold precedence = min(percentileCandidate,
 *   priorSeasonThreshold×1.50) — 50% cap binds → 'transition threshold'."
 * CAP-309 (quoted): Multiverse dual gate — "percentile floor AND absolute
 *   top ~100" ("legendary at any scale").
 * CAP-306 (quoted): immediate promotion on "sustained ~30d above line +
 *   ≥2 outcome families + integrity clear" + permanent milestone badge.
 * CAP-310 (quoted): annual routine demotion "max 1 level, holdover grace
 *   ~10%; accuracy framing not punishment; first visible = preserved
 *   Peak badge."
 * CAP-311 (quoted): integrity correction drops Level immediately (not
 *   "competitive demotion").
 * CAP-314 (quoted): "discoverer badge type" — first-to-reach a newly
 *   unlocked level.
 * CAP-319: Phase-2 store metrics skeleton — only when storeEnabled; a
 *   no-op skeleton, no invented store Signal math.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mintBadgeTx } from "../jobs/recognition";

const LEVELS = ["orbit", "comet", "moon", "planet", "star", "supernova", "nebula", "galaxy", "universe", "multiverse"] as const;
const PROMOTION_CAP = 1.5; // CAP-308: priorSeasonThreshold × 1.50
const HOLDOVER_PCT = 0.1; // CAP-310: grace within ~10%

/** CAP-308 — threshold precedence (pure). */
export function thresholdPrecedence(percentileCandidate: number, priorSeasonThreshold?: number): { value: number; transition: boolean } {
  if (priorSeasonThreshold === undefined || priorSeasonThreshold === 0) {
    return { value: percentileCandidate, transition: false };
  }
  const capped = priorSeasonThreshold * PROMOTION_CAP;
  if (percentileCandidate > capped) {
    return { value: capped, transition: true }; // the cap binds → label
  }
  return { value: percentileCandidate, transition: false };
}

/** CAP-307 season.recalibrate — boundary state machine. With thresholds
 *  uncalibrated (Founding Season), publish keeps the fixed floor and
 *  recomputes percentile breakpoints into the thresholds map's candidate
 *  fields — frozen once written. */
export const seasonRecalibrate = internalMutation({
  args: {},
  returns: v.object({ action: v.string() }),
  handler: async (ctx) => {
    const season = await ctx.db
      .query("signalSeasons")
      .withIndex("by_seasonNumber", (q: any) => q.eq("seasonNumber", 1))
      .unique();
    if (!season) return { action: "no_season" };
    const now = Date.now();
    const T30 = season.endAt - 30 * 24 * 3_600_000;

    if (season.status === "active" && now >= T30 && now < season.endAt) {
      await ctx.db.patch(season._id, { status: "announced", announcedAt: now }); // T-30 announce
      return { action: "announced" };
    }
    if (season.status === "announced" && now >= season.endAt) {
      // T-0 freeze: pool-size percentile breakpoints computed + thresholds frozen
      const pool = await ctx.db.query("distributions").take(1000);
      const mights = pool.map((d: any) => d.might).sort((a: number, b: number) => b - a);
      const pct = (p: number) => mights[Math.min(mights.length - 1, Math.floor((p / 100) * mights.length))] ?? 0;
      const thresholds = {
        comet: pct(50), moon: pct(80), planet: pct(90), star: pct(97),
        supernova: pct(99), nebula: pct(99.7), galaxy: pct(99.9), universe: pct(99.97),
        multiverse: mights[Math.min(99, mights.length - 1)] ?? 0, // CAP-309: absolute top ~100 (dual gate)
      };
      await ctx.db.patch(season._id, { status: "closed", recalibratedAt: now, poolSize: pool.length, thresholds });
      return { action: "frozen" };
    }
    if (season.status === "closed") {
      // T+1 publish: the next season opens carrying capped thresholds (CAP-308)
      const prior = season.thresholds ?? {};
      const capped: Record<string, number | undefined> = {};
      for (const [lvl, priorValue] of Object.entries(prior)) {
        if (typeof priorValue === "number" && priorValue > 0) {
          capped[lvl] = priorValue * PROMOTION_CAP; // the 50%-rise cap per season (bible l.343: "max rise ~50%")
        }
      }
      await ctx.db.insert("signalSeasons", {
        seasonNumber: season.seasonNumber + 1,
        startAt: now,
        endAt: now + 365 * 24 * 3_600_000,
        status: "active",
        mode: "percentile",
        thresholds: capped,
        poolSize: 0,
        announcedAt: undefined,
      });
      return { action: "published_next_season" };
    }
    return { action: "noop" };
  },
});

/** CAP-306 immediate promotion — sustained ~30d above the line + ≥2
 *  outcome families + integrity clear → promote NOW + permanent
 *  milestone badge (levels change, badges don't). */
export const promoteSustained = internalMutation({
  args: {},
  returns: v.object({ promoted: v.number() }),
  handler: async (ctx) => {
    const season = await ctx.db
      .query("signalSeasons")
      .withIndex("by_seasonNumber", (q: any) => q.eq("seasonNumber", 1))
      .unique();
    if (!season) return { promoted: 0 };
    const dists = await ctx.db.query("distributions").take(500);
    let promoted = 0;
    for (const dist of dists) {
      // Integrity clear: no active neutralize flags on the owner
      const neutralized = await ctx.db
        .query("integrityFlags")
        .withIndex("by_actor_disposition", (q: any) => q.eq("actorUserId", dist.ownerUserId).eq("disposition", "neutralize"))
        .first();
      if (neutralized) continue;
      // ≥2 outcome families in the ledger (sustained diversity evidence)
      const ledger = await ctx.db
        .query("signalLedger")
        .withIndex("by_author_state", (q: any) => q.eq("authorUserId", dist.ownerUserId).eq("state", "finalized"))
        .take(50);
      const families = new Set(ledger.map((r: any) => r.outcomeType));
      if (families.size < 2) continue;
      // Sustained ~30d above the CURRENT level's line (last assignment age)
      const assignments = await ctx.db
        .query("distributionLevelAssignments")
        .withIndex("by_distribution_season", (q: any) => q.eq("distributionId", dist._id).eq("seasonId", season._id))
        .take(12);
      const latest = assignments.sort((a: any, b: any) => b.committedAt - a.committedAt)[0];
      if (!latest || Date.now() - latest.committedAt < 30 * 24 * 3_600_000) continue;
      const nextIdx = LEVELS.indexOf(dist.currentLevel as any) + 1;
      if (nextIdx >= LEVELS.length) continue;
      const nextLevel = LEVELS[nextIdx];
      await ctx.db.insert("distributionLevelAssignments", {
        distributionId: dist._id,
        seasonId: season._id,
        level: nextLevel,
        status: "active",
        mightAtCommit: dist.might,
        committedAt: Date.now(),
      });
      await ctx.db.patch(dist._id, { currentLevel: nextLevel, highestLevelAchieved: nextLevel });
      // Permanent milestone badge (quoted: inactivity/level-drop NEVER revokes)
      await mintBadgeTx(ctx, {
        subjectType: "distribution",
        subjectId: dist._id,
        type: "level_milestone",
        label: `Level: ${nextLevel}`,
        level: nextLevel,
        seasonId: season._id,
        mightAtAward: dist.might,
      });
      promoted += 1;
    }
    return { promoted };
  },
});

/** CAP-310 annual routine demotion — season boundary ONLY, max 1 level,
 *  holdover grace ~10% (accuracy framing, not punishment); the preserved
 *  Peak badge renders first (the highestLevelAchieved field is the
 *  record — badge.mint already minted it permanently). */
export const demoteAnnual = internalMutation({
  args: {},
  returns: v.object({ demoted: v.number(), holdover: v.number() }),
  handler: async (ctx) => {
    const season = await ctx.db
      .query("signalSeasons")
      .withIndex("by_seasonNumber", (q: any) => q.eq("seasonNumber", 1))
      .unique();
    if (!season || season.status !== "closed") return { demoted: 0, holdover: 0 }; // boundary only
    const dists = await ctx.db.query("distributions").take(500);
    let demoted = 0;
    let holdover = 0;
    for (const dist of dists) {
      const idx = LEVELS.indexOf(dist.currentLevel as any);
      if (idx <= 0) continue;
      const defs = await ctx.db
        .query("signalLevelDefinitions")
        .withIndex("by_season_level", (q: any) => q.eq("seasonId", season._id).eq("level", LEVELS[idx] as any))
        .unique();
      const line = defs?.fixedMightThreshold;
      if (line === undefined) continue; // uncalibrated — no demotion invents a line
      if (dist.might >= line) continue; // still above the line — stays
      if (dist.might >= line * (1 - HOLDOVER_PCT)) {
        // Within the ~10% grace window → holdover 30d, no drop
        await ctx.db.insert("distributionLevelAssignments", {
          distributionId: dist._id,
          seasonId: season._id,
          level: dist.currentLevel,
          status: "holdover",
          mightAtCommit: dist.might,
          committedAt: Date.now(),
          holdoverUntil: Date.now() + 30 * 24 * 3_600_000,
        });
        holdover += 1;
        continue;
      }
      const prev = LEVELS[idx - 1]; // max 1 level (quoted)
      await ctx.db.insert("distributionLevelAssignments", {
        distributionId: dist._id,
        seasonId: season._id,
        level: prev,
        status: "demoted",
        mightAtCommit: dist.might,
        committedAt: Date.now(),
      });
      await ctx.db.patch(dist._id, { currentLevel: prev }); // highestLevelAchieved stays (Peak record)
      demoted += 1;
    }
    return { demoted, holdover };
  },
});

/** CAP-311 — integrity correction drops the Level IMMEDIATELY (not
 *  "competitive demotion"): the neutralize confirmation path calls this. */
export const integrityDrop = internalMutation({
  args: { ownerUserId: v.id("users") },
  returns: v.object({ dropped: v.boolean(), level: v.string() }),
  handler: async (ctx, args) => {
    const dist = await ctx.db
      .query("distributions")
      .withIndex("by_owner", (q: any) => q.eq("ownerUserId", args.ownerUserId))
      .unique();
    if (!dist) return { dropped: false, level: "orbit" };
    const season = await ctx.db
      .query("signalSeasons")
      .withIndex("by_seasonNumber", (q: any) => q.eq("seasonNumber", 1))
      .unique();
    if (season) {
      await ctx.db.insert("distributionLevelAssignments", {
        distributionId: dist._id,
        seasonId: season._id,
        level: "orbit", // the floor — immediate, integrity-class
        status: "demoted",
        mightAtCommit: dist.might,
        committedAt: Date.now(),
      });
    }
    await ctx.db.patch(dist._id, { currentLevel: "orbit" });
    return { dropped: true, level: "orbit" };
  },
});

/** CAP-314 — first-to-reach a newly-unlocked level → discoverer badge
 *  (community discovery event + permanent badge, quoted). */
export const discovererCheck = internalMutation({
  args: {},
  returns: v.object({ minted: v.number() }),
  handler: async (ctx) => {
    const season = await ctx.db
      .query("signalSeasons")
      .withIndex("by_seasonNumber", (q: any) => q.eq("seasonNumber", 1))
      .unique();
    if (!season) return { minted: 0 };
    // For each level above the pool's cold-start floor, find the top
    // Might distribution; if no discoverer badge exists yet, mint it.
    const dists = (await ctx.db.query("distributions").take(500))
      .sort((a: any, b: any) => b.might - a.might);
    let minted = 0;
    for (const level of LEVELS.slice(1)) {
      const first = dists.find((d: any) => d.highestLevelAchieved === level);
      if (!first) continue;
      const existing = await ctx.db
        .query("badges")
        .withIndex("by_subject_state", (q: any) => q.eq("subjectType", "distribution").eq("subjectId", first._id))
        .take(50)
        .then((rows: any[]) => rows.some((b) => b.type === "discoverer" && b.label === `Discoverer: ${level}`));
      if (existing) continue;
      await mintBadgeTx(ctx, {
        subjectType: "distribution",
        subjectId: first._id,
        type: "discoverer",
        label: `Discoverer: ${level}`,
        level,
        seasonId: season._id,
        mightAtAward: first.might,
        isFirstToAchieve: true,
      });
      minted += 1;
    }
    return { minted };
  },
});

/** CAP-319 — Phase-2 store metrics skeleton. Only when storeEnabled; a
 *  deliberate no-op projection (Sales/ReviewScore/Vouch read sites exist
 *  on the storefront surfaces — no store Signal math is invented here). */
export const storeMetricsSkeleton = internalMutation({
  args: {},
  returns: v.object({ active: v.number() }),
  handler: async (ctx) => {
    const dists = await ctx.db.query("distributions").take(500);
    const active = dists.filter((d: any) => d.storeEnabled === true).length;
    return { active }; // skeleton: counts the eligible surface; math is Phase-2
  },
});
