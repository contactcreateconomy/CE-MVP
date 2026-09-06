/**
 * feed — SLICE-P6-03: CAP-182/183/184/185/186/194/198/199/200/553 — the
 * canonical /feed READ surface + per-card session controls.
 *
 * Contract spine (CONTRACT-6-feed): four genuinely-distinct sorts reading
 *   postDistributionScores (index scan, never compute-at-read); anonymous
 *   default = Hot (CAP-183, quoted); Fav is member-only (saved posts +
 *   saved comments + participated, unread-first); post-type nav from
 *   postTypeConfig state (CAP-186 — reuses posts.listActiveTypes, no
 *   fork); hero/Featured/Vibing/Podium RENDER (writes live on P6-04/the
 *   crons); snapshot realtime (counters only — never live reorder);
 *   hide/mute/unhide on feedSessions (CAP-200/553); why-drawer (CAP-199).
 * Firewall (§3 M, quoted): "personas/staff ZERO in core ranking;
 *   controlled participation display-only." Persona-authored posts are
 *   excluded from the four sorts' organic results (display context, e.g.
 *   Vibing-adjacent, arrives with population — flagged interpretation of
 *   the quoted firewall).
 *
 * Fenced (not built): "see-fewer" (feed OQ3 — no write target); Vibing
 * ticker stays a labeled list (A7 archetype gap, F-24 degrade);
 * vibingFeatured renders from the table (feed OQ1 — no read row named).
 * noindex per CAP-486 (route metadata).
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { captureEvent } from "./lib/events";

const PAGE = 20;

export const FEED_CARD_ACTION_EVENT_ROW = {
  schemaVersion: 1,
  eventClass: "outcome" as const,
  ownerModule: "m9",
  description: "Member hides/mutes/reports a feed card (CAP-200)",
  captureMode: "same_mutation",
  piiClass: "none",
  consentGate: "strictly_necessary",
  signalEligible: false,
  s18Eligible: false,
  excludeStaff: true,
  excludePersonas: true,
  idempotencyScope: "none",
  retentionClass: "standard",
  posthogMirror: false,
  status: "active" as const,
  effectiveFrom: Date.now(),
  owner: "m9",
  eventName: "feed.card_action",
};

async function sessionRow(ctx: any, userId: Id<"users"> | null): Promise<any | null> {
  // Hide/mute state is member-scoped (CAP-200 Actor=member): keyed by the
  // member's latest live session row; created on first control use.
  if (!userId) return null;
  const rows = await ctx.db
    .query("feedSessions")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .order("desc")
    .take(1);
  return rows[0] ?? null;
}

async function ensureSessionRow(ctx: any, userId: Id<"users">, sortMode: string): Promise<any> {
  const existing = await sessionRow(ctx, userId);
  if (existing) return existing;
  const now = Date.now();
  const id = await ctx.db.insert("feedSessions", {
    sessionId: `fs:${userId}:${now}`,
    userId,
    sortMode,
    rankingVersion: 1,
    createdAt: now,
    expiresAt: now + 7 * 24 * 3_600_000,
  });
  return await ctx.db.get(id);
}

async function assembleCard(ctx: any, score: any): Promise<any> {
  const post = await ctx.db.get(score.postId);
  if (!post || post.lifecycleStatus !== "published") return null;
  const card = await ctx.db
    .query("cardSummaries")
    .withIndex("by_postId", (q: any) => q.eq("postId", score.postId))
    .unique();
  const author = post.authorUserId ? await ctx.db.get(post.authorUserId) : null;
  return {
    postId: post._id,
    type: post.type,
    title: post.title,
    authorName: author?.displayName ?? author?.email?.split("@")[0] ?? "Member",
    publishedAt: post.publishedAt ?? post.createdAt,
    oneLiner: card?.oneLiner ?? post.title,
    runningCommentRef: card?.runningCommentRef ?? null,
    discussingCount: card?.discussingCount ?? 0,
    avatarUserIds: card?.avatarUserIds ?? [],
    engagement: {
      valuable: score.valuableWeighted,
      replies: score.replyCount,
      saves: score.saveCount,
      reads: score.qualifiedReads,
    },
    // Rising badge (CAP-201 → routes to Podium) — display flag from the
    // trend projection (flagged heuristic until M12's Rising definition)
    rising: score.trendScore > 0,
  };
}

/** CAP-182/183/184/185 — `feed.list`. Cursor = boundary blob (the frozen
 *  ordering walk — snapshot-stable pagination, CAP-198's "never reorder"). */
export const list = query({
  args: {
    sortMode: v.union(v.literal("top"), v.literal("hot"), v.literal("new"), v.literal("fav")),
    typeFilter: v.optional(v.string()),
    cursor: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (args.sortMode === "fav" && !userId) return { page: [], cursor: null, reason: "member_only" }; // CAP-185 Actor=member

    const session = await sessionRow(ctx, userId);
    const hidden = new Set<string>([...(session?.hiddenPostIds ?? []), ...(session?.mutedPostIds ?? [])]);

    let cards: any[] = [];
    let nextCursor: number | null = null;

    if (args.sortMode === "fav") {
      // CAP-185 (quoted): "saved comments (commentSaves) surface alongside
      // saved posts" + participated threads, unread-activity first.
      const savedPosts = await ctx.db.query("saves").withIndex("by_user", (q: any) => q.eq("userId", userId)).take(30);
      const savedComments = await ctx.db.query("commentSaves").withIndex("by_user_comment", (q: any) => q.eq("userId", userId)).take(30);
      const myComments = await ctx.db
        .query("comments")
        .withIndex("by_author_type_authorUserId", (q: any) => q.eq("authorType", "user").eq("authorUserId", userId))
        .order("desc")
        .take(20);
      const postIds = new Set<string>();
      for (const s of savedPosts) postIds.add(s.postId);
      for (const c of savedComments) {
        const comment = await ctx.db.get(c.commentId);
        if (comment) postIds.add(comment.postId);
      }
      for (const c of myComments) postIds.add(c.postId);
      const scored = [];
      for (const postId of postIds) {
        if (hidden.has(postId)) continue;
        const score = await ctx.db.query("postDistributionScores").withIndex("by_postId", (q: any) => q.eq("postId", postId as any)).unique();
        if (!score) continue;
        scored.push(score);
      }
      scored.sort((a: any, b: any) => b.lastEligibleInteractionAt - a.lastEligibleInteractionAt); // unread-activity ordering
      for (const score of scored.slice(0, PAGE)) {
        const card = await assembleCard(ctx, score);
        if (card && (!args.typeFilter || card.type === args.typeFilter)) cards.push(card);
      }
    } else {
      // Organic sorts — the index IS the ranking (never compute-at-read)
      const idx =
        args.sortMode === "top" ? "by_topScore" : args.sortMode === "hot" ? "by_hotScore" : "by_lastEligibleInteractionAt";
      const rows = await ctx.db.query("postDistributionScores").withIndex(idx).order("desc").take(PAGE + 10);
      const boundary = args.cursor;
      let emitted = 0;
      for (const row of rows) {
        const key = args.sortMode === "top" ? row.topScore : args.sortMode === "hot" ? row.hotScore : row.lastEligibleInteractionAt;
        if (boundary !== undefined && key >= boundary) continue; // cursor walk below the boundary
        const post = await ctx.db.get(row.postId);
        if (!post || post.lifecycleStatus !== "published") continue;
        if (post.authorType !== "user") continue; // persona/staff ZERO in core ranking (§3 M)
        if (hidden.has(row.postId)) continue;
        if (args.typeFilter && post.type !== args.typeFilter) continue;
        const card = await assembleCard(ctx, row);
        if (!card) continue;
        cards.push(card);
        emitted += 1;
        if (emitted >= PAGE) {
          const lastKey = args.sortMode === "top" ? row.topScore : args.sortMode === "hot" ? row.hotScore : row.lastEligibleInteractionAt;
          nextCursor = lastKey;
          break;
        }
      }
    }

    // CAP-198: snapshot — counters + "newer material exists" only; the
    // cursor walk above never reorders served pages.
    return { page: cards, cursor: nextCursor, snapshot: true };
  },
});

/** The feed chrome: hero band (4–6 active) + Vibing list + Featured
 *  frames (pulled NEVER renders — CAP-554) + Podium ("forming" until M12)
 *  + post-type nav (CAP-186 via postTypeConfig state). */
export const getChrome = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const now = Date.now();
    const heroRows = await ctx.db
      .query("heroSlots")
      .withIndex("by_status_start", (q: any) => q.eq("status", "active"))
      .take(10);
    const hero = [];
    for (const slot of heroRows) {
      if (slot.endAt <= now || slot.startAt > now) continue;
      const post = await ctx.db.get(slot.postId);
      if (!post) continue;
      hero.push({
        slotOrder: slot.slotOrder,
        postId: post._id,
        title: slot.headlineOverride ?? post.title,
        ctaLabel: slot.ctaLabel ?? null,
        disclosureClass: slot.disclosureClass,
        isCommunityTop: slot.disclosureClass === "community_top",
      });
      if (hero.length >= 6) break; // render 4–6 (l.132)
    }

    const trending = await ctx.db
      .query("vibingTrends")
      .withIndex("by_status_trendScore", (q: any) => q.eq("status", "trending"))
      .order("desc")
      .take(8);
    const vibing = [];
    for (const trend of trending) {
      if (trend.cooldownUntil && trend.cooldownUntil > now) continue;
      const hook = await ctx.db
        .query("vibingHooks")
        .withIndex("by_object", (q: any) => q.eq("objectType", trend.objectType).eq("objectId", trend.objectId))
        .first();
      vibing.push({
        objectType: trend.objectType,
        objectId: trend.objectId,
        // Neutral-fallback hook (CAP-190): stale/insufficient → the neutral
        // title is the fallback; no emotion attributed to a named user.
        hook: hook && !hook.stale && hook.groundingStatus === "grounded" ? hook.hookText : null,
        humans: trend.distinctHumanCount,
      });
    }

    const featuredRows = await ctx.db
      .query("vibingFeatured")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .take(2); // ≤1–2 active (l.136 cadence)
    const featured = featuredRows
      .filter((f: any) => f.endAt > now && f.startAt <= now)
      .map((f: any) => ({ postId: f.postId, label: f.label })); // pulled never reaches here (status filter)

    const podium = await ctx.db
      .query("leaderboardProjections")
      .withIndex("by_category_window", (q: any) => q.eq("category", "overall").eq("window", "d7"))
      .unique();

    const typeNav = await ctx.db
      .query("postTypeConfig")
      .withIndex("by_type")
      .collect()
      .then((rows: any[]) => rows.filter((r) => r.state === "active").map((r) => ({ type: r.type, label: r.label })));

    return {
      hero,
      vibing, // A7 degrade: a labeled list, not an invented ticker (F-24)
      featured,
      podium: podium && podium.minThresholdMet
        ? { forming: false, entries: podium.entries.slice(0, 5) }
        : { forming: true }, // "Podium is forming" (CAP-294) — M12 computes in Phase 7
      typeNav, // launch_pad/gigs hidden by state (CAP-186)
    };
  },
});

/** CAP-199 — the why-drawer source (member-only). */
export const getWhy = query({
  args: { postId: v.id("posts") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    const score = await ctx.db
      .query("postDistributionScores")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .unique();
    const exploration = await ctx.db
      .query("feedExplorationState")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .unique();
    if (!score) return null;
    return {
      topScore: score.topScore,
      hotScore: score.hotScore,
      engagement: {
        valuable: score.valuableWeighted,
        replies: score.replyCount,
        saves: score.saveCount,
        distinctCommenters: score.distinctCommenters,
      },
      exploration: exploration
        ? { deficit: Math.max(0, exploration.qualifiedExposureTarget - exploration.qualifiedExposureCount), injected: exploration.insertionCount }
        : null,
    };
  },
});

/** CAP-200 — hide / mute / report (see-fewer fenced: no write target). */
export const cardAction = mutation({
  args: {
    postId: v.id("posts"),
    action: v.union(v.literal("hide"), v.literal("mute"), v.literal("report")),
    reasonCode: v.optional(v.string()),
  },
  returns: v.object({ done: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("feed.cardAction: authentication required");

    if (args.action === "report") {
      const user = await ctx.db.get(userId);
      // bible l.239 — immutable intake; many → one case; volume ≠ guilt
      await ctx.db.insert("reports", {
        targetType: "post",
        targetId: args.postId,
        reporterId: userId,
        reasonCode: args.reasonCode ?? "member_report",
        reporterTrustAtTime: user?.trustTier ?? undefined,
        dedupeKey: `post:${args.postId}:member_report`,
        status: "open",
        createdAt: Date.now(),
      });
    } else {
      const session = await ensureSessionRow(ctx, userId, "hot");
      const key = args.action === "hide" ? "hiddenPostIds" : "mutedPostIds";
      const list = [...(session[key] ?? [])];
      if (!list.includes(args.postId)) list.push(args.postId);
      await ctx.db.patch(session._id, { [key]: list });
    }

    await captureEvent(ctx, {
      eventType: "feed.card_action",
      schemaVersion: 1,
      eventClass: "outcome",
      userId,
      targetType: "post",
      targetId: args.postId,
      source: "direct",
      isStaff: false,
      isPersona: false,
      isCountableAtWrite: false,
      action: args.action,
    } as any);
    return { done: true };
  },
});

/** CAP-553 `feed.unhide` — the reverse path (unhide + unmute). */
export const unhide = mutation({
  args: { postId: v.id("posts"), unmute: v.optional(v.boolean()) },
  returns: v.object({ done: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("feed.unhide: authentication required");
    const session = await sessionRow(ctx, userId);
    if (!session) return { done: false };
    const patch: Record<string, unknown> = {};
    patch.hiddenPostIds = (session.hiddenPostIds ?? []).filter((id: string) => id !== args.postId);
    if (args.unmute) patch.mutedPostIds = (session.mutedPostIds ?? []).filter((id: string) => id !== args.postId);
    await ctx.db.patch(session._id, patch);
    return { done: true };
  },
});

/** The member's hidden/muted lists (settings-adjacent surface for CAP-553). */
export const getHidden = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    const session = await sessionRow(ctx, userId);
    return {
      hiddenPostIds: session?.hiddenPostIds ?? [],
      mutedPostIds: session?.mutedPostIds ?? [],
    };
  },
});
