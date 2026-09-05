/**
 * tags — SLICE-P4-03: controlled taxonomy exposure (CAP-534) + member tag
 * set/edit on posts (CAP-530).
 *
 * CAP-534 (System): "System exposes controlled tag taxonomy for member
 * selection" — read-only reference list surfaced in the tag picker. `tags`
 * is the data-model Bible name (slug, name, tagType, color, sortOrder,
 * status). Admin editability rides the register's Admin-Config flag
 * ("YES — taxonomy entries editable by admin") via the `tags.taxonomy.editable`
 * config-registry key — no member write path to `tags` exists in this module.
 *
 * CAP-530 (member): "Member sets/edits tags on a post during compose or
 * edit" — Reads postTags (existing tags for edit prefill) + tags (CAP-534
 * taxonomy reference); Writes postTags (create/update join rows); gated by
 * CAP-086. Notes (quoted): "Tags via `postTags` join only, no `tagIds[]` …
 * selection is constrained to the controlled `tags` taxonomy exposed by
 * CAP-534 — select-from-list, not free text." Free text is rejected at the
 * args boundary (only `v.id("tags")` values are accepted) and unknown or
 * inactive taxonomy entries are rejected here — the constraint is
 * server-enforced, not UI-only.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "./lib/authz";
import { writeAudited, newCorrelationId } from "./lib/audit";

/**
 * CAP-534's Admin-Config flag ("YES — taxonomy entries editable by admin")
 * rides the typed-config pattern via this registry row (consumed by the
 * admin taxonomy console when its screen lands — no new screen this phase).
 * Seeded by P1-08's seed.bootstrap (idempotent by key); default true per
 * the register's flag column.
 */
export const TAXONOMY_REGISTRY_ROW = {
  key: "tags.taxonomy.editable",
  module: "m4",
  valueType: "boolean" as const,
  default: true,
  editTier: "tier2" as const,
  blastRadius: "Controls whether admins may edit the controlled tag taxonomy.",
  effectiveTiming: "immediate" as const,
  reversible: true,
  sealed: false,
};

/**
 * CAP-534 — the controlled taxonomy reference list for the tag picker.
 * Active entries only (a retired/deactivated entry is not "exposed for
 * member selection"), ordered by sortOrder. The `status: "active"` literal
 * follows the categories precedent (P1-08 seed, bible l.71).
 */
export const listTaxonomy = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("tags")
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .collect();
    return rows.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  },
});

/**
 * CAP-530 read half — existing tags on a post, joined to their taxonomy
 * rows, for edit prefill in the picker.
 */
export const getPostTags = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const joins = await ctx.db
      .query("postTags")
      .withIndex("by_postId_tagId", (q: any) => q.eq("postId", postId))
      .collect();
    const out = [];
    for (const join of joins) {
      const tag = await ctx.db.get(join.tagId);
      // A deleted taxonomy row leaves a dangling join — skip it rather than
      // render an unnamed chip (the join row itself is cleaned up on the
      // next setPostTags diff-sync).
      if (!tag) continue;
      out.push({ tagId: join.tagId, slug: tag.slug, name: tag.name, status: tag.status });
    }
    return out;
  },
});

/** Pure set-diff for the join-row sync (unit-tested). */
export function diffTagSets<T>(existing: T[], submitted: T[]): { added: T[]; removed: T[] } {
  const existingSet = new Set(existing);
  const submittedSet = new Set(submitted);
  const added = [...submittedSet].filter((id) => !existingSet.has(id));
  const removed = [...existingSet].filter((id) => !submittedSet.has(id));
  return { added, removed };
}

/**
 * CAP-530 write half — set/edit a post's tags (set semantics: the submitted
 * list IS the post's tag set; diff-synced against existing join rows).
 * CAP-086 gate chain via the same customer guard as posts.create; only the
 * post's own user-author may tag.
 */
export const setPostTags = mutation({
  args: {
    // Mirror the postTags schema validators (FK types, not loose strings).
    postId: v.id("posts"),
    tagIds: v.array(v.id("tags")),
  },
  handler: async (ctx, args) => {
    await assertCustomerCapability(ctx, "create_post");

    const userId = await getAuthUserId(ctx) as any;
    if (!userId) throw new Error("tags.setPostTags: authentication required");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("tags.setPostTags: post not found");
    if (post.authorType !== "user" || post.authorUserId !== userId) {
      throw new Error("tags.setPostTags: only the author can tag this post");
    }

    // Taxonomy constraint, server-side: every submitted id must resolve to
    // an ACTIVE taxonomy entry. Free text never reaches the handler (the
    // args validator only accepts tags-table ids); an unknown or inactive
    // id is rejected here — "select-from-list, not free text" is enforced
    // at the boundary AND against the taxonomy.
    const submitted = [...new Set(args.tagIds)]; // join is a set — dedupe
    for (const tagId of submitted) {
      const tag = await ctx.db.get(tagId);
      if (!tag) {
        throw new Error(`tags.setPostTags: "${tagId}" is not in the tags taxonomy (CAP-534 constraint)`);
      }
      if (tag.status !== "active") {
        throw new Error(`tags.setPostTags: tag "${tag.slug}" is not active for selection (CAP-534 constraint)`);
      }
    }

    return await writeAudited(ctx, async (actx) => {
      const joins = await actx.db
        .query("postTags")
        .withIndex("by_postId_tagId", (q: any) => q.eq("postId", args.postId))
        .collect();
      const existing = joins.map((j: any) => j.tagId as Id<"tags">);
      const { added, removed } = diffTagSets(existing, submitted);

      for (const join of joins) {
        if (removed.includes(join.tagId)) await actx.db.delete(join._id);
      }
      for (const tagId of added) {
        await actx.db.insert("postTags", {
          postId: args.postId,
          tagId,
          createdAt: Date.now(),
        });
      }

      return {
        actorId: userId,
        action: "tags.setPostTags",
        target: `post:${args.postId}`,
        prev: { tagIds: existing },
        next: { tagIds: submitted },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});
