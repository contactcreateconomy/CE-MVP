#!/usr/bin/env node
/**
 * p6-settle.mjs — run the REAL projection jobs until their claim-queues
 * drain (spec: never write scores by hand). Also used post-removal as the
 * projection-repair pass. NOT RUN until after an approved import. */
import { convexRun } from "../lib/local-gate.mjs";

const run = (fn) => {
  // plain name form — the CLI resolves internal functions without the internal. prefix
  const out = convexRun(fn, "{}");
  return out.trim().slice(0, 200);
};

const loops = [
  ["jobs/rank:recomputeDirtyBatch", 200], // 50/batch over ~45k commentScores
  ["jobs/rank:decayLiveScores", 50],
  ["jobs/rank:distributionRecompute", 400], // 50/batch over ~5k posts (computes ONLY the three scores from stored tallies)
  ["jobs/explore:explorationRefresh", 100],
  ["jobs/vibing:vibingCompute", 50],
  ["cards:refreshCards", 50],
  ["cards:heroStaleFill", 5],
  ["jobs/recognition:rollup", 10],
  ["jobs/legitimacy:recompute", 10],
  ["jobs/signalSummary:recompute", 10],
  ["jobs/might:reachRefresh", 5],
  ["jobs/might:mightRecompute", 10],
];
for (const [fn, max] of loops) {
  let last = "";
  for (let i = 0; i < max; i++) {
    last = run(fn);
    if (/0 (processed|recomputed|decayed|claimed|patched|refreshed|awarded)|"processed":0|nothing/i.test(last)) break;
  }
  console.log(`${fn}: settled (${last.slice(0, 80)})`);
}
// tools aggregates: real recompute per imported tool (M5 R-AGG repair-only path)
const toolsOut = convexRun("tools:recomputeAggregate", "{}");
console.log("tools.recomputeAggregate:", toolsOut.trim().slice(0, 120));
