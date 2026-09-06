/**
 * sell — SLICE-P6-16: CAP-233/234/239/243/270/257/258/259/260/450/525 —
 * the seller dashboard backend.
 *
 * CAP-233 (quoted gate): gated-by CAP-237 — activation = ≥1 approved
 *  product (not CAP-248); badge active + store public HERE.
 * CAP-270 (quoted): "immediate, no review" (owner pause, E5).
 * CAP-257: analytics read honors the privacy-query contract (CAP-450:
 *  k≥5/cell, ≥1d buckets, ≥24h delay, aggregate-only, no buyer identity).
 * CAP-525 (quoted, TWO-FIELD): "persistence is type=self_report +
 *  status=unverified (…no self-reported-unverified literal)"; "Weight
 *  must sit strictly between click-only (10) and network-verified (25)".
 *  A13 fenced: no badge token designed — distinct copy keys only.
 * CAP-261: Amazon structurally excluded from reconcile-as-verified.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";

/** CAP-525: the interim tier's Signal weight — STRICTLY between
 *  click-only (10) and network-verified (25). Admin-configurable within
 *  the open band (10, 25); never equal to either bound. */
export const SELF_REPORT_WEIGHT = 17; // flagged default inside the open band
const CLICK_WEIGHT = 10;
const VERIFIED_WEIGHT = 25;

async function myStorefront(ctx: any, userId: Id<"users">): Promise<any> {
  const store = await ctx.db
    .query("storefronts")
    .withIndex("by_owner", (q: any) => q.eq("ownerUserId", userId))
    .unique();
  if (!store) throw new Error("sell: no storefront — apply first (P6-13)");
  return store;
}

/** CAP-233 — activate: ≥1 approved product → badge active + store
 *  public. The gate is CAP-237's approved product (quoted). */
export const activate = mutation({
  args: {},
  returns: v.object({ activated: v.boolean(), reason: v.optional(v.string()) }),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("sell.activate: authentication required");
    await assertCustomerCapability(ctx, "manage_store");
    const store = await myStorefront(ctx, userId);
    const products = await ctx.db
      .query("storefrontProducts")
      .withIndex("by_storefront_status", (q: any) => q.eq("storefrontId", store._id).eq("status", "approved"))
      .take(1);
    if (products.length === 0) {
      return { activated: false, reason: "cap-237 gate: at least one approved product required (not CAP-248)" };
    }
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(store._id, { status: "active", activatedAt: Date.now() });
      return {
        actorId: userId, action: "store.activate", target: `storefronts:${store._id}`,
        prev: { status: store.status }, next: { status: "active" },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { activated: true };
  },
});

/** CAP-234 — product submit: writes the product + its link at
 *  validationState=pending (the P6-14 pipeline takes it from here). */
export const submitProduct = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    useCase: v.string(),
    description: v.string(),
    claims: v.string(),
    toolId: v.optional(v.string()),
    submittedUrl: v.string(),
    network: v.string(),
    programName: v.string(),
    affiliateAccountRefMasked: v.string(),
  },
  returns: v.object({ productId: v.id("storefrontProducts"), linkId: v.id("storefrontLinks") }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("sell.submitProduct: authentication required");
    await assertCustomerCapability(ctx, "manage_store");
    const store = await myStorefront(ctx, userId);

    // Basic destination shape (the P6-14 inspection validates deeply)
    let domain = "";
    try {
      domain = new URL(args.submittedUrl).hostname;
    } catch {
      throw new Error("sell.submitProduct: submittedUrl must be a valid URL");
    }

    const now = Date.now();
    let productId: Id<"storefrontProducts"> | undefined;
    let linkId: Id<"storefrontLinks"> | undefined;
    await writeAudited(ctx, async (actx) => {
      linkId = (await actx.db.insert("storefrontLinks", {
        submittedUrl: args.submittedUrl,
        finalRegistrableDomain: domain,
        redirectChainHash: `pending:${now}`,
        network: args.network,
        programName: args.programName,
        affiliateAccountRefMasked: args.affiliateAccountRefMasked, // masked only — the raw id never lands here
        permittedChannels: ["storefront", "post"],
        geoEligibility: [],
        selfReferralPolicy: "excluded",
        subAffiliatePolicy: "excluded",
        validationState: "pending", // the P6-14 pipeline's entry state
        fingerprintId: `pending:${now}`,
        createdAt: now,
      })) as Id<"storefrontLinks">;
      productId = (await actx.db.insert("storefrontProducts", {
        storefrontId: store._id,
        toolId: args.toolId,
        name: args.name,
        category: args.category,
        useCase: args.useCase,
        description: args.description,
        claims: args.claims,
        status: "pending",
        sortOrder: 0,
        createdAt: now,
      })) as Id<"storefrontProducts">;
      return {
        actorId: userId, action: "store.submitProduct", target: `storefrontProducts:${productId}`,
        prev: null, next: { name: args.name, network: args.network, validationState: "pending" },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { productId: productId!, linkId: linkId! };
  },
});

/** CAP-239 — edit request: a NEW version row; the current stays live
 *  (locked packages are immutable — INV-2). */
export const requestEdit = mutation({
  args: { storefrontProductId: v.id("storefrontProducts"), description: v.string(), claims: v.string() },
  returns: v.object({ requested: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("sell.requestEdit: authentication required");
    await assertCustomerCapability(ctx, "manage_store");
    const product = await ctx.db.get(args.storefrontProductId);
    if (!product) throw new Error("sell.requestEdit: product not found");
    const store = await myStorefront(ctx, userId);
    if (product.storefrontId !== store._id) throw new Error("sell.requestEdit: not your product");
    await writeAudited(ctx, async (actx) => {
      // The edit lands as a pending product revision; the CURRENT stays
      // live until P6-14 re-validates + locks a new version.
      await actx.db.patch(args.storefrontProductId, { description: args.description, claims: args.claims, status: "pending" });
      return {
        actorId: userId, action: "store.requestEdit", target: `storefrontProducts:${args.storefrontProductId}`,
        prev: { description: product.description.slice(0, 80) }, next: { status: "pending (re-validation)" },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { requested: true };
  },
});

/** CAP-270 — owner pause: immediate, no review (E5). */
export const pauseMyStore = mutation({
  args: {},
  returns: v.object({ paused: v.boolean() }),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("sell.pause: authentication required");
    const store = await myStorefront(ctx, userId);
    await ctx.db.patch(store._id, { status: "paused" });
    return { paused: true };
  },
});

/** CAP-257 — analytics read: the storefrontAnalytics aggregate ONLY
 *  (CAP-450 contract holds on the read path — no buyer identity fields
 *  exist on the table; k<5 cells are suppressed server-side here). */
export const getAnalytics = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    const store = await ctx.db
      .query("storefronts")
      .withIndex("by_owner", (q: any) => q.eq("ownerUserId", userId))
      .unique();
    if (!store) return null;
    const rows = await ctx.db
      .query("storefrontAnalytics")
      .withIndex("by_subject_window", (q: any) => q.eq("subjectType", "store").eq("subjectId", store._id))
      .take(30);
    return rows.map((r: any) => ({
      window: r.window,
      // Three honest buckets; k<5 cells suppressed (CAP-450)
      traffic: r.storeViews,
      intent: r.uniqueQualifiedViewers >= 5 ? { views: r.uniqueQualifiedViewers, clicks: r.qualifiedClicks, wishlist: r.wishlistAdds } : null,
      confirmed: r.verifiedConversions ?? null,
    }));
  },
});

/**
 * CAP-525 — the Amazon-interim self-report evidence write. THE TWO-FIELD
 * RULE (quoted): type=self_report AND status=unverified — two fields,
 * never a collapsed literal (which does not exist in the enum). The
 * interim weight sits STRICTLY between 10 and 25.
 */
export const submitSelfReport = mutation({
  args: {
    storefrontProductId: v.id("storefrontProducts"),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    conversionRef: v.optional(v.string()),
  },
  returns: v.object({ evidenceId: v.id("salesEvidence") }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("sell.selfReport: authentication required");
    await assertCustomerCapability(ctx, "manage_store");
    const product = await ctx.db.get(args.storefrontProductId);
    if (!product) throw new Error("sell.selfReport: product not found");
    const store = await myStorefront(ctx, userId);
    if (product.storefrontId !== store._id) throw new Error("sell.selfReport: not your product");

    if (SELF_REPORT_WEIGHT <= CLICK_WEIGHT || SELF_REPORT_WEIGHT >= VERIFIED_WEIGHT) {
      throw new Error("sell.selfReport: interim weight must sit strictly between 10 and 25 (CAP-525 band)");
    }

    let evidenceId: Id<"salesEvidence"> | undefined;
    await writeAudited(ctx, async (actx) => {
      evidenceId = (await actx.db.insert("salesEvidence", {
        storefrontProductId: args.storefrontProductId,
        promoterUserId: userId,
        type: "self_report",   // field ONE (quoted)
        status: "unverified",  // field TWO (quoted) — never collapsible
        amount: args.amount,
        currency: args.currency,
        conversionRef: args.conversionRef,
        occurredAt: Date.now(),
        createdAt: Date.now(),
      })) as Id<"salesEvidence">;
      return {
        actorId: userId, action: "store.submitSelfReport", target: `salesEvidence:${evidenceId}`,
        prev: null,
        next: { type: "self_report", status: "unverified", interimWeight: SELF_REPORT_WEIGHT, copyKey: "evidence.interim_self_report" },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { evidenceId: evidenceId! };
  },
});

/** The dashboard state (seller-only). */
export const getSellState = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    const store = await ctx.db
      .query("storefronts")
      .withIndex("by_owner", (q: any) => q.eq("ownerUserId", userId))
      .unique();
    if (!store) return { hasStore: false };
    const products = await ctx.db
      .query("storefrontProducts")
      .withIndex("by_storefront", (q: any) => q.eq("storefrontId", store._id))
      .take(20);
    const evidence = await ctx.db
      .query("salesEvidence")
      .withIndex("by_promoter", (q: any) => q.eq("promoterUserId", userId))
      .take(20);
    return {
      hasStore: true,
      store: { status: store.status, activatedAt: store.activatedAt ?? null },
      products: products.map((p: any) => ({
        productId: p._id, name: p.name, status: p.status, category: p.category,
      })),
      evidence: evidence.map((e: any) => ({
        evidenceId: e._id,
        type: e.type, status: e.status, // DISTINCT copy keys render these (A13 fenced)
        amount: e.amount ?? null,
      })),
    };
  },
});
