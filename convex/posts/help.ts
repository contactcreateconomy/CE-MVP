/**
 * help — SLICE-P4-15: the Help mechanic (CAP-098/099).
 *
 * CAP-098 Notes (quoted): "Single accepted; replaces prior; user-Help →
 *   only author; editorial-Help → Editor/Publisher."
 * CAP-099 Notes (quoted): "`help.reopen`."
 * The accept affordance may ship with no visible thread until P5-03
 * (contract OQ#6 — the mutation exists; the UI target arrives with M6's
 * comments). CAP-098 targets a comments id — pre-P5 the arg stays a string
 * the comment engine will own.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "../lib/authz";
import { assertAdminPermission } from "../lib/authz";

async function helpRow(ctx: any, postId: Id<"posts">): Promise<any> {
  const row = await ctx.db.query("postHelps").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique();
  if (!row) throw new Error("help: postHelps row not found");
  return row;
}

/** CAP-098 — accept: single accepted, replaces the prior ref. */
export const accept = mutation({
  args: { postId: v.id("posts"), acceptedCommentId: v.string() },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users">;
    if (!userId) throw new Error("help.accept: authentication required");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("help.accept: post not found");
    if (post.type !== "help") throw new Error("help.accept: not a help post");

    if (post.authorType === "user") {
      // user-Help → post author only (CAP-098)
      await assertCustomerCapability(ctx, "create_post");
      if (post.authorUserId !== userId) throw new Error("help.accept: only the post author may accept (CAP-098)");
    } else {
      // editorial-Help → Editor/Publisher (CAP-098)
      const roles = await assertAdminPermission(ctx);
      if (!roles.some((r) => r === "editor" || r === "publisher" || r === "administrator")) {
        throw new Error("help.accept: Editor/Publisher role required for editorial Help (CAP-098)");
      }
    }

    const row = await helpRow(ctx, args.postId);
    // Single accepted; replaces prior — one patch, no history rows needed
    // (the revision trail lives with the comment engine, Phase 5)
    await ctx.db.patch(row._id, {
      resolvedStatus: "resolved",
      acceptedCommentId: args.acceptedCommentId,
      acceptedByUserId: userId,
      acceptedAt: Date.now(),
    });
    return { resolved: true };
  },
});

/** CAP-099 — reopen → resolvedStatus=open (the prior ref stays readable in
 *  the row's audit fields; CAP-106's read tolerance governs cleared refs). */
export const reopen = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users">;
    if (!userId) throw new Error("help.reopen: authentication required");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("help.reopen: post not found");

    // The same acceptor class may reopen (author for user-Help; editorial
    // roles for editorial-Help — CAP-098's actor split applied symmetrically)
    if (post.authorType === "user") {
      await assertCustomerCapability(ctx, "create_post");
      if (post.authorUserId !== userId) throw new Error("help.reopen: only the post author may reopen");
    } else {
      const roles = await assertAdminPermission(ctx);
      if (!roles.some((r) => r === "editor" || r === "publisher" || r === "administrator")) {
        throw new Error("help.reopen: Editor/Publisher role required");
      }
    }

    const row = await helpRow(ctx, args.postId);
    await ctx.db.patch(row._id, { resolvedStatus: "open" });
    return { resolved: false };
  },
});
