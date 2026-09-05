/**
 * debate — SLICE-P4-14: the debate mechanic (CAP-093/094).
 *
 * CAP-093 Notes (quoted): "type=debate + active + verified member + no
 *   existing vote; unique (userId,postId); persona/editorial votes
 *   excluded from tallies."
 * CAP-094 Notes (quoted): "Atomic." — the vote insert and BOTH tally
 *   patches ride one transaction (cast = insert + increment; change =
 *   decrement-old + increment-new in the same mutation).
 * Contract §5 names no rawEvents — none are written.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "../lib/authz";

const CHOICES = ["agree", "disagree", "abstain"] as const;
type Choice = (typeof CHOICES)[number];

function tallyField(choice: Choice): string {
  return choice === "agree" ? "agreeCount" : choice === "disagree" ? "disagreeCount" : "abstainCount";
}

/** The shared cast/change gate: active debate post + verified member +
 *  persona/editorial exclusion (INV-2 direction — only user authors vote;
 *  persona voters have no userId to pass this gate, and editorial posts
 *  have no debate mechanic to vote on). */
async function gateDebateVote(ctx: any, postId: Id<"posts">): Promise<Id<"users">> {
  await assertCustomerCapability(ctx, "react");
  const userId = (await getAuthUserId(ctx)) as Id<"users">;
  if (!userId) throw new Error("debate: authentication required");
  const post = await ctx.db.get(postId);
  if (!post) throw new Error("debate: post not found");
  if (post.type !== "debate") throw new Error("debate: not a debate post (CAP-093)");
  if (post.lifecycleStatus !== "published") throw new Error("debate: post is not active (CAP-093)");
  if (post.authorType !== "user") {
    throw new Error("debate: persona/editorial debates are not member-votable — their votes are excluded from tallies (CAP-093)");
  }
  return userId;
}

async function extensionRow(ctx: any, postId: Id<"posts">): Promise<any> {
  const row = await ctx.db.query("postDebates").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique();
  if (!row) throw new Error("debate: postDebates row missing");
  return row;
}

/** CAP-093 — cast: no existing vote; insert + increment atomically. */
export const cast = mutation({
  args: { postId: v.id("posts"), choice: v.union(v.literal("agree"), v.literal("disagree"), v.literal("abstain")) },
  handler: async (ctx, args) => {
    const userId = await gateDebateVote(ctx, args.postId);
    const existing = await ctx.db
      .query("debateVotes")
      .withIndex("by_user_post", (q: any) => q.eq("userId", userId).eq("postId", args.postId))
      .unique();
    if (existing) throw new Error("debate.cast: vote already exists — use change (CAP-093/094)");

    const debate = await extensionRow(ctx, args.postId);
    // Atomic (CAP-094): insert + tally patch in one transaction
    await ctx.db.insert("debateVotes", { postId: args.postId, userId, choice: args.choice, createdAt: Date.now() });
    await ctx.db.patch(debate._id, { [tallyField(args.choice)]: (debate[tallyField(args.choice)] ?? 0) + 1 });
    return { choice: args.choice };
  },
});

/** CAP-094 — change: atomic decrement-old + increment-new. */
export const change = mutation({
  args: { postId: v.id("posts"), choice: v.union(v.literal("agree"), v.literal("disagree"), v.literal("abstain")) },
  handler: async (ctx, args) => {
    const userId = await gateDebateVote(ctx, args.postId);
    const existing = await ctx.db
      .query("debateVotes")
      .withIndex("by_user_post", (q: any) => q.eq("userId", userId).eq("postId", args.postId))
      .unique();
    if (!existing) throw new Error("debate.change: no existing vote — use cast (CAP-093)");
    if (existing.choice === args.choice) return { choice: args.choice, unchanged: true };

    const debate = await extensionRow(ctx, args.postId);
    // Atomic (CAP-094): one transaction moves the tally across choices
    await ctx.db.patch(existing._id, { choice: args.choice });
    await ctx.db.patch(debate._id, {
      [tallyField(existing.choice as Choice)]: Math.max(0, (debate[tallyField(existing.choice as Choice)] ?? 0) - 1),
      [tallyField(args.choice)]: (debate[tallyField(args.choice)] ?? 0) + 1,
    });
    return { choice: args.choice };
  },
});
