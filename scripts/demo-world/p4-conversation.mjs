#!/usr/bin/env node
/** P4 (pilot) — Crowd Simulator (deterministic) + Commenter (LLM). ~2,500 comments, 7 world-days. */
import { readFileSync } from "node:fs";
import { rng, pick, shuffle, readJson, writeCache, DAY, HOUR } from "./lib/util.mjs";
import { chat, chatJsonArray, pool, logStats } from "./lib/llm.mjs";

const world = readJson(".demo-world-cache/p1/world.json");
const tools = readJson(".demo-world-cache/p1/tools.json");
const factRows = Object.fromEntries(tools.map((t) => [t.slug, t]));
const members = readFileSync(".demo-world-cache/p2/members.jsonl", "utf8").trim().split("\n").map(JSON.parse);
const gtMembers = readJson(".demo-world-cache/p2/ground-truth-members.json");
const badByHandle = Object.fromEntries(gtMembers.filter((g) => g.badActorRole).map((g) => [g.handle, g]));
const byHandle = Object.fromEntries(members.map((m) => [m.handle, m]));
const gtDevtest = { handle: "devtest", tier: "power", niche: "monetisation", temperament: { agreeableness: 0.6, skepticism: 0.5, generosity: 0.6, contrarianism: 0.3 }, badActorRole: null };
const gtOf = (h) => badByHandle[h] ?? gtMembers.find((g) => g.handle === h) ?? gtDevtest;
const posts = readFileSync(".demo-world-cache/p3/posts.jsonl", "utf8").trim().split("\n").map((p) => JSON.parse(p)).map((p, i) => ({ ...p, i }));
const R = rng(70404);

// ── crowd simulation (deterministic) ─────────────────────────────────
const SENTIMENTS = [
  ["supportive", 0.19], ["appreciative", 0.14], ["informative", 0.20], ["question", 0.14],
  ["constructive critique", 0.09], ["sceptical", 0.06], ["disagreement", 0.09], ["humour", 0.05],
  ["frustration", 0.025], ["harsh", 0.005], ["off-topic", 0.01],
];
const TYPE_SHIFT = {
  debate: { disagreement: 4, sceptical: 2, supportive: -8, appreciative: -4 },
  help: { question: 12, informative: 8, disagreement: -6 },
  review: { "constructive critique": 8, sceptical: 4, supportive: -4 },
  showcase: { supportive: 8, appreciative: 6, disagreement: -5 },
  spark: { humour: 8, supportive: 3, informative: -6 },
  news: { informative: 6, sceptical: 4 },
  compare: { "constructive critique": 5, informative: 5 },
  list: { informative: 5, question: 4 },
};
function sentimentFor(m, type) {
  const w = Object.fromEntries(SENTIMENTS);
  for (const [k, v] of Object.entries(TYPE_SHIFT[type] ?? {})) w[k] = (w[k] ?? 0) + v / 100;
  const t = gtOf(m.handle).temperament;
  if (t.contrarianism > 0.6) { w.disagreement *= 1.7; w.sceptical *= 1.5; }
  if (t.agreeableness > 0.6) { w.supportive *= 1.5; w.appreciative *= 1.4; }
  if (t.generosity > 0.6) { w.informative *= 1.5; }
  if (t.agreeableness < 0.35 && w.harsh !== undefined) w.harsh *= 2.5;
  let sum = Object.values(w).reduce((a, b) => a + b, 0);
  let x = R() * sum;
  for (const [k, v] of Object.entries(w)) { x -= v; if (x <= 0) return k; }
  return "informative";
}
const INTENT_FOR = { question: "ask", informative: "share experience", supportive: "agree", appreciative: "thank", "constructive critique": "correct", sceptical: "challenge", disagreement: "challenge", humour: "joke", frustration: "share experience", harsh: "challenge", "off-topic": "share experience" };

const activePool = members.filter((m) => m.tier !== "quiet");
const commentsPlan = [];   // {postI, author, parentCommentIdx?, sentiment, intent, stance?, offsetMs}
const interactions = [];   // reactions/saves/votes/ratings/accepts
const rawEvents = [];

const baseComments = { great: 22, good: 11, mediocre: 3, poor: 0.7 };
const typeMult = { debate: 1.6, news: 1.3, list: 1.2, showcase: 1.1, help: 1.0, review: 1.0, compare: 0.9, spark: 0.6 };
const gtPosts = readJson(".demo-world-cache/p3/ground-truth-posts.json");

for (const p of posts.sort((a, b) => a.dayOffsetMs - b.dayOffsetMs)) {
  const gt = gtPosts[p.i] ?? { quality: "good" };
  const q = gt.quality;
  const audience = shuffle(R, activePool).slice(0, 45 + Math.floor(R() * 20)); // sees it
  const nicheMatch = (m) => m.nichePrimary === p.author_niche_hint || m.nichePrimary === gt.niche || R() < 0.3;
  const nComments = R() < 0.2 ? 0 : Math.max(0, Math.round(baseComments[q] * (typeMult[p.type] ?? 1) * (0.6 + R() * 0.8)));
  const commenters = [];
  for (let c = 0; c < nComments; c++) {
    let m = pick(R, audience);
    // ring boost on monetisation posts
    const ringHandles = Object.entries(badByHandle).filter(([, b]) => b.badActorRole === "upvote-ring").map(([h]) => h);
    if (gt.niche === "monetisation" && R() < 0.15) m = byHandle[pick(R, ringHandles)] ?? m;
    if (!m) continue;
    const bad = gtOf(m.handle).badActorRole;
    const sentiment = bad === "troll" ? (R() < 0.6 ? "harsh" : "disagreement") : bad === "comment-farmer" ? pick(R, ["supportive", "appreciative"]) : sentimentFor(m, p.type);
    const isReply = commentsPlan.some((c2) => c2.postI === p.i) && R() < 0.35;
    const siblings = commentsPlan.filter((c2) => c2.postI === p.i && c2.parentIdx === null); // INV-1: replies only under depth-0 comments
    const parent = isReply ? pick(R, siblings) : null;
    const when = p.dayOffsetMs + (parent ? parent.offsetMs - p.dayOffsetMs + (2 + R() * 20) * HOUR : (R() < 0.6 ? R() * 6 : 6 + R() * 40) * HOUR);
    commentsPlan.push({
      postI: p.i, author: m.handle, parentIdx: parent ? commentsPlan.indexOf(parent) : null,
      sentiment, intent: INTENT_FOR[sentiment], stance: p.type === "debate" ? (R() < 0.42 ? "agree" : R() < 0.75 ? "disagree" : "nuanced") : null,
      offsetMs: Math.max(when, p.dayOffsetMs + 0.5 * HOUR), badActorRole: bad,
    });
    commenters.push(m.handle);
  }
  // reactions (valuable) — 2.6x comments, quality-skewed
  const reactors = shuffle(R, audience).slice(0, Math.round(nComments * 2.6 * (q === "great" ? 1.4 : q === "poor" ? 0.2 : 1)));
  for (const m of reactors) {
    const bad = gtOf(m.handle).badActorRole;
    if (bad === "upvote-ring" && gt.niche === "monetisation") { /* ring reacts below */ }
    interactions.push({ kind: "reaction", type: "valuable", postI: p.i, user: m.handle, offsetMs: p.dayOffsetMs + R() * 3 * DAY });
  }
  // ring: all 5 upvote each other's monetisation posts
  const ringHandles = Object.entries(badByHandle).filter(([, b]) => b.badActorRole === "upvote-ring").map(([h]) => h);
  if (gt.niche === "monetisation") for (const h of ringHandles) if (R() < 0.8) interactions.push({ kind: "reaction", type: "valuable", postI: p.i, user: h, offsetMs: p.dayOffsetMs + R() * 2 * DAY });
  // saves (post saves ~0.33x comments)
  for (const m of shuffle(R, audience).slice(0, Math.round(nComments * 0.33))) interactions.push({ kind: "save", postI: p.i, user: m.handle, offsetMs: p.dayOffsetMs + R() * 2 * DAY });
  // negative reactions + context signals (occasional, per M6)
  for (const m of shuffle(R, audience).slice(0, R() < 0.35 ? 1 : 0)) {
    interactions.push({ kind: "reaction", type: "negative", reason: pick(R, ["disagree", "not_useful", "needs_evidence", "off_topic"]), postI: p.i, user: m.handle, offsetMs: p.dayOffsetMs + R() * 2 * DAY });
  }
  // debate votes: many more voters than commenters
  if (p.type === "debate") {
    const voters = shuffle(R, members).slice(0, Math.round(Math.max(12, commenters.length * 3.5)));
    for (const m of voters) interactions.push({ kind: "debateVote", postI: p.i, user: m.handle, choice: R() < 0.45 ? "agree" : R() < 0.9 ? "disagree" : "abstain", offsetMs: p.dayOffsetMs + R() * 3 * DAY });
    // splits range lopsided→near 50/50 (natural via voter draw; ground truth records outcome)
  }
  // list item votes + member-added items
  if (p.type === "list") {
    const listComments = commentsPlan.filter((c) => c.postI === p.i);
    for (const m of shuffle(R, audience).slice(0, 3 + Math.floor(R() * 5))) interactions.push({ kind: "listItemVote", postI: p.i, user: m.handle, itemIdx: Math.floor(R() * 6), offsetMs: p.dayOffsetMs + R() * 3 * DAY });
  }
  // accepted answer (~60% of help)
  if (p.type === "help" && R() < 0.6) {
    const answers = commentsPlan.filter((c) => c.postI === p.i && (c.sentiment === "informative" || c.intent === "answer" || c.sentiment === "supportive"));
    const chosen = answers.length ? (R() < 0.8 ? answers.sort((a, b) => (b.sentiment === "informative" ? 1 : 0) - (a.sentiment === "informative" ? 1 : 0))[0] : pick(R, answers)) : null;
    if (chosen) interactions.push({ kind: "accept", postI: p.i, commentIdx: commentsPlan.indexOf(chosen), by: posts[p.i].author, offsetMs: chosen.offsetMs + (3 + R() * 30) * HOUR });
  }
  // exposures (sampled rawEvents): views + dwell for a slice of audience
  for (const m of audience.slice(0, 12)) {
    if (R() < 0.75) rawEvents.push({ eventClass: "exposure", eventType: "post.view", user: m.handle, postI: p.i, dwellMs: Math.round(1500 + R() * 90000), viewportQualified: R() < 0.3, offsetMs: p.dayOffsetMs + R() * 2 * DAY, rankPosition: 1 + Math.floor(R() * 12) });
  }
  // author rawEvents: comment.created emitted per comment at import
}

// tool ratings ~180: members rate tools they use
const rated = new Set();
for (const m of shuffle(R, members)) {
  if (rated.size >= 180) break;
  const slug = m.toolsUsed[0];
  if (!slug || rated.has(m.handle + slug)) continue;
  if (gtOf(m.handle).badActorRole === "self-promoter") continue; // staff/self promo nuance: fine either way
  rated.add(m.handle + slug);
  const t = factRows[slug];
  const harsh = gtOf(m.handle).temperament.skepticism > 0.6 ? -0.7 : 0;
  const base = { great: 5, good: 4, mediocre: 3, poor: 2 }[m.expertiseLevel === "beginner" ? "mediocre" : "good"];
  const overall = Math.min(5, Math.max(1, Math.round(base + harsh + (R() - 0.5) * 1.6)));
  interactions.push({ kind: "toolRating", user: m.handle, tool: slug, overall, dims: { ease_of_use: Math.min(5, Math.max(1, overall + (R() < 0.5 ? 0 : 1))), output_quality: Math.min(5, Math.max(1, overall + (R() < 0.4 ? 1 : -1))), reliability: Math.min(5, Math.max(1, overall + (R() < 0.5 ? 0 : -1))), value_for_money: R() < 0.1 ? "not_applicable" : Math.min(5, Math.max(1, overall)) }, offsetMs: -Math.floor(R() * 55) * DAY });
}

writeCache("p4/comments-plan.jsonl", commentsPlan.map((c) => JSON.stringify(c)).join("\n"));
writeCache("p4/interactions.jsonl", interactions.map((c) => JSON.stringify(c)).join("\n"));
writeCache("p4/rawevents.jsonl", rawEvents.map((c) => JSON.stringify(c)).join("\n"));
const sum = {
  commentsPlanned: commentsPlan.length, replies: commentsPlan.filter((c) => c.parentIdx !== null).length,
  valuable: interactions.filter((i) => i.kind === "reaction" && i.type === "valuable").length,
  negatives: interactions.filter((i) => i.kind === "reaction" && i.type === "negative").length,
  saves: interactions.filter((i) => i.kind === "save").length, debateVotes: interactions.filter((i) => i.kind === "debateVote").length,
  listItemVotes: interactions.filter((i) => i.kind === "listItemVote").length, accepts: interactions.filter((i) => i.kind === "accept").length,
  toolRatings: interactions.filter((i) => i.kind === "toolRating").length, rawEvents: rawEvents.length,
  sentimentMix: Object.fromEntries([...new Set(commentsPlan.map((c) => c.sentiment))].map((s) => [s, Math.round(1000 * commentsPlan.filter((c) => c.sentiment === s).length / commentsPlan.length) / 10 + "%"])),
};
writeCache("p4/crowd-summary.json", sum);
console.log("crowd:", JSON.stringify(sum));

// ── commenter pass (LLM) ─────────────────────────────────────────────
if (process.env.DEMO_SKIP_LLM) {
  console.log("DEMO_SKIP_LLM set — crowd-sim artifacts written, skipping commenter pass (local driver takes over via local-prep p4).");
  process.exit(0);
}
const written = [];
const commentTasks = commentsPlan.map((c, ci) => async () => {
  const p = posts[c.postI];
  const m = byHandle[c.author]; if (!m || !p) return null;
  const siblings = commentsPlan.filter((x) => x.postI === c.postI && x.offsetMs < c.offsetMs).slice(-4);
  const parent = c.parentIdx !== null ? commentsPlan[c.parentIdx] : null;
  const parentBody = parent ? (written[parent.idx]?.body ?? "").slice(0, 220) : "";
  const threadTail = siblings.filter((s) => s !== parent).slice(-2).map((s) => `${s.author}: ${(written[s.idx]?.body ?? "").slice(0, 140)}`).join("\n");
  const facts = [...new Set([...(p.toolRefs ?? []), ...(R() < 0.3 ? [m.toolsUsed[0]] : [])])].filter(Boolean).map((s) => { const t = factRows[s]; return t ? `${t.name}: ${t.whatItDoes.slice(0, 100)} (${t.verified === "full" ? "facts ok" : "pricing unverified — never state exact price"})` : null; }).filter(Boolean).join("\n");
  const isBad = c.badActorRole;
  const special = isBad === "comment-farmer" ? "Write a SHORT generic comment (<=12 words), mildly off from the specifics, no real insight." :
    isBad === "troll" ? "Write something harsh and dismissive but WITHOUT slurs or rule-breaking content — rude, snarky, within community rules." :
    isBad === "self-promoter" ? "Steer the comment toward mentioning your own product/course (by generic name like 'my Notion template shop'), subtly pushy." : "";
  const body = await chat([
    { role: "system", content: "You ARE this community member writing ONE comment in their own voice. Not an assistant." },
    { role: "user", content: `POST (${p.type}): "${p.title}"\n${p.body.slice(0, 420)}\n${parentBody ? `REPLYING TO this comment:\n${parentBody}\n` : ""}${threadTail ? `THREAD SO FAR:\n${threadTail}\n` : ""}VOICE: ${m.voice.sentenceLength} sentences, formality ${m.voice.formality}/5, humor ${m.voice.humor}/3, emoji ${m.voice.emojiRate}/3, typos ${m.voice.typoRate}/2, ${m.voice.flavor}. Sample: "${m.voice.sample}"\nPLANNED: sentiment=${c.sentiment}, intent=${c.intent}${c.stance ? `, stance=${c.stance}` : ""}${p.type === "debate" ? "\nThis is a DEBATE post: state your stance on the proposition explicitly." : ""}${parentBody ? "\nYou are REPLYING: reference or answer the parent comment specifically." : ""}\n${facts ? `Facts you may use:\n${facts}` : ""}\n${special}\nRules: 1-4 sentences (one-liners welcome for quick reactions), no URLs, no banned AI-tells (delve, game-changer, unlock, elevate, Great question, Here's the thing, closing summary). Return JSON: {"body":"<comment text>"}` },
  ], { maxTokens: 300, temperature: 0.95 }).then((t) => { try { return JSON.parse(t.replace(/```(?:json)?/g, "").trim()).body; } catch { return t.trim().slice(0, 600); } }).catch(() => null);
  if (!body) return null;
  written[c.idx = ci] = { body };
  // sampled realism check (20%)
  let realism = "unchecked";
  if (R() < 0.2) {
    realism = await chat([
      { role: "system", content: "Harsh realism editor." },
      { role: "user", content: `Comment: "${body}"\nVoice sample: "${m.voice.sample}"\nReject if AI-sounding (banned tells listed above), voice drift, or generic filler. JSON: {"verdict":"accept|reject"}` },
    ], { maxTokens: 120, temperature: 0.2 }).then((t) => { try { return JSON.parse(t.replace(/```(?:json)?/g, "").trim()).verdict; } catch { return "accept"; } }).catch(() => "accept");
  }
  return { postI: c.postI, author: c.author, parentIdx: c.parentIdx, body: body.slice(0, 900), sentiment: c.sentiment, intent: c.intent, stance: c.stance, offsetMs: c.offsetMs, badActorRole: c.badActorRole ?? null, realism };
});

const results = (await pool(commentTasks, 10, "comments")).filter(Boolean);
writeCache("p4/comments.jsonl", results.map((r) => JSON.stringify(r)).join("\n"));
writeCache("p4/ground-truth-comments.json", results.map((r, i) => ({ i, postI: r.postI, author: r.author, sentiment: r.sentiment, intent: r.intent, stance: r.stance, badActorRole: r.badActorRole })));
writeCache("p4/comments-summary.json", { written: results.length, realismSampled: results.filter((r) => r.realism !== "unchecked").length, realismRejected: results.filter((r) => r.realism === "reject").length });
logStats("p4");
console.log("comments:", JSON.stringify(readJson(".demo-world-cache/p4/comments-summary.json")));
export {};
