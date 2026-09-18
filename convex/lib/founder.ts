/**
 * Founder identity + canonical signup fields.
 *
 * CAP-007 bootstrap must survive a prod wipe: signup is fail-closed until
 * launch readiness, and Google/GitHub profiles do not include bible-required
 * users fields. The documented founder email may create an account and
 * receive every staff role even when CAP-001 would reject everyone else.
 */
import type { Id } from "../_generated/dataModel";
import { STAFF_ROLES, type StaffRole } from "./authz";
import { normalizeHandle } from "./handle";
import { checkAdmission } from "../admission";

/** Documented founder Google identity (FOUNDER-BOOTSTRAP). */
export const FOUNDER_EMAIL = "contact.createconomy@gmail.com";

export function founderEmails(): string[] {
  const fromEnv = [process.env.ADMIN_EMAILS, process.env.FOUNDER_EMAILS]
    .filter((s): s is string => Boolean(s && s.trim()))
    .join(",")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...fromEnv, FOUNDER_EMAIL])];
}

export function isFounderEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return founderEmails().includes(email.trim().toLowerCase());
}

function deriveHandle(email: string, name?: string): string {
  if (name?.trim()) return normalizeHandle(name.trim());
  return normalizeHandle(email.split("@")[0] ?? "user");
}

/**
 * Convex Auth's default insert **strips** `emailVerified` / `phoneVerified`
 * from `profile()` (it treats them as Auth.js verified-flags and converts
 * them to `emailVerificationTime`). Our schema requires `emailVerified` as
 * a boolean, so a first OAuth insert on an empty deployment fails schema
 * and rolls back — the user returns to the login screen with no `users`
 * row. Dest/local still works when the account already exists (patch path).
 *
 * Use this from `callbacks.createOrUpdateUser` so we insert the canonical
 * row ourselves. When that callback is set, Convex Auth does not call
 * `afterUserCreatedOrUpdated`.
 */
export async function createOrLinkAuthUser(
  ctx: { db: any },
  args: {
    existingUserId: Id<"users"> | null;
    profile: Record<string, unknown>;
  },
): Promise<Id<"users">> {
  const now = Date.now();
  const email =
    typeof args.profile.email === "string" ? args.profile.email.trim().toLowerCase() : "";
  const name =
    typeof args.profile.name === "string" && args.profile.name.trim()
      ? args.profile.name.trim()
      : undefined;
  const image =
    typeof args.profile.image === "string" && args.profile.image.trim()
      ? args.profile.image.trim()
      : undefined;

  if (args.existingUserId === null) {
    if (!isFounderEmail(email)) {
      const admission = await checkAdmission(ctx);
      if (admission === "reject") {
        throw new Error("auth: signup is closed — account creation rejected (CAP-001)");
      }
      if (admission === "waitlist") {
        throw new Error(
          "auth: signup is waitlist-only — join the waitlist from the sign-in screen (CAP-001/CAP-015)",
        );
      }
    }

    const userId = (await ctx.db.insert("users", {
      ...canonicalSignupFields(email, name),
      handle: deriveHandle(email || "user@local", name),
      updatedAt: now,
      ...(image ? { image } : null),
    })) as Id<"users">;

    const existingPrivate = await ctx.db
      .query("privateUserData")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .unique();
    if (!existingPrivate) {
      await ctx.db.insert("privateUserData", { userId });
    }
    const memberRole = await ctx.db
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

    if (isFounderEmail(email)) {
      await ensureFounderPrivileges(ctx, userId);
    }
    return userId;
  }

  await ctx.db.patch(args.existingUserId, {
    updatedAt: now,
    ...(image ? { image } : null),
  });
  const existingPrivate = await ctx.db
    .query("privateUserData")
    .withIndex("by_user", (q: any) => q.eq("userId", args.existingUserId))
    .unique();
  if (!existingPrivate) {
    await ctx.db.insert("privateUserData", { userId: args.existingUserId });
  }
  const memberRole = await ctx.db
    .query("roleAssignments")
    .withIndex("by_user_role_status", (q: any) =>
      q.eq("userId", args.existingUserId).eq("role", "member").eq("status", "active"),
    )
    .unique();
  if (!memberRole) {
    await ctx.db.insert("roleAssignments", {
      userId: args.existingUserId,
      role: "member",
      scopeType: "global",
      status: "active",
      grantedAt: now,
    });
  }
  if (isFounderEmail(email)) {
    await ensureFounderPrivileges(ctx, args.existingUserId);
  }
  return args.existingUserId;
}

/** Full bible-required users insert shape (P7-CLEANUP). tokenIdentifier omitted. */
export function canonicalSignupFields(email: string, name?: string) {
  const now = Date.now();
  const trimmedName =
    typeof name === "string" && name.trim() ? name.trim() : undefined;
  return {
    email,
    ...(trimmedName ? { name: trimmedName } : null),
    createdAt: now,
    emailVerified: true,
    mobileVerified: false,
    mobileVerifiedAt: 0,
    accountStatus: "active" as const,
    accountStanding: "good" as const,
    trustTier: "t1" as const,
    analyticsSubjectId: crypto.randomUUID(),
    bootstrapState: "pending_context" as const,
    leaderboardOptOut: false,
    postingEligibilityState: "basic_incomplete" as const,
    profileVisibility: "public" as const,
    displayName: trimmedName ?? opaqueMemberLabel(),
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
      emailVerified: true,
      mobileVerified: false,
      profileComplete: false,
      firstPostPublished: false,
      firstCommentPosted: false,
      firstReactionGiven: false,
      firstFollowMade: false,
    },
  };
}

function opaqueMemberLabel(): string {
  const rand = crypto.randomUUID().slice(0, 8);
  return `member-${rand}`;
}

export async function ensureFounderPrivileges(
  ctx: { db: any },
  userId: Id<"users">,
): Promise<{ already: boolean; granted: StaffRole[] }> {
  await ctx.db.patch(userId, { isStaff: true });
  const existing = await ctx.db
    .query("roleAssignments")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const now = Date.now();
  const granted: StaffRole[] = [];
  for (const role of STAFF_ROLES) {
    const active = existing.some(
      (r: { role: string; status: string }) => r.role === role && r.status === "active",
    );
    if (active) continue;
    await ctx.db.insert("roleAssignments", {
      userId,
      role,
      scopeType: "global",
      status: "active",
      grantedAt: now,
    });
    granted.push(role);
  }
  return { already: granted.length === 0, granted };
}
