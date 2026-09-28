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
    for (const table of TABLES) {
      const rows = await (ctx.db as any).query(table).collect();
      counts[table] = table === "systemConfig" ? rows.filter((r: any) => !isRuntimeConfigKey(r?.key)).length : rows.length;
    }
    const userEmails = (await ctx.db.query("users").collect()).map((u: any) => u.email).sort();
    const postTitles = (await ctx.db.query("posts").collect()).map((p: any) => p.title).sort();
    const toolSlugs = (await ctx.db.query("tools").collect()).map((t: any) => t.slug).sort();
    const notificationDedupeKeys = (await ctx.db.query("notifications").collect()).map((n: any) => n.dedupeKey).sort();
    // badge subjects resolved to emails — generated ids differ between wipes
    const badgeEmail = new Map<string, string>();
    const badgeLabels: string[] = [];
    for (const b of await ctx.db.query("badges").collect()) {
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
