/**
 * listItems — SLICE-P4-14: the list mechanic (CAP-095/096/097).
 *
 * CAP-095 Notes (quoted): "Content ≤200 chars; static_creator → only
 *   author edits."
 * CAP-096 — remove-own + voteCount recompute (count derived from
 *   listItemVotes — bible l.93).
 * CAP-097 Notes (quoted): "Unique (userId, postListItemId); voteCount
 *   maintained in same mutation."
 * Fence OQ#7: whether vote-toggle is suppressed in static_creator is
 *   unstated — NOT invented; the author-edit lock ships, votes stay open.
 * Contract §5 names no rawEvents — none are written.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "../lib/authz";

/** Community item writes require community_ranked mode + a verified member. */
async function gateListMember(ctx: any, postListId: Id<"postLists">): Promise<{ userId: Id<"users">; list: any }> {
  await assertCustomerCapability(ctx, "create_post");
  const userId = (await getAuthUserId(ctx)) as Id<"users">;
  if (!userId) throw new Error("listItems: authentication required");
  const list = await ctx.db.get(postListId);
  if (!list) throw new Error("listItems: postLists row not found");
  if (list.mode !== "community_ranked") {
    throw new Error(`listItems: mode "${list.mode}" is not member-editable (CAP-095: static_creator → only author edits)`);
  }
  return { userId, list };
}

/** CAP-095 — add: content ≤200 chars; community_ranked verified members. */
export const add = mutation({
  args: { postListId: v.id("postLists"), content: v.string() },
  handler: async (ctx, args) => {
    const content = args.content.trim();
    if (!content) throw new Error("listItems.add: content required");
    if (content.length > 200) throw new Error(`listItems.add: content ${content.length} chars > 200 (CAP-095)`);

    const { userId } = await gateListMember(ctx, args.postListId);
    const existing = await ctx.db
      .query("postListItems")
      .withIndex("by_postListId_sortOrder", (q: any) => q.eq("postListId", args.postListId))
      .collect();
    const item = await ctx.db.insert("postListItems", {
      postListId: args.postListId,
      content,
      createdByUserId: userId,
      voteCount: 0,
      sortOrder: existing.length,
      createdAt: Date.now(),
    });
    return { item };
  },
});

/** CAP-096 — remove own item; voteCount discipline is moot post-removal but
 *  the votes themselves are deleted with it (derived tally, bible l.93). */
export const remove = mutation({
  args: { itemId: v.id("postListItems") },
  handler: async (ctx, args) => {
    await assertCustomerCapability(ctx, "create_post");
    const userId = (await getAuthUserId(ctx)) as Id<"users">;
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("listItems.remove: not found");
    const list = await ctx.db.get(item.postListId as Id<"postLists">);
    // static_creator → only the author edits; community_ranked → the item's
    // own creator may remove it (CAP-095/096's remove-own)
    const isItemAuthor = item.createdByUserId === userId;
    const isPostAuthor = list ? await isListPostAuthor(ctx, list, userId) : false;
    if (list?.mode === "community_ranked" && !isItemAuthor && !isPostAuthor) {
      throw new Error("listItems.remove: only the item's creator (or the post author) may remove it (CAP-096)");
    }
    if (list?.mode !== "community_ranked" && !isPostAuthor) {
      throw new Error("listItems.remove: static_creator → only the author edits (CAP-095)");
    }
    const votes = await ctx.db
      .query("listItemVotes")
      .withIndex("by_item", (q: any) => q.eq("postListItemId", args.itemId))
      .collect();
    for (const vote of votes) await ctx.db.delete(vote._id);
    await ctx.db.delete(args.itemId);
    return { removed: true };
  },
});

async function isListPostAuthor(ctx: any, list: any, userId: Id<"users">): Promise<boolean> {
  const post = await ctx.db.get(list.postId as Id<"posts">);
  return post?.authorUserId === userId;
}

/** CAP-097 — vote toggle: unique (userId, postListItemId); voteCount
 *  maintained in the SAME mutation. */
export const toggleVote = mutation({
  args: { itemId: v.id("postListItems") },
  handler: async (ctx, args) => {
    await assertCustomerCapability(ctx, "react");
    const userId = (await getAuthUserId(ctx)) as Id<"users">;
    if (!userId) throw new Error("listItems.toggleVote: authentication required");
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("listItems.toggleVote: not found");

    const existing = await ctx.db
      .query("listItemVotes")
      .withIndex("by_user_item", (q: any) => q.eq("userId", userId).eq("postListItemId", args.itemId))
      .unique();

    // Same-mutation tally (CAP-097): the vote write and the count patch are
    // one transaction — display-state and record never diverge.
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.itemId, { voteCount: Math.max(0, (item.voteCount ?? 0) - 1) });
      return { voted: false };
    }
    await ctx.db.insert("listItemVotes", { postListItemId: args.itemId, userId, createdAt: Date.now() });
    await ctx.db.patch(args.itemId, { voteCount: (item.voteCount ?? 0) + 1 });
    return { voted: true };
  },
});
