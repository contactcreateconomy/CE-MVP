/** Finish the demo-world removal sweeps + status gate (tolerant per-call loop —
 * a single flaky CLI call no longer kills the whole removal). Ids come from
 * .demo-world-cache/remove-ids.json (persisted by p6-remove before draining). */
import { readFileSync } from "node:fs";
import { convex } from "../lib/local-gate.mjs";

const runOnce = (fn, args = "{}") => {
  const res = convex(["run", fn, args]);
  const teardownBug = /UV_HANDLE_CLOSING/.test(res.stderr ?? "") && (res.stdout ?? "").trim().length > 0;
  const out = (res.stdout ?? "").trim();
  const parsed = (() => { try { return JSON.parse(out.slice(out.indexOf("{"))); } catch { return null; } })();
  return { ok: (res.status === 0 || teardownBug) && parsed !== null, out, parsed };
};

const ids = JSON.parse(readFileSync(".demo-world-cache/remove-ids.json", "utf8"));
console.log(`sweep driver: ${ids.users.length} users, ${ids.posts.length} posts`);
const sweeps = ["threadStats", "activityLedger", "vibingTrends", "feedExplorationState", "legitimacyScores", "signalSummary", "recognitionEvents", "signalLedger"];
for (const kind of sweeps) {
  let del = 0, fails = 0;
  for (let i = 0; i < Math.max(ids.users.length, ids.posts.length, 1); i += 25) {
    const args = JSON.stringify({ kind, userIds: ids.users.slice(i, i + 25), postIds: ids.posts.slice(i, i + 25) });
    let r = runOnce("demoWorld/remove:sweepBatch", args);
    if (!r.ok) r = runOnce("demoWorld/remove:sweepBatch", args); // one retry for flaky teardown
    if (r.ok) del += r.parsed.deleted ?? 0; else { fails++; console.log(`  ${kind} chunk@${i} FAILED — ${r.out.slice(0, 90)}`); }
  }
  console.log(`sweep ${kind}: deleted ${del}${fails ? `, ${fails} FAILED CHUNKS` : ""}`);
}
const status = runOnce("demoWorld/remove:removalStatus");
console.log(`removalStatus: ${status.out.slice(0, 200)}`);
