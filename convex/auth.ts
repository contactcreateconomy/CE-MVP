import Facebook from "@auth/core/providers/facebook";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { convexAuth } from "@convex-dev/auth/server";
import { normalizeHandle } from "./lib/handle";

/** Convex Dashboard paste can include trailing newlines; GitHub rejects client_id with %0A. */
function oauthEnv(idKey: string, secretKey: string) {
  const clientId = (process.env[idKey] ?? "").trim() || undefined;
  const clientSecret = (process.env[secretKey] ?? "").trim() || undefined;
  return { clientId, clientSecret };
}


/** Origins allowed for OAuth `redirectTo` (plus `SITE_URL`). Comma-separated URL prefixes in `AUTH_REDIRECT_ORIGINS`. */
function parseAuthRedirectOrigins(): Set<string> {
  const origins = new Set<string>();
  const site = (process.env.SITE_URL ?? "").trim();
  if (site) {
    try {
      origins.add(new URL(site).origin);
    } catch {
      /* ignore invalid SITE_URL */
    }
  }
  const extra = (process.env.AUTH_REDIRECT_ORIGINS ?? "").trim();
  if (!extra) return origins;
  for (const part of extra.split(",")) {
    const raw = part.trim();
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      /* skip invalid entry */
    }
  }
  return origins;
}

function deriveHandle(email: string, name?: string): string {
  // CAP-474 discipline via lib/handle (the same normalizer the username
  // reserve path uses) — only the SOURCE differs: name first, email
  // local-part fallback. Previously a cruder divergent regex lived here
  // ("José" → `jos-` handle vs `jose` username).
  if (name?.trim()) return normalizeHandle(name.trim());
  return normalizeHandle(email.split("@")[0] ?? "user");
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // SLICE-P2-04: Email (magic-link/token) added alongside existing providers.
    // Per 00-TRANSITION.md + P2-AUTH-CUTOVER: Password/OAuth/ADMIN_EMAILS
    // are NOT removed until the founder-bootstrap gate closes.
    Email({
      sendVerificationRequest: async (params: {
        identifier: string;
        url: string;
        expires: Date;
        token: string;
      }) => {
        // In dev, log the token for testing. In production, wire to a real
        // email provider (Phase 7 CMP/reliability work).
        if (process.env.NODE_ENV === "development") {
          console.log(`[Email] sign-in token for ${params.identifier}: ${params.token}`);
          console.log(`[Email] magic-link URL: ${params.url}`);
          return;
        }
        // Production: TODO wire email provider (unimplemented until the
        // CMP/reliability phase owns email infrastructure)
        throw new Error("Email provider not configured for production");
      },
    }),
    Password({
      // P7-CLEANUP: returns the FULL bible-required canonical set so the
      // strict users schema validates on the library's insert (the profile
      // is persisted only on signUp — signIn of an existing account never
      // writes these). tokenIdentifier is the one field omitted: the auth
      // subject exists only after this row is created (patched in the
      // afterUserCreatedOrUpdated callback below).
      profile(params) {
        const email = String(params.email ?? "")
          .trim()
          .toLowerCase();
        const name =
          typeof params.name === "string" && params.name.trim()
            ? params.name.trim()
            : undefined;
        const now = Date.now();
        return {
          email,
          ...(name ? { name } : null),
          createdAt: now,
          emailVerified: false,
          mobileVerified: false,
          mobileVerifiedAt: 0,
          accountStatus: "active" as const,
          accountStanding: "good" as const,
          trustTier: "t1" as const,
          analyticsSubjectId: crypto.randomUUID(),
          bootstrapState: "pending_context" as const,
          leaderboardOptOut: false,
          postingEligibilityState: "not_verified" as const,
          profileVisibility: "public" as const,
          displayName: name ?? email.split("@")[0] ?? "member",
          avatarAssetId: "",
          bio: "",
          postCount: 0,
          approvedCommentCount: 0,
          lastActiveAt: now,
          suspendedAt: 0,
          suspendedReason: "",
          deletedAt: 0,
          basicProfileComplete: false,
          rulesAcceptedVersion: "",
          rulesAcceptedAt: 0,
          legalAgeAssertedVersion: "",
          legalAgeAssertedAt: 0,
          profileVersion: 1,
          completionBadges: [] as string[],
          onboardingState: "new" as const,
          coachCardsShownCount: 0,
          checklistStepsShownMax: 0,
          coachDismissed: [] as (
            | "discover_resource"
            | "acquire_resource"
            | "join_discussion"
            | "return_update"
          )[],
          activationProgress: {
            emailVerified: false,
            mobileVerified: false,
            profileComplete: false,
            firstPostPublished: false,
            firstCommentPosted: false,
            firstReactionGiven: false,
            firstFollowMade: false,
          },
        };
      },
    }),
    GitHub(oauthEnv("AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET")),
    Google(oauthEnv("AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET")),
    Facebook(oauthEnv("AUTH_FACEBOOK_ID", "AUTH_FACEBOOK_SECRET")),
  ],
  callbacks: {
    async redirect({ redirectTo }) {
      const fallback = (process.env.SITE_URL ?? "").trim() || "/";
      if (typeof redirectTo !== "string" || !redirectTo.trim()) {
        return fallback;
      }
      const target = redirectTo.trim();
      if (target.startsWith("?")) {
        return target;
      }
      if (target.startsWith("/") && !target.startsWith("//")) {
        return target;
      }
      const allowed = parseAuthRedirectOrigins();
      try {
        const url = new URL(target);
        if (allowed.has(url.origin)) {
          return target;
        }
      } catch {
        /* invalid absolute URL */
      }
      return fallback;
    },
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId, profile }) {
      const now = Date.now();
      const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
      const name = typeof profile.name === "string" ? profile.name : undefined;
      const handle = deriveHandle(email || "user@local", name);

      if (existingUserId === null) {
        await ctx.db.patch(userId, {
          handle,
          createdAt: now,
          updatedAt: now,
        });

        // P7-CLEANUP: the legacy profile/membership (email-allowlist
        // authority) inserts retired with the forum-scoped tables — the
        // canonical users/roleAssignments pair (CAP-007 grantFounder /
        // CAP-413 roles.assign) is the only authority path.
      } else {
        await ctx.db.patch(userId, { updatedAt: now });
      }
    },
  },
});
