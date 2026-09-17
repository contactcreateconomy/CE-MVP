import Facebook from "@auth/core/providers/facebook";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { convexAuth } from "@convex-dev/auth/server";
import { canonicalSignupFields, createOrLinkAuthUser } from "./lib/founder";

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
      // Identity only — `createOrUpdateUser` writes the canonical users row.
      // Convex Auth's default insert strips `emailVerified`, which our schema
      // requires; that is why first prod Google login bounced to the same screen.
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
    // Own the insert: Convex Auth's default path strips `emailVerified` and
    // then our required-field schema rejects the document. When this callback
    // is set, `afterUserCreatedOrUpdated` is not called.
    async createOrUpdateUser(ctx, args) {
      return await createOrLinkAuthUser(ctx, {
        existingUserId: args.existingUserId,
        profile: args.profile,
      });
    },
  },
});
