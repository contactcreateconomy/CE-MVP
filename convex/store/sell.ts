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

/** CAP-450 k — "min 5 distinct users per returned cell" (M11 R-ANALYTICS,
 *  quoted). Applied to EVERY bucket below: a 1-view or 2-conversion cell is
 *  a member-sized sample, not an aggregate. Suppressed cells return null —
 *  the dashboard renders "—", never 0 (suppressed ≠ zero). */
export const ANALYTICS_CELL_K = 5;
/** Wishlist rides the intent cell but is STRONGER-suppressed — "wishlist
 *  gets stronger suppression (intent is private)" (M11 R-ANALYTICS,
 *  quoted). The stronger value is register-unnamed: flagged default at 2×
 *  the cell k. */
export const WISHLIST_SUPPRESSION_K = 10;

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
    // Admin-imposed states are owner-irreversible (schema l.436 lifecycle):
    // an owner may re-activate a store THEY paused, never one an operator
    // suspended/closed — activation from 'suspended' would self-reverse an
    // integrity action with no operator in the loop.
    if (store.status === "suspended" || store.status === "closed") {
      return { activated: false, reason: `store is ${store.status} — operator action required` };
    }
    const products = await ctx.db
      .query("storefrontProducts")
      .withIndex("by_storefront_status", (q: any) => q.eq("storefrontId", store._id).eq("status", "approved"))
      .take(1);
    if (products.length === 0) {
      return { activated: false, reason: "cap-237 gate: at least one approved product required (not CAP-248)" };
    }
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(store._id, { status: "active", activatedAt: Date.now() });
      // bible l.228 — "active at activation": the provisional rocketeer
      // badge minted at P6-14 approval finalizes HERE
      const badge = await actx.db
        .query("badges")
        .withIndex("by_subject_state", (q: any) =>
          q.eq("subjectType", "user").eq("subjectId", userId).eq("state", "provisional"))
        .filter((q: any) => q.eq(q.field("type"), "rocketeer"))
        .take(1);
      if (badge.length > 0) {
        await actx.db.patch(badge[0]._id, { state: "finalized" });
      }
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

    // toolId boundary validation: storefrontProducts.toolId is a FREE-STRING
    // column (schema l.1999 — live deployment, schema pushes are
    // founder-gated, NOT retyped here) while every tool join it feeds is
    // id-typed. Reject anything that is not a live tools id (or empty) —
    // storing a slug/free string silently severs the toolRatings/tool
    // linkage. Reject-not-UI-hide: the throw surfaces verbatim.
    let toolId: Id<"tools"> | undefined;
    if (typeof args.toolId === "string" && args.toolId.trim() !== "") {
      const raw = args.toolId.trim();
      const tool = await ctx.db.get(raw as Id<"tools">).catch(() => null);
      if (!tool) {
        throw new Error(
          `sell.submitProduct: toolId must be a valid tools id or empty — "${raw}" matches no tools row`,
        );
      }
      toolId = tool._id as Id<"tools">; // canonical id only, never the raw arg
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
        toolId, // validated above — a live tools id or undefined, never a free string
        name: args.name,
        category: args.category,
        useCase: args.useCase,
        description: args.description,
        claims: args.claims,
        status: "under_review", // Core-enums l.438 — enters the P6-14 validation pipeline
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
    // Server-side precondition (the dashboard UI gates the button on
    // status==='approved' — reject-not-UI-hide): only a LIVE package can
    // request an edit; drafts/rejected/pending ride their own flows.
    if (product.status !== "approved") {
      throw new Error("sell.requestEdit: only an approved (live) product can request an edit");
    }
    const store = await myStorefront(ctx, userId);
    if (product.storefrontId !== store._id) throw new Error("sell.requestEdit: not your product");
    const current = product.currentVersionId
      ? await ctx.db.get(product.currentVersionId)
      : null;
    if (!current) throw new Error("sell.requestEdit: no live version to edit");
    await writeAudited(ctx, async (actx) => {
      // The edit lands as a PENDING version row (unapproved — no
      // approvedByUserId/approvedAt) carrying the proposed copy and the
      // SAME locked link (requestEdit never changes the destination).
      // The product row is NOT touched: status stays 'approved' and
      // currentVersionId keeps pointing at the locked package, so the
      // storefront card + BUY stay live until P6-14 re-validates and an
      // operator approves the new version (INV-2 — patching the live
      // row in place pulled the product from the listing and destroyed
      // the immutable package).
      const priorVersions = await actx.db
        .query("storefrontProductVersions")
        .withIndex("by_product_version", (q: any) => q.eq("storefrontProductId", args.storefrontProductId))
        .order("desc")
        .take(1);
      const versionNo = (priorVersions[0]?.versionNo ?? 0) + 1;
      await actx.db.insert("storefrontProductVersions", {
        storefrontProductId: args.storefrontProductId,
        versionNo,
        packageHash: `pending-edit:${Date.now()}`,
        name: current.name,
        merchant: current.merchant,
        image: current.image,
        description: args.description,
        claims: args.claims,
        disclosureClass: current.disclosureClass,
        ctaLabel: current.ctaLabel,
        regions: current.regions,
        category: current.category,
        storefrontLinkId: current.storefrontLinkId,
        createdAt: Date.now(),
      });
      return {
        actorId: userId, action: "store.requestEdit", target: `storefrontProducts:${args.storefrontProductId}`,
        prev: { version: current.versionNo, description: current.description.slice(0, 80) },
        next: { version: versionNo, status: "pending (re-validation)" },
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
    // Sibling parity: every owner store mutation runs the capability guard
    // (restriction/STOP/standing chain) and lands an auditLog row.
    await assertCustomerCapability(ctx, "manage_store");
    const store = await myStorefront(ctx, userId);
    // Pausing from 'suspended' would soften the admin render ("no longer
    // available" → owner-paused notice) — admin states are owner-immutable.
    if (store.status === "suspended" || store.status === "closed") {
      throw new Error(`sell.pause: store is ${store.status} — operator action required`);
    }
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(store._id, { status: "paused" });
      return {
        actorId: userId, action: "store.pauseMyStore", target: `storefronts:${store._id}`,
        prev: { status: store.status }, next: { status: "paused" },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
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
      // Three honest buckets; k<5 cells suppressed on EVERY bucket (CAP-450
      // "k≥5/cell" — suppression is a property of the cell, not of one
      // bucket). Suppressed → null, which the dashboard renders as "—":
      // never 0, and never a member-sized count exposed as an aggregate.
      traffic: r.storeViews >= ANALYTICS_CELL_K ? r.storeViews : null,
      intent:
        r.uniqueQualifiedViewers >= ANALYTICS_CELL_K
          ? {
              views: r.uniqueQualifiedViewers,
              clicks: r.qualifiedClicks,
              // stronger suppression (intent is private — quoted); a
              // sub-k wishlist count stays null even inside a k≥5 cell
              wishlist: r.wishlistAdds >= WISHLIST_SUPPRESSION_K ? r.wishlistAdds : null,
            }
          : null,
      // absent (never rolled) and suppressed (< k) are both null → "—"
      confirmed: (r.verifiedConversions ?? 0) >= ANALYTICS_CELL_K ? r.verifiedConversions : null,
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
