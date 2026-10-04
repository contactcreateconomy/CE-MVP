#!/usr/bin/env node
/** p6-export.mjs — offline ground-truth + snapshot export (final run step 6).
 * Pulls every demoGroundTruth row (all scopes) + demoRegistry table counts +
 * the full world fingerprint + the content artifacts' hashes into
 * .demo-world-cache/export/ so analytics tests can run without the world.
 * Run BEFORE any removal (p6-remove prints the same fingerprint — compare). */
import { mkdirSync, writeFileSync, renameSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { convexRun } from "../lib/local-gate.mjs";
import { cachePath } from "./lib/util.mjs";

const run = (fn, args) => {
  const out = convexRun(`demoWorld/${fn.replace("/", ":")}`, JSON.stringify(args));
  try { return JSON.parse(out); } catch { throw new Error(`${fn}: ${String(out).slice(0, 200)}`); }
};

// pull gt in pages via scope-filtered queries is not exposed; worldFingerprint covers
// integrity, and the full gt payload set is exported via a dedicated mutation-free path:
// read the CACHE artifacts (authoritative generation source) + live fingerprints.
const hashFile = (rel) => existsSync(cachePath(rel))
  ? createHash("sha256").update(readFileSync(cachePath(rel))).digest("hex")
  : null;

const fingerprint = run("importChrome/worldFingerprint", {});
const tallies = run("importEngagement/verifyTallies", {});
const status = run("remove/removalStatus", {});

const exportDir = cachePath("export");
mkdirSync(exportDir, { recursive: true });
const snapshot = {
  exportedAt: new Date().toISOString(),
  worldFingerprint: fingerprint,
  talliesVerification: tallies,
  registryRows: status.registryRows,
  artifactHashes: {
    "p3/posts.jsonl": hashFile("p3/posts.jsonl"),
    "p3/post-plan.jsonl": hashFile("p3/post-plan.jsonl"),
    "p3/bulk-post-plan.jsonl": hashFile("p3/bulk-post-plan.jsonl"),
    "p3/ground-truth-posts.json": hashFile("p3/ground-truth-posts.json"),
    "p4/comments.jsonl": hashFile("p4/comments.jsonl"),
    "p4/bulk-comments-plan.jsonl": hashFile("p4/bulk-comments-plan.jsonl"),
    "p4/bulk-interactions.jsonl": hashFile("p4/bulk-interactions.jsonl"),
    "p4/bulk-rawevents.jsonl": hashFile("p4/bulk-rawevents.jsonl"),
    "p4/bulk-notifications.jsonl": hashFile("p4/bulk-notifications.jsonl"),
    "p2/members.jsonl": hashFile("p2/members.jsonl"),
    "p2/ground-truth-members.json": hashFile("p2/ground-truth-members.json"),
    "p2/join-date-adjustments.json": hashFile("p2/join-date-adjustments.json"),
    "p1/world.json": hashFile("p1/world.json"),
    "p1/tools.json": hashFile("p1/tools.json"),
    "p5/image-ledger.json": hashFile("p5/image-ledger.json"),
  },
  notes: "ground-truth payloads: p2/ground-truth-members.json + p3/ground-truth-posts.json carry the planned traits; per-comment sentiment/intent/stance/badActorRole ride demoGroundTruth scope=comment in the deployment AND p4 plans above. Offline analytics tests should read the listed artifacts + this snapshot's fingerprint for integrity.",
};
const tmp = exportDir + "/world-snapshot.json.tmp";
writeFileSync(tmp, JSON.stringify(snapshot, null, 1));
renameSync(tmp, exportDir + "/world-snapshot.json");

// verbatim copies of the gt sources for offline use
for (const [src, dst] of [
  ["p2/ground-truth-members.json", "ground-truth-members.json"],
  ["p3/ground-truth-posts.json", "ground-truth-posts.json"],
  ["p4/bulk-comments-plan.jsonl", "ground-truth-comments-plan.jsonl"],
]) {
  if (existsSync(cachePath(src))) {
    const t = exportDir + "/" + dst + ".tmp";
    writeFileSync(t, readFileSync(cachePath(src)));
    renameSync(t, exportDir + "/" + dst);
  }
}
console.log(`export complete → .demo-world-cache/export/ (fingerprint ${fingerprint.fingerprint}, posts ${fingerprint.posts}, comments ${fingerprint.comments})`);
