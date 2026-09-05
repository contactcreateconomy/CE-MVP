import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { insertMissingForumCategories } from "./seed/ensureCategoryRows";
import { categoryRows } from "./seed/catalog";
import { slugify } from "./seed/generatePosts";
import {
  MAX_COMMENT_BODY_LEN,
  MAX_POST_BODY_LEN,
  MAX_POST_SUMMARY_LEN,
  MAX_POST_TITLE_LEN,
  MAX_PROFILE_BIO_LEN,
  MAX_PROFILE_HANDLE_LEN,
  MAX_PROFILE_NAME_LEN,
} from "./limits";
import { consumeWriteBucket } from "./rateLimit";

export const ensureForumProfile = mutation({
  args: {},
  returns: v.union(v.id("forumProfiles"), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const existing = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      return existing._id;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    const handle = (user.handle ?? `user-${userId.slice(-6)}`).toLowerCase();
    const name = user.name?.trim() || handle;
    const image = typeof user.image === "string" ? user.image : "";
    return await ctx.db.insert("forumProfiles", {
      userId,
      handle,
      name,
      image,
      bio: "",
      level: 1,
      points: 0,
      streakDays: 0,
      role: "member",
    });
  },
});

export const createPost = mutation({
  args: {
    title: v.string(),
    summary: v.string(),
    body: v.string(),
    category: v.string(),
    coverImage: v.optional(v.string()),
    categoryFields: v.optional(v.any()),
  },
  returns: v.id("forumPosts"),
  handler: async (ctx, { title, summary, body, category, coverImage, categoryFields }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in to publish.");
    }
    await consumeWriteBucket(ctx, userId, "createPost");

    const t = title.trim();
    const s = summary.trim() || t;
    const b = body.trim();
    if (!t.length) {
      throw new Error("Title is required.");
    }
    if (t.length > MAX_POST_TITLE_LEN) {
      throw new Error(`Title must be at most ${MAX_POST_TITLE_LEN} characters.`);
    }
    if (s.length > MAX_POST_SUMMARY_LEN) {
      throw new Error(`Summary must be at most ${MAX_POST_SUMMARY_LEN} characters.`);
    }
    if (b.length > MAX_POST_BODY_LEN) {
      throw new Error(`Body must be at most ${MAX_POST_BODY_LEN} characters.`);
    }

    const requestedCategory = category.trim();
    const catKey = requestedCategory === "help" ? "qa" : requestedCategory;
    let categoryRow = await ctx.db
      .query("forumCategories")
      .withIndex("by_key", (q) => q.eq("key", catKey))
      .unique();
    if (!categoryRow) {
      await insertMissingForumCategories(ctx);
      categoryRow = await ctx.db
        .query("forumCategories")
        .withIndex("by_key", (q) => q.eq("key", catKey))
        .unique();
    }
    if (!categoryRow) {
      throw new Error("Unknown category.");
    }

    let profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) {
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error("User record missing.");
      }
      const handle = (user.handle ?? `user-${userId.slice(-6)}`).toLowerCase();
      const pid = await ctx.db.insert("forumProfiles", {
        userId,
        handle,
        name: user.name?.trim() || handle,
        image: typeof user.image === "string" ? user.image : "",
        bio: "",
        level: 1,
        points: 0,
        streakDays: 0,
        role: "member",
      });
      profile = await ctx.db.get(pid);
      if (!profile) {
        throw new Error("Could not create forum profile.");
      }
    }

    const base = slugify(t);
    let slug = base || "post";
    let suffix = 0;
    while (
      await ctx.db
        .query("forumPosts")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique()
    ) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    const now = Date.now();
    const newPostId = await ctx.db.insert("forumPosts", {
      slug,
      title: t,
      summary: s,
      body: b,
      coverImage,
      category: catKey,
      authorProfileId: profile._id,
      authorName: profile.name,
      authorHandle: profile.handle,
      authorImage: profile.image,
      upvotes: 0,
      commentsCount: 0,
      views: 0,
      createdAt: now,
      trending: "recent",
      locked: false,
      isRichThread: false,
    });

    // Store per-category structured payload if provided
    if (categoryFields && typeof categoryFields === "object" && Object.keys(categoryFields as Record<string, unknown>).length > 0) {
      await ctx.db.insert("forumCategoryPayloads", {
        postId: newPostId,
        category: catKey,
        payload: categoryFields,
        version: 1,
      });
    }

    // Denormalize searchable tags from category payloads
    const searchTags = extractSearchTags(catKey, categoryFields);
    if (searchTags.length > 0) {
      await ctx.db.patch(newPostId, { searchTags });
    }

    // Track analytics event
    await ctx.db.insert("forumAnalyticsEvents", {
      eventType: "post_created",
      profileId: profile._id,
      postId: newPostId,
      category: catKey,
      createdAt: Date.now(),
    });

    return newPostId;
  },
});

export const toggleFavorite = mutation({
  args: { postId: v.id("forumPosts") },
  returns: v.object({ favorited: v.boolean() }),
  handler: async (ctx, { postId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in to save favorites.");
    }
    await consumeWriteBucket(ctx, userId, "toggleFavorite");
    const existing = await ctx.db
      .query("forumFavorites")
      .withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postId", postId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    }
    await ctx.db.insert("forumFavorites", {
      userId,
      postId,
      favoritedAt: Date.now(),
    });

    // Track analytics event
    const profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile) {
      await ctx.db.insert("forumAnalyticsEvents", {
        eventType: "post_bookmarked",
        profileId: profile._id,
        postId,
        createdAt: Date.now(),
      });
    }

    return { favorited: true };
  },
});

export const toggleUpvote = mutation({
  args: { postId: v.id("forumPosts") },
  returns: v.object({ upvoted: v.boolean() }),
  handler: async (ctx, { postId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in to upvote.");
    }
    await consumeWriteBucket(ctx, userId, "toggleUpvote");
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error("Post not found.");
    }
    const existing = await ctx.db
      .query("forumUpvotes")
      .withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postId", postId))
      .unique();
    let delta: number;
    if (existing) {
      await ctx.db.delete(existing._id);
      delta = -1;
    } else {
      await ctx.db.insert("forumUpvotes", { userId, postId });
      delta = 1;
    }
    await incrementCounterShard(ctx, postId, "upvotes", 10, delta);
    await ctx.db.patch(postId, { upvotes: Math.max(0, post.upvotes + delta) });

    // Notify post author on upvote (delta === 1 means new upvote)
    if (delta === 1) {
      const profile = await ctx.db
        .query("forumProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (profile && post.authorProfileId !== profile._id) {
        await ctx.db.insert("forumNotifications", {
          profileId: post.authorProfileId,
          type: "upvote",
          title: "Your post got an upvote",
          message: `${profile.name} upvoted "${post.title}"`,
          createdAt: new Date().toISOString(),
          read: false,
          postSlug: post.slug,
        });
      }

      // Track analytics event
      if (profile) {
        await ctx.db.insert("forumAnalyticsEvents", {
          eventType: "upvote_added",
          profileId: profile._id,
          postId,
          category: post.category,
          createdAt: Date.now(),
        });
      }
    }

    return { upvoted: delta === 1 };
  },
});

export const updateViewerSettings = mutation({
  args: {
    theme: v.optional(v.union(v.literal("dark"), v.literal("light"), v.literal("system"))),
    emailNotifications: v.optional(v.boolean()),
    pushNotifications: v.optional(v.boolean()),
    hideMatureContent: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in to update settings.");
    }
    const existing = await ctx.db
      .query("forumUserSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const patch = {
      theme: args.theme,
      emailNotifications: args.emailNotifications,
      pushNotifications: args.pushNotifications,
      hideMatureContent: args.hideMatureContent,
    };
    const cleaned = Object.fromEntries(
      Object.entries(patch).filter(([, val]) => val !== undefined),
    ) as Record<string, unknown>;
    if (existing) {
      await ctx.db.patch(existing._id, cleaned);
    } else {
      await ctx.db.insert("forumUserSettings", {
        userId,
        theme: (args.theme ?? "dark") as "dark" | "light" | "system",
        emailNotifications: args.emailNotifications ?? true,
        pushNotifications: args.pushNotifications ?? true,
        hideMatureContent: args.hideMatureContent ?? false,
      });
    }
    return null;
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("forumNotifications") },
  returns: v.null(),
  handler: async (ctx, { notificationId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in required.");
    }
    const profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) {
      return null;
    }
    const n = await ctx.db.get(notificationId);
    if (!n || n.profileId !== profile._id) {
      return null;
    }
    await ctx.db.patch(notificationId, { read: true });
    return null;
  },
});

/**
 * Same catalog insert as `forum/seed:ensureForumCategories` (CLI / internal).
 * Callable from the forum client so production self-heals when `forumCategories` is empty.
 * Idempotent; no auth required (static taxonomy only).
 */
export const ensureForumCategories = mutation({
  args: {},
  returns: v.object({ inserted: v.number(), skipped: v.number(), updated: v.number() }),
  handler: async (ctx) => insertMissingForumCategories(ctx),
});

/**
 * One-shot migration: renames the "help" category key to "qa" across all tables.
 * Patches forumCategories, forumPosts, forumRichThreads, and forumCategoryPayloads.
 * Idempotent — safe to run multiple times.
 */
export const migrateHelpToQa = mutation({
  args: {},
  returns: v.object({
    categoriesDeleted: v.number(),
    categoriesInserted: v.number(),
    postsPatched: v.number(),
    richThreadsPatched: v.number(),
    categoryPayloadsPatched: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx): Promise<{
    categoriesDeleted: number;
    categoriesInserted: number;
    postsPatched: number;
    richThreadsPatched: number;
    categoryPayloadsPatched: number;
    hasMore: boolean;
  }> => {
    let categoriesDeleted = 0;
    let categoriesInserted = 0;
    let postsPatched = 0;
    let richThreadsPatched = 0;
    let categoryPayloadsPatched = 0;

    const oldCatBefore = await ctx.db
      .query("forumCategories")
      .withIndex("by_key", (q) => q.eq("key", "help"))
      .unique();

    // 1. Insert new "qa" category row (from catalog) before removing the old key.
    const newCat = await ctx.db
      .query("forumCategories")
      .withIndex("by_key", (q) => q.eq("key", "qa"))
      .unique();
    if (!newCat) {
      const qaEntry = categoryRows.find((c) => c.key === "qa");
      if (qaEntry) {
        await ctx.db.insert("forumCategories", { ...qaEntry });
        categoriesInserted = 1;
      }
    }

    // 2. Run the first bounded batch synchronously and self-schedule the rest.
    const batchResult: {
      postsPatched: number;
      richThreadsPatched: number;
      categoryPayloadsPatched: number;
      hasMore: boolean;
    } = await ctx.runMutation(internal.forum.jobs.migrateHelpToQaBatch, {
      postCursor: null,
      richThreadCursor: null,
      categoryPayloadCursor: null,
    });
    postsPatched = batchResult.postsPatched;
    richThreadsPatched = batchResult.richThreadsPatched;
    categoryPayloadsPatched = batchResult.categoryPayloadsPatched;

    if (oldCatBefore) {
      const oldCatAfter = await ctx.db
        .query("forumCategories")
        .withIndex("by_key", (q) => q.eq("key", "help"))
        .unique();
      categoriesDeleted = oldCatAfter ? 0 : 1;
    }

    return {
      categoriesDeleted,
      categoriesInserted,
      postsPatched,
      richThreadsPatched,
      categoryPayloadsPatched,
      hasMore: batchResult.hasMore,
    };
  },
});

export const createComment = mutation({
  args: {
    postId: v.id("forumPosts"),
    body: v.string(),
    parentId: v.optional(v.id("forumPostComments")),
  },
  returns: v.id("forumPostComments"),
  handler: async (ctx, { postId, body, parentId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in to comment.");
    }
    await consumeWriteBucket(ctx, userId, "createComment");

    const b = body.trim();
    if (!b.length) {
      throw new Error("Comment body is required.");
    }
    if (b.length > MAX_COMMENT_BODY_LEN) {
      throw new Error(`Comment must be at most ${MAX_COMMENT_BODY_LEN} characters.`);
    }

    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error("Post not found.");
    }
    if (post.locked) {
      throw new Error("This discussion is locked.");
    }

    // Validate parentId: must belong to same post and not be a reply itself
    if (parentId !== undefined) {
      const parent = await ctx.db.get(parentId);
      if (!parent || parent.postId !== postId) {
        throw new Error("Reply target not found or belongs to a different post");
      }
      if (parent.parentId !== undefined) {
        throw new Error("Cannot reply to a reply — maximum depth is 2");
      }
    }

    let profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) {
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error("User record missing.");
      }
      const handle = (user.handle ?? `user-${userId.slice(-6)}`).toLowerCase();
      const pid = await ctx.db.insert("forumProfiles", {
        userId,
        handle,
        name: user.name?.trim() || handle,
        image: typeof user.image === "string" ? user.image : "",
        bio: "",
        level: 1,
        points: 0,
        streakDays: 0,
        role: "member",
      });
      profile = await ctx.db.get(pid);
      if (!profile) {
        throw new Error("Could not create forum profile.");
      }
    }

    const commentId = await ctx.db.insert("forumPostComments", {
      postId,
      authorProfileId: profile._id,
      body: b,
      createdAt: Date.now(),
      upvotes: 0,
      parentId,
    });

    await ctx.db.patch(postId, { commentsCount: post.commentsCount + 1 });

    // Notify post author
    if (post.authorProfileId !== profile._id) {
      await ctx.db.insert("forumNotifications", {
        profileId: post.authorProfileId,
        type: "comment",
        title: "New comment on your post",
        message: `${profile.name} commented on "${post.title}"`,
        createdAt: new Date().toISOString(),
        read: false,
        postSlug: post.slug,
      });
    }

    // Track analytics event
    await ctx.db.insert("forumAnalyticsEvents", {
      eventType: "comment_created",
      profileId: profile._id,
      postId,
      category: post.category,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    image: v.optional(v.string()),
    handle: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in to update your profile.");
    }

    const profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) {
      throw new Error("Profile not found.");
    }

    const patch: Record<string, unknown> = {};

    if (args.name !== undefined) {
      const n = args.name.trim();
      if (!n.length) {
        throw new Error("Name cannot be empty.");
      }
      if (n.length > MAX_PROFILE_NAME_LEN) {
        throw new Error(`Name must be at most ${MAX_PROFILE_NAME_LEN} characters.`);
      }
      patch.name = n;
    }

    if (args.bio !== undefined) {
      const b = args.bio.trim();
      if (b.length > MAX_PROFILE_BIO_LEN) {
        throw new Error(`Bio must be at most ${MAX_PROFILE_BIO_LEN} characters.`);
      }
      patch.bio = b;
    }

    if (args.image !== undefined) {
      patch.image = args.image.trim();
    }

    if (args.handle !== undefined) {
      const h = args.handle.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/^-|-$/g, "");
      if (!h.length) {
        throw new Error("Handle cannot be empty.");
      }
      if (h.length > MAX_PROFILE_HANDLE_LEN) {
        throw new Error(`Handle must be at most ${MAX_PROFILE_HANDLE_LEN} characters.`);
      }
      if (h !== profile.handle) {
        const taken = await ctx.db
          .query("forumProfiles")
          .withIndex("by_handle", (q) => q.eq("handle", h))
          .unique();
        if (taken && taken._id !== profile._id) {
          throw new Error("Handle is already taken.");
        }
        patch.handle = h;
      }
    }

    if (Object.keys(patch).length === 0) {
      return null;
    }

    await ctx.db.patch(profile._id, patch);

    // Sync denormalized author fields on existing posts via scheduled batch job
    if (patch.name || patch.image || patch.handle) {
      const authorPatch: Record<string, string> = {};
      if (patch.name) authorPatch.authorName = patch.name as string;
      if (patch.handle) authorPatch.authorHandle = patch.handle as string;
      if (patch.image !== undefined) authorPatch.authorImage = patch.image as string;
      if (Object.keys(authorPatch).length > 0) {
        await ctx.scheduler.runAfter(0, internal.forum.jobs.syncAuthorDenormalization, {
          profileId: profile._id,
          authorPatch,
          cursor: null,
        });
      }
    }

    return null;
  },
});

export const createReport = mutation({
  args: {
    contentType: v.union(v.literal("post"), v.literal("comment")),
    contentId: v.string(),
    reason: v.union(
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("misinformation"),
      v.literal("off_topic"),
      v.literal("other"),
    ),
    details: v.optional(v.string()),
  },
  returns: v.id("forumReports"),
  handler: async (ctx, { contentType, contentId, reason, details }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Sign in to report content.");
    }
    await consumeWriteBucket(ctx, userId, "createReport");

    const profile = await ctx.db
      .query("forumProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) {
      throw new Error("Profile not found.");
    }

    // Check duplicate report
    const existing = await ctx.db
      .query("forumReports")
      .withIndex("by_content", (q) => q.eq("contentType", contentType).eq("contentId", contentId))
      .collect();
    const alreadyReported = existing.some((r) => r.reporterId === profile._id);
    if (alreadyReported) {
      throw new Error("You have already reported this content.");
    }

    return await ctx.db.insert("forumReports", {
      reporterId: profile._id,
      contentType,
      contentId,
      reason,
      details,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const moderateContent = mutation({
  args: {
    reportId: v.id("forumReports"),
    action: v.union(
      v.literal("remove_post"),
      v.literal("restore_post"),
      v.literal("remove_comment"),
      v.literal("flag_post"),
      v.literal("dismiss_report"),
    ),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { reportId, action, reason }) => {
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

    const report = await ctx.db.get(reportId);
    if (!report) {
      throw new Error("Report not found.");
    }

    if (action === "remove_post") {
      const postId = report.contentId as import("../_generated/dataModel").Id<"forumPosts">;
      await ctx.db.patch(postId, { moderationStatus: "removed" });
      await ctx.db.patch(reportId, { status: "reviewed" });
    } else if (action === "restore_post") {
      const postId = report.contentId as import("../_generated/dataModel").Id<"forumPosts">;
      await ctx.db.patch(postId, { moderationStatus: "visible" });
      await ctx.db.patch(reportId, { status: "reviewed" });
    } else if (action === "flag_post") {
      const postId = report.contentId as import("../_generated/dataModel").Id<"forumPosts">;
      await ctx.db.patch(postId, { moderationStatus: "flagged" });
      await ctx.db.patch(reportId, { status: "reviewed" });
    } else if (action === "dismiss_report") {
      await ctx.db.patch(reportId, { status: "dismissed" });
    }

    await ctx.db.insert("forumModActions", {
      moderatorId: profile._id,
      action,
      contentId: report.contentId,
      reason,
      createdAt: Date.now(),
    });

    return null;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

/** Increment a view counter shard on thread page load. Public mutation for client use. */
export const incrementViewCount = mutation({
  args: { postId: v.id("forumPosts") },
  returns: v.null(),
  handler: async (ctx, { postId }) => {
    await incrementCounterShard(ctx, postId, "views", 5, 1);
    return null;
  },
});

// ── Internal helpers ──────────────────────────────────────────────────

/**
 * Increment or decrement a sharded counter.
 * Picks a random shard to distribute concurrent write load.
 */
async function incrementCounterShard(
  ctx: { db: import("../_generated/server").MutationCtx["db"] },
  entityId: Id<"forumPosts">,
  counterType: string,
  totalShards: number,
  delta: number,
): Promise<void> {
  const shardKey = Math.floor(Math.random() * totalShards);
  const existing = await ctx.db
    .query("forumCounterShards")
    .withIndex("by_entity_counter_shard", (q) =>
      q.eq("entityId", entityId as string).eq("counterType", counterType).eq("shardKey", shardKey),
    )
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { count: Math.max(0, existing.count + delta) });
  } else {
    await ctx.db.insert("forumCounterShards", {
      entityId: entityId as string,
      entityType: "post",
      counterType,
      shardKey,
      count: Math.max(0, delta),
    });
  }
}

/**
 * Extract searchable tags from category fields for denormalized search.
 */
function extractSearchTags(category: string, categoryFields: unknown): string[] {
  if (!categoryFields || typeof categoryFields !== "object") return [];
  const fields = categoryFields as Record<string, unknown>;
  const tags: string[] = [];

  if (category === "gigs" && Array.isArray(fields.requiredSkills)) {
    for (const skill of fields.requiredSkills) {
      if (typeof skill === "string") tags.push(skill);
    }
  }
  if (category === "review" && typeof fields.productName === "string") {
    tags.push(fields.productName);
  }

  return tags;
}
