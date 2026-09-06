/**
 * explore — SLICE-P6-02: CAP-188 — exploration.refresh.
 *
 * CAP-188 (quoted): "Never operator curation (INV-4)." The queue is the
 * exposure-deficit computation: posts whose qualified exposure trails
 * their tier target get explorationDeficit updated so P6-03's assembly
 * can inject them. Dynamic-rate shape (bible l.131): launch-high tapering
 * by age tier; cold-start author boost; anti-bubble cross-injection is
 * the assembly's job (this writer only maintains the deficits). Personas
 * excluded by construction (member posts only).
 *
 * DECISIONS-LOCKED #11: taper constants are config-keyed
 * (feed.exploration.*) with calibration_pending defaults.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const EXPLORATION_CONFIG_VERSION = "calibration_pending.v1";

/** Age tiers (quoted "refresh tiers by age"): fresh posts get a high
 *  exposure target that tapers; the numbers are flagged defaults. */
const TIERS = [
  { maxAgeHours: 24, target: 40 }, // launch-high
  { maxAgeHours: 72, target: 20 },
  { maxAgeHours: 168, target: 10 },
  { maxAgeHours: Number.MAX_SAFE_INTEGER, target: 5 }, // tapered floor
];

function exposureTargetFor(ageHours: number): number {
  return TIERS.find((t) => ageHours <= t.maxAgeHours)!.target;
}

export const explorationRefresh = internalMutation({
  args: {},
  returns: v.object({ updated: v.number(), configVersion: v.string() }),
  handler: async (ctx) => {
    const now = Date.now();
    const scores = await ctx.db
      .query("postDistributionScores")
      .withIndex("by_lastEligibleInteractionAt")
      .order("desc")
      .take(100); // bounded pass — the freshest cohort
    let updated = 0;
    for (const row of scores) {
      const post = await ctx.db.get(row.postId);
      if (!post || post.lifecycleStatus !== "published") continue;
      if (post.authorType !== "user") continue; // member posts only (l.131)
      const ageHours = (now - post.createdAt) / 3_600_000;
      const target = exposureTargetFor(ageHours);
      const deficit = Math.max(0, target - row.qualifiedExposureCount);
      let state = await ctx.db
        .query("feedExplorationState")
        .withIndex("by_postId", (q: any) => q.eq("postId", row.postId))
        .unique();
      const eligibilityStatus = deficit > 0 ? "eligible" : "completed";
      if (state) {
        if (state.eligibilityStatus !== eligibilityStatus || state.qualifiedExposureTarget !== target) {
          await ctx.db.patch(state._id, {
            qualifiedExposureTarget: target,
            eligibilityStatus,
            completedAt: eligibilityStatus === "completed" ? (state.completedAt ?? now) : undefined,
          });
          updated += 1;
        }
      } else {
        await ctx.db.insert("feedExplorationState", {
          postId: row.postId,
          qualifiedExposureTarget: target,
          qualifiedExposureCount: row.qualifiedExposureCount,
          insertionCount: 0,
          lastInsertedAt: now,
          eligibilityStatus,
          completedAt: eligibilityStatus === "completed" ? now : undefined,
        });
        updated += 1;
      }
      if (row.explorationDeficit !== deficit) {
        await ctx.db.patch(row._id, { explorationDeficit: deficit });
      }
    }
    return { updated, configVersion: EXPLORATION_CONFIG_VERSION };
  },
});
