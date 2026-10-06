#!/usr/bin/env node
/** merge-p2v.mjs — fill EMPTY member card fields from local-driver voice batches.
 * Fill-only (never overwrite real values), temp → rename. */
import { readFileSync, writeFileSync, readdirSync, renameSync, existsSync } from "node:fs";
import path from "node:path";
import { cachePath } from "./lib/util.mjs";

const art = cachePath("p2/members.jsonl");
const members = readFileSync(art, "utf8").trim().split("\n").map(JSON.parse);
const isShell = (m) => !m.name || !m.voice || !m.voice.sample || m.voice.sample.length < 20 || /^builder working in/.test(m.bio ?? "");

const cards = new Map();
if (existsSync(cachePath("local-out/p2v"))) {
  for (const f of readdirSync(cachePath("local-out/p2v")).sort()) {
    if (!f.endsWith(".jsonl")) continue;
    const text = readFileSync(path.join(cachePath("local-out/p2v"), f), "utf8");
    let rows;
    try { rows = JSON.parse(text); } catch {
      // line-delimited variant: one JSON object per line
      rows = text.trim().split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    }
    if (!Array.isArray(rows)) continue;
    for (const r of rows) if (r?.handle && r?.voice?.sample) cards.set(r.handle, r);
  }
}

let filled = 0, already = 0, missing = 0;
for (const m of members) {
  if (!isShell(m)) { already++; continue; }
  const c = cards.get(m.handle);
  if (!c) { missing++; continue; }
  if (!m.name && c.name) m.name = String(c.name).slice(0, 60);
  if (c.bio && /^builder working in|^\w+ working in|^b$/.test(m.bio ?? "") || !m.bio) m.bio = String(c.bio ?? m.bio).slice(0, 240);
  m.voice = c.voice ? { ...c.voice, sample: String(c.voice.sample ?? "").slice(0, 400) } : m.voice;
  if (c.avatarBrief && /^illustrated avatar/.test(m.avatarBrief ?? "")) m.avatarBrief = String(c.avatarBrief).slice(0, 140);
  filled++;
}
const tmp = art + ".tmp";
writeFileSync(tmp, members.map((m) => JSON.stringify(m)).join("\n") + "\n");
renameSync(tmp, art);
console.log(`p2v merge: ${filled} filled, ${already} already complete, ${missing} shells without a card (left as-is)`);
