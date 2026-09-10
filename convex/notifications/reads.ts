/**
 * notifications — SLICE-P7T-01: CAP-568/386 — the canonical list-read +
 * mark-read (the P1-02 schema contract; the bible bullet already filled
 * by the 2026-08-29 F-18 correction pass — consumed, not redesigned).
 *
 * CAP-568 Notes (quoted): "Recipient-private: returns only the
 *   authenticated member's own notifications. Ordering newest-first."
 * CAP-386 (quoted): "mark read" — writes notifications.readAt.
 * Contract §1 (quoted): "a member must never read/mutate another
 *   member's records."
 * DEC-P13: no Might-shame copy — kind labels carry no comparative
 *   ranking language (enforced at the writers).
 * V5 ownership line (quoted): the /notifications surface NEVER reads
 *   activityLedger — Journal reads stay P5-07.
 * Mute-toggle (OQ#3) and delete/clear (OQ#4) have no CAPs — not built.
 * Cursor pagination (OQ#6 page-size unnamed) — implementation-local
 *   initialNumItems=30 flagged, not a product number.
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export const INITIAL_NUM_ITEMS = 30; // implementation-local (OQ#6) — flagged, not a product number

export const list = query({
  args: { cursor: v.optional(v.string()), numItems: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { page: [], cursor: null }; // anonymous = empty (member-private)

    const numItems = Math.min(args.numItems ?? INITIAL_NUM_ITEMS, 100);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q: any) =>
        q.eq("recipientUserId", userId).eq("status", "unread"))
      .order("desc")
      .take(numItems + 1);
    const read = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q: any) =>
        q.eq("recipientUserId", userId).eq("status", "read"))
      .order("desc")
      .take(numItems + 1);
    // newest-first across unread+read
    const merged = [...rows, ...read]
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, numItems);
    const hasMore = rows.length + read.length > numItems;
    return {
      page: merged.map((n: any) => ({
        id: n._id,
        notificationType: n.notificationType,
        objectType: n.objectType,
        objectId: n.objectId,
        actorCount: n.actorUserIds.length,
        eventCount: n.eventCount,
        status: n.status,
        readAt: n.readAt ?? null,
        createdAt: n.createdAt,
      })),
      cursor: hasMore ? `n:${merged[merged.length - 1]?.createdAt ?? 0}` : null,
      unreadCount: rows.length,
    };
  },
});

/** CAP-386 markRead — recipient-private (own rows only). */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.object({ read: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("notifications.markRead: authentication required");
    const n = await ctx.db.get(args.notificationId);
    if (!n) throw new Error("notifications.markRead: not found");
    if (n.recipientUserId !== userId) {
      throw new Error("notifications.markRead: not your notification"); // never another member's records
    }
    if (n.readAt) return { read: true }; // idempotent
    await ctx.db.patch(args.notificationId, {
      readAt: Date.now(),
      status: "read",
      updatedAt: Date.now(),
    });
    return { read: true };
  },
});
