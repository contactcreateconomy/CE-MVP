/**
 * quota notifications — SLICE-P7T-02: CAP-378/379.
 *
 * CAP-378 (quoted): on blocked acquire, insert `quota_exhausted` + set
 *   the `users.lastQuotaExhaustedPeriodKey` marker + a same-mutation
 *   rawEvent (CAP-436 discipline). "No 'almost gone' nag."
 * CAP-379 (quoted): "no per-timezone midnight cron; in-app only" — on an
 *   authenticated SESSION START, marker set ∧ ≠ current periodKey ∧ no
 *   unread `quota_restored` → emit ONCE + clear the marker (cleared only
 *   after the successful emit). The register names "session start/
 *   visit.commit"; visit.commit's full machine is P7G-04 — session-start
 *   is the in-app trigger this slice consumes.
 */

import type { Id } from "../_generated/dataModel";
import { captureEvent } from "../lib/events";

export async function onQuotaExhausted(ctx: any, userId: Id<"users">, periodKey: string): Promise<void> {
  const now = Date.now();
  await ctx.db.insert("notifications", {
    recipientUserId: userId,
    notificationType: "quota_exhausted",
    objectType: "resource_quota",
    objectId: periodKey,
    actorUserIds: [],
    eventCount: 1,
    dedupeKey: `quota_exhausted:${userId}:${periodKey}`,
    status: "unread",
    priority: "transactional",
    createdAt: now,
    updatedAt: now,
  });
  // The restored-emit marker (CAP-379) — same-mutation with the notify
  await ctx.db.patch(userId, { lastQuotaExhaustedPeriodKey: periodKey } as any);
  // Same-mutation rawEvent (CAP-436) — quota class, consent-never-gated
  await captureEvent(ctx, {
    eventType: "quota.exhausted",
    eventClass: "outcome",
    targetType: "session",
    targetId: String(userId),
    userId,
    source: "direct",
    isStaff: false,
    schemaVersion: 1,
  } as any);
}

/** The session-start check — call from the authenticated session entry
 *  (the app shell's member hydration). Emits at most once per period. */
export async function onSessionStart(ctx: any, userId: Id<"users">, currentPeriodKey: string): Promise<void> {
  const user = await ctx.db.get(userId);
  const marker = (user as any)?.lastQuotaExhaustedPeriodKey;
  if (!marker || marker === currentPeriodKey) return;
  // Already an unread quota_restored? Never re-emit (CAP-379: once)
  const unreadRestored = await ctx.db
    .query("notifications")
    .withIndex("by_dedupe", (q: any) => q.eq("dedupeKey", `quota_restored:${userId}:${currentPeriodKey}`))
    .first();
  if (unreadRestored && !unreadRestored.readAt) return;

  const now = Date.now();
  await ctx.db.insert("notifications", {
    recipientUserId: userId,
    notificationType: "quota_restored",
    objectType: "resource_quota",
    objectId: currentPeriodKey,
    actorUserIds: [],
    eventCount: 1,
    dedupeKey: `quota_restored:${userId}:${currentPeriodKey}`,
    status: "unread",
    priority: "transactional",
    createdAt: now,
    updatedAt: now,
  });
  // Marker cleared ONLY after the successful emit (quoted)
  await ctx.db.patch(userId, { lastQuotaExhaustedPeriodKey: undefined } as any);
}
