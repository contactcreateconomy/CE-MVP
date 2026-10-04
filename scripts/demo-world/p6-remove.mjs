#!/usr/bin/env node
/**
 * p6-remove.mjs — demo-world REMOVAL DRIVER (CR-011 §2): collectIds →
 * removeBatch per table (dependency order) → sweepBatch (job outputs) →
 * removalStatus (must be 0) → re-run settle jobs (projection repair).
 * Leaves the base seed untouched. NOT RUN until after the first approved
 * import (removal test, spec P6.5). */
import { convexRun } from "../lib/local-gate.mjs";

const run = (fn, args) => {
  const out = convexRun(`demoWorld/${fn.replace("/", ":")}`, JSON.stringify(args));
  try { return JSON.parse(out); } catch { return out; }
};

const ids = run("remove/collectIds", {});
console.log(`collected demo ids: ${ids.users.length} users, ${ids.posts.length} posts`);

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
    n = run("remove/removeBatch", { table, limit: 500 });
    deleted += n.deleted ?? 0;
  } while ((n.deleted ?? 0) > 0);
  console.log(`  ${table}: drained`);
}

const sweeps = ["threadStats", "activityLedger", "vibingTrends", "feedExplorationState", "legitimacyScores", "signalSummary", "recognitionEvents", "signalLedger"];
for (const kind of sweeps) {
  const s = run("remove/sweepBatch", { kind, userIds: ids.users, postIds: ids.posts });
  console.log(`  sweep ${kind}: ${JSON.stringify(s)}`);
}

const status = run("remove/removalStatus", {});
console.log(`removal complete — registry rows left: ${status.registryRows} (must be 0); registered deleted: ${deleted}`);
if (status.registryRows !== 0) process.exit(1);
console.log("next: re-run settle jobs (p6-settle.mjs) to repair projections, then pnpm seed:check");
