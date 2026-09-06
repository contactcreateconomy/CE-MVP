import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Shared validator fields for all rich thread payload variants. Deeply nested
 *  structures (comments, insightRail, categoryBody) remain `v.any()` since they
 *  vary widely and are only written by seed scripts. */
const richThreadBase = {
  id: v.string(),
  slug: v.string(),
  title: v.string(),
  body: v.string(),
  authorId: v.string(),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
  views: v.number(),
  upvotes: v.number(),
  bookmarks: v.number(),
  tags: v.array(v.string()),
  aiSummary: v.string(),
  comments: v.array(v.any()),
  insightRail: v.any(),
  relatedSlugs: v.array(v.string()),
  trendingSlugs: v.array(v.string()),
  categoryBody: v.any(),
};

const appId = v.union(
  v.literal("forum"),
  v.literal("seller"),
  v.literal("admin"),
  v.literal("marketplace"),
);

export default defineSchema({
  ...authTables,
  // Extends Convex Auth `users` — must keep auth fields + email/phone indexes.
  //
  // ── CANONICAL IDENTITY REGION (SLICE-P1-01a + P1-01b, 2026-09-04) ──
  // Field union per `_data-model.md` l.315 (bible l.42/l.50/l.245/l.264/l.273
  // union). All canonical fields are schema-OPTIONAL during the legacy
  // coexistence window (00-TRANSITION.md): the live password/OAuth path still
  // inserts bare users; the P2-01 admission cutover makes writers canonical,
  // and tightening to bible-required is a cleanup-slice step.
  users: defineTable({
    // Convex Auth fields (legacy + reference)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    handle: v.optional(v.string()), // legacy forum handle; canonical is username/usernameNormalized
    defaultApp: v.optional(appId),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    // P1-01a — M1 core (_data-model.md l.315, first segment)
    tokenIdentifier: v.optional(v.string()), // Convex Auth subject — canonical-required post-cutover
    emailVerified: v.optional(v.boolean()),
    mobileVerified: v.optional(v.boolean()),
    mobileVerifiedAt: v.optional(v.number()),
    accountStatus: v.optional(v.union(v.literal("active"), v.literal("deleted"))),
    accountStanding: v.optional(
      v.union(
        v.literal("good"),
        v.literal("warned"),
        v.literal("restricted"),
        v.literal("suspended"),
        v.literal("terminated"),
      ),
    ),
    trustTier: v.optional(v.union(v.literal("t1"), v.literal("t2"), v.literal("t3"))),
    isStaff: v.optional(v.boolean()),
    analyticsSubjectId: v.optional(v.string()), // crypto-random opaque unique
    bootstrapState: v.optional(v.union(v.literal("pending_context"), v.literal("complete"))),
    leaderboardOptOut: v.optional(v.boolean()),
    postingEligibilityState: v.optional(
      v.union(
        v.literal("not_verified"),
        v.literal("basic_incomplete"),
        v.literal("eligible"),
        v.literal("rate_limited"),
        v.literal("temporarily_restricted"),
        v.literal("suspended"),
        v.literal("deleted"),
      ),
    ),
    profileVisibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    timezone: v.optional(v.string()), // IANA, write-once; Admin+audit correction only
    username: v.optional(v.string()),
    usernameNormalized: v.optional(v.string()),
    // P1-01b (a) — root-profile remainder (bible l.42)
    displayName: v.optional(v.string()),
    avatarAssetId: v.optional(v.string()),
    bio: v.optional(v.string()),
    postCount: v.optional(v.number()),
    approvedCommentCount: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
    suspendedAt: v.optional(v.number()),
    suspendedReason: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    // P1-01b (b) — M7 eligibility block (bible l.42 tail)
    basicProfileComplete: v.optional(v.boolean()),
    rulesAcceptedVersion: v.optional(v.string()),
    rulesAcceptedAt: v.optional(v.number()),
    legalAgeAssertedVersion: v.optional(v.string()),
    legalAgeAssertedAt: v.optional(v.number()),
    profileVersion: v.optional(v.number()),
    completionBadges: v.optional(v.array(v.string())),
    // P1-01b (c) — M13 standing tail (bible l.245)
    standingExpiresAt: v.optional(v.number()),
    // Retype to v.id("moderationCases") when SLICE-P1-03 lands the table
    // (forward table references are not definable in the same schema pass).
    // → P1-03 LANDED 2026-09-04; retyped:
    standingSetByCaseId: v.optional(v.id("moderationCases")),
    // P1-01b (d) — M14 block (bible l.50, literals from Core-enums l.405/406)
    onboardingState: v.optional(
      v.union(
        v.literal("new"),
        v.literal("basic_profile_complete"),
        v.literal("exploring"),
        v.literal("activated"),
        v.literal("engaged"),
        v.literal("retained"),
        v.literal("coach_dismissed"),
        v.literal("expired"),
      ),
    ),
    firstValueAt: v.optional(v.number()),
    activatedAt: v.optional(v.number()),
    engagedAt: v.optional(v.number()),
    retainedAt: v.optional(v.number()),
    activationQuality: v.optional(
      v.union(v.literal("standard"), v.literal("unverified_fast"), v.literal("staff_excluded")),
    ),
    activationDefinitionVersion: v.optional(v.string()),
    ladderCompleteAt: v.optional(v.number()),
    lastVisitAt: v.optional(v.number()),
    currentSessionStartedAt: v.optional(v.number()),
    lastQuotaExhaustedPeriodKey: v.optional(v.string()), // lazy quota_restored
    coachCardsShownCount: v.optional(v.number()),
    checklistStepsShownMax: v.optional(v.number()),
    coachDismissed: v.optional(
      v.array(
        v.union(
          v.literal("discover_resource"),
          v.literal("acquire_resource"),
          v.literal("join_discussion"),
          v.literal("return_update"),
        ),
      ),
    ),
    coachDismissedAt: v.optional(v.number()),
    onboardingExpiredAt: v.optional(v.number()),
    // DECISIONS-LOCKED #3 — the 7 bits (schema stores booleans only; CAP-368:
    // UI shows ≤3 next actions, never a % complete — no percentage field)
    activationProgress: v.optional(
      v.object({
        emailVerified: v.boolean(),
        mobileVerified: v.boolean(),
        profileComplete: v.boolean(),
        firstPostPublished: v.boolean(),
        firstCommentPosted: v.boolean(),
        firstReactionGiven: v.boolean(),
        firstFollowMade: v.boolean(),
      }),
    ),
    newsletterConsentStatus: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_handle", ["handle"])
    // Canonical identity indexes (bible l.315)
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_analyticsSubjectId", ["analyticsSubjectId"])
    .index("by_usernameNormalized", ["usernameNormalized"]),

  /** P1-01a — sensitive split (bible l.43): mobileNumber (F-27, CAP-551 write)
   *  + future billing/PII. Never in the public/root profile; erasure applies.
   *  One row per user (uniqueness enforced by the admission writer). */
  privateUserData: defineTable({
    userId: v.id("users"),
    mobileNumber: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  /** P1-01a — canonical authority store (bible l.44). Role literals verbatim
   *  from the bible (camelCase). Default signup assignment per MUST-DEFINE:
   *  {role: member, scopeType: global, scopeId: null, status: active} — the
   *  P2-01 admission writer enforces it; v1 is global-scope only. Replaces
   *  ADMIN_EMAILS/memberships authority at the P2/P3 cutover (00-TRANSITION). */
  roleAssignments: defineTable({
    userId: v.id("users"),
    role: v.union(
      v.literal("member"),
      v.literal("editor"),
      v.literal("publisher"),
      v.literal("moderator"),
      v.literal("storeOperator"),
      v.literal("supportOperator"),
      v.literal("administrator"),
    ),
    scopeType: v.union(v.literal("global")), // v1: global only (bible l.44)
    scopeId: v.optional(v.string()), // null for global scope
    grantedByUserId: v.optional(v.id("users")), // absent for System/default assignment
    status: v.union(v.literal("active"), v.literal("revoked")),
    grantedAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_role_status", ["userId", "role", "status"])
    .index("by_role_status", ["role", "status"]),
  memberships: defineTable({
    userId: v.id("users"),
    app: appId,
    role: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_app", ["app"])
    .index("by_app_role", ["app", "role"]),

  /** P1-06 — bible l.248. Append-only: "never deletable — incl. by erasure".
   *  No update/delete path exists in the helper (convex/lib/audit.ts) or the
   *  mutation surface. Erased personal values must never appear in `prev`
   *  (helper-documented caller contract, bible l.68). */
  auditLog: defineTable({
    actorId: v.optional(v.string()), // absent = System writer (cron/seeder)
    role: v.optional(v.string()),
    action: v.string(),
    target: v.string(),
    prev: v.optional(v.any()),
    next: v.optional(v.any()),
    reasonCode: v.optional(v.string()),
    correlationId: v.string(),
    reversible: v.optional(v.boolean()),
    justification: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_correlationId", ["correlationId"])
    .index("by_target_createdAt", ["target", "createdAt"])
    .index("by_action_createdAt", ["action", "createdAt"]),

  /** P1-05 — bible l.250. Live values; sealed M12 gaming keys are NOT stored
   *  here (sealed-by-absence per CAP-394). */
  systemConfig: defineTable({
    key: v.string(),
    value: v.any(), // validated against configKeyRegistry.valueType at the mutation layer
    valueType: v.union(v.literal("boolean"), v.literal("number"), v.literal("string"), v.literal("json")),
    scope: v.string(), // v1: "global"
    status: v.union(v.literal("active"), v.literal("inactive")),
    version: v.optional(v.number()), // CAS token — present on every casUpdate-written row
    updatedByUserId: v.optional(v.id("users")), // absent = System writer
    updatedAt: v.number(),
    reason: v.optional(v.string()),
  })
    .index("by_key", ["key"])
    .index("by_scope", ["scope"]),

  /** P1-05 — bible l.256 + M15 §74. The platform-wide single validation
   *  mechanism (Wave-3 E1): bounds/type/enum enforced on read+write via
   *  convex/config.ts. Keys immutable. failDirection literals per admin-config
   *  contract States D: closed | open_forbidden | degrade | n_a. */
  configKeyRegistry: defineTable({
    key: v.string(), // immutable
    module: v.string(), // e.g. "m1", "m11", "m13"
    valueType: v.union(v.literal("boolean"), v.literal("number"), v.literal("string"), v.literal("json")),
    default: v.any(),
    min: v.optional(v.number()),
    max: v.optional(v.number()),
    enumValues: v.optional(v.array(v.string())),
    editTier: v.union(v.literal("tier1"), v.literal("tier2"), v.literal("tier3")),
    blastRadius: v.string(), // ≤140 chars (M15 §74) — mandatory on every non-sealed write
    failDirection: v.optional(
      v.union(v.literal("closed"), v.literal("open_forbidden"), v.literal("degrade"), v.literal("n_a")),
    ),
    effectiveTiming: v.union(v.literal("immediate"), v.literal("next_request"), v.literal("deploy")),
    reversible: v.boolean(),
    sealed: v.boolean(), // true = not editable in Admin (CAP-394)
  }).index("by_key", ["key"]),

  forumProfiles: defineTable({
    userId: v.optional(v.id("users")),
    /** Stable seed key e.g. u1 — used only when remapping thread payloads */
    seedKey: v.optional(v.string()),
    handle: v.string(),
    name: v.string(),
    image: v.string(),
    bio: v.string(),
    level: v.number(),
    points: v.number(),
    streakDays: v.number(),
    verified: v.optional(v.boolean()),
    /** Legacy-only: AI-persona flag on pre-copy demo rows in the shared
     *  deployment; not written by this codebase. Tolerated so the schema
     *  push validates against existing data (forum* tables are transitional
     *  per 00-TRANSITION and are dropped in SLICE-P7-CLEANUP). */
    managedByAutomation: v.optional(v.boolean()),
    role: v.union(v.literal("member"), v.literal("moderator"), v.literal("admin")),
  })
    .index("by_handle", ["handle"])
    .index("by_user", ["userId"])
    .index("by_seed_key", ["seedKey"])
    .searchIndex("search_name", { searchField: "name" }),

  forumCategories: defineTable({
    key: v.string(),
    name: v.string(),
    icon: v.string(),
    description: v.string(),
    primaryColor: v.string(),
    lockedByDefault: v.boolean(),
    pointsToUnlock: v.optional(v.number()),
  }).index("by_key", ["key"]),

  forumPosts: defineTable({
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    body: v.string(),
    coverImage: v.optional(v.string()),
    category: v.string(),
    authorProfileId: v.id("forumProfiles"),
    /** Denormalized for feed cards — avoids loading all profiles. */
    authorName: v.optional(v.string()),
    authorHandle: v.optional(v.string()),
    authorImage: v.optional(v.string()),
    upvotes: v.number(),
    commentsCount: v.number(),
    views: v.number(),
    createdAt: v.number(),
    trending: v.union(v.literal("hot"), v.literal("recent"), v.literal("evergreen")),
    locked: v.boolean(),
    isRichThread: v.boolean(),
    /** Matches old mock id (p1, …) for hero carousel join */
    legacyKey: v.optional(v.string()),
    moderationStatus: v.optional(v.union(
      v.literal("visible"),
      v.literal("flagged"),
      v.literal("removed"),
      v.literal("shadow_removed"),
    )),
    /** Denormalized searchable tags from category payloads (e.g. gigs skills, review product names). */
    searchTags: v.optional(v.array(v.string())),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_author", ["authorProfileId"])
    .index("by_legacy_key", ["legacyKey"])
    .index("by_createdAt", ["createdAt"])
    .index("by_category_createdAt", ["category", "createdAt"])
    .searchIndex("search_title", { searchField: "title", filterFields: ["category"] })
    .searchIndex("search_body", { searchField: "body", filterFields: ["category"] }),

  /** Rich threads written only by seed scripts — payload shape validated by discriminated union on `category`. */
  forumRichThreads: defineTable({
    slug: v.string(),
    payload: v.union(
      v.object({ ...richThreadBase, category: v.literal("news") }),
      v.object({ ...richThreadBase, category: v.literal("review") }),
      v.object({ ...richThreadBase, category: v.literal("compare") }),
      v.object({ ...richThreadBase, category: v.literal("launch-pad") }),
      v.object({ ...richThreadBase, category: v.literal("debate") }),
      // Temporary widen for the help -> qa migration. Remove after all old rows are migrated.
      v.object({ ...richThreadBase, category: v.literal("help") }),
      v.object({ ...richThreadBase, category: v.literal("qa") }),
      v.object({ ...richThreadBase, category: v.literal("list") }),
      v.object({ ...richThreadBase, category: v.literal("showcase") }),
      v.object({ ...richThreadBase, category: v.literal("gigs") }),
    ),
  }).index("by_slug", ["slug"]),

  forumPostComments: defineTable({
    postId: v.id("forumPosts"),
    authorProfileId: v.id("forumProfiles"),
    body: v.string(),
    createdAt: v.number(),
    upvotes: v.number(),
    parentId: v.optional(v.id("forumPostComments")),
  })
    .index("by_post", ["postId"])
    .index("by_post_createdAt", ["postId", "createdAt"])
    .index("by_parent", ["parentId"]),

  forumFavorites: defineTable({
    userId: v.id("users"),
    postId: v.id("forumPosts"),
    /** For paginated saved feed; set on insert. */
    favoritedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_post", ["userId", "postId"])
    .index("by_user_favoritedAt", ["userId", "favoritedAt"]),

  forumUpvotes: defineTable({
    userId: v.id("users"),
    postId: v.id("forumPosts"),
  })
    .index("by_user", ["userId"])
    .index("by_user_post", ["userId", "postId"]),

  forumCampaigns: defineTable({
    title: v.string(),
    description: v.string(),
    rewardPoints: v.number(),
    endsAt: v.string(),
    participants: v.number(),
  }).index("by_endsAt", ["endsAt"]),

  forumLeaderboard: defineTable({
    rank: v.number(),
    profileId: v.id("forumProfiles"),
    points: v.number(),
    weeklyDelta: v.number(),
  }).index("by_rank", ["rank"]),

  forumNotifications: defineTable({
    profileId: v.id("forumProfiles"),
    type: v.union(v.literal("comment"), v.literal("upvote"), v.literal("follow"), v.literal("system")),
    title: v.string(),
    message: v.string(),
    createdAt: v.string(),
    read: v.boolean(),
    postSlug: v.optional(v.string()),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_createdAt", ["profileId", "createdAt"]),

  forumVibingItems: defineTable({
    kind: v.union(
      v.literal("campaign"),
      v.literal("post"),
      v.literal("discussion"),
      v.literal("update"),
      v.literal("creator"),
    ),
    label: v.string(),
    href: v.string(),
    engagedUsers: v.number(),
    sortOrder: v.number(),
  }).index("by_sort", ["sortOrder"]),

  forumUserSettings: defineTable({
    userId: v.id("users"),
    theme: v.union(v.literal("dark"), v.literal("light"), v.literal("system")),
    emailNotifications: v.boolean(),
    pushNotifications: v.boolean(),
    hideMatureContent: v.boolean(),
  }).index("by_user", ["userId"]),

  forumHeroSlides: defineTable({
    legacyPostKey: v.string(),
    shares: v.number(),
    eyebrow: v.string(),
    ctaLabel: v.string(),
    accentRgb: v.string(),
    sortOrder: v.number(),
  }).index("by_sort", ["sortOrder"]),

  forumWriteBuckets: defineTable({
    userId: v.id("users"),
    kind: v.union(
      v.literal("createPost"),
      v.literal("createComment"),
      v.literal("toggleUpvote"),
      v.literal("toggleFavorite"),
      v.literal("createReport"),
    ),
    count: v.number(),
    windowStartMs: v.number(),
  }).index("by_user_kind", ["userId", "kind"]),

  forumFeedCache: defineTable({
    cacheKey: v.string(),
    postIds: v.array(v.string()),
    computedAt: v.number(),
  }).index("by_key", ["cacheKey"]),

  forumReports: defineTable({
    reporterId: v.id("forumProfiles"),
    contentType: v.union(v.literal("post"), v.literal("comment")),
    contentId: v.string(),
    reason: v.union(
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("misinformation"),
      v.literal("off_topic"),
      v.literal("other"),
    ),
    details: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed")),
    createdAt: v.number(),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_content", ["contentType", "contentId"])
    .index("by_status_createdAt", ["status", "createdAt"]),

  forumModActions: defineTable({
    moderatorId: v.id("forumProfiles"),
    action: v.union(
      v.literal("remove_post"),
      v.literal("restore_post"),
      v.literal("remove_comment"),
      v.literal("flag_post"),
      v.literal("dismiss_report"),
    ),
    contentId: v.string(),
    reason: v.string(),
    createdAt: v.number(),
  })
    .index("by_moderator", ["moderatorId"])
    .index("by_content", ["contentId"]),

  /** Per-category structured payloads for real user posts. */
  forumCategoryPayloads: defineTable({
    postId: v.id("forumPosts"),
    category: v.string(),
    payload: v.union(
      // Gigs payload
      v.object({
        roleTitle: v.string(),
        employment: v.string(),
        location: v.string(),
        budget: v.optional(v.string()),
        duration: v.optional(v.string()),
        requiredSkills: v.array(v.string()),
        preferredSkills: v.optional(v.array(v.string())),
        posterNote: v.optional(v.string()),
        isOpen: v.optional(v.boolean()),
        applicantCount: v.optional(v.number()),
        processStage: v.optional(v.string()),
        stages: v.optional(v.array(v.string())),
      }),
      // Review payload
      v.object({
        productName: v.string(),
        productUrl: v.optional(v.string()),
        verdict: v.string(),
        starRating: v.number(),
        reviewerContextNote: v.optional(v.string()),
        verdictRationale: v.optional(v.string()),
        criteria: v.optional(v.array(v.object({
          id: v.string(),
          label: v.string(),
          score: v.number(),
          maxScore: v.number(),
          weightPercent: v.number(),
        }))),
        reviewerContextMax: v.optional(v.any()),
        sentiment: v.optional(v.any()),
        productLogo: v.optional(v.string()),
      }),
      // Fallback for other categories
      v.any(),
    ),
    version: v.number(),
  }).index("by_post", ["postId"]),

  /** Sharded counters to avoid OCC conflicts on high-churn fields (upvotes, views). */
  forumCounterShards: defineTable({
    entityId: v.string(),
    entityType: v.string(),    // "post"
    counterType: v.string(),   // "upvotes" or "views"
    shardKey: v.number(),      // 0–9 for upvotes, 0–4 for views
    count: v.number(),
  })
    .index("by_entity_counter_shard", ["entityId", "counterType", "shardKey"])
    .index("by_entity_counter", ["entityId", "counterType"]),

  /** Analytics events for tracking user behavior. */
  forumAnalyticsEvents: defineTable({
    eventType: v.string(),
    profileId: v.optional(v.id("forumProfiles")),
    postId: v.optional(v.id("forumPosts")),
    category: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    sessionId: v.optional(v.string()),
  })
    .index("by_eventType_createdAt", ["eventType", "createdAt"])
    .index("by_post_eventType", ["postId", "eventType"]),

  /** Daily aggregated analytics for admin dashboards. */
  forumDailyStats: defineTable({
    date: v.string(),          // YYYY-MM-DD
    category: v.optional(v.string()),
    eventType: v.string(),
    count: v.number(),
  })
    .index("by_date_category", ["date", "category"])
    .index("by_date_eventType", ["date", "eventType"]),

  /** P1-03 — bible l.238, the moderation spine. policyFamily per
   *  DECISIONS-LOCKED #4; enums per M13 §2. Dedupe invariant INV-2: one open
   *  case per (targetType, targetId, policyFamily) — enforced by the
   *  by_target_policyFamily_status index + writer discipline (Phase 7).
   *  standingSetByCaseId retype: users.standingSetByCaseId is now
   *  v.id("moderationCases") — done in the same change (P1-03 closure). */
  moderationCases: defineTable({
    caseType: v.union(
      v.literal("ugc_safety"), v.literal("ugc_conduct"), v.literal("spam_manipulation"),
      v.literal("account_integrity"), v.literal("store_commercial"), v.literal("merchant_ip"),
      v.literal("source_takedown"), v.literal("dmca"), v.literal("resource_rights"),
      v.literal("appeal"), v.literal("moderator_conduct"), v.literal("hard_harm"), // Founder-only path
    ),
    targetType: v.string(),
    targetId: v.string(),
    policyFamily: v.union(
      v.literal("spam"), v.literal("harassment_abuse"), v.literal("misinformation"),
      v.literal("copyright_ip"), // routes to legal intake
      v.literal("legal_other"), v.literal("quality_guidelines"),
      v.literal("safety_illegal"), // highest severity / fastest SLA
    ),
    severity: v.union(v.literal("s0_critical"), v.literal("s1_high"), v.literal("s2_medium"), v.literal("s3_low")),
    priority: v.number(), // 0–3
    status: v.union(
      v.literal("open"), v.literal("triaged"), v.literal("claimed"),
      v.literal("awaiting_user"), v.literal("awaiting_legal"), v.literal("awaiting_external"),
      v.literal("actioned"), v.literal("resolved_no_action"), v.literal("appealed"),
      v.literal("closed"), v.literal("auto_released_aged"),
    ),
    reasonCode: v.string(),
    policyVersion: v.string(),
    autoReleaseEligible: v.optional(v.boolean()), // C1 — soft allowlist only after completed gate
    preserveUntil: v.optional(v.number()), // C5 — +90d on NCMEC/actual-knowledge
    reporterCountDistinct: v.number(),
    reporterClusterCount: v.number(),
    claimedByUserId: v.optional(v.id("users")),
    leaseExpiresAt: v.optional(v.number()),
    nextReviewAt: v.optional(v.number()),
    userResponseDueAt: v.optional(v.number()),
    agingLevel: v.number(),
    subjectClass: v.optional(v.string()),
    parentCaseId: v.optional(v.id("moderationCases")),
    createdAt: v.number(),
    closedAt: v.optional(v.number()),
  })
    .index("by_target_policyFamily_status", ["targetType", "targetId", "policyFamily", "status"])
    .index("by_claimedBy_leaseExpiresAt", ["claimedByUserId", "leaseExpiresAt"])
    .index("by_status_nextReviewAt", ["status", "nextReviewAt"]),

  /** P1-03 — bible l.241. Absorbs prior thin dmcaNotices / publisher
   *  takedownRequests (never created as separate tables). India: ack+24h /
   *  action+15d. payloadHash / counterNoticeId? / operatorUserId?
   *  transcribed from M13 l.77. */
  legalIntake: defineTable({
    type: v.union(
      v.literal("dmca_notice"), v.literal("dmca_counter_notice"), v.literal("source_takedown"),
      v.literal("merchant_ip"), v.literal("right_of_erasure"), v.literal("grievance_india"),
    ),
    subjectClass: v.union(v.literal("ugc"), v.literal("operator_published"), v.literal("store_listing")),
    caseId: v.optional(v.id("moderationCases")),
    complainantContact: v.any(), // identity fields per DECISIONS-LOCKED #6 (JSON: name/address/email/sig for DMCA; email-only otherwise)
    targetType: v.string(),
    targetId: v.string(),
    payloadHash: v.string(),
    status: v.string(), // {received|acknowledged|reviewing|complied|rejected_invalid|counter_notice} — Phase 7 writer constrains
    ackDueAt: v.optional(v.number()),
    actionDueAt: v.optional(v.number()),
    restoreEligibleAt: v.optional(v.number()),
    strikeId: v.optional(v.string()),
    counterNoticeId: v.optional(v.string()),
    operatorUserId: v.optional(v.id("users")),
    erasureOutcome: v.optional(v.union(v.literal("ERASE_PARTIAL"), v.literal("REFUSED_LEGAL_HOLD"))),
    policyContactSnapshot: v.optional(v.any()), // agent/grievance contacts + policy version at filing
    createdAt: v.number(),
  })
    .index("by_type_status", ["type", "status"])
    .index("by_caseId", ["caseId"])
    .index("by_target", ["targetType", "targetId"]),

  /** Versioned legal/trust content (DECISIONS-LOCKED #9 — E5/E6 closed).
   *  Append-only: rows are never edited or deleted; publish flips the prior
   *  published row to superseded and the target row to published. Rollback =
   *  publish a prior version. Manual publish only — no auto-publish path. */
  contentVersions: defineTable({
    docKey: v.string(),                    // 'terms' | 'privacy' | 'dmca' | 'repeat-infringer' | trust pages
    version: v.number(),                   // 1-based, monotonic per docKey
    title: v.string(),
    bodyMarkdown: v.string(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("superseded")),
    changeNote: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    publishedBy: v.optional(v.id("users")),
    publishedAt: v.optional(v.number()),   // ms epoch — effective when status=published
    createdAt: v.number(),
  })
    .index("by_docKey_status", ["docKey", "status"])
    .index("by_docKey_version", ["docKey", "version"]),

  /** P1-02 — bible l.317. NOT a users row; no role linkage (CAP-014).
   *  Rate hashes live in @convex-dev/rate-limiter only (M1: no dual-write). */
  waitlistEntries: defineTable({
    email: v.string(),
    emailNormalized: v.string(), // unique
    status: v.union(
      v.literal("waiting"), v.literal("invited"), v.literal("converted"),
      v.literal("withdrawn"), v.literal("blocked"),
    ),
    invitedAt: v.optional(v.number()),
    // CAP-030: conversion uses the SAME Auth admission + bootstrap path
    convertedUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_emailNormalized", ["emailNormalized"]),

  /** P1-02 — bible l.53 (F-18). notificationType per Core-enums l.409.
   *  by_user_unread supports CAP-568's recipient-private newest-first read;
   *  by_dedupe supports CAP-382's dedupeKey windows (R-NOTIFY). */
  notifications: defineTable({
    recipientUserId: v.id("users"),
    notificationType: v.union(
      v.literal("comment_reply"), v.literal("post_comment"), v.literal("help_resolution"),
      v.literal("saved_post_activity"), v.literal("resource_released"), v.literal("acquired_resource_updated"),
      v.literal("quota_exhausted"), v.literal("quota_restored"), v.literal("moderation_held"),
      v.literal("moderation_resolved"), v.literal("appeal_resolved"), v.literal("account_restricted"),
      v.literal("distribution_joined"), v.literal("drip_batch"),
      v.literal("trust_tier_changed"), v.literal("signal_level_changed"), v.literal("store_status_changed"),
    ),
    objectType: v.string(),
    objectId: v.string(),
    actorUserIds: v.array(v.id("users")),
    eventCount: v.number(),
    dedupeKey: v.string(),
    status: v.string(), // P0 writer constrains: unread/read etc.
    priority: v.string(),
    batchWindowStartedAt: v.optional(v.number()),
    batchWindowEndsAt: v.optional(v.number()),
    readAt: v.optional(v.number()),
    retractedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_unread", ["recipientUserId", "status", "createdAt"])
    .index("by_dedupe", ["dedupeKey"]),

  /** P1-04 — bible l.300 (from M18 §2 l.69). Source-controlled projection. */
  jobCatalog: defineTable({
    jobKey: v.string(),
    ownerModule: v.string(),
    kind: v.union(
      v.literal("mutation"), v.literal("action"), v.literal("cron_mutation"), v.literal("cron_action"),
      v.literal("projection"), v.literal("probe"), v.literal("cleanup"),
    ),
    internalFunctionKey: v.string(), // allowlist
    executionAuthority: v.union(
      v.literal("system"), v.literal("revalidate_actor"), v.literal("authorized_command"),
    ),
    scheduleKey: v.optional(v.string()),
    timeoutMs: v.number(),
    retryClass: v.union(
      v.literal("none"), v.literal("mutation_native"), v.literal("external_read"),
      v.literal("external_idempotent_write"), v.literal("external_non_idempotent"),
      v.literal("high_cost_generation"), v.literal("manual_only"), // RC-4
    ),
    maxAttempts: v.number(),
    backoffSeconds: v.array(v.number()),
    jitterPct: v.number(), // default 20
    idempotencyScope: v.string(),
    concurrencyKey: v.optional(v.string()),
    importance: v.string(),
    healthFreshnessSeconds: v.number(),
    deadLetterAfterSeconds: v.number(),
    featureFlag: v.optional(v.string()),
    status: v.string(),
    catalogVersion: v.number(),
  }).index("by_jobKey", ["jobKey"]),

  /** P1-04 — bible l.301 (full M18 l.70 list). state includes manual_review
   *  (RC-4); actorUserId is attribution-only, never authorization
   *  (FATAL-M18-04). */
  jobRuns: defineTable({
    jobKey: v.string(),
    catalogVersion: v.number(),
    runKey: v.string(),
    scheduledFor: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    state: v.union(
      v.literal("requested"), v.literal("scheduled"), v.literal("running"), v.literal("succeeded"),
      v.literal("retry_scheduled"), v.literal("dead_lettered"), v.literal("cancelled"),
      v.literal("superseded"), v.literal("manual_review"),
    ),
    attempt: v.number(),
    maxAttempts: v.number(),
    idempotencyKey: v.string(),
    concurrencyKey: v.optional(v.string()),
    sourceObjectType: v.optional(v.string()),
    sourceObjectId: v.optional(v.string()),
    actorUserId: v.optional(v.id("users")), // attribution only — never authorizes
    executionAuthority: v.union(
      v.literal("system"), v.literal("revalidate_actor"), v.literal("authorized_command"),
    ),
    authorityOutcome: v.optional(v.string()),
    commandId: v.optional(v.string()),
    permissionVersionChecked: v.optional(v.string()),
    scheduledFunctionId: v.optional(v.string()),
    lastHeartbeatAt: v.optional(v.number()),
    nextAttemptAt: v.optional(v.number()),
    timeoutAt: v.optional(v.number()),
    resultClass: v.optional(v.string()),
    errorClass: v.optional(v.string()),
    errorFingerprint: v.optional(v.string()),
    errorSummaryRedacted: v.optional(v.string()),
    deadLetterReason: v.optional(v.string()),
    parentRunId: v.optional(v.id("jobRuns")),
    correlationId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_jobKey_scheduledFor", ["jobKey", "scheduledFor"])
    .index("by_state_nextAttemptAt", ["state", "nextAttemptAt"])
    .index("by_idempotencyKey", ["idempotencyKey"])
    .index("by_concurrencyKey_state", ["concurrencyKey", "state"])
    .index("by_timeoutAt_state", ["timeoutAt", "state"])
    .index("by_sourceObject", ["sourceObjectType", "sourceObjectId"])
    .index("by_correlationId", ["correlationId"])
    .index("by_commandId", ["commandId"]),

  /** P1-04 — bible l.301 tail / M18 l.71. Dead-letter path is representable:
   *  jobRunId → jobDeadLetters with redrivenAt?/redrivenByUserId?. */
  jobDeadLetters: defineTable({
    jobRunId: v.id("jobRuns"),
    jobKey: v.string(),
    reason: v.string(),
    createdAt: v.number(),
    redrivenAt: v.optional(v.number()),
    redrivenByUserId: v.optional(v.id("users")),
  })
    .index("by_jobRunId", ["jobRunId"])
    .index("by_jobKey_createdAt", ["jobKey", "createdAt"]),

  /** P1-07 — bible l.121 full envelope. Append-only; same-mutation capture
   *  (CAP-436); isCountableAtWrite stamped once at write (CAP-438). */
  rawEvents: defineTable({
    eventClass: v.union(v.literal("interaction"), v.literal("exposure"), v.literal("outcome"), v.literal("distribution")),
    eventType: v.string(),
    userId: v.optional(v.id("users")),
    anonymousSessionId: v.optional(v.string()), // pre-login join key
    sequenceInSession: v.number(),
    targetType: v.union(v.literal("post"), v.literal("comment"), v.literal("tool"), v.literal("affiliate"), v.literal("user_profile"), v.literal("session")),
    targetId: v.string(),
    authorUserId: v.optional(v.id("users")),
    authorType: v.optional(v.string()),
    reactorAuthorType: v.optional(v.string()),
    postTypeId: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    source: v.union(v.literal("direct"), v.literal("internal_nav"), v.literal("search"), v.literal("social"), v.literal("email"), v.literal("distribution")),
    referrer: v.optional(v.string()), // session-level UTM — the one field that cannot be backfilled
    surface: v.optional(v.string()),
    placement: v.optional(v.string()),
    rankPosition: v.optional(v.number()),
    sortMode: v.optional(v.string()),
    viewMode: v.optional(v.union(v.literal("min"), v.literal("max"))),
    feedSessionId: v.optional(v.string()),
    dwellMs: v.optional(v.number()),
    viewportQualified: v.optional(v.boolean()),
    reactionType: v.optional(v.string()),
    reactionValence: v.optional(v.string()),
    reactionReason: v.optional(v.string()),
    outcomeType: v.optional(v.string()),
    outcomeValue: v.optional(v.number()),
    currency: v.optional(v.string()),
    conversionStatus: v.optional(v.string()),
    integrityStatus: v.optional(v.string()),
    eligibilityReason: v.optional(v.string()),
    suspectedAutomation: v.optional(v.boolean()),
    suspectedCoordination: v.optional(v.boolean()),
    reversedAt: v.optional(v.number()),
    reversalReason: v.optional(v.string()),
    schemaVersion: v.number(),
    reactionDefinitionVersion: v.optional(v.string()),
    outcomeDefinitionVersion: v.optional(v.string()),
    rankingVersion: v.optional(v.string()),
    experimentId: v.optional(v.string()),
    variantId: v.optional(v.string()),
    isAiPersona: v.boolean(),
    isStaff: v.boolean(), // CAP-438: stamped at write
    isPersona: v.boolean(), // CAP-438
    isCountableAtWrite: v.boolean(), // CAP-438: initial only — never rewritten
    trustTierAtEvent: v.optional(v.string()),
    posthogMirror: v.optional(v.boolean()), // CAP-442: committed with event
    analyticsSubjectId: v.optional(v.string()),
    tombstoneState: v.optional(v.string()), // privacy deletion / redaction / identity-detachment
    occurredAt: v.number(),
    receivedAt: v.number(),
  })
    .index("by_session_sequence", ["anonymousSessionId", "sequenceInSession"])
    .index("by_user_time", ["userId", "occurredAt"])
    .index("by_target_eventClass", ["targetType", "targetId", "eventClass"])
    .index("by_eventType_time", ["eventType", "occurredAt"]),

  /** P1-07 — bible l.270. Event names must be registered before capture
   *  (CAP-437: unknown → reject + instrumentation_error). */
  eventCatalog: defineTable({
    eventName: v.string(),
    schemaVersion: v.number(),
    eventClass: v.union(v.literal("interaction"), v.literal("exposure"), v.literal("outcome"), v.literal("distribution")),
    ownerModule: v.string(),
    description: v.string(),
    captureMode: v.string(),
    authoritativeSource: v.optional(v.string()),
    piiClass: v.string(), // mandatory
    consentGate: v.string(),
    l08Stage: v.optional(v.string()),
    commerceFunnel: v.optional(v.string()),
    signalEligible: v.boolean(),
    s18Eligible: v.boolean(),
    excludeStaff: v.boolean(),
    excludePersonas: v.boolean(),
    idempotencyScope: v.string(),
    retentionClass: v.string(),
    posthogMirror: v.boolean(),
    status: v.string(),
    effectiveFrom: v.number(),
    deprecatedAt: v.optional(v.number()),
    replacementEventName: v.optional(v.string()),
    owner: v.string(),
  }).index("by_eventName", ["eventName"]),

  /** P1-08 — bible l.71. DEC-C01's five locked editorial categories. */
  categories: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    seoTitle: v.string(),
    seoDescription: v.string(),
    sortOrder: v.number(),
    status: v.string(), // active etc.
  }).index("by_slug", ["slug"]),

  /** P2-01 — bible l.307 (from M18 §6 l.76). Schema + admission-time read
   *  only; the CAP-509/510 evaluation machine is Phase 7. evidence{} is a
   *  map on the sheet, not an unenumerated enum. */
  launchReadinessResults: defineTable({
    evaluatedAt: v.number(),
    overall: v.union(v.literal("blocked"), v.literal("warning"), v.literal("ready"), v.literal("revoked")),
    blockers: v.array(v.string()),
    warnings: v.array(v.string()),
    evidence: v.optional(v.any()), // map — Phase 7 fills the 8-category predicate set
  }).index("by_evaluatedAt", ["evaluatedAt"]),

  /** P2-01 — bible l.306 (from M18 §6 l.75). */
  deployLog: defineTable({
    gitSha: v.string(),
    convexVersion: v.string(),
    vercelDeploymentId: v.optional(v.string()),
    schemaPhase: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  /** P2-02 — bible l.274. Unique active per anonymousSessionId. */
  identityJoins: defineTable({
    anonymousSessionId: v.string(),
    userId: v.id("users"),
    joinedAt: v.number(),
  }).index("by_anonymousSessionId", ["anonymousSessionId"]),

  /** P2-03 — bible l.243. Empty at Phase 2; M13 writers are Phase 5. */
  capabilityRestrictions: defineTable({
    userId: v.id("users"),
    capabilityKey: v.string(),
    reasonCode: v.string(),
    caseId: v.optional(v.id("moderationCases")),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    appealable: v.boolean(),
  }).index("by_user_capability", ["userId", "capabilityKey"]),

  /** P3-01/P3-03 — bible l.255. Source-controlled executable catalog is
   *  authoritative; this table holds DB metadata only (CAP-390/392).
   *  dataSourceKey is enum→code (no enumerated literals in the corpus —
   *  P3-03 defines literals only for the Phase-3 consoles). */
  adminWidgets: defineTable({
    widgetKey: v.string(),
    moduleId: v.string(),
    widgetType: v.string(),
    title: v.string(),
    routeKey: v.string(),
    requiredPermissionKeys: v.array(v.string()),
    featureFlagKey: v.optional(v.string()),
    status: v.string(), // active | hidden | unregistered
    homeEligible: v.boolean(),
    defaultOrder: v.number(),
    wikiSlug: v.optional(v.string()),
    freshnessThresholdSeconds: v.number(),
    dataSourceKey: v.string(), // enum → code
    updatedAt: v.number(),
  })
    .index("by_routeKey", ["routeKey"])
    .index("by_widgetKey", ["widgetKey"])
    .index("by_status_defaultOrder", ["status", "defaultOrder"]),

  /** P3-10 — bible l.258. 11 ops slots with 4 states. */
  opsAssignments: defineTable({
    slot: v.string(), // OPS_SLOT_ENUM (11 literals)
    userId: v.id("users"),
    status: v.union(
      v.literal("filled"), v.literal("single_person_acknowledged"),
      v.literal("vacant"), v.literal("inactive_assignee"),
    ),
    updatedAt: v.number(),
  }).index("by_slot", ["slot"]),

  // ═══════════════════════════════════════════════════════════════════════
  // SLICE-P4-01 — M4 post spine (bible l.76-97, enums l.351-382)
  // ═══════════════════════════════════════════════════════════════════════

  /** bible l.76 — the posts table. Tags via postTags join ONLY (no tagIds[]). */
  posts: defineTable({
    authorType: v.union(v.literal("editorial"), v.literal("persona"), v.literal("user")),
    authorUserId: v.optional(v.id("users")),
    authorPersonaId: v.optional(v.string()), // persona id (M8 table later)
    approvingUserId: v.optional(v.id("users")),
    responsiblePublisherUserId: v.optional(v.id("users")),
    editorialByline: v.optional(v.string()),
    type: v.union(
      v.literal("news"), v.literal("review"), v.literal("compare"),
      v.literal("help"), v.literal("spark"), v.literal("debate"),
      v.literal("list"), v.literal("showcase"),
      v.literal("launch_pad"), v.literal("gigs"), // locked at runtime
    ),
    title: v.string(),
    body: v.string(),
    categoryId: v.string(),
    toolIds: v.array(v.string()),
    lifecycleStatus: v.union(
      v.literal("draft"), v.literal("processing"), v.literal("ready"),
      v.literal("scheduled"), v.literal("published"), v.literal("archived"),
    ),
    moderationStatus: v.union(
      v.literal("not_required"), v.literal("pending"), v.literal("passed"),
      v.literal("held"), v.literal("rejected"), v.literal("removed"),
    ),
    visibility: v.union(v.literal("private"), v.literal("unlisted"), v.literal("public")),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_author_type_authorUserId", ["authorType", "authorUserId"])
    .index("by_type_lifecycleStatus", ["type", "lifecycleStatus"])
    .index("by_categoryId_publishedAt", ["categoryId", "publishedAt"]),

  /** bible l.86 — thin registry-STATE; type definitions live in code. */
  postTypeConfig: defineTable({
    type: v.string(), // post.type literal
    state: v.union(v.literal("active"), v.literal("locked")),
    sortOrder: v.number(),
    label: v.string(),
    lockedMessage: v.optional(v.string()),
    updatedByUserId: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),

  /** bible l.87 — News source-of-truth block (M2-injected, not user-typed). */
  postNews: defineTable({
    postId: v.id("posts"),
    sourceOfTruthUrl: v.string(),
    keyClaims: v.any(),
    publishedAt: v.optional(v.number()),
  }).index("by_postId", ["postId"]),

  /** bible l.167 — EXPORT-ONLY social derivatives (DEC-O07: never
   *  auto-published externally). Generated (System) at publish; exported
   *  (Editor) on demand. */
  postSocialDerivatives: defineTable({
    postId: v.id("posts"),
    derivativeType: v.union(
      v.literal("twitter"), v.literal("linkedin"), v.literal("hook"),
      v.literal("teaser"), v.literal("shorts_caption"),
    ),
    content: v.string(),
    generationRunId: v.optional(v.string()),
    status: v.union(v.literal("generated"), v.literal("edited"), v.literal("exported"), v.literal("stale")),
    editedByUserId: v.optional(v.id("users")),
    exportedByUserId: v.optional(v.id("users")),
    exportedAt: v.optional(v.number()),
    generatedAt: v.number(),
  }).index("by_postId", ["postId"]),

  /** bible l.168 — the per-post affiliate cap join (≤2/post, ≤1/tool,
   *  enforced in the publish mutation — CAP-057's binding point). Inject
   *  (P4-12) stages links on the candidate; publish validates + materializes. */
  postAffiliateLinks: defineTable({
    postId: v.id("posts"),
    affiliateLinkId: v.id("affiliateLinks"),
    toolId: v.optional(v.string()),
    labelType: v.union(
      v.literal("featured_tool"), v.literal("popular_platform"),
      v.literal("createconomy_pick"), v.literal("affiliate_partner"),
    ),
    position: v.number(),
    injectedByUserId: v.optional(v.id("users")),
    injectedAt: v.number(),
  })
    .index("by_postId", ["postId"])
    .index("by_toolId", ["toolId"]),

  /** bible l.206 — Wave-4B affiliate inventory (E6 defaults). The FK chain
   *  commercialEntities → affiliateRelationships → affiliateLinks feeds
   *  CAP-049 inject; CAP-545 soft-deactivates cascade down it. */
  commercialEntities: defineTable({
    name: v.string(),
    entityType: v.union(v.literal("vendor"), v.literal("brand"), v.literal("publisher"), v.literal("internal")),
    websiteUrl: v.string(),
    logoAssetId: v.optional(v.id("_storage")), // written via CAP-012 generateUploadUrl (forum/mutations — reuse, no fork)
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_name", ["name"]),

  /** bible l.207 — E2 founder enum; CAP-049 injects only when =active;
   *  CAP-545 entity-deactivate cascade writes terminated. */
  affiliateRelationships: defineTable({
    commercialEntityId: v.id("commercialEntities"),
    toolId: v.optional(v.string()),
    network: v.string(),
    programName: v.string(),
    relationshipStatus: v.union(v.literal("active"), v.literal("paused"), v.literal("terminated")),
    commissionModel: v.union(v.literal("cpa"), v.literal("cps"), v.literal("cpc"), v.literal("revshare"), v.literal("flat"), v.literal("other")),
    cookieWindow: v.number(), // integer days
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_commercialEntityId", ["commercialEntityId"])
    .index("by_toolId", ["toolId"])
    .index("by_status", ["relationshipStatus"]),

  /** bible l.208 — E1: status for CAP-545 soft-deactivate (CAP-049 injects
   *  only when active); E3: URL validation per CAP-100+CAP-235 discipline. */
  affiliateLinks: defineTable({
    affiliateRelationshipId: v.optional(v.id("affiliateRelationships")), // bible-optional; mutations enforce the parent chain (contract state B)
    toolId: v.optional(v.string()),
    url: v.string(),
    disclosureClass: v.union(v.literal("sponsored"), v.literal("affiliate"), v.literal("paid")),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  })
    .index("by_affiliateRelationshipId", ["affiliateRelationshipId"])
    .index("by_status", ["status"])
    .index("by_toolId", ["toolId"]),

  /** bible l.166 — per-post SEO meta; slug is the canonical route key
   *  (contract OQ#2). Written at publish (CAP-051 seo.generate —
   *  deterministic base; GLM enrichment rides the pipeline). */
  postSeoMeta: defineTable({
    postId: v.id("posts"),
    seoTitle: v.string(),
    seoDescription: v.string(),
    slug: v.string(),
    keywords: v.array(v.string()),
    ogImageAssetId: v.optional(v.id("_storage")),
    canonicalUrl: v.string(), // self
    structuredDataType: v.string(), // article|review|faq|... (open set per bible)
    manuallyEdited: v.boolean(),
    previousSlugs: v.optional(v.array(v.string())), // P7G-01 301 depth (indexable-entity deepen)
    generatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_postId", ["postId"]),

  /** bible l.98 — debate mechanic: source of truth for the derived tallies;
   *  unique (userId, postId); persona votes excluded from the public tally. */
  debateVotes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    choice: v.union(v.literal("agree"), v.literal("disagree"), v.literal("abstain")),
    createdAt: v.number(),
  })
    .index("by_postId", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  /** bible l.99 — list mechanic: source of truth for derived voteCounts;
   *  unique (userId, postListItemId). */
  listItemVotes: defineTable({
    postListItemId: v.id("postListItems"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_item", ["postListItemId"])
    .index("by_user_item", ["userId", "postListItemId"]),

  /** bible l.88 — Review block. verdictScore is computed, NEVER member-settable. */
  postReviews: defineTable({
    postId: v.id("posts"),
    toolId: v.string(),
    verdictScore: v.optional(v.number()), // 1-5 int, auto-computed same-txn
  }).index("by_postId", ["postId"]),

  /** bible l.89 — Compare block. Numeric rows live-rendered from tools aggregate. */
  postCompares: defineTable({
    postId: v.id("posts"),
    toolIds: v.array(v.string()), // 2-4
    qualitativeGrid: v.any(), // author-authored cells
  }).index("by_postId", ["postId"]),

  /** bible l.90 — Spark block. */
  postSparks: defineTable({
    postId: v.id("posts"),
    statement: v.string(),
  }).index("by_postId", ["postId"]),

  /** bible l.91 — Debate block. Tallies derived from debateVotes. */
  postDebates: defineTable({
    postId: v.id("posts"),
    proposition: v.string(),
    agreeCount: v.number(),
    disagreeCount: v.number(),
    abstainCount: v.number(),
  }).index("by_postId", ["postId"]),

  /** bible l.92 — List block. */
  postLists: defineTable({
    postId: v.id("posts"),
    mode: v.union(v.literal("community_ranked"), v.literal("static_creator")),
    intro: v.string(),
  }).index("by_postId", ["postId"]),

  /** bible l.93 — List items (1:many from postLists). */
  postListItems: defineTable({
    postListId: v.id("postLists"),
    content: v.string(),
    createdByUserId: v.id("users"),
    voteCount: v.number(),
    sortOrder: v.number(),
    createdAt: v.number(),
  }).index("by_postListId_sortOrder", ["postListId", "sortOrder"]),

  /** bible l.94 — Showcase block. projectUrl is the SINGLE controlled outbound field. */
  postShowcases: defineTable({
    postId: v.id("posts"),
    theThing: v.string(),
    projectUrl: v.optional(v.string()),
    // bible l.94: validated + domain-allowlisted + operator-approved (the
    // moderator gate is P7E-13 CAP-101 — never invented here)
    approvalStatus: v.union(v.literal("none"), v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  })
    .index("by_postId", ["postId"])
    .index("by_approvalStatus", ["approvalStatus"]),

  /** bible l.95 — Help block with resolved mechanic. */
  postHelps: defineTable({
    postId: v.id("posts"),
    problemStatement: v.string(),
    resolvedStatus: v.union(v.literal("open"), v.literal("resolved")),
    acceptedCommentId: v.optional(v.id("comments")), // CAP-122 clears same-tx on comment tombstone
    acceptedByUserId: v.optional(v.id("users")),
    acceptedAt: v.optional(v.number()),
  }).index("by_postId", ["postId"]),

  /** bible l.96 — Launch pad (skeleton, locked). */
  postLaunchPads: defineTable({
    postId: v.id("posts"),
    interestConfig: v.any(), // {mode: button|multi_choice, options?}
    resultsVisibility: v.literal("creator_private"),
  }).index("by_postId", ["postId"]),

  /** bible l.97 — Gigs (skeleton, locked). */
  postGigs: defineTable({
    postId: v.id("posts"),
    workDescription: v.string(),
    engagementType: v.string(),
  }).index("by_postId", ["postId"]),

  /* ── M6 discussion spine (SLICE-P5-01; bible l.79-115) ─────────────
   * Deferred with flag (NOT silently dropped): commentRankSnapshots
   * (l.108, calibration audit — Readiness Cat-8 owner) and the MAX
   * artifact tables threadIntelligenceRuns / threadThemes /
   * threadPositions / threadQuestions (l.110-114 — compute is
   * CAP-132/133, Phase-7-owned per CONTRACT-5-discussion-thread §1). */

  /** bible l.79 — one reply depth (INV-1); no separate thread entity;
   *  threadRootCommentId = own id on top-level (MUST-DEFINE resolved).
   *  Denormalized counters + rank projections live on commentScores. */
  comments: defineTable({
    postId: v.id("posts"),
    parentCommentId: v.optional(v.id("comments")),
    threadRootCommentId: v.id("comments"), // self-id convention on depth 0
    replyToCommentId: v.optional(v.id("comments")),
    depth: v.union(v.literal(0), v.literal(1)),
    authorType: v.union(v.literal("editorial"), v.literal("persona"), v.literal("user")),
    authorUserId: v.optional(v.id("users")),
    authorPersonaId: v.optional(v.string()), // persona id (M8 tables land P5-08)
    body: v.string(),
    authorIntent: v.optional(v.union(
      v.literal("question"), v.literal("answer"), v.literal("evidence"),
      v.literal("counterpoint"), v.literal("experience"),
    )),
    isQuestion: v.boolean(),
    moderationStatus: v.union(
      v.literal("not_required"), v.literal("pending"), v.literal("passed"),
      v.literal("held"), v.literal("rejected"), v.literal("removed"),
    ),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()), // tombstone; replies preserved (CAP-122)
    lastActivityAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_post_depth_created", ["postId", "depth", "createdAt"])
    .index("by_parent_created", ["parentCommentId", "createdAt"])
    .index("by_thread_root_created", ["threadRootCommentId", "createdAt"])
    .index("by_author_type_authorUserId", ["authorType", "authorUserId"]),

  /** bible l.103 — precomputed rank projection (rebuildable). Writes in
   *  this layer only set dirty-flags; recompute is CAP-129/130 (P5-04).
   *  All numeric projections + weightAtCast are SERVER-COMPUTED (never
   *  client-supplied; writers must range-check — no unbounded float from
   *  args ever lands here). `dirty` transcribes the "indexed dirty-score
   *  queue (leased, idempotent)" requirement — the lease fields belong
   *  to P5-04. */
  commentScores: defineTable({
    commentId: v.id("comments"),
    valuableCount: v.number(),
    replyCount: v.number(),
    distinctReplierCount: v.number(),
    saveCount: v.number(),
    contextSignalCount: v.number(),
    bestScore: v.number(), // Bayesian confidence-damped, NOT Wilson; ONE numerator
    liveScore: v.number(),
    mostDiscussedScore: v.number(),
    rankVersion: v.number(),
    lastInteractionAt: v.number(),
    lastRankedAt: v.number(),
    dirty: v.boolean(),
  })
    .index("by_comment", ["commentId"])
    .index("by_dirty_lastInteraction", ["dirty", "lastInteractionAt"]),

  /** bible l.81 — `valuable` is the SINGLE positive numerator (only Best
   *  input); `negative` is a hidden-result signal (no public count, never
   *  lowers Best). Mutually exclusive per (userId, commentId) — enforced
   *  in the mutation via the by_user_comment lookup (one row per pair).
   *  reason is PRIVATE (read-scoped server-side). weightAtCast =
   *  signalReputation + legitimacy, NEVER Recognition-derived. */
  commentReactions: defineTable({
    userId: v.id("users"),
    commentId: v.id("comments"),
    reactionType: v.union(v.literal("valuable"), v.literal("negative")),
    reason: v.optional(v.union(
      v.literal("disagree"), v.literal("not_useful"),
      v.literal("needs_evidence"), v.literal("off_topic"),
    )),
    weightAtCast: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_comment", ["userId", "commentId"])
    .index("by_comment_type", ["commentId", "reactionType"]),

  /** bible l.104 — private; no agreement semantics; weak rank input. */
  commentSaves: defineTable({
    userId: v.id("users"),
    commentId: v.id("comments"),
    createdAt: v.number(),
  })
    .index("by_user_comment", ["userId", "commentId"])
    .index("by_comment", ["commentId"]),

  /** bible l.105 — community curation; hidden until threshold; routes to
   *  intelligence/moderation (CAP-137); never cuts rank (INV-3).
   *  `status` literals are unnamed in the bible — v.string(), not invented. */
  commentContextSignals: defineTable({
    userId: v.id("users"),
    commentId: v.id("comments"),
    signalType: v.union(v.literal("context_needed"), v.literal("outdated")),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_comment", ["commentId"])
    .index("by_user_comment", ["userId", "commentId"]),

  /** bible l.107 — rebuildable projection; persona counts separate (INV-6). */
  threadStats: defineTable({
    postId: v.id("posts"),
    humanCommentCount: v.number(),
    personaCommentCount: v.number(),
    topLevelCount: v.number(),
    replyCount: v.number(),
    humanParticipantCount: v.number(),
    unresolvedQuestionCount: v.number(),
    latestHumanCommentId: v.optional(v.id("comments")),
    latestActivityAt: v.number(),
    threadRevision: v.number(),
    updatedAt: v.number(),
  }).index("by_postId", ["postId"]),

  /** bible l.106 — jump-to-unread / "new since you left". */
  threadReadStates: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    lastReadCommentId: v.optional(v.id("comments")),
    lastReadAt: v.number(),
    lastSeenHumanCommentCount: v.number(),
    lastSeenThreadRevision: v.number(),
    updatedAt: v.number(),
  }).index("by_user_post", ["userId", "postId"]),

  /** bible l.115 — reading-based trust; feeds M7/M12. */
  userReadingProgress: defineTable({
    userId: v.id("users"),
    topicsViewedCount: v.number(),
    postsReadCount: v.number(),
    totalReadTimeSeconds: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  /** bible l.109 — per-type thread-feature registry (typed keys only;
   *  may NEVER redefine depth/authorship/moderation/URL/persona/
   *  pagination). Declares allowedSortModes + overlayComponent +
   *  pinnedSlotBehavior + threadContextResolver + intelligenceExtensions. */
  threadPluginConfig: defineTable({
    postType: v.string(), // post.type literal
    featureKey: v.string(),
    enabled: v.boolean(),
    config: v.any(),
    updatedByUserId: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_postType_featureKey", ["postType", "featureKey"]),

  /** bible l.77 — revision history. */
  postRevisions: defineTable({
    postId: v.id("posts"),
    revisionNumber: v.number(),
    title: v.string(),
    body: v.string(),
    changeType: v.string(),
    changedByUserId: v.id("users"),
    generationRunId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_postId_revisionNumber", ["postId", "revisionNumber"]),

  /** bible l.72 — controlled taxonomy. Join tables are the ONLY canonical tag relation. */
  tags: defineTable({
    slug: v.string(),
    name: v.string(),
    tagType: v.string(),
    color: v.optional(v.string()),
    sortOrder: v.number(),
    status: v.string(),
  }).index("by_slug", ["slug"]),

  /** bible l.72 — postTags join. No tagIds[] arrays anywhere. */
  postTags: defineTable({
    postId: v.id("posts"),
    tagId: v.id("tags"),
    createdAt: v.number(),
  }).index("by_postId_tagId", ["postId", "tagId"]),

  // ═══════════════════════════════════════════════════════════════════════
  // SLICE-P4-04 — M5 tool registry (bible l.143-144; toolTags join l.72;
  // toolRating.dimension enum l.354; CAP-118 status posture)
  // ═══════════════════════════════════════════════════════════════════════

  /** bible l.143 — operator-curated registry row. Aggregates fed ONLY by
   *  user toolRatings (INV-1). editorialVerdict* = CAP-535 write target
   *  (display-only, never aggregated; nullable = no curated verdict). */
  tools: defineTable({
    name: v.string(),
    slug: v.string(),
    // asset id string — tighten to v.id("mediaAssets") when the CAP-012
    // media table lands (P4-02's upload chain owns it)
    logoAssetId: v.optional(v.string()),
    categoryIds: v.array(v.string()), // DEC-C01 slugs ("Categories via arrays" — bible l.24)
    pricing: v.optional(v.any()), // shape unspecified in bible/contract — render-neutral
    officialUrl: v.string(),
    status: v.union(v.literal("active"), v.literal("draft"), v.literal("archived")), // CAP-118
    ratingSum: v.number(),
    ratingCount: v.number(),
    dimensionSums: v.object({
      ease_of_use: v.number(),
      output_quality: v.number(),
      reliability: v.number(),
      value_for_money: v.number(),
    }),
    dimensionCounts: v.object({
      ease_of_use: v.number(),
      output_quality: v.number(),
      reliability: v.number(),
      value_for_money: v.number(),
    }),
    editorialVerdictScore: v.optional(v.number()),
    editorialVerdictSummary: v.optional(v.string()),
    editorialVerdictAssignedByUserId: v.optional(v.id("users")),
    editorialVerdictUpdatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .searchIndex("search_name", { searchField: "name" }),

  /** bible l.144 — USER ratings only (the sole aggregate feed). One ACTIVE
   *  per (userId, toolId) — R-ONE; the by_toolId_userId index is the guard. */
  toolRatings: defineTable({
    toolId: v.id("tools"),
    userId: v.id("users"),
    overallScore: v.number(), // 1-5 int
    dimensionScores: v.object({
      ease_of_use: v.number(),
      output_quality: v.number(),
      reliability: v.number(),
      // E6: not_applicable ONLY on value_for_money; increments neither sum
      // nor count (INV-3)
      value_for_money: v.union(v.number(), v.literal("not_applicable")),
    }),
    reviewText: v.optional(v.string()), // ≤2000 chars (M5 §8 Limits)
    status: v.union(v.literal("active"), v.literal("withdrawn")),
    moderationStatus: v.union(v.literal("passed"), v.literal("held"), v.literal("removed")),
    // [BIBLE-FIX 2026-09-05, SLICE-P4-05] — the bible bullet (l.144) omits
    // timestamps, but CAP-533's velocity window (added 2026-08-23, after the
    // M5 lock) requires createdAt; updatedAt tracks CAP-113 edits.
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_toolId_userId", ["toolId", "userId"])
    .index("by_toolId", ["toolId"]),

  /** bible l.72 — toolTags join (the ONLY canonical tool↔tag relation). */
  toolTags: defineTable({
    toolId: v.id("tools"),
    tagId: v.id("tags"),
    createdAt: v.number(),
  })
    .index("by_toolId_tagId", ["toolId", "tagId"])
    .index("by_tagId", ["tagId"]), // directory tag filter (tag → tools direction)

  /** bible l.263 — admin intervention alerts (M15 surface, transcribed
   *  SLICE-P4-05: CAP-116's drift monitor is its first writer). */
  adminInterventionAlerts: defineTable({
    alertKey: v.string(),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium")),
    title: v.string(),
    whatHappening: v.string(),
    whatToDo: v.string(),
    deepLinkRouteKey: v.string(),
    relatedIncidentId: v.optional(v.string()),
    status: v.union(
      v.literal("open"), v.literal("acknowledged"), v.literal("resolved"), v.literal("snoozed"),
    ),
    createdAt: v.number(),
    acknowledgedByUserId: v.optional(v.id("users")),
    acknowledgedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    snoozeUntil: v.optional(v.number()),
  }).index("by_alertKey_status", ["alertKey", "status"]),

  // ═══════════════════════════════════════════════════════════════════════
  // SLICE-P4-06 — M3 rulebook (bible l.160-163; live/replay source
  // discriminator per Wave-3 E4; thresholdConfig = live values only per E1)
  // ═══════════════════════════════════════════════════════════════════════

  /** bible l.160 — config; rule LOGIC lives in code. Seeded at deploy by
   *  CAP-536 (SLICE-P4-06's deploySeed). */
  qualificationRules: defineTable({
    ruleKey: v.string(),
    ruleVersion: v.number(),
    ruleClass: v.union(v.literal("hard"), v.literal("soft")),
    severity: v.string(), // display pill; no M3 literal set defined — seeded value, tunable
    enabled: v.boolean(),
    // LIVE VALUES ONLY (Wave-3 E1: min/max/type bounds are owned by
    // configKeyRegistry, CAP-395 pattern — one validation mechanism platform-wide)
    thresholdConfig: v.any(),
    applicablePostTypes: v.array(v.string()),
    updatedByUserId: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_ruleKey", ["ruleKey"]),

  /** bible l.161 — immutable audit of qualification runs (CAP-083). */
  qualificationRuns: defineTable({
    contentCandidateId: v.id("contentCandidates"),
    candidateRevision: v.number(),
    rulebookVersion: v.number(),
    overallResult: v.union(v.literal("pass"), v.literal("fail")),
    startedAt: v.number(),
    completedAt: v.number(),
    generationRunId: v.optional(v.string()),
  }).index("by_candidate", ["contentCandidateId", "candidateRevision"]),

  /** bible l.162 — per-rule results. source discriminator (Wave-3 E4):
   *  live rows permanently immutable (CAP-083); replay rows are CAP-085's
   *  calibration domain, never conflicting with the live stream. */
  qualificationRuleResults: defineTable({
    qualificationRunId: v.id("qualificationRuns"),
    ruleKey: v.string(),
    result: v.union(v.literal("pass"), v.literal("fail"), v.literal("flag")),
    source: v.union(v.literal("live"), v.literal("replay")),
    score: v.optional(v.number()),
    threshold: v.optional(v.number()),
    evidence: v.any(),
    failureCode: v.optional(v.string()),
  })
    .index("by_run", ["qualificationRunId"])
    .index("by_source", ["source"]),

  /** bible l.163 — the labeled qualification test set (Wave-3 E4). Curated
   *  by CAP-537; replayed by CAP-085's calibrate. */
  calibrationExamples: defineTable({
    candidateSnapshot: v.any(), // frozen candidate content (snapshot or contentCandidates reference)
    expectedOutcome: v.record(v.string(), v.union(v.literal("pass"), v.literal("fail"))), // per ruleKey
    addedByUserId: v.id("users"),
    addedAt: v.number(),
  }).index("by_addedAt", ["addedAt"]),

  // ═══════════════════════════════════════════════════════════════════════
  // SLICE-P4-07 — M2/M3 pipeline entities the qualify orchestrator owns
  // (bible l.149, l.155, l.157, l.159). P4-08 owns the ingestion tables
  // (sources/sourceItems/sourceClaims/…); P4-09 owns the WRITERS (forge).
  // ═══════════════════════════════════════════════════════════════════════

  /** bible l.149 — the M2 pipeline's central entity. `evaluation` is the
   *  latest rulebook snapshot projection (CAP-083's write target). */
  contentCandidates: defineTable({
    status: v.union(
      v.literal("submitted"), v.literal("extracting"), v.literal("drafting"),
      v.literal("review"), v.literal("approved"), v.literal("scheduled"),
      v.literal("published"), v.literal("rejected"),
    ),
    draft: v.any(),
    evaluation: v.optional(v.any()), // { overallResult, ruleResults[], runId?, evaluatedAt? }
    claimClusterId: v.optional(v.id("claimClusters")), // tightened per the stale-TODO note: claimClusters exists since P4-08
    postType: v.optional(v.string()),
    operatorId: v.optional(v.id("users")),
    rejectionReason: v.optional(v.string()), // REQUIRED when status=rejected (CAP-044)
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  /** bible l.157 — Convex vectorIndex; powers semantic similarity + claim
   *  traceability. Index dims are model-bound (embeddingModel/Version =
   *  migration safety). Embeddings WRITER is P4-09 (forge). */
  contentEmbeddings: defineTable({
    refType: v.union(
      v.literal("contentCandidate"), v.literal("post"), v.literal("sourceClaim"),
    ),
    refId: v.string(),
    categoryId: v.string(),
    embedding: v.array(v.float64()),
    embeddingModel: v.string(),
    embeddingVersion: v.number(),
    textHash: v.string(), // skip re-embed if unchanged
  })
    .index("by_ref", ["refType", "refId"]) // publish copies candidate→post embeddings by ref
    .vectorIndex("by_embedding", {
    vectorField: "embedding",
    // 1024 = the GLM embedding model's dimension (in-slice choice — the
    // bible's rule is only that dims are model-bound; a model swap bumps
    // embeddingVersion and re-indexes, never silently reuses the index)
    dimensions: 1024,
    filterFields: ["categoryId"],
  }),

  /** bible l.159 — similarity evidence + calibration data (H-SIM/H-DUP). */
  similarityChecks: defineTable({
    contentCandidateId: v.id("contentCandidates"),
    candidateRevision: v.number(),
    checkType: v.union(
      v.literal("source_ngram"), v.literal("source_jaccard"), v.literal("source_lcs"),
      v.literal("crosspost_vector"), v.literal("crosspost_jaccard"),
    ),
    comparedEntityType: v.string(),
    comparedEntityId: v.string(),
    method: v.string(),
    score: v.number(),
    threshold: v.number(),
    result: v.union(v.literal("pass"), v.literal("fail"), v.literal("flag")),
    matchedText: v.optional(v.string()),
    matchedSourceText: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_candidate", ["contentCandidateId", "candidateRevision"]),

  /** bible l.155 — grounded-citation audit (anti-hallucination). The forge
   *  (P4-09, CAP-039) is the WRITER; H-TRACE reads it. operatorConfirmed is
   *  CAP-542's write target (fail-closed gate for CAP-043). */
  draftClaimRefs: defineTable({
    contentCandidateId: v.id("contentCandidates"),
    candidateRevision: v.number(),
    assertionText: v.string(),
    sourceClaimIds: v.array(v.id("sourceClaims")), // tightened P4-08 (table now defined)
    exactValidation: v.any(), // { numbers|dates|quotes|entities: pass|fail }
    operatorConfirmed: v.boolean(),
    createdAt: v.number(),
  }).index("by_candidate", ["contentCandidateId", "candidateRevision"]),

  // ═══════════════════════════════════════════════════════════════════════
  // SLICE-P4-08 — M2 ingestion (bible l.146-156: sources, ingestionConfigs,
  // sourceItems, contentExtractions, sourceClaims, claimClusters,
  // contentCandidateSources). R-SSRF (CAP-061) is the security boundary:
  // every fetched URL passes lib/safeFetch — no exceptions.
  // ═══════════════════════════════════════════════════════════════════════

  /** bible l.146 — operator-curated source registry. Never deleted, only
   *  blocked (contract OQ#4; takedown fields are CAP-059's, Wave 7). */
  sources: defineTable({
    url: v.string(),
    domain: v.string(),
    trustLevel: v.union(v.literal("approved"), v.literal("blocked"), v.literal("conditional")),
    takedownReason: v.optional(v.string()), // CAP-059 write path (Wave 7)
    takedownAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_domain", ["domain"])
    .index("by_trustLevel", ["trustLevel"]),

  /** bible l.147 — one source may have >1 config over time; scheduling and
   *  method live here. robotsStatus/rightsBasis value sets are undefined
   *  (contract OQ#5/#6) — stored free-form, seeded conservatively. */
  ingestionConfigs: defineTable({
    sourceId: v.id("sources"),
    method: v.union(
      v.literal("rss"), v.literal("youtube_api"), v.literal("newsletter"),
      v.literal("raw_scrape"), v.literal("operator_paste"),
    ),
    feedUrl: v.optional(v.string()),
    youtubeChannelId: v.optional(v.string()),
    newsletterInbox: v.optional(v.string()),
    pollIntervalMinutes: v.number(),
    nextPollAt: v.optional(v.number()),
    lastPolledAt: v.optional(v.number()),
    lastSuccessAt: v.optional(v.number()),
    consecutiveFailures: v.number(),
    robotsStatus: v.string(),
    rightsBasis: v.string(),
    termsReviewStatus: v.string(),
    maxRequestsPerDay: v.number(),
    createdAt: v.number(),
  }).index("by_sourceId", ["sourceId"]),

  /** bible l.148 — discovered item ≠ monitored source. contentHash = the
   *  hash-dedup idempotency key (CAP-062: "hash dedup (no GLM on unchanged)"). */
  sourceItems: defineTable({
    sourceId: v.id("sources"),
    externalId: v.optional(v.string()),
    canonicalUrl: v.string(),
    title: v.string(),
    publishedAt: v.optional(v.number()),
    contentHash: v.string(),
    discoveredAt: v.number(),
    status: v.string(),
  })
    .index("by_contentHash", ["contentHash"])
    .index("by_sourceId", ["sourceId"]),

  /** bible l.148 — the extracted content claims.extract runs on. */
  contentExtractions: defineTable({
    sourceId: v.id("sources"),
    requestedUrl: v.string(),
    resolvedUrl: v.string(),
    extractionStatus: v.string(),
    extractedTitle: v.optional(v.string()),
    extractedText: v.optional(v.string()),
    extractedAuthor: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    contentHash: v.string(),
    extractorVersion: v.string(),
    failureCode: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_contentHash", ["contentHash"])
    .index("by_sourceId", ["sourceId"]),

  /** bible l.154 — the anti-plagiarism / anti-hallucination spine. quote
   *  claims are excluded from TRACEABILITY and exempt from PROSE-similarity
   *  only after passing the H-QUOTE gate. */
  sourceClaims: defineTable({
    contentExtractionId: v.id("contentExtractions"),
    sourceId: v.id("sources"),
    claimText: v.string(),
    claimType: v.union(
      v.literal("fact"), v.literal("stat"), v.literal("quote"), v.literal("opinion"),
      v.literal("prediction"), v.literal("data_point"),
    ),
    evidenceText: v.string(),
    evidenceStart: v.optional(v.number()),
    evidenceEnd: v.optional(v.number()),
    videoStartSeconds: v.optional(v.number()),
    videoEndSeconds: v.optional(v.number()),
    attributionRequired: v.boolean(),
    verificationStatus: v.string(),
    confidence: v.number(),
    categoryId: v.optional(v.string()),
    clusterId: v.optional(v.id("claimClusters")), // set by cluster.build (back-ref)
    createdAt: v.number(),
  })
    .index("by_extraction", ["contentExtractionId"])
    .index("by_clusterId", ["clusterId"])
    .index("by_category", ["categoryId"]),

  /** bible l.156 — ≥2 claims from ≥2 INDEPENDENT domains to draft
   *  (CAP-037); syndication collapses same-story domains. */
  claimClusters: defineTable({
    topicLabel: v.string(),
    categoryId: v.string(),
    claimIds: v.array(v.id("sourceClaims")),
    sourceDomainCount: v.number(), // distinct INDEPENDENT domains
    status: v.union(
      v.literal("pending"), v.literal("ready"), v.literal("drafted"), v.literal("exhausted"),
    ),
    contentCandidateId: v.optional(v.id("contentCandidates")),
    createdAt: v.number(),
    exhaustedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  /** bible l.150 — M2M candidate↔source; H-SRC/H-SUF read this. */
  contentCandidateSources: defineTable({
    contentCandidateId: v.id("contentCandidates"),
    sourceId: v.id("sources"),
    relationshipType: v.string(),
    extractionId: v.id("contentExtractions"),
    createdAt: v.number(),
  }).index("by_candidate", ["contentCandidateId"]),

  /** bible l.151 — GLM/generation run records. [BIBLE-FIX 2026-09-05,
   *  SLICE-P4-08] contentCandidateId made optional: CAP-036 writes
   *  extraction-scoped runs (claims.extract) before any candidate exists. */
  generationRuns: defineTable({
    contentCandidateId: v.optional(v.id("contentCandidates")),
    personaId: v.optional(v.string()),
    runType: v.string(),
    provider: v.string(),
    model: v.string(),
    promptVersion: v.string(),
    inputClaims: v.optional(v.array(v.id("sourceClaims"))),
    inputRef: v.string(),
    outputRef: v.optional(v.string()),
    status: v.string(),
    attemptNumber: v.number(),
    tokenUsage: v.number(),
    estimatedCost: v.number(),
    failureCode: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.number(),
  })
    .index("by_candidate", ["contentCandidateId"])
    .index("by_runType", ["runType"]),
});
