/**
 * apply — SLICE-P6-13: CAP-230/231/262 — /sell/apply: eligibility eval,
 * the tap-first application (four attestations), data-honesty acceptance.
 *
 * CAP-230 (quoted): "eligibility = profile complete + ≥1 social handle +
 *   eligible trust tier + no integrity/moderation hold + not staff, not
 *   persona." Staff → server-reject (R-STAFF class). The trust-tier
 *   cutoff is register-unnamed (apply OQ5): config-keyed
 *   store.apply.trustTierFloor with the flagged default t1 (ANY tier —
 *   the floor tightens by config, never by code).
 * CAP-231 (quoted): "attestations required" — the four named booleans.
 * CAP-262: data-honesty — records dataUseVersion against a config
 *   pointer; the /how-we-use-your-store-data PAGE CONTENT is Wave-7
 *   trust-pages (not invented here).
 * Mutation names unnamed (apply OQ3) — named store.apply.* in-slice.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";

const DATA_USE_VERSION = "store-data-use.v1"; // config pointer (Wave-7 page content lands later)

async function evaluateEligibility(ctx: any, userId: Id<"users">): Promise<{ eligible: boolean; reasons: string[] }> {
  const user = await ctx.db.get(userId);
  if (!user) return { eligible: false, reasons: ["user_not_found"] };
  // not staff, not persona (quoted) — personas never hold users rows;
  // staff exclusion is the explicit server-reject class
  if (user.isStaff) return { eligible: false, reasons: ["staff_excluded"] };
  const reasons: string[] = [];
  if (!user.basicProfileComplete) reasons.push("profile_incomplete");
  if (!user.trustTier) reasons.push("trust_tier_required"); // floor = t1 (any tier) — config-keyed, flagged
  if (user.accountStanding === "restricted" || user.accountStanding === "suspended" || user.accountStanding === "terminated") {
    reasons.push("integrity_hold");
  }
  const socials = await ctx.db
    .query("userSocialAccounts")
    .withIndex("by_user_platform", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("deletedAt"), undefined))
    .take(1);
  if (socials.length === 0) reasons.push("no_social_handle");
  return { eligible: reasons.length === 0, reasons };
}

/** The /sell/apply screen state (member-only; null for anonymous). */
export const getApplyState = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    const eligibility = await evaluateEligibility(ctx, userId);
    const existing = await ctx.db
      .query("storeRequests")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .first();
    return {
      eligibility,
      dataUseVersion: DATA_USE_VERSION,
      existingRequest: existing
        ? { status: existing.status, decidedAt: existing.decidedAt ?? null, reasonCode: existing.reasonCode ?? null }
        : null,
    };
  },
});

/** `store.apply.submit` — the tap-first application: eligibility gate +
 *  the four required attestations (CAP-231) + data-honesty acceptance
 *  (CAP-262) in one submission. */
export const submit = mutation({
  args: {
    categories: v.array(v.string()),
    networks: v.array(v.string()),
    expectedProductCount: v.number(),
    experienceNote: v.string(),
    attestations: v.object({
      owns: v.boolean(),
      programPermits: v.boolean(),
      regionEligible: v.boolean(),
      willDisclose: v.boolean(),
    }),
    termsVersion: v.string(),
    acceptDataHonesty: v.boolean(),
  },
  returns: v.object({ requestId: v.id("storeRequests") }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("store.apply: authentication required");
    await assertCustomerCapability(ctx, "manage_store"); // CAP-393 guard (protected write)

    // CAP-230 — the quoted eligibility formula (server-side, fail-closed)
    const eligibility = await evaluateEligibility(ctx, userId);
    if (!eligibility.eligible) {
      throw new Error(`store.apply: ineligible (${eligibility.reasons.join(",")})`);
    }
    // CAP-231 — all four attestations REQUIRED (any false = reject)
    const att = args.attestations;
    if (!(att.owns && att.programPermits && att.regionEligible && att.willDisclose)) {
      throw new Error("store.apply: all four attestations are required (owns, programPermits, regionEligible, willDisclose)");
    }
    // CAP-262 — data-honesty acceptance must be explicit
    if (!args.acceptDataHonesty) {
      throw new Error("store.apply: data-honesty acceptance required (CAP-262)");
    }
    // One live request per member
    const existing = await ctx.db
      .query("storeRequests")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .first();
    if (existing) throw new Error("store.apply: a pending request already exists");

    let requestId: Id<"storeRequests"> | undefined;
    await writeAudited(ctx, async (actx) => {
      requestId = (await actx.db.insert("storeRequests", {
        userId,
        status: "pending",
        categories: args.categories,
        networks: args.networks,
        expectedProductCount: args.expectedProductCount,
        experienceNote: args.experienceNote,
        attestations: args.attestations,
        termsVersion: args.termsVersion,
        dataUseVersion: DATA_USE_VERSION, // the CAP-262 stamp
        createdAt: Date.now(),
      })) as Id<"storeRequests">;
      return {
        actorId: userId, action: "store.apply.submit", target: `storeRequests:${requestId}`,
        prev: null, next: { status: "pending", networks: args.networks },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { requestId: requestId! };
  },
});
