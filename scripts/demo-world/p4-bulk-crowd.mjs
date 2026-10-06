#!/usr/bin/env node
/** p4-bulk-crowd.mjs — FINAL RUN crowd simulator v2 for the BULK posts
 * (refs 250..1499; the pilot's own crowd stays as imported).
 * Emits: p4/bulk-comments-plan.jsonl, p4/bulk-interactions.jsonl,
 *        p4/bulk-rawevents.jsonl, p4/bulk-notifications.jsonl (devtest life).
 * Guarantees: split-honoring debate votes, help accepts (resolved) with ≥30
 * distinct answerers, list item votes on community_ranked, bad-actor behavior,
 * Rising cohort activity, devtest's 8 posts + replies + accepted answer +
 * saves + ~20 notifications of all types. */
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { rng, pick, shuffle, cachePath, DAY, HOUR } from "./lib/util.mjs";

const R = rng(915551);
const members = readFileSync(cachePath("p2/members.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const byHandle = Object.fromEntries(members.map((m) => [m.handle, m]));
const gtMembers = JSON.parse(readFileSync(cachePath("p2/ground-truth-members.json"), "utf8"));
const badByHandle = Object.fromEntries(gtMembers.filter((g) => g.badActorRole).map((g) => [g.handle, g]));
const gtOf = (h) => badByHandle[h] ?? gtMembers.find((g) => g.handle === h) ?? { temperament: { agreeableness: 0.5, skepticism: 0.5 } };
const plan = readFileSync(cachePath("p3/bulk-post-plan.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const joinAdjust = JSON.parse(readFileSync(cachePath("p2/join-date-adjustments.json"), "utf8"));
const rising = new Set(joinAdjust.map((j) => j.handle));
const tools = JSON.parse(readFileSync(cachePath("p1/tools.json"), "utf8"));

const SENTIMENTS = [
  ["supportive", 0.18], ["appreciative", 0.13], ["informative", 0.22], ["question", 0.14],
  ["constructive critique", 0.09], ["sceptical", 0.06], ["disagreement", 0.08], ["humour", 0.05],
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
const INTENT_FOR = { question: "ask", informative: "share experience", supportive: "agree", appreciative: "thank", "constructive critique": "correct", sceptical: "challenge", disagreement: "challenge", humour: "joke", frustration: "share experience", harsh: "challenge", "off-topic": "share experience" };
function sentimentFor(m, type) {
  const w = Object.fromEntries(SENTIMENTS);
  for (const [k, v] of Object.entries(TYPE_SHIFT[type] ?? {})) w[k] = (w[k] ?? 0) + v / 100;
  const t = gtOf(m.handle).temperament;
  if (t.contrarianism > 0.6) { w.disagreement *= 1.7; w.sceptical *= 1.5; }
  if (t.agreeableness > 0.6) { w.supportive *= 1.5; w.appreciative *= 1.4; }
  if (t.generosity > 0.6) w.informative *= 1.5;
  if (t.agreeableness < 0.35 && w.harsh !== undefined) w.harsh *= 2.5;
  let x = R() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(w)) { x -= v; if (x <= 0) return k; }
  return "informative";
}

const activePool = members.filter((m) => m.tier !== "quiet");
const commentsPlan = [];
const interactions = [];
const rawEvents = [];
const notifications = [];
let nComments = 0;

const audienceFor = (p) => {
  const base = shuffle(R, activePool).slice(0, 40 + Math.floor(R() * 25));
  // rising cohort shows up in recent threads (climbing)
  if (-p.dayOffsetMs < 14 * DAY) {
    const ris = members.filter((m) => rising.has(m.handle));
    for (let i = 0; i < 6; i++) base[i % base.length] = pick(R, ris);
  }
  return base;
};

const commentBase = { great: 38, good: 18, mediocre: 7, poor: 2.2 };
const typeMult = { debate: 1.5, news: 1.25, list: 1.15, showcase: 1.1, help: 1.0, review: 1.0, compare: 0.9, spark: 0.55 };

const acceptedAnswerers = new Set(); // ≥30 distinct helpers (Podium)
const devtestPosts = plan.filter((p) => p.devtest);

for (const p of plan) {
  const audience = audienceFor(p);
  const size = p.threadSize !== undefined && p.threadSize !== null
    ? p.threadSize
    : (R() < 0.18 ? 0 : Math.max(0, Math.round((commentBase[p.quality] ?? 8) * (typeMult[p.type] ?? 1) * (0.5 + R()))));
  const siblings = [];
  for (let c = 0; c < size; c++) {
    let m = pick(R, audience);
    const ringHandles = Object.entries(badByHandle).filter(([, b]) => b.badActorRole === "upvote-ring").map(([h]) => h);
    if (p.niche === "monetisation" && R() < 0.1) m = byHandle[pick(R, ringHandles)] ?? m;
    if (!m) continue;
    const bad = gtOf(m.handle).badActorRole;
    const sentiment = bad === "troll" ? (R() < 0.6 ? "harsh" : "disagreement") : bad === "comment-farmer" ? pick(R, ["supportive", "appreciative"]) : sentimentFor(m, p.type);
    const isReply = siblings.length > 0 && R() < 0.33;
    const parent = isReply ? pick(R, siblings.filter((s) => s.parentIdx === null)) : null;
    const when = p.dayOffsetMs + (parent ? parent.offsetMs - p.dayOffsetMs + (2 + R() * 20) * HOUR : (R() < 0.6 ? R() * 8 : 8 + R() * 64) * HOUR);
    const row = {
      postI: p.ref, author: m.handle,
      parentIdx: parent ? commentsPlan.indexOf(parent) : null,
      sentiment, intent: INTENT_FOR[sentiment],
      stance: p.type === "debate" ? null : null, // set below for debates
      offsetMs: Math.max(when, p.dayOffsetMs + 0.5 * HOUR),
      badActorRole: bad ?? null,
      length: R() < 0.06 ? "long" : R() < 0.3 ? "oneline" : "normal", // edge-case comments
    };
    commentsPlan.push(row);
    siblings.push(row);
    nComments++;
  }
  // debate stances honor the planned split
  if (p.type === "debate") {
    const share = p.debateSplit === "close" ? 0.45 + R() * 0.1 : 0.72 + R() * 0.16;
    const voters = shuffle(R, members).slice(0, Math.max(14, Math.round(size * 3.2) + 8));
    let agrees = 0;
    for (const [i, v] of voters.entries()) {
      const wantAgree = i / voters.length < share;
      const agree = wantAgree || R() < 0.03;
      if (agree) agrees++;
      interactions.push({ kind: "debateVote", postI: p.ref, user: v.handle, choice: agree ? "agree" : R() < 0.12 ? "abstain" : "disagree", offsetMs: p.dayOffsetMs + R() * 3 * DAY });
    }
    for (const s of siblings) if (s.sentiment !== "harsh") s.stance = R() < share ? "agree" : R() < 0.8 ? "disagree" : "nuanced";
  }
  // comments on the post by commenters
  const commenters = [...new Set(siblings.map((s) => s.author))];
  // reactions (valuable, quality-skewed) + saves + occasional negatives
  const q = p.quality;
  const reactors = shuffle(R, audience).slice(0, Math.round(size * 2.4 * (q === "great" ? 1.4 : q === "poor" ? 0.2 : 1)));
  for (const m of reactors) interactions.push({ kind: "reaction", type: "valuable", postI: p.ref, user: m.handle, offsetMs: p.dayOffsetMs + R() * 3 * DAY });
  if (p.brandNew) continue; // exploration cue: brand-new posts stay quiet — no further engagement
  for (const m of shuffle(R, audience).slice(0, Math.round(size * 0.3))) interactions.push({ kind: "save", postI: p.ref, user: m.handle, offsetMs: p.dayOffsetMs + R() * 2 * DAY });
  for (const m of shuffle(R, audience).slice(0, R() < 0.3 ? 1 : 0)) {
    const bad = gtOf(m.handle).badActorRole;
    interactions.push({ kind: "reaction", type: "negative", reason: bad ? "not_useful" : pick(R, ["disagree", "not_useful", "needs_evidence", "off_topic"]), postI: p.ref, user: m.handle, offsetMs: p.dayOffsetMs + R() * 2 * DAY });
  }
  // list item votes on community_ranked lists
  if (p.type === "list" && p.listMode === "community_ranked") {
    for (const m of shuffle(R, audience).slice(0, 3 + Math.floor(R() * 6))) {
      interactions.push({ kind: "listItemVote", postI: p.ref, user: m.handle, itemIdx: Math.floor(R() * 6), offsetMs: p.dayOffsetMs + R() * 3 * DAY });
    }
  }
  // help accepts: resolved → best informative answer; spread distinct answerers.
  // GUARANTEE: a resolved help always has an answer — if no sibling qualifies,
  // a strong non-bad member writes one.
  if (p.type === "help" && p.helpOutcome === "resolved") {
    let answers = siblings.filter((s) => s.sentiment === "informative" || s.sentiment === "supportive");
    let nonBad = answers.filter((s) => !s.badActorRole);
    if (!nonBad.length) {
      const helper = byHandle[pick(R, shuffle(R, activePool).filter((m) => !badByHandle[m.handle]))] ?? pick(R, activePool);
      const row = { postI: p.ref, author: helper.handle, parentIdx: null, sentiment: "informative", intent: "share experience", stance: null, offsetMs: p.dayOffsetMs + (3 + R() * 30) * HOUR, badActorRole: null, length: "normal" };
      commentsPlan.push(row); siblings.push(row); nComments++;
      nonBad = [row];
    }
    const chosen = (nonBad.length ? nonBad : answers)[0] ?? null;
    if (chosen) {
      acceptedAnswerers.add(chosen.author);
      interactions.push({ kind: "accept", postI: p.ref, commentIdx: commentsPlan.indexOf(chosen), by: p.author, offsetMs: chosen.offsetMs + (3 + R() * 26) * HOUR });
    }
  }
  // exposures
  for (const m of audience.slice(0, 10)) {
    if (R() < 0.7) rawEvents.push({ eventClass: "exposure", eventType: "post.view", user: m.handle, postI: p.ref, dwellMs: Math.round(1500 + R() * 90000), viewportQualified: R() < 0.3, offsetMs: p.dayOffsetMs + R() * 2 * DAY, rankPosition: 1 + Math.floor(R() * 12) });
  }
}

// ── devtest life ───────────────────────────────────────────────────────
// replies by others on devtest posts exist via the normal flow (devtest
// posts have threadSize 3-7). Now: notifications for devtest (~20, all types),
// a save on devtest's showcase, devtest comments elsewhere (incl. one accepted).
{
  const dt = "devtest";
  let seq = 0;
  for (const p of devtestPosts) {
    const pc = commentsPlan.filter((c) => c.postI === p.ref);
    if (!pc.length) continue;
    const actors = [...new Set(pc.map((c) => c.author))].slice(0, 4);
    notifications.push({ recipientHandle: dt, notificationType: "post_comment", objectType: "post", objectIdRef: String(p.ref), actorHandles: actors, eventCount: pc.length, dedupeKey: `demo:v2:post_comment:${p.ref}`, offsetMs: pc[0].offsetMs + 1_800_000 }); seq++;
  }
  // devtest comments on 6 other posts; one answered-help accepts devtest's comment
  const targets = shuffle(R, plan.filter((p) => !p.devtest && p.type !== "spark" && (p.threadSize ?? 1) > 0)).slice(0, 6);
  const helpsOpen = shuffle(R, plan.filter((p) => p.type === "help" && p.helpOutcome === "resolved")).slice(0, 2);
  for (const [i, t] of targets.entries()) {
    const row = { postI: t.ref, author: dt, parentIdx: null, sentiment: i === 0 && helpsOpen.length ? "informative" : pick(R, ["informative", "supportive", "constructive critique", "question"]), intent: "share experience", stance: null, offsetMs: t.dayOffsetMs + (2 + R() * 30) * HOUR, badActorRole: null, length: "normal" };
    commentsPlan.push(row); nComments++;
    if (i === 0 && helpsOpen.length) {
      const hp = helpsOpen[0];
      interactions.push({ kind: "accept", postI: hp.ref, commentIdx: commentsPlan.indexOf(row), by: hp.author, offsetMs: row.offsetMs + 5 * HOUR });
      acceptedAnswerers.add(dt);
      notifications.push({ recipientHandle: dt, notificationType: "help_resolution", objectType: "post", objectIdRef: String(hp.ref), actorHandles: [hp.author], eventCount: 1, dedupeKey: `demo:v2:help_resolution:${hp.ref}`, offsetMs: row.offsetMs + 5.2 * HOUR });
    }
    // someone replies to devtest's comment → comment_reply (5 targets for ~20 notifications total)
    if (i < 5) {
      const replier = pick(R, activePool).handle;
      const rep = { postI: t.ref, author: replier, parentIdx: commentsPlan.indexOf(row), sentiment: pick(R, ["supportive", "question", "informative"]), intent: "agree", stance: null, offsetMs: row.offsetMs + (1 + R() * 6) * HOUR, badActorRole: null, length: "normal" };
      commentsPlan.push(rep); nComments++;
      notifications.push({ recipientHandle: dt, notificationType: "comment_reply", objectType: "comment", objectIdRef: `${t.ref}:0`, actorHandles: [replier], eventCount: 1, dedupeKey: `demo:v2:comment_reply:${t.ref}:${replier}`, offsetMs: rep.offsetMs + 1_800_000 });
    }
  }
  // devtest's own help post resolved (accepted answer already planned by flow);
  const dtHelp = devtestPosts.find((p) => p.type === "help");
  if (dtHelp) notifications.push({ recipientHandle: dt, notificationType: "help_resolution", objectType: "post", objectIdRef: String(dtHelp.ref), actorHandles: [dt], eventCount: 1, dedupeKey: `demo:v2:help_resolution:own:${dtHelp.ref}`, offsetMs: dtHelp.dayOffsetMs + 2 * DAY });
  // saved_post_activity: two saves on devtest's showcase
  const dtShow = devtestPosts.find((p) => p.type === "showcase");
  if (dtShow) for (const m of shuffle(R, activePool).slice(0, 3)) {
    interactions.push({ kind: "save", postI: dtShow.ref, user: m.handle, offsetMs: dtShow.dayOffsetMs + R() * 2 * DAY });
    notifications.push({ recipientHandle: dt, notificationType: "saved_post_activity", objectType: "post", objectIdRef: String(dtShow.ref), actorHandles: [m.handle], eventCount: 1, dedupeKey: `demo:v2:saved:${dtShow.ref}:${m.handle}`, offsetMs: dtShow.dayOffsetMs + R() * 2 * DAY + 3_600_000 });
  }
}

// ── tool ratings (bulk): deep10 × ~45, tail ×3 each — ~720 rows, ≥40 distinct raters ──
{
  const deep10 = [...new Set(plan.flatMap((p) => p.toolRefs ?? []))].slice(0, 10);
  const rated = new Set();
  const rate = (slug) => {
    let m = pick(R, activePool);
    if (rated.has(m.handle + slug)) m = pick(R, shuffle(R, activePool).slice(0, 20));
    if (rated.has(m.handle + slug) || gtOf(m.handle).badActorRole === "self-promoter") return;
    rated.add(m.handle + slug);
    const harsh = gtOf(m.handle).temperament.skepticism > 0.6 ? -0.7 : 0;
    const base = { great: 5, good: 4, mediocre: 3, poor: 2 }[m.expertiseLevel === "beginner" ? "mediocre" : "good"];
    const overall = Math.min(5, Math.max(1, Math.round(base + harsh + (R() - 0.5) * 1.6)));
    interactions.push({ kind: "toolRating", user: m.handle, tool: slug, overall, dims: { ease_of_use: Math.min(5, Math.max(1, overall + (R() < 0.5 ? 0 : 1))), output_quality: Math.min(5, Math.max(1, overall + (R() < 0.4 ? 1 : -1))), reliability: Math.min(5, Math.max(1, overall + (R() < 0.5 ? 0 : -1))), value_for_money: R() < 0.1 ? "not_applicable" : Math.min(5, Math.max(1, overall)) }, offsetMs: -Math.floor(R() * 55) * DAY });
  };
  for (const slug of deep10) for (let i = 0; i < 45; i++) rate(slug);
  for (const t of tools.filter((x) => !deep10.includes(x.slug))) for (let i = 0; i < 3; i++) rate(t.slug);
}

// ── write artifacts (temp → rename) ───────────────────────────────────
const dump = (rel, data) => {
  const t = cachePath(rel + ".tmp");
  writeFileSync(t, typeof data === "string" ? data : JSON.stringify(data, null, 1));
  renameSync(t, cachePath(rel));
};
dump("p4/bulk-comments-plan.jsonl", commentsPlan.map((c) => JSON.stringify(c)).join("\n") + "\n");
dump("p4/bulk-interactions.jsonl", interactions.map((c) => JSON.stringify(c)).join("\n") + "\n");
dump("p4/bulk-rawevents.jsonl", rawEvents.map((c) => JSON.stringify(c)).join("\n") + "\n");
dump("p4/bulk-notifications.jsonl", notifications.map((c) => JSON.stringify(c)).join("\n") + "\n");

const sentimentMix = {};
for (const c of commentsPlan) sentimentMix[c.sentiment] = (sentimentMix[c.sentiment] ?? 0) + 1;
console.log(JSON.stringify({
  comments: commentsPlan.length, replies: commentsPlan.filter((c) => c.parentIdx !== null).length,
  interactions: interactions.length,
  debateVotes: interactions.filter((i) => i.kind === "debateVote").length,
  accepts: interactions.filter((i) => i.kind === "accept").length,
  distinctAcceptedAnswerers: acceptedAnswerers.size,
  toolRatings: interactions.filter((i) => i.kind === "toolRating").length,
  exposures: rawEvents.length, devtestNotifications: notifications.length,
  sentimentMix, longComments: commentsPlan.filter((c) => c.length === "long").length,
  onelineComments: commentsPlan.filter((c) => c.length === "oneline").length,
}, null, 1));
