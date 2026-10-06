#!/usr/bin/env node
/**
 * demo-world P1 validator — enforces the world-architect + fact-keeper
 * output contracts (scripts/demo-world/prompts/*.md) on the assembled
 * artifacts. Run: node scripts/demo-world/validate.mjs [cacheDir]
 * Exit 0 = valid; non-zero with a violation list otherwise.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const cacheDir = path.resolve(process.argv[2] ?? ".demo-world-cache/p1");
const problems = [];
const ok = (m) => console.log(`  [ok] ${m}`);
const bad = (m) => problems.push(m);

const NICHES = ["video", "writing", "design", "audio", "automation", "monetisation"];
const WEIGHTS = { video: 0.25, writing: 0.2, design: 0.15, audio: 0.1, automation: 0.15, monetisation: 0.15 };

// ── world.json ─────────────────────────────────────────────────────────
const worldPath = path.join(cacheDir, "world.json");
if (!existsSync(worldPath)) {
  bad(`world.json missing at ${worldPath}`);
} else {
  const world = JSON.parse(readFileSync(worldPath, "utf8"));
  const niches = world.niches ?? [];
  if (niches.length !== 6) bad(`expected 6 niches, got ${niches.length}`);
  let weightSum = 0;
  const topicSlugs = new Set();
  for (const n of niches) {
    if (!NICHES.includes(n.slug)) bad(`unknown niche ${n.slug}`);
    weightSum += n.weight ?? 0;
    const t = n.topics ?? [];
    if (t.length < 8 || t.length > 15) bad(`${n.slug}: topic count ${t.length} outside 8–15`);
    let debates = 0;
    for (const topic of t) {
      if (topicSlugs.has(topic.slug)) bad(`duplicate topic slug ${topic.slug}`);
      topicSlugs.add(topic.slug);
      if (topic.debateAngle) debates += 1;
    }
    if (debates < 1) bad(`${n.slug}: no contested debateAngle among topics`);
  }
  if (Math.abs(weightSum - 1) > 0.001) bad(`weights sum ${weightSum.toFixed(4)} ≠ 1.000`);
  ok(`world: 6 niches, ${topicSlugs.size} topics, weights sum ${weightSum.toFixed(3)}`);

  const cal = world.calendar ?? [];
  if (cal.length < 6) bad(`calendar has ${cal.length} entries (<6)`);
  let anchored = 0;
  for (const e of cal) {
    if (!Number.isInteger(e.dayOffset) || e.dayOffset > 0 || e.dayOffset < -59)
      bad(`calendar dayOffset ${e.dayOffset} outside [-59, 0]`);
    if (e.realEvent) {
      anchored += 1;
      if (!/^https?:\/\//.test(e.realEvent.sourceUrl ?? "")) bad(`calendar entry "${e.title}" has realEvent without sourceUrl`);
    }
  }
  if (anchored < 2) bad(`only ${anchored} calendar entries anchored to real events (need ≥2)`);
  ok(`world: ${cal.length} calendar entries, ${anchored} anchored to sourced real events`);
  const r = world.rhythm ?? {};
  if (!r.weekday || !r.weekend || r.weekend >= r.weekday) bad("rhythm: weekend must be < weekday");
}

// ── tools.json ─────────────────────────────────────────────────────────
const toolsPath = path.join(cacheDir, "tools.json");
if (!existsSync(toolsPath)) {
  bad(`tools.json missing at ${toolsPath}`);
} else {
  const tools = JSON.parse(readFileSync(toolsPath, "utf8"));
  if (Math.abs(tools.length - 100) > 5) bad(`tool count ${tools.length} outside 100±5`);
  const slugs = new Set();
  const byNiche = {};
  for (const t of tools) {
    if (slugs.has(t.slug)) bad(`duplicate tool slug ${t.slug}`);
    slugs.add(t.slug);
    if (!NICHES.includes(t.niche)) bad(`${t.slug}: niche "${t.niche}" invalid`);
    byNiche[t.niche] = (byNiche[t.niche] ?? 0) + 1;
    if (!/^https?:\/\//.test(t.officialUrl ?? "")) bad(`${t.slug}: officialUrl missing/invalid`);
    for (const f of ["name", "category", "whatItDoes", "pricingModel", "pricingTiers", "verified", "verifiedAt"]) {
      if (!t[f]) bad(`${t.slug}: field ${f} empty`);
    }
    if ((t.strengths ?? []).length < 3 || (t.strengths ?? []).length > 5) bad(`${t.slug}: strengths ${t.strengths?.length} outside 3–5`);
    if ((t.weaknesses ?? []).length < 3 || (t.weaknesses ?? []).length > 5) bad(`${t.slug}: weaknesses ${t.weaknesses?.length} outside 3–5`);
    if (t.verified === "full" && (t.sources ?? []).length < 1) bad(`${t.slug}: verified=full but no sources`);
    if (t.verified === "full" && /^unverified/i.test(t.pricingTiers ?? "")) bad(`${t.slug}: verified=full but pricingTiers unverified`);
  }
  for (const n of NICHES) {
    const share = (byNiche[n] ?? 0) / tools.length;
    const target = WEIGHTS[n];
    if (Math.abs(share - target) > 0.03) bad(`${n}: share ${(share * 100).toFixed(1)}% vs target ${(target * 100).toFixed(0)}% (±3)`);
  }
  const full = tools.filter((t) => t.verified === "full").length;
  const partial = tools.filter((t) => t.verified === "partial").length;
  const none = tools.filter((t) => t.verified === "none").length;
  ok(`tools: ${tools.length} rows, ${full} full / ${partial} partial / ${none} none verified, ${slugs.size} unique slugs`);
  console.log(`       niche spread: ${NICHES.map((n) => `${n}=${byNiche[n] ?? 0}`).join(" · ")}`);
}

// ── verdict ────────────────────────────────────────────────────────────
if (problems.length) {
  console.error(`\n  ✗ ${problems.length} violation(s):`);
  for (const p of problems) console.error(`    - ${p}`);
  process.exit(1);
}
console.log("\n  ✓ P1 artifacts valid (world.json + tools.json contracts hold)");
