/**
 * Shared Convex return-type validators matching the frontend TypeScript types.
 * Keeping these in one file avoids duplication across queries and makes the
 * API contract visible / enforceable at runtime.
 */
import { v } from "convex/values";

// ── Primitives ──────────────────────────────────────────────────────

export const categoryKey = v.union(
  v.literal("news"),
  v.literal("review"),
  v.literal("compare"),
  v.literal("qa"),
  v.literal("spark"),
  v.literal("debate"),
  v.literal("list"),
  v.literal("showcase"),
  v.literal("launch-pad"),
  v.literal("gigs"),
);

export const userRole = v.union(
  v.literal("member"),
  v.literal("moderator"),
  v.literal("admin"),
);

// ── Composite shapes ────────────────────────────────────────────────

export const categoryValidator = v.object({
  key: v.string(),
  name: v.string(),
  icon: v.string(),
  description: v.string(),
  primaryColor: v.string(),
  lockedByDefault: v.boolean(),
  pointsToUnlock: v.optional(v.number()),
});

export const userValidator = v.object({
  id: v.string(),
  name: v.string(),
  handle: v.string(),
  avatar: v.string(),
  bio: v.string(),
  level: v.number(),
  points: v.number(),
  streakDays: v.number(),
  verified: v.optional(v.boolean()),
  role: userRole,
});

export const commentValidator = v.object({
  id: v.string(),
  postId: v.string(),
  authorId: v.string(),
  body: v.string(),
  createdAt: v.string(),
  upvotes: v.number(),
});

export const trendingKind = v.union(
  v.literal("hot"),
  v.literal("recent"),
  v.literal("evergreen"),
);

export const postValidator = v.object({
  id: v.string(),
  slug: v.string(),
  title: v.string(),
  summary: v.string(),
  body: v.string(),
  coverImage: v.optional(v.string()),
  category: v.string(),
  authorId: v.string(),
  upvotes: v.number(),
  commentsCount: v.number(),
  views: v.number(),
  createdAt: v.string(),
  trending: trendingKind,
  isFavorited: v.boolean(),
  locked: v.boolean(),
  isRichThread: v.boolean(),
  viewerHasUpvote: v.boolean(),
});

export const notificationValidator = v.object({
  id: v.string(),
  userId: v.string(),
  type: v.union(
    v.literal("comment"),
    v.literal("upvote"),
    v.literal("follow"),
    v.literal("system"),
  ),
  title: v.string(),
  message: v.string(),
  createdAt: v.string(),
  read: v.boolean(),
  postSlug: v.optional(v.string()),
});

export const campaignValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  rewardPoints: v.number(),
  endsAt: v.string(),
  participants: v.number(),
});

export const leaderboardEntryValidator = v.object({
  rank: v.number(),
  userId: v.string(),
  points: v.number(),
  weeklyDelta: v.number(),
  user: v.union(userValidator, v.null()),
});

export const vibingItemValidator = v.object({
  id: v.string(),
  kind: v.union(
    v.literal("campaign"),
    v.literal("post"),
    v.literal("discussion"),
    v.literal("update"),
    v.literal("creator"),
  ),
  label: v.string(),
  href: v.string(),
  engagedUsers: v.number(),
});

export const heroSlideValidator = v.object({
  id: v.string(),
  slug: v.string(),
  discussionHref: v.string(),
  title: v.string(),
  summary: v.string(),
  coverImage: v.optional(v.string()),
  reads: v.number(),
  comments: v.number(),
  shares: v.number(),
  eyebrow: v.string(),
  ctaLabel: v.string(),
  accentRgb: v.string(),
});

export const userSettingsValidator = v.object({
  theme: v.union(v.literal("dark"), v.literal("light"), v.literal("system")),
  emailNotifications: v.boolean(),
  pushNotifications: v.boolean(),
  hideMatureContent: v.boolean(),
});

export const feedPageValidator = v.object({
  posts: v.array(postValidator),
  comments: v.array(commentValidator),
  users: v.array(userValidator),
  continueCursor: v.union(v.string(), v.null()),
  isDone: v.boolean(),
});

export const searchResultsValidator = v.object({
  posts: v.array(postValidator),
  users: v.array(userValidator),
  comments: v.array(commentValidator),
  commentUsers: v.array(userValidator),
});
