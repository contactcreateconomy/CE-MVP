/**
 * legitimacy — SLICE-P7E-05: CAP-283/284.
 *
 * CAP-283 (quoted): "legitimacy.recompute geometric-means 7 bounded
 *   components per actor" / "geometric mean: one near-zero tanks whole
 *   score." bible l.336 (quoted): "hidden [0,1] per actor; NEVER
 *   surfaced by any query" — no query this module feeds ever returns
 *   `value` or `componentScores`; the award path multiplies it in and
 *   stores only the resulting signalValue.
 * CAP-284 (quoted): "Legitimacy snapshot-on-cast written onto rawEvents
 *   at cast time" — the snapshot helper patches `trustTierAtEvent` (the
 *   rawEvents snapshot field, bible l.122); confirmed fraud overrides
 *   the snapshot via clawback correctness (CAP-278 path).
 *
 * DECISIONS-LOCKED #11: the seven component formulas ship as versioned
 * conservative defaults (calibration_pending.v1), each bounded [0,1] and
 * derived only from rawEvents/edge counts the platform already records.
 * Real calibration post-beta = Readiness Category 8. Degraded inputs are
 * flagged in-code (device_independence has no device data at MVP-1 →
 * neutral 1.0 until a provider lands — an honest floor, not invention).
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

const WINDOW_DAYS = 90;
const MODEL_VERSION = "legitimacy.v1";

export type Components = {
  account_age: number;
  activity_diversity: number;
  interaction_diversity: number;
  content_quality: number;
  temporal_humanity: number;
  device_independence: number;
  reciprocity_balance: number;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Geometric mean — one near-zero component tanks the whole score
 *  (quoted). All components are clamped into [0,1] first. */
export function geometricMean(c: Components): number {
  const vals = Object.values(c).map(clamp01);
  const product = vals.reduce((a, b) => a * Math.max(b, 1e-9), 1); // 1e-9 floor keeps log finite; a true 0 still tanks
  return Math.pow(product, 1 / vals.length);
}

/** The seven conservative component formulas from a bounded event sample.
 *  calibration_pending.v1 — each input is a rawEvents/edge count the
 *  platform already records; no invented signals. */
export function computeComponents(input: {
  daysSinceSignup: number;
  distinctEventTypes: number;
  distinctTargets: number;
  passedShare: number; // own content moderation-passed share; 1 when no moderation data
  distinctDays: number;
  reciprocalShare: number; // reciprocal / total interactions; 1 when no interactions
  deviceData: boolean;
  sharedDeviceScore: number;
}): Components {
  return {
    // account_age: saturates at 180d
    account_age: clamp01(input.daysSinceSignup / 180),
    // activity_diversity: distinct event types over the catalog's ~12
    activity_diversity: clamp01(input.distinctEventTypes / 12),
    // interaction_diversity: distinct interacted targets
    interaction_diversity: clamp01(input.distinctTargets / 20),
    // content_quality: moderation-passed share of own content
    content_quality: clamp01(input.passedShare),
    // temporal_humanity: human-plausible spread of active days
    temporal_humanity: clamp01(input.distinctDays / 14),
    // device_independence: no device data at MVP-1 → neutral 1.0 (flagged
    // degraded; sharedDeviceScore applies when edges carry it)
    device_independence: input.deviceData ? clamp01(1 - input.sharedDeviceScore) : 1,
    // reciprocity_balance: balanced give-and-take; purely one-way → ~0
    reciprocity_balance: clamp01(input.reciprocalShare * 2),
  };
}

/** CAP-284 — snapshot-on-cast: the value multiplied into an event's
 *  weight at cast time, persisted onto the rawEvent (trustTierAtEvent is
 *  the bible's snapshot slot, l.122). Falls back to 0.5 for unknown
 *  actors — fail-closed direction: unknown ≠ full trust. */
export async function snapshotLegitimacy(ctx: any, actorUserId: Id<"users">): Promise<number> {
  const row = await ctx.db
    .query("legitimacyScores")
    .withIndex("by_actor", (q: any) => q.eq("actorUserId", actorUserId))
    .unique();
  return row ? row.value : 0.5;
}

/** legitimacy.recompute cron — bounded batch over recently-active users. */
export const recompute = internalMutation({
  args: {},
  returns: v.object({ recomputed: v.number() }),
  handler: async (ctx) => {
    const since = Date.now() - WINDOW_DAYS * 24 * 3_600_000;
    // Recently-active actors = users with events in the window (bounded)
    const recent = await ctx.db
      .query("rawEvents")
      .withIndex("by_user_time", (q: any) => q.gte("occurredAt", since))
      .order("desc")
      .take(500);
    const actorIds = [...new Set(recent.map((e: any) => e.userId).filter(Boolean))] as Id<"users">[];
    let recomputed = 0;
    for (const actorUserId of actorIds) {
      const events = await ctx.db
        .query("rawEvents")
        .withIndex("by_user_time", (q: any) => q.eq("userId", actorUserId).gte("occurredAt", since))
        .take(200);

      const user = await ctx.db.get(actorUserId);
      const distinctEventTypes = new Set(events.map((e: any) => e.eventType)).size;
      const distinctTargets = new Set(events.map((e: any) => `${e.targetType}:${e.targetId}`)).size;
      const distinctDays = new Set(
        events.map((e: any) => new Date(e.occurredAt).toISOString().slice(0, 10)),
      ).size;

      // Reciprocity from the actor's outbound edge counts
      const edges = await ctx.db
        .query("engagementEdges")
        .withIndex("by_pair_window", (q: any) => q.eq("fromUserId", actorUserId))
        .take(20);
      const total = edges.reduce((a: number, e: any) => a + e.interactionCount, 0);
      const recip = edges.reduce((a: number, e: any) => a + e.reciprocalCount, 0);
      const reciprocalShare = total > 0 ? recip / total : 1;

      // Content quality: own content moderation pass share (bounded)
      const ownPosts = await ctx.db
        .query("posts")
        .withIndex("by_author_type_authorUserId", (q: any) =>
          q.eq("authorType", "user").eq("authorUserId", actorUserId))
        .take(30);
      const passed = ownPosts.filter(
        (p: any) => p.moderationStatus === "passed" || p.moderationStatus === "not_required",
      ).length;
      const passedShare = ownPosts.length > 0 ? passed / ownPosts.length : 1;

      const components = computeComponents({
        daysSinceSignup: user?._creationTime
          ? (Date.now() - user._creationTime) / 24 / 3_600_000
          : 30,
        distinctEventTypes,
        distinctTargets,
        passedShare,
        distinctDays,
        reciprocalShare,
        deviceData: false, // no device provider at MVP-1 (flagged degraded)
        sharedDeviceScore: 0,
      });
      const value = geometricMean(components);

      const existing = await ctx.db
        .query("legitimacyScores")
        .withIndex("by_actor", (q: any) => q.eq("actorUserId", actorUserId))
        .unique();
      const flaggedLow = value < 0.3;
      if (existing) {
        await ctx.db.patch(existing._id, {
          value, componentScores: components, modelVersion: MODEL_VERSION,
          flaggedLow, computedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("legitimacyScores", {
          actorUserId, value, componentScores: components, modelVersion: MODEL_VERSION,
          flaggedLow, computedAt: Date.now(),
        });
      }
      recomputed += 1;
    }
    return { recomputed };
  },
});
