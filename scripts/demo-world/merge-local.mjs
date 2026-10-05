#!/usr/bin/env node
/** merge-local.mjs — merge sub-agent batch outputs into the phase artifact.
 * NEVER overwrites: reads existing artifact + all batch files, dedupes by ref,
 * writes <artifact>.tmp then renames. Skips refs already present (cache discipline). */
import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync } from "node:fs";
import path from "node:path";
import { cachePath } from "./lib/util.mjs";

const phase = process.argv[2] ?? "p3";
const OUT = cachePath(`local-out/${phase}`);

// combined plans: pilot + bulk (bulk files are optional so the pilot-only flow still works)
const jsonlSafe = (rel) => { try { return readFileSync(cachePath(rel), "utf8").trim().split("\n").filter(Boolean).map(JSON.parse); } catch { return []; } };
const PLANS3 = [...jsonlSafe("p3/post-plan.jsonl"), ...jsonlSafe("p3/bulk-post-plan.jsonl")];
const PLANS4 = [...jsonlSafe("p4/comments-plan.jsonl"), ...jsonlSafe("p4/bulk-comments-plan.jsonl")];

const CONFIG = {
  p3: {
    artifact: "p3/posts.jsonl",
    gt: "p3/ground-truth-posts.json",
    refOf: (r) => r.ref,
    toRow: (r) => {
      const p = PLANS3[Number(r.ref)];
      return { ref: Number(r.ref), title: r.title, body: r.body, extension: r.extension, author: p.author, type: p.type, dayOffsetMs: p.dayOffsetMs, cover: p.cover, toolRefs: p.toolRefs };
    },
  },
  p4: {
    artifact: "p4/comments.jsonl",
    refOf: (r) => r.ref,
    toRow: (r) => {
      const [pid, k] = r.ref.split(":");
      const planComments = PLANS4;
      const c = planComments.filter((x) => String(x.postI) === pid).sort((a,b)=>a.offsetMs-b.offsetMs)[Number(k)];
      if (!c) return null;
      return { ref: `${pid}:${k}`, postI: Number(pid), author: c.author, parentIdx: c.parentIdx, body: r.body, sentiment: c.sentiment, intent: c.intent, stance: c.stance, offsetMs: c.offsetMs, badActorRole: c.badActorRole ?? null, realism: "local" };
    },
    gtRow: null,
  },
};

const cfg = CONFIG[phase];
const existing = existsSync(cachePath(cfg.artifact)) ? readFileSync(cachePath(cfg.artifact), "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
const existingKeys = new Set(existing.map((r) => cfg.refOf(r)).filter((k) => k !== undefined).map(String));
const plan = phase === "p3" ? PLANS3 : null;
const gtOld = phase === "p3" && existsSync(cachePath(cfg.gt)) ? readJsonSafe(cfg.gt) : [];

let added = 0, skipped = 0, badJson = 0;
const newRows = [];
const outDirs = [OUT, OUT + "b"].filter((d) => existsSync(d));
const fList = outDirs.flatMap((d) => readdirSync(d).map((f) => d + "/" + f)).sort();
for (const fullPath of fList) {
  const f = fullPath.split("/").pop();
  if (!f.endsWith(".jsonl")) continue;
  let rows;
  try { rows = JSON.parse(readFileSync(fullPath, "utf8")); } catch {
    // line-delimited JSON fallback (some sub-agents write one object per line)
    try { rows = readFileSync(fullPath, "utf8").trim().split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)); } catch { badJson++; continue; }
  }
  for (const r of rows) {
    const key = String(cfg.refOf(r)); // batch agents echo string refs; artifact stores numbers — normalize for comparison
    if (key === "undefined") continue;
    if (existingKeys.has(key) || newRows.some((x) => String(cfg.refOf(x)) === key)) { skipped++; continue; }
    const row = cfg.toRow(r);
    if (!row || !row.body && !row.title) continue;
    newRows.push(row);
    existingKeys.add(key);
    added++;
  }
}
const all = [...existing, ...newRows];
if (phase === "p3") {
  // plan order (by ref) so every downstream index (postI, gt-by-i, cover plan) aligns
  all.sort((a, b) => (a.ref ?? 1e9) - (b.ref ?? 1e9));
}
const tmp = cachePath(cfg.artifact + ".tmp");
writeFileSync(tmp, all.map((r) => JSON.stringify(r)).join("\n") + "\n");
renameSync(tmp, cachePath(cfg.artifact));
if (phase === "p3") {
  const gtOldByI = new Map((Array.isArray(gtOld) ? gtOld : []).map((g) => [g.i, g]));
  const gtOut = all.filter((row) => row.ref !== undefined).map((row) => {
    const p = plan[row.ref];
    return gtOldByI.get(row.ref) ?? {
      i: row.ref, author: p.author, type: p.type, quality: p.quality, topic: p.topic, tools: p.toolRefs,
      cover: row.cover, dayOffsetMs: row.dayOffsetMs,
      ...(p.newsEvent ? { newsSource: p.newsEvent.url, newsAngle: p.newsEvent.angle } : {}),
      intendedReception: { great: "strong engagement", good: "some engagement", mediocre: "little engagement", poor: "mostly silence" }[p.quality],
    };
  });
  const gtTmp = cachePath(cfg.gt + ".tmp");
  writeFileSync(gtTmp, JSON.stringify(gtOut, null, 1));
  renameSync(gtTmp, cachePath(cfg.gt));
  const refs = all.filter((r) => r.ref !== undefined).map((r) => r.ref);
  const holes = refs.length ? refs.filter((r, i) => r !== refs[0] + i).length : 0;
  console.log(`p3 refs: ${refs.length} rows, range ${refs[0]}..${refs[refs.length - 1]}, ${holes} out-of-sequence`);
}
console.log(`merge ${phase}: +${added} added, ${skipped} already-present (cache), ${badJson} unreadable batches → artifact now ${all.length} rows`);

function readJsonSafe(rel) { try { return JSON.parse(readFileSync(cachePath(rel), "utf8")); } catch { return []; } }
