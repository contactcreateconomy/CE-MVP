import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { discussionHrefForPostShape } from "./constants";
import {
  buildFeedBundleFromPosts,
  feedPageSize,
  loadCommentPreviewsForPostIds,
  loadHotRankedPosts,
  resolveUsersForFeed,
  viewerFlagsForPostIds,
} from "./feedQueries";
import { postDocToPost, profileToUser } from "./helpers";
import { SEARCH_MAX_RESULTS_EACH } from "./limits";
import {
  campaignValidator,
  categoryValidator,
  commentValidator,
  feedPageValidator,
  heroSlideValidator,
  leaderboardEntryValidator,
  notificationValidator,
  postValidator,
  searchResultsValidator,
  userSettingsValidator,
  userValidator,
  vibingItemValidator,
} from "./validators";

export const listCategories = query({
  args: {},
  returns: v.array(categoryValidator),
  handler: async (ctx) => {
    const rows = await ctx.db.query("forumCategories").collect();
    return rows.map((r) => ({
      key: r.key,
      name: r.name,
      icon: r.icon,
      description: r.description,
      primaryColor: r.primaryColor,
      lockedByDefault: r.lockedByDefault,
      pointsToUnlock: r.pointsToUnlock,
    }));
  },
});

const feedSort = v.union(
  v.literal("new"),
  v.literal("hot"),
  v.literal("top"),
  v.literal("fav"),
);

/** Paginated feed surface: bounded reads + batched comment previews + viewer flags per page. */
export const listFeedPage = query({
  args: {
    sort: feedSort,
    category: v.optional(v.string()),
    cursor: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
  },
  returns: feedPageValidator,
  handler: async (ctx, { sort, category, cursor, limit: lim }) => {
    const userId = await getAuthUserId(ctx);
    const limit = feedPageSize(lim);

    if (sort === "fav") {
      if (userId === null) {
        return { posts: [], comments: [], users: [], continueCursor: null, isDone: true };
      }
      const uid = userId as Id<"users">;
      const favPage = await ctx.db
        .query("forumFavorites")
        .withIndex("by_user_favoritedAt", (q) => q.eq("userId", uid))
        .order("desc")
        .paginate({ numItems: limit, cursor: cursor ?? null });
      const postDocs = (
        await Promise.all(favPage.page.map((f) => ctx.db.get(f.postId)))
      ).filter((p): p is Doc<"forumPosts"> => p !== null);
      const bundle = await buildFeedBundleFromPosts(ctx, postDocs, userId);
      return {
        ...bundle,
        continueCursor: favPage.isDone ? null : favPage.continueCursor,
        isDone: favPage.isDone,
      };
    }

    if (sort === "hot" || sort === "top") {
      let postDocs: Doc<"forumPosts">[];

      if (!category) {
        // Cache-first: read precomputed hot IDs (~48 reads) instead of scanning 400 posts
        const cached = await ctx.db
          .query("forumFeedCache")
          .withIndex("by_key", (q) => q.eq("cacheKey", "hot:all"))
          .unique();

        if (cached && cached.postIds.length > 0) {
          const fetched = await Promise.all(
            cached.postIds.map((id) => ctx.db.get(id as Id<"forumPosts">)),
          );
          postDocs = fetched
            .filter((p): p is Doc<"forumPosts"> =>
              p !== null
              && p.moderationStatus !== "removed"
              && p.moderationStatus !== "shadow_removed",
            )
            .slice(0, limit);
        } else {
          // Cold start — fall back to full computation
          postDocs = await loadHotRankedPosts(ctx, category, limit);
        }
      } else {
        // Per-category cache not yet implemented
        postDocs = await loadHotRankedPosts(ctx, category, limit);
      }

      const bundle = await buildFeedBundleFromPosts(ctx, postDocs, userId);
      return { ...bundle, continueCursor: null, isDone: true };
    }

    const cat = category?.trim();
    const base =
      cat && cat.length > 0
        ? ctx.db
            .query("forumPosts")
            .withIndex("by_category_createdAt", (q) => q.eq("category", cat))
            .order("desc")
        : ctx.db.query("forumPosts").withIndex("by_createdAt").order("desc");

    const pageResult = await base.paginate({ numItems: limit, cursor: cursor ?? null });
    const bundle = await buildFeedBundleFromPosts(ctx, pageResult.page, userId);
    return {
      ...bundle,
      continueCursor: pageResult.isDone ? null : pageResult.continueCursor,
      isDone: pageResult.isDone,
    };
  },
});

/** Comment previews + users for a bounded set of post ids (search, profile, etc.). */
export const listCommentPreviewsWithUsers = query({
  args: {
    postIds: v.array(v.string()),
    limitPerPost: v.optional(v.number()),
  },
  returns: v.object({
    comments: v.array(commentValidator),
    users: v.array(userValidator),
  }),
  handler: async (ctx, { postIds, limitPerPost }) => {
    const ids = postIds.slice(0, 80).map((id) => id as Id<"forumPosts">);
    const lp = Math.min(Math.max(limitPerPost ?? 6, 1), 12);
    const comments = await loadCommentPreviewsForPostIds(ctx, ids, lp);
    const profileIds = new Set(comments.map((c) => c.authorId));
    const users: ReturnType<typeof profileToUser>[] = [];
    for (const id of profileIds) {
      const doc = await ctx.db.get(id as Id<"forumProfiles">);
      if (doc) {
        users.push(profileToUser(doc));
      }
    }
    return { comments, users };
  },
});

export const getPostsByAuthorProfileId = query({
  args: { profileId: v.string() },
  returns: v.array(postValidator),
  handler: async (ctx, { profileId }) => {
    const userId = await getAuthUserId(ctx);
    const pid = profileId as Id<"forumProfiles">;
    const docs = await ctx.db
      .query("forumPosts")
      .withIndex("by_author", (q) => q.eq("authorProfileId", pid))
      .take(100);
    const { favoritePostIds, upvotePostIds } = await viewerFlagsForPostIds(
      ctx,
      userId,
      docs.map((p) => p._id),
    );
    return docs.map((p) =>
      postDocToPost(p, {
        isFavorited: favoritePostIds.has(p._id),
        viewerHasUpvote: upvotePostIds.has(p._id),
      }),
    );
  },
});

export const getPostBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), postValidator),
  handler: async (ctx, { slug }) => {
    const userId = await getAuthUserId(ctx);
    const doc = await ctx.db
      .query("forumPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!doc) {
      return null;
    }
    const { favoritePostIds, upvotePostIds } = await viewerFlagsForPostIds(ctx, userId, [doc._id]);
    return postDocToPost(doc, {
      isFavorited: favoritePostIds.has(doc._id),
      viewerHasUpvote: upvotePostIds.has(doc._id),
    });
  },
});

export const getThreadBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), v.any()), // Rich thread payload — shape varies, validated at read time
  handler: async (ctx, { slug }) => {
    const row = await ctx.db
      .query("forumRichThreads")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    return row?.payload ?? null;
  },
});

export const getCommentsByPostId = query({
  args: {
    postId: v.string(),
    cursor: v.optional(v.union(v.string(), v.null())),
    numItems: v.optional(v.number()),
  },
  returns: v.object({
    comments: v.array(commentValidator),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, { postId, cursor, numItems }) => {
    const pid = postId as Id<"forumPosts">;
    const pageSize = Math.min(Math.max(numItems ?? 30, 1), 100);
    const page = await ctx.db
      .query("forumPostComments")
      .withIndex("by_post_createdAt", (q) => q.eq("postId", pid))
      .order("desc")
      .paginate({ numItems: pageSize, cursor: cursor ?? null });
    return {
      comments: page.page.map((c) => ({
        id: c._id as string,
        postId: c.postId as string,
        authorId: c.authorProfileId as string,
        body: c.body,
        createdAt: new Date(c.createdAt).toISOString(),
        upvotes: c.upvotes,
      })),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

export const getProfileByHandle = query({
  args: { handle: v.string() },
  returns: v.union(v.null(), userValidator),
  handler: async (ctx, { handle }) => {
    const h = handle.trim().toLowerCase();
    const doc = await ctx.db
      .query("forumProfiles")
      .withIndex("by_handle", (q) => q.eq("handle", h))
      .unique();
    return doc ? profileToUser(doc) : null;
  },
});

export const getProfileById = query({
  args: { profileId: v.string() },
  returns: v.union(v.null(), userValidator),
  handler: async (ctx, { profileId }) => {
    const doc = await ctx.db.get(profileId as Id<"forumProfiles">);
    return doc ? profileToUser(doc) : null;
  },
});

export const getProfilesByIds = query({
  args: { profileIds: v.array(v.string()) },
  returns: v.array(userValidator),
  handler: async (ctx, { profileIds }) => {
    const out = [];
    const seen = new Set<string>();
    for (const id of profileIds) {
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
      const doc = await ctx.db.get(id as Id<"forumProfiles">);
      if (doc) {
        out.push(profileToUser(doc));
      }
    }
    return out;
  },
});

export const listCampaigns = query({
  args: {},
  returns: v.array(campaignValidator),
  handler: async (ctx) => {
    const rows = await ctx.db.query("forumCampaigns").take(50);
    return rows.map((r) => ({
      id: r._id as string,
      title: r.title,
      description: r.description,
      rewardPoints: r.rewardPoints,
      endsAt: r.endsAt,
      participants: r.participants,
    }));
  },
});

export const getLeaderboardWithUsers = query({
  args: {},
  returns: v.array(leaderboardEntryValidator),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("forumLeaderboard")
      .withIndex("by_rank")
      .order("asc")
      .take(50);
    const out = [];
    for (const r of rows) {
      const profile = await ctx.db.get(r.profileId);
      out.push({
        rank: r.rank,
        userId: r.profileId as string,
        points: r.points,
        weeklyDelta: r.weeklyDelta,
        user: profile ? profileToUser(profile) : null,
      });
    }
    return out;
  },
});

export const listVibingItems = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(vibingItemValidator),
  handler: async (ctx, { limit = 10 }) => {
    const rows = await ctx.db
      .query("forumVibingItems")
      .withIndex("by_sort")
      .order("asc")
      .take(limit);
    return rows.map((r) => ({
      id: r._id as string,
      kind: r.kind,
      label: r.label,
      href: r.href,
      engagedUsers: r.engagedUsers,
    }));
  },
});

export const listNotificationsForViewer = query({
  args: {},
  returns: v.array(notificationValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) {
      return [];
    }
    const rows = await ctx.db
      .query("forumNotifications")
      .withIndex("by_profile_createdAt", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(50);
    return rows.map((r) => ({
      id: r._id as string,
      userId: profile._id as string,
      type: r.type,
      title: r.title,
      message: r.message,
      createdAt: r.createdAt,
      read: r.read,
      postSlug: r.postSlug,
    }));
  },
});

export const getUnreadNotificationCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return 0;
    }
    const profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) {
      return 0;
    }
    // Scan recent notifications and count unread. Cap at 99 to bound work.
    let count = 0;
    const rows = await ctx.db
      .query("forumNotifications")
      .withIndex("by_profile_createdAt", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(100);
    for (const r of rows) {
      if (!r.read) count++;
    }
    return count;
  },
});

export const hasViewerProfile = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return false;
    }
    const profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return profile !== null;
  },
});

export const getViewerProfile = query({
  args: {},
  returns: v.union(v.null(), userValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return profile ? profileToUser(profile) : null;
  },
});

export const getViewerSettings = query({
  args: {},
  returns: userSettingsValidator,
  handler: async (ctx) => {
    const defaults = {
      theme: "dark" as const,
      emailNotifications: true,
      pushNotifications: true,
      hideMatureContent: false,
    };
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return defaults;
    }
    const row = await ctx.db
      .query("forumUserSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!row) {
      return defaults;
    }
    return {
      theme: row.theme,
      emailNotifications: row.emailNotifications,
      pushNotifications: row.pushNotifications,
      hideMatureContent: row.hideMatureContent,
    };
  },
});

export const listHeroSlides = query({
  args: {},
  returns: v.array(heroSlideValidator),
  handler: async (ctx) => {
    const slides = await ctx.db
      .query("forumHeroSlides")
      .withIndex("by_sort")
      .order("asc")
      .take(20);
    const out = [];
    for (const s of slides) {
      const post = await ctx.db
        .query("forumPosts")
        .withIndex("by_legacy_key", (q) => q.eq("legacyKey", s.legacyPostKey))
        .unique();
      if (!post) {
        continue;
      }
      const shape = postDocToPost(post, { isFavorited: false, viewerHasUpvote: false });
      // Resolve coverImage: if it's a storageId (no http prefix), get the serving URL
      let coverImageUrl = shape.coverImage;
      if (coverImageUrl && !coverImageUrl.startsWith("http")) {
        coverImageUrl = (await ctx.storage.getUrl(coverImageUrl as import("../_generated/dataModel").Id<"_storage">)) ?? coverImageUrl;
      }
      out.push({
        id: shape.id,
        slug: shape.slug,
        discussionHref: discussionHrefForPostShape({
          slug: shape.slug,
        }),
        title: shape.title,
        summary: shape.summary,
        coverImage: coverImageUrl,
        reads: shape.views,
        comments: shape.commentsCount,
        shares: s.shares,
        eyebrow: s.eyebrow,
        ctaLabel: s.ctaLabel,
        accentRgb: s.accentRgb,
      });
    }
    return out;
  },
});

export const searchPostsAndUsers = query({
  args: { q: v.string(), categoryFilter: v.optional(v.string()) },
  returns: searchResultsValidator,
  handler: async (ctx, { q, categoryFilter }) => {
    const needle = q.trim().toLowerCase();
    if (!needle) {
      return { posts: [], users: [], comments: [], commentUsers: [] };
    }

    const matchedPostDocs = await ctx.db
      .query("forumPosts")
      .withSearchIndex("search_title", (q2) => {
        const builder = q2.search("title", needle);
        return categoryFilter ? builder.eq("category", categoryFilter) : builder;
      })
      .take(SEARCH_MAX_RESULTS_EACH);

    const bodyMatches = await ctx.db
      .query("forumPosts")
      .withSearchIndex("search_body", (q2) => {
        const builder = q2.search("body", needle);
        return categoryFilter ? builder.eq("category", categoryFilter) : builder;
      })
      .take(SEARCH_MAX_RESULTS_EACH);

    const seenIds = new Set(matchedPostDocs.map((p) => p._id as string));
    for (const p of bodyMatches) {
      if (!seenIds.has(p._id as string)) {
        seenIds.add(p._id as string);
        matchedPostDocs.push(p);
      }
    }
    const finalPosts = matchedPostDocs.slice(0, SEARCH_MAX_RESULTS_EACH);

    const userId = await getAuthUserId(ctx);
    const { favoritePostIds, upvotePostIds } = await viewerFlagsForPostIds(
      ctx,
      userId,
      finalPosts.map((p) => p._id),
    );
    const posts = finalPosts.map((p) =>
      postDocToPost(p, {
        isFavorited: favoritePostIds.has(p._id),
        viewerHasUpvote: upvotePostIds.has(p._id),
      }),
    );

    const profileRows = await ctx.db
      .query("forumProfiles")
      .withSearchIndex("search_name", (q2) => q2.search("name", needle))
      .take(SEARCH_MAX_RESULTS_EACH);
    const users = profileRows.map(profileToUser);

    const comments = await loadCommentPreviewsForPostIds(
      ctx,
      finalPosts.map((p) => p._id),
      6,
    );
    const commentUsers = await resolveUsersForFeed(ctx, finalPosts, comments);

    return { posts, users, comments, commentUsers };
  },
});

/** Load all direct replies to a specific comment (one level of nesting). */
export const getCommentReplies = query({
  args: {
    parentId: v.id("forumPostComments"),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      postId: v.string(),
      authorId: v.string(),
      body: v.string(),
      createdAt: v.string(),
      upvotes: v.number(),
      parentId: v.union(v.string(), v.null()),
      author: v.union(userValidator, v.null()),
    }),
  ),
  handler: async (ctx, { parentId }) => {
    const replies = await ctx.db
      .query("forumPostComments")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .order("asc")
      .take(50);

    const profileIds = [...new Set(replies.map((r) => r.authorProfileId))];
    const profiles = await Promise.all(profileIds.map((id) => ctx.db.get(id)));
    const profileMap = Object.fromEntries(
      profiles.filter(Boolean).map((p) => [p!._id, p!]),
    );

    return replies.map((reply) => ({
      id: reply._id as string,
      postId: reply.postId as string,
      authorId: reply.authorProfileId as string,
      body: reply.body,
      createdAt: new Date(reply.createdAt).toISOString(),
      upvotes: reply.upvotes,
      parentId: (reply.parentId as string | undefined) ?? null,
      author: profileMap[reply.authorProfileId] ? profileToUser(profileMap[reply.authorProfileId]!) : null,
    }));
  },
});

export const getModQueue = query({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    numItems: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, { cursor, numItems }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in required.");
    }
    const profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
      throw new Error("Insufficient permissions.");
    }

    const pageSize = Math.min(Math.max(numItems ?? 20, 1), 100);
    const page = await ctx.db
      .query("forumReports")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "pending"))
      .order("desc")
      .paginate({ numItems: pageSize, cursor: cursor ?? null });

    const reports = [];
    for (const report of page.page) {
      const reporter = await ctx.db.get(report.reporterId);
      let content = null;
      if (report.contentType === "post") {
        content = await ctx.db.get(report.contentId as Id<"forumPosts">);
      } else {
        content = await ctx.db.get(report.contentId as Id<"forumPostComments">);
      }
      reports.push({
        id: report._id as string,
        contentType: report.contentType,
        contentId: report.contentId,
        reason: report.reason,
        details: report.details,
        status: report.status,
        createdAt: report.createdAt,
        reporter: reporter ? profileToUser(reporter) : null,
        content: content
          ? {
              id: (content as { _id: unknown })._id as string,
              ...(report.contentType === "post"
                ? { title: (content as { title?: string }).title ?? "", body: (content as { body?: string }).body ?? "" }
                : { body: (content as { body?: string }).body ?? "" }),
            }
          : null,
      });
    }

    return {
      reports,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

export const getStorageUrl = query({
  args: { storageId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId as import("../_generated/dataModel").Id<"_storage">);
  },
});

/** Sum all upvote shards for a post. */
export const getPostUpvoteCount = query({
  args: { postId: v.id("forumPosts") },
  returns: v.number(),
  handler: async (ctx, { postId }) => {
    const shards = await ctx.db
      .query("forumCounterShards")
      .withIndex("by_entity_counter", (q) =>
        q.eq("entityId", postId as string).eq("counterType", "upvotes"),
      )
      .collect();
    return shards.reduce((sum, s) => sum + s.count, 0);
  },
});
