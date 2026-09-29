#!/usr/bin/env node
/**
 * seed:check — data fingerprint (R3): row counts per table + a short hash
 * over counts and stable identity keys (emails/titles/slugs/dedupeKeys/
 * badge labels — never timestamps or generated ids). Identical fingerprint
 * = identical logical data across machines.
 */
import { createHash } from "node:crypto";
import { assertLocalDeployment, convexRun, preflightDevGuard, step, ok } from "./lib/local-gate.mjs";

const deployment = assertLocalDeployment("seed:check");

step("preflight: seed/devGuard:assertLocal (positive confirmation) …");
const confirmation = await preflightDevGuard("seed:check");
ok(`server-side guard confirmed local backend (${confirmation.url})`);

step("collecting table counts + stable keys…");
const raw = convexRun("seed/check:fingerprint");
let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  console.error("  [✗] could not parse fingerprint output:\n" + raw.slice(0, 500));
  process.exit(1);
}

const { counts, keys } = parsed;
const sortedCounts = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
const nonZero = Object.fromEntries(Object.entries(sortedCounts).filter(([, n]) => n > 0));

// Runtime-volatile tables are LISTED but excluded from the hash: their row
// counts depend on wall-clock activity (cron fire times, login sessions,
// reading progress from browsing) and would break cross-machine parity
// without saying anything about seed parity.
const VOLATILE = new Set([
  "authAccounts", "authRateLimits", "authRefreshTokens", "authSessions",
  "authVerificationCodes", "authVerifiers",
  "auditLog", "adminCounters", "analyticsProjections", "deployLog",
  "feedExplorationState", "feedSessions", "instrumentationIncidents",
  "jobDeadLetters", "jobRuns", "legitimacyScores", "operationalIncidents",
  "platformHealth", "rawEvents", "signalSummary", "threadReadStates",
  "userReadingProgress",
]);

const hashableCounts = Object.fromEntries(
  Object.entries(sortedCounts).filter(([t]) => !VOLATILE.has(t)),
);
const payload = JSON.stringify({ counts: hashableCounts, keys });
const hash = createHash("sha256").update(payload).digest("hex").slice(0, 12);

console.log(`\nfingerprint: ${hash}  (${deployment})`);
console.log(`tables with data: ${Object.keys(nonZero).length}/${Object.keys(sortedCounts).length}`);
console.log("\nnon-zero tables:");
for (const [table, n] of Object.entries(nonZero)) {
  console.log(`  ${table.padEnd(32)} ${n}`);
}
console.log(`\nusers: ${keys.userEmails.length}  posts: ${keys.postTitles.length}  tools: ${keys.toolSlugs.length}  notifications: ${keys.notificationDedupeKeys.length}  badges: ${keys.badgeLabels.length}`);
ok(`two machines matching "fingerprint: ${hash}" have identical logical data`);
