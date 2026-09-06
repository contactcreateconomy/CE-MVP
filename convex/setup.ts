/**
 * setup — SLICE-P5-05: M7 basic profile (CAP-142/144/148) + the
 * interestTaxonomy derivation rows for the P1-08 seeder.
 *
 * Gate logic (CONTRACT-5-setup §1, confirmed from the rows): /setup gates
 *   the POST path (CAP-140) only — commenting is unlocked by M1
 *   verification (CAP-141, "no profile gate"). The six-item required set
 *   (CAP-142): verified member (precondition) · display name (auto-filled,
 *   editable — auto-fill source is contract OQ1, best-effort email
 *   local-part → users.displayName fallback) · avatar (default provided —
 *   no upload step) · ≥1 interest tap · accept rules · age/COPPA confirm.
 * Consent defaults (CAP-148): interests ON · demographics OFF ·
 *   behavioral ON · public ON — each grant appends userConsentRecords.
 *
 * CAP-551 mobile OTP is NOT here: DECISIONS-LOCKED #1 wires it to Twilio
 *   Verify, buildable when TWILIO_* env lands (gate G6). The
 *   users.mobileVerified read path exists; no OTP writer is invented.
 *
 * Fences flagged, not silent: already-complete-member redirect (contract
 *   OQ5) — this surface returns state, the client routes; max interest
 *   count (OQ6) — unbounded, register-silent; last-direct-interest removal
 *   does NOT re-lock posting (OQ7 unstated → no invented re-lock).
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/* ── interestTaxonomy derivation (bible l.64: "derived from the post-type
 * / M5 registry so interests & post types share a taxonomy") ──
 * Tiles = the 8 ACTIVE post types (postTypeConfig registry) + the 5 locked
 * DEC-C01 topic categories — both registry-backed sources; the founder can
 * curate later via CAP-389 admin-disable (isActive flip, Phase 7).
 * taxonomyVersion 1. Seeded idempotently by seed.bootstrap (tags by slug,
 * then interestTaxonomy by tagId). */
export const INTEREST_TILE_DEFS = [
  // post-type interests (source: postTypeConfig active set)
  { slug: "interest-reviews", name: "Reviews", category: "post-types" },
  { slug: "interest-comparisons", name: "Comparisons", category: "post-types" },
  { slug: "interest-help", name: "Help & Q&A", category: "post-types" },
  { slug: "interest-sparks", name: "Sparks", category: "post-types" },
  { slug: "interest-debates", name: "Debates", category: "post-types" },
  { slug: "interest-lists", name: "Lists", category: "post-types" },
  { slug: "interest-showcases", name: "Showcases", category: "post-types" },
  { slug: "interest-news", name: "News", category: "post-types" },
  // topic interests (source: DEC-C01 locked category taxonomy)
  { slug: "interest-ai-technology", name: "AI & Technology", category: "topics" },
  { slug: "interest-creator-business", name: "Creator Business", category: "topics" },
  { slug: "interest-internet-culture", name: "Internet Culture", category: "topics" },
  { slug: "interest-digital-products", name: "Digital Products", category: "topics" },
  { slug: "interest-future-of-work", name: "Future of Work", category: "topics" },
] as const;

export const INTEREST_TAXONOMY_VERSION = 1;

/** The four per-field consent purposes (CAP-148; renamed Wave 7A-E2 —
 *  profile consent, distinct from M18's platform-wide CMP). */
export const CONSENT_PURPOSES = [
  "interestsPersonalization",
  "demographicsPersonalization",
  "behavioralInference",
  "publicProfileVisibility",
] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const DEFAULT_CONSENT_FLAGS: Record<ConsentPurpose, boolean> = {
  interestsPersonalization: true, // ON
  demographicsPersonalization: false, // OFF
  behavioralInference: true, // ON
  publicProfileVisibility: true, // ON
};

/** CAP-148 default posture for a purpose (granted vs not offered). */
export function defaultConsentGranted(purpose: ConsentPurpose): boolean {
  return DEFAULT_CONSENT_FLAGS[purpose];
}

async function requireVerifiedMember(ctx: any): Promise<{ userId: Id<"users">; user: any }> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("setup: authentication required");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("setup: user not found");
  // Verified precondition (CAP-140's M1 half): email verified + active +
  // not-restricted. Mobile is CAP-551 (Twilio-fenced) — NOT checked here;
  // the comment path (CAP-141) owns that gate in P5-02.
  if (!user.emailVerified) throw new Error("setup: email verification required (CAP-140)");
  if (user.accountStatus === "deleted") throw new Error("setup: account deleted");
  if (
    user.accountStanding === "restricted" ||
    user.accountStanding === "suspended" ||
    user.accountStanding === "terminated"
  ) {
    throw new Error("setup: account not in good standing (CAP-140)");
  }
  return { userId, user };
}

async function profilesRow(ctx: any, userId: Id<"users">): Promise<any | null> {
  return await ctx.db.query("profiles").withIndex("by_user", (q: any) => q.eq("userId", userId)).unique();
}

/**
 * CAP-142 `profile.upsertBasic` — the composite six-item write. One
 * transaction: profiles upsert + direct userInterests replace (tap order
 * preserved) + consent records ×4 + completion event + eligibility
 * transition + the two users stamps (rules/age versions).
 */
export const upsertBasic = mutation({
  args: {
    displayName: v.string(),
    interestTagIds: v.array(v.id("tags")), // tap order = firstTapOrder
    rulesVersion: v.string(),
    legalAgeVersion: v.string(),
    consentFlags: v.object({
      interestsPersonalization: v.boolean(),
      demographicsPersonalization: v.boolean(),
      behavioralInference: v.boolean(),
      publicProfileVisibility: v.boolean(),
    }),
  },
  returns: v.object({ basicProfileComplete: v.boolean(), postingEligibilityState: v.string() }),
  handler: async (ctx, args) => {
    const { userId, user } = await requireVerifiedMember(ctx);
    const name = args.displayName.trim();
    if (name.length === 0 || name.length > 80) throw new Error("setup: displayName required (≤80 chars)");
    // Required-set item 4: ≥1 interest tap (minimum)
    if (args.interestTagIds.length === 0) throw new Error("setup: at least one interest tap is required (CAP-142)");
    if (!args.rulesVersion || !args.legalAgeVersion) {
      throw new Error("setup: rules + age/COPPA acceptance versions required (CAP-142)");
    }

    const now = Date.now();
    const prevProfile = await profilesRow(ctx, userId);
    const completionVersion = (prevProfile?.completionVersion ?? 0) + 1;
    const profileVersion = (prevProfile?.profileVersion ?? 0) + 1;

    // 1. profiles upsert (firstTapOrder = this submission's tap order on
    //    first completion; after that the ORDER cannot be backfilled —
    //    later selects append via interests.select, never rewrite).
    if (prevProfile) {
      await ctx.db.patch(prevProfile._id, {
        consentFlags: args.consentFlags,
        completionVersion,
        profileVersion,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("profiles", {
        userId,
        toolsUsed: [],
        firstTapOrder: args.interestTagIds,
        consentFlags: args.consentFlags,
        completionVersion,
        profileVersion: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. userInterests — direct set replace (select taps overwrite the
    //    direct set; inferred rows untouched — source separation, l.60)
    const existing = await ctx.db
      .query("userInterests")
      .withIndex("by_user_source", (q: any) => q.eq("userId", userId).eq("source", "direct"))
      .collect();
    const existingByTag = new Map(existing.map((r: any) => [r.tagId, r]));
    for (const tagId of args.interestTagIds) {
      const row = existingByTag.get(tagId);
      if (row) {
        await ctx.db.patch(row._id, { status: "active", removedAt: undefined, lastObservedAt: now, confirmedAt: row.confirmedAt ?? now });
        existingByTag.delete(tagId);
      } else {
        await ctx.db.insert("userInterests", {
          userId,
          tagId,
          source: "direct",
          affinityScore: 1, // server-set baseline for a direct tap (never client-supplied)
          status: "active",
          firstObservedAt: now,
          lastObservedAt: now,
          confirmedAt: now,
        });
      }
    }
    // deselected direct rows: removed (re-selectable per contract §3 C)
    for (const row of existingByTag.values()) {
      await ctx.db.patch(row._id, { status: "removed", removedAt: now, lastObservedAt: now });
    }

    // 3. CAP-148 — each grant appends an append-only consent record
    for (const purpose of CONSENT_PURPOSES) {
      await ctx.db.insert("userConsentRecords", {
        userId,
        purpose,
        policyVersion: `setup:${args.rulesVersion}`,
        status: args.consentFlags[purpose] ? "granted" : "not_granted",
        collectionSurface: "/setup",
        occurredAt: now,
      });
    }

    // 4. Append-only Recognition + eligibility trails
    await ctx.db.insert("profileCompletionEvents", {
      userId,
      completionVersion,
      badgeField: "basic_profile",
      awarded: true,
      occurredAt: now,
    });
    const previousState = user.postingEligibilityState ?? "not_verified";
    await ctx.db.insert("postingEligibilityEvents", {
      userId,
      previousState,
      nextState: "eligible",
      reasonCode: "basic_profile_completed",
      triggerType: "member",
      occurredAt: now,
    });

    // 5. users stamps (CAP-142 Writes list)
    await ctx.db.patch(userId, {
      displayName: name,
      rulesAcceptedVersion: args.rulesVersion,
      rulesAcceptedAt: now,
      legalAgeAssertedVersion: args.legalAgeVersion,
      legalAgeAssertedAt: now,
      basicProfileComplete: true,
      postingEligibilityState: "eligible",
      profileVersion: (user.profileVersion ?? 0) + 1,
    });

    return { basicProfileComplete: true, postingEligibilityState: "eligible" };
  },
});

/**
 * CAP-144 `interests.select` — add one direct interest (post-setup path;
 * the initial set arrives via upsertBasic). Gates on CAP-142: the basic
 * profile must be complete. firstTapOrder APPENDS (salience order cannot
 * be backfilled or rewritten).
 */
export const interestsSelect = mutation({
  args: { tagId: v.id("tags") },
  returns: v.object({ selected: v.boolean() }),
  handler: async (ctx, args) => {
    const { userId } = await requireVerifiedMember(ctx);
    const user = await ctx.db.get(userId);
    if (!user?.basicProfileComplete) throw new Error("interests.select: basic profile required first (CAP-142 gate)");

    const tile = await ctx.db
      .query("interestTaxonomy")
      .withIndex("by_tagId", (q: any) => q.eq("tagId", args.tagId))
      .unique();
    if (!tile || !tile.isActive) throw new Error("interests.select: not an active interest tile");

    const now = Date.now();
    const existing = await ctx.db
      .query("userInterests")
      .withIndex("by_user_tag", (q: any) => q.eq("userId", userId).eq("tagId", args.tagId))
      .unique();
    if (existing && existing.status === "active") return { selected: true }; // idempotent

    const hadActiveDirect = existing !== null;
    if (existing) {
      await ctx.db.patch(existing._id, { status: "active", removedAt: undefined, lastObservedAt: now, confirmedAt: existing.confirmedAt ?? now });
    } else {
      await ctx.db.insert("userInterests", {
        userId,
        tagId: args.tagId,
        source: "direct",
        affinityScore: 1,
        status: "active",
        firstObservedAt: now,
        lastObservedAt: now,
        confirmedAt: now,
      });
    }

    const profile = await profilesRow(ctx, userId);
    if (profile && !hadActiveDirect && !profile.firstTapOrder.includes(args.tagId)) {
      await ctx.db.patch(profile._id, {
        firstTapOrder: [...profile.firstTapOrder, args.tagId], // append — never rewrite
        profileVersion: profile.profileVersion + 1,
        updatedAt: now,
      });
    }
    return { selected: true };
  },
});

/**
 * CAP-144 `interests.remove` — mark the direct row removed (re-selectable).
 * Fence (contract OQ7): removing the last direct interest does NOT re-lock
 * posting — re-lock behavior is unstated; nothing invented.
 */
export const interestsRemove = mutation({
  args: { tagId: v.id("tags") },
  returns: v.object({ removed: v.boolean() }),
  handler: async (ctx, args) => {
    const { userId } = await requireVerifiedMember(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("userInterests")
      .withIndex("by_user_tag", (q: any) => q.eq("userId", userId).eq("tagId", args.tagId))
      .unique();
    if (!existing || existing.status !== "active") return { removed: false };
    await ctx.db.patch(existing._id, { status: "removed", removedAt: now, lastObservedAt: now });
    return { removed: true };
  },
});

/**
 * CAP-148 `profile.consentRecord` — per-field profile consent append +
 * flag flip. (Distinct from M18 CMP names per the Wave 7A-E2 rename.)
 * The withdrawal CASCADE (CAP-151) is P5-06's — this only records.
 */
export const consentRecord = mutation({
  args: {
    purpose: v.union(
      v.literal("interestsPersonalization"),
      v.literal("demographicsPersonalization"),
      v.literal("behavioralInference"),
      v.literal("publicProfileVisibility"),
    ),
    status: v.union(v.literal("granted"), v.literal("withdrawn"), v.literal("not_granted")),
    policyVersion: v.string(),
    collectionSurface: v.string(),
  },
  returns: v.object({ recorded: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("profile.consentRecord: authentication required");
    const now = Date.now();
    await ctx.db.insert("userConsentRecords", {
      userId,
      purpose: args.purpose,
      policyVersion: args.policyVersion,
      status: args.status,
      collectionSurface: args.collectionSurface,
      occurredAt: now,
      withdrawnAt: args.status === "withdrawn" ? now : undefined,
    });
    const profile = await profilesRow(ctx, userId);
    if (profile) {
      const flags = { ...profile.consentFlags };
      flags[args.purpose as ConsentPurpose] = args.status === "granted";
      await ctx.db.patch(profile._id, { consentFlags: flags, profileVersion: profile.profileVersion + 1, updatedAt: now });
    }
    return { recorded: true };
  },
});

/** The /setup screen state (member view; null for anonymous callers). */
export const getSetupState = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const profile = await profilesRow(ctx, userId);
    const direct = await ctx.db
      .query("userInterests")
      .withIndex("by_user_source", (q: any) => q.eq("userId", userId).eq("source", "direct"))
      .collect();
    return {
      displayName: user.displayName ?? user.email?.split("@")[0] ?? "", // auto-fill (OQ1 best-effort)
      basicProfileComplete: user.basicProfileComplete ?? false,
      postingEligibilityState: user.postingEligibilityState ?? "not_verified",
      rulesAcceptedVersion: user.rulesAcceptedVersion ?? null,
      legalAgeAssertedVersion: user.legalAgeAssertedVersion ?? null,
      selectedInterestTagIds: direct.filter((r: any) => r.status === "active").map((r: any) => r.tagId),
      consentFlags: profile?.consentFlags ?? DEFAULT_CONSENT_FLAGS,
      mobileVerified: user.mobileVerified ?? false,
    };
  },
});

/** CAP-142/144 tile source — active interestTaxonomy rows for the picker. */
export const listInterestTiles = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const tiles = await ctx.db
      .query("interestTaxonomy")
      .withIndex("by_active_category", (q: any) => q.eq("isActive", true))
      .collect();
    // deterministic order: category then label
    return tiles.sort((a: any, b: any) =>
      a.category === b.category ? a.label.localeCompare(b.label) : a.category.localeCompare(b.category),
    );
  },
});
