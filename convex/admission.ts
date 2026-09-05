/**
 * admission — SLICE-P2-01: three-mode gate + atomic bootstrap txn.
 *
 * FATAL-M1A-02: "effectiveSignupMode = readiness ? signup.mode : closed
 * server-side before member create." CAP-001: "3 modes: open→bootstrap,
 * waitlist→waitlistEntries only, closed→reject. Existing users bypass."
 * CAP-002: "Atomic txn; also sets bootstrapState=pending_context,
 * analyticsSubjectId (crypto-random), accountStanding=good, isStaff=false,
 * default member role" — partial-failure: any component insert failing
 * rolls back all three tables (FATAL-M1A-01/M1B-01).
 *
 * Pre-Phase-7 semantics (derived, stated not invented): no
 * launchReadinessResults row exists yet → readiness unevaluated →
 * fail-closed to closed per the formula's explicit falsy branch. Dev
 * environments enable admission via a seeded dev-only passing row.
 */

import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getFlag } from "./lib/authz";

/** Client-facing query for the /signin screen — returns the effective mode. */
export const getEffectiveMode = query({
  args: {},
  handler: async (ctx) => {
    return await effectiveSignupMode(ctx);
  },
});

export type SignupMode = "open" | "waitlist" | "closed";
export type EffectiveSignupMode = "open" | "waitlist" | "closed";

/**
 * FATAL-M1A-02 — server-computed effectiveSignupMode. Readiness is
 * fail-closed: no result row (or overall≠ready) → closed.
 */
export async function effectiveSignupMode(ctx: any): Promise<EffectiveSignupMode> {
  const configured = (await getFlag(ctx, "signup.mode").catch(() => false))
    ? "open"
    : await getSignupModeString(ctx);
  const readiness = await ctx.db.query("launchReadinessResults").first();
  const isReady = readiness !== null && readiness.overall === "ready";
  return isReady ? (configured as SignupMode) : "closed";
}

async function getSignupModeString(ctx: any): Promise<SignupMode> {
  // signup.mode is a string config, not boolean — read via systemConfig
  const row = await ctx.db
    .query("systemConfig")
    .withIndex("by_key", (q: any) => q.eq("key", "signup.mode"))
    .first();
  if (!row || row.status !== "active") return "waitlist"; // registry default
  return row.value as SignupMode;
}

/**
 * CAP-001 — the admission gate. Called BEFORE any user creation.
 * Returns the action to take: "proceed" (→ CAP-002 txn), "waitlist"
 * (→ waitlistEntries write only), or "reject" (→ closed).
 * Existing users bypass (checked by caller).
 */
export async function checkAdmission(ctx: any): Promise<"proceed" | "waitlist" | "reject"> {
  const mode = await effectiveSignupMode(ctx);
  switch (mode) {
    case "open":
      return "proceed";
    case "waitlist":
      return "waitlist";
    case "closed":
      return "reject";
  }
}

/**
 * CAP-002 — atomic bootstrap txn. One mutation:
 * 1. users row (canonical fields from P1-01a/01b)
 * 2. empty privateUserData row
 * 3. default member roleAssignments row
 *
 * All inserts succeed or none do (Convex mutation transactionality —
 * FATAL-M1A-01/M1B-01). Partial-failure test in the acceptance suite.
 */
export const bootstrapUser = internalMutation({
  args: {
    userId: v.id("users"),
    analyticsSubjectId: v.string(), // crypto-random, caller-generated
    anonymousSessionId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, analyticsSubjectId, anonymousSessionId }) => {
    // 1. users row — canonical bootstrap state
    await ctx.db.patch(userId, {
      emailVerified: true,
      accountStatus: "active",
      accountStanding: "good",
      trustTier: "t1",
      isStaff: false,
      analyticsSubjectId,
      bootstrapState: "pending_context",
      postingEligibilityState: "not_verified",
      profileVisibility: "public",
      leaderboardOptOut: false,
      onboardingState: "new",
      activationProgress: {
        emailVerified: true,
        mobileVerified: false,
        profileComplete: false,
        firstPostPublished: false,
        firstCommentPosted: false,
        firstReactionGiven: false,
        firstFollowMade: false,
      },
      createdAt: Date.now(),
    });

    // 2. empty privateUserData (sensitive split — bible l.43)
    await ctx.db.insert("privateUserData", {
      userId,
      // mobileNumber: absent until CAP-551 Twilio write
    });

    // 3. default member role (bible l.44 MUST-DEFINE)
    await ctx.db.insert("roleAssignments", {
      userId,
      role: "member",
      scopeType: "global",
      scopeId: undefined, // null for global
      status: "active",
      grantedAt: Date.now(),
      // grantedByUserId: absent = System/default assignment
    });

    return { userId, analyticsSubjectId };
  },
});
