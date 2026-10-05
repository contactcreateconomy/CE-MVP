#!/usr/bin/env node
/**
 * p6-remove.mjs — demo-world REMOVAL DRIVER (CR-011 §2): collectIds →
 * removeBatch per table (dependency order) → sweepBatch (job outputs) →
 * removalStatus (must be 0) → re-run settle jobs (projection repair).
 * Leaves the base seed untouched. NOT RUN until after the first approved
 * import (removal test, spec P6.5). */
import { rmSync, readFileSync } from "node:fs";
import { convexRun } from "../lib/local-gate.mjs";
import { cachePath } from "./lib/util.mjs";
import { worldFingerprint } from "./lib/fingerprint.mjs";

const run = (fn, args) => {
  const out = convexRun(`demoWorld/${fn.replace("/", ":")}`, JSON.stringify(args));
  try { return JSON.parse(out); } catch { return out; }
};

// collectIds is one paginated table per call — loop each to completion
const collect = (table) => {
  const ids = [];
  let cursor = null;
  for (;;) {
    const page = run("remove/collectIds", cursor ? { table, cursor } : { table });
    ids.push(...page.ids);
    if (page.isDone) break;
    cursor = page.continueCursor;
  }
  return ids;
};
let ids = { users: collect("users"), posts: collect("posts") };
if (!ids.users.length && !ids.posts.length) {
  // interrupted-run resume: registry already drained — reuse the persisted id sets
  try { ids = JSON.parse(readFileSync(cachePath("remove-ids.json"), "utf8")); console.log("ids from cache (registry drained)"); } catch {}
}
try { writeFileSync(cachePath("remove-ids.json"), JSON.stringify(ids)); } catch {}
console.log(`collected demo ids: ${ids.users.length} users, ${ids.posts.length} posts`);

// ── 0. world fingerprint BEFORE removal (replay proof) + storage purge ──
const preArg = process.argv.find((a) => a.startsWith('--fingerprint='));
const fp = preArg
  ? (() => { const snapshot = JSON.parse(readFileSync(cachePath("export/world-snapshot.json"), "utf8")); return snapshot.worldFingerprint; })()
  : worldFingerprint();
console.log(`worldFingerprint before removal: ${JSON.stringify(fp)}`);
let purged = { deleted: 0, missing: 0 };
let guardN = 0;
do {
  const p = run("importChrome/purgeDemoStorage", { limit: 200 });
  purged.deleted += p.deleted ?? 0;
  purged.missing += p.missing ?? 0;
  if ((p.deleted ?? 0) + (p.missing ?? 0) === 0) break;
  if (++guardN > 200) break; // ~40k files max — never spin
} while (true);
console.log(`storage purge: ${purged.deleted} deleted, ${purged.missing} already gone`);
// storage is purged, so the upload resume-markers describe files that no longer
// exist — drop them NOW (a later failed sweep must not leave stale markers that
// make a re-import skip every cover/avatar upload)
rmSync(cachePath("p5/upload-done.jsonl"), { force: true });
console.log("upload markers cleared (storage purged)");

const ORDER = [
  "rawEvents", "postDistributionBuckets",
  "commentReactions", "commentSaves", "commentContextSignals", "saves",
  "debateVotes", "listItemVotes", "toolRatings", "notifications",
  "commentScores", "comments",
  "postDistributionScores", "postRevisions", "postSeoMeta",
  "postReviews", "postCompares", "postSparks", "postDebates", "postLists",
  "postListItems", "postShowcases", "postHelps", "postNews",
  "posts", "tools", "users", "demoGroundTruth",
];
let deleted = 0;
for (const table of ORDER) {
  let n;
  do {
    n = run("remove/removeBatch", { table, limit: 200 }); // 500 timed out against the 224k-row registry at full-world scale
    deleted += n.deleted ?? 0;
  } while ((n.deleted ?? 0) > 0);
  console.log(`  ${table}: drained`);
}

const sweeps = ["threadStats", "activityLedger", "vibingTrends", "feedExplorationState", "legitimacyScores", "signalSummary", "recognitionEvents", "signalLedger"];
for (const kind of sweeps) {
  // chunked: the full id set (501 users + 1,500 posts) exceeds the Windows argv cap
  let del = 0;
  for (let i = 0; i < Math.max(ids.users.length, ids.posts.length, 1); i += 150) {
    const s = run("remove/sweepBatch", { kind, userIds: ids.users.slice(i, i + 25), postIds: ids.posts.slice(i, i + 25) });
    del += s.deleted ?? 0;
  }
  console.log(`  sweep ${kind}: ${JSON.stringify({ deleted: del })}`);
}

const status = run("remove/removalStatus", {});
console.log(`removal complete — registry rows left: ${status.registryRows} (must be 0); registered deleted: ${deleted}`);
if (status.registryRows !== 0) process.exit(1);
console.log("next: re-run settle jobs (p6-settle.mjs) to repair projections, then pnpm seed:check");
