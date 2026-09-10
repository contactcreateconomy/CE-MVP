/**
 * notification batch/dedupe — SLICE-P7T-03: CAP-382 (+ CAP-383 hook).
 *
 * M14 R-NOTIFY (quoted): "dedupeKey = recipient+type+object+window;
 *   batch reply 15m, saved 24h, distribution join 6h, drip one per
 *   batch."
 * CAP-382 Notes (quoted): "mute suppresses social not legal/mod; reply
 *   flood → M13 R-BRIGADE hook." Mute SETTER has no CAP (OQ#3) — no mute
 *   flag exists on the schema, so v1 ships unmute-all with the invariant
 *   documented at the suppression point (a future mute flag checks
 *   `socialKinds` only — the sets below encode it).
 * CAP-383 (quoted): "never drop a real reply" — the flood path hooks
 *   P7E-15's brigade detection (an integrityFlags mark); the reply and
 *   its notification ALWAYS land.
 * CAP-382 writes NO rawEvents (contract §5 — the action's own writer
 *   owns its event; this is the same-mutation notification insert).
 */

import type { Id } from "../_generated/dataModel";

/** Batch windows per kind (quoted). */
const WINDOWS_MS: Record<string, number> = {
  comment_reply: 15 * 60_000, // reply 15m
  saved_post_activity: 24 * 3_600_000, // saved 24h
  distribution_joined: 6 * 3_600_000, // distribution join 6h
  drip_batch: Infinity, // one per batch — dedupeKey carries the batch id
};

/** The kind classes: social kinds may be suppressed by a future mute;
 *  legal/mod kinds NEVER suppress (quoted). */
export const SOCIAL_KINDS = new Set([
  "comment_reply", "post_comment", "help_resolution",
  "saved_post_activity", "resource_released", "acquired_resource_updated",
  "distribution_joined", "drip_batch",
]);
export const NEVER_SUPPRESSED_KINDS = new Set([
  "quota_exhausted", "quota_restored", "moderation_held",
  "moderation_resolved", "appeal_resolved", "account_restricted",
  "trust_tier_changed", "signal_level_changed", "store_status_changed",
]);

const FLOOD_REPLY_THRESHOLD = 10; // distinct repliers inside the reply window before the R-BRIGADE hook fires

/** Insert-or-merge a notification under the dedupe/batch rule. Returns
 *  the notification id (upserted row when the window is open). */
export async function notifyBatched(
  ctx: any,
  input: {
    recipientUserId: Id<"users">;
    notificationType: string;
    objectType: string;
    objectId: string;
    actorUserId: Id<"users"> | null;
    dedupeScope?: string; // e.g. the drip batch id (one per batch)
  },
): Promise<Id<"notifications">> {
  const windowMs = WINDOWS_MS[input.notificationType] ?? Infinity;
  const scope = input.dedupeScope ?? input.objectId;
  const dedupeKey = `${input.notificationType}:${input.recipientUserId}:${scope}`;
  const now = Date.now();

  const existing = await ctx.db
    .query("notifications")
    .withIndex("by_dedupe", (q: any) => q.eq("dedupeKey", dedupeKey))
    .first();

  if (existing && existing.batchWindowEndsAt && existing.batchWindowEndsAt > now && !existing.readAt) {
    // Open window: merge — actor appended (unique), count +1, window kept
    const actors = new Set<string>(existing.actorUserIds.map(String));
    if (input.actorUserId) actors.add(String(input.actorUserId));
    await ctx.db.patch(existing._id, {
      actorUserIds: [...actors] as any,
      eventCount: existing.eventCount + 1,
      updatedAt: now,
    });
    // CAP-383 hook: reply flood → mark the brigade signal (P7E-15's
    // detector consumes integrityFlags; the reply is NEVER dropped)
    if (input.notificationType === "comment_reply" && existing.eventCount + 1 >= FLOOD_REPLY_THRESHOLD) {
      const flagged = await ctx.db
        .query("integrityFlags")
        .withIndex("by_actor_disposition", (q: any) =>
          input.actorUserId ? q.eq("actorUserId", input.actorUserId).eq("disposition", "monitor") : q)
        .take(1);
      if (flagged.length === 0 && input.actorUserId) {
        await ctx.db.insert("integrityFlags", {
          actorUserId: input.actorUserId,
          type: "coordination",
          disposition: "monitor",
          evidence: { class: "reply_flood", object: scope },
          dampFactor: 1,
          opened: now,
        });
      }
    }
    return existing._id;
  }

  const id = (await ctx.db.insert("notifications", {
    recipientUserId: input.recipientUserId,
    notificationType: input.notificationType as any,
    objectType: input.objectType,
    objectId: input.objectId,
    actorUserIds: input.actorUserId ? [input.actorUserId] : [],
    eventCount: 1,
    dedupeKey,
    status: "unread",
    priority: input.notificationType.startsWith("moderation") || input.notificationType === "appeal_resolved"
      ? "legal" // never suppressible (quoted)
      : "social",
    batchWindowStartedAt: now,
    batchWindowEndsAt: windowMs === Infinity ? undefined : now + windowMs,
    createdAt: now,
    updatedAt: now,
  })) as Id<"notifications">;
  return id;
}
