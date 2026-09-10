/**
 * consent — SLICE-P7T-13: CAP-504/505/506 — the CMP record/withdraw
 * surface on `consentRecords` (back-filled from M18 l.74).
 *
 * CAP-504 (quoted): "strictly_necessary always (incl. server rawEvents);
 *   analytics → PostHog NOT injected until grant."
 * CAP-505 (quoted): "Granular purposes: strictly_necessary · functional ·
 *   analytics · marketing."
 * CAP-506 (quoted): "Withdrawal stops future capture; rawEvents NOT
 *   consent-gated; vendor delete path" — the vendor-delete half is
 *   P7O-08's `analyticsDeletionRequests` (OQ#3): this module writes a
 *   FLAGGED deletion-requested record only (the approved outbox pattern,
 *   DECISIONS-LOCKED #7); it never invents a second erasure pipeline and
 *   never deletes rawEvents.
 * Member path ships; anonymous grant is FENCED on CAP-387's stitch
 *   (OQ#2) — stop-and-report rather than a cookie scheme.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export const CMP_PURPOSES = ["strictly_necessary", "functional", "analytics", "marketing"] as const;
export const CMP_POLICY_VERSION = "cmp.v1";

async function hashOf(payload: unknown): Promise<string> {
  const json = JSON.stringify(payload ?? {});
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(json));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** CAP-505 consent.record — granular purposes; strictly_necessary is
 *  ALWAYS granted (non-negotiable, quoted) regardless of the payload. */
export const record = mutation({
  args: {
    granted: v.array(v.union(
      v.literal("functional"), v.literal("analytics"), v.literal("marketing"),
    )),
    denied: v.array(v.union(
      v.literal("functional"), v.literal("analytics"), v.literal("marketing"),
    )),
    jurisdictionClass: v.string(),
    collectionSurface: v.string(),
  },
  returns: v.object({ recorded: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) {
      // OQ#2 fence: anonymous consent needs CAP-387's anonymousConsentId
      // stitch — no cookie scheme invented here (stop-and-report posture)
      throw new Error("consent.record: sign in to set preferences (anonymous consent lands with CAP-387)");
    }
    const overlap = args.granted.filter((p) => args.denied.includes(p));
    if (overlap.length > 0) throw new Error("consent.record: a purpose cannot be both granted and denied");

    const now = Date.now();
    // Supersede prior active records (append-only: the old row keeps history)
    const prior = await ctx.db
      .query("consentRecords")
      .withIndex("by_user_grantedAt", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(10);
    for (const row of prior) {
      if (!row.withdrawnAt && !row.supersededAt) {
        await ctx.db.patch(row._id, { supersededAt: now });
      }
    }
    await ctx.db.insert("consentRecords", {
      userId,
      policyVersion: CMP_POLICY_VERSION,
      purposesGranted: ["strictly_necessary", ...args.granted], // always (quoted)
      purposesDenied: args.denied,
      jurisdictionClass: args.jurisdictionClass,
      collectionSurface: args.collectionSurface,
      grantedAt: now,
      evidenceHash: await hashOf({ granted: args.granted, denied: args.denied, userId }),
    });
    return { recorded: true };
  },
});

/** CAP-506 consent.withdraw — stops FUTURE vendor capture; rawEvents
 *  continue (quoted). Writes the deletion-requested outbox record for
 *  P7O-08's vendor-delete job (DECISIONS-LOCKED #7 pattern). */
export const withdraw = mutation({
  args: {
    purposes: v.array(v.union(
      v.literal("functional"), v.literal("analytics"), v.literal("marketing"),
    )),
  },
  returns: v.object({ withdrawn: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("consent.withdraw: authentication required");
    const now = Date.now();
    const active = await ctx.db
      .query("consentRecords")
      .withIndex("by_user_grantedAt", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(10);
    const current = active.find((r: any) => !r.withdrawnAt && !r.supersededAt);
    if (current) {
      await ctx.db.patch(current._id, { withdrawnAt: now });
    }
    // The outbox record: P7O-08's vendor-delete job consumes these;
    // this module NEVER calls the deletion API itself (OQ#3 fence —
    // DECISIONS-LOCKED #7 wires the background job)
    const subject = (await ctx.db.get(userId) as any)?.analyticsSubjectId as string | undefined;
    if (subject) {
      await ctx.db.insert("analyticsDeletionRequests", {
        analyticsSubjectId: subject,
        userId,
        purposes: args.purposes,
        status: "requested",
        requestedAt: now,
      });
    }
    return { withdrawn: true };
  },
});

/** The member's active consent state (the CMP's reopen path). */
export const myConsent = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    const rows = await ctx.db
      .query("consentRecords")
      .withIndex("by_user_grantedAt", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(5);
    const active = rows.find((r: any) => !r.withdrawnAt && !r.supersededAt) ?? null;
    return active
      ? { purposesGranted: active.purposesGranted, purposesDenied: active.purposesDenied, policyVersion: active.policyVersion }
      : null;
  },
});
