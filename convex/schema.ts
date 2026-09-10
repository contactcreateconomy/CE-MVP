import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
  // ── CANONICAL IDENTITY REGION (SLICE-P1-01a + P1-01b; tightened
  // SLICE-P7-CLEANUP 2026-09-10) ── Field union per `_data-model.md` l.315
  // (bible l.42/l.50/l.245/l.264/l.273 union). Bible-required fields are
  // schema-REQUIRED: the auth profile callback inserts the full canonical
  // set at signup. tokenIdentifier is the one documented exception - it
  // stays optional because the auth subject is assigned only after the
  // users row exists (sessions resolve via the library getAuthUserId).
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
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    // P1-01a — M1 core (_data-model.md l.315, first segment). P7-CLEANUP:
    // bible-required fields tightened from v.optional (deviation-1 window
    // closed with the forum-scoped table retirement). The auth profile
    // callback + canonical writers insert the full set. tokenIdentifier is
    // the one documented exception: the auth subject is assigned only after
    // the users row exists, so it cannot be present at insert time
    // (sessions resolve via the library getAuthUserId, not this field).
    tokenIdentifier: v.optional(v.string()), // Convex Auth subject — patched post-creation
    emailVerified: v.boolean(),
    mobileVerified: v.boolean(),
    mobileVerifiedAt: v.number(),
    accountStatus: v.union(v.literal("active"), v.literal("deleted")),
    accountStanding: v.union(
      v.literal("good"),
      v.literal("warned"),
      v.literal("restricted"),
      v.literal("suspended"),
      v.literal("terminated"),
    ),
    trustTier: v.union(v.literal("t1"), v.literal("t2"), v.literal("t3")),
    isStaff: v.optional(v.boolean()),
    analyticsSubjectId: v.string(), // crypto-random opaque unique
    bootstrapState: v.union(v.literal("pending_context"), v.literal("complete")),
    leaderboardOptOut: v.boolean(),
    postingEligibilityState: v.union(
      v.literal("not_verified"),
      v.literal("basic_incomplete"),
      v.literal("eligible"),
      v.literal("rate_limited"),
      v.literal("temporarily_restricted"),
      v.literal("suspended"),
      v.literal("deleted"),
    ),
    profileVisibility: v.union(v.literal("public"), v.literal("private")),
    timezone: v.optional(v.string()), // IANA, write-once; Admin+audit correction only
    username: v.optional(v.string()),
    usernameNormalized: v.optional(v.string()),
    // P1-01b (a) — root-profile remainder (bible l.42)
    displayName: v.string(),
    avatarAssetId: v.string(),
    bio: v.string(),
    postCount: v.number(),
    approvedCommentCount: v.number(),
    lastActiveAt: v.number(),
    suspendedAt: v.number(),
    suspendedReason: v.string(),
    deletedAt: v.number(),
    // P1-01b (b) — M7 eligibility block (bible l.42 tail)
    basicProfileComplete: v.boolean(),
    rulesAcceptedVersion: v.string(),
    rulesAcceptedAt: v.number(),
    legalAgeAssertedVersion: v.string(),
    legalAgeAssertedAt: v.number(),
    profileVersion: v.number(),
    completionBadges: v.array(v.string()),
    // P1-01b (c) — M13 standing tail (bible l.245); standingSetByCaseId
    // retyped to v.id("moderationCases") when P1-03 landed (2026-09-04).
    standingExpiresAt: v.optional(v.number()),
    standingSetByCaseId: v.optional(v.id("moderationCases")),
    // P1-01b (d) — M14 block (bible l.50, literals from Core-enums l.405/406)
    onboardingState: v.union(
      v.literal("new"),
      v.literal("basic_profile_complete"),
      v.literal("exploring"),
      v.literal("activated"),
      v.literal("engaged"),
      v.literal("retained"),
      v.literal("coach_dismissed"),
      v.literal("expired"),
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
    coachCardsShownCount: v.number(),
    checklistStepsShownMax: v.number(),
    coachDismissed: v.array(
      v.union(
        v.literal("discover_resource"),
        v.literal("acquire_resource"),
        v.literal("join_discussion"),
        v.literal("return_update"),
      ),
    ),
    coachDismissedAt: v.optional(v.number()),
    onboardingExpiredAt: v.optional(v.number()),
    // DECISIONS-LOCKED #3 — the 7 bits (schema stores booleans only; CAP-368:
    // UI shows ≤3 next actions, never a % complete — no percentage field)
    activationProgress: v.object({
      emailVerified: v.boolean(),
      mobileVerified: v.boolean(),
      profileComplete: v.boolean(),
      firstPostPublished: v.boolean(),
      firstCommentPosted: v.boolean(),
      firstReactionGiven: v.boolean(),
      firstFollowMade: v.boolean(),
    }),
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
   *  P2-01 admission writer enforces it; v1 is global-scope only. The legacy
   *  email-allowlist/membership authority was retired with the forum-scoped
   *  tables (P7-CLEANUP): users + roleAssignments are the only authority. */
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
    authorPersonaId: v.optional(v.id("personas")), // M8 (P5-08) — tightened from the P4 string placeholder
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
    authorPersonaId: v.optional(v.id("personas")), // M8 (P5-08) — tightened from the P5-01 string placeholder
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

  /* ── M7 profile & onboarding (SLICE-P5-05; bible l.58-67, l.230-231) ──
   * users already carries the M7 eligibility block (P1-01b). trustHistory
   * (l.65) is M12-reputation-owned (Phase 7) — deliberately NOT defined
   * here. CAP-551 mobile OTP stays fenced on TWILIO_* env (G6): the
   * users.mobileVerified read path exists; the OTP writer is not built. */

  /** bible l.58 — the common/stable profile layer. firstTapOrder = tap
   *  salience, CANNOT be backfilled (append-only order). toolsUsed is a
   *  direct tool-affinity attribute — never a financial proxy (no
   *  income/spend derived). Feeds Recognition only (DEC-SIGNAL-FIREWALL). */
  profiles: defineTable({
    userId: v.id("users"),
    roleArchetype: v.optional(v.union(
      v.literal("solo_creator"), v.literal("small_team"),
      v.literal("agency"), v.literal("exploring"), v.literal("prefer_not_to_say"),
    )),
    ageBand: v.optional(v.string()), // banded, optional; Phase-2 additions NOT here
    toolsUsed: v.array(v.string()), // M5 tool ids
    firstTapOrder: v.array(v.id("tags")), // ordered interest taps — salience
    consentFlags: v.object({
      interestsPersonalization: v.boolean(),
      demographicsPersonalization: v.boolean(),
      behavioralInference: v.boolean(),
      publicProfileVisibility: v.boolean(),
    }),
    completionVersion: v.number(),
    extendedData: v.optional(v.any()),
    profileVersion: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  /** bible l.59 — versioned, consent-bound structured declarations.
   *  "prefer not to say" MUST stay distinguishable from "never asked". */
  userProfileAttributes: defineTable({
    userId: v.id("users"),
    attributeType: v.string(),
    value: v.any(),
    valueVersion: v.number(),
    visibility: v.string(),
    consentStatus: v.string(),
    providedAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("by_user_type", ["userId", "attributeType"]),

  /** bible l.60 — direct selections always priority; inferred fills gaps. */
  userInterests: defineTable({
    userId: v.id("users"),
    tagId: v.id("tags"),
    source: v.union(v.literal("direct"), v.literal("inferred"), v.literal("both")),
    affinityScore: v.number(),
    status: v.string(),
    firstObservedAt: v.number(),
    lastObservedAt: v.number(),
    confirmedAt: v.optional(v.number()),
    removedAt: v.optional(v.number()),
  })
    .index("by_user_tag", ["userId", "tagId"])
    .index("by_user_source", ["userId", "source"]),

  /** bible l.61 — system estimates kept SEPARATE from self-declared truth.
   *  Allowed: topic/post-type/tool-category affinity, engagement archetype,
   *  expertise. PROHIBITED: age/gender/income/revenue/purchasing-power/
   *  employment/sensitive identity (enforced by the P5-04 inference job). */
  userInferences: defineTable({
    userId: v.id("users"),
    inferenceType: v.string(),
    value: v.any(),
    confidence: v.number(),
    evidenceWindowStart: v.number(),
    evidenceWindowEnd: v.number(),
    modelOrRuleVersion: v.string(),
    status: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_user_type_status", ["userId", "inferenceType", "status"]),

  /** bible l.62 — Phase-1 = stored handles only; no fetch without explicit
   *  OAuth + disclosure + revocation. No tokens here, ever. */
  userSocialAccounts: defineTable({
    userId: v.id("users"),
    platform: v.string(),
    handle: v.string(),
    profileUrl: v.string(),
    verificationStatus: v.string(),
    visibility: v.union(v.literal("private"), v.literal("public"), v.literal("future_marketplace_only")),
    oauthConnectionId: v.optional(v.string()),
    connectedAt: v.number(),
    revokedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  }).index("by_user_platform", ["userId", "platform"]),

  /** bible l.63 — append-only; withdrawal overrides analytics/
   *  personalization/marketplace/completion use. */
  userConsentRecords: defineTable({
    userId: v.id("users"),
    purpose: v.string(),
    policyVersion: v.string(),
    status: v.string(),
    collectionSurface: v.string(),
    occurredAt: v.number(),
    withdrawnAt: v.optional(v.number()),
  }).index("by_user_purpose", ["userId", "purpose"]),

  /** bible l.64 — versioned tiles derived from the post-type/M5 registry
   *  so interests & post types share a taxonomy (seeder: SLICE-P5-05). */
  interestTaxonomy: defineTable({
    tagId: v.id("tags"),
    label: v.string(),
    iconAssetId: v.optional(v.id("_storage")),
    category: v.string(),
    taxonomyVersion: v.number(),
    isActive: v.boolean(),
  })
    .index("by_tagId", ["tagId"])
    .index("by_active_category", ["isActive", "category"]),

  /** bible l.66 — append-only Recognition history. */
  profileCompletionEvents: defineTable({
    userId: v.id("users"),
    completionVersion: v.number(),
    badgeField: v.string(),
    awarded: v.boolean(),
    occurredAt: v.number(),
  }).index("by_user", ["userId"]),

  /** bible l.67 — append-only CAP-140 state transitions. */
  postingEligibilityEvents: defineTable({
    userId: v.id("users"),
    previousState: v.string(), // postingEligibilityState literal
    nextState: v.string(),
    reasonCode: v.string(),
    triggerType: v.string(),
    actorUserId: v.optional(v.id("users")),
    occurredAt: v.number(),
  }).index("by_user", ["userId"]),

  /** bible l.231 — the Journal seed (B4-revised). Append-only; each meta
   *  field MUST be tagged safe-for-public vs always-private (enforced by
   *  the single shared writer, convex/activity.ts — CAP-570). Reputation
   *  DERIVES from this ledger (Wave 4); private for all users now. */
  activityLedger: defineTable({
    userId: v.id("users"),
    eventType: v.union(
      v.literal("post_published"), v.literal("comment_created"),
      v.literal("upvote_given"), v.literal("save_added"),
      v.literal("resource_acquired"), v.literal("tier_unlocked"),
    ), // v1 starter set, extensible — widen on registered v2 names
    targetType: v.string(),
    targetId: v.string(),
    summary: v.string(), // human text
    meta: v.any(), // Record<field, {value, privacy}> — tagged at write
    visibility: v.union(v.literal("private"), v.literal("public")),
    createdAt: v.number(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_user_type_created", ["userId", "eventType", "createdAt"]),

  /* ── M8 persona spine (SLICE-P5-08; bible l.165, l.172-186) ─────────
   * SEALED-field firewall (l.173/178, CAP-180 E-H): personas.systemPrompt
   * + name + the full genome NEVER appear in public queries — projection
   * allowlists live in persona/public.ts (P5-09). Admin genome reads are
   * /admin/personas/genome (P5-12), Administrator-only. */

  /** bible l.172 — identity + lifecycle. systemPrompt is COMPILED from
   *  the genome (CAP-158) and SEALED; identityCharter is public copy but
   *  NEVER fed into the generation prompt. Permanent AI label. */
  personas: defineTable({
    name: v.string(), // internal id — SEALED
    displayName: v.string(),
    avatarAssetId: v.optional(v.id("_storage")),
    bio: v.string(), // one factual sentence — no fictional biography
    identityCharter: v.string(), // purpose/lens/values/blind-spot — public
    voice: v.string(),
    domain: v.string(),
    domainLevels: v.any(), // 0-3 per category
    systemPrompt: v.optional(v.string()), // SEALED — compiled, never hand-written
    genomeVersion: v.optional(v.number()),
    humorLevel: v.union(v.literal("none"), v.literal("dry"), v.literal("light"), v.literal("sharp")),
    sarcasmLevel: v.union(v.literal("none"), v.literal("mild"), v.literal("pointed")),
    lifecycleStatus: v.union(
      v.literal("draft"), v.literal("nascent"), v.literal("active"),
      v.literal("waning"), v.literal("retired"),
    ),
    paused: v.boolean(),
    pauseReason: v.optional(v.string()),
    createdByUserId: v.id("users"),
    approvedByUserId: v.optional(v.id("users")),
    activatedAt: v.optional(v.number()),
    waningAt: v.optional(v.number()),
    retiredAt: v.optional(v.number()),
    retirementReason: v.optional(v.string()),
    revivedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_lifecycleStatus", ["lifecycleStatus"])
    .index("by_name", ["name"]),

  /** bible l.174 — DEC-A07 consistency substrate; position-ledger source. */
  personaEngagements: defineTable({
    personaId: v.id("personas"),
    postId: v.id("posts"),
    commentId: v.optional(v.id("comments")),
    stanceSummary: v.string(),
    stanceEmbedding: v.optional(v.array(v.float64())),
    contributionIntent: v.string(),
    isFollowUp: v.boolean(),
    isEvolution: v.boolean(),
    threadRevision: v.optional(v.number()),
    relevanceScore: v.optional(v.number()),
    qualityScore: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_personaId", ["personaId"])
    .index("by_postId", ["postId"]),

  /** bible l.177 — the config back-door: templates + per-persona
   *  instances. SEALED IN FULL for public queries (l.178). */
  personaGenomes: defineTable({
    personaId: v.optional(v.id("personas")),
    version: v.number(),
    scope: v.union(v.literal("template"), v.literal("instance")),
    analyticalLens: v.string(),
    secondaryLenses: v.array(v.string()),
    disagreementStyle: v.string(),
    confidenceCalibration: v.string(),
    register: v.string(),
    verbosity: v.string(),
    domainLevels: v.any(),
    evidencePosture: v.string(),
    rankedValues: v.array(v.string()), // exactly 3
    triggerConditions: v.array(v.string()),
    signatureMoves: v.array(v.string()), // ≤2
    contributionArchetypes: v.array(v.string()),
    humorLevel: v.string(),
    sarcasmLevel: v.string(),
    blindSpot: v.string(),
    counterweight: v.string(),
    abstentionTopics: v.array(v.string()),
    prohibitedOverreach: v.string(),
    embedding: v.optional(v.array(v.float64())), // diversity check
    createdByUserId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_personaId", ["personaId"])
    .index("by_scope_version", ["scope", "version"]),

  /** bible l.179 — position ledger (consistency). */
  personaPositions: defineTable({
    personaId: v.id("personas"),
    topicKey: v.string(),
    categoryId: v.optional(v.string()),
    toolId: v.optional(v.string()),
    positionSummary: v.string(),
    stance: v.union(
      v.literal("supportive"), v.literal("skeptical"), v.literal("neutral"),
      v.literal("nuanced"), v.literal("reframed"),
    ),
    confidence: v.number(),
    status: v.union(
      v.literal("current"), v.literal("evolved"), v.literal("superseded"), v.literal("withdrawn"),
    ),
    supersedesPositionId: v.optional(v.id("personaPositions")),
    sourceCommentId: v.optional(v.id("comments")),
    firstExpressedAt: v.number(),
    lastExpressedAt: v.number(),
    expressionCount: v.number(),
  })
    .index("by_persona_topic", ["personaId", "topicKey"])
    .index("by_persona_status", ["personaId", "status"]),

  /** bible l.180 — memory retrieval HARD-scoped to one persona via the
   *  vector index filter (cross-persona leakage prevention, INV-4).
   *  Dimensions 1536 (openai-compatible embedding default — a config
   *  choice; the embedding model is stamped per row). */
  personaMemoryEmbeddings: defineTable({
    personaId: v.id("personas"),
    memoryType: v.union(v.literal("stance"), v.literal("position"), v.literal("comment")),
    refId: v.string(),
    contentText: v.string(),
    embedding: v.array(v.float64()),
    embeddingModel: v.string(),
    createdAt: v.number(),
  })
    .vectorIndex("by_persona_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["personaId"], // INV-4 — HARD scope
    })
    .index("by_personaId", ["personaId"]), // keyword-scoped v1 retrieval (vector search activates with the embedding provider)

  /** bible l.181 — voice-consistency centroid. */
  personaStyleBaseline: defineTable({
    personaId: v.id("personas"),
    styleEmbedding: v.array(v.float64()),
    sampleCommentIds: v.array(v.id("comments")),
    lastRecomputedAt: v.number(),
  }).index("by_personaId", ["personaId"]),

  /** bible l.182 — lifecycle + budget + quality projection (rebuildable). */
  personaCadenceState: defineTable({
    personaId: v.id("personas"),
    lifecycleStatus: v.string(),
    weeklyBudget: v.number(),
    weeklyUsed: v.number(),
    weekResetAt: v.number(),
    lastPublishedAt: v.optional(v.number()),
    publishedLast24h: v.number(),
    recentApprovalRate: v.number(),
    recentRejectionReasons: v.array(v.string()),
    lastDriftScore: v.optional(v.number()),
    lastDriftCheckAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_personaId", ["personaId"]),

  /** bible l.165 — M8-owned drafts (regen/rejected kept separate from
   *  published comments). genomeVersion snapshots at generation (in-flight
   *  drafts insulated from later genome edits — CAP-547 contract §3). */
  personaCommentDrafts: defineTable({
    postId: v.id("posts"),
    personaId: v.id("personas"),
    contributionIntent: v.string(),
    generationRunId: v.string(),
    genomeVersion: v.number(),
    memoryIds: v.array(v.string()),
    positionIds: v.array(v.string()),
    evaluationId: v.optional(v.id("personaCommentEvaluations")),
    body: v.string(),
    editedBody: v.optional(v.string()),
    status: v.union(
      v.literal("generated"), v.literal("edited"), v.literal("approved"),
      v.literal("rejected"), v.literal("published"), v.literal("scheduled"),
    ),
    scheduledFor: v.optional(v.number()), // required when status=scheduled (CAP-175)
    supersededByDraftId: v.optional(v.id("personaCommentDrafts")),
    earliestPublishAt: v.optional(v.number()),
    editedByUserId: v.optional(v.id("users")),
    approvedByUserId: v.optional(v.id("users")),
    publishedCommentId: v.optional(v.id("comments")),
    createdAt: v.number(),
  })
    .index("by_post_persona", ["postId", "personaId"])
    .index("by_status", ["status"])
    .index("by_persona_status_created", ["personaId", "status", "createdAt"]),

  /** bible l.183 — immutable quality run per draft. Hard-kill BEFORE
   *  operator (INV-5); soft 0-5 advisory, never gates. */
  personaCommentEvaluations: defineTable({
    personaCommentDraftId: v.id("personaCommentDrafts"),
    hardRuleResults: v.array(v.any()),
    autoKilled: v.boolean(),
    killReason: v.optional(v.string()),
    softScores: v.object({
      substance: v.number(), specificity: v.number(), advancesThread: v.number(),
      voiceConsistency: v.number(), naturalness: v.number(),
    }),
    contributionType: v.string(),
    hasClearPosition: v.boolean(),
    claimsPersonalExperience: v.boolean(),
    voiceDistance: v.optional(v.number()),
    crossPersonaSimilarity: v.optional(v.number()),
    generationRunId: v.string(),
    createdAt: v.number(),
  }).index("by_draft", ["personaCommentDraftId"]),

  /** bible l.184 — append-only population audit. */
  personaLifecycleEvents: defineTable({
    personaId: v.id("personas"),
    fromStatus: v.string(),
    toStatus: v.string(),
    eventType: v.union(
      v.literal("birth"), v.literal("activation"), v.literal("waning"),
      v.literal("retirement"), v.literal("pause"), v.literal("resume"), v.literal("revival"),
    ),
    reasonCode: v.string(),
    evidence: v.any(),
    triggeredBy: v.union(v.literal("system"), v.literal("operator"), v.literal("community")),
    actedByUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_persona_created", ["personaId", "createdAt"]),

  /** bible l.185 — community revival demand (gated; tally SNAPSHOTTED at
   *  operator approval — never auto-revive). Vote writes land in P5-09. */
  personaRevivalVotes: defineTable({
    retiredPersonaId: v.id("personas"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_persona_user", ["retiredPersonaId", "userId"])
    .index("by_persona", ["retiredPersonaId"]),

  /** bible l.186 — append-only genome audit (the back-door trail).
   *  CAP-547 invalidation fires in the SAME transaction as every edit +
   *  rollback (P5-12 — never split from the write path). */
  personaGenomeEdits: defineTable({
    personaId: v.optional(v.id("personas")),
    genomeVersion: v.number(),
    field: v.string(),
    oldValue: v.any(),
    newValue: v.any(),
    scope: v.union(v.literal("template"), v.literal("instance")),
    adminId: v.id("users"),
    previewFixtureRef: v.optional(v.string()), // CAP-548 writes this field
    createdAt: v.number(),
  }).index("by_persona_version", ["personaId", "genomeVersion"]),

  /* ── M9 feed & discovery (SLICE-P6-01; bible l.129-139) ──────────────
   * Firewall (l.128, quoted): "Personas/staff = ZERO in core ranking."
   * cardSummaries (l.137, quoted): "MUST NOT write postDistributionScores
   * or any rank/score field" — enforced by the P6-02 writers' separation. */

  /** bible l.129 — materialized rank projections (rebuildable). Read =
   *  index scan, never compute-at-read; topScore = Bayesian
   *  confidence-damped, NOT Wilson (no valid trials denominator). */
  postDistributionScores: defineTable({
    postId: v.id("posts"),
    distributionQualityVersion: v.number(),
    topScore: v.number(),
    hotScore: v.number(),
    trendScore: v.number(),
    integrityMultiplier: v.number(),
    valuableWeighted: v.number(),
    distinctCommenters: v.number(),
    replyCount: v.number(),
    saveCount: v.number(),
    qualifiedReads: v.number(),
    returns7d: v.number(),
    qualifiedExposureCount: v.number(),
    explorationDeficit: v.number(),
    lastEligibleInteractionAt: v.number(),
    scoreVersion: v.number(),
    dirtySince: v.optional(v.number()),
    computedAt: v.number(),
  })
    .index("by_postId", ["postId"])
    .index("by_dirtySince", ["dirtySince"]) // leased dirty-queue (M6 pattern)
    .index("by_topScore", ["topScore"])
    .index("by_hotScore", ["hotScore"])
    .index("by_lastEligibleInteractionAt", ["lastEligibleInteractionAt"]), // New recency scan

  /** bible l.130 — rolling event aggregates (avoid scanning 7d rawEvents). */
  postDistributionBuckets: defineTable({
    postId: v.id("posts"),
    bucketStart: v.number(),
    granularity: v.union(v.literal("hour"), v.literal("day")),
    valuableWeighted: v.number(),
    distinctCommenterCount: v.number(),
    replyCount: v.number(),
    saveCount: v.number(),
    qualifiedReads: v.number(),
    returns: v.number(),
    integrityAdjustments: v.number(),
  }).index("by_post_bucket", ["postId", "bucketStart"]),

  /** bible l.131 — exposure-deficit queue; NEVER an operator curation
   *  surface (INV-4). Personas excluded from exploration. */
  feedExplorationState: defineTable({
    postId: v.id("posts"),
    qualifiedExposureTarget: v.number(),
    qualifiedExposureCount: v.number(),
    insertionCount: v.number(),
    lastInsertedAt: v.number(),
    eligibilityStatus: v.string(),
    completedAt: v.optional(v.number()),
  })
    .index("by_postId", ["postId"])
    .index("by_eligibility_status", ["eligibilityStatus"]),

  /** bible l.132 — admin-curated featured inventory; never organic rank,
   *  never Recognition-selected. Manage 10, render 4–6, ≥2 rotate/24h. */
  heroSlots: defineTable({
    slotOrder: v.number(), // 0–9
    postId: v.id("posts"),
    headlineOverride: v.optional(v.string()),
    textOverride: v.optional(v.string()),
    mediaAssetId: v.optional(v.id("_storage")),
    ctaLabel: v.optional(v.string()),
    startAt: v.number(),
    endAt: v.number(),
    desktopEnabled: v.boolean(),
    mobileEnabled: v.boolean(),
    status: v.union(
      v.literal("draft"), v.literal("scheduled"), v.literal("active"),
      v.literal("expired"), v.literal("paused"), v.literal("archived"),
    ),
    disclosureClass: v.string(), // values unnamed (curation OQ3) — string, not invented
    fallbackPostId: v.optional(v.id("posts")),
    approvedByUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_slotOrder", ["slotOrder"])
    .index("by_status_start", ["status", "startAt"]),

  /** bible l.133 — hero scheduling/audit history. */
  heroAssignments: defineTable({
    slotOrder: v.number(),
    postId: v.id("posts"),
    activatedAt: v.number(),
    deactivatedAt: v.optional(v.number()),
    reason: v.string(),
    actorUserId: v.id("users"),
  }).index("by_slot_activated", ["slotOrder", "activatedAt"]),

  /** bible l.134 — What's Vibing momentum; HUMAN activity ONLY (personas
   *  contribute ZERO to velocity/acceleration/counts/threshold/rank). */
  vibingTrends: defineTable({
    objectType: v.union(v.literal("post"), v.literal("tool"), v.literal("category"), v.literal("theme")),
    objectId: v.string(),
    trendScore: v.number(),
    velocity: v.number(),
    acceleration: v.number(),
    distinctHumanCount: v.number(),
    interactionTypeCount: v.number(),
    integrityMultiplier: v.number(),
    enteredAt: v.number(),
    cooldownUntil: v.optional(v.number()),
    status: v.string(),
  })
    .index("by_object", ["objectType", "objectId"])
    .index("by_status_trendScore", ["status", "trendScore"]),

  /** bible l.135 — grounded emotional hook; entailment-grounded, valence-
   *  drift guard, NO emotion attributed to a named user, neutral fallback. */
  vibingHooks: defineTable({
    objectType: v.union(v.literal("post"), v.literal("tool"), v.literal("category"), v.literal("theme")),
    objectId: v.string(),
    hookText: v.string(),
    valence: v.union(v.literal("tension"), v.literal("curiosity"), v.literal("informational"), v.literal("positive")),
    sourceIntelligenceRunId: v.optional(v.string()), // M6 MAX tension source
    groundingStatus: v.union(v.literal("grounded"), v.literal("insufficient")),
    entailment: v.union(v.literal("supported"), v.literal("contradicted"), v.literal("insufficient")),
    supportingSpans: v.array(v.string()),
    opposingSpans: v.array(v.string()),
    generationRunId: v.string(),
    stale: v.boolean(),
    createdAt: v.number(),
  }).index("by_object", ["objectType", "objectId"]),

  /** bible l.136 — manual time-bound Featured slots; NEVER mutates
   *  trendScore. status includes `pulled` (CAP-554); the remaining
   *  literals are curation-contract-derived (OQ1) — flagged, not invented
   *  beyond the known set. */
  vibingFeatured: defineTable({
    postId: v.id("posts"),
    label: v.string(),
    startAt: v.number(),
    endAt: v.number(),
    status: v.union(
      v.literal("scheduled"), v.literal("active"), v.literal("expired"), v.literal("pulled"),
    ),
    reason: v.optional(v.string()),
    approvedByUserId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_postId", ["postId"]),

  /** bible l.137 — the feed-card projection. Display ONLY: the writers
   *  must never write postDistributionScores or any rank/score field. */
  cardSummaries: defineTable({
    postId: v.id("posts"),
    postRevisionId: v.optional(v.id("postRevisions")),
    oneLiner: v.string(),
    generationRunId: v.string(),
    supportingClaimIds: v.array(v.string()),
    groundingStatus: v.string(),
    stale: v.boolean(),
    runningCommentRef: v.optional(v.object({ commentId: v.id("comments"), frozenAt: v.number() })), // freeze ≥15min anti-flicker (CAP-196)
    avatarUserIds: v.optional(v.array(v.id("users"))), // ≤3 (CAP-197)
    discussingCount: v.optional(v.number()), // "N discussing" (CAP-197)
    createdAt: v.number(),
  }).index("by_postId", ["postId"]),

  /** bible l.138 — Recognition rankings, computed by M12 (Phase 7),
   *  rendered by M9. Table exists so P6-03 renders "Podium is forming"
   *  (minThresholdMet=false) until Phase 7 writes it. */
  leaderboardProjections: defineTable({
    category: v.union(
      v.literal("overall"), v.literal("commenter"), v.literal("helper"),
      v.literal("reviewer"), v.literal("rising"),
    ),
    window: v.union(v.literal("h24"), v.literal("d7"), v.literal("m1")),
    projectionVersion: v.number(),
    entries: v.array(v.object({ userId: v.id("users"), rank: v.number(), points: v.number(), trend: v.string() })),
    minThresholdMet: v.boolean(),
    computedAt: v.number(),
  }).index("by_category_window", ["category", "window"]),

  /** bible l.139 — ordering continuity. */
  /** bible l.82 — post saves (bible region table that had no writer until
   *  P6-03's Fav sort read it; unique (userId, postId) lookup). Distinct
   *  from commentSaves (M6). */
  saves: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("by_user_post", ["userId", "postId"])
    .index("by_user", ["userId"]),

  /** bible l.139 — ordering continuity. hide/mute state rides the session
   *  per CONTRACT-6-feed §2/§4 (CAP-200 writes, CAP-553 reverses) — the
   *  contract-derived arrays extend the l.139 bullet (flagged). */
  feedSessions: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.id("users")),
    sortMode: v.string(),
    rankingVersion: v.number(),
    hiddenPostIds: v.optional(v.array(v.id("posts"))), // CAP-200 hide
    mutedPostIds: v.optional(v.array(v.id("posts"))), // CAP-200 mute
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_user", ["userId"]),

  /** bible l.239 (M13) — immutable report intake. Table lands here because
   *  CAP-200's report branch is its first canonical writer (CONTRACT-6-feed
   *  §4); the M13 console that READS it ships in Phase 7. Many reports →
   *  one open case per target+policyFamily+window; volume ≠ guilt. */
  reports: defineTable({
    targetType: v.string(),
    targetId: v.string(),
    reporterId: v.id("users"),
    reasonCode: v.string(),
    reporterTrustAtTime: v.optional(v.string()),
    dedupeKey: v.string(),
    caseId: v.optional(v.id("moderationCases")),
    severityHint: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_target", ["targetType", "targetId"])
    .index("by_dedupe", ["dedupeKey"]),


  /* ── M10 resource store / Constellation (SLICE-P6-06; bible l.190-202) ─
   * Soft beta: constellation.ugc.enabled=false — in-house/operator only;
   * UGC tables dormant/forward-compatible. NO dmcaNotices table (absorbed
   * by M13 legalIntake — Wave 6B E1; enforced by test). */

  /** bible l.190 — private intake; NEVER public CDN. One→many forge only
   *  for non-user_ugc source classes. */
  resourceReferences: defineTable({
    uploaderUserId: v.optional(v.id("users")),
    sourceClass: v.union(
      v.literal("user_ugc"), v.literal("in_house"), v.literal("operator"), v.literal("rights_verified"),
    ),
    originalFileHash: v.string(),
    storageKeyQuarantine: v.string(),
    mimeClaimed: v.string(),
    magicBytesOk: v.boolean(),
    sizeBytes: v.number(),
    rightsBasis: v.optional(v.union(
      v.literal("own"), v.literal("authorized"), v.literal("compatible_licence"), v.literal("public_domain"),
    )),
    compatibleLicenceKind: v.optional(v.string()),
    status: v.union(
      v.literal("uploading"), v.literal("quarantined"), v.literal("scanning"),
      v.literal("rights_review"), v.literal("content_review"), v.literal("accepted_for_forge"),
      v.literal("rejected"), v.literal("forge_consumed"), v.literal("legal_hold"), v.literal("deleted"),
    ),
    rejectionReason: v.optional(v.string()),
    parseJobId: v.optional(v.string()),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_uploader", ["uploaderUserId"]),

  /** bible l.191 — append-only licence evidence. */
  resourceReferenceGrants: defineTable({
    referenceId: v.id("resourceReferences"),
    grantVersion: v.number(),
    termsHash: v.string(),
    rightsBasis: v.string(),
    licenceTextVersion: v.string(),
    contributorUserId: v.optional(v.id("users")),
    attestedAt: v.number(),
    ipHash: v.optional(v.string()),
    userAgentHash: v.optional(v.string()),
  }).index("by_reference", ["referenceId"]),

  /** bible l.192 — contribution weights; Σ ≤ 1.0 per resource, duplicates
   *  0, order ≠ weight. Unique (resourceId, referenceId). */
  resourceContributions: defineTable({
    resourceId: v.id("resources"),
    referenceId: v.id("resourceReferences"),
    contributorUserId: v.optional(v.id("users")), // nullable after erasure detach
    role: v.union(
      v.literal("primary"), v.literal("supporting"), v.literal("duplicate"),
      v.literal("independent"), v.literal("source_only"),
    ),
    weight: v.number(), // 0-1 — Σ enforced server-side in P6-10
    weightVersion: v.number(),
    isDuplicate: v.boolean(),
    signalEligible: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_resource", ["resourceId"])
    .index("by_resource_reference", ["resourceId", "referenceId"])
    .index("by_reference", ["referenceId"]), // the CAP-219 cascade walk's reverse edge (bible l.192: "Cascade/takedown walks this graph depth ≤5")

  /** bible l.193 — structured post↔resource token target (not body text). */
  postResources: defineTable({
    postId: v.id("posts"),
    resourceId: v.id("resources"),
    relationType: v.union(
      v.literal("mentions"), v.literal("explains"), v.literal("compares"),
      v.literal("uses"), v.literal("related"),
    ),
    sortOrder: v.number(),
    createdAt: v.number(),
  }).index("by_postId", ["postId"]),

  /** bible l.194 — the library row. */
  resources: defineTable({
    title: v.string(),
    slug: v.string(),
    categoryIds: v.array(v.string()),
    license: v.string(), // DEC-S20 OPEN until legal — terms pointer
    status: v.union(
      v.literal("draft"), v.literal("review"), v.literal("scheduled"), v.literal("published"),
      v.literal("paused"), v.literal("under_legal_review"), v.literal("removed"), v.literal("archived"),
    ),
    forgeDisclosure: v.string(),
    attributionLine: v.string(), // CAP-229 quoted line
    releaseBatch: v.optional(v.string()),
    releaseDate: v.optional(v.number()),
    currentVersionId: v.optional(v.id("resourceVersions")),
    createdAt: v.number(),
    // SLICE-P7G-01 — indexable-entity deepen (bible l.288, quoted)
    previousSlugs: v.optional(v.array(v.string())),
    lastReviewedAt: v.optional(v.number()),
    reviewedByUserId: v.optional(v.id("users")),
    provenanceVersion: v.optional(v.number()), // P7G-02 writes it at review; legacy rows absent
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  /** bible l.195 — immutable version history; exactly one isCurrent when
   *  published (enforced in P6-11). */
  resourceVersions: defineTable({
    resourceId: v.id("resources"),
    versionNo: v.number(),
    status: v.union(
      v.literal("generating"), v.literal("validation_failed"), v.literal("editorial_review"),
      v.literal("approved"), v.literal("current"), v.literal("superseded"),
      v.literal("withdrawn"), v.literal("removed"),
    ),
    isCurrent: v.boolean(),
    format: v.literal("pdf"), // launch consumer; docx intake only
    fileAssetId: v.optional(v.id("_storage")), // clean bucket only
    pageCount: v.optional(v.number()),
    sizeBytes: v.number(),
    contentFingerprint: v.string(),
    artifactSafetyPassed: v.boolean(),
    previewAssetId: v.optional(v.id("_storage")),
    releaseNotes: v.string(),
    publishedAt: v.optional(v.number()),
    createdByUserId: v.id("users"),
  })
    .index("by_resource_version", ["resourceId", "versionNo"])
    .index("by_resource_current", ["resourceId", "isCurrent"]),

  /** bible l.196 — the QUOTA unit. View never creates a row; no type=view
   *  (INV-6/DEC-S15). Unique (userId, resourceId). */
  acquisitions: defineTable({
    userId: v.id("users"),
    resourceId: v.id("resources"),
    acquiredAt: v.number(),
    quotaDayKey: v.string(), // YYYY-MM-DD user-local (DEC-S19)
    quotaWeekKey: v.string(), // ISO week Mon 00:00 user-local
  })
    .index("by_user_resource", ["userId", "resourceId"])
    .index("by_user_day", ["userId", "quotaDayKey"]),

  /** bible l.197 — downloads do NOT consume quota; feed M12 Signal. */
  downloads: defineTable({
    acquisitionId: v.id("acquisitions"),
    userId: v.id("users"),
    resourceId: v.id("resources"),
    resourceVersionId: v.id("resourceVersions"),
    downloadedAt: v.number(),
    integrityClass: v.string(),
  }).index("by_user_resource", ["userId", "resourceId"]),

  /** bible l.198 — atomic with acquire; user-local windows (DEC-S19). */
  resourceQuotaLedgers: defineTable({
    userId: v.id("users"),
    dayKey: v.string(),
    weekKey: v.string(),
    acquisitionsUsedDay: v.number(),
    acquisitionsUsedWeek: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_day", ["userId", "dayKey"]),

  /** bible l.200 — takedown execution trail (dmcaNotices ABSORBED into
   *  legalIntake — the id here IS a legalIntake id). */
  resourceTakedownActions: defineTable({
    legalIntakeId: v.optional(v.id("legalIntake")),
    targetType: v.string(),
    targetId: v.string(),
    action: v.union(v.literal("unpublish"), v.literal("legal_hold"), v.literal("remove")),
    reasonCode: v.string(),
    actorUserId: v.id("users"),
    createdAt: v.number(),
  }).index("by_target", ["targetType", "targetId"]),

  /** bible l.201 — append-only kill-gate outcomes; CAP-220 writes ONLY
   *  these rows (never flips the UGC flag — CAP-221 does, Administrator). */
  pilotKillGateEvaluations: defineTable({
    evaluatedAt: v.number(),
    trigger: v.union(v.literal("refs_threshold"), v.literal("days_threshold")),
    cohortBasis: v.string(),
    outcome: v.union(v.literal("continue"), v.literal("ditch_recommend")),
    metricsSnapshot: v.any(),
    thresholdKeysUsed: v.array(v.string()),
    configVersion: v.optional(v.string()),
  }).index("by_evaluatedAt", ["evaluatedAt"]),

  /** bible l.202 — cascade BFS review trail (≤5 hops). */
  resourceCascadeReviews: defineTable({
    rootTakedownId: v.id("resourceTakedownActions"),
    nodeType: v.string(),
    nodeId: v.string(),
    hopDepth: v.number(),
    disposition: v.string(),
    reviewerUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_root", ["rootTakedownId"]),

  /* ── M11 affiliate storefront (SLICE-P6-12; bible l.215-227) + the
   * distributions FK target (l.343 — create-writer is CAP-565 here;
   * M12 economy enrichment is Phase 7). F-01 guard: storefrontLinks has
   * validationState ONLY — no status field (stale sheet text). */

  /** bible l.343 (create-half) — the creator channel. CAP-565 creates the
   *  row at bootstrap-complete (ownershipMode=single, initial state);
   *  economy fields (might/levels/awards) stay unwritten until Phase 7. */
  distributions: defineTable({
    ownerUserId: v.id("users"),
    ownershipMode: v.union(v.literal("single"), v.literal("collaborative")),
    name: v.string(),
    memberCount: v.number(), // = the PUBLIC "Reach"
    reachFactor: v.number(),
    activeSignalFactor: v.number(),
    might: v.number(),
    mightPercentile: v.number(),
    currentLevel: v.string(), // signal.level literal
    highestLevelAchieved: v.string(),
    awardsCount: v.number(),
    dormant: v.boolean(),
    storeEnabled: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_owner", ["ownerUserId"]),

  /** bible l.215 — one per verified user; activation = ≥1 approved product. */
  storefronts: defineTable({
    ownerUserId: v.id("users"),
    distributionId: v.id("distributions"),
    status: v.string(),
    isPlatformCurated: v.boolean(),
    disclosureVersion: v.string(),
    collections: v.array(v.string()),
    activatedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerUserId"])
    .index("by_status", ["status"]),

  /** bible l.216 — the request gate with the four attestations. */
  storeRequests: defineTable({
    userId: v.id("users"),
    status: v.string(),
    categories: v.array(v.string()),
    networks: v.array(v.string()),
    expectedProductCount: v.number(),
    experienceNote: v.string(),
    attestations: v.object({
      owns: v.boolean(),
      programPermits: v.boolean(),
      regionEligible: v.boolean(),
      willDisclose: v.boolean(),
    }),
    termsVersion: v.string(),
    dataUseVersion: v.string(),
    reviewerUserId: v.optional(v.id("users")),
    reasonCode: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  /** bible l.217 — the Product-Promotion layer over tools. */
  storefrontProducts: defineTable({
    storefrontId: v.id("storefronts"),
    toolId: v.optional(v.string()), // canonical M5 registry link where one exists
    name: v.string(),
    category: v.string(), // Phase-1 allowlist
    useCase: v.string(),
    imageAssetId: v.optional(v.id("_storage")),
    description: v.string(),
    claims: v.string(),
    status: v.string(),
    currentVersionId: v.optional(v.id("storefrontProductVersions")),
    // CAP-560 write target (register, quoted): "storefrontProducts (link to
    // the shadow post's ID)" — set at approval by createShadowPost.
    shadowPostId: v.optional(v.id("posts")),
    sortOrder: v.number(),
    createdAt: v.number(),
  })
    .index("by_storefront", ["storefrontId"])
    .index("by_storefront_status", ["storefrontId", "status"]),

  /** bible l.218 — immutable reviewed commercial-package history; edit =
   *  new version → re-validate. */
  storefrontProductVersions: defineTable({
    storefrontProductId: v.id("storefrontProducts"),
    versionNo: v.number(),
    packageHash: v.string(),
    name: v.string(),
    merchant: v.string(),
    image: v.string(),
    description: v.string(),
    claims: v.string(),
    disclosureClass: v.string(),
    ctaLabel: v.string(),
    regions: v.array(v.string()),
    category: v.string(),
    storefrontLinkId: v.id("storefrontLinks"),
    approvedByUserId: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_product_version", ["storefrontProductId", "versionNo"]),

  /** bible l.219 — the approved IMMUTABLE destination. validationState is
   *  THE gate field (F-01: NO status field); a write to a locked field
   *  when approved_locked THROWS (enforced in the P6-14 mutations). */
  storefrontLinks: defineTable({
    submittedUrl: v.string(),
    finalRegistrableDomain: v.string(),
    redirectChainHash: v.string(),
    network: v.string(),
    programName: v.string(),
    affiliateAccountRefMasked: v.string(), // NEVER exposes the affiliate id
    permittedChannels: v.array(v.string()),
    geoEligibility: v.array(v.string()),
    selfReferralPolicy: v.string(),
    subAffiliatePolicy: v.string(),
    validationState: v.union(
      v.literal("pending"), v.literal("approved_locked"),
      v.literal("under_review"), v.literal("rejected"),
    ),
    fingerprintId: v.string(),
    lockedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_fingerprint", ["fingerprintId"])
    .index("by_validationState", ["validationState"]),

  /** bible l.220 — validation + re-scan audit (SSRF-safe headless). */
  linkValidations: defineTable({
    storefrontLinkId: v.id("storefrontLinks"),
    runType: v.union(v.literal("initial"), v.literal("rescan")),
    disposition: v.union(v.literal("pass"), v.literal("needs_human"), v.literal("fail"), v.literal("drift_detected")),
    fingerprint: v.any(), // {finalHost, redirectHash, titleHash, contentHash, ...}
    safeBrowsing: v.string(),
    phishtank: v.string(),
    reviewerUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_link", ["storefrontLinkId"]),

  /** bible l.221 — append-only BUY log → feeds M12. */
  storefrontClicks: defineTable({
    storefrontLinkId: v.id("storefrontLinks"),
    storefrontProductId: v.id("storefrontProducts"),
    promoterUserId: v.id("users"),
    sourcePostId: v.optional(v.id("posts")),
    sourceSurface: v.union(v.literal("post"), v.literal("storefront")),
    clickId: v.string(),
    actorUserId: v.optional(v.id("users")),
    anonymousSessionId: v.string(),
    qualification: v.union(v.literal("raw"), v.literal("qualified"), v.literal("excluded")),
    integrityStatus: v.string(),
    occurredAt: v.number(),
  })
    .index("by_link_occurred", ["storefrontLinkId", "occurredAt"])
    .index("by_clickId", ["clickId"]),

  /** bible l.222 — PRIVATE; aggregate count only; ZERO Signal. */
  wishlists: defineTable({
    userId: v.id("users"),
    storefrontProductId: v.id("storefrontProducts"),
    createdAt: v.number(),
  }).index("by_user_product", ["userId", "storefrontProductId"]),

  /** bible l.223 — AGGREGATE-ONLY projection (the fixed privacy-query
   *  contract lives on the P6-16 read path; k≥5, ≥1d buckets, ≥24h delay). */
  storefrontAnalytics: defineTable({
    subjectType: v.union(v.literal("store"), v.literal("product")),
    subjectId: v.string(),
    window: v.string(),
    storeViews: v.number(),
    productViews: v.number(),
    uniqueQualifiedViewers: v.number(),
    qualifiedClicks: v.number(),
    ctr: v.number(),
    wishlistAdds: v.number(),
    verifiedConversions: v.optional(v.number()),
    conversionValue: v.optional(v.number()),
    computedAt: v.number(),
  }).index("by_subject_window", ["subjectType", "subjectId", "window"]),

  /** bible l.224 — the review-conflict graph (DEC-M5-AGG extension). */
  reviewConflicts: defineTable({
    toolRatingId: v.id("toolRatings"),
    reviewerUserId: v.id("users"),
    sellerUserId: v.id("users"),
    conflictType: v.string(),
    state: v.union(
      v.literal("declared"), v.literal("suspected"), v.literal("confirmed"), v.literal("cleared"),
    ),
    evidence: v.any(),
    resolvedByUserId: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
  }).index("by_rating", ["toolRatingId"]),

  /** bible l.225 — sales-confirmation intake. CAP-525 two-field rule:
   *  self-report = type=self_report AND status=unverified (no collapsed
   *  literal exists in this enum). */
  salesEvidence: defineTable({
    storefrontProductId: v.id("storefrontProducts"),
    promoterUserId: v.id("users"),
    type: v.union(v.literal("subid"), v.literal("coupon"), v.literal("self_report"), v.literal("postback")),
    status: v.union(v.literal("unverified"), v.literal("network_verified"), v.literal("refunded")),
    conversionRef: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    occurredAt: v.number(),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_product", ["storefrontProductId"])
    .index("by_promoter", ["promoterUserId"]),

  /** bible l.226 — per-network SubID capability dictionary (CAP-572
   *  seeds it; P6-17 fail-closes on empty — never appends unknown params). */
  subIdRegistry: defineTable({
    network: v.string(),
    paramName: v.string(),
    valueFormat: v.string(),
    maxLength: v.number(),
    returnedInReport: v.boolean(),
    permitted: v.boolean(),
    ccGenerates: v.boolean(),
    breaksSignature: v.boolean(),
  }).index("by_network", ["network"]),

  /** bible l.227a — the strike ledger (circuit-breaker + revoke input). */
  storeStrikes: defineTable({
    storefrontId: v.id("storefronts"),
    reasonCode: v.string(),
    evidence: v.any(),
    actorUserId: v.id("users"),
    createdAt: v.number(),
  }).index("by_storefront", ["storefrontId"]),

  /** bible l.227b — vendor complaint intake (routes to takedown). */
  merchantComplaints: defineTable({
    complainantUserId: v.optional(v.id("users")),
    targetProductId: v.id("storefrontProducts"),
    reason: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_product", ["targetProductId"]),





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
    // SLICE-P7G-01 — indexable-entity deepen (bible l.288, quoted)
    previousSlugs: v.optional(v.array(v.string())),
    lastReviewedAt: v.optional(v.number()),
    reviewedByUserId: v.optional(v.id("users")),
    provenanceVersion: v.optional(v.number()), // P7G-02 writes it at review; legacy rows absent
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
  })
    .index("by_candidate", ["contentCandidateId"])
    .index("by_source", ["sourceId"]),

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

  // ═══════════════════════════════════════════════════════════════════════
  // SLICE-P7E-01 — M12 economy (bible l.122, l.334-348, l.404 ten-literal
  // level enum). Firewall (CAP-298, quoted): Recognition/Awards/Podium
  // NEVER feed Signals/Might/Reach; two currencies in different tables.
  // Sealed keys (legitimacy.medianTarget, signal.eventWeights,
  // signal.attributionSplit, trust.weightCap) never appear in queries.
  // ═══════════════════════════════════════════════════════════════════════

  /** bible l.122 — the DYNAMIC versioned outcome basket (Signal consumes
   *  only eligible, version-matched events; attributionCredits is NOT
   *  built in MVP-1). */
  outcomeDefinitions: defineTable({
    outcomeType: v.string(),
    weight: v.number(),
    attributionWindow: v.number(), // per-outcome-type; begins from eligible EXPOSURE
    isEvergreenTrack: v.boolean(), // DEC-SIGNAL-WINDOW — durable Help/Guide not starved
    netValueFormula: v.string(),
    version: v.number(),
    status: v.string(),
  })
    .index("by_type_version", ["outcomeType", "version"])
    .index("by_status", ["status"]),

  /** bible l.334 — append-only; the authoritative Signals record.
   *  Reversal/clawback are NEW rows (entryType), never rewrites. */
  signalLedger: defineTable({
    // contributionId = the creditable unit (post|comment id) — string
    // because contributionType discriminates the target table (Convex
    // v.id cannot be polymorphic across two tables).
    contributionId: v.string(),
    contributionType: v.union(v.literal("post"), v.literal("comment")),
    authorUserId: v.id("users"),
    outcomeType: v.string(),
    // the attribution anchor id — rawEvents id for event families,
    // storefrontClicks id for qualified CTA, salesEvidence id for
    // verified conversions (table varies by outcome family)
    outcomeEventId: v.string(),
    grossValue: v.number(),
    legitimacyFactor: v.number(), // snapshot at cast time (CAP-284)
    confidenceFactor: v.number(), // CAP-280 damping
    attributionModelVersion: v.string(),
    outcomeDefinitionVersion: v.number(),
    signalValue: v.number(),
    state: v.union(
      v.literal("provisional"), v.literal("finalized"),
      v.literal("reversed"), v.literal("clawed_back"),
    ),
    entryType: v.union(
      v.literal("award"), v.literal("reversal"),
      v.literal("clawback"), v.literal("adjustment"),
    ),
    reversesLedgerId: v.optional(v.id("signalLedger")),
    seasonId: v.id("signalSeasons"),
    provisionalAt: v.number(),
    finalizedAt: v.optional(v.number()),
    reversedAt: v.optional(v.number()),
    // implementation detail: the CAP-274 per-(actor,target) cap tracker
    // (actorTarget key) — never surfaced by any query
    meta: v.optional(v.any()),
  })
    .index("by_author_state", ["authorUserId", "state"])
    .index("by_state_provisionalAt", ["state", "provisionalAt"])
    .index("by_contribution", ["contributionId", "contributionType"])
    .index("by_season_author", ["seasonId", "authorUserId"]),

  /** bible l.335 — projection; two views of one ledger (per user +
   *  per distribution). Public triad "Signals" = activeSignals (CAP-281). */
  signalSummary: defineTable({
    subjectType: v.union(v.literal("user"), v.literal("distribution")),
    subjectId: v.string(),
    totalSignals: v.number(), // lifetime → record + trust capacity
    activeSignals: v.number(), // 90d decay clamp((90−days)/90,0,1) → Might
    pendingSignals: v.number(),
    windowVersion: v.string(),
    computedAt: v.number(),
  })
    .index("by_subject", ["subjectType", "subjectId"]),

  /** bible l.336 — the MOAT. value [0,1] NEVER surfaced by any query;
   *  geometric mean — one near-zero component tanks it. */
  legitimacyScores: defineTable({
    actorUserId: v.id("users"),
    value: v.number(),
    componentScores: v.object({
      account_age: v.number(),
      activity_diversity: v.number(),
      interaction_diversity: v.number(),
      content_quality: v.number(),
      temporal_humanity: v.number(),
      device_independence: v.number(),
      reciprocity_balance: v.number(),
    }),
    modelVersion: v.string(),
    flaggedLow: v.boolean(),
    computedAt: v.number(),
  })
    .index("by_actor", ["actorUserId"]),

  /** bible l.337 — detection graph (batch only); powers coordination/
  *   velocity detection → weight reduction ONLY; never grants influence. */
  engagementEdges: defineTable({
    fromUserId: v.id("users"),
    toAuthorUserId: v.id("users"),
    interactionCount: v.number(),
    reciprocalCount: v.number(),
    distinctDays: v.number(),
    sharedDeviceScore: v.number(),
    velocityZ: v.number(),
    window: v.string(),
    updatedAt: v.number(),
  }).index("by_pair_window", ["fromUserId", "toAuthorUserId", "window"]),

  /** bible l.338 — shadow-damp with NO feedback; detect-and-NEUTRALIZE,
   *  not ban (human sanction = M13). Recipient neutrality holds. */
  integrityFlags: defineTable({
    actorUserId: v.optional(v.id("users")),
    edgeRef: v.optional(v.id("engagementEdges")),
    type: v.union(
      v.literal("velocity"), v.literal("coordination"), v.literal("reciprocity"),
      v.literal("device"), v.literal("automation"), v.literal("suppression"),
    ),
    disposition: v.union(v.literal("monitor"), v.literal("damp"), v.literal("neutralize")),
    evidence: v.any(),
    dampFactor: v.number(),
    opened: v.number(),
    resolvedAt: v.optional(v.number()),
    reviewedByUserId: v.optional(v.id("users")),
  })
    .index("by_actor_disposition", ["actorUserId", "disposition"]),

  /** bible l.339 — BACKEND status source; computed independently from
   *  local wins — NEVER reads signalLedger (firewall-reverse). */
  recognitionEvents: defineTable({
    userId: v.id("users"),
    role: v.union(
      v.literal("overall"), v.literal("commenter"), v.literal("helper"),
      v.literal("reviewer"), v.literal("creator"), v.literal("debater"),
      v.literal("rising"),
    ),
    weightedValue: v.number(),
    sourceType: v.string(),
    sourceId: v.string(),
    window: v.string(),
    seasonId: v.id("signalSeasons"),
    occurredAt: v.number(),
  })
    .index("by_user_window", ["userId", "window"])
    .index("by_season_role", ["seasonId", "role"]),

  /** bible l.340 — Awards shelf. History append-only; revoked stays on
   *  the public shelf/count; inactivity or a Level DROP never revokes. */
  badges: defineTable({
    subjectType: v.union(v.literal("user"), v.literal("distribution")),
    subjectId: v.string(),
    type: v.union(
      v.literal("level_milestone"), v.literal("recognition_role"),
      v.literal("profile_completion"), v.literal("discoverer"),
    ),
    label: v.string(),
    level: v.optional(v.string()), // signal.level literal
    seasonId: v.optional(v.id("signalSeasons")),
    mightAtAward: v.optional(v.number()),
    isFirstToAchieve: v.boolean(),
    state: v.union(v.literal("provisional"), v.literal("finalized"), v.literal("revoked")),
    awardedAt: v.number(),
    revokedAt: v.optional(v.number()),
    revokeReason: v.optional(v.string()),
    // bible l.247 M13 bridge — absence preserves ordinary M12 immutability
    revocationBasis: v.optional(v.union(
      v.literal("fraud_confirmed"), v.literal("sanction"),
    )),
  })
    .index("by_subject_state", ["subjectType", "subjectId", "state"])
    .index("by_type_state", ["type", "state"]),

  /** bible l.342 — Reach = Σ member.legitimacy over qualified members;
   *  join deliberate, never auto; leave log-scaled (anti-suppression). */
  distributionMemberships: defineTable({
    distributionId: v.id("distributions"),
    memberUserId: v.id("users"),
    memberLegitimacySnapshot: v.number(),
    eligibilityStatus: v.string(),
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
  })
    .index("by_distribution_member", ["distributionId", "memberUserId"])
    .index("by_member", ["memberUserId"]),

  /** bible l.343 — annual freeze/recalibration; thresholds keyed by the
   *  ten signal.level literals (bible l.404) — not a free-form blob.
   *  Values await calibration_pending config keys (DECISIONS-LOCKED #11). */
  signalSeasons: defineTable({
    seasonNumber: v.number(),
    startAt: v.number(),
    endAt: v.number(),
    status: v.union(
      v.literal("upcoming"), v.literal("announced"),
      v.literal("active"), v.literal("closed"),
    ),
    mode: v.union(v.literal("fixed"), v.literal("percentile"), v.literal("hybrid")),
    thresholds: v.object({
      orbit: v.optional(v.number()),
      comet: v.optional(v.number()),
      moon: v.optional(v.number()),
      planet: v.optional(v.number()),
      star: v.optional(v.number()),
      supernova: v.optional(v.number()),
      nebula: v.optional(v.number()),
      galaxy: v.optional(v.number()),
      universe: v.optional(v.number()),
      multiverse: v.optional(v.number()),
    }),
    poolSize: v.number(),
    announcedAt: v.optional(v.number()),
    recalibratedAt: v.optional(v.number()),
  }).index("by_seasonNumber", ["seasonNumber"]),

  /** bible l.344 — per season. Bands: Orbit=all · Comet 50% · Moon 20% ·
   *  Planet 10% · Star 3% · Supernova 1% · Nebula 0.3% · Galaxy 0.1% ·
   *  Universe 0.03% · Multiverse abs-cap ~top100. Cold-start <1000 pool =
   *  fixed thresholds; Supernova+ silhouettes until pool grows. */
  signalLevelDefinitions: defineTable({
    seasonId: v.id("signalSeasons"),
    level: v.union(
      v.literal("orbit"), v.literal("comet"), v.literal("moon"), v.literal("planet"),
      v.literal("star"), v.literal("supernova"), v.literal("nebula"),
      v.literal("galaxy"), v.literal("universe"), v.literal("multiverse"),
    ),
    percentileBand: v.string(),
    fixedMightThreshold: v.optional(v.number()),
    sustainDays: v.number(),
    revealState: v.union(v.literal("visible"), v.literal("next"), v.literal("silhouette")),
    identityText: v.string(), // empty until copy is owned — UI renders the level literal
    milestoneCopyRef: v.string(),
  }).index("by_season_level", ["seasonId", "level"]),

  /** bible l.347 — history + holdover. Might continuous, Level committed
   *  monthly; routine demotion only at season boundary, max 1 level. */
  distributionLevelAssignments: defineTable({
    distributionId: v.id("distributions"),
    seasonId: v.id("signalSeasons"),
    level: v.string(), // signal.level literal
    status: v.union(
      v.literal("active"), v.literal("holdover"),
      v.literal("demoted"), v.literal("dormant"),
    ),
    mightAtCommit: v.number(),
    committedAt: v.number(),
    holdoverUntil: v.optional(v.number()),
  })
    .index("by_distribution_season", ["distributionId", "seasonId"])
    .index("by_season_level", ["seasonId", "level"]),

  /** bible l.348 — Phase-2 skeleton, unused at MVP-1. */
  vouches: defineTable({
    distributionId: v.id("distributions"),
    voucherUserId: v.id("users"),
    voucherLegitimacy: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
    reconfirmDueAt: v.optional(v.number()),
  }).index("by_distribution_voucher", ["distributionId", "voucherUserId"]),

  // ═══════════════════════════════════════════════════════════════════════
  // SLICE-P7E-10 — M13 remainder (bible l.241-244). moderationCases /
  //  reports / legalIntake / capabilityRestrictions / trustHistory already
  //  exist (P1-03 / P6-03 / Phase 3).
  // ═══════════════════════════════════════════════════════════════════════

  /** bible l.242 — the moderator action record (case-linked, reversible
   *  flagged, idempotency-keyed). */
  moderationActions: defineTable({
    caseId: v.id("moderationCases"),
    targetType: v.string(),
    targetId: v.string(),
    actorUserId: v.id("users"),
    actorRole: v.string(),
    action: v.string(),
    reasonCode: v.string(),
    policyVersion: v.string(),
    reversible: v.boolean(),
    beforeState: v.string(),
    afterState: v.string(),
    reportId: v.optional(v.id("reports")),
    idempotencyKey: v.string(),
    appealDeadlineAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_case", ["caseId"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_actor_reasonCode", ["actorUserId", "reasonCode"]),

  /** bible l.244a — the user strike ledger (distinct from storeStrikes).
   *  RI: 1 valid notice = 1 provisional strike; 3/12mo → terminated. */
  strikes: defineTable({
    userId: v.id("users"),
    class: v.union(
      v.literal("content_conduct"), v.literal("spam_manipulation"),
      v.literal("commercial_integrity"), v.literal("copyright_rights"),
      v.literal("account_integrity"),
    ),
    caseId: v.id("moderationCases"),
    noticeRef: v.optional(v.string()),
    active: v.boolean(),
    voidedByRestore: v.boolean(),
    provisional: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user_active", ["userId", "active"])
    .index("by_case", ["caseId"]),

  // ── SLICE-P7E-17 — MAX layer (bible l.110-113; P5-01 omitted, defined
  //  here per the catalog's flag). Runs are immutable audit rows. ──


  // ═══════════════════════════════════════════════════════════════════════
  // SLICE-P7A-01/10 — M15/M18 AdminCore remainder (bible l.257, l.260-262,
  // l.287, l.304 + Core-enums l.392). adminInterventionAlerts already
  // exists (Phase 3); launchReadinessResults/jobDeadLetters already exist.
  // ═══════════════════════════════════════════════════════════════════════


  // ═══════════════════════════════════════════════════════════════════════
  // SLICE-P7O-03 — M16 analytics projections (bible l.272-279 + identityJoins).
  // rawEvents M16 deepen (tombstoneState envelope) is already on the P1-07
  // region — additive columns only (union discipline, l.121 kept).
  // ═══════════════════════════════════════════════════════════════════════

  /** bible l.272 — FATAL class: adjustments APPEND; rawEvents never
   *  rewritten; projections dirty→recalculating→rebuild. */
  analyticsEligibilityAdjustments: defineTable({
    sourceEventId: v.id("rawEvents"),
    adjustmentType: v.union(
      v.literal("invalidate"), v.literal("reverse"), v.literal("restore"),
      v.literal("detach_identity"), v.literal("exclude_staff"), v.literal("exclude_test"),
    ),
    resultingEligibility: v.string(),
    reasonCode: v.string(),
    sourceModule: v.string(),
    sourceRecordId: v.optional(v.string()),
    effectiveAt: v.number(),
    createdAt: v.number(),
    idempotencyKey: v.string(),
  })
    .index("by_sourceEvent", ["sourceEventId"])
    .index("by_idempotencyKey", ["idempotencyKey"]),

  /** bible l.275 — the projection store (freshness incl. recalculating). */
  analyticsProjections: defineTable({
    projectionKey: v.string(),
    windowStart: v.number(),
    windowEnd: v.number(),
    dimensions: v.any(),
    metrics: v.any(),
    sampleStatus: v.string(), // only `directional` is named (CAP-449)
    definitionVersion: v.number(),
    computedAt: v.number(),
    freshness: v.union(
      v.literal("complete"), v.literal("partial"), v.literal("stale"), v.literal("recalculating"),
    ),
    lastCalculatedAt: v.number(),
  })
    .index("by_projectionKey_window", ["projectionKey", "windowStart"]),

  /** bible l.276 — weekly decisions, append-only (createdAt M16 l.96). */
  analyticsWeeklyDecisions: defineTable({
    periodStart: v.number(),
    periodEnd: v.number(),
    decision: v.string(),
    evidence: v.any(),
    metricSnapshots: v.any(),
    projectionDefinitionVersion: v.number(),
    catalogVersion: v.number(),
    ownerUserId: v.id("users"),
    nextAction: v.string(),
    reviewDate: v.number(),
    createdAt: v.number(),
  }).index("by_periodStart", ["periodStart"]),

  /** bible l.278 — the daily mirror reconcile. */
  analyticsReconcileResults: defineTable({
    ranAt: v.number(),
    mirroredEventDiff: v.number(),
    status: v.union(v.literal("ok"), v.literal("untrusted"), v.literal("failed")),
    affectedEventNames: v.array(v.string()),
  }).index("by_ranAt", ["ranAt"]),

  /** bible l.279 — unknown-prod-event + probe anomalies (CAP-455 rows). */
  instrumentationIncidents: defineTable({
    type: v.string(),
    severity: v.string(),
    eventNames: v.array(v.string()),
    detail: v.string(),
    status: v.string(),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  /** bible l.286 — the UTM dictionary (CAP-566 seeds/edits). */
  utmDictionary: defineTable({
    version: v.number(),
    allowedSources: v.array(v.string()),
    allowedMediums: v.array(v.string()),
    campaignFormat: v.string(),
    contentFormat: v.string(),
    maxLen: v.number(), // 80 (quoted)
    updatedAt: v.number(),
  }).index("by_version", ["version"]),

  /** bible l.51 — one ask post-acquire; unsubscribe before capture. */
  newsletterConsents: defineTable({
    userId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("unsubscribed")),
    consentedAt: v.optional(v.number()),
    surface: v.string(),
    copyVersion: v.string(), // v1 = trigger-based "when new resources drop"
    ipHash: v.optional(v.string()),
    unsubscribedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  /** bible l.52 — PRIMARY retention; soft-beta itemsPerDay=1; launch floor 40. */
  dripBatches: defineTable({
    batchId: v.string(),
    releasedAt: v.number(),
    resourceIds: v.array(v.id("resources")),
    tags: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_batchId", ["batchId"])
    .index("by_releasedAt", ["releasedAt"]),

  /** bible l.257 — M18 refreshes; M15 renders; stale ≠ 0 (quoted). */
  adminCounters: defineTable({
    counterKey: v.string(),
    value: v.number(),
    computedAt: v.number(),
    health: v.union(v.literal("healthy"), v.literal("stale"), v.literal("failed")),
  }).index("by_counterKey", ["counterKey"]),

  /** bible l.260 — STOP/coverage/supply incident ledger. */
  operationalIncidents: defineTable({
    type: v.union(v.literal("stop"), v.literal("coverage"), v.literal("supply"), v.literal("other")),
    capabilityKey: v.optional(v.string()),
    ownerUserId: v.optional(v.id("users")),
    activatedByUserId: v.optional(v.id("users")),
    reason: v.string(),
    reviewAt: v.optional(v.number()),
    handoffDueAt: v.optional(v.number()),
    expectedDurationMin: v.optional(v.number()),
    recoveryCheckKey: v.optional(v.string()),
    state: v.union(v.literal("active"), v.literal("recovering"), v.literal("closed")),
    createdAt: v.number(),
    closedAt: v.optional(v.number()),
  }).index("by_state_type", ["state", "type"]),

  /** bible l.261 — support quota grants. ≤5 extra acquires · ≤7d · max 1
   *  active/user · unique incident; NO permanent opsExempt flag (quoted). */
  quotaGrants: defineTable({
    userId: v.id("users"),
    extraAcquires: v.number(),
    expiresAt: v.number(),
    grantedByUserId: v.id("users"),
    reason: v.string(),
    incidentId: v.optional(v.id("operationalIncidents")),
    neutralizedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_neutralizedAt", ["userId", "neutralizedAt"]),

  /** bible l.262 — deploy-synced sanitized wiki; never executable HTML. */
  adminWikiArticles: defineTable({
    slug: v.string(),
    title: v.string(),
    domain: v.string(),
    bodyMarkdown: v.string(), // sanitized — script/iframe/on* stripped at deploySync
    relatedWidgetKeys: v.array(v.string()),
    constraintsSummary: v.string(),
    version: v.number(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_slug", ["slug"]),

  /** bible l.287 — the CAP-484 monitored predicates (M17 writes; M15 renders). */
  seoHealth: defineTable({
    sitemapUrlCount: v.number(),
    lastSitemapBuildAt: v.number(),
    coverageErrorCount: v.number(),
    thinIndexedCount: v.number(),
    heldIndexedCount: v.number(),
    lastGscPullAt: v.optional(v.number()),
    status: v.string(),
    lastCalculatedAt: v.number(),
  }).index("by_lastCalculatedAt", ["lastCalculatedAt"]),

  /** bible l.304 (transcribed from M18 l.73) — dependency-health +
   *  liveness vocabulary on ONE state field (Core-enums l.392, quoted):
   *  healthy · degraded · unavailable · recovering · stale · dead · never_ran. */
  platformHealth: defineTable({
    probeKey: v.string(), // or jobKey
    state: v.union(
      v.literal("healthy"), v.literal("degraded"), v.literal("unavailable"),
      v.literal("recovering"), v.literal("stale"), v.literal("dead"), v.literal("never_ran"),
    ),
    severity: v.string(),
    checkedAt: v.number(),
    lastSuccessAt: v.optional(v.number()),
    expectedNextRunAt: v.optional(v.number()),
    latencyMs: v.optional(v.number()),
    failureClass: v.optional(v.string()),
    freshUntil: v.number(),
    dependency: v.optional(v.string()),
    affectedCapabilities: v.array(v.string()),
    deepLinkKey: v.string(),
  }).index("by_probeKey", ["probeKey"]),

  /** bible l.277 (timestamps M16 l.97) — the analytics deletion lifecycle
   *  {requested|submitted|confirmed|failed|retrying}. CAP-506's outbox and
   *  CAP-453's member request BOTH land here (one lifecycle, one job);
   *  CMP purpose scope rides the additive `purposes` column. */
  analyticsDeletionRequests: defineTable({
    analyticsSubjectId: v.string(),
    userId: v.optional(v.id("users")), // additive: the requesting member
    purposes: v.optional(v.array(v.string())), // additive: CMP withdraw scope
    status: v.union(
      v.literal("requested"), v.literal("submitted"), v.literal("confirmed"),
      v.literal("failed"), v.literal("retrying"),
    ),
    requestedAt: v.number(),
    submittedAt: v.optional(v.number()),
    confirmedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
  })
    .index("by_subject_status", ["analyticsSubjectId", "status"])
    .index("by_user", ["userId"]),

  /** bible l.305 (back-filled from M18 l.74, P7T-13) — CMP consent.
   *  PostHog gated; rawEvents NEVER consent-gated (quoted). */
  consentRecords: defineTable({
    userId: v.optional(v.id("users")),
    anonymousConsentId: v.optional(v.string()), // CAP-387 stitch — fenced (member path ships)
    policyVersion: v.string(),
    purposesGranted: v.array(v.string()),
    purposesDenied: v.array(v.string()),
    jurisdictionClass: v.string(),
    collectionSurface: v.string(),
    grantedAt: v.number(),
    withdrawnAt: v.optional(v.number()),
    supersededAt: v.optional(v.number()),
    evidenceHash: v.string(),
  })
    .index("by_user_grantedAt", ["userId", "grantedAt"])
    .index("by_surface", ["collectionSurface"]),

  /** bible l.110 — MAX run audit (status incl. the empty-success class
   *  while the model vendor is unnamed — flagged). */
  threadIntelligenceRuns: defineTable({
    postId: v.id("posts"),
    fromThreadRevision: v.number(),
    toThreadRevision: v.number(),
    generationRunId: v.optional(v.string()),
    status: v.string(),
    humanCommentCount: v.number(),
    startedAt: v.number(),
    completedAt: v.number(),
    failureCode: v.optional(v.string()),
  }).index("by_post", ["postId"]),

  /** bible l.111 — themes with entailment-verified claim spans. */
  threadThemes: defineTable({
    threadIntelligenceRunId: v.id("threadIntelligenceRuns"),
    postId: v.id("posts"),
    label: v.string(),
    summary: v.string(),
    supportingCommentIds: v.array(v.id("comments")),
    claimSpans: v.array(v.any()),
    entailment: v.union(v.literal("supported"), v.literal("contradicted"), v.literal("insufficient")),
    humanCommentCount: v.number(),
    status: v.string(),
  }).index("by_run", ["threadIntelligenceRunId"]),

  /** bible l.112 — positions incl. the common-ground map (never labeled
   *  "consensus"; only with ≥2 genuine stance clusters). */
  threadPositions: defineTable({
    threadIntelligenceRunId: v.id("threadIntelligenceRuns"),
    postId: v.id("posts"),
    position: v.string(),
    supportingCommentIds: v.array(v.id("comments")),
    claimSpans: v.array(v.any()),
    entailment: v.union(v.literal("supported"), v.literal("contradicted"), v.literal("insufficient")),
    challengingCommentIds: v.array(v.id("comments")),
    commonGround: v.optional(v.string()),
    participantCount: v.number(),
    status: v.string(),
  }).index("by_run", ["threadIntelligenceRunId"]),

  /** bible l.113 — open questions. */
  threadQuestions: defineTable({
    threadIntelligenceRunId: v.id("threadIntelligenceRuns"),
    postId: v.id("posts"),
    question: v.string(),
    status: v.string(),
  }).index("by_run", ["threadIntelligenceRunId"]),

  /** bible l.65 + l.246a — append-only tier/moderation/signal timeline
   *  (cannot be backfilled from trustTier alone). P7E-15 writes the
   *  standing transitions; P7T owns the consent-tier events. */
  trustHistory: defineTable({
    userId: v.id("users"),
    event: v.string(),
    fromTier: v.optional(v.string()),
    toTier: v.optional(v.string()),
    reason: v.string(),
    evidenceId: v.optional(v.string()),
    standingTransition: v.optional(v.object({
      from: v.string(),
      to: v.string(),
      caseId: v.id("moderationCases"),
      durationDays: v.number(),
    })),
    triggerCaseId: v.optional(v.id("moderationCases")),
    occurredAt: v.number(),
  })
    .index("by_user_time", ["userId", "occurredAt"]),

  /** bible l.245 — cases store code+version, never rendered copy;
   *  Legal-mutable via NEW VERSION, never in-place overwrite (CAP-358/429). */
  policyReasonCodes: defineTable({
    code: v.string(), // immutable
    severity: v.string(),
    defaultAction: v.string(),
    userFacingTitle: v.string(),
    userFacingBody: v.string(),
    policyUrlAnchor: v.string(),
    appealable: v.boolean(),
    active: v.boolean(),
    version: v.number(),
    effectiveFrom: v.number(),
    autoReleaseEligible: v.optional(v.boolean()), // C1 — soft allowlist only
  }).index("by_code_version", ["code", "version"]),
});
