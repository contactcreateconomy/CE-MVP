#!/usr/bin/env node
/** P2 — Casting Director: 500 member cards (lean). Skeleton deterministic, voice via LLM. */
import path from "node:path";
import { rng, pick, shuffle, readJson, writeCache, cacheExists, DAY } from "./lib/util.mjs";
import { chatJsonArray, pool, logStats, CONCURRENCY } from "./lib/llm.mjs";

const world = readJson(".demo-world-cache/p1/world.json");
const tools = readJson(".demo-world-cache/p1/tools.json");
const byNiche = {};
for (const t of tools) (byNiche[t.niche] ??= []).push(t);
// only usable tools (shutdowns/pivots excluded from tool-use lists)
const usable = tools.filter((t) => !/SHUT DOWN|PIVOT/i.test(t.whatItDoes));

const R = rng(20261004);
const TIERS = [["power", 20], ["regular", 80], ["occasional", 175], ["quiet", 225]];
const ROLES = ["creator", "freelancer", "learner", "builder", "agency", "hobbyist"];
const COUNTRIES = [
  ["United States", "America/New_York"], ["United States", "America/Chicago"], ["United States", "America/Los_Angeles"],
  ["Canada", "America/Toronto"], ["Brazil", "America/Sao_Paulo"], ["Mexico", "America/Mexico_City"], ["Argentina", "America/Argentina/Buenos_Aires"],
  ["United Kingdom", "Europe/London"], ["Ireland", "Europe/Dublin"], ["Germany", "Europe/Berlin"], ["France", "Europe/Paris"],
  ["Spain", "Europe/Madrid"], ["Portugal", "Europe/Lisbon"], ["Netherlands", "Europe/Amsterdam"], ["Poland", "Europe/Warsaw"],
  ["Ukraine", "Europe/Kyiv"], ["Sweden", "Europe/Stockholm"], ["Italy", "Europe/Rome"], ["Greece", "Europe/Athens"], ["Turkey", "Europe/Istanbul"],
  ["Nigeria", "Africa/Lagos"], ["Kenya", "Africa/Nairobi"], ["South Africa", "Africa/Johannesburg"], ["Egypt", "Africa/Cairo"],
  ["India", "Asia/Kolkata"], ["Pakistan", "Asia/Karachi"], ["Bangladesh", "Asia/Dhaka"], ["Indonesia", "Asia/Jakarta"],
  ["Philippines", "Asia/Manila"], ["Vietnam", "Asia/Ho_Chi_Minh"], ["Singapore", "Asia/Singapore"], ["Japan", "Asia/Tokyo"],
  ["South Korea", "Asia/Seoul"], ["China", "Asia/Shanghai"], ["Australia", "Australia/Sydney"], ["New Zealand", "Pacific/Auckland"],
  ["UAE", "Asia/Dubai"], ["Saudi Arabia", "Asia/Riyadh"], ["Israel", "Asia/Tel_Aviv"], ["Colombia", "America/Bogota"], ["Chile", "America/Santiago"],
];

// deterministic skeleton
const members = [];
const nichePool = [];
for (const n of world.niches) { const cnt = Math.round(n.weight * 500); for (let i = 0; i < cnt; i++) nichePool.push(n.slug); }
const shuffledNiches = shuffle(R, nichePool);
let idx = 0;
for (const [tier, count] of TIERS) {
  for (let i = 0; i < count; i++) {
    const niche = shuffledNiches[idx++ % shuffledNiches.length];
    const [country, timezone] = pick(R, COUNTRIES);
    const nicheTools = usable.filter((t) => t.niche === niche);
    const crossTools = usable.filter((t) => t.niche !== niche);
    const toolsUsed = shuffle(R, nicheTools).slice(0, 2 + Math.floor(R() * 4)).map((t) => t.slug)
      .concat(R() < 0.5 ? shuffle(R, crossTools).slice(0, 1).map((t) => t.slug) : []);
    members.push({
      handle: "", name: "", // filled by LLM
      email: "",
      country, timezone,
      nichePrimary: niche,
      nicheSecondary: R() < 0.35 ? pick(R, world.niches.filter((n) => n.slug !== niche)).slug : null,
      role: tier === "power" ? pick(R, ["creator", "freelancer", "builder", "agency"]) : pick(R, ROLES),
      expertiseLevel: tier === "power" ? pick(R, ["expert", "advanced"]) : tier === "regular" ? pick(R, ["advanced", "intermediate"]) : tier === "occasional" ? pick(R, ["intermediate", "beginner"]) : pick(R, ["beginner", "intermediate"]),
      yearsExperience: Math.max(0, Math.round((tier === "power" ? 5 + R() * 10 : tier === "regular" ? 3 + R() * 7 : R() * 5) * 10) / 10),
      toolsUsed: [...new Set(toolsUsed)].slice(0, 6),
      tier,
      joinOffsetMs: -Math.round((180 + R() * 0 + 0) * 0 + (180 * (0.1 + 0.9 * R())) * DAY) - (R() < 0.1 ? 0 : 0) - 60 * DAY, // -240d..-60d
      verified: R() < 0.9,
      hasAvatar: R() < 0.85,
      // temperament: 0..1, shapes comment mix downstream
      temperament: {
        agreeableness: Math.round(R() * 100) / 100,
        skepticism: Math.round(R() * 100) / 100,
        generosity: Math.round(R() * 100) / 100,
        contrarianism: Math.round(R() * 100) / 100,
      },
      voice: null, // filled by LLM
    });
  }
}

// bad actors (ground truth only): ring shares video niche; others spread
const gtBadActors = [];
const ringPool = shuffle(R, members.filter((m) => m.nichePrimary === "monetisation" && ["regular", "occasional"].includes(m.tier))).slice(0, 5);
ringPool.forEach((m, i) => gtBadActors.push({ handle: m.handle || `ring-${i}`, tier: m.tier, badActorRole: "upvote-ring", ringId: "ring-1" }));
const others = shuffle(R, members.filter((m) => m.tier !== "power" && !ringPool.includes(m))).slice(0, 10);
[["comment-farmer", 4], ["self-promoter", 3], ["troll", 3]].forEach(([role, n]) => {
  for (let i = 0; i < n; i++) gtBadActors.push({ handle: others.pop()?.handle ?? `${role}-${i}`, tier: "occasional", badActorRole: role });
});

// ── LLM voice pass, 20 per batch ─────────────────────────────────────
const BATCH = 20;
const batches = [];
for (let i = 0; i < members.length; i += BATCH) batches.push(members.slice(i, i + BATCH));

const voiceTasks = batches.map((batch, bi) => async () => {
  const rows = batch.map((m, i) => `${i}. ${m.role}/${m.nichePrimary}${m.nicheSecondary ? "+" + m.nicheSecondary : ""}/${m.country}/${m.expertiseLevel}/tier:${m.tier}/uses:${m.toolsUsed.join(",")}`).join("\n");
  const nicheNames = [...new Set(batch.map((m) => m.nichePrimary))].map((n) => `${n}: ${byNiche[n].map((t) => t.name).slice(0, 12).join(", ")}`).join("\n");
  const arr = await chatJsonArray([
    { role: "system", content: "You are a casting director for a realistic creator-community simulation. You invent people, not personas. Globally diverse REAL names matching each member's country. Never invent tools outside the provided lists." },
    { role: "user", content: `For each member, write a JSON row: {"i":<index>,"name":"<real human name typical of their country>","handle":"<unique lowercase handle, 4-16 chars, letters+digits+underscore, no tool names>","bio":"<1-2 sentences, specific, mentions what they make/sell>","voice":{"sentenceLength":"short|medium|long","formality":<1-5>,"humor":<0-3>,"emojiRate":<0-3>,"typoRate":<0-2>,"flavor":"<regional English flavour, e.g. 'plain international', 'british-lean', 'indian-english', 'casual US'>","signatureHabits":["<1-2 specific verbal habits>"]},"voiceSample":"<3 sentences in their voice about their work — this locks the voice>","avatarBrief":"<8-15 words: avatar illustration mood/subject, no real people photos>"}\n\nMembers:\n${rows}\n\nTools by niche:\n${nicheNames}\nReturn ONLY the JSON array of ${batch.length} rows.` },
  ], { maxTokens: 3500, temperature: 0.9 });
  arr.forEach((row) => {
    const m = batch[row.i];
    if (!m || !row.handle) return;
    m.name = String(row.name).slice(0, 60);
    m.handle = String(row.handle).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16);
    m.bio = String(row.bio).slice(0, 240);
    m.voice = { ...row.voice, sample: String(row.voiceSample).slice(0, 400) };
    m.avatarBrief = String(row.avatarBrief).slice(0, 140);
  });
  return arr.length;
});

console.log(`casting: ${members.length} members in ${batches.length} batches (concurrency ${Math.min(CONCURRENCY, batches.length)})`);
await pool(voiceTasks, Math.min(CONCURRENCY, 10), "casting batches");

// ── deterministic fixups + validation ────────────────────────────────
const seen = new Set();
const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "member";
for (const m of members) {
  if (!m.handle) m.handle = slugify(m.name || "member") + Math.floor(R() * 999);
  while (seen.has(m.handle)) m.handle = m.handle.slice(0, 13) + Math.floor(R() * 99);
  seen.add(m.handle);
  if (!m.voice) m.voice = { sentenceLength: "medium", formality: 3, humor: 1, emojiRate: 1, typoRate: 0, flavor: "plain international", signatureHabits: ["gets straight to the point"], sample: "" };
  if (!m.bio) m.bio = `${m.role} working in ${m.nichePrimary}.`;
  m.email = `${m.handle}@demo.createconomy.invalid`;
  m.toolsUsed = m.toolsUsed.filter((s) => usable.some((t) => t.slug === s)).slice(0, 6);
  if (!m.avatarBrief) m.avatarBrief = `illustrated avatar, ${m.nichePrimary} mood`;
}
// bad actor handles re-resolved after fixups
const gtMembers = members.map((m) => ({ handle: m.handle, tier: m.tier, temperament: m.temperament, niche: m.nichePrimary }));
// re-map ground-truth bad actors onto actual member handles by index stability:
// ringPool/others were member object references, so their .handle is now final.
const gtBadFinal = gtBadActors.filter((b) => b.handle && !b.handle.includes("-0") || true).map((b) => ({ ...b }));

// devtest enrichment plan (P3 will plan 5 posts for devtest)
writeCache("p2/members.jsonl", members.map((m) => JSON.stringify(m)).join("\n"));
writeCache("p2/ground-truth-members.json", gtMembers.map((m) => {
  const bad = gtBadFinal.find((b) => b.handle === m.handle);
  return { ...m, badActorRole: bad?.badActorRole ?? null, ringId: bad?.ringId ?? null };
}));
writeCache("p2/casting-summary.json", {
  total: members.length,
  tiers: Object.fromEntries(TIERS.map(([t, n]) => [t, members.filter((m) => m.tier === t).length])),
  niches: Object.fromEntries(world.niches.map((n) => [n.slug, members.filter((m) => m.nichePrimary === n.slug).length])),
  badActors: gtBadFinal.filter((b) => seen.has(b.handle)).length,
  verified: members.filter((m) => m.verified).length, hasAvatar: members.filter((m) => m.hasAvatar).length,
  uniqueHandles: seen.size, uniqueEmails: new Set(members.map((m) => m.email)).size,
});
const stats = logStats("casting");
console.log("casting summary:", readJson(".demo-world-cache/p2/casting-summary.json"));
export {};
