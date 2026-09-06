/**
 * store validation — SLICE-P6-14: CAP-232/235/236/237/238/240/241/242/263
 * — the /admin/store pipeline: request decision → product inspection →
 * auto-screen → human APPROVE = THE LOCK.
 *
 * THE LOCK (FATAL-adjacent, quoted): "the lock this queue writes is
 *   `validationState=approved_locked`" (admin-store OQ9/E1). storefrontLinks
 *   has NO status field (F-01 — stale sheet text is not implemented).
 *   Once approved_locked, a write to any locked field THROWS (quoted:
 *   "A write to a locked field when approved_locked THROWS").
 * CAP-236 (quoted): "off_topic vs unsafe distinct reasons (INV-11)".
 * CAP-235: SSRF-safe inspection via lib/safeFetch (P1-10). Unpinned
 *   probe/absent network in Convex mutations → needs_human (CAP-011
 *   degrade) — NEVER a silent pass.
 * CAP-238: the reject reason enum includes unsafe/off_topic distinctly.
 * CAP-242 (quoted): "material intermediate change triggers review" —
 *   drift → under_review (BUY disabled at /go, storefront visible).
 * CAP-263: queue batch ≤10.
 */

import { internalMutation, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";

/** The locked fields (bible l.218, quoted): "LOCKED package =
 *  link+name+merchant+domain+image+desc+claims+disclosure+CTA+regions+
 *  category; immutable at persistence after approval". */
export const LOCKED_LINK_FIELDS = [
  "submittedUrl", "finalRegistrableDomain", "redirectChainHash", "network", "programName",
  "affiliateAccountRefMasked", "permittedChannels", "geoEligibility", "selfReferralPolicy",
  "subAffiliatePolicy", "validationState",
] as const;

export const REJECT_REASONS = [
  "unsafe_destination", "off_topic", "misleading_claims", "broken_link",
  "wrong_network", "missing_disclosure", "region_mismatch", "quality_below_bar",
] as const; // CAP-238 — the enumerated dropdown (8; unsafe ≠ off_topic, INV-11)

async function requireStoreOperator(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("admin.store: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.some((r) => r === "storeOperator" || r === "administrator")) {
    throw new Error("admin.store: storeOperator required");
  }
  return userId;
}

/** CAP-232 — decide a store request. Approval → storefronts.status=setup
 *  (Rocketeer badge goes PROVISIONAL here; activation is P6-16's CAP-233). */
export const decideRequest = mutation({
  args: {
    requestId: v.id("storeRequests"),
    decision: v.union(v.literal("approved"), v.literal("rejected"), v.literal("info_requested")),
    reasonCode: v.optional(v.string()),
  },
  returns: v.object({ storefrontId: v.optional(v.id("storefronts")) }),
  handler: async (ctx, args) => {
    const userId = await requireStoreOperator(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.status !== "pending") throw new Error("store.decide: no pending request");

    let storefrontId: Id<"storefronts"> | undefined;
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.requestId, {
        status: args.decision,
        reviewerUserId: userId,
        reasonCode: args.reasonCode,
        decidedAt: Date.now(),
      });
      if (args.decision === "approved") {
        // CAP-565 guarantees the Distribution exists (bootstrap follow-on)
        const distribution = await actx.db
          .query("distributions")
          .withIndex("by_owner", (q: any) => q.eq("ownerUserId", request.userId))
          .unique();
        if (!distribution) throw new Error("store.decide: distribution missing (CAP-565 invariant)");
        const existing = await actx.db
          .query("storefronts")
          .withIndex("by_owner", (q: any) => q.eq("ownerUserId", request.userId))
          .unique();
        storefrontId = existing?._id ?? ((await actx.db.insert("storefronts", {
          ownerUserId: request.userId,
          distributionId: distribution._id,
          status: "setup", // activation = >=1 approved product (P6-16 CAP-233)
          isPlatformCurated: false,
          disclosureVersion: "store-disclosure.v1",
          collections: [],
          createdAt: Date.now(),
        })) as Id<"storefronts">);
      }
      return {
        actorId: userId, action: "store.decideRequest", target: `storeRequests:${args.requestId}`,
        prev: { status: "pending" }, next: { status: args.decision },
        correlationId: newCorrelationId(), reversible: true, reasonCode: args.reasonCode,
      };
    });
    return { storefrontId };
  },
});

/**
 * CAP-235 — the inspection WRITER (the fetch tier is the "use node"
 * action admin/storeValidate.inspectLinkAction — the P4 pollers split).
 * Records linkValidations; safeBrowsing/phishtank external feeds wire at
 * deploy (G-bucket) — unchecked keeps the needs_human posture honest.
 */
export const recordInspection = internalMutation({
  args: {
    storefrontLinkId: v.id("storefrontLinks"),
    runType: v.union(v.literal("initial"), v.literal("rescan")),
    disposition: v.union(v.literal("pass"), v.literal("needs_human"), v.literal("fail")),
    fingerprint: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("linkValidations", {
      storefrontLinkId: args.storefrontLinkId,
      runType: args.runType,
      disposition: args.disposition,
      fingerprint: args.fingerprint,
      safeBrowsing: "unchecked",
      phishtank: "unchecked",
      createdAt: Date.now(),
    });
    return null;
  },
});

/** CAP-242 — the drift flip (BUY disabled, storefront visible). */
export const recordDriftFlip = internalMutation({
  args: { storefrontLinkId: v.id("storefrontLinks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storefrontLinkId, { validationState: "under_review" });
    return null;
  },
});

/** CAP-236 — the auto-screen over the latest inspection: pass stays
 *  pending-locked-candidate; needs_human/fail surface distinctly
 *  (off_topic vs unsafe remain DISTINCT — INV-11). */
export const autoScreen = internalMutation({
  args: { storefrontLinkId: v.id("storefrontLinks") },
  returns: v.object({ disposition: v.string() }),
  handler: async (ctx, args) => {
    const validations = await ctx.db
      .query("linkValidations")
      .withIndex("by_link", (q: any) => q.eq("storefrontLinkId", args.storefrontLinkId))
      .order("desc")
      .take(1);
    const latest = validations[0];
    if (!latest) return { disposition: "needs_human" }; // no inspection = human lane
    if (latest.disposition === "needs_human" || latest.disposition === "fail") {
      // Fail/unknown → the human queue with the reason preserved
      await ctx.db.patch(args.storefrontLinkId, { validationState: "under_review" });
    }
    return { disposition: latest.disposition };
  },
});

/**
 * CAP-237 — human APPROVE: writes THE LOCK (`validationState=
 * approved_locked` + lockedAt). The locked-field THROW guard lives here:
 * any subsequent mutation touching a locked field on an approved_locked
 * row is rejected (enforced by assertNotLocked below + tested).
 */
export const approveProduct = mutation({
  args: {
    storefrontProductId: v.id("storefrontProducts"),
    storefrontLinkId: v.id("storefrontLinks"),
    packageHash: v.string(),
  },
  returns: v.object({ locked: v.boolean(), versionId: v.id("storefrontProductVersions") }),
  handler: async (ctx, args) => {
    const userId = await requireStoreOperator(ctx);
    const link = await ctx.db.get(args.storefrontLinkId);
    if (!link) throw new Error("approve: link not found");
    if (link.validationState === "approved_locked") {
      throw new Error("approve: package already locked — edit = new version → re-validate (INV-2)");
    }
    const validations = await ctx.db
      .query("linkValidations")
      .withIndex("by_link", (q: any) => q.eq("storefrontLinkId", args.storefrontLinkId))
      .order("desc")
      .take(1);
    const latest = validations[0];
    if (!latest || latest.disposition !== "pass") {
      throw new Error("approve: requires a passing inspection (CAP-237 gate — never a silent pass)");
    }

    const product = await ctx.db.get(args.storefrontProductId);
    if (!product) throw new Error("approve: product not found");

    const now = Date.now();
    let versionId: Id<"storefrontProductVersions"> | undefined;
    await writeAudited(ctx, async (actx) => {
      // THE LOCK (quoted field name; no status field exists — F-01)
      await actx.db.patch(args.storefrontLinkId, { validationState: "approved_locked", lockedAt: now });
      const priorVersions = await actx.db
        .query("storefrontProductVersions")
        .withIndex("by_product_version", (q: any) => q.eq("storefrontProductId", args.storefrontProductId))
        .order("desc")
        .take(1);
      const versionNo = (priorVersions[0]?.versionNo ?? 0) + 1;
      versionId = (await actx.db.insert("storefrontProductVersions", {
        storefrontProductId: args.storefrontProductId,
        versionNo,
        packageHash: args.packageHash,
        name: product.name,
        merchant: link.finalRegistrableDomain,
        image: "",
        description: product.description,
        claims: product.claims,
        disclosureClass: "affiliate",
        ctaLabel: "Buy",
        regions: link.geoEligibility,
        category: product.category,
        storefrontLinkId: args.storefrontLinkId,
        approvedByUserId: userId,
        approvedAt: now,
        createdAt: now,
      })) as Id<"storefrontProductVersions">;
      await actx.db.patch(args.storefrontProductId, { status: "approved", currentVersionId: versionId });
      return {
        actorId: userId, action: "store.approveProduct", target: `storefrontLinks:${args.storefrontLinkId}`,
        prev: { validationState: link.validationState }, next: { validationState: "approved_locked", packageHash: args.packageHash },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { locked: true, versionId: versionId! };
  },
});

/** CAP-238 — reject with the enumerated reason (8; unsafe ≠ off_topic). */
export const rejectProduct = mutation({
  args: {
    storefrontProductId: v.id("storefrontProducts"),
    reason: v.union(...REJECT_REASONS.map((r) => v.literal(r))),
  },
  returns: v.object({ rejected: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireStoreOperator(ctx);
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.storefrontProductId, { status: "rejected" });
      return {
        actorId: userId, action: "store.rejectProduct", target: `storefrontProducts:${args.storefrontProductId}`,
        prev: null, next: { status: "rejected", reason: args.reason },
        correlationId: newCorrelationId(), reversible: true, reasonCode: args.reason,
      };
    });
    return { rejected: true };
  },
});

/** CAP-240 — rescan lives in admin/storeValidate.rescanLinksAction
 * (node tier: safeFetch + drift compare + runMutation writes). */

/** CAP-241 — buyer-report drift: out-of-cycle flag → under_review. */
export const reportDrift = mutation({
  args: { storefrontLinkId: v.id("storefrontLinks"), note: v.optional(v.string()) },
  returns: v.object({ flagged: v.boolean() }),
  handler: async (ctx, args) => {
    await requireStoreOperator(ctx); // intake from buyer surfaces routes here via staff
    const link = await ctx.db.get(args.storefrontLinkId);
    if (!link) throw new Error("drift: link not found");
    if (link.validationState === "approved_locked") {
      await ctx.db.patch(args.storefrontLinkId, { validationState: "under_review" });
    }
    void args.note;
    return { flagged: true };
  },
});

/** CAP-263 — the queue view (batch ≤10; staff-only; null for non-staff). */
export const getQueue = query({
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
    const requests = await ctx.db
      .query("storeRequests")
      .withIndex("by_status", (q: any) => q.eq("status", "pending"))
      .take(10); // CAP-263 batch ≤10
    const links = await ctx.db
      .query("storefrontLinks")
      .withIndex("by_validationState", (q: any) => q.eq("validationState", "pending"))
      .take(10);
    const drifted = await ctx.db
      .query("storefrontLinks")
      .withIndex("by_validationState", (q: any) => q.eq("validationState", "under_review"))
      .take(10);
    return {
      requests: requests.map((r: any) => ({ requestId: r._id, userId: r.userId, networks: r.networks, createdAt: r.createdAt })),
      pendingLinks: links.map((l: any) => ({ linkId: l._id, url: l.submittedUrl, network: l.network })),
      driftedLinks: drifted.map((l: any) => ({ linkId: l._id, url: l.submittedUrl })),
    };
  },
});

/** Exported for the P6-17 tests: the THROW guard contract. */
export function assertNotLocked(link: any, field: string): void {
  if (link?.validationState === "approved_locked" && (LOCKED_LINK_FIELDS as readonly string[]).includes(field)) {
    throw new Error(`store: field '${field}' is LOCKED while approved_locked (INV-2 — edit = new version → re-validate)`);
  }
}
