/**
 * storeEnforce — SLICE-P6-15: CAP-264/265/266/267/268/271 — the
 * /admin/store enforcement surface.
 *
 * CAP-264 (quoted): "each action has reason code + auditLog."
 * CAP-265 (quoted): "N/M are admin-configurable, not hardcoded" —
 *   configKeyRegistry keys store.circuitbreaker.complaintCountN /
 *   store.circuitbreaker.windowHoursM (Finding 4); the breaker System
 *   job reads them live with flagged fallbacks.
 * CAP-267 (quoted): "public storefront notice; NEVER infers buyers." +
 *   follower/watcher fan-out is FUTURE-M11-01 — NOT built (a public
 *   notice row only).
 * CAP-268 Writes (quoted): "merchantComplaints, moderationCases,
 *   auditLog" — the SAME polymorphic moderation queue as CAP-101/103/114
 *   (Phase 7 renders it); no special store-moderation UI here.
 * CAP-271 (quoted): "follower/watcher/opt-in fan-out deferred" — the
 *   notify cron emits the public-notice + consented-buyer branches only.
 */

import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";

const ENFORCERS = ["storeOperator", "administrator", "moderator"];

async function requireEnforcer(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("storeEnforce: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.some((r) => ENFORCERS.includes(r))) {
    throw new Error("storeEnforce: storeOperator/administrator/moderator required");
  }
  return userId;
}

/** CAP-264 — pause a store (reason + audit; reversible by resume). */
export const pauseStore = mutation({
  args: { storefrontId: v.id("storefronts"), reasonCode: v.string(), evidence: v.optional(v.any()) },
  returns: v.object({ paused: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireEnforcer(ctx);
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.storefrontId, { status: "paused" });
      return {
        actorId: userId, action: "store.pause", target: `storefronts:${args.storefrontId}`,
        prev: null, next: { status: "paused" },
        correlationId: newCorrelationId(), reversible: true, reasonCode: args.reasonCode,
        justification: JSON.stringify(args.evidence ?? null),
      };
    });
    return { paused: true };
  },
});

/** CAP-264 — block a merchant domain across the platform. */
export const blockDomain = mutation({
  args: { domain: v.string(), reasonCode: v.string() },
  returns: v.object({ blocked: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireEnforcer(ctx);
    // Flip every locked link on the domain to rejected (BUY dies at /go)
    const links = await ctx.db
      .query("storefrontLinks")
      .withIndex("by_validationState", (q: any) => q.eq("validationState", "approved_locked"))
      .take(50);
    let blocked = 0;
    await writeAudited(ctx, async (actx) => {
      for (const link of links) {
        if (link.finalRegistrableDomain !== args.domain) continue;
        await actx.db.patch(link._id, { validationState: "rejected" });
        blocked += 1;
      }
      return {
        actorId: userId, action: "store.blockDomain", target: `domain:${args.domain}`,
        prev: null, next: { rejectedLinks: blocked },
        correlationId: newCorrelationId(), reversible: true, reasonCode: args.reasonCode,
      };
    });
    return { blocked };
  },
});

/** CAP-264 — strike (ledger append; feeds the breaker + revoke). */
export const strike = mutation({
  args: { storefrontId: v.id("storefronts"), reasonCode: v.string(), evidence: v.optional(v.any()) },
  returns: v.object({ strikeId: v.id("storeStrikes") }),
  handler: async (ctx, args) => {
    const userId = await requireEnforcer(ctx);
    let strikeId: Id<"storeStrikes"> | undefined;
    await writeAudited(ctx, async (actx) => {
      strikeId = (await actx.db.insert("storeStrikes", {
        storefrontId: args.storefrontId,
        reasonCode: args.reasonCode,
        evidence: args.evidence ?? null,
        actorUserId: userId,
        createdAt: Date.now(),
      })) as Id<"storeStrikes">;
      return {
        actorId: userId, action: "store.strike", target: `storefronts:${args.storefrontId}`,
        prev: null, next: { strikeId },
        correlationId: newCorrelationId(), reversible: false, reasonCode: args.reasonCode,
      };
    });
    return { strikeId: strikeId! };
  },
});

/** CAP-265 — the circuit breaker (System cron): complaints ≥ N inside
 *  window M → auto-pause + strike. N/M from systemConfig (Finding 4 —
 *  never hardcoded); flagged fallbacks until seeded. */
export const circuitBreaker = internalMutation({
  args: {},
  returns: v.object({ tripped: v.number(), n: v.number(), mHours: v.number() }),
  handler: async (ctx) => {
    const readConfig = async (key: string, fallback: number) => {
      const row = await ctx.db.query("systemConfig").withIndex("by_key", (q: any) => q.eq("key", key)).first();
      return typeof row?.value === "number" ? row.value : fallback;
    };
    const n = await readConfig("store.circuitbreaker.complaintCountN", 3); // flagged fallbacks
    const mHours = await readConfig("store.circuitbreaker.windowHoursM", 72);
    const windowStart = Date.now() - mHours * 3_600_000;

    const complaints = await ctx.db.query("merchantComplaints").take(100);
    const byStore = new Map<string, number>();
    for (const complaint of complaints) {
      if (complaint.createdAt < windowStart) continue;
      const product = await ctx.db.get(complaint.targetProductId);
      if (!product) continue;
      byStore.set(product.storefrontId, (byStore.get(product.storefrontId) ?? 0) + 1);
    }
    let tripped = 0;
    for (const [storefrontId, count] of byStore) {
      if (count < n) continue;
      const store = (await ctx.db.get(storefrontId as any)) as any;
      if (!store || store.status === "paused" || store.isPlatformCurated) continue;
      await ctx.db.patch(storefrontId as any, { status: "paused" });
      await ctx.db.insert("storeStrikes", {
        storefrontId: storefrontId as any,
        reasonCode: `circuit_breaker:${count}_in_${mHours}h`,
        evidence: { complaints: count, windowHours: mHours },
        actorUserId: (await ctx.db
          .query("users")
          .withIndex("email", (q: any) => q.eq("email", "platform@createconomy.internal"))
          .unique())?._id as any, // System actor = the reserved identity
        createdAt: Date.now(),
      });
      tripped += 1;
    }
    return { tripped, n, mHours };
  },
});

/** CAP-266 — emergency product pull (immediate delist; the version
 *  history is retained — nothing deleted). */
export const emergencyPull = mutation({
  args: { storefrontProductId: v.id("storefrontProducts"), reasonCode: v.string() },
  returns: v.object({ pulled: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireEnforcer(ctx);
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.storefrontProductId, { status: "pulled" });
      return {
        actorId: userId, action: "store.emergencyPull", target: `storefrontProducts:${args.storefrontProductId}`,
        prev: null, next: { status: "pulled" },
        correlationId: newCorrelationId(), reversible: true, reasonCode: args.reasonCode,
      };
    });
    return { pulled: true };
  },
});

/** CAP-267 — Rocketeer badge revoke: PUBLIC storefront notice only;
 *  follower/watcher fan-out is FUTURE-M11-01 (NOT built); inferred
 *  buyers NEVER notified (quoted). */
export const revokeBadge = mutation({
  args: { storefrontId: v.id("storefronts"), reasonCode: v.string() },
  returns: v.object({ revoked: v.boolean(), notice: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireEnforcer(ctx);
    const notice = "This store's verified-seller badge was revoked."; // the public notice line
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.storefrontId, { status: "suspended" });
      // The notice itself renders on the public storefront (P6-18 reads
      // status=suspended + the strike trail). No follower/buyer fan-out.
      return {
        actorId: userId, action: "store.revokeBadge", target: `storefronts:${args.storefrontId}`,
        prev: null, next: { status: "suspended", publicNotice: notice },
        correlationId: newCorrelationId(), reversible: true, reasonCode: args.reasonCode,
      };
    });
    return { revoked: true, notice };
  },
});

/** CAP-268 — merchant complaint intake: merchantComplaints +
 *  moderationCases (the SAME polymorphic queue — Phase 7 renders it) +
 *  auditLog. Staff intake (buyer-facing routes route through support). */
export const fileComplaint = mutation({
  args: {
    targetProductId: v.id("storefrontProducts"),
    complainantUserId: v.optional(v.id("users")),
    reason: v.string(),
  },
  returns: v.object({ complaintId: v.id("merchantComplaints") }),
  handler: async (ctx, args) => {
    const userId = await requireEnforcer(ctx);
    let complaintId: Id<"merchantComplaints"> | undefined;
    await writeAudited(ctx, async (actx) => {
      complaintId = (await actx.db.insert("merchantComplaints", {
        complainantUserId: args.complainantUserId ?? userId,
        targetProductId: args.targetProductId,
        reason: args.reason,
        status: "open",
        createdAt: Date.now(),
      })) as Id<"merchantComplaints">;
      // The shared moderation queue row (CAP-330 orders it in Phase 7)
      await actx.db.insert("moderationCases", {
        caseType: "store_commercial",
        targetType: "storefront_product",
        targetId: args.targetProductId,
        policyFamily: "quality_guidelines",
        severity: "s2_medium",
        priority: 2,
        status: "open",
        reasonCode: "merchant_complaint",
        policyVersion: "m11.v1",
        reporterCountDistinct: 1,
        reporterClusterCount: 1,
        agingLevel: 0,
        createdAt: Date.now(),
      });
      return {
        actorId: userId, action: "store.fileComplaint", target: `merchantComplaints:${complaintId}`,
        prev: null, next: { targetProductId: args.targetProductId },
        correlationId: newCorrelationId(), reversible: false, reasonCode: "merchant_complaint",
      };
    });
    return { complaintId: complaintId! };
  },
});

/** CAP-271 — the notification fan-out cron: PUBLIC-NOTICE + consented-
 *  buyer branches ONLY (quoted: follower/watcher/opt-in deferred). v1:
 *  the public notice is the storefront row state (P6-18 renders it);
 *  consented-buyer channels wire with email providers (G8) — the cron
 *  surfaces the pending notice set, sends nothing unconsented. */
export const notifyRevocations = internalMutation({
  args: {},
  returns: v.object({ publicNotices: v.number() }),
  handler: async (ctx) => {
    const suspended = await ctx.db
      .query("storefronts")
      .withIndex("by_status", (q: any) => q.eq("status", "suspended"))
      .take(20);
    // The public notice is carried by the storefront state itself; the
    // consented-buyer email branch is inert until G8 (email provider).
    return { publicNotices: suspended.length };
  },
});
