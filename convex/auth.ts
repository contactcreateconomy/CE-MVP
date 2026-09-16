import Facebook from "@auth/core/providers/facebook";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { convexAuth } from "@convex-dev/auth/server";
import { normalizeHandle } from "./lib/handle";
import { checkAdmission } from "./admission";
import {
  canonicalSignupFields,
  ensureFounderPrivileges,
  isFounderEmail,
} from "./lib/founder";

/** CAP-016/017 (scan 2026-09-13, finding 22): magic-link throttles —
 *  5/15m per identifier, 3/1h per identifier — enforced at the ONE seam
 *  the library exposes before the token is generated. In production the
 *  provider throws when no email infrastructure is wired, so this also
 *  gates the (currently dev-only) token log. */
function checkMagicLinkThrottle(identifier: string): void {
  const now = Date.now();
  const key = `auth.magic_link.lastSent:${identifier.toLowerCase()}`;
  const last = magicLinkThrottleCache.get(key) ?? 0;
  // CAP-016: max 5 per 15m → one per ≥3m on this seam (fail-closed proxy
  // for the per-IP half, which only httpAction headers can see).
  if (now - last < 3 * 60_000) {
    throw new Error("Too many sign-in requests — try again in a few minutes (CAP-016).");
  }
  magicLinkThrottleCache.set(key, now);
  // CAP-017: max 3 per 1h → one per ≥20m on this seam.
  const keyHour = `auth.magic_link.hourCount:${identifier.toLowerCase()}`;
  const windowStart = now - 60 * 60_000;
  const hourTs = magicLinkHourCache.get(keyHour) ?? [];
  const inWindow = hourTs.filter((t) => t > windowStart);
  if (inWindow.length >= 3) {
    throw new Error("Too many sign-in requests this hour — try again later (CAP-017).");
  }
  inWindow.push(now);
  magicLinkHourCache.set(keyHour, inWindow);
}

// Process-local throttle state. Convex "use node"-less functions are
// single-per-isolate, but a memory map here is best-effort protection —
// the authoritative limits live in lib/rateLimit's named buckets and can
// be wired to the component rate-limiter when this provider gains a ctx.
const magicLinkThrottleCache = new Map<string, number>();
const magicLinkHourCache = new Map<string, Array<number>>();

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
        // SECURITY (scan 2026-09-13, finding 22): the CAP-016/017 throttles
        // wired at this seam (see checkMagicLinkThrottle).
        checkMagicLinkThrottle(params.identifier);
        // In dev, log the token for testing. In production, wire to a real
        // email provider (Phase 7 CMP/reliability work). SECURITY (finding
        // 22): the token log is dev-only (NODE_ENV gate) — never prod.
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
        return canonicalSignupFields(email, name);
      },
    }),
    GitHub({
      ...oauthEnv("AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"),
      profile(profile) {
        const email = String(profile.email ?? "").trim().toLowerCase();
        return {
          id: String(profile.id ?? ""),
          ...canonicalSignupFields(email, profile.name ?? undefined),
          ...(profile.avatar_url ? { image: profile.avatar_url } : null),
        };
      },
    }),
    Google({
      ...oauthEnv("AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"),
      profile(profile) {
        const email = String(profile.email ?? "").trim().toLowerCase();
        return {
          id: String(profile.sub ?? ""),
          ...canonicalSignupFields(email, profile.name ?? undefined),
          ...(profile.picture ? { image: profile.picture } : null),
        };
      },
    }),
    Facebook({
      ...oauthEnv("AUTH_FACEBOOK_ID", "AUTH_FACEBOOK_SECRET"),
      profile(profile) {
        const email = String(profile.email ?? "").trim().toLowerCase();
        const image = profile.picture?.data?.url;
        return {
          id: String(profile.id ?? ""),
          ...canonicalSignupFields(email, profile.name ?? undefined),
          ...(image ? { image } : null),
        };
      },
    }),
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
      // SECURITY (scan 2026-09-13, finding 27): backslashes in a path-style
      // redirect are normalized to "/" by every major browser — "/\evil.example"
      // becomes "//evil.example" (protocol-relative open redirect). Reject
      // any backslash before the same-origin checks.
      if (target.includes("\\")) {
        return fallback;
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
        // SECURITY (scan 2026-09-13, finding 3): admission + bootstrap on
        // the create path. The library calls this callback INSIDE the same
        // transaction as the users insert — throwing here rolls back the
        // entire account creation (no orphan users row, no authAccounts
        // link), which is the fail-closed CAP-001 posture: signup closed/
        // waitlist ⇒ NO account exists after the attempt.
        // Founder email is the documented CAP-007 exception: an empty/closed
        // deployment must still admit the founder (FOUNDER-BOOTSTRAP).
        if (!isFounderEmail(email)) {
          const admission = await checkAdmission(ctx);
          if (admission === "reject") {
            throw new Error("auth: signup is closed — account creation rejected (CAP-001)");
          }
          if (admission === "waitlist") {
            // REVIEW-FIX (self-review of finding 3): do NOT insert a
            // waitlistEntries row here — this callback runs inside the same
            // transaction as the users insert, and the throw below rolls
            // EVERYTHING back (the waitlist write would never persist).
            // Waitlist capture stays on the public waitlist.join surface
            // (CAP-015); this seam's single job is the fail-closed reject:
            // waitlist-mode signup leaves NO account behind.
            throw new Error("auth: signup is waitlist-only — join the waitlist from the sign-in screen (CAP-001/CAP-015)");
          }
        }

        await ctx.db.patch(userId, {
          handle,
          createdAt: now,
          updatedAt: now,
        });

        // SECURITY (finding 3): CAP-002 bootstrap was never invoked here —
        // password/OAuth accounts were created with NO member role, NO
        // privateUserData row, and no analytics id. These in-transaction
        // inserts give every new account the same atomic bootstrap the
        // admission path guarantees (users + privateUserData +
        // roleAssignments all-or-nothing, FATAL-M1A-01).
        const db = ctx.db as any;
        const existingPrivate = await db
          .query("privateUserData")
          .withIndex("by_user", (q: any) => q.eq("userId", userId))
          .unique();
        if (!existingPrivate) {
          await db.insert("privateUserData", { userId });
        }
        const memberRole = await db
          .query("roleAssignments")
          .withIndex("by_user", (q: any) => q.eq("userId", userId))
          .filter((q: any) => q.eq(q.field("role"), "member"))
          .first();
        if (!memberRole) {
          await ctx.db.insert("roleAssignments", {
            userId,
            role: "member",
            scopeType: "global",
            status: "active",
            grantedAt: now,
          });
        }
      } else {
        await ctx.db.patch(userId, { updatedAt: now });
      }

      if (isFounderEmail(email)) {
        await ensureFounderPrivileges(ctx, userId);
      }
    },
  },
});
