/**
 * profile metrics — SLICE-P7E-09: CAP-300/301/313/312 (+ CAP-281/298/303
 * read-side rules).
 *
 * CAP-281 (quoted): "The public-facing 'Signals' number in the
 *   Reach·Signals·Awards triad is the **Active** count." Total/Pending
 *   are persisted (P7E-06) but NEVER returned here as "Signals".
 * CAP-303 (quoted): reachFactor "never shown publicly" — this query
 *   projects memberCount ONLY.
 * CAP-312 (quoted): "opt-out hides Level/progress/badges AND
 *   Reach/Signals — the full public economy-metrics surface" — the
 *   opted-out profile returns economyHidden: true; math unchanged.
 * CAP-313 (quoted): "same ladder render for both [anonymous, member]" —
 *   ONE query, no viewer branches on content.
 * CAP-298 (quoted): "two currencies in different tables; never
 *   cross-reference" — Reads are distributions/signalSummary/
 *   signalLevelDefinitions/distributionLevelAssignments/badges ONLY
 *   (never leaderboardProjections / recognitionEvents).
 * H5: sealed keys (legitimacy.medianTarget, signal.eventWeights,
 *   signal.attributionSplit, trust.weightCap) appear nowhere.
 * CAP-300 (quoted): join is "never auto-joined from thread/comment/
 *   download; legitimacy snapshot captured."
 * CAP-301 (quoted): leave = "log-scaled reach effect (anti-suppression)"
 *   — leftAt set; the reach job treats left members as negligible.
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability, requireUser } from "../lib/authz";
import { notifyBatched } from "../notifications/batch";
import { currentSeasonTx } from "../signal/promoteDemote";

export const getMetrics = query({
  args: { handle: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_usernameNormalized", (q: any) => q.eq("usernameNormalized", args.handle.toLowerCase()))
      .unique();
    if (!user) return { state: "not_found" };

    // CAP-312 full hide (writer = CAP-552 on P5-06; read-side here)
    if ((user as any).leaderboardOptOut === true) {
      return { state: "ok", economyHidden: true };
    }

    const dist = await ctx.db
      .query("distributions")
      .withIndex("by_owner", (q: any) => q.eq("ownerUserId", user._id))
      .unique();
    // Never-null guarantee: CAP-565 + the F-11 backfill (P7E-02)
    if (!dist) return { state: "ok", economyHidden: false, triad: { reach: 0, signals: 0, awards: 0 }, ladder: null, membership: null };

    const summary = await ctx.db
      .query("signalSummary")
      .withIndex("by_subject", (q: any) => q.eq("subjectType", "distribution").eq("subjectId", dist._id))
      .unique();

    // The Awards shelf = finalized+revoked badges (bible l.340 — revoked
    // stays public; inactivity/level-drop never revokes)
    const shelf = await ctx.db
      .query("badges")
      .withIndex("by_subject_state", (q: any) =>
        q.eq("subjectType", "distribution").eq("subjectId", dist._id))
      .take(50);

    // Ladder: current + below + next + silhouette above (CAP-313 render)
    const season = await currentSeasonTx(ctx); // derived — never a hardcoded season number
    let ladder: any = null;
    if (season) {
      const defs = (await ctx.db
        .query("signalLevelDefinitions")
        .withIndex("by_season_level", (q: any) => q.eq("seasonId", season._id))
        .take(10)) as any[];
      const order = ["orbit", "comet", "moon", "planet", "star", "supernova", "nebula", "galaxy", "universe", "multiverse"];
      const byLevel = new Map(defs.map((d) => [d.level, d]));
      const currentIdx = Math.max(0, order.indexOf(dist.currentLevel));
      const next = byLevel.get(order[currentIdx + 1]) ?? null;
      const above = order.slice(currentIdx + (next ? 2 : 1))
        .map((lvl) => byLevel.get(lvl))
        .filter(Boolean);
      // Three-component progress (quoted): Reach% · Signal% · sustained-days
      const progress = {
        reachPct: Math.min(1, dist.memberCount / 100), // cold-start normalization: 100 members = full reach component (calibration_pending.v1)
        signalPct: next?.fixedMightThreshold
          ? Math.min(1, dist.might / next.fixedMightThreshold)
          : 0, // thresholds await calibration — honest 0 until then
        sustainedDays: 0, // P7E-18's promotion job owns the sustained counter
      };
      ladder = {
        current: dist.currentLevel,
        revealCurrent: byLevel.get(order[currentIdx])?.revealState ?? "visible",
        below: order.slice(0, currentIdx).map((l) => ({ level: l, revealState: "visible" })),
        next: next ? { level: next.level, revealState: next.revealState, identityText: next.identityText || next.level } : null,
        silhouetteAbove: above.map((d) => ({ level: d.level, revealState: "silhouette" })),
        progress,
      };
    }

    // Viewer membership state (join is deliberate — CAP-300)
    const viewerId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    let membership: { joined: boolean } | null = null;
    if (viewerId && viewerId !== user._id) {
      const row = await ctx.db
        .query("distributionMemberships")
        .withIndex("by_distribution_member", (q: any) =>
          q.eq("distributionId", dist._id).eq("memberUserId", viewerId))
        .unique();
      membership = { joined: Boolean(row && !row.leftAt) };
    }

    return {
      state: "ok",
      economyHidden: false,
      // The public triad (quoted): Reach · Signals · Awards — Signals is
      // activeSignals ONLY; Total/Pending never projected here
      triad: {
        reach: dist.memberCount,
        signals: summary?.activeSignals ?? 0,
        awards: dist.awardsCount,
      },
      awardsShelf: shelf
        .filter((b: any) => b.state === "finalized" || b.state === "revoked")
        .map((b: any) => ({ label: b.label, type: b.type, revoked: b.state === "revoked" })),
      ladder,
      membership,
    };
  },
});

/** CAP-300 distribution.join — deliberate, never auto; legitimacy
 *  snapshot captured at join (quoted). */
export const join = mutation({
  args: { handle: v.string() },
  returns: v.object({ joined: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("distribution.join: authentication required");
    await assertCustomerCapability(ctx, "comment"); // member capability
    const owner = await ctx.db
      .query("users")
      .withIndex("by_usernameNormalized", (q: any) => q.eq("usernameNormalized", args.handle.toLowerCase()))
      .unique();
    if (!owner) throw new Error("distribution.join: unknown distribution owner");
    if (owner._id === userId) throw new Error("distribution.join: you already own your own Distribution");
    const dist = await ctx.db
      .query("distributions")
      .withIndex("by_owner", (q: any) => q.eq("ownerUserId", owner._id))
      .unique();
    if (!dist) throw new Error("distribution.join: distribution not found");

    const legitimacy = await ctx.db
      .query("legitimacyScores")
      .withIndex("by_actor", (q: any) => q.eq("actorUserId", userId))
      .unique();
    const existing = await ctx.db
      .query("distributionMemberships")
      .withIndex("by_distribution_member", (q: any) =>
        q.eq("distributionId", dist._id).eq("memberUserId", userId))
      .unique();
    if (existing) {
      if (!existing.leftAt) return { joined: true }; // idempotent
      // re-join: new snapshot, eligibility re-derived
      await ctx.db.patch(existing._id, {
        leftAt: undefined,
        joinedAt: Date.now(),
        memberLegitimacySnapshot: legitimacy?.value ?? 0.05,
        eligibilityStatus: "qualified",
      });
      return { joined: true };
    }
    await ctx.db.insert("distributionMemberships", {
      distributionId: dist._id,
      memberUserId: userId,
      memberLegitimacySnapshot: legitimacy?.value ?? 0.05, // CAP-300 snapshot (quoted); bots at 0.05 negligible (CAP-303)
      eligibilityStatus: "qualified",
      joinedAt: Date.now(),
    });
    // SLICE-P7T-03 (CAP-382): join notification — 6h window to the owner
    await notifyBatched(ctx, {
      recipientUserId: owner._id,
      notificationType: "distribution_joined",
      objectType: "distribution",
      objectId: dist._id,
      actorUserId: userId,
    });
    return { joined: true };
  },
});

/** CAP-301 distribution.leave — log-scaled negligible reach effect
 *  (anti-suppression, quoted): leftAt set; the reach job drops the
 *  member from the clean count while the Σlegitimacy contribution
 *  decays to ~0 rather than subtracting. */
export const leave = mutation({
  args: { handle: v.string() },
  returns: v.object({ left: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx, "distribution.leave");
    const owner = await ctx.db
      .query("users")
      .withIndex("by_usernameNormalized", (q: any) => q.eq("usernameNormalized", args.handle.toLowerCase()))
      .unique();
    if (!owner) throw new Error("distribution.leave: unknown distribution owner");
    const dist = await ctx.db
      .query("distributions")
      .withIndex("by_owner", (q: any) => q.eq("ownerUserId", owner._id))
      .unique();
    if (!dist) throw new Error("distribution.leave: distribution not found");
    const existing = await ctx.db
      .query("distributionMemberships")
      .withIndex("by_distribution_member", (q: any) =>
        q.eq("distributionId", dist._id).eq("memberUserId", userId))
      .unique();
    if (!existing || existing.leftAt) return { left: true }; // idempotent
    await ctx.db.patch(existing._id, { leftAt: Date.now(), eligibilityStatus: "left" });
    return { left: true };
  },
});
