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
 *   initialNumItems=30 flagged, not a product number. The walk is a
 *   keyset on the by_user_unread index order (createdAt desc, _id desc),
 *   the same boundary-cursor idiom as feed.list; unreadCount is a full
 *   count over the unread index (never capped by the page size — the
 *   badge renders the raw number).
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireUser } from "../lib/authz";

export const INITIAL_NUM_ITEMS = 30; // implementation-local (OQ#6) — flagged, not a product number

/** Cursor = `<createdAtMs>:<notificationId>` — the last served row under
 *  the walk order (createdAt desc, then the index's implicit _id desc).
 *  Tolerates the pre-fix `n:<createdAtMs>` shape by treating it as
 *  no-boundary (that format never produced a working walk anyway). */
type WalkCursor = { createdAt: number; id: string };

/** Exported for the cursor-walk tests (the same boundary format the
 *  client round-trips through list's cursor arg). */
export function parseCursor(raw: string | undefined): WalkCursor | null {
  if (!raw) return null;
  const body = raw.startsWith("n:") ? raw.slice(2) : raw;
  const sep = body.lastIndexOf(":");
  if (sep <= 0) return null;
  const createdAt = Number(body.slice(0, sep));
  const id = body.slice(sep + 1);
  if (!Number.isFinite(createdAt) || id.length === 0) return null;
  return { createdAt, id };
}

export const list = query({
  args: { cursor: v.optional(v.string()), numItems: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { page: [], cursor: null, unreadCount: 0 }; // anonymous = empty (member-private)

    const numItems = Math.max(1, Math.min(args.numItems ?? INITIAL_NUM_ITEMS, 100));
    const boundary = parseCursor(args.cursor);

    /** One status branch of by_user_unread, newest-first, strictly below
     *  the cursor. The index range starts AT the boundary, so deep pages
     *  never re-read served rows; same-ms ties carry the _id tie-break in
     *  a filter over the (tiny) boundary-ms group — the walk order the
     *  merge sort below reproduces. */
    const branchBelowCursor = async (status: string): Promise<any[]> => {
      if (!boundary) {
        return ctx.db
          .query("notifications")
          .withIndex("by_user_unread", (q: any) => q.eq("recipientUserId", userId).eq("status", status))
          .order("desc")
          .take(numItems + 1);
      }
      const older = await ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q: any) =>
          q.eq("recipientUserId", userId).eq("status", status).lt("createdAt", boundary.createdAt))
        .order("desc")
        .take(numItems + 1);
      const ties = await ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q: any) =>
          q.eq("recipientUserId", userId).eq("status", status).eq("createdAt", boundary.createdAt))
        .order("desc")
        .filter((q: any) => q.lt(q.field("_id"), boundary.id))
        .take(numItems + 1);
      return [...older, ...ties];
    };

    // Accurate unread count — a full count over the unread index, never
    // capped by the page size (repo count idiom: collect + length).
    const unreadAll = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q: any) => q.eq("recipientUserId", userId).eq("status", "unread"))
      .order("desc")
      .collect();

    const unreadRows = boundary
      ? await branchBelowCursor("unread")
      : unreadAll.slice(0, numItems + 1); // first page reuses the count read
    const readRows = await branchBelowCursor("read");

    // newest-first across unread+read — the SAME total order the cursor
    // walk filters on (createdAt desc, _id desc), so a page boundary can
    // never reorder or re-serve rows.
    const merged = [...unreadRows, ...readRows]
      .sort((a: any, b: any) => b.createdAt - a.createdAt || (b._id < a._id ? 1 : -1))
      .slice(0, numItems + 1);
    const page = merged.slice(0, numItems);
    const hasMore = merged.length > numItems;
    const last = page[page.length - 1];

    /** Deep-link target for /discussions/<slug> — post/comment objects
     *  only (distribution/drip_batch/resource_quota have no thread
     *  surface). Comment rows hop to their host post. Prefers the stored
     *  postSeoMeta.slug (canonical route key, CAP-051) when one exists;
     *  member posts without one fall back to the raw posts._id, which the
     *  [slug] resolver tolerates (posts/detail B2 cutover fallback). */
    const slugMemo = new Map<string, string | null>();
    const threadRef = async (objectType: string, objectId: string): Promise<string | null> => {
      const key = `${objectType}:${objectId}`;
      if (slugMemo.has(key)) return slugMemo.get(key) ?? null;
      let postId: string | null = null;
      if (objectType === "post") {
        postId = objectId;
      } else if (objectType === "comment") {
        try {
          const comment = await ctx.db.get(objectId as Id<"comments">);
          postId = comment ? String(comment.postId) : null;
        } catch {
          postId = null; // non-id string — no thread ref
        }
      }
      let ref: string | null = null;
      if (postId) {
        ref = postId;
        try {
          const seo = await ctx.db
            .query("postSeoMeta")
            .withIndex("by_postId", (q: any) => q.eq("postId", postId as Id<"posts">))
            .unique();
          if (seo) ref = seo.slug;
        } catch {
          /* keep the raw-id fallback */
        }
      }
      slugMemo.set(key, ref);
      return ref;
    };

    return {
      page: await Promise.all(page.map(async (n: any) => ({
        id: n._id,
        notificationType: n.notificationType,
        objectType: n.objectType,
        objectId: n.objectId,
        actorCount: n.actorUserIds.length,
        eventCount: n.eventCount,
        status: n.status,
        readAt: n.readAt ?? null,
        createdAt: n.createdAt,
        postSlug: await threadRef(n.objectType, n.objectId),
      }))),
      cursor: hasMore && last ? `${last.createdAt}:${last._id}` : null,
      unreadCount: unreadAll.length,
    };
  },
});

/** CAP-386 markRead — recipient-private (own rows only). */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.object({ read: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx, "notifications.markRead");
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
