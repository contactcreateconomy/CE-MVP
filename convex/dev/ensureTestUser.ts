import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction, internalQuery } from "../_generated/server";

/** Log in with the email (not a bare username) in the app’s auth form.
 * SECURITY (scan 2026-09-13, finding 21): the password is no longer a
 * source-code literal — it must be supplied via DEV_TEST_USER_PASSWORD at
 * ensure time (the env-gated dev-only flow reads it; production deploys
 * never define ALLOW_DEV_TEST_USER). A credential that ships in source is
 * a known-password account on every deployment. */
const DEVTEST_EMAIL = "devtest@example.com";
const DEVTEST_NAME = "Devtest";

function devTestPassword(): string {
  const pw = process.env.DEV_TEST_USER_PASSWORD;
  if (!pw || pw.length < 8) {
    throw new Error(
      "Set DEV_TEST_USER_PASSWORD (≥8 chars) on the Convex deployment before running dev/ensureTestUser:ensure — hard-coded dev credentials were removed (security scan 2026-09-13).",
    );
  }
  return pw;
}

export const hasPasswordAccount = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const acc = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", DEVTEST_EMAIL),
      )
      .unique();
    return acc !== null;
  },
});

/**
 * Idempotent: creates the password account if missing, or no-ops if it already
 * exists with the same password. Requires a short-lived env gate (see convex/.env.example).
 */
export const ensure = internalAction({
  args: {},
  returns: v.object({
    email: v.string(),
    name: v.string(),
    alreadyExisted: v.boolean(),
  }),
  handler: async (ctx) => {
    if (process.env.ALLOW_DEV_TEST_USER !== "true") {
      throw new Error(
        "Set ALLOW_DEV_TEST_USER=true on the Convex deployment, run `pnpm exec convex run dev/ensureTestUser:ensure`, then remove the flag.",
      );
    }
    const existed = await ctx.runQuery(internal.dev.ensureTestUser.hasPasswordAccount, {});
    if (existed) {
      return { email: DEVTEST_EMAIL, name: DEVTEST_NAME, alreadyExisted: true };
    }
    await createAccount(ctx, {
      provider: "password",
      account: { id: DEVTEST_EMAIL, secret: devTestPassword() },
      // P7-CLEANUP: full canonical set — the strict users schema validates
      // on this insert (same defaults as the Password profile callback).
      profile: {
        email: DEVTEST_EMAIL,
        name: DEVTEST_NAME,
        createdAt: Date.now(),
        emailVerified: true,
        mobileVerified: false,
        mobileVerifiedAt: 0,
        accountStatus: "active",
        accountStanding: "good",
        trustTier: "t1",
        analyticsSubjectId: crypto.randomUUID(),
        bootstrapState: "complete",
        leaderboardOptOut: false,
        postingEligibilityState: "eligible",
        profileVisibility: "public",
        displayName: DEVTEST_NAME,
        avatarAssetId: "",
        bio: "",
        postCount: 0,
        approvedCommentCount: 0,
        lastActiveAt: Date.now(),
        suspendedAt: 0,
        suspendedReason: "",
        deletedAt: 0,
        basicProfileComplete: true,
        rulesAcceptedVersion: "",
        rulesAcceptedAt: 0,
        legalAgeAssertedVersion: "",
        legalAgeAssertedAt: 0,
        profileVersion: 1,
        completionBadges: [],
        onboardingState: "activated",
        coachCardsShownCount: 0,
        checklistStepsShownMax: 0,
        coachDismissed: [],
        activationProgress: {
          emailVerified: true,
          mobileVerified: false,
          profileComplete: true,
          firstPostPublished: false,
          firstCommentPosted: false,
          firstReactionGiven: false,
          firstFollowMade: false,
        },
      },
    });
    return { email: DEVTEST_EMAIL, name: DEVTEST_NAME, alreadyExisted: false };
  },
});
