/**
 * seed:check — data fingerprint for local dev parity (R3).
 *
 * Returns per-table row counts plus stable identity keys (emails, titles,
 * dedupeKeys, labels — never timestamps or generated ids). The pnpm
 * wrapper (scripts/seed-check.mjs) folds these into a short hash: two
 * machines with the same fingerprint have the same logical data.
 */
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

const TABLES = [
  "acquisitions", "activityLedger", "adminCounters", "adminInterventionAlerts", "adminWidgets",
  "adminWikiArticles", "affiliateLinks", "affiliateRelationships", "analyticsDeletionRequests",
  "analyticsEligibilityAdjustments", "analyticsProjections", "analyticsReconcileResults",
  "analyticsWeeklyDecisions", "auditLog", "badges", "calibrationExamples", "capabilityRestrictions",
  "cardSummaries", "categories", "claimClusters", "commentContextSignals", "commentReactions",
  "commentSaves", "commentScores", "comments", "commercialEntities", "configKeyRegistry",
  "consentRecords", "contentCandidateSources", "contentCandidates", "contentEmbeddings",
  "contentExtractions", "contentVersions", "debateVotes", "deployLog", "distributionLevelAssignments",
  "distributionMemberships", "distributions", "downloads", "draftClaimRefs", "dripBatches",
  "engagementEdges", "eventCatalog", "feedExplorationState", "feedSessions", "generationRuns",
  "heroAssignments", "heroSlots", "identityJoins", "ingestionConfigs", "instrumentationIncidents",
  "integrityFlags", "interestTaxonomy", "jobCatalog", "jobDeadLetters", "jobRuns",
  "launchReadinessResults", "leaderboardProjections", "legalIntake", "legitimacyScores",
  "linkValidations", "listItemVotes", "merchantComplaints", "moderationActions", "moderationCases",
  "newsletterConsents", "notifications", "operationalIncidents", "opsAssignments",
  "outcomeDefinitions", "personaCadenceState", "personaCommentDrafts", "personaCommentEvaluations",
  "personaEngagements", "personaGenomeEdits", "personaGenomes", "personaLifecycleEvents",
  "personaMemoryEmbeddings", "personaPositions", "personaRevivalVotes", "personaStyleBaseline",
  "personas", "pilotKillGateEvaluations", "platformHealth", "policyReasonCodes", "postAffiliateLinks",
  "postCompares", "postDebates", "postDistributionBuckets", "postDistributionScores", "postGigs",
  "postHelps", "postLaunchPads", "postListItems", "postLists", "postNews", "postResources",
  "postReviews", "postRevisions", "postSeoMeta", "postShowcases", "postSocialDerivatives",
  "postSparks", "postTags", "postTypeConfig", "postingEligibilityEvents", "posts", "privateUserData",
  "profileCompletionEvents", "profiles", "qualificationRuleResults", "qualificationRules",
  "qualificationRuns", "quotaGrants", "rawEvents", "recognitionEvents", "reports",
  "resourceCascadeReviews", "resourceContributions", "resourceQuotaLedgers", "resourceReferenceGrants",
  "resourceReferences", "resourceTakedownActions", "resourceVersions", "resources", "reviewConflicts",
  "roleAssignments", "salesEvidence", "saves", "seoHealth", "signalLedger", "signalLevelDefinitions",
  "signalSeasons", "signalSummary", "similarityChecks", "sourceClaims", "sourceItems", "sources",
  "storeRequests", "storeStrikes", "storefrontAnalytics", "storefrontClicks", "storefrontLinks",
  "storefrontProductVersions", "storefrontProducts", "storefronts", "strikes", "subIdRegistry",
  "systemConfig", "tags", "threadIntelligenceRuns", "threadPluginConfig", "threadPositions",
  "threadQuestions", "threadReadStates", "threadStats", "threadThemes", "toolRatings", "toolTags",
  "tools", "trustHistory", "userConsentRecords", "userInferences", "userInterests",
  "userProfileAttributes", "userReadingProgress", "userSocialAccounts", "users", "utmDictionary",
  "vibingFeatured", "vibingHooks", "vibingTrends", "vouches", "waitlistEntries", "wishlists",
] as const;

/** systemConfig keys a scheduled runtime job writes AFTER a reset
 *  (timing-dependent watermarks, not seed content) — excluded from the
 *  fingerprint count so the 45 seeded config rows keep their drift
 *  signal while the hash stays stable across the job's hourly fire. */
export const RUNTIME_CONFIG_PREFIXES = ["tools.ratings.driftCheck."];

export function isRuntimeConfigKey(key: unknown): boolean {
  return RUNTIME_CONFIG_PREFIXES.some((p) => String(key ?? "").startsWith(p));
}

/** Badge types the demo seed writes. Every OTHER badge type (discoverer,
 *  recognition_role, rocketeer, …) is minted by scheduled award jobs from
 *  seeded inputs — derived runtime state, excluded like the watermarks. */
const SEEDED_BADGE_TYPES = new Set(["level_milestone", "profile_completion"]);

export function isSeededBadge(type: unknown): boolean {
  return SEEDED_BADGE_TYPES.has(String(type ?? ""));
}

/* ═══ MIXED-WRITER SUBSETS (S00 FIX-2, Grok verdict 2026-10-11) ═══
 * Tables written BOTH by scheduled jobs and by seeds/humans are counted as
 * their seed/human subset only, selected by an existing origin field, so
 * cron rows can't break cross-machine parity while seed rows stay hashed.
 * Field evidence per table (writer sites):
 *   storeStrikes    actorUserId      — cron circuitBreaker writes as the platform
 *                                      reserved user ("System actor = the reserved
 *                                      identity", admin/storeEnforce.ts:140); human
 *                                      strikes carry the acting admin (admin/storeEnforce.ts:94)
 *   trustHistory    reason           — cron repeatInfringer literals start "repeat_infringer"
 *                                      (jobs/repeatInfringer.ts:46,81); human ladder rows
 *                                      don't (admin/sanctions.ts:61)
 *   generationRuns  runType          — cron extract writes "claims.extract"
 *                                      (ingest/extract.ts:171); user forge writes "forge.draft"
 *                                      (forge.ts:204)
 *   heroSlots       disclosureClass  — "community_top" is the AUTO-FILL class,
 *                                      excluded BY DESIGN including the seed's
 *                                      first slot (any community_top row is
 *                                      machine-assignable refresh material —
 *                                      cards.ts:157 system fill; curation's
 *                                      "operator_curated" admin/curation.ts:169
 *                                      and seeds' "editorial" seed/demo.ts:1093
 *                                      stay hashed)
 *   heroAssignments reason           — "stale_auto_fill_community_top" is the
 *                                      auto-fill class, excluded BY DESIGN ("the
 *                                      reason carries it", cards.ts:171);
 *                                      operator "operator_schedule"
 *                                      (admin/curation.ts:184) stays hashed
 *   signalSeasons   seasonNumber     — the founding seeded season is number 1
 *                                      (economy/seed.ts:43); seasonRecalibrate mints n+1
 *                                      (signal/promoteDemote.ts:106)
 *   badges          subjectType      — cron mints (promoteSustained/discovererCheck) are always
 *                                      subjectType "distribution" (signal/promoteDemote.ts:167,293);
 *                                      every seed/human writer is subjectType "user"
 *                                      (seed/demo.ts:345,366; admin/store.ts:110)
 * NOT subset-counted:
 *   cardSummaries — fully VOLATILE (S00 FIX-3): a derived cache, rebuilt by
 *     cards.refreshCards from the posts/comments rows that ARE hashed —
 *     count drift carries no seed information (see scripts/lib/seedFingerprintRules.mjs).
 * No usable origin field — whole table stays hashed and the founder was
 * flagged: vibingTrends (seed/demo.ts:1056 vs jobs/vibing.ts:90 shapes share
 * every field), integrityFlags (brigadeSweep sanctions.ts:208 vs reply_flood
 * notifications/batch.ts:85 differ only inside evidence),
 * leaderboardProjections (seed and rollup both write projectionVersion 1;
 * rollup upserts, observed 2/2/2 across states). merchantComplaints /
 * moderationCases / moderationActions have no scheduled writer at all
 * (precise function-block attribution — only fileComplaint / user-action /
 * moderator paths insert). */
type Row = Record<string, any>;
const SEED_SUBSETS: Record<string, (row: Row, platformReservedUserId: string | null) => boolean> = {
  storeStrikes: (r, reserved) => r.actorUserId !== reserved,
  trustHistory: (r) => !String(r.reason ?? "").startsWith("repeat_infringer"),
  generationRuns: (r) => r.runType !== "claims.extract",
  heroSlots: (r) => r.disclosureClass !== "community_top",
  heroAssignments: (r) => r.reason !== "stale_auto_fill_community_top",
  signalSeasons: (r) => r.seasonNumber === 1,
  badges: (r) => isSeededBadge(r.type) && r.subjectType === "user",
};

export const fingerprint = internalQuery({
  args: {},
  returns: v.object({
    counts: v.record(v.string(), v.number()),
    keys: v.object({
      userEmails: v.array(v.string()),
      postTitles: v.array(v.string()),
      toolSlugs: v.array(v.string()),
      notificationDedupeKeys: v.array(v.string()),
      badgeLabels: v.array(v.string()),
    }),
  }),
  handler: async (ctx) => {
    const counts: Record<string, number> = {};
    // origin for the storeStrikes subset: the reserved system actor
    const reserved: any = await (ctx.db as any)
      .query("users").withIndex("email", (q: any) => q.eq("email", "platform@createconomy.internal")).unique();
    const platformReservedUserId = reserved?._id ?? null;
    for (const table of TABLES) {
      // .count() reads index metadata (no document scan) — collect() on every
      // table blew the per-query read cap once the demo world loads (~230k docs).
      // Filtered tables stay as collects (small, content-dependent counts).
      const subset = SEED_SUBSETS[table];
      counts[table] =
        table === "systemConfig"
          ? (await (ctx.db as any).query(table).collect()).filter((r: any) => !isRuntimeConfigKey(r?.key)).length
          : subset
            ? (await (ctx.db as any).query(table).collect()).filter((r: any) => subset(r, platformReservedUserId)).length
            : await (ctx.db as any).query(table).count();
    }
    const userEmails = (await ctx.db.query("users").collect()).map((u: any) => u.email).sort();
    const postTitles = (await ctx.db.query("posts").collect()).map((p: any) => p.title).sort();
    const toolSlugs = (await ctx.db.query("tools").collect()).map((t: any) => t.slug).sort();
    const notificationDedupeKeys = (await ctx.db.query("notifications").collect()).map((n: any) => n.dedupeKey).sort();
    // badge subjects resolved to emails — generated ids differ between wipes.
    // Only SEEDED badge types count: award crons mint discoverer/role badges
    // from seeded inputs over time (derived state, like the watermarks).
    const badgeEmail = new Map<string, string>();
    const badgeLabels: string[] = [];
    for (const b of await ctx.db.query("badges").collect()) {
      if (!isSeededBadge(b.type) || b.subjectType !== "user") continue;
      let email = badgeEmail.get(b.subjectId);
      if (email === undefined) {
        const subject: any = b.subjectType === "user" ? await (ctx.db as any).get(b.subjectId) : null;
        email = String(subject?.email ?? "unknown");
        badgeEmail.set(b.subjectId, email);
      }
      badgeLabels.push(`${email}:${b.label}`);
    }
    badgeLabels.sort();
    return { counts, keys: { userEmails, postTitles, toolSlugs, notificationDedupeKeys, badgeLabels } };
  },
});
