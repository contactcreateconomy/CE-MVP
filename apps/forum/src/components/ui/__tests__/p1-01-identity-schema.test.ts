import { describe, it, expect } from "vitest";

/* SLICE-P1-01a + P1-01b acceptance tests — schema-vs-bible fidelity.
 * Sources: _data-model.md l.42/43/44/50/315 (field union), Core-enums
 * l.404/405/406, DECISIONS-LOCKED #3 (7 bits). Introspection follows the
 * convex/server TableDescription shape: table.validator.fields (object
 * validator), v.optional wraps via .value, indexes as { indexDescriptor }. */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";

const schema = schemaDefault as any;
const users = schema.tables.users;
const roleAssignments = schema.tables.roleAssignments;
const privateUserData = schema.tables.privateUserData;

const fieldsOf = (table: any) => table.validator.fields;
// convex validators: optionality is an isOptional FLAG (no wrapper); unions
// carry literals in .members; arrays carry the item validator in .value.
function literalValues(field: any): string[] {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
}

const hasField = (table: any, field: string) => Boolean(fieldsOf(table)?.[field]);
const indexNames = (table: any) => (table.indexes ?? []).map((i: any) => i.indexDescriptor);

describe("SLICE-P1-01a — identity core", () => {
  it("roleAssignments.role matches the bible l.44 literal set exactly (camelCase)", () => {
    expect(literalValues(fieldsOf(roleAssignments).role).sort()).toEqual(
      ["member", "editor", "publisher", "moderator", "storeOperator", "supportOperator", "administrator"].sort(),
    );
  });

  it("roleAssignments represents the MUST-DEFINE default assignment shape", () => {
    for (const f of ["userId", "role", "scopeType", "scopeId", "grantedByUserId", "status", "grantedAt", "revokedAt"]) {
      expect(hasField(roleAssignments, f), `roleAssignments.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(roleAssignments).status).sort()).toEqual(["active", "revoked"]);
    expect(literalValues(fieldsOf(roleAssignments).scopeType)).toEqual(["global"]); // v1 global-only
    expect(indexNames(roleAssignments)).toEqual(
      expect.arrayContaining(["by_user", "by_user_role_status", "by_role_status"]),
    );
  });

  it("privateUserData carries the F-27 mobileNumber split (bible l.43)", () => {
    expect(hasField(privateUserData, "userId")).toBe(true);
    expect(hasField(privateUserData, "mobileNumber")).toBe(true);
  });

  it("users carries the M1 core segment (bible l.315)", () => {
    for (const f of [
      "tokenIdentifier", "emailVerified", "mobileVerified", "mobileVerifiedAt", "accountStatus",
      "accountStanding", "trustTier", "isStaff", "analyticsSubjectId", "bootstrapState",
      "leaderboardOptOut", "postingEligibilityState", "profileVisibility", "timezone",
      "username", "usernameNormalized",
    ]) {
      expect(hasField(users, f), `users.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(users).accountStanding).sort()).toEqual(
      ["good", "warned", "restricted", "suspended", "terminated"].sort(),
    );
    expect(literalValues(fieldsOf(users).bootstrapState).sort()).toEqual(["complete", "pending_context"]);
    expect(literalValues(fieldsOf(users).accountStatus).sort()).toEqual(["active", "deleted"]);
    expect(literalValues(fieldsOf(users).trustTier).sort()).toEqual(["t1", "t2", "t3"]);
  });

  it("users exposes the three canonical identity indexes (bible l.315)", () => {
    expect(indexNames(users)).toEqual(
      expect.arrayContaining(["by_tokenIdentifier", "by_analyticsSubjectId", "by_usernameNormalized"]),
    );
  });

  it("sealed M12 keys are absent by construction (P1-01a acceptance)", () => {
    for (const sealed of ["legitimacyMedianTarget", "signalEventWeights", "signalAttributionSplit", "trustWeightCap"]) {
      expect(hasField(users, sealed)).toBe(false);
    }
  });
});

describe("SLICE-P1-01b — cross-module deepenings", () => {
  it("(a) root-profile remainder fields present (bible l.42)", () => {
    for (const f of [
      "displayName", "avatarAssetId", "bio", "postCount", "approvedCommentCount",
      "lastActiveAt", "suspendedAt", "suspendedReason", "deletedAt",
    ]) {
      expect(hasField(users, f), `users.${f}`).toBe(true);
    }
  });

  it("(b) M7 eligibility block present with the postingEligibilityState literal set (Core-enums l.404)", () => {
    for (const f of [
      "basicProfileComplete", "rulesAcceptedVersion", "rulesAcceptedAt",
      "legalAgeAssertedVersion", "legalAgeAssertedAt", "profileVersion", "completionBadges",
    ]) {
      expect(hasField(users, f), `users.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(users).postingEligibilityState).sort()).toEqual(
      ["not_verified", "basic_incomplete", "eligible", "rate_limited", "temporarily_restricted", "suspended", "deleted"].sort(),
    );
  });

  it("(c) M13 standing tail present (bible l.245; standingSetByCaseId retyped to id in P1-03)", () => {
    expect(hasField(users, "standingExpiresAt")).toBe(true);
    expect(hasField(users, "standingSetByCaseId")).toBe(true);
  });

  it("(d) M14 block present with onboardingState/coachCardId/activationQuality literal sets (Core-enums l.405/406)", () => {
    for (const f of [
      "onboardingState", "firstValueAt", "activatedAt", "engagedAt", "retainedAt",
      "activationQuality", "activationDefinitionVersion", "ladderCompleteAt", "lastVisitAt",
      "currentSessionStartedAt", "lastQuotaExhaustedPeriodKey", "coachCardsShownCount",
      "checklistStepsShownMax", "coachDismissed", "coachDismissedAt", "onboardingExpiredAt",
      "newsletterConsentStatus",
    ]) {
      expect(hasField(users, f), `users.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(users).onboardingState).sort()).toEqual(
      ["new", "basic_profile_complete", "exploring", "activated", "engaged", "retained", "coach_dismissed", "expired"].sort(),
    );
    const coachArray = fieldsOf(users).coachDismissed; // v.array carries the item validator in .element
    expect(literalValues(coachArray.element).sort()).toEqual(
      ["discover_resource", "acquire_resource", "join_discussion", "return_update"].sort(),
    );
    expect(literalValues(fieldsOf(users).activationQuality).sort()).toEqual(
      ["standard", "unverified_fast", "staff_excluded"].sort(),
    );
  });

  it("activationProgress = exactly the 7 DECISIONS-LOCKED #3 bits, booleans only, no percentage field (CAP-368)", () => {
    const apFields = fieldsOf(users).activationProgress.fields;
    expect(Object.keys(apFields).sort()).toEqual(
      [
        "emailVerified", "mobileVerified", "profileComplete", "firstPostPublished",
        "firstCommentPosted", "firstReactionGiven", "firstFollowMade",
      ].sort(),
    );
    for (const [name, bit] of Object.entries(apFields) as [string, any][]) {
      expect(bit.kind, `activationProgress.${name} should be boolean`).toBe("boolean");
    }
    expect(hasField(users, "activationPercent")).toBe(false);
    expect(hasField(users, "activationProgressPercent")).toBe(false);
  });
});
