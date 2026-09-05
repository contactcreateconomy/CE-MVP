import Facebook from "@auth/core/providers/facebook";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { convexAuth } from "@convex-dev/auth/server";

/** Convex Dashboard paste can include trailing newlines; GitHub rejects client_id with %0A. */
function oauthEnv(idKey: string, secretKey: string) {
  const clientId = (process.env[idKey] ?? "").trim() || undefined;
  const clientSecret = (process.env[secretKey] ?? "").trim() || undefined;
  return { clientId, clientSecret };
}

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
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
  if (name?.trim()) {
    const h = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (h) return h.slice(0, 40);
  }
  const local = email.split("@")[0] ?? "user";
  const fromEmail = local.toLowerCase().replace(/[^a-z0-9._-]/g, "-").slice(0, 40);
  return fromEmail || "user";
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
      profile(params) {
        const email = String(params.email ?? "")
          .trim()
          .toLowerCase();
        const out: { email: string; name?: string } = { email };
        if (typeof params.name === "string" && params.name.trim()) {
          out.name = params.name.trim();
        }
        return out;
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

        await ctx.db.insert("forumProfiles", {
          userId,
          handle,
          name: name ?? handle,
          image: typeof profile.image === "string" ? profile.image : "",
          bio: "",
          level: 1,
          points: 0,
          streakDays: 0,
          role: "member",
        });

        await ctx.db.insert("memberships", {
          userId,
          app: "forum",
          role: "member",
          createdAt: now,
        });
        await ctx.db.insert("memberships", {
          userId,
          app: "seller",
          role: "member",
          createdAt: now,
        });
        await ctx.db.insert("memberships", {
          userId,
          app: "marketplace",
          role: "member",
          createdAt: now,
        });

        const admins = parseAdminEmails();
        if (email && admins.has(email)) {
          await ctx.db.insert("memberships", {
            userId,
            app: "admin",
            role: "admin",
            createdAt: now,
          });
        }
      } else {
        await ctx.db.patch(userId, { updatedAt: now });
      }
    },
  },
});
