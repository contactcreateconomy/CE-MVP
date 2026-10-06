#!/usr/bin/env node
/** P3 (pilot) — Editor-in-Chief plan (deterministic) + Author + Truth Checker + Realism Critic. ~250 posts. */
import { readFileSync } from "node:fs";
import { rng, pick, shuffle, readJson, writeCache, DAY, HOUR } from "./lib/util.mjs";
import { chat, chatJsonArray, pool, logStats } from "./lib/llm.mjs";

const world = readJson(".demo-world-cache/p1/world.json");
const tools = readJson(".demo-world-cache/p1/tools.json");
const members = readFileSync(".demo-world-cache/p2/members.jsonl", "utf8").trim().split("\n").map(JSON.parse);
const byHandle = Object.fromEntries(members.map((m) => [m.handle, m]));
const R = rng(33301);

// ── 1. plan (deterministic) ──────────────────────────────────────────
const active = [...shuffle(R, members.filter((m) => m.tier === "power")), ...shuffle(R, members.filter((m) => m.tier === "regular")).slice(0, 60), ...shuffle(R, members.filter((m) => m.tier === "occasional")).slice(0, 20)];
const TYPE_COUNTS = { help: 45, review: 45, showcase: 30, spark: 30, news: 25, debate: 25, compare: 25, list: 20 }; // =250
const QUALITY = [["great", 0.15], ["good", 0.45], ["mediocre", 0.30], ["poor", 0.10]];
const newsPool = [
  { title: "Sora's API is gone for good — what it means for video workflows", event: "OpenAI permanently shut down Sora 2 + Videos API", url: "https://help.openai.com", day: -10 },
  { title: "Suno v6 and the licensing dominoes: BMG, Believe, TuneCore", event: "Suno v6 launch on licensed catalogs", url: "https://suno.com/pricing", day: -25 },
  { title: "UMG x ElevenLabs: the first major-label AI music deal", event: "UMG and ElevenLabs multi-year licensing agreement", url: "https://elevenlabs.io", day: -24 },
  { title: "The September price war: Opus 5.5 and GPT-6 Sol/Luna cut API costs", event: "Opus 5.5 -20%, GPT-6 Sol/Luna ~-50%", url: "https://www.anthropic.com/news/claude-opus-5-5", day: -12 },
  { title: "Sonnet 5.5 lands: 30% faster at the same token price", event: "Claude Sonnet 5.5 release", url: "https://www.anthropic.com/news", day: -6 },
  { title: "ElevenLabs doubles to a $22B valuation", event: "$300M tender offer at $22B", url: "https://biz.chosun.com", day: -4 },
  { title: "GitHub Copilot can now use your desktop", event: "Copilot computer use", url: "https://github.blog/changelog/", day: -3 },
  { title: "Copilot kills four models including Claude Opus 4.7", event: "Copilot model deprecations", url: "https://github.blog/changelog/2026-10-02-selected-models-in-github-copilot-deprecated/", day: -2 },
  { title: "Suno is being sued by UMG and Sony over v6", event: "~$9B lawsuit targeting Suno v6", url: "https://theblitz.com", day: -15 },
  { title: "Eleven v4: the most emotive voice model yet", event: "ElevenLabs Eleven v4 release", url: "https://elevenlabs.io", day: -6 },
  { title: "Filmora 16 adds camera tracking and 360 reframing", event: "Filmora 16.0 release", url: "https://filmora.wondershare.com/whats-new-in-filmora-video-editor.html", day: -11 },
  { title: "Synthesia ships AI b-roll free on all plans", event: "Synthesia AI Assistant b-roll", url: "https://www.synthesia.io", day: -19 },
  { title: "ElevenLabs Music v2.5 becomes the default", event: "Music v2.5 release", url: "https://elevenlabs.io", day: -20 },
  { title: "Runway's Solaris points past video into world models", event: "Runway Solaris research preview", url: "https://runway.com/research", day: -34 },
  { title: "GPT-6 Astra starts rolling out", event: "GPT-6 Astra staged rollout", url: "https://fortune.com/2026/09/03/openai-debuts-gpt-6-astra-computer-use-greg-brockman-says-start-of-agi/", day: -31 },
];
const plan = [];
const typeQueue = [];
for (const [t, n] of Object.entries(TYPE_COUNTS)) for (let i = 0; i < n; i++) typeQueue.push(t);
shuffle(R, typeQueue);
let newsIdx = 0;
const devtestPosts = ["help", "spark", "showcase", "debate", "list"];
for (const t of devtestPosts) plan.push({ author: "devtest", type: t });

const qualityFor = () => { const x = R(); let acc = 0; for (const [q, w] of QUALITY) { acc += w; if (x < acc) return q; } return "mediocre"; };
const nicheOf = (m) => world.niches.find((n) => n.slug === (m ? m.nichePrimary : pick(R, world.niches).slug));
for (const type of typeQueue.slice(0, 250 - devtestPosts.length)) {
  // power users produce most posts; quiet almost none (quiet excluded from active pool)
  const author = pick(R, active);
  const niche = nicheOf(author);
  const topic = pick(R, niche.topics);
  const day = -Math.floor(R() * 7); // last 7 world days
  const hour = Math.floor(6 + R() * 16);
  const memberTools = author.toolsUsed.length ? author.toolsUsed : [pick(R, tools).slug];
  let toolRefs = [];
  if (type === "review") toolRefs = [pick(R, memberTools)];
  else if (type === "compare") toolRefs = shuffle(R, memberTools).slice(0, 2 + (R() < 0.4 ? 1 : 0));
  else if (["showcase", "help", "list"].includes(type)) toolRefs = shuffle(R, memberTools).slice(0, 1 + Math.floor(R() * 2));
  else if (type === "spark" && R() < 0.4) toolRefs = [pick(R, memberTools)];
  const coverChance = { showcase: 0.7, news: 0.65, review: 0.5, compare: 0.45, list: 0.35, debate: 0.2, help: 0.15, spark: 0.1 }[type];
  plan.push({
    author: author.handle, type, niche: niche.slug, topic: topic.slug, topicTitle: topic.title,
    dayOffsetMs: day * DAY - hour * HOUR, toolRefs, quality: qualityFor(), cover: R() < coverChance,
  });
}
// devtest plan entries get minimal fields
for (const p of plan.filter((p) => p.author === "devtest")) {
  const niche = pick(R, world.niches); const topic = pick(R, niche.topics);
  Object.assign(p, { niche: niche.slug, topic: topic.slug, topicTitle: topic.title, dayOffsetMs: -Math.floor(R() * 7) * DAY - Math.floor(6 + R() * 16) * HOUR, toolRefs: [], quality: "good", cover: R() < 0.4 });
}
writeCache("p3/post-plan.jsonl", plan.map((p) => JSON.stringify(p)).join("\n"));
console.log(`plan: ${plan.length} posts (devtest: ${plan.filter((p) => p.author === "devtest").length})`);

// ── 2. author + truth + realism per post ─────────────────────────────
const factRows = Object.fromEntries(tools.map((t) => [t.slug, t]));
const excerpt = (slugs) => slugs.map((s) => {
  const t = factRows[s]; if (!t) return null;
  return `${t.name} (${t.niche}; ${t.category}; pricing: ${t.pricingTiers.slice(0, 180)}; pricingVerified=${t.verified}; strengths: ${t.strengths.slice(0, 3).join("; ")}; weaknesses: ${t.weaknesses.slice(0, 3).join("; ")})`;
}).filter(Boolean).join("\n");

const STRUCT = {
  review: 'review: {"toolId":"<slug>","score":<1-5 int>,"pros":["3-5 short"],"cons":["3-5 short"],"verdictSummary":"1 sentence"}',
  compare: 'compare: {"toolIds":["a","b"(,"c")],"criteria":["3-5"],"winner":"<slug>|depends","reasoning":"2-3 sentences"}',
  debate: 'debate: {"proposition":"one arguable sentence","stance":"agree|disagree|mixed"}',
  help: 'help: {"problemStatement":"specific problem incl. tool+setup+what you tried"}',
  list: 'list: {"mode":"community_ranked|static_creator","intro":"1 sentence","items":["5-8 items, each <=200 chars"]}',
  showcase: 'showcase: {"theThing":"what you made","projectUrl":null}',
  spark: 'spark: {"statement":"<=280 chars take"}',
  news: 'news: {"eventTitle":"<the real event>","keyClaims":["2-4 factual claims from the event ONLY"]}',
};

const titlesSoFar = [];
const tasks = plan.map((p, i) => async () => {
  const m = byHandle[p.author] ?? { handle: "devtest", name: "Devtest", role: "creator", nichePrimary: p.niche, toolsUsed: [], voice: { sentenceLength: "medium", formality: 3, humor: 1, emojiRate: 0, typoRate: 0, flavor: "plain international", signatureHabits: ["plain, direct"], sample: "I build small things and write about what breaks. Testing this community out." }, expertiseLevel: "intermediate", temperament: { agreeableness: 0.6, skepticism: 0.4, generosity: 0.5, contrarianism: 0.3 } };
  const newsItem = p.type === "news" ? newsPool[newsIdx++ % newsPool.length] : null;
  const facts = excerpt([...new Set([...p.toolRefs, ...(p.type === "news" ? [] : [])])]);
  const qualityNote = { great: "This is one of your best posts: specific, useful, well-structured.", good: "A solid, normal post.", mediocre: "Mediocre: somewhat vague, low effort, generic — but still a real post a busy person would dash off.", poor: "Genuinely poor: vague, low-effort, rambling or too short to be useful. Real people post like this sometimes." }[p.quality];
  const aiTells = 'BANNED AI-TELLS (any = reject): "delve", "game-changer", "game changer", "in today\'s", "fast-paced", "unlock", "elevate", "Great question", "Here\'s the thing", em-dash chains, "—" between clauses more than once, tidy three-part lists everywhere, a closing summary line, "dive into", "let\'s explore".';
  const noUrl = "NEVER include URLs, domains, www, or 'dot com' in title/body. No markdown links.";
  const voiceLine = `VOICE (match exactly): ${m.voice.sentenceLength} sentences, formality ${m.voice.formality}/5, humor ${m.voice.humor}/3, emoji ${m.voice.emojiRate}/3 (0-1 emoji max, only if rate>=2), typos ${m.voice.typoRate}/2 (occasional missing comma/apostrophe only if rate>=1, never in tool names), flavour: ${m.voice.flavor}. Signature habits: ${(m.voice.signatureHabits ?? []).join("; ")}. Sample of the voice: "${m.voice.sample}"`;

  const authorPrompt = [
    { role: "system", content: "You ARE this community member writing a forum post in their own voice. You are not an assistant. No preamble, no sign-off." },
    { role: "user", content: `Write a ${p.type.toUpperCase()} post for a creator forum.\nTopic: ${p.topicTitle} (${p.niche} niche)\nMember: ${m.role}, ${m.expertiseLevel}, ${m.yearsExperience}y experience, from ${m.country}.\n${voiceLine}\n${qualityNote}\n${facts ? `TOOL FACTS (the ONLY facts you may state; if pricingVerified!=full, do NOT state exact prices as fact — speak from experience instead):\n${facts}` : "No tool facts involved."}\n${newsItem ? `NEWS EVENT (report/discuss ONLY this real event; do not invent details):\n${newsItem.event}\nsource: ${newsItem.url}` : ""}\nStructure — return JSON: {"title":"<plain title, no clickbait patterns>","body":"<the post text, plain paragraphs, \\n between>","extension":${STRUCT[p.type]}}\nLength: ${p.type === "spark" ? "statement only" : p.quality === "poor" || p.quality === "mediocre" ? "short (30-120 words)" : p.quality === "good" ? "medium (120-350 words)" : "substantial (300-700 words)"}.\nTitles must not follow one pattern; vary style. ${noUrl} ${aiTells}` },
  ];
  let post = await chatJsonArray(authorPrompt, { maxTokens: 1400, temperature: 0.9 }).then((a) => Array.isArray(a) ? a[0] : a).catch(() => null);
  if (!post?.title || !post?.body) return null;

  // truth check (posts referencing tools or news)
  if (p.toolRefs.length || p.type === "news") {
    const truth = await chat([
      { role: "system", content: "You are a strict fact checker. Opinions are fine; invented facts are not." },
      { role: "user", content: `Post:\nTITLE: ${post.title}\nBODY: ${post.body.slice(0, 2500)}\n${facts ? `ALLOWED FACTS:\n${facts}` : ""}${newsItem ? `\nEVENT (only allowable news basis):\n${newsItem.event}\n${newsItem.url}` : ""}\nList every factual claim about tools/pricing/events. For each: SUPPORTED / UNSUPPORTED / OPINION. If any UNSUPPORTED claim exists, rewrite ONLY those sentences into clearly personal experience or remove them, and return JSON: {"verdict":"pass|rewritten","rewrittenBody":"<full body with fixes>","claims":[{"claim":"...","status":"..."}]}. Otherwise {"verdict":"pass","claims":[...]}.` },
    ], { maxTokens: 1200, temperature: 0.2 }).then((t) => { try { return JSON.parse(t.replace(/```(?:json)?/g, "").trim()); } catch { return { verdict: "pass" }; } });
    if (truth?.verdict === "rewritten" && truth.rewrittenBody) post.body = truth.rewrittenBody;
    post._truth = truth?.claims?.length ?? 0;
  }

  // realism critic (independent)
  const critic = await chat([
    { role: "system", content: "You are a harsh realism editor for a community simulation. You reject AI-sounding text." },
    { role: "user", content: `VOICE SAMPLE: "${m.voice.sample}"\nPOST:\n${post.title}\n${post.body.slice(0, 2200)}\nRecent titles for duplicate-pattern check: ${titlesSoFar.slice(-25).join(" | ")}\nReject if: any banned AI-tell (${aiTells.replace(/^BANNED AI-TELLS \(any = reject\): /, "")}), voice drift from the sample, title follows the same pattern as several recent titles, or body feels GPT-generated. Return JSON: {"verdict":"accept|reject","fix":"<if reject: one-line reason>"}` },
  ], { maxTokens: 300, temperature: 0.2 }).then((t) => { try { return JSON.parse(t.replace(/```(?:json)?/g, "").trim()); } catch { return { verdict: "accept" }; } });
  post._realism = critic?.verdict ?? "accept";
  if (post._realism === "reject") {
    const retry = await chatJsonArray([...authorPrompt, { role: "user", content: `Previous draft was rejected by the realism editor: "${critic?.fix ?? "too AI-sounding"}". Rewrite it — looser, more human, keep the structure.` }], { maxTokens: 1400, temperature: 1.0 }).then((a) => Array.isArray(a) ? a[0] : a).catch(() => null);
    if (retry?.title && retry?.body) { post = { ...retry, _realism: "accept-after-regen", _truth: post._truth }; }
  }
  titlesSoFar.push(post.title);

  const gt = { i, author: p.author, type: p.type, quality: p.quality, topic: p.topic, tools: p.toolRefs, cover: p.cover, dayOffsetMs: p.dayOffsetMs, intendedReception: { great: "strong engagement", good: "some engagement", mediocre: "little engagement", poor: "mostly silence" }[p.quality] };
  if (newsItem) Object.assign(gt, { newsSource: newsItem.url, newsEvent: newsItem.event });
  return { ...post, _plan: p, _gt: gt };
});

const results = (await pool(tasks, 8, "posts")).filter(Boolean);
writeCache("p3/posts.jsonl", results.map((r) => JSON.stringify({ title: r.title, body: r.body, extension: r.extension, author: r._plan.author, type: r._plan.type, dayOffsetMs: r._plan.dayOffsetMs, cover: r._plan.cover, toolRefs: r._plan.toolRefs })).join("\n"));
writeCache("p3/ground-truth-posts.json", results.map((r) => r._gt));
const byType = {}; results.forEach((r) => byType[r._plan.type] = (byType[r._plan.type] ?? 0) + 1);
const byQ = {}; results.forEach((r) => byQ[r._plan.quality] = (byQ[r._plan.quality] ?? 0) + 1);
writeCache("p3/posts-summary.json", { total: results.length, byType, byQuality: byQ, covers: results.filter((r) => r._plan.cover).length, realismRejects: results.filter((r) => r._realism === "accept-after-regen").length, truthChecks: results.filter((r) => r._truth !== undefined).length });
logStats("p3");
console.log("posts summary:", JSON.stringify(readJson(".demo-world-cache/p3/posts-summary.json")));
export {};
