/**
 * legalContent — versioned legal/trust document serving + admin lifecycle.
 * DECISIONS-LOCKED #9 (E5/E6): append-only rows; manual publish only;
 * rollback = publish a prior version; no destructive edits anywhere.
 *
 * Admin authority NOTE: gating currently uses the live app's
 * `forumProfiles.role === "admin"` store. Per PRD/00-TRANSITION.md, when the
 * canonical `roleAssignments` authz lands (P2-01/P3-01), swap this check to
 * `assertAdminPermission` — the table/API shape below does not change.
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

import { LEGAL_SEED_DOCS } from "./legalContentSeed";

async function requireAdmin(ctx: any): Promise<any> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Sign in required.");
  const profile = await ctx.db
    .query("forumProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
  if (!profile || profile.role !== "admin") throw new Error("Insufficient permissions.");
  return { userId };
}

/** Published version for a docKey (or null → caller renders unavailable_pending_legal). */
export const getPublished = query({
  args: { docKey: v.string() },
  handler: async (ctx, { docKey }) => {
    const row = await ctx.db
      .query("contentVersions")
      .withIndex("by_docKey_status", (q) => q.eq("docKey", docKey).eq("status", "published"))
      .order("desc")
      .first();
    return row ?? null;
  },
});

/** All versions of a docKey, newest first (admin list view). */
export const listVersions = query({
  args: { docKey: v.string() },
  handler: async (ctx, { docKey }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("contentVersions")
      .withIndex("by_docKey_version", (q) => q.eq("docKey", docKey))
      .order("desc")
      .collect();
  },
});

/** Create a new DRAFT version (next monotonic version). Append-only: inserts, never edits. */
export const saveDraft = mutation({
  args: { docKey: v.string(), title: v.string(), bodyMarkdown: v.string(), changeNote: v.optional(v.string()) },
  handler: async (ctx, { docKey, title, bodyMarkdown, changeNote }) => {
    const { userId } = await requireAdmin(ctx);
    const latest = await ctx.db
      .query("contentVersions")
      .withIndex("by_docKey_version", (q) => q.eq("docKey", docKey))
      .order("desc")
      .first();
    const version = (latest?.version ?? 0) + 1;
    return await ctx.db.insert("contentVersions", {
      docKey,
      version,
      title,
      bodyMarkdown,
      status: "draft",
      changeNote,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

/**
 * Publish a version (manual action only). Flips the currently published row to
 * `superseded` and the target row to `published` + publishedAt/publishedBy.
 * Publishing an older version is the sanctioned ROLLBACK path.
 */
export const publish = mutation({
  args: { docKey: v.string(), version: v.number() },
  handler: async (ctx, { docKey, version }) => {
    const { userId } = await requireAdmin(ctx);
    const target = await ctx.db
      .query("contentVersions")
      .withIndex("by_docKey_version", (q) => q.eq("docKey", docKey).eq("version", version))
      .unique();
    if (!target) throw new Error("Version not found.");

    const current = await ctx.db
      .query("contentVersions")
      .withIndex("by_docKey_status", (q) => q.eq("docKey", docKey).eq("status", "published"))
      .unique();
    if (current && current._id !== target._id) {
      await ctx.db.patch(current._id, { status: "superseded" });
    }
    if (target.status === "superseded" || target.status === "draft") {
      await ctx.db.patch(target._id, {
        status: "published",
        publishedBy: userId,
        publishedAt: Date.now(),
      });
    }
    return target._id;
  },
});

/**
 * Seed v1 published rows for the four founder-drafted documents if a docKey
 * has no versions yet (idempotent; run: `pnpm convex:seed-legal`).
 * The header banner ("founder-drafted, not lawyer-reviewed") travels inside
 * the markdown, so every version honestly self-labels until legal review.
 */
export const seedDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];
    for (const doc of LEGAL_SEED_DOCS) {
      const existing = await ctx.db
        .query("contentVersions")
        .withIndex("by_docKey_version", (q) => q.eq("docKey", doc.docKey))
        .first();
      if (existing) {
        results.push(`${doc.docKey}: skipped (versions exist)`);
        continue;
      }
      const id = await ctx.db.insert("contentVersions", {
        docKey: doc.docKey,
        version: 1,
        title: doc.title,
        bodyMarkdown: doc.bodyMarkdown,
        status: "published",
        changeNote: "Founder-drafted v1 (DECISIONS-LOCKED #9) — seeded published",
        publishedAt: Date.now(),
        createdAt: Date.now(),
      });
      results.push(`${doc.docKey}: seeded v1 published (${id})`);
    }
    return results;
  },
});
