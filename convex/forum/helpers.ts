import type { Doc } from "../_generated/dataModel";

export function profileToUser(p: Doc<"forumProfiles">) {
  return {
    id: p._id as string,
    name: p.name,
    handle: p.handle,
    avatar: p.image,
    bio: p.bio,
    level: p.level,
    points: p.points,
    streakDays: p.streakDays,
    verified: p.verified,
    role: p.role,
  };
}

/** Minimal `User` shape for feed when post has denormalized author fields. */
export function userFromPostAuthorSnapshot(p: Doc<"forumPosts">) {
  if (p.authorName === undefined || p.authorHandle === undefined) {
    return null;
  }
  return {
    id: p.authorProfileId as string,
    name: p.authorName,
    handle: p.authorHandle,
    avatar: p.authorImage ?? "",
    bio: "",
    level: 1,
    points: 0,
    streakDays: 0,
    verified: undefined,
    role: "member" as const,
  };
}

export function postDocToPost(
  p: Doc<"forumPosts">,
  opts: { isFavorited: boolean; viewerHasUpvote: boolean; categoryBody?: Record<string, unknown> },
) {
  return {
    id: p._id as string,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    body: p.body,
    coverImage: p.coverImage,
    category: p.category,
    authorId: p.authorProfileId as string,
    upvotes: p.upvotes,
    commentsCount: p.commentsCount,
    views: p.views,
    createdAt: new Date(p.createdAt).toISOString(),
    trending: p.trending,
    isFavorited: opts.isFavorited,
    locked: p.locked,
    isRichThread: p.isRichThread,
    viewerHasUpvote: opts.viewerHasUpvote,
    categoryBody: opts.categoryBody,
  };
}
