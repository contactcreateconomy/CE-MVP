/**
 * settings — SLICE-P5-06: the /settings/profile WRITE surface
 * (CAP-143/146/147/149/150/151/157/549/552 — CONTRACT-5-settings-profile).
 *
 * Ownership split: this module WRITES; /users/[handle] (P5-07) displays.
 * No rawEvents (contract §5) — the trails are userConsentRecords +
 * profileCompletionEvents (append-only) + auditLog (erasure records only).
 *
 * Consent mapping (contract OQ2 — attribute→purpose mapping incomplete;
 * flagged best-effort): roleArchetype/ageBand → demographicsPersonalization
 * (demographic attributes — default OFF, so the member grants in-flow);
 * toolsUsed → interestsPersonalization; bio/avatar/socials visibility →
 * publicProfileVisibility. Every setAttribute appends its consent record
 * (the CAP-148 gate is evidenced, not assumed).
 *
 * Erasure precision (CAP-151, quoted): "Invalidates derivation trail
 *   source records. Recognition persists as 'completed under version X'
 *   without revealing answers. Aggregates survive only if unlinkable.
 *   Never retain erased values in auditLog.prev." — the audit entry's
 *   prev carries the attributeType ONLY (non-value-bearing by construction).
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { CONSENT_PURPOSES, type ConsentPurpose } from "../setup";

const CURRENT_RULES_VERSION = "rules.v1"; // CAP-157's "current" — single source with /setup (OQ3-flagged)

async function requireUser(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("settings: authentication required");
  return userId;
}

async function profilesRow(ctx: any, userId: Id<"users">): Promise<any | null> {
  return await ctx.db.query("profiles").withIndex("by_user", (q: any) => q.eq("userId", userId)).unique();
}

/** OQ2-flagged mapping (see module docblock). */
function purposeForField(field: string): ConsentPurpose {
  if (field === "roleArchetype" || field === "ageBand") return "demographicsPersonalization";
  if (field === "toolsUsed") return "interestsPersonalization";
  return "publicProfileVisibility"; // bio / avatar
}

async function appendConsent(
  ctx: any,
  userId: Id<"users">,
  purpose: string,
  status: string,
  surface: string,
): Promise<void> {
  await ctx.db.insert("userConsentRecords", {
    userId,
    purpose,
    policyVersion: CURRENT_RULES_VERSION,
    status,
    collectionSurface: surface,
    occurredAt: Date.now(),
    withdrawnAt: status === "withdrawn" ? Date.now() : undefined,
  });
}

/** CAP-150 — per-field badge recompute. Called from the attribute writers
 *  (same mutation). Badges live on users.completionBadges[] + append-only
 *  profileCompletionEvents. Recognition-only firewall: nothing here feeds
 *  Signal/rank/reach. "Prefer not to say" = completed decision, equal credit. */
async function recomputeBadges(ctx: any, userId: Id<"users">, field: string): Promise<void> {
  const user = await ctx.db.get(userId);
  const profile = await profilesRow(ctx, userId);
  const badges = new Set<string>(user?.completionBadges ?? []);
  let completed = false;
  switch (field) {
    case "roleArchetype": completed = profile?.roleArchetype !== undefined; break;
    case "ageBand": completed = profile?.ageBand !== undefined; break;
    case "toolsUsed": completed = (profile?.toolsUsed?.length ?? 0) > 0; break;
    case "bio": completed = Boolean(user?.bio); break;
    case "interests": completed = (profile?.firstTapOrder?.length ?? 0) > 0; break;
    case "socials": {
      const socials = await ctx.db
        .query("userSocialAccounts")
        .withIndex("by_user_platform", (q: any) => q.eq("userId", userId))
        .filter((q: any) => q.eq(q.field("deletedAt"), undefined))
        .take(5);
      completed = socials.length > 0;
      break;
    }
  }
  const isNew = completed && !badges.has(field);
  if (isNew) {
    badges.add(field);
    await ctx.db.patch(userId, { completionBadges: [...badges] });
    const profileRow = await profilesRow(ctx, userId);
    const completionVersion = (profileRow?.completionVersion ?? 0) + 1;
    if (profileRow) await ctx.db.patch(profileRow._id, { completionVersion, updatedAt: Date.now() });
    await ctx.db.insert("profileCompletionEvents", {
      userId,
      completionVersion,
      badgeField: field,
      awarded: true,
      occurredAt: Date.now(),
    });
  }
}

/** CAP-143 `profile.setAttribute` — tap-only, progressive, purpose-labelled;
 *  "prefer not to say" is a completed decision (equal credit). Age-band
 *  income/spend are Phase-2 — NOT offered here. */
export const setAttribute = mutation({
  args: {
    field: v.union(
      v.literal("roleArchetype"), v.literal("ageBand"),
      v.literal("toolsUsed"), v.literal("bio"),
    ),
    value: v.any(),
  },
  returns: v.object({ set: v.boolean(), consentRequired: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const profile = await profilesRow(ctx, userId);
    const purpose = purposeForField(args.field);

    // CAP-148 gate: the consent flag for THIS field's purpose must be granted
    const flags = profile?.consentFlags;
    const granted = flags ? flags[purpose] === true : purpose !== "demographicsPersonalization";
    if (!granted) {
      return { set: false, consentRequired: purpose }; // client offers the grant, then retries
    }

    const now = Date.now();
    if (args.field === "bio") {
      const bio = typeof args.value === "string" ? args.value.slice(0, 500) : "";
      await ctx.db.patch(userId, { bio });
    } else {
      if (!profile) throw new Error("setAttribute: complete /setup first (no profiles row)");
      await ctx.db.patch(profile._id, {
        [args.field]: args.value,
        profileVersion: profile.profileVersion + 1,
        updatedAt: now,
      });
      // Versioned structured declaration for the banded/enum attributes
      if (args.field === "roleArchetype" || args.field === "ageBand") {
        const prior = await ctx.db
          .query("userProfileAttributes")
          .withIndex("by_user_type", (q: any) => q.eq("userId", userId).eq("attributeType", args.field))
          .filter((q: any) => q.eq(q.field("deletedAt"), undefined))
          .first();
        if (prior) {
          await ctx.db.patch(prior._id, {
            value: args.value,
            valueVersion: prior.valueVersion + 1,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("userProfileAttributes", {
            userId,
            attributeType: args.field,
            value: args.value,
            valueVersion: 1,
            visibility: "private",
            consentStatus: "granted",
            providedAt: now,
            updatedAt: now,
          });
        }
      }
    }

    await appendConsent(ctx, userId, purpose, "granted", "/settings/profile");
    await recomputeBadges(ctx, userId, args.field);
    return { set: true };
  },
});

/** CAP-146 `social.add` — stored handle only; NO OAuth/fetch in V1. */
export const socialAdd = mutation({
  args: {
    platform: v.string(),
    handle: v.string(),
    profileUrl: v.optional(v.string()),
    visibility: v.union(v.literal("private"), v.literal("public"), v.literal("future_marketplace_only")),
  },
  returns: v.object({ added: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (args.handle.trim().length === 0) throw new Error("social.add: handle required");
    const existing = await ctx.db
      .query("userSocialAccounts")
      .withIndex("by_user_platform", (q: any) => q.eq("userId", userId).eq("platform", args.platform))
      .filter((q: any) => q.eq(q.field("deletedAt"), undefined))
      .first();
    if (existing) throw new Error("social.add: platform already linked (revoke first)");
    await ctx.db.insert("userSocialAccounts", {
      userId,
      platform: args.platform,
      handle: args.handle.trim(),
      profileUrl: args.profileUrl ?? "",
      verificationStatus: "unverified",
      visibility: args.visibility,
      connectedAt: Date.now(),
    });
    await appendConsent(ctx, userId, "publicProfileVisibility", "granted", "/settings/profile");
    await recomputeBadges(ctx, userId, "socials");
    return { added: true };
  },
});

/** CAP-147 `social.verify` — Phase-3 stub: reports the disabled state,
 *  never claims functional verification (fail-closed honesty). */
export const socialVerify = mutation({
  args: { socialAccountId: v.id("userSocialAccounts") },
  returns: v.object({ verified: v.boolean(), stub: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(args.socialAccountId);
    if (!row || row.userId !== userId) throw new Error("social.verify: not your account row");
    // Phase-3 feature (admin-config toggle per contract §1) — V1 stub:
    // no verification is performed or claimed.
    return { verified: false, stub: true };
  },
});

/** CAP-549 `social.revoke` — soft-delete (CAP-545 precedent): the row is
 *  retained for audit; revokedAt + deletedAt set. */
export const socialRevoke = mutation({
  args: { socialAccountId: v.id("userSocialAccounts") },
  returns: v.object({ revoked: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(args.socialAccountId);
    if (!row || row.userId !== userId) throw new Error("social.revoke: not your account row");
    if (row.deletedAt) return { revoked: true }; // idempotent
    await ctx.db.patch(args.socialAccountId, { revokedAt: Date.now(), deletedAt: Date.now() });
    return { revoked: true };
  },
});

/** CAP-149 `profile.consentWithdraw` — append-only withdrawal + flag flip +
 *  the CAP-151 erasure cascade, all one transaction (quoted: "triggers"). */
export const consentWithdraw = mutation({
  args: { purpose: v.union(...CONSENT_PURPOSES.map((p) => v.literal(p))) },
  returns: v.object({ withdrawn: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await appendConsent(ctx, userId, args.purpose, "withdrawn", "/settings/profile");
    const profile = await profilesRow(ctx, userId);
    if (profile) {
      const flags = { ...profile.consentFlags };
      flags[args.purpose as ConsentPurpose] = false;
      await ctx.db.patch(profile._id, { consentFlags: flags, profileVersion: profile.profileVersion + 1, updatedAt: Date.now() });
    }
    // Withdrawal overrides analytics/personalization/marketplace/completion
    // use — and invalidates the dependent inference + attribute classes
    await erasureCascade(ctx, userId, args.purpose);
    return { withdrawn: true };
  },
});

/** The CAP-151 cascade — shared by consentWithdraw + detachAttribute. */
async function erasureCascade(ctx: any, userId: Id<"users">, purpose: string): Promise<void> {
  const now = Date.now();
  // Inference classes tied to the withdrawn purpose (l.61 allowed list)
  const inferenceClasses =
    purpose === "interestsPersonalization"
      ? ["topic_affinity", "post_type_affinity", "tool_category_affinity", "resource_category_affinity", "view_mode_affinity"]
      : purpose === "behavioralInference"
        ? ["engagement_archetype", "expertise_signal"]
        : [];
  if (inferenceClasses.length > 0) {
    for (const inferenceType of inferenceClasses) {
      const rows = await ctx.db
        .query("userInferences")
        .withIndex("by_user_type_status", (q: any) =>
          q.eq("userId", userId).eq("inferenceType", inferenceType).eq("status", "active"))
        .collect();
      for (const row of rows) {
        await ctx.db.patch(row._id, { status: "invalidated" });
      }
    }
  }
  // Demographics withdrawal detaches the banded declarations
  if (purpose === "demographicsPersonalization") {
    for (const attributeType of ["roleArchetype", "ageBand"]) {
      const rows = await ctx.db
        .query("userProfileAttributes")
        .withIndex("by_user_type", (q: any) => q.eq("userId", userId).eq("attributeType", attributeType))
        .filter((q: any) => q.eq(q.field("deletedAt"), undefined))
        .collect();
      for (const row of rows) {
        await ctx.db.patch(row._id, { deletedAt: now, updatedAt: now });
      }
      const profile = await profilesRow(ctx, userId);
      if (profile) {
        await ctx.db.patch(profile._id, { [attributeType]: undefined, updatedAt: now });
      }
    }
  }
}

/** CAP-151 `erasure.detachAttribute` — member-initiated field erase.
 *  The audit record is NON-VALUE-BEARING: prev carries the attributeType
 *  only. Recognition history (profileCompletionEvents) persists as
 *  "completed under version X" — badge rows hold field names, never answers. */
export const detachAttribute = mutation({
  args: { attributeType: v.string() },
  returns: v.object({ detached: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const now = Date.now();

    await writeAudited(ctx, async (actx) => {
      const rows = await actx.db
        .query("userProfileAttributes")
        .withIndex("by_user_type", (q: any) => q.eq("userId", userId).eq("attributeType", args.attributeType))
        .filter((q: any) => q.eq(q.field("deletedAt"), undefined))
        .collect();
      for (const row of rows) {
        await actx.db.patch(row._id, { deletedAt: now, updatedAt: now });
      }
      // Invalidate dependent inferences for the attribute's class
      const purpose = purposeForField(args.attributeType);
      await erasureCascade(actx, userId, purpose);
      const profile = await profilesRow(actx, userId);
      if (profile && (args.attributeType === "roleArchetype" || args.attributeType === "ageBand" || args.attributeType === "toolsUsed")) {
        await actx.db.patch(profile._id, { [args.attributeType]: undefined, updatedAt: now });
      }
      if (args.attributeType === "bio") {
        await actx.db.patch(userId, { bio: undefined });
      }
      return {
        actorId: userId,
        action: "erasure.detachAttribute",
        target: `userProfileAttributes:${userId}:${args.attributeType}`,
        prev: { attributeType: args.attributeType }, // NON-VALUE-BEARING — never the erased value
        next: { detached: true },
        correlationId: newCorrelationId(),
        reversible: false,
        reasonCode: "member_erasure",
      };
    });
    return { detached: true };
  },
});

/** CAP-150 `completion.recompute` — explicit recompute entry (the writers
 *  also fire it inline; this is the System trigger point). */
export const completionRecompute = mutation({
  args: {},
  returns: v.object({ badges: v.array(v.string()) }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    for (const field of ["roleArchetype", "ageBand", "toolsUsed", "bio", "interests", "socials"]) {
      await recomputeBadges(ctx, userId, field);
    }
    const user = await ctx.db.get(userId);
    return { badges: user?.completionBadges ?? [] };
  },
});

/** CAP-157 `consent.reaccept` — append-only versioned re-acceptance
 *  (the overlay's System side compares last-accepted vs current — reads
 *  expose the comparison; no write until the member acts). */
export const consentReaccept = mutation({
  args: { policyVersion: v.string() },
  returns: v.object({ reaccepted: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await ctx.db.insert("userConsentRecords", {
      userId,
      purpose: "rules_policy_reacceptance",
      policyVersion: args.policyVersion,
      status: "granted",
      collectionSurface: "/settings/profile",
      occurredAt: Date.now(),
    });
    await ctx.db.patch(userId, { rulesAcceptedVersion: args.policyVersion, rulesAcceptedAt: Date.now() });
    return { reaccepted: true };
  },
});

/** CAP-552 `profile.togglePrivacy` — profileVisibility + leaderboardOptOut
 *  (independent toggles, same mutation; users self-preference fields, NOT
 *  consent records — FATAL-M18-02 lives on M18 consent, not here). */
export const togglePrivacy = mutation({
  args: {
    profileVisibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    leaderboardOptOut: v.optional(v.boolean()),
  },
  returns: v.object({ toggled: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const patch: Record<string, unknown> = {};
    if (args.profileVisibility) patch.profileVisibility = args.profileVisibility;
    if (args.leaderboardOptOut !== undefined) patch.leaderboardOptOut = args.leaderboardOptOut;
    await ctx.db.patch(userId, patch);
    return { toggled: true };
  },
});

/** The settings screen state (member-only; null for anonymous). */
export const getSettingsState = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const profile = await profilesRow(ctx, userId);
    const socials = await ctx.db
      .query("userSocialAccounts")
      .withIndex("by_user_platform", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.eq(q.field("deletedAt"), undefined))
      .take(10);
    const consents = await ctx.db
      .query("userConsentRecords")
      .withIndex("by_user_purpose", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(20);
    return {
      roleArchetype: profile?.roleArchetype ?? null,
      ageBand: profile?.ageBand ?? null,
      toolsUsed: profile?.toolsUsed ?? [],
      bio: user.bio ?? "",
      consentFlags: profile?.consentFlags ?? null,
      profileVisibility: user.profileVisibility ?? "public",
      leaderboardOptOut: user.leaderboardOptOut ?? false,
      completionBadges: user.completionBadges ?? [],
      rulesAcceptedVersion: user.rulesAcceptedVersion ?? null,
      currentRulesVersion: CURRENT_RULES_VERSION,
      reacceptanceDue: (user.rulesAcceptedVersion ?? null) !== CURRENT_RULES_VERSION,
      socials,
      consents,
    };
  },
});
