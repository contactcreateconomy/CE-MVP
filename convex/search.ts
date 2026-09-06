/**
 * search — SLICE-P6-05: CAP-529 — /search keyword.
 *
 * Register Notes (quoted): "Keyword/text match only for MVP-1 — no ML
 *   ranking required. Scope: post title/body, tool name, profile handle/
 *   display name. Handle = users.username, display name =
 *   users.displayName — not the M7 profiles attribute table." Also
 *   quoted: "Anonymous gets same read-only results, no personalization"
 *   and "Never reads privateUserData."
 * Moderation-hidden/removed excluded. Mutation name unnamed (search OQ1)
 *   — named search.query in-slice, flagged. Pagination/ordering
 *   unspecified (OQ3/5): v1 = deterministic type-grouped, ascending by
 *   title/name, cap 50/class — a pagination contract, not a ranker.
 * rawEvents: CAP-529 Writes include rawEvents — catalog row
 *   search.query_executed (catalog-owned name, flagged; consent-free per
 *   FATAL-M18-02 class — strictly_necessary).
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { captureEvent } from "./lib/events";

export const SEARCH_EVENT_ROW = {
  schemaVersion: 1,
  eventClass: "interaction" as const,
  ownerModule: "m9",
  description: "Member/anonymous executes a keyword search (CAP-529)",
  captureMode: "same_mutation",
  piiClass: "none",
  consentGate: "strictly_necessary",
  signalEligible: false,
  s18Eligible: false,
  excludeStaff: false,
  excludePersonas: false,
  idempotencyScope: "none",
  retentionClass: "standard",
  posthogMirror: false,
  status: "active" as const,
  effectiveFrom: Date.now(),
  owner: "m9",
  eventName: "search.query_executed",
};

const PER_CLASS = 50;

/** `search.query` — keyword contains-match across the three classes. */
export const searchQuery = query({
  args: { q: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const term = args.q.trim().toLowerCase();
    if (term.length < 2) return { posts: [], tools: [], people: [] };

    // Posts: title/body keyword; moderation-hidden/removed excluded
    const posts = await ctx.db.query("posts").withIndex("by_type_lifecycleStatus", (q: any) => q.eq("lifecycleStatus", "published")).take(200);
    const matchedPosts = posts
      .filter((p: any) => p.moderationStatus === "passed" || p.moderationStatus === "not_required")
      .filter((p: any) => p.title.toLowerCase().includes(term) || p.body.toLowerCase().includes(term))
      .map((p: any) => ({ postId: p._id, type: p.type, title: p.title }))
      .sort((a: any, b: any) => a.title.localeCompare(b.title))
      .slice(0, PER_CLASS);

    // Tools: name keyword
    const tools = await ctx.db.query("tools").take(200);
    const matchedTools = tools
      .filter((t: any) => t.name.toLowerCase().includes(term))
      .map((t: any) => ({ toolId: t._id, slug: t.slug, name: t.name }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .slice(0, PER_CLASS);

    // People: users.username + users.displayName (NOT profiles — quoted)
    const people = await ctx.db.query("users").take(200);
    const matchedPeople = people
      .filter((u: any) => (u.username ?? "").toLowerCase().includes(term) || (u.displayName ?? "").toLowerCase().includes(term))
      .filter((u: any) => u.accountStatus !== "deleted")
      .map((u: any) => ({ username: u.username ?? null, displayName: u.displayName ?? "Member" }))
      .sort((a: any, b: any) => a.displayName.localeCompare(b.displayName))
      .slice(0, PER_CLASS);

    // Identical for anonymous and member (quoted) — no personalization,
    // no privateUserData read (structurally absent from this handler).
    return { posts: matchedPosts, tools: matchedTools, people: matchedPeople };
  },
});

/** The CAP-529 rawEvents write — a query cannot write, so the execution
 *  telemetry rides this companion mutation (the client fires both on
 *  submit; the search RESULTS never depend on it). Anonymous sessions
 *  carry anonymousSessionId (the pre-login join seam). */
export const searchLog = mutation({
  args: { q: v.string(), anonymousSessionId: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as any;
    await captureEvent(ctx, {
      eventType: "search.query_executed",
      schemaVersion: 1,
      eventClass: "interaction",
      userId: userId ?? undefined,
      anonymousSessionId: args.anonymousSessionId,
      targetType: "session",
      targetId: "search",
      source: "direct",
      isStaff: false,
      isPersona: false,
      isCountableAtWrite: false,
      queryLength: args.q.trim().length, // no raw query text in analytics (privacy posture)
    } as any);
    return null;
  },
});
