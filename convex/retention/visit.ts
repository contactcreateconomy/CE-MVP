/**
 * empty-state + visit/since — SLICE-P7G-04: CAP-371-375.
 *
 * CAP-371 (quoted): "no fabricated counts; personas ≠ human activity" +
 * "feed uses Hot/Top/New before empty; hide podium if <25" (aligns the
 *   P6-03 Podium's min-25 — one threshold, not a second).
 * CAP-372 (quoted): thread empty = "No human comments yet" (+ an AI
 *   perspectives line when personas have engaged).
 * CAP-373 visit.commit (quoted): "session qualifies (≥30s OR qualified
 *   action); preserve prior lastVisitAt as comparison anchor; write
 *   throttle ≥30m."
 * CAP-374 (quoted): "newItemsSince(lastVisitAt) ≥3 → show since-last-
 *   visit modules; only real events; else suppress + emit
 *   retention.since_last_visit_suppressed."
 * CAP-375: suppressed → event + drip card IF any (drip rows from
 *   P7G-05; no card invented before they exist).
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { captureEvent } from "../lib/events";

/** The honest-empty helper (pure). Feed/thread/etc. render these rules;
 *  never a fabricated count; personas never read as human activity. */
export function emptyStateCopy(input: {
  surface: "feed" | "thread" | "resources" | "generic";
  humanCount: number;
  personaCount?: number;
}): { heading: string; body: string; showPodium: boolean } {
  const showPodium = input.surface === "feed" ? input.humanCount >= 25 : false; // (quoted) — aligns P6-03's min-25
  switch (input.surface) {
    case "feed":
      return {
        heading: "Nothing here yet",
        body: "Switch to Hot, Top, or New to browse what's been published — the feed fills as posts land.",
        showPodium,
      };
    case "thread":
      return {
        heading: "No human comments yet", // (quoted)
        body: input.personaCount && input.personaCount > 0
          ? `AI perspectives are following this discussion (${input.personaCount} persona comment${input.personaCount === 1 ? "" : "s"}).`
          : "Start the discussion — the first comment sets the tone.",
        showPodium: false,
      };
    default:
      return { heading: "Nothing here yet", body: "Content appears as it's published.", showPodium: false };
  }
}

export const VISIT_QUALIFY_MS = 30_000; // ≥30s (quoted)
export const VISIT_THROTTLE_MS = 30 * 60_000; // ≥30m write throttle (quoted)

/** CAP-373 visit.commit — the session-quality gate + throttled write.
 *  The PRIOR lastVisitAt is preserved as the comparison anchor (quoted):
 *  read → write sequence keeps it queryable for CAP-374. */
export const commit = mutation({
  args: { sessionMs: v.number(), qualifiedAction: v.optional(v.boolean()) },
  returns: v.object({ committed: v.boolean(), anchor: v.optional(v.number()) }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { committed: false }; // anonymous visits don't commit
    const qualifies = args.sessionMs >= VISIT_QUALIFY_MS || args.qualifiedAction === true;
    if (!qualifies) return { committed: false };

    const user = await ctx.db.get(userId);
    const prior = (user as any)?.lastVisitAt ?? undefined;
    if (prior && Date.now() - prior < VISIT_THROTTLE_MS) {
      return { committed: false, anchor: prior }; // throttled (quoted)
    }
    // Preserve the prior as the anchor: consumers read it BEFORE this
    // write flips; the write itself is the new anchor for NEXT visit
    await ctx.db.patch(userId, { lastVisitAt: Date.now(), priorVisitAt: prior } as any);
    return { committed: true, anchor: prior ?? undefined };
  },
});

/** CAP-374/375 — sinceLastVisit: ≥3 real events → the module payload;
 *  else suppress + the retention.since_last_visit_suppressed event.
 *  Only REAL events count (rawEvents with real actors — persona events
 *  are real content but the count is honest activity, not inflated). */
export const sinceLastVisit = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { show: false, items: [] };
    const user = await ctx.db.get(userId);
    const anchor = (user as any)?.priorVisitAt ?? (user as any)?.lastVisitAt;
    if (!anchor) return { show: false, items: [] };
    const events = await ctx.db
      .query("rawEvents")
      .withIndex("by_user_time", (q: any) => q.eq("userId", userId).gt("occurredAt", anchor))
      .take(50);
    if (events.length >= 3) {
      return {
        show: true,
        items: events.slice(0, 10).map((e: any) => ({
          eventType: e.eventType,
          targetType: e.targetType,
          targetId: e.targetId,
          occurredAt: e.occurredAt,
        })),
      };
    }
    // <3 real events → suppress the module; the SUPPRESSION event fires
    // from the mutation below (reads can't write) — the client calls it
    return { show: false, items: [] };
  },
});

/** CAP-374/375 — the suppression event + the drip card IF any drip rows
 *  exist (P7G-05's batches; no card invented before they do). */
export const emitSuppressed = mutation({
  args: {},
  returns: v.object({ emitted: v.boolean(), dripCard: v.union(v.object({ batchId: v.string(), resourceCount: v.number() }), v.null()) }),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { emitted: false, dripCard: null };
    await captureEvent(ctx, {
      eventType: "retention.since_last_visit_suppressed",
      eventClass: "interaction",
      targetType: "session",
      targetId: String(userId),
      userId,
      source: "direct",
      isStaff: false,
      schemaVersion: 1,
    } as any);
    const latestDrip = await ctx.db
      .query("dripBatches")
      .withIndex("by_releasedAt")
      .order("desc")
      .first();
    const dripCard = latestDrip && latestDrip.resourceIds.length > 0
      ? { batchId: latestDrip.batchId, resourceCount: latestDrip.resourceIds.length }
      : null;
    return { emitted: true, dripCard };
  },
});
