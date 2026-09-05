import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { query } from "../_generated/server";
import { DISCUSSION_RELATED_CAP, DISCUSSION_TRENDING_CAP } from "./limits";
import {
  cappedRelatedSlugs,
  cappedTrendingSlugs,
  coalesceRichThreadPayloadForClient,
  hydrateRelatedThreads,
  loadProfilesForIds,
  type RichThreadPayload,
} from "./discussionRouteHelpers";
import { viewerFlagsForPostIds } from "./feedQueries";
import { postDocToPost, profileToUser } from "./helpers";

export const getDiscussionRouteState = query({
  args: {
    pathSlug: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { pathSlug }) => {
    const userId = await getAuthUserId(ctx);
    const categories = (await ctx.db.query("forumCategories").collect()).map((r) => ({
      key: r.key,
      name: r.name,
      icon: r.icon,
      description: r.description,
      primaryColor: r.primaryColor,
      lockedByDefault: r.lockedByDefault,
      pointsToUnlock: r.pointsToUnlock,
    }));

    // 1) Try rich thread first
    const richRow = await ctx.db
      .query("forumRichThreads")
      .withIndex("by_slug", (q) => q.eq("slug", pathSlug))
      .unique();

    if (richRow?.payload) {
      const thread = coalesceRichThreadPayloadForClient(richRow.payload as RichThreadPayload);

      const userIds = new Set<string>();
      userIds.add(String(thread.authorId));
      const comments = thread.comments as unknown[] | undefined;
      if (Array.isArray(comments)) {
        for (const c of comments) {
          if (c && typeof c === "object" && "authorId" in c) {
            userIds.add(String((c as { authorId: string }).authorId));
          }
        }
      }
      const rail = thread.insightRail as { topContributor?: { userId: string } } | undefined;
      if (rail?.topContributor?.userId) {
        userIds.add(rail.topContributor.userId);
      }

      const users = await loadProfilesForIds(ctx, userIds);

      const authorDoc = await ctx.db.get(
        String(thread.authorId) as import("../_generated/dataModel").Id<"forumProfiles">,
      );
      const author = authorDoc ? profileToUser(authorDoc) : null;
      const category = categories.find((c) => c.key === thread.category) ?? null;

      // Look up the corresponding forumPosts row for viewer interaction flags
      const postRow = await ctx.db
        .query("forumPosts")
        .withIndex("by_slug", (q) => q.eq("slug", pathSlug))
        .first();
      let viewerHasUpvoted = false;
      let viewerHasBookmarked = false;
      let postId: string | undefined;
      if (postRow) {
        const { favoritePostIds, upvotePostIds } = await viewerFlagsForPostIds(ctx, userId, [postRow._id]);
        viewerHasUpvoted = upvotePostIds.has(postRow._id);
        viewerHasBookmarked = favoritePostIds.has(postRow._id);
        postId = postRow._id as string;
      }

      return {
        kind: "rich" as const,
        thread: {
          ...thread,
          postId,
          viewerHasUpvoted,
          viewerHasBookmarked,
        },
        author,
        category,
        related: [],
        trending: [],
        users,
        categories,
      };
    }

    // 2) Try regular post — construct a thread-shaped response
    const postByPath = await ctx.db
      .query("forumPosts")
      .withIndex("by_slug", (q) => q.eq("slug", pathSlug))
      .first();

    if (postByPath) {
      if (postByPath.moderationStatus === "removed" || postByPath.moderationStatus === "shadow_removed") {
        return { kind: "not_found" as const };
      }

      const { favoritePostIds, upvotePostIds } = await viewerFlagsForPostIds(ctx, userId, [postByPath._id]);
      const isFavorited = favoritePostIds.has(postByPath._id);
      const viewerHasUpvote = upvotePostIds.has(postByPath._id);
      const postShape = postDocToPost(postByPath, { isFavorited, viewerHasUpvote });
      const authorDoc = await ctx.db.get(postByPath.authorProfileId);
      const author = authorDoc ? profileToUser(authorDoc) : null;
      const category = categories.find((c) => c.key === postShape.category) ?? null;

      const commentDocs = await ctx.db
        .query("forumPostComments")
        .withIndex("by_post_createdAt", (q) => q.eq("postId", postByPath._id))
        .order("desc")
        .take(200);
      const comments = [...commentDocs].reverse().map((c) => ({
        id: c._id as string,
        threadId: postByPath._id as string,
        parentId: (c.parentId as string | undefined) ?? null,
        authorId: c.authorProfileId as string,
        body: c.body,
        createdAt: new Date(c.createdAt).toISOString(),
        upvotes: c.upvotes,
        downvotes: 0,
      }));

      const userIds = new Set<string>();
      userIds.add(postShape.authorId);
      for (const c of comments) {
        userIds.add(c.authorId);
      }
      const users = await loadProfilesForIds(ctx, userIds);

      // Load per-category structured payload for real user posts
      const categoryPayload = await ctx.db
        .query("forumCategoryPayloads")
        .withIndex("by_post", (q) => q.eq("postId", postByPath._id))
        .unique();

      // Construct a thread-shaped object so DiscussionPageClient can render it
      const thread = {
        id: postByPath._id as string,
        slug: postShape.slug,
        category: postShape.category,
        title: postShape.title,
        body: postShape.body,
        authorId: postShape.authorId,
        createdAt: postShape.createdAt,
        views: postShape.views,
        upvotes: postShape.upvotes,
        bookmarks: 0,
        tags: [] as string[],
        aiSummary: "",
        comments,
        insightRail: {
          summary: "",
          keyAgreements: [] as string[],
          openQuestions: [] as { text: string; anchorId: string }[],
          topContributor: { userId: "", excerpt: "" },
        },
        relatedSlugs: [] as string[],
        trendingSlugs: [] as string[],
        categoryBody: (categoryPayload?.payload ?? {}) as Record<string, unknown>,
        postId: postByPath._id as string,
        viewerHasUpvoted: viewerHasUpvote,
        viewerHasBookmarked: isFavorited,
      };

      return {
        kind: "rich" as const,
        thread,
        author,
        category,
        related: [],
        trending: [],
        users,
        categories,
      };
    }

    return { kind: "not_found" as const };
  },
});

export const getRepresentativeThreadByCategory = query({
  args: { categoryKey: v.string() },
  returns: v.any(),
  handler: async (ctx, { categoryKey }) => {
    const userId = await getAuthUserId(ctx);
    const categories = (await ctx.db.query("forumCategories").collect()).map((r) => ({
      key: r.key,
      name: r.name,
      icon: r.icon,
      description: r.description,
      primaryColor: r.primaryColor,
      lockedByDefault: r.lockedByDefault,
      pointsToUnlock: r.pointsToUnlock,
    }));

    const post = await ctx.db
      .query("forumPosts")
      .withIndex("by_category_createdAt", (q) => q.eq("category", categoryKey))
      .order("desc")
      .filter((q) =>
        q.and(
          q.neq(q.field("moderationStatus"), "removed"),
          q.neq(q.field("moderationStatus"), "shadow_removed"),
        ),
      )
      .first();

    if (!post) return null;

    const { favoritePostIds, upvotePostIds } = await viewerFlagsForPostIds(ctx, userId, [post._id]);
    const isFavorited = favoritePostIds.has(post._id);
    const viewerHasUpvote = upvotePostIds.has(post._id);
    const postShape = postDocToPost(post, { isFavorited, viewerHasUpvote });
    const authorDoc = await ctx.db.get(post.authorProfileId);
    const author = authorDoc ? profileToUser(authorDoc) : null;
    const category = categories.find((c) => c.key === postShape.category) ?? null;

    const commentDocs = await ctx.db
      .query("forumPostComments")
      .withIndex("by_post_createdAt", (q) => q.eq("postId", post._id))
      .order("desc")
      .take(200);
    const comments = [...commentDocs].reverse().map((c) => ({
      id: c._id as string,
      threadId: post._id as string,
      parentId: (c.parentId as string | undefined) ?? null,
      authorId: c.authorProfileId as string,
      body: c.body,
      createdAt: new Date(c.createdAt).toISOString(),
      upvotes: c.upvotes,
      downvotes: 0,
    }));

    const userIds = new Set<string>();
    userIds.add(postShape.authorId);
    for (const c of comments) userIds.add(c.authorId);
    const users = await loadProfilesForIds(ctx, userIds);

    const categoryPayload = await ctx.db
      .query("forumCategoryPayloads")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .unique();

    const thread = {
      id: post._id as string,
      slug: postShape.slug,
      category: postShape.category,
      title: postShape.title,
      body: postShape.body,
      authorId: postShape.authorId,
      createdAt: postShape.createdAt,
      views: postShape.views,
      upvotes: postShape.upvotes,
      bookmarks: 0,
      tags: [] as string[],
      aiSummary: "",
      comments,
      insightRail: {
        summary: "",
        keyAgreements: [] as string[],
        openQuestions: [] as { text: string; anchorId: string }[],
        topContributor: { userId: "", excerpt: "" },
      },
      relatedSlugs: [] as string[],
      trendingSlugs: [] as string[],
      categoryBody: (categoryPayload?.payload ?? {}) as Record<string, unknown>,
      postId: post._id as string,
      viewerHasUpvoted: viewerHasUpvote,
      viewerHasBookmarked: isFavorited,
    };

    return { kind: "rich" as const, thread, author, category, related: [], trending: [], users, categories };
  },
});

export const getDiscussionSidebarData = query({
  args: {
    threadSlug: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { threadSlug }) => {
    const richRow = await ctx.db
      .query("forumRichThreads")
      .withIndex("by_slug", (q) => q.eq("slug", threadSlug))
      .unique();

    if (!richRow?.payload) {
      return { related: [], trending: [], sidebarUsers: [] };
    }

    const thread = richRow.payload as RichThreadPayload;
    const relatedSlugs = cappedRelatedSlugs(thread);
    const trendingSlugs = cappedTrendingSlugs(thread);

    const related = await hydrateRelatedThreads(ctx, relatedSlugs, DISCUSSION_RELATED_CAP);
    const trending = await hydrateRelatedThreads(ctx, trendingSlugs, DISCUSSION_TRENDING_CAP);

    const userIds = new Set<string>();
    for (const r of related) {
      userIds.add(r.authorId);
    }
    for (const t of trending) {
      userIds.add(t.authorId);
    }
    const rail = thread.insightRail as { topContributor?: { userId: string } } | undefined;
    if (rail?.topContributor?.userId) {
      userIds.add(rail.topContributor.userId);
    }

    const sidebarUsers = await loadProfilesForIds(ctx, userIds);

    return { related, trending, sidebarUsers };
  },
});
