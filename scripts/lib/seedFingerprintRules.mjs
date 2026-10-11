/**
 * seedFingerprintRules — the ONE definition of how a seed fingerprint is
 * folded (shared by scripts/seed-check.mjs and scripts/seed-check-proof.mjs
 * so the proof can never drift from the check).
 *
 * Hash inputs: per-table counts (minus VOLATILE) + stable identity keys.
 * Counts for MIXED-writer tables arrive already subset-filtered from
 * seed/check:fingerprint (SEED_SUBSETS in convex/seed/check.ts — origin
 * field per table, evidence in that file). VOLATILE here = tables whose
 * writers are scheduled jobs ONLY, plus runtime-volatile surfaces.
 */
import { createHash } from "node:crypto";

// Cron-only-written projection tables (S00 FIX-2, Grok-verified 2026-10-11;
// precise function-block attribution — see convex/seed/check.ts comments):
//   recognitionEvents ← jobs.recognition.rollup,
//   signalLedger ← jobs.attributionSettle.settle + signal.award.sweep,
//   dripBatches ← jobs.dripRelease.release,
//   userInferences ← jobs.infer.inferBatch,
//   threadIntelligenceRuns / threadPluginConfig ← jobs.maxRefresh.sweep,
//   sourceClaims / claimClusters ← ingest.extract.{extractClaims,buildClusters},
//   storefrontAnalytics ← store.public.{clickSettle,salesReconcile,analyticsRollup},
//   adminInterventionAlerts ← tools.driftCheck + admin.appeals.slaTick +
//     admin.homeAlertWriters.* via interventionCreateTx (not in Grok's example
//     list but satisfies the same cron-only rule; only other writer is the
//     unused dev/demoSeed path)
// Runtime/session surfaces predate the fix (wall-clock dependent).
// MIXED tables (cardSummaries, badges, heroSlots, heroAssignments,
// signalSeasons, storeStrikes, trustHistory, generationRuns) are NOT here —
// they are subset-counted in the query and stay hashed.
export const VOLATILE = new Set([
  "authAccounts", "authRateLimits", "authRefreshTokens", "authSessions",
  "authVerificationCodes", "authVerifiers",
  "auditLog", "adminCounters", "analyticsProjections", "deployLog",
  "distributionLevelAssignments", // monthly level-commit cron appends history rows (catch-up fires them after downtime)
  "feedExplorationState", "feedSessions", "instrumentationIncidents",
  "jobDeadLetters", "jobRuns", "legitimacyScores", "operationalIncidents",
  "pilotKillGateEvaluations", "platformHealth", "rawEvents", "signalSummary",
  "threadReadStates", "userReadingProgress",
  // ── cron-only projection tables (S00 FIX-2) ──
  "adminInterventionAlerts", "claimClusters", "dripBatches", "recognitionEvents",
  "signalLedger", "sourceClaims", "storefrontAnalytics",
  "threadIntelligenceRuns", "threadPluginConfig", "userInferences",
]);

/** Fold a { counts, keys } state (seed/check:fingerprint output) exactly
 *  like scripts/seed-check.mjs does. Returns the 12-hex fingerprint. */
export function hashFingerprint(parsed) {
  const sortedCounts = Object.fromEntries(
    Object.entries(parsed.counts).sort(([a], [b]) => a.localeCompare(b)),
  );
  const hashableCounts = Object.fromEntries(
    Object.entries(sortedCounts).filter(([t]) => !VOLATILE.has(t)),
  );
  const payload = JSON.stringify({ counts: hashableCounts, keys: parsed.keys });
  return createHash("sha256").update(payload).digest("hex").slice(0, 12);
}
