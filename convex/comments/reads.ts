/**
 * reads — SLICE-P5-03: CAP-123/124 — the six sort modes with
 * cursor-rankVersion freezing + the thread page query.
 *
 * CAP-123 (quoted): "Cursor-based; freezes rankVersion per session."
 *   Cursors are key-boundary blobs (sort mode + last sort key): a session
 *   walks the ordering captured at its page boundary, so a concurrent
 *   recompute (P5-04) cannot reshuffle rows already served — the freeze.
 *   The page's rankVersion rides the response for display/debug.
 * CAP-125 (quoted): "The single positive numerator for Best. Weight =
 *   signalReputation + legitimacy, never Recognition" — Best reads the
 *   P5-04 projection (bestScore), it never recomputes here.
 *
 * Sort modes (contract §3 A): best · live · new · top · most_discussed ·
 *   qa. v1 interpretations, flagged: `top` = engagement blend (valuable +
 *   replies + saves, recency tiebreak — the register names the mode but
 *   not its formula; DECISIONS-LOCKED #11's Top blend applies at the feed,
 *   the comment field set has no topScore); `qa` = accepted pinned, then
 *   best. Score-based sorts EXCLUDE persona-authored comments (INV-6:
 *   "Persona-excluded from M6 rank"); personas render in `new` and in
 *   group fetches (§3 K — AI-badged), flagged interpretation.
 *
 * Display gating (fail-closed): only moderationStatus=passed comments are
 *   publicly listed; pending/held/rejected are invisible (not a leak
 *   signal); tombstones render as placeholders with replies preserved.
 *
 * Anonymous-safe vs member branches (public-read-query rule): anonymous
 *   responses carry NO viewer state; member responses add actor-specific
 *   state only (own reaction/save/read-position) — never anyone else's
 *   private state (negative reasons are PRIVATE, CAP-128).
 *
 * MAX panel (CAP-124): renders EMPTY until Phase 7's CAP-132/133 — the
 *   same layering caveat as the base screen; themes/positions refs return
 *   null here, never invented.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/** CAP-139 hot-window bounds (quoted): "≤100 live top-level, ≤5 expanded
 *  groups, ≤50 replies/group". The list scan cap mirrors the top-level
 *  bound; expanded-group control is client-side (≤5 open groups). */
const MAX_TOP_LEVEL = 100;
const MAX_REPLIES_PER_GROUP = 50;
const DEFAULT_PAGE_SIZE = 20;

export type SortMode = "best" | "live" | "new" | "top" | "most_discussed" | "qa";

/** Only passed comments are publicly listable (fail-closed display). */
function publiclyListable(comment: any): boolean {
  return comment.moderationStatus === "passed" && !comment.deletedAt;
}

interface SortKey {
  primary: number; // score / timestamp depending on mode
  secondary: number; // createdAt tiebreak
  id: string;
}

interface ScoredComment {
  comment: any;
  key: SortKey;
}

async function scoresByComment(ctx: any, commentIds: string[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  for (const id of commentIds) {
    const row = await ctx.db
      .query("commentScores")
      .withIndex("by_comment", (q: any) => q.eq("commentId", id))
      .unique();
    if (row) map.set(id, row);
  }
  return map;
}

/** The comment card — anonymous-safe base; viewer state added for members. */
function toCard(comment: any, scores: any | undefined, viewer: { reacted: string | null; saved: boolean } | null, authorName: string | null) {
  return {
    id: comment._id,
    depth: comment.depth,
    authorType: comment.authorType,
    authorName,
    aiBadged: comment.authorType === "persona", // FATAL-M17-02 label
    body: comment.deletedAt ? null : comment.body, // tombstone: body withheld
    tombstone: Boolean(comment.deletedAt),
    authorIntent: comment.authorIntent ?? null,
    isQuestion: comment.isQuestion,
    editedAt: comment.editedAt ?? null,
    createdAt: comment.createdAt,
    counts: {
      valuable: scores?.valuableCount ?? 0,
      replies: scores?.replyCount ?? comment.depth === 0 ? (scores?.replyCount ?? 0) : 0,
      saves: scores?.saveCount ?? 0,
    },
    viewer,
  };
}

async function authorNameOf(ctx: any, comment: any): Promise<string | null> {
  if (comment.authorType === "persona") return "AI persona"; // M8 name joins at P5-09
  if (!comment.authorUserId) return null;
  const user = await ctx.db.get(comment.authorUserId);
  return user?.displayName ?? user?.email?.split("@")[0] ?? null;
}

/** CAP-123 `comments.list` — top-level comments by sort mode. */
export const list = query({
  args: {
    postId: v.id("posts"),
    sortMode: v.union(
      v.literal("best"), v.literal("live"), v.literal("new"),
      v.literal("top"), v.literal("most_discussed"), v.literal("qa"),
    ),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? DEFAULT_PAGE_SIZE, MAX_TOP_LEVEL);

    // Top-level candidates (hot-window bound)
    const topLevel = await ctx.db
      .query("comments")
      .withIndex("by_post_depth_created", (q: any) => q.eq("postId", args.postId).eq("depth", 0))
      .take(MAX_TOP_LEVEL);

    // Display gate: passed + non-tombstoned; tombstoned top-level render
    // as placeholders ONLY if they have surviving replies — v1 keeps them
    // listed (replies preserved, CAP-122); flagged simple-list choice.
    const visible = topLevel.filter((c: any) =>
      c.moderationStatus === "passed" || (c.deletedAt && c.moderationStatus === "passed"));

    const scores = await scoresByComment(ctx, visible.map((c: any) => c._id));

    // qa: accepted answer pinned (postHelps is the authority — bible l.114)
    let acceptedId: string | null = null;
    if (args.sortMode === "qa") {
      const help = await ctx.db
        .query("postHelps")
        .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
        .unique();
      acceptedId = help?.acceptedCommentId ?? null;
    }

    const personaExcluded = new Set(["best", "live", "top", "most_discussed", "qa"]); // INV-6
    const scored: ScoredComment[] = [];
    for (const comment of visible) {
      const s = scores.get(comment._id);
      if (personaExcluded.has(args.sortMode) && comment.authorType === "persona") continue;
      let primary: number;
      switch (args.sortMode) {
        case "best": primary = s?.bestScore ?? 0; break;
        case "live": primary = s?.liveScore ?? 0; break;
        case "top": primary = (s?.valuableCount ?? 0) + (s?.replyCount ?? 0) + (s?.saveCount ?? 0); break; // flagged blend
        case "most_discussed": primary = s?.mostDiscussedScore ?? 0; break;
        case "new": primary = comment.createdAt; break;
        case "qa": primary = comment._id === acceptedId ? Number.MAX_SAFE_INTEGER : (s?.bestScore ?? 0); break;
      }
      scored.push({ comment, key: { primary, secondary: comment.createdAt, id: comment._id } });
    }

    scored.sort((a, b) =>
      b.key.primary - a.key.primary || b.key.secondary - a.key.secondary || (a.key.id < b.key.id ? -1 : 1),
    );

    // Cursor freeze: continue strictly below the boundary key
    let startIdx = 0;
    if (args.cursor) {
      try {
        const boundary = JSON.parse(args.cursor) as SortKey;
        startIdx = scored.findIndex(
          (s) => s.key.primary === boundary.primary && s.key.secondary === boundary.secondary && s.key.id === boundary.id,
        );
        startIdx = startIdx === -1 ? scored.length : startIdx + 1;
      } catch {
        startIdx = 0; // malformed cursor restarts — never throws to the client
      }
    }

    const page = scored.slice(startIdx, startIdx + limit);
    const next = scored.slice(startIdx + limit, startIdx + limit + 1);
    const rankVersion = page.reduce((max, s) => Math.max(max, scores.get(s.comment._id)?.rankVersion ?? 0), 0);

    // Viewer state (member-only branch; anonymous gets viewer=null)
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    const cards = [];
    for (const s of page) {
      let viewer: { reacted: string | null; saved: boolean } | null = null;
      if (userId) {
        const reaction = await ctx.db
          .query("commentReactions")
          .withIndex("by_user_comment", (q: any) => q.eq("userId", userId).eq("commentId", s.comment._id))
          .unique();
        const save = await ctx.db
          .query("commentSaves")
          .withIndex("by_user_comment", (q: any) => q.eq("userId", userId).eq("commentId", s.comment._id))
          .unique();
        viewer = { reacted: reaction?.reactionType ?? null, saved: Boolean(save) };
      }
      cards.push(toCard(s.comment, scores.get(s.comment._id), viewer, await authorNameOf(ctx, s.comment)));
    }

    return {
      page: cards,
      cursor: next.length > 0 ? JSON.stringify(page[page.length - 1].key) : null,
      rankVersion,
      bounds: { maxTopLevel: MAX_TOP_LEVEL }, // CAP-139 transparency
    };
  },
});

/** Reply group fetch — chronological, ≤50/group (CAP-139 bound). */
export const listReplies = query({
  args: {
    threadRootCommentId: v.id("comments"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? MAX_REPLIES_PER_GROUP, MAX_REPLIES_PER_GROUP);
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_thread_root_created", (q: any) => q.eq("threadRootCommentId", args.threadRootCommentId))
      .take(MAX_REPLIES_PER_GROUP);
    const depth1 = replies.filter((r: any) => r.depth === 1 && r.moderationStatus === "passed");
    const scores = await scoresByComment(ctx, depth1.map((r: any) => r._id));

    let startIdx = 0;
    if (args.cursor) {
      const boundary = JSON.parse(args.cursor) as { id: string };
      startIdx = depth1.findIndex((r: any) => r._id === boundary.id);
      startIdx = startIdx === -1 ? depth1.length : startIdx + 1;
    }
    const page = depth1.slice(startIdx, startIdx + limit);
    const next = depth1.slice(startIdx + limit, startIdx + limit + 1);

    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    const cards = [];
    for (const r of page) {
      let viewer: { reacted: string | null; saved: boolean } | null = null;
      if (userId) {
        const reaction = await ctx.db
          .query("commentReactions")
          .withIndex("by_user_comment", (q: any) => q.eq("userId", userId).eq("commentId", r._id))
          .unique();
        const save = await ctx.db
          .query("commentSaves")
          .withIndex("by_user_comment", (q: any) => q.eq("userId", userId).eq("commentId", r._id))
          .unique();
        viewer = { reacted: reaction?.reactionType ?? null, saved: Boolean(save) };
      }
      cards.push(toCard(r, scores.get(r._id), viewer, await authorNameOf(ctx, r)));
    }
    return {
      page: cards,
      cursor: next.length > 0 ? JSON.stringify({ id: page[page.length - 1]._id }) : null,
      bound: MAX_REPLIES_PER_GROUP,
    };
  },
});

/**
 * CAP-124 `comments.getThread` — the thread page view: post refs +
 * plugin overlay + stats + first page (default sort `best` — flagged:
 * default mode is register-unnamed) + MAX refs (null until Phase 7).
 * Read-scoping: a member's own read-position rides the response; other
 * users' negative-reaction reasons NEVER appear (PRIVATE, CAP-128).
 */
export const getThread = query({
  args: { postId: v.id("posts"), sortMode: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.lifecycleStatus !== "published") return null;

    const stats = await ctx.db
      .query("threadStats")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .unique();

    // threadPluginConfig: allowedSortModes overlay (may NEVER redefine
    // depth/authorship/moderation/URL/persona/pagination — read only)
    const pluginRows = await ctx.db
      .query("threadPluginConfig")
      .withIndex("by_postType_featureKey", (q: any) => q.eq("postType", post.type))
      .take(10);
    const overlay = pluginRows.find((r: any) => r.enabled && r.featureKey === "thread.overlay") ?? null;
    const allowedSortModes: SortMode[] = overlay?.config?.allowedSortModes ?? [
      "best", "live", "new", "top", "most_discussed", "qa",
    ];

    const help = await ctx.db
      .query("postHelps")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .unique();

    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    let readState: { lastReadCommentId: string | null; lastSeenHumanCommentCount: number; lastSeenThreadRevision: number } | null = null;
    if (userId) {
      const row = await ctx.db
        .query("threadReadStates")
        .withIndex("by_user_post", (q: any) => q.eq("userId", userId).eq("postId", args.postId))
        .unique();
      if (row) {
        readState = {
          lastReadCommentId: row.lastReadCommentId ?? null,
          lastSeenHumanCommentCount: row.lastSeenHumanCommentCount,
          lastSeenThreadRevision: row.lastSeenThreadRevision,
        };
      }
    }

    return {
      post: { id: post._id, type: post.type, title: post.title },
      stats: stats ?? {
        humanCommentCount: 0, personaCommentCount: 0, topLevelCount: 0, replyCount: 0,
        humanParticipantCount: 0, unresolvedQuestionCount: 0, latestActivityAt: null,
        threadRevision: 0,
      },
      allowedSortModes,
      defaultSortMode: "best",
      help: help ? { resolvedStatus: help.resolvedStatus, acceptedCommentId: help.acceptedCommentId ?? null } : null,
      readState,
      maxPanel: null, // Phase 7 (CAP-132/133) — renders empty, never invented
    };
  },
});
