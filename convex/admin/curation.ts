/**
 * curation — SLICE-P6-04: CAP-191/192/554/423 — the /admin/curation
 * WRITE surface (hero upsert/schedule, Featured booking + emergency-pull).
 *
 * Actors (quoted): CAP-191/192 = Editor, Publisher, store_operator (one
 *   set, no per-action split); CAP-554 = administrator ONLY. CAP-019
 *   admin.write rate limit applies (staff NOT exempt).
 * CAP-191 gates (quoted): "M13 moderation passed; cadence cap (≤1/cycle,
 *   ≤1–2 active)" — "cycle" undefined (curation OQ2): enforced as ≤1 new
 *   active booking per 24h (flagged default).
 * CAP-192 gates (quoted): M13 safety-removal — safety-removed posts must
 *   not occupy slots (moderationStatus removed/rejected/held blocked).
 * CAP-554 (quoted): "Does not mutate trendScore" — pull writes status
 *   ONLY. CAP-423 firewall (quoted): Hero/Featured ≠ organic/exploration
 *   scores — this module writes no score field anywhere (tested).
 * Pause/archive names unnamed (OQ4) — the status lifecycle is writable
 *   through hero.upsert (status param); no invented mutation names.
 * Audit-fail → fail-closed (CAP-426, writeAudited).
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkRateLimit } from "../lib/rateLimit";

async function requireCurationOperator(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("curation: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.some((r) => r === "editor" || r === "publisher" || r === "storeOperator" || r === "administrator")) {
    throw new Error("curation: Editor/Publisher/storeOperator required (CAP-191/192 actor set)");
  }
  return userId;
}

/** Candidate gate (CAP-191/192 M13): published + moderation-clean. */
async function assertModerationEligible(ctx: any, postId: Id<"posts">): Promise<void> {
  const post = await ctx.db.get(postId);
  if (!post || post.lifecycleStatus !== "published") {
    throw new Error("curation: candidate post is not published");
  }
  if (post.moderationStatus === "removed" || post.moderationStatus === "rejected" || post.moderationStatus === "held") {
    throw new Error("curation: candidate post failed the M13 gate (safety/moderation)");
  }
}

/** CAP-191 `vibing.setFeatured` — book a time-bound Featured slot. */
export const setFeatured = mutation({
  args: {
    postId: v.id("posts"),
    label: v.string(),
    startAt: v.number(),
    endAt: v.number(),
  },
  returns: v.object({ featuredId: v.id("vibingFeatured") }),
  handler: async (ctx, args) => {
    const userId = await requireCurationOperator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    await assertModerationEligible(ctx, args.postId);
    if (args.endAt <= args.startAt) throw new Error("curation: endAt must follow startAt");

    const now = Date.now();
    // Cadence caps (quoted): ≤1–2 active concurrently; "cycle" undefined →
    // ≤1 NEW booking per 24h (flagged default, curation OQ2)
    const active = await ctx.db
      .query("vibingFeatured")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .take(5);
    const liveNow = active.filter((f: any) => f.endAt > now);
    if (liveNow.length >= 2) throw new Error("curation: ≤1–2 active Featured slots (CAP-191 cadence cap)");
    const recentBookings = liveNow.filter((f: any) => f.createdAt > now - 24 * 3_600_000);
    if (recentBookings.length >= 1) throw new Error("curation: ≤1 new Featured booking per cycle/24h (flagged default)");

    let featuredId: Id<"vibingFeatured"> | undefined;
    await writeAudited(ctx, async (actx) => {
      featuredId = (await actx.db.insert("vibingFeatured", {
        postId: args.postId,
        label: args.label,
        startAt: args.startAt,
        endAt: args.endAt,
        status: "active",
        reason: "operator_booking",
        approvedByUserId: userId,
        createdAt: now,
      })) as Id<"vibingFeatured">;
      return {
        actorId: userId, action: "vibing.setFeatured", target: `vibingFeatured:${featuredId}`,
        prev: null, next: { postId: args.postId, startAt: args.startAt, endAt: args.endAt },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { featuredId: featuredId! };
  },
});

/** CAP-554 `vibing.pullFeatured` — emergency-pull (administrator ONLY);
 *  writes status=pulled and NOTHING else — never trendScore (quoted). */
export const pullFeatured = mutation({
  args: { featuredId: v.id("vibingFeatured") },
  returns: v.object({ pulled: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("curation.pull: authentication required");
    const roles = await assertAdminPermission(ctx);
    if (!roles.includes("administrator")) {
      throw new Error("curation.pull: Administrator-only (CAP-554 emergency authority)");
    }
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });

    const row = await ctx.db.get(args.featuredId);
    if (!row) throw new Error("curation.pull: not found");
    if (row.status === "pulled") return { pulled: true }; // idempotent

    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.featuredId, { status: "pulled" }); // status ONLY — trendScore untouched
      return {
        actorId: userId, action: "vibing.pullFeatured", target: `vibingFeatured:${args.featuredId}`,
        prev: { status: row.status }, next: { status: "pulled" },
        correlationId: newCorrelationId(), reversible: true, reasonCode: "emergency_pull",
      };
    });
    return { pulled: true };
  },
});

/** CAP-192 `hero.upsert/schedule` — compose/schedule a hero slot through
 *  the six-status lifecycle (pause/archive ride the status param — names
 *  beyond upsert/schedule are unnamed, OQ4-flagged; no invented names). */
export const heroUpsert = mutation({
  args: {
    slotOrder: v.number(), // 0–9
    postId: v.id("posts"),
    headlineOverride: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.number(),
    desktopEnabled: v.boolean(),
    mobileEnabled: v.boolean(),
    status: v.union(
      v.literal("draft"), v.literal("scheduled"), v.literal("active"),
      v.literal("paused"), v.literal("archived"),
    ),
  },
  returns: v.object({ slotId: v.id("heroSlots") }),
  handler: async (ctx, args) => {
    const userId = await requireCurationOperator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    if (args.slotOrder < 0 || args.slotOrder > 9) throw new Error("curation.hero: slotOrder 0–9 (10 managed)");
    if (args.status === "active" || args.status === "scheduled") {
      await assertModerationEligible(ctx, args.postId); // M13 safety gate (quoted)
    }

    const now = Date.now();
    // One live row per slot: expired/archived superseded
    const existing = await ctx.db
      .query("heroSlots")
      .withIndex("by_slotOrder", (q: any) => q.eq("slotOrder", args.slotOrder))
      .filter((q: any) => q.neq(q.field("status"), "expired") && q.neq(q.field("status"), "archived"))
      .first();

    let slotId: Id<"heroSlots"> | undefined;
    await writeAudited(ctx, async (actx) => {
      if (existing) {
        await actx.db.patch(existing._id, { status: "expired" });
      }
      slotId = (await actx.db.insert("heroSlots", {
        slotOrder: args.slotOrder,
        postId: args.postId,
        headlineOverride: args.headlineOverride,
        ctaLabel: args.ctaLabel,
        startAt: args.startAt,
        endAt: args.endAt,
        desktopEnabled: args.desktopEnabled,
        mobileEnabled: args.mobileEnabled,
        status: args.status,
        disclosureClass: "operator_curated",
        approvedByUserId: userId,
        createdAt: now,
      })) as Id<"heroSlots">;
      if (args.status === "active") {
        await actx.db.insert("heroAssignments", {
          slotOrder: args.slotOrder,
          postId: args.postId,
          activatedAt: now,
          reason: "operator_schedule",
          actorUserId: userId,
        });
      }
      return {
        actorId: userId, action: "hero.upsert", target: `heroSlots:${slotId}`,
        prev: existing ? { slotId: existing._id, status: existing.status } : null,
        next: { slotOrder: args.slotOrder, postId: args.postId, status: args.status },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { slotId: slotId! };
  },
});

/** The console inventory (staff-only; null for non-staff). */
export const getCurationState = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    let staff = false;
    try {
      staff = (await assertAdminPermission(ctx)).length > 0;
    } catch {
      staff = false;
    }
    if (!staff) return null;
    const heroSlots = await ctx.db.query("heroSlots").withIndex("by_slotOrder").take(10);
    const featured = await ctx.db
      .query("vibingFeatured")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .take(5);
    return {
      heroSlots: heroSlots.map((s: any) => ({
        slotId: s._id, slotOrder: s.slotOrder, postId: s.postId,
        headlineOverride: s.headlineOverride ?? null, status: s.status,
        startAt: s.startAt, endAt: s.endAt,
        desktopEnabled: s.desktopEnabled, mobileEnabled: s.mobileEnabled,
      })),
      featured: featured.map((f: any) => ({
        featuredId: f._id, postId: f.postId, label: f.label,
        startAt: f.startAt, endAt: f.endAt, status: f.status,
      })),
    };
  },
});
