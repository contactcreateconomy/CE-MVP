/**
 * posts/detail — SLICE-P4-13: the post-detail reads (CAP-089/090/091/092 +
 * CAP-107 posture + CAP-106 read tolerance).
 *
 * CAP-090 Notes (quoted): "Returns {post, extension, threadContext};
 *   threadContext = {type, mechanic state, acceptedCommentId?, userVote?}
 *   for M6." Lookup key = postSeoMeta.slug (contract OQ#2 — register
 *   unnamed; the route param is [slug]).
 * CAP-092 Notes (quoted): "NO numeric scores stored in postCompares" — the
 *   compare grid live-computes overall = ratingSum/ratingCount and
 *   per-dimension averages from the tools aggregate; count 0 → "—";
 *   2≤toolIds≤4.
 * CAP-091 Notes (quoted): "Paginated by active type." — M4 owns this query;
 *   P6-03's feed consumes it (never re-implemented there).
 * CAP-089 Notes (quoted): "Tombstone; comments preserved." — soft-delete
 *   flips lifecycleStatus to archived; the render shows a tombstone; the
 *   thread (Phase 5) is untouched.
 * CAP-107 Notes (quoted): "Page ships noindex in Wave 2, flips to
 *   indexable only when CAP-468 ships in Wave 7 — same-wave pairing
 *   required by FATAL-M17-01, never separated." — the PAGE sets noindex
 *   unconditionally this wave; nothing query-side decides indexability.
 * CAP-106 Notes (quoted): "M4 read tolerates cleared ref → Help reverts to
 *   open." — the Help mechanic surfaces resolvedStatus; when P5-02's
 *   comment-delete clears acceptedCommentId, the stored resolvedStatus is
 *   overridden to open at read time (tolerance, not a write).
 * Fence OQ#3: anonymous gets the SSR shell + reads; interactive mechanics
 *   for anonymous are unspecified — userVote is only computed signed-in.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { paginationOptsValidator } from "convex/server";

/** The extension row for a post, by its type. */
async function loadExtension(ctx: any, postId: Id<"posts">, type: string): Promise<any> {
  const table = {
    news: "postNews", review: "postReviews", compare: "postCompares",
    spark: "postSparks", debate: "postDebates", list: "postLists",
    showcase: "postShowcases", help: "postHelps",
  }[type];
  if (!table) return null;
  const row = await ctx.db.query(table).withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique();
  return row ?? null;
}

/** CAP-092 — live-computed compare rows from the tools aggregate. */
async function compareRows(ctx: any, toolIds: string[]): Promise<any[]> {
  const DIMENSIONS = ["ease_of_use", "output_quality", "reliability", "value_for_money"] as const;
  const rows = [];
  for (const toolId of toolIds) {
    const tool = await ctx.db.get(toolId as Id<"tools">);
    if (!tool) continue;
    const dims: Record<string, { avg: number | null; count: number }> = {};
    for (const dim of DIMENSIONS) {
      const sum = (tool.dimensionSums as any)?.[dim] ?? 0;
      const count = (tool.dimensionCounts as any)?.[dim] ?? 0;
      dims[dim] = { avg: count > 0 ? sum / count : null, count };
    }
    rows.push({
      toolId,
      name: tool.name,
      overall: tool.ratingCount > 0 ? tool.ratingSum / tool.ratingCount : null, // count 0 → null → "—"
      ratingCount: tool.ratingCount,
      dimensions: dims,
    });
  }
  return rows;
}

/** CAP-090 — the post-detail read. */
export const getDetail = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const seo = await ctx.db
      .query("postSeoMeta")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();
    if (!seo) return null;
    const post = await ctx.db.get(seo.postId);
    if (!post) return null;
    // Public + published/archived only (held/rejected/private/unlisted never
    // resolve a live detail — they render the SSR shell with noindex per
    // CAP-107). Archived = the CAP-089 tombstone (thread preserved).
    if (post.visibility !== "public" || (post.lifecycleStatus !== "published" && post.lifecycleStatus !== "archived")) {
      return null;
    }

    const extension = await loadExtension(ctx, post._id, post.type);

    // threadContext (CAP-090) — mechanic state + signed-in user's vote
    const userId = await getAuthUserId(ctx);
    let mechanic: any = null;
    let userVote: string | null = null;
    if (post.type === "debate" && extension) {
      const voted = userId
        ? await ctx.db
            .query("debateVotes")
            .withIndex("by_user_post", (q: any) => q.eq("userId", userId).eq("postId", post._id))
            .unique()
        : null;
      userVote = voted?.choice ?? null;
      mechanic = { agreeCount: extension.agreeCount, disagreeCount: extension.disagreeCount, abstainCount: extension.abstainCount };
    } else if (post.type === "list" && extension) {
      const items = await ctx.db
        .query("postListItems")
        .withIndex("by_postListId_sortOrder", (q: any) => q.eq("postListId", extension._id))
        .collect();
      const votedIds = userId
        ? (await Promise.all(
            items.map(async (it: any) =>
              (await ctx.db
                .query("listItemVotes")
                .withIndex("by_user_item", (q: any) => q.eq("userId", userId).eq("postListItemId", it._id))
                .unique()) ? it._id : null),
          )).filter(Boolean)
        : [];
      mechanic = { mode: extension.mode, items, votedItemIds: votedIds };
    } else if (post.type === "help" && extension) {
      // CAP-106 read tolerance: a cleared accepted ref reverts Help to open
      const open = !extension.acceptedCommentId || extension.resolvedStatus === "open";
      mechanic = {
        resolvedStatus: open ? "open" : extension.resolvedStatus,
        acceptedCommentId: open ? null : extension.acceptedCommentId,
        acceptedAt: open ? null : extension.acceptedAt,
      };
    }

    // CAP-092 — live compare rows (nothing stored)
    const compare = post.type === "compare" ? await compareRows(ctx, extension?.toolIds ?? post.toolIds ?? []) : null;

    // Structured affiliate CTAs (CAP-049 render contract: rel sponsored
    // nofollow noopener, never prose)
    const affiliateLinks = await ctx.db
      .query("postAffiliateLinks")
      .withIndex("by_postId", (q: any) => q.eq("postId", post._id))
      .collect();
    const ctas = [];
    for (const al of affiliateLinks) {
      const link = await ctx.db.get(al.affiliateLinkId);
      if (link && link.status === "active") ctas.push({ url: link.url, labelType: al.labelType, toolId: al.toolId ?? link.toolId ?? null });
    }

    return {
      post: {
        _id: post._id, type: post.type, title: post.title, body: post.body,
        authorType: post.authorType, editorialByline: post.editorialByline ?? null,
        publishedAt: post.publishedAt ?? null, toolIds: post.toolIds,
        archived: post.lifecycleStatus === "archived", // tombstone render (CAP-089)
      },
      seo: { slug: seo.slug, seoTitle: seo.seoTitle, seoDescription: seo.seoDescription },
      extension,
      threadContext: { type: post.type, mechanic, userVote },
      compare,
      affiliateCtas: ctas,
    };
  },
});

/** CAP-091 — paginated by active type (M4-owned; P6-03's feed consumes). */
export const listByType = query({
  args: { type: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("posts")
      .withIndex("by_type_lifecycleStatus", (q: any) => q.eq("type", args.type).eq("lifecycleStatus", "published"))
      .order("desc")
      .paginate(args.paginationOpts);
    const items = [];
    for (const post of page.page) {
      if (post.visibility !== "public") continue;
      const seo = await ctx.db
        .query("postSeoMeta")
        .withIndex("by_postId", (q: any) => q.eq("postId", post._id))
        .unique();
      items.push({ _id: post._id, title: post.title, slug: seo?.slug ?? null, publishedAt: post.publishedAt ?? null });
    }
    return { ...page, page: items };
  },
});

/** CAP-089 — author soft-delete: tombstone via lifecycleStatus; the thread
 *  (Phase 5 comments) is preserved untouched. */
export const softDelete = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    await assertCustomerCapability(ctx, "create_post");
    const userId = await getAuthUserId(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("posts.softDelete: not found");
    if (post.authorUserId !== userId) throw new Error("posts.softDelete: not the author");
    if (post.lifecycleStatus === "archived") return { already: true };

    return await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.postId, { lifecycleStatus: "archived" });
      return {
        actorId: userId,
        action: "posts.softDelete",
        target: `post:${args.postId}`,
        prev: { lifecycleStatus: post.lifecycleStatus },
        next: { lifecycleStatus: "archived" },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});
