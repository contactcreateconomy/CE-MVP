/**
 * wiki — SLICE-P7A-09: CAP-418/419/420 — get + missing + deploySync.
 *
 * CAP-418 (quoted): "requires staff-role shell entry" (Wave 7B E1 — the
 *   six-role staff set; consumed, not re-derived) + "Sanitization still
 *   blocks script injection." Anonymous/member wiki.get FAILS the gate.
 * CAP-420 (quoted): missing slug renders the explicit "no article yet",
 *   never a broken panel.
 * CAP-419 (quoted): "Founder cannot inject scripts; soft-beta ships P0
 *   widget articles" — deploySync is source-controlled (internal), the
 *   body is sanitized Markdown, and no in-app editor exists (OQ#3 fence).
 * Sanitization policy (OQ#5 fence): strip script tags, iframes, on-attrs, javascript: URLs
 *   — a named Markdown-extension list would be stop-and-report.
 */

import { query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission, STAFF_ROLES } from "../lib/authz";

/** Strip the injection classes (OQ#5 fence). */
export function sanitizeMarkdown(md: string): string {
  return md
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

async function requireAnyStaffRole(ctx: any): Promise<void> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("wiki: authentication required");
  const roles = await assertAdminPermission(ctx); // throws NOT_STAFF for members
  if (roles.length === 0) throw new Error("wiki: staff-role shell entry required (CAP-418)");
}
void STAFF_ROLES;

/** CAP-418 wiki.get — sanitized Markdown; never executable HTML/JS. */
export const get = query({
  args: { slug: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAnyStaffRole(ctx);
    const rows = await ctx.db
      .query("adminWikiArticles")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .take(10);
    const latest = rows.sort((a: any, b: any) => b.version - a.version)[0] ?? null;
    if (!latest) {
      // CAP-420 (quoted): explicit "no article yet", not a broken panel
      return { state: "missing", message: "No article yet — this runbook has not been written." };
    }
    return {
      state: "ok",
      slug: latest.slug,
      title: latest.title,
      domain: latest.domain,
      bodyMarkdown: latest.bodyMarkdown, // sanitized at deploySync; Markdown, not HTML
      relatedWidgetKeys: latest.relatedWidgetKeys,
      constraintsSummary: latest.constraintsSummary,
      version: latest.version,
      updatedAt: latest.updatedAt,
    };
  },
});

/** CAP-419 wiki.deploySync — repo → table at deploy; Founder cannot inject
 *  scripts (the sanitizer runs regardless of source). Internal only. */
export const deploySync = internalMutation({
  args: { articles: v.array(v.object({
    slug: v.string(),
    title: v.string(),
    domain: v.string(),
    bodyMarkdown: v.string(),
    relatedWidgetKeys: v.array(v.string()),
    constraintsSummary: v.string(),
  })) },
  returns: v.object({ synced: v.number() }),
  handler: async (ctx, args) => {
    let synced = 0;
    for (const article of args.articles) {
      const rows = await ctx.db
        .query("adminWikiArticles")
        .withIndex("by_slug", (q: any) => q.eq("slug", article.slug))
        .take(50);
      const latest = rows.sort((a: any, b: any) => b.version - a.version)[0] ?? null;
      const sanitized = sanitizeMarkdown(article.bodyMarkdown);
      if (latest && latest.bodyMarkdown === sanitized) continue; // unchanged
      await ctx.db.insert("adminWikiArticles", {
        ...article,
        bodyMarkdown: sanitized, // script injection blocked at sync (quoted)
        version: (latest?.version ?? 0) + 1,
        updatedAt: Date.now(),
        updatedBy: "deploy",
      });
      synced += 1;
    }
    return { synced };
  },
});

/** The P0 article list for the wiki index (staff-gated like get). */
export const listSlugs = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    await requireAnyStaffRole(ctx);
    const rows = await ctx.db.query("adminWikiArticles").take(100);
    const latest = new Map<string, any>();
    for (const r of rows) {
      const cur = latest.get(r.slug);
      if (!cur || r.version > cur.version) latest.set(r.slug, r);
    }
    return { slugs: [...latest.values()].map((a) => ({ slug: a.slug, title: a.title, domain: a.domain })) };
  },
});
