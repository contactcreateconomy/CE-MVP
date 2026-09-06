/**
 * distributions — SLICE-P6-12: CAP-565 — auto-create the member's
 * Distribution immediately after bootstrap completes.
 *
 * Register Notes (quoted): "Guarantees CAP-299's '1:1
 *   Distribution-per-member' invariant holds before any member could
 *   reach /u/[handle]." and "NOT the same atomic transaction" as
 * CAP-002/003 — so this runs as a follow-on mutation right after
 * finalizeBootstrap, not inside it. M12 economy enrichment
 * (might/levels/awards writes) is Phase 7; this creates the row only,
 * in its initial state (dormant, zeroed, no store yet).
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/** Initial state per the bible l.343 shape: single-owner, zero reach,
 *  level floor, dormant until M12 computes anything. */
export const INITIAL_LEVEL = "orbit"; // signal.level floor literal (M12 owns the ladder)

/** The plain transaction body — shared by the internalMutation entry and
 *  bootstrap's follow-on call (CAP-565: same-tx guarantees, cross-module
 *  so no self-reference circularity). */
export async function ensureDistributionTx(ctx: any, userId: any): Promise<{ distributionId: any; created: boolean }> {
  const existing = await ctx.db
    .query("distributions")
    .withIndex("by_owner", (q: any) => q.eq("ownerUserId", userId))
    .unique();
  if (existing) return { distributionId: existing._id, created: false };

  const user = await ctx.db.get(userId);
  const distributionId = await ctx.db.insert("distributions", {
    ownerUserId: userId,
    ownershipMode: "single",
    name: user?.displayName ?? user?.email?.split("@")[0] ?? "Distribution",
    memberCount: 0,
    reachFactor: 0,
    activeSignalFactor: 0,
    might: 0,
    mightPercentile: 0,
    currentLevel: INITIAL_LEVEL,
    highestLevelAchieved: INITIAL_LEVEL,
    awardsCount: 0,
    dormant: true,
    createdAt: Date.now(),
  });
  return { distributionId, created: true };
}

export const ensureDistribution = internalMutation({
  args: { userId: v.id("users") },
  returns: v.object({ distributionId: v.id("distributions"), created: v.boolean() }),
  handler: async (ctx, args) => ensureDistributionTx(ctx, args.userId),
});
