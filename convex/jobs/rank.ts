/**
 * rank — SLICE-P5-04: CAP-129/130 — the dirty-flag recompute + the live
 * decay tick over commentScores.
 *
 * CAP-129 (quoted): "Leased bounded batches; clears flag before read;
 *   idempotent vs overlap." The lease IS the clear-first patch: a claimed
 *   row has dirty=false before its recompute reads, so an overlapping run
 *   never double-processes; a crash mid-batch loses at most one recompute
 *   cycle (the next interaction re-dirties — scores are rebuildable
 *   projections, never authoritative).
 * CAP-130 (quoted): "Live sort only" — the decay tick touches liveScore.
 *
 * DECISIONS-LOCKED #11 (quoted): "rank/score constants ship as versioned
 *   config defaults tagged calibration_pending: true (Hot = time-decay
 *   gravity, Top = recency+engagement blend); no hardcoded values; real
 *   calibration post-beta gated by Readiness Category 8." Constants live
 *   as systemConfig rows (registry: rank.*) read per batch with safe
 *   fallbacks; the version tag rides every write.
 *
 * bestScore (bible l.103, quoted): "a Bayesian confidence-damped positive
 *   score — damped toward the category-scoped mean positive-rate (fallback
 *   global); small-sample penalty + distinct-human corroboration +
 *   trust-weighted; NOT Wilson; exactly ONE reaction type is the
 *   numerator" — valuableCount/weighted valuable only; context/curation
 *   NEVER lower Best (negative reactions are not inputs).
 *
 * Cadence note: the register's ~3s cadence is unattainable on Convex
 *   crons (1/min floor) — the cron runs every minute, flagged deviation.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const RANK_CONFIG_VERSION = "calibration_pending.v1";

/** Safe fallbacks — the live systemConfig rows (registry: rank.*) win. */
const RANK_DEFAULTS = {
  bestPriorWeight: 5,
  bestPriorMean: 0.3,
  bestMinCategorySamples: 10,
  liveHalfLifeHours: 6,
};

type RankConfig = typeof RANK_DEFAULTS;

const RANK_CONFIG_KEYS: Record<keyof RankConfig, string> = {
  bestPriorWeight: "rank.best.priorWeight",
  bestPriorMean: "rank.best.priorMean",
  bestMinCategorySamples: "rank.best.minCategorySamples",
  liveHalfLifeHours: "rank.live.halfLifeHours",
};

async function loadRankConfig(ctx: any): Promise<RankConfig> {
  const out: Record<string, number> = { ...RANK_DEFAULTS };
  for (const key of Object.keys(RANK_DEFAULTS) as (keyof RankConfig)[]) {
    const row = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", RANK_CONFIG_KEYS[key]))
      .first();
    if (row && typeof row.value === "number" && Number.isFinite(row.value)) {
      out[key] = row.value;
    }
  }
  return out as RankConfig;
}

export function decayFactor(lastInteractionAt: number, halfLifeHours: number, now: number): number {
  const hours = Math.max(0, (now - lastInteractionAt) / 3_600_000);
  return Math.pow(2, -hours / halfLifeHours);
}

/** CAP-129 — claim + recompute one bounded batch. */
export const recomputeDirtyBatch = internalMutation({
  args: {},
  returns: v.object({ claimed: v.number(), recomputed: v.number(), configVersion: v.string() }),
  handler: async (ctx) => {
    const config = await loadRankConfig(ctx);
    const now = Date.now();

    // Global prior: mean positive rate over recently-active scored comments
    // (fallback when a category has < bestMinCategorySamples scored rows).
    const recent = await ctx.db
      .query("commentScores")
      .withIndex("by_dirty_lastInteraction", (q: any) => q.eq("dirty", false))
      .order("desc")
      .take(200);
    let globalValuable = 0;
    let globalEngagement = 0;
    for (const row of recent) {
      globalValuable += row.valuableCount;
      globalEngagement += row.valuableCount + row.replyCount + row.saveCount;
    }
    const globalPrior = globalEngagement > 0 ? globalValuable / globalEngagement : config.bestPriorMean;

    // Claim (lease): the clear-first patch — CAP-129's quoted semantics
    const claimed = await ctx.db
      .query("commentScores")
      .withIndex("by_dirty_lastInteraction", (q: any) => q.eq("dirty", true))
      .take(50);
    for (const row of claimed) {
      await ctx.db.patch(row._id, { dirty: false });
    }

    let recomputed = 0;
    for (const row of claimed) {
      const comment = await ctx.db.get(row.commentId);
      if (!comment || comment.deletedAt) continue; // tombstoned — projection frozen
      const post = await ctx.db.get(comment.postId);
      void post; // category-scoped prior: v1 uses the global prior for every
      // category (per-category peer scans are a calibration-pass concern;
      // the config-versioned constants make scoping a data change, not a
      // code change) — flagged against the l.103 quote

      // Trust-weighted numerator: sum valuable weightAtCast (fallback to
      // plain count when reaction rows are absent — rebuildability)
      const reactions = await ctx.db
        .query("commentReactions")
        .withIndex("by_comment_type", (q: any) => q.eq("commentId", row.commentId).eq("reactionType", "valuable"))
        .collect();
      const weightedValuable = reactions.reduce((acc: number, r: any) => acc + (r.weightAtCast ?? 1), 0);
      const numeratorBase = reactions.length > 0 ? weightedValuable : row.valuableCount;
      const priorMean = globalPrior;

      // Bayesian confidence-damped positive score — ONE numerator; the
      // distinct-replier corroboration sharpens small samples; context and
      // curation NEVER enter (cannot lower Best)
      const denominator = row.valuableCount + config.bestPriorWeight;
      let bestScore = (numeratorBase + priorMean * config.bestPriorWeight) / denominator;
      bestScore *= 1 + Math.min(0.5, row.distinctReplierCount * 0.05); // corroboration boost

      const engagement = row.valuableCount + row.replyCount + row.saveCount;
      const liveScore = engagement * decayFactor(row.lastInteractionAt, config.liveHalfLifeHours, now);
      const mostDiscussedScore = row.replyCount * Math.max(1, row.distinctReplierCount); // volume × balance

      await ctx.db.patch(row._id, {
        bestScore: Math.round(bestScore * 1000) / 1000,
        liveScore: Math.round(liveScore * 1000) / 1000,
        mostDiscussedScore: Math.round(mostDiscussedScore * 1000) / 1000,
        rankVersion: row.rankVersion + 1,
        lastRankedAt: now,
      });
      recomputed += 1;
    }

    return { claimed: claimed.length, recomputed, configVersion: RANK_CONFIG_VERSION };
  },
});

/** CAP-130 — scheduled decay tick, liveScore ONLY (live sort's recency
 *  gravity; Best/Top untouched). Bounded to the recent-activity window —
 *  older comments' liveScores are already ≈0 under the half-life. */
export const decayLiveScores = internalMutation({
  args: {},
  returns: v.object({ decayed: v.number(), configVersion: v.string() }),
  handler: async (ctx) => {
    const config = await loadRankConfig(ctx);
    const now = Date.now();
    const windowStart = now - 48 * 3_600_000;
    const rows = await ctx.db
      .query("commentScores")
      .withIndex("by_dirty_lastInteraction", (q: any) => q.eq("dirty", false))
      .filter((q: any) => q.gte(q.field("lastInteractionAt"), windowStart))
      .take(500);
    let decayed = 0;
    for (const row of rows) {
      const engagement = row.valuableCount + row.replyCount + row.saveCount;
      const liveScore = engagement * decayFactor(row.lastInteractionAt, config.liveHalfLifeHours, now);
      if (Math.abs(liveScore - row.liveScore) > 0.001) {
        await ctx.db.patch(row._id, {
          liveScore: Math.round(liveScore * 1000) / 1000,
          rankVersion: row.rankVersion + 1,
          lastRankedAt: now,
        });
        decayed += 1;
      }
    }
    return { decayed, configVersion: RANK_CONFIG_VERSION };
  },
});
