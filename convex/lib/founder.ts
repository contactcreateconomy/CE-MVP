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
