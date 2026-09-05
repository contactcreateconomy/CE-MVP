import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import { categoryRows, campaignRows, heroSlideRows, profileSeeds, vibingRows } from "./seed/catalog";
import { insertMissingForumCategories } from "./seed/ensureCategoryRows";
import { allGeneratedPostShapes } from "./seed/generatePosts";
import { discussionThreads } from "./seed/discussionThreads";

function deepRemapUserIds(obj: unknown, map: Record<string, string>): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "string") {
    return map[obj] ?? obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((x) => deepRemapUserIds(x, map));
  }
  if (typeof obj === "object") {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(obj)) {
      o[k] = deepRemapUserIds((obj as Record<string, unknown>)[k], map);
    }
    return o;
  }
  return obj;
}

const commentBodies = [
  "This angle is strong. The execution detail makes it immediately usable.",
  "I tested something similar last week and got nearly the same outcome.",
  "Would love a follow-up with your exact prompt structure and constraints.",
  "The framework is great, but where did the QA checks save most time?",
  "This is the clearest breakdown I have seen for this workflow.",
  "Can confirm this works better when combined with a short review pass.",
  "Super useful. I would add one more step before publishing.",
  "The data-backed explanation is exactly what this community needs.",
  "I tried your approach with multilingual content and it still held up.",
  "Big win on clarity. This would be great as a reusable template.",
  "Strong take. I disagree on one point but the method is solid.",
  "This helped me ship faster today, thanks for sharing the process.",
];

export const runForumSeed = internalMutation({
  args: { force: v.optional(v.boolean()) },
  returns: v.object({
    ok: v.boolean(),
    reason: v.optional(v.string()),
    categories: v.optional(v.number()),
    profiles: v.optional(v.number()),
    posts: v.optional(v.number()),
    richThreads: v.optional(v.number()),
    postComments: v.optional(v.number()),
    notifications: v.optional(v.number()),
    leaderboardRows: v.optional(v.number()),
    campaigns: v.optional(v.number()),
    vibingItems: v.optional(v.number()),
    heroSlides: v.optional(v.number()),
  }),
  handler: async (ctx, { force }) => {
    const firstCat = await ctx.db.query("forumCategories").first();
    if (firstCat && !force) {
      return { ok: false, reason: "already_seeded" };
    }

    if (force && process.env.ALLOW_FORUM_SEED_FORCE !== "true") {
      return { ok: false, reason: "force_disabled_set_ALLOW_FORUM_SEED_FORCE_true_in_dashboard" };
    }

    if (force) {
      const tables = [
        "forumHeroSlides",
        "forumVibingItems",
        "forumNotifications",
        "forumLeaderboard",
        "forumCampaigns",
        "forumPostComments",
        "forumFavorites",
        "forumUpvotes",
        "forumUserSettings",
        "forumWriteBuckets",
        "forumRichThreads",
        "forumPosts",
        "forumCategories",
        "forumProfiles",
      ] as const;
      for (const table of tables) {
        for (const doc of await ctx.db.query(table).collect()) {
          await ctx.db.delete(doc._id);
        }
      }
    }

    for (const c of categoryRows) {
      await ctx.db.insert("forumCategories", { ...c });
    }

    const seedToProfileId: Record<string, Id<"forumProfiles">> = {};
    for (const p of profileSeeds) {
      const id = await ctx.db.insert("forumProfiles", {
        seedKey: p.seedKey,
        handle: p.handle,
        name: p.name,
        image: p.image,
        bio: p.bio,
        level: p.level,
        points: p.points,
        streakDays: p.streakDays,
        verified: p.verified,
        role: p.role,
      });
      seedToProfileId[p.seedKey] = id;
    }

    const profileIdMap = seedToProfileId;

    for (const thread of discussionThreads) {
      const remapped = deepRemapUserIds(thread, profileIdMap);
      await ctx.db.insert("forumRichThreads", {
        slug: thread.slug,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: remapped as any,
      });
    }

    const postShapes = allGeneratedPostShapes(discussionThreads);
    const legacyKeyToPostId: Record<string, Id<"forumPosts">> = {};

    const seedKeyToDisplay: Record<string, { name: string; handle: string; image: string }> =
      Object.fromEntries(profileSeeds.map((p) => [p.seedKey, { name: p.name, handle: p.handle, image: p.image }]));

    for (const shape of postShapes) {
      const authorId = profileIdMap[shape.authorSeedKey];
      if (!authorId) {
        throw new Error(`Missing profile for seed ${shape.authorSeedKey}`);
      }
      const disp = seedKeyToDisplay[shape.authorSeedKey];
      const postId = await ctx.db.insert("forumPosts", {
        slug: shape.slug,
        title: shape.title,
        summary: shape.summary,
        body: shape.body,
        coverImage: shape.coverImage,
        category: shape.category,
        authorProfileId: authorId,
        authorName: disp?.name,
        authorHandle: disp?.handle,
        authorImage: disp?.image,
        upvotes: shape.upvotes,
        commentsCount: shape.commentsCount,
        views: shape.views,
        createdAt: shape.createdAt,
        trending: shape.trending,
        locked: shape.locked,
        isRichThread: shape.isRichThread,
        ...(shape.legacyKey ? { legacyKey: shape.legacyKey } : {}),
      });
      if (shape.legacyKey) {
        legacyKeyToPostId[shape.legacyKey] = postId;
      }
    }

    let postCommentsInserted = 0;
    for (let postIndex = 0; postIndex < 90; postIndex++) {
      const legacy = `p${postIndex + 1}`;
      const postId = legacyKeyToPostId[legacy];
      if (!postId) continue;
      const userIds = ["u1", "u2", "u3", "u4", "u5"];
      for (let commentIndex = 0; commentIndex < 5; commentIndex++) {
        const createdAt = new Date(
          Date.UTC(
            2026,
            1,
            28 - ((postIndex + commentIndex) % 14),
            9 + (commentIndex % 9),
            (postIndex * 7 + commentIndex * 5) % 60,
          ),
        ).getTime();
        const authorProfileId = profileIdMap[userIds[(postIndex + commentIndex + 1) % userIds.length]];
        await ctx.db.insert("forumPostComments", {
          postId,
          authorProfileId,
          body: commentBodies[(postIndex + commentIndex) % commentBodies.length],
          createdAt,
          upvotes: 6 + ((postIndex * 13 + commentIndex * 11) % 120),
        });
        postCommentsInserted++;
      }
    }

    const notifs = [
      {
        profileSeedKey: "u1",
        type: "comment" as const,
        title: "New comment",
        message: "Marcus replied to your review thread.",
        createdAt: "2026-02-28T08:12:00.000Z",
        read: false,
        postSlug: "review-001",
      },
      {
        profileSeedKey: "u1",
        type: "upvote" as const,
        title: "Upvote milestone",
        message: "Your post crossed 800 upvotes.",
        createdAt: "2026-02-28T07:40:00.000Z",
        read: false,
        postSlug: "review-001",
      },
      {
        profileSeedKey: "u1",
        type: "follow" as const,
        title: "New follower",
        message: "Rachel started following you.",
        createdAt: "2026-02-27T19:22:00.000Z",
        read: true,
      },
      {
        profileSeedKey: "u1",
        type: "system" as const,
        title: "Weekly recap ready",
        message: "Your creator analytics snapshot is available.",
        createdAt: "2026-02-27T09:05:00.000Z",
        read: true,
      },
    ];
    for (const n of notifs) {
      await ctx.db.insert("forumNotifications", {
        profileId: profileIdMap[n.profileSeedKey],
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        read: n.read,
        postSlug: n.postSlug,
      });
    }

    const board = [
      { rank: 1, seedKey: "u5", points: 30220, weeklyDelta: 812 },
      { rank: 2, seedKey: "u2", points: 21780, weeklyDelta: 534 },
      { rank: 3, seedKey: "u1", points: 14240, weeklyDelta: 421 },
      { rank: 4, seedKey: "u3", points: 8930, weeklyDelta: 190 },
      { rank: 5, seedKey: "u4", points: 4680, weeklyDelta: 72 },
    ];
    for (const row of board) {
      await ctx.db.insert("forumLeaderboard", {
        rank: row.rank,
        profileId: profileIdMap[row.seedKey],
        points: row.points,
        weeklyDelta: row.weeklyDelta,
      });
    }

    for (const c of campaignRows) {
      await ctx.db.insert("forumCampaigns", c);
    }

    for (let i = 0; i < vibingRows.length; i++) {
      await ctx.db.insert("forumVibingItems", { ...vibingRows[i], sortOrder: i });
    }

    for (let i = 0; i < heroSlideRows.length; i++) {
      await ctx.db.insert("forumHeroSlides", { ...heroSlideRows[i], sortOrder: i });
    }

    return {
      ok: true,
      categories: categoryRows.length,
      profiles: profileSeeds.length,
      posts: postShapes.length,
      richThreads: discussionThreads.length,
      postComments: postCommentsInserted,
      notifications: notifs.length,
      leaderboardRows: board.length,
      campaigns: campaignRows.length,
      vibingItems: vibingRows.length,
      heroSlides: heroSlideRows.length,
    };
  },
});

/**
 * Production-safe: insert missing `forumCategories` rows from the static catalog only.
 * Does not add posts, profiles, or demo content. Run once per prod deployment after schema deploy
 * so `createPost` category validation works. Idempotent.
 */
export const ensureForumCategories = internalMutation({
  args: {},
  returns: v.object({ inserted: v.number(), skipped: v.number(), updated: v.number() }),
  handler: async (ctx) => insertMissingForumCategories(ctx),
});
