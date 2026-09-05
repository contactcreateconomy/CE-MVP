import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Batch-syncs denormalized author fields (authorName, authorHandle, authorImage)
 * on all forumPosts by a given profile. Processes 100 posts per run and
 * self-chains via ctx.scheduler.runAfter until all posts are updated.
 * This avoids hitting Convex's execution time / transaction limits for
 * prolific authors with many posts.
 */
export const syncAuthorDenormalization = internalMutation({
  args: {
    profileId: v.id("forumProfiles"),
    authorPatch: v.object({
      authorName: v.optional(v.string()),
      authorHandle: v.optional(v.string()),
      authorImage: v.optional(v.string()),
    }),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, { profileId, authorPatch, cursor }) => {
    const page = await ctx.db
      .query("forumPosts")
      .withIndex("by_author", (q) => q.eq("authorProfileId", profileId))
      .paginate({ numItems: 100, cursor });

    const cleaned = Object.fromEntries(
      Object.entries(authorPatch).filter(([, val]) => val !== undefined),
    );

    if (Object.keys(cleaned).length > 0) {
      for (const post of page.page) {
        await ctx.db.patch(post._id, cleaned);
      }
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.forum.jobs.syncAuthorDenormalization, {
        profileId,
        authorPatch,
        cursor: page.continueCursor,
      });
    }

    return null;
  },
});

/**
 * Reconcile sharded upvote/view counters with the denormalized `forumPosts`
 * fields. Sums all shards per entity and patches the post document.
 * Runs on a 10-minute cron.
 */
export const reconcileUpvoteCounts = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.null(),
  handler: async (ctx, { cursor }) => {
    const shardPage = await ctx.db
      .query("forumCounterShards")
      .paginate({ numItems: 200, cursor: cursor ?? null });

    // Group by entityId and counterType
    const sums = new Map<string, number>();
    for (const shard of shardPage.page) {
      const key = `${shard.entityId}:${shard.counterType}`;
      sums.set(key, (sums.get(key) ?? 0) + shard.count);
    }

    // Patch posts with accurate counts
    for (const [key, total] of sums) {
      const [entityId, counterType] = key.split(":");
      if (counterType === "upvotes") {
        const post = await ctx.db.get(entityId as Id<"forumPosts">);
        if (post) {
          await ctx.db.patch(post._id, { upvotes: total });
        }
      } else if (counterType === "views") {
        const post = await ctx.db.get(entityId as Id<"forumPosts">);
        if (post) {
          await ctx.db.patch(post._id, { views: total });
        }
      }
    }

    if (!shardPage.isDone) {
      await ctx.scheduler.runAfter(0, internal.forum.jobs.reconcileUpvoteCounts, {
        cursor: shardPage.continueCursor,
      });
    }

    return null;
  },
});

const HELP_TO_QA_BATCH_SIZE = 100;

/**
 * Batches the help -> qa migration so it can finish on larger datasets without
 * exhausting a single mutation's document read/write budget.
 */
export const migrateHelpToQaBatch = internalMutation({
  args: {
    postCursor: v.union(v.string(), v.null()),
    richThreadCursor: v.union(v.string(), v.null()),
    categoryPayloadCursor: v.union(v.string(), v.null()),
  },
  returns: v.object({
    postsPatched: v.number(),
    richThreadsPatched: v.number(),
    categoryPayloadsPatched: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, { postCursor, richThreadCursor, categoryPayloadCursor }) => {
    let postsPatched = 0;
    let richThreadsPatched = 0;
    let categoryPayloadsPatched = 0;

    const postPage = await ctx.db
      .query("forumPosts")
      .withIndex("by_category", (q) => q.eq("category", "help"))
      .paginate({ numItems: HELP_TO_QA_BATCH_SIZE, cursor: postCursor });
    for (const post of postPage.page) {
      await ctx.db.patch(post._id, { category: "qa" });
      postsPatched++;
    }

    const richThreadPage = await ctx.db
      .query("forumRichThreads")
      .paginate({ numItems: HELP_TO_QA_BATCH_SIZE, cursor: richThreadCursor });
    for (const richThread of richThreadPage.page) {
      const payload = richThread.payload as Record<string, unknown>;
      if (payload.category === "help") {
        const nextPayload = { ...richThread.payload, category: "qa" } as typeof richThread.payload;
        await ctx.db.patch(richThread._id, { payload: nextPayload });
        richThreadsPatched++;
      }
    }

    const categoryPayloadPage = await ctx.db
      .query("forumCategoryPayloads")
      .paginate({ numItems: HELP_TO_QA_BATCH_SIZE, cursor: categoryPayloadCursor });
    for (const categoryPayload of categoryPayloadPage.page) {
      if (categoryPayload.category === "help") {
        await ctx.db.patch(categoryPayload._id, { category: "qa" });
        categoryPayloadsPatched++;
      }
    }

    const hasMore = !postPage.isDone || !richThreadPage.isDone || !categoryPayloadPage.isDone;
    if (hasMore) {
      await ctx.scheduler.runAfter(0, internal.forum.jobs.migrateHelpToQaBatch, {
        postCursor: postPage.isDone ? null : postPage.continueCursor,
        richThreadCursor: richThreadPage.isDone ? null : richThreadPage.continueCursor,
        categoryPayloadCursor: categoryPayloadPage.isDone ? null : categoryPayloadPage.continueCursor,
      });
    } else {
      const oldCategory = await ctx.db
        .query("forumCategories")
        .withIndex("by_key", (q) => q.eq("key", "help"))
        .unique();
      if (oldCategory) {
        await ctx.db.delete(oldCategory._id);
      }
    }

    return {
      postsPatched,
      richThreadsPatched,
      categoryPayloadsPatched,
      hasMore,
    };
  },
});

/**
 * Aggregate the previous day's analytics events into daily stats.
 * Powers future admin dashboards without expensive real-time aggregations.
 */
export const aggregateDailyAnalytics = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const yesterdayStart = now - oneDayMs;
    const yesterdayDate = new Date(yesterdayStart).toISOString().slice(0, 10);

    // Scan events from the past 24 hours by iterating over known event types
    const eventTypes = ["post_created", "comment_created", "upvote_added", "post_bookmarked"];
    const allEvents = [];
    for (const eventType of eventTypes) {
      const batch = await ctx.db
        .query("forumAnalyticsEvents")
        .withIndex("by_eventType_createdAt", (q) =>
          q.eq("eventType", eventType).gte("createdAt", yesterdayStart),
        )
        .collect();
      allEvents.push(...batch);
    }

    // Group by eventType + category
    const groups = new Map<string, { eventType: string; category: string | undefined; count: number }>();
    for (const event of allEvents) {
      const key = `${event.eventType}:${event.category ?? "_all"}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count++;
      } else {
        groups.set(key, { eventType: event.eventType, category: event.category, count: 1 });
      }
    }

    // Write aggregated stats
    for (const [, agg] of groups) {
      await ctx.db.insert("forumDailyStats", {
        date: yesterdayDate,
        category: agg.category,
        eventType: agg.eventType,
        count: agg.count,
      });
    }

    return null;
  },
});
