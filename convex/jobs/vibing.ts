/**
 * vibing — SLICE-P6-02: CAP-189 — vibing.compute (What's Vibing momentum).
 *
 * CAP-189 (quoted): "Entirely from eligible HUMAN activity (INV-3)" —
 * velocity/acceleration/type-counts from postDistributionBuckets (the
 * human counters) only; personas contribute ZERO (their rows are never
 * inputs — comment counts come from threadStats.humanCommentCount-shaped
 * aggregates, persona counts excluded by the writers). Qualify + remain
 * (bible l.134, quoted): "≥3 distinct humans + ≥2 human interaction
 * types"; cooldown rows cool out instead of hard-dropping.
 *
 * DECISIONS-LOCKED #11: baselines/cooldowns config-keyed (vibing.*),
 * calibration_pending defaults.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const VIBING_CONFIG_VERSION = "calibration_pending.v1";

const MIN_DISTINCT_HUMANS = 3; // quoted qualifier
const MIN_INTERACTION_TYPES = 2; // quoted qualifier
const COOLDOWN_HOURS = 6; // flagged default (vibing.cooldownHours)

/** Interaction-type diversity from a bucket row: how many of
 *  {valuable, replies, saves, reads} are non-zero — human types only. */
function interactionTypeCount(bucket: any): number {
  let n = 0;
  if (bucket.valuableWeighted > 0) n += 1;
  if (bucket.replyCount > 0) n += 1;
  if (bucket.saveCount > 0) n += 1;
  if (bucket.qualifiedReads > 0) n += 1;
  return n;
}

export const vibingCompute = internalMutation({
  args: {},
  returns: v.object({ evaluated: v.number(), qualified: v.number(), configVersion: v.string() }),
  handler: async (ctx) => {
    const now = Date.now();
    const recent = await ctx.db
      .query("postDistributionBuckets")
      .withIndex("by_post_bucket")
      .order("desc")
      .take(100); // freshest buckets
    const byPost = new Map<string, any[]>();
    for (const bucket of recent) {
      const list = byPost.get(bucket.postId) ?? [];
      list.push(bucket);
      byPost.set(bucket.postId, list);
    }

    let evaluated = 0;
    let qualified = 0;
    for (const [postId, buckets] of byPost) {
      evaluated += 1;
      const post = (await ctx.db.get(postId as any)) as any;
      if (!post || post.lifecycleStatus !== "published" || post.authorType !== "user") continue;

      const latest = buckets[0];
      const prior = buckets[1];
      const humanCount = latest.distinctCommenterCount + (prior?.distinctCommenterCount ?? 0);
      const types = Math.max(interactionTypeCount(latest), prior ? interactionTypeCount(prior) : 0);
      const currentMomentum = latest.valuableWeighted + latest.replyCount + latest.saveCount;
      const priorMomentum = (prior?.valuableWeighted ?? 0) + (prior?.replyCount ?? 0) + (prior?.saveCount ?? 0);
      const velocity = currentMomentum;
      const acceleration = currentMomentum - priorMomentum;
      const qualifies = humanCount >= MIN_DISTINCT_HUMANS && types >= MIN_INTERACTION_TYPES && acceleration > 0;

      const existing = await ctx.db
        .query("vibingTrends")
        .withIndex("by_object", (q: any) => q.eq("objectType", "post").eq("objectId", postId))
        .unique();
      if (qualifies) {
        qualified += 1;
        const row = {
          objectType: "post" as const,
          objectId: postId,
          trendScore: Math.max(0, acceleration), // integrity multiplier rides postDistributionScores (never doubled here)
          velocity,
          acceleration,
          distinctHumanCount: humanCount,
          interactionTypeCount: types,
          integrityMultiplier: 1,
          enteredAt: existing?.enteredAt ?? now,
          cooldownUntil: undefined,
          status: "trending",
        };
        if (existing) await ctx.db.patch(existing._id, row);
        else await ctx.db.insert("vibingTrends", row);
      } else if (existing && existing.status === "trending") {
        // Fell below the qualifier → cooldown (never a hard drop)
        await ctx.db.patch(existing._id, {
          status: "cooling",
          cooldownUntil: now + COOLDOWN_HOURS * 3_600_000,
        });
      }
    }
    return { evaluated, qualified, configVersion: VIBING_CONFIG_VERSION };
  },
});
