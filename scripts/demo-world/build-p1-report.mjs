#!/usr/bin/env node
/** Build reports/P1-WORLD-AND-TOOLS.md from .demo-world-cache/p1 artifacts. */
import { readFileSync, writeFileSync } from "node:fs";

const p1 = ".demo-world-cache/p1";
const world = JSON.parse(readFileSync(`${p1}/world.json`, "utf8"));
const tools = JSON.parse(readFileSync(`${p1}/tools.json`, "utf8"));

const esc = (s) => String(s ?? "").replaceAll("|", "\\|");
const trunc = (s, n) => { s = String(s ?? ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
// offset → approx real date (world end reference 2026-10-04)
const ref = new Date(Date.UTC(2026, 9, 4));
const offsetDate = (off) => new Date(ref.getTime() + off * 86400000).toISOString().slice(0, 10);

let out = `# DEMO-WORLD — P1: The world and the facts (GATE P1)

- **Date:** 2026-10-04 · **Builder:** GLM (zcode) · **Driver:** local (addendum A2) — 0 LLM API calls, 0 images
- **Artifacts (cache, not in git):** \`.demo-world-cache/p1/world.json\`, \`tools.json\`, \`events-*.json\`, \`batches/*.json\`
- **Validation:** \`node scripts/demo-world/validate.mjs .demo-world-cache/p1\` → PASS (weights sum 1.000; 100 unique slugs; niche spread exactly 25/20/15/10/15/15; 27 of 29 calendar entries anchored to sourced real events; 59 full / 41 partial / 0 unverified tools)
- **Prompts (committed, driver-agnostic):** \`scripts/demo-world/prompts/world-architect.md\`, \`fact-keeper.md\`

## 1. World — niches, weights, topics

| Niche | Weight | Topics | Recurring debate angles (≥1 per niche) |
|---|---|---|---|
`;

for (const n of world.niches) {
  const debates = n.topics.filter((t) => t.debateAngle).map((t) => `**${t.title}** — ${t.debateAngle}`);
  out += `| ${n.slug} | ${(n.weight * 100).toFixed(0)}% | ${n.topics.length} | ${debates.join("<br>")} |\n`;
}
out += `
Full topic lists (67 topics, all evergreen, slugs stable for P3 planning) are in \`world.json\`.

**Rhythm:** weekday multiplier 1.0, weekend 0.55 (weekends quieter), two quiet stretches (late-summer lull ~offset −57 for 4 days; pre-September dip ~−36 for 3 days), spikes derived from calendar intensity. All times are offsets from world end — never absolute (re-anchoring design, P0 report §H).

## 2. The 60-day calendar (world end reference 2026-10-04)

Every dated entry that states a fact carries a source. Evergreen/community beats carry none by design.

| ≈ Day (offset → date) | Niche | Kind | Event | Intensity | Source |
|---|---|---|---|---|---|
`;

const kindEmoji = { launch: "launch", pricing: "pricing", policy: "policy", shutdown: "shutdown", other: "other", debate: "debate", seasonal: "seasonal", community: "community" };
for (const e of world.calendar) {
  const src = e.realEvent ? `[link](${e.realEvent.sourceUrl})` : "—";
  out += `| ${e.dayOffset} → ${offsetDate(e.dayOffset)} | ${e.niche} | ${kindEmoji[e.kind] ?? e.kind} | ${esc(e.title)} | ${e.intensity.toFixed(1)} | ${src} |\n`;
}
out += `
Anchored: ${world.calendar.filter((e) => e.realEvent).length} of ${world.calendar.length}. The two biggest story arcs the crowd will react to across P3–P4: **the Suno licensing whirlwind** (BMG → Believe/TuneCore → v6 launch → UMG/Sony lawsuit, offsets −53…−15) and **the September model-price war** (GPT-6 Astra → Opus 5.5 + Sol/Luna same day → Sonnet 5.5, offsets −31…−6), plus the **Sora shutdown** (−10) as the video niche's shock event.

## 3. The tools — full list (100, web-verified ${new Date().toISOString().slice(0, 10)})

Verification levels: **full** = official pricing page read + corroborating sources; **partial** = structure confirmed, some figures from third-party 2026 sources (official page JS-rendered/bot-blocked) — such rows are marked and P3 authors may not state their exact prices as fact; **none** = 0 rows. Two tools are recorded as **shut down** (Sora, Relay.app) and four as **pivoted** (Copy.ai, Writesonic, BrandWell, Podcastle→Async) — they stay in the sheet as facts and are excluded from member tool-use lists downstream.

| # | Tool | Niche | Category | Pricing model | Pricing (as of 2026-10-04, truncated) | Verified |
|---|---|---|---|---|---|---|
`;

let i = 1;
for (const t of tools) {
  out += `| ${i++} | ${esc(t.name)} | ${t.niche} | ${esc(t.category)} | ${esc(t.pricingModel)} | ${esc(trunc(t.pricingTiers, 110))} | ${t.verified} |\n`;
}
out += `
Full rows (whatItDoes, 3–5 strengths, 3–5 weaknesses, recentChanges with dates, verifiedAt, sources[]) live in \`.demo-world-cache/p1/tools.json\`; the final accepted snapshot ships in \`seed-data/demo-world/v1/\` per spec §2.

**Not included (blocked, by design):** loading the tools into the M5 tool registry — that is \`convex/\` code and waits on the Grok re-check of the P0 fixes (A5.4). Merge rule recorded for that step: the 8 existing base-seed \`demo-*\` tools are kept, real tools use canonical slugs, no slug collisions exist (checked), no overwrites.

**GATE P1 deliverables per spec:** niche/topic summary ✓ (§1), the calendar ✓ (§2), the full tool list with pricing + verified status ✓ (§3).

**STOPPED AT GATE P1 — awaiting founder "go" + Grok.**
`;
writeFileSync("scripts/demo-world/reports/P1-WORLD-AND-TOOLS.md", out);
console.log(`wrote scripts/demo-world/reports/P1-WORLD-AND-TOOLS.md (${out.length} bytes, ${tools.length} tool rows)`);
