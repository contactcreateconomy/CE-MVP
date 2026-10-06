#!/usr/bin/env node
/** p3-bulk-plan.mjs — FINAL RUN bulk post plan (deterministic, seeded).
 * 1,250 NEW posts (refs 250..1499) on top of the pilot's 250 → 1,500 total.
 * Encodes the founder's final-run guarantees:
 *  - every active type ≥100 total (review 220, help 211, showcase 201, debate 206,
 *    spark 181, news 175, compare 160, list 146); locked types: none
 *  - time windows: ~3% last 24h (hot starters + 25 brand-new low-engagement),
 *    ~32% last 7d, ~35% 8-30d, ~30% 31-60d
 *  - tool lens: 10 deep tools (70% of review/compare refs) + tail coverage
 *  - debates: 60% lopsided (72-88%) / 40% close (45-55%)
 *  - helps: 45% resolved / 35% answered-unresolved / 20% unanswered
 *  - lists: 65% community_ranked / 35% static_creator
 *  - edge cases: very long + very short titles, 3 threads at 60-72 comments,
 *    ~20% zero-comment posts, devtest 8 posts (one per type)
 *  - covers: priority-ranked to 581 bulk adds (94 pilot → 675 = 45% of 1,500)
 *  - Rising cohort: 40 members re-dated to joined ≤25d with heavy recent activity
 * News angles cycle REAL sourced events only (calendar realEvent + events-*).
 * Output: p3/bulk-post-plan.jsonl (never overwrites the pilot plan). */
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { rng, pick, shuffle, cachePath, DAY } from "./lib/util.mjs";

const R = rng(712777);
const world = JSON.parse(readFileSync(cachePath("p1/world.json"), "utf8"));
const members = readFileSync(cachePath("p2/members.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const gtMembers = JSON.parse(readFileSync(cachePath("p2/ground-truth-members.json"), "utf8"));
const badByHandle = Object.fromEntries(gtMembers.filter((g) => g.badActorRole).map((g) => [g.handle, g]));
const tools = JSON.parse(readFileSync(cachePath("p1/tools.json"), "utf8"));
const pilotPlan = readFileSync(cachePath("p3/post-plan.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const byHandle = Object.fromEntries(members.map((m) => [m.handle, m]));

// ── niches & topics (weighted) ─────────────────────────────────────────
const niches = world.niches.map((n) => ({ slug: n.slug, weight: n.weight, topics: n.topics }));
const nichePick = () => {
  const total = niches.reduce((a, n) => a + n.weight, 0);
  let x = R() * total;
  for (const n of niches) { x -= n.weight; if (x <= 0) return n; }
  return niches[0];
};
const topicFor = (nicheSlug) => {
  const n = niches.find((x) => x.slug === nicheSlug) ?? nichePick();
  return pick(R, n.topics);
};

// ── news pool: real sourced events only ────────────────────────────────
const seen = new Set();
const newsPool = [];
const WORLD_END_REF = Date.parse(world.worldEndReference ?? "2026-10-04T12:00:00Z");
const addEvent = (title, url, dayOffset, niche, kind) => {
  const k = title.toLowerCase().slice(0, 40);
  if (seen.has(k) || !url) return;
  seen.add(k);
  newsPool.push({ title, url, dayOffset, niche, kind });
};
for (const c of world.calendar) {
  if (c.realEvent?.sourceUrl) addEvent(c.realEvent.title, c.realEvent.sourceUrl, c.dayOffset, c.niche, c.kind);
}
for (const f of ["events-media.json", "events-text.json"]) {
  for (const e of JSON.parse(readFileSync(cachePath(`p1/${f}`), "utf8"))) {
    const url = e.sourceUrl ?? e.url ?? (e.sources?.[0]?.url ?? null);
    if (!url) continue;
    // real date → offset from world end; never in the future
    const dayOffset = e.dayOffset ?? (e.date ? Math.round((Date.parse(e.date + "T12:00:00Z") - WORLD_END_REF) / DAY) : -(45 + Math.floor(R() * 30)));
    addEvent(e.title, url, Math.max(-59, Math.min(-1, dayOffset)), e.niche ?? pick(R, niches).slug, e.kind ?? "product");
  }
}
const NEWS_ANGLES = ["pricing impact", "migration options", "workflow change", "community reaction", "measured skepticism"];
if (newsPool.length < 20) { console.error(`news pool too small: ${newsPool.length}`); process.exit(1); }

// ── author pool (power/regular heavy; occasional sprinkle) ─────────────
const power = members.filter((m) => m.tier === "power");
const regular = members.filter((m) => m.tier === "regular");
const occasional = members.filter((m) => m.tier === "occasional");
const ringHandles = Object.entries(badByHandle).filter(([, b]) => b.badActorRole === "upvote-ring").map(([h]) => h);
const selfPromo = Object.entries(badByHandle).find(([, b]) => b.badActorRole === "self-promoter")?.[0];
const authorPick = () => {
  const x = R();
  if (x < 0.35) return pick(R, power);
  if (x < 0.80) return pick(R, regular);
  if (x < 0.97) return pick(R, occasional);
  return pick(R, members);
};

// ── Rising cohort: 40 good-standing members re-dated to recent joins ───
const risingPool = shuffle(R, members.filter((m) => !badByHandle[m.handle] && (m.tier === "power" || m.tier === "regular" || m.tier === "occasional"))).slice(0, 40);
const risingHandles = new Set(risingPool.map((m) => m.handle));
const joinAdjust = risingPool.map((m, i) => ({ handle: m.handle, joinOffsetMs: -(3 + Math.floor(R() * 22)) * DAY - Math.floor(R() * 20) * 3_600_000 }));
{
  const t = cachePath("p2/join-date-adjustments.json.tmp");
  writeFileSync(t, JSON.stringify(joinAdjust, null, 1));
  renameSync(t, cachePath("p2/join-date-adjustments.json"));
}

// ── tool lens ──────────────────────────────────────────────────────────
const refCount = new Map();
for (const p of pilotPlan) for (const s of p.toolRefs ?? []) refCount.set(s, (refCount.get(s) ?? 0) + 1);
const fullTools = tools.filter((t) => t.verified === "full");
const deep10 = [...fullTools].sort((a, b) => (refCount.get(b.slug) ?? 0) - (refCount.get(a.slug) ?? 0)).slice(0, 10);
const deepSet = new Set(deep10.map((t) => t.slug));
const tailTools = tools.filter((t) => !deepSet.has(t.slug));
const lensTool = (wantsDeep) => {
  if (wantsDeep && R() < 0.7) return pick(R, deep10).slug;
  return pick(R, R() < 0.5 ? tailTools : fullTools).slug;
};

// ── type quotas (adds on top of the pilot) ─────────────────────────────
const ADDS = { review: 175, help: 165, showcase: 170, debate: 180, spark: 150, news: 150, compare: 135, list: 125 };
const TOTAL_ADD = Object.values(ADDS).reduce((a, b) => a + b, 0); // 1250
const HOURS = (h) => h * 3_600_000;

// time bucket: returns dayOffsetMs
const timeFor = (band) => {
  if (band === "24h") return -(0.5 + R() * 23) * HOURS(1);
  if (band === "7d") return -(24 + R() * (7 * 24 - 24)) * HOURS(1);
  if (band === "30d") return -(7 + R() * 23) * DAY;
  return -(31 + R() * 29) * DAY;
};
const bandFor = () => { const x = R(); if (x < 0.03) return "24h"; if (x < 0.35) return "7d"; if (x < 0.70) return "30d"; return "60d"; };

const rows = [];
const push = (o) => rows.push(o);
let ref = 250;

// devtest: exactly 8 posts, one per type, spread over the last 30 days
{
  const types = Object.keys(ADDS);
  for (const [i, type] of types.entries()) {
    const n = nichePick();
    const t = topicFor(n.slug);
    const wantsTool = ["review", "compare"].includes(type);
    push({
      ref: ref++, author: "devtest", type, niche: n.slug, topic: t.slug, topicTitle: t.title,
      dayOffsetMs: -(28 - i * 3.4) * DAY - Math.floor(R() * 12) * HOURS(1),
      toolRefs: wantsTool ? [lensTool(true)] : [],
      quality: type === "spark" ? "good" : "good",
      cover: ["showcase", "review", "news"].includes(type),
      devtest: true,
      debateSplit: type === "debate" ? "close" : undefined,
      helpOutcome: type === "help" ? "resolved" : undefined,
      threadSize: type === "help" ? 5 : 3 + Math.floor(R() * 4),
      priority: 100,
    });
  }
}

// main fill
const longTitleTopics = niches.flatMap((n) => n.topics).filter((t) => t.title.length > 55);
const fill = [];
for (const [type, n] of Object.entries(ADDS)) {
  const skip = type === "review" ? 1 : type === "help" ? 1 : type === "showcase" ? 1 : type === "debate" ? 1 : type === "spark" ? 1 : type === "news" ? 1 : type === "compare" ? 1 : type === "list" ? 1 : 0;
  for (let i = skip; i < n; i++) fill.push(type);
}
shuffle(R, fill);

const qualityFor = () => { const x = R(); if (x < 0.12) return "great"; if (x < 0.57) return "good"; if (x < 0.85) return "mediocre"; return "poor"; };

for (const type of fill) {
  const band = bandFor();
  let dayOffsetMs = timeFor(band);
  let quality = qualityFor();
  let edge;
  let author = authorPick()?.handle;
  let niche = byHandle[author]?.nichePrimary ?? nichePick().slug;
  const t = topicFor(niche);

  // ring members own monetisation debates; self-promoter showcases
  if (type === "debate" && niche === "monetisation" && R() < 0.12) author = pick(R, ringHandles);
  if (type === "showcase" && selfPromo && R() < 0.03) author = selfPromo;

  // Rising cohort members post recently and often
  if (risingHandles.has(author) && band === "60d" && R() < 0.7) { dayOffsetMs = timeFor("7d"); }

  const wantsDeep = ["review", "compare"].includes(type);
  const toolRefs = [];
  if (wantsDeep) { toolRefs.push(lensTool(true)); if (R() < 0.35) toolRefs.push(lensTool(R() < 0.6)); }
  else if (R() < 0.15) toolRefs.push(lensTool(false));

  let newsEvent = null;
  if (type === "news") {
    const ev = newsPool[Math.floor(R() * newsPool.length)];
    const angle = NEWS_ANGLES[rows.filter((r) => r.type === "news").length % NEWS_ANGLES.length];
    newsEvent = { event: ev.title, url: ev.url, angle };
    niche = ev.niche ?? niche;
    let d = ev.dayOffset * DAY + (R() - 0.5) * 2 * DAY; // near the real event date
    if (d > -HOURS(1)) d = -(1 + R() * 10) * HOURS(1); // never future; at least 1h old
    dayOffsetMs = d;
  }

  let debateSplit;
  if (type === "debate") debateSplit = R() < 0.6 ? "lopsided" : "close";
  let helpOutcome;
  if (type === "help") { const x = R(); helpOutcome = x < 0.45 ? "resolved" : x < 0.80 ? "answered" : "unanswered"; }
  let listMode;
  if (type === "list") listMode = R() < 0.65 ? "community_ranked" : "static_creator";

  // engagement-based priority for cover ranking (proxy: quality × recency × type weight)
  const typeW = { showcase: 1.3, review: 1.25, news: 1.2, compare: 1.1, debate: 1.0, help: 0.9, list: 0.85, spark: 0.6 }[type];
  const recencyW = dayOffsetMs > -DAY ? 1.6 : dayOffsetMs > -7 * DAY ? 1.25 : 1;
  const qW = { great: 1.5, good: 1.0, mediocre: 0.6, poor: 0.3 }[quality];
  const priority = typeW * recencyW * qW * (0.8 + R() * 0.4);

  push({
    ref: ref++, author, type, niche, topic: t.slug, topicTitle: t.title,
    dayOffsetMs, toolRefs, quality, cover: false, // cover flags set later by priority cap
    newsEvent, debateSplit, helpOutcome, listMode, priority,
    band,
  });
}

// ── edge cases ─────────────────────────────────────────────────────────
// very long titles (3) and very short (3): retag specific rows
const editable = rows.filter((r) => !r.devtest);
for (const r of shuffle(R, editable.filter((x) => !["news"].includes(x.type))).slice(0, 3)) r.edgeTitle = "long";
for (const r of shuffle(R, editable.filter((x) => !x.edgeTitle && !["news"].includes(x.type))).slice(0, 3)) r.edgeTitle = "short";
// 3 mega-threads (60-72 comments): recent great debates/reviews
for (const r of shuffle(R, rows.filter((x) => !x.devtest && x.quality === "great" && ["debate", "review", "news"].includes(x.type) && x.dayOffsetMs > -10 * DAY)).slice(0, 3)) {
  r.threadSize = 60 + Math.floor(R() * 13);
}
// 25 brand-new low-engagement (exploration cue): posted in last 10h, mediocre, zero comments
const lowEng = rows.filter((r) => !r.devtest && !r.threadSize).slice(-25);
for (const r of lowEng) { r.dayOffsetMs = -(0.2 + R() * 9.5) * HOURS(1); r.quality = r.quality === "great" ? "good" : r.quality; r.threadSize = 0; r.brandNew = true; }
// ~20% zero-comment overall
const zeroCommentTarget = Math.round(rows.length * 0.2);
let zeroCount = rows.filter((r) => r.threadSize === 0).length;
for (const r of shuffle(R, rows.filter((x) => !x.threadSize && !x.devtest))) {
  if (zeroCount >= zeroCommentTarget) break;
  if (r.helpOutcome === "unanswered") continue;
  r.threadSize = 0; zeroCount++;
}

// ── covers by priority: 581 bulk adds (94 pilot → 675 = 45%) ────────────
const BULK_COVERS = 581;
const coverEligible = rows.filter((r) => {
  const heavy = ["showcase", "review", "news", "compare"].includes(r.type);
  return heavy ? R() < 0.92 : R() < 0.22; // ~90% heavy / ~20% light, then priority-ranked
});
coverEligible.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
for (const [i, r] of coverEligible.entries()) r.cover = i < BULK_COVERS;

const out = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
const tmp = cachePath("p3/bulk-post-plan.jsonl.tmp");
writeFileSync(tmp, out);
renameSync(tmp, cachePath("p3/bulk-post-plan.jsonl"));

// ── summary ────────────────────────────────────────────────────────────
const byType = {};
for (const r of rows) byType[r.type] = (byType[r.type] ?? 0) + 1;
const windows = { "24h": 0, "7d": 0, "30d": 0, "60d": 0 };
for (const r of rows) {
  const d = -r.dayOffsetMs;
  windows[d <= DAY ? "24h" : d <= 7 * DAY ? "7d" : d <= 30 * DAY ? "30d" : "60d"]++;
}
const covers = rows.filter((r) => r.cover).length;
const zeroC = rows.filter((r) => r.threadSize === 0).length;
const mega = rows.filter((r) => (r.threadSize ?? 0) >= 60).length;
console.log(JSON.stringify({
  rows: rows.length, refRange: [rows[0].ref, rows[rows.length - 1].ref],
  byType, windows, covers, zeroComment: zeroC, megaThreads: mega,
  devtestPosts: rows.filter((r) => r.devtest).length,
  risingCohort: joinAdjust.length, newsEvents: newsPool.length,
  authors: new Set(rows.map((r) => r.author)).size,
}, null, 1));
