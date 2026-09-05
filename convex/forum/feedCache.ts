import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { FEED_HOT_RANK_WINDOW } from "./limits";
import type { Doc } from "../_generated/dataModel";

function viralityScoreDoc(p: Doc<"forumPosts">) {
  return p.upvotes * 1.2 + p.commentsCount * 2 + p.views * 0.06;
}

export const recomputeHotFeed = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const raw = await ctx.db
      .query("forumPosts")
      .withIndex("by_createdAt")
      .order("desc")
      .take(FEED_HOT_RANK_WINDOW);

    const scored = [...raw].sort((a, b) => viralityScoreDoc(b) - viralityScoreDoc(a));
    const topIds = scored.slice(0, 48).map((p) => p._id as string);

    const existing = await ctx.db
      .query("forumFeedCache")
      .withIndex("by_key", (q) => q.eq("cacheKey", "hot:all"))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { postIds: topIds, computedAt: Date.now() });
    } else {
      await ctx.db.insert("forumFeedCache", {
        cacheKey: "hot:all",
        postIds: topIds,
        computedAt: Date.now(),
      });
    }

    return null;
  },
});

export const getCachedFeedPostIds = query({
  args: { cacheKey: v.string() },
  returns: v.union(v.null(), v.object({
    postIds: v.array(v.string()),
    computedAt: v.number(),
  })),
  handler: async (ctx, { cacheKey }) => {
    const row = await ctx.db
      .query("forumFeedCache")
      .withIndex("by_key", (q) => q.eq("cacheKey", cacheKey))
      .unique();
    if (!row) return null;
    return { postIds: row.postIds, computedAt: row.computedAt };
  },
});
