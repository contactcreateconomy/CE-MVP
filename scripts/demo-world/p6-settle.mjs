#!/usr/bin/env node
/**
 * p6-settle.mjs — run the REAL projection jobs until their claim-queues
 * drain (spec: never write scores by hand). Also used post-removal as the
 * projection-repair pass. A platform job failing its own invariants (e.g.
 * recognition:rollup's by_user_window index misuse) is logged and skipped —
 * it must not abort the remaining loops (convexRun would process.exit). */
import { convex } from "../lib/local-gate.mjs";

const runOnce = (fn, args = "{}") => {
  const res = convex(["run", fn, args]);
  const teardownBug = /UV_HANDLE_CLOSING/.test(res.stderr ?? "") && (res.stdout ?? "").trim().length > 0;
  const out = (res.stdout ?? "").trim();
  const parsed = (() => { try { return JSON.parse(out.slice(out.indexOf("{"))); } catch { return null; } })();
  return { ok: (res.status === 0 || teardownBug) && parsed !== null, out, parsed };
};

const loops = [
  ["jobs/rank:recomputeDirtyBatch", 200], // 50/batch over dirty commentScores
  ["jobs/rank:decayLiveScores", 50],
  ["jobs/rank:distributionRecompute", 400], // 50/batch (computes ONLY the three scores from stored tallies)
  ["jobs/explore:explorationRefresh", 100],
  ["jobs/vibing:vibingCompute", 50],
  ["cards:refreshCards", 50],
  ["cards:heroStaleFill", 5],
  ["jobs/recognition:rollup", 10],
  ["jobs/legitimacy:recompute", 20], // 40 actors/run post-CAP-283 bound; 500 actors need 13 runs
  ["jobs/signalSummary:recompute", 10],
  ["jobs/might:reachRefresh", 5],
  ["jobs/might:mightRecompute", 10],
];
for (const [fn, max] of loops) {
  let last = { ok: false, out: "" };
  try {
    for (let i = 0; i < max; i++) {
      last = runOnce(fn);
      if (!last.ok) break;
      if (/0 (processed|recomputed|decayed|claimed|patched|refreshed|awarded)|"(processed|recomputed)":\s*0|nothing/i.test(last.out)) break;
    }
    console.log(last.ok ? `${fn}: settled (${last.out.slice(0, 100)})` : `${fn}: FAILED — ${last.out.slice(0, 160)}`);
  } catch (e) {
    console.log(`${fn}: THREW — ${String(e.message).slice(0, 160)}`);
  }
}
// tools aggregates: real recompute PER tool (v.id("tools") required — M5 R-AGG repair-only path)
{
  const toolIds = [];
  let cursor = null;
  for (let page = 0; page < 10; page++) {
    const r = runOnce("tools:list", JSON.stringify({ numItems: 200, ...(cursor ? { cursor } : {}) }));
    if (!r.ok || !r.parsed?.tools) { console.log(`tools:list: FAILED — ${r.out.slice(0, 120)}`); break; }
    for (const t of r.parsed.tools) if (t._id) toolIds.push(t._id);
    if (r.parsed.isDone || !r.parsed.continueCursor) break;
    cursor = r.parsed.continueCursor;
  }
  let ok = 0, fail = 0;
  for (const id of toolIds) {
    const r = runOnce("tools:recomputeAggregate", JSON.stringify({ toolId: id }));
    if (r.ok) ok++; else { fail++; if (fail <= 2) console.log(`tools:recomputeAggregate ${id}: FAILED — ${r.out.slice(0, 100)}`); }
  }
  console.log(`tools:recomputeAggregate: ${ok}/${toolIds.length} tools recomputed${fail ? `, ${fail} FAILED` : ""}`);
}
