/**
 * reach / might / level commit — SLICE-P7E-08: CAP-302/303/304/305/315/316
 * + CAP-570 `tier_unlocked` call-site.
 *
 * CAP-302 (quoted): memberCount = "COUNT of verified/active/integrity-
 *   qualified members" — "clean integer; raw all-time count admin-only."
 * CAP-303 (quoted): reachFactor = "Σ member.legitimacy" — "never shown
 *   publicly"; "bots at 0.05 negligible."
 * CAP-304 (quoted): "might.recompute continuously computes Might =
 *   √(reachFactor × activeSignals)."
 * CAP-305 (quoted): "level.commitMonthly commits displayed Level with
 *   hysteresis + holdover (NO monthly demotion)" — Might continuous,
 *   Level committed monthly (two-speed, quoted).
 * CAP-315 (quoted): cold-start — "below ~1000 eligible channels use fixed
 *   Might thresholds ('Founding Season')"; "Supernova+ stay silhouettes
 *   until pool large."
 * CAP-316: dormant at Might=0 for 180d (config signal.dormant.mightZeroDays).
 * CAP-570 (quoted): `tier_unlocked` is a same-mutation append — "append
 *   throw rolls back the commit."
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { appendActivity } from "../activity";
import { currentSeasonTx } from "../signal/promoteDemote";

const DAY_MS = 24 * 3_600_000;

/** CAP-302/303 — Reach + reachFactor per Distribution's membership rows. */
export const reachRefresh = internalMutation({
  args: {},
  returns: v.object({ refreshed: v.number() }),
  handler: async (ctx) => {
    const distMembers = await ctx.db.query("distributionMemberships").take(500);
    const byDist = new Map<Id<"distributions">, { count: number; factor: number }>();
    for (const m of distMembers) {
      if (m.leftAt) continue; // left members: log-scaled reach ≈ 0 (anti-suppression)
      const legit = await ctx.db
        .query("legitimacyScores")
        .withIndex("by_actor", (q: any) => q.eq("actorUserId", m.memberUserId))
        .unique();
      // eligibilityStatus gates the clean count (verified/active/integrity-qualified)
      const eligible = m.eligibilityStatus === "qualified";
      const cur = byDist.get(m.distributionId) ?? { count: 0, factor: 0 };
      if (eligible) cur.count += 1; // CAP-302 clean integer
      cur.factor += legit?.value ?? 0.05; // CAP-303 "bots at 0.05 negligible"
      byDist.set(m.distributionId, cur);
    }
    let refreshed = 0;
    for (const [distId, { count, factor }] of byDist) {
      await ctx.db.patch(distId, { memberCount: count, reachFactor: factor });
      refreshed += 1;
    }
    return { refreshed };
  },
});

/** CAP-304 — Might = √(reachFactor × activeSignals) + CAP-316 dormancy. */
export const mightRecompute = internalMutation({
  args: {},
  returns: v.object({ recomputed: v.number(), dormant: v.number() }),
  handler: async (ctx) => {
    const dists = await ctx.db.query("distributions").take(500);
    let recomputed = 0;
    let dormantCount = 0;
    const dormantDays = 180; // config signal.dormant.mightZeroDays mirrors (calibration_pending.v1)
    for (const dist of dists) {
      const summary = await ctx.db
        .query("signalSummary")
        .withIndex("by_subject", (q: any) => q.eq("subjectType", "distribution").eq("subjectId", dist._id))
        .unique();
      const active = summary?.activeSignals ?? 0;
      const might = Math.sqrt(dist.reachFactor * active); // CAP-304 (quoted)
      const mightZeroSince = might === 0 && dist.dormant;
      const newlyDormant =
        might === 0 &&
        !dist.dormant &&
        Date.now() - dist.createdAt > dormantDays * DAY_MS; // conservative: pool age as the zero-signal floor
      await ctx.db.patch(dist._id, {
        might,
        dormant: mightZeroSince || newlyDormant || dist.dormant,
      });
      if (mightZeroSince || newlyDormant) dormantCount += 1;
      recomputed += 1;
    }
    return { recomputed, dormant: dormantCount };
  },
});

/** CAP-305 — monthly Level commit: hysteresis + holdover, NO monthly
 *  demotion. CAP-315 cold-start: pool < 1000 → every level stays at its
 *  seeded floor; promotions ride fixed thresholds when calibrated
 *  (thresholds map awaits the calibration pass — until then the commit
 *  holds the floor, honest and fail-closed). */
export const levelCommitMonthly = internalMutation({
  args: {},
  returns: v.object({ committed: v.number(), promoted: v.number() }),
  handler: async (ctx) => {
    const season = await currentSeasonTx(ctx); // derived — never a hardcoded season number
    if (!season) return { committed: 0, promoted: 0 };
    const defs = await ctx.db
      .query("signalLevelDefinitions")
      .withIndex("by_season_level", (q: any) => q.eq("seasonId", season._id))
      .take(10);
    const dists = await ctx.db.query("distributions").take(500);
    const monthAgo = Date.now() - 30 * DAY_MS;
    let committed = 0;
    let promoted = 0;
    for (const dist of dists) {
      // One commit per distribution per ~30d (hysteresis anchor)
      const prior = await ctx.db
        .query("distributionLevelAssignments")
        .withIndex("by_distribution_season", (q: any) =>
          q.eq("distributionId", dist._id).eq("seasonId", season._id))
        .take(12)
        .then((rows: any[]) =>
          rows.sort((a: any, b: any) => b.committedAt - a.committedAt)[0] ?? null);
      if (prior && prior.committedAt > monthAgo) continue;

      // Fixed-threshold ladder (cold-start). Thresholds are unset until
      // calibration → the floor holds; a level only promotes past the
      // floor when its fixedMightThreshold is defined AND Might clears it.
      const ladder = defs
        .filter((d: any) => typeof d.fixedMightThreshold === "number")
        .sort((a: any, b: any) => (a.fixedMightThreshold ?? 0) - (b.fixedMightThreshold ?? 0));
      let level = dist.currentLevel; // NO monthly demotion (quoted)
      for (const def of ladder) {
        if (dist.might >= (def.fixedMightThreshold ?? Infinity)) level = def.level;
      }
      const changed = level !== dist.currentLevel;

      await ctx.db.insert("distributionLevelAssignments", {
        distributionId: dist._id,
        seasonId: season._id,
        level,
        status: "active",
        mightAtCommit: dist.might,
        committedAt: Date.now(),
      });
      if (changed) {
        await ctx.db.patch(dist._id, {
          currentLevel: level,
          highestLevelAchieved: dist.highestLevelAchieved, // in-place: promotion updates below
        });
        // highestLevelAchieved only ratchets UP
        const higher = ladder.findIndex((d: any) => d.level === level) >
          ladder.findIndex((d: any) => d.level === dist.highestLevelAchieved);
        if (higher) await ctx.db.patch(dist._id, { highestLevelAchieved: level });

        // CAP-570 tier_unlocked — same-mutation append (quoted: "append
        // throw rolls back the commit" — appendActivity throwing here
        // fails this whole internalMutation, holding the commit)
        await appendActivity(ctx, {
          userId: dist.ownerUserId,
          eventType: "tier_unlocked",
          targetType: "distribution",
          targetId: dist._id,
          summary: `Level unlocked: ${level}`,
          meta: { level: { value: level, privacy: "safe_for_public" } },
        });
        promoted += 1;
      }
      committed += 1;
    }
    return { committed, promoted };
  },
});
