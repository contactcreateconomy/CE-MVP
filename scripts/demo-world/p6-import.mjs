#!/usr/bin/env node
/**
 * p6-import.mjs — demo-world PILOT IMPORT DRIVER (CR-011). Reads pilot cache
 * artifacts, feeds convex/demoWorld internal mutations in dependency order,
 * re-anchoring all times to worldEnd = now. Idempotent (re-runs skip).
 * Covers → uploadImage + linkCover (ogImageAssetId); avatars → linkAvatar. */
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { convexRun } from "../lib/local-gate.mjs";
import { readJson, cachePath } from "./lib/util.mjs";

const run = (fn, args) => {
  // convex CLI needs the colon form for nested functions (importTools/importTools → importTools:importTools)
  const out = convexRun(`demoWorld/${fn.replace("/", ":")}`, JSON.stringify(args));
  try { return JSON.parse(out); } catch { return { raw: String(out).slice(0, 120) }; }
};
const jsonl = (rel) => existsSync(cachePath(rel)) ? readFileSync(cachePath(rel), "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
const chunk = (a, n) => { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; };
const S = (offsetMs) => worldEnd + offsetMs;
const emailOf = (h) => h === "devtest" ? "devtest@example.com" : `${h}@demo.createconomy.invalid`;
const COVERS_ONLY = process.argv.includes("--covers-only"); // late-arriving P5 covers: upload+link only, then exit

const worldEnd = Date.now();
console.log(`pilot import — worldEnd = ${new Date(worldEnd).toISOString()} (re-anchored)${COVERS_ONLY ? " [covers-only]" : ""}`);

// ── 0. tools ───────────────────────────────────────────────────────────
const tools = readJson(".demo-world-cache/p1/tools.json").map((t) => ({
  slug: t.slug, name: t.name, categoryIds: [t.niche], officialUrl: t.officialUrl,
  pricing: { model: t.pricingModel, tiers: t.pricingTiers, verified: t.verified },
  status: /SHUT DOWN/i.test(t.whatItDoes) ? "archived" : "active",
}));
if (!COVERS_ONLY) for (const [i, c] of chunk(tools, 25).entries()) console.log("tools", JSON.stringify(run("importTools/importTools", { seq: i, rows: c })));

// ── 1. members ─────────────────────────────────────────────────────────
const members = jsonl("p2/members.jsonl").map((m) => ({
  handle: m.handle, name: m.name || m.handle, email: m.email, bio: m.bio,
  joinOffsetMs: m.joinOffsetMs,
  lastActiveOffsetMs: m.tier === "power" ? -3_600_000 : m.tier === "regular" ? -86_400_000 : m.tier === "occasional" ? -5 * 86_400_000 : -20 * 86_400_000,
  verified: m.verified,
  displayName: (m.name || m.handle).split(" ")[0],
}));
if (!COVERS_ONLY) for (const [i, c] of chunk(members, 25).entries()) console.log("members", JSON.stringify(run("importMembers/importMembers", { seq: i, worldEnd, rows: c })));

// ── 1b. Rising cohort: re-date selected members to recent joins ────────
if (!COVERS_ONLY) {
  const adj = readJson(".demo-world-cache/p2/join-date-adjustments.json");
  if (Array.isArray(adj) && adj.length) {
    const rows = adj.map((a) => ({ userEmail: emailOf(a.handle), joinOffsetMs: a.joinOffsetMs }));
    console.log("risingCohort", JSON.stringify(run("importMembers/adjustJoinDates", { seq: 0, worldEnd, rows })));
  }
}

// ── 2. posts ───────────────────────────────────────────────────────────
const plan = [...jsonl("p3/post-plan.jsonl"), ...jsonl("p3/bulk-post-plan.jsonl")];
const posts = jsonl("p3/posts.jsonl");
const interactions = [...jsonl("p4/interactions.jsonl"), ...jsonl("p4/bulk-interactions.jsonl")];
const rawExposures = [...jsonl("p4/rawevents.jsonl"), ...jsonl("p4/bulk-rawevents.jsonl")];
const commentsAll = jsonl("p4/comments.jsonl").slice().sort((a, b) => a.offsetMs - b.offsetMs);
const commentsByPost = new Map();
for (const c of commentsAll) { const k = String(c.postI); if (!commentsByPost.has(k)) commentsByPost.set(k, []); commentsByPost.get(k).push(c); }
// c.parentIdx is a GLOBAL comments-plan index; refs are per-post sorted-k — resolve through the plan
const planComments = [...jsonl("p4/comments-plan.jsonl"), ...jsonl("p4/bulk-comments-plan.jsonl")];
const planByPost = new Map();
planComments.forEach((c, gi) => { const k = String(c.postI); if (!planByPost.has(k)) planByPost.set(k, []); planByPost.get(k).push([c, gi]); });
const parentRefOf = new Map();
for (const [pid, arr] of planByPost) arr.slice().sort((a, b) => a[0].offsetMs - b[0].offsetMs).forEach(([, gi], k) => parentRefOf.set(gi, `${pid}:${k}`));
const newsAssign = Object.fromEntries([
  ...(readJson(".demo-world-cache/p3/news-assignment.json") ?? []).map((n) => [n.i, n]),
  ...plan.filter((p) => p.newsEvent).map((p) => [p.ref, { i: p.ref, eventTitle: p.newsEvent.event, url: p.newsEvent.url }]),
]);

const postRows = posts.map((p, i) => {
  const pl = plan[i] ?? {};
  const ref = String(i);
  const pc = commentsByPost.get(ref) ?? [];
  const exposures = rawExposures.filter((e) => String(e.postI) === ref);
  const times = [...pc.map((c) => c.offsetMs), ...interactions.filter((x) => String(x.postI) === ref).map((x) => x.offsetMs), p.dayOffsetMs];
  const e = p.extension ?? {};
  const row = {
    ref, authorEmail: emailOf(p.author), type: p.type, title: p.title, body: p.body,
    categoryId: pl.niche ?? "video", toolIds: p.toolRefs ?? [], createdOffsetMs: p.dayOffsetMs,
    counters: {
      valuableWeighted: interactions.filter((x) => x.kind === "reaction" && x.type === "valuable" && String(x.postI) === ref).length,
      distinctCommenters: new Set(pc.map((c) => c.author)).size,
      replyCount: pc.filter((c) => c.parentIdx !== null && c.parentIdx !== undefined).length,
      saveCount: interactions.filter((x) => x.kind === "save" && String(x.postI) === ref).length,
      qualifiedReads: exposures.filter((x) => x.viewportQualified).length,
      returns7d: Math.round(exposures.length * 0.08),
      qualifiedExposureCount: exposures.length,
      lastEligibleInteractionOffsetMs: Math.max(...times),
    },
  };
  if (p.type === "review") row.review = { toolId: e.toolId ?? p.toolRefs?.[0] ?? "", verdictScore: e.score ?? 4, ...(e.verdictSummary ? { verdictSummary: e.verdictSummary } : {}), pros: e.pros ?? [], cons: e.cons ?? [] };
  if (p.type === "compare") row.compare = { toolIds: e.toolIds ?? p.toolRefs ?? [], qualitativeGrid: { criteria: e.criteria ?? [], winner: e.winner ?? "depends", reasoning: e.reasoning ?? "" } };
  if (p.type === "spark") row.spark = { statement: e.statement ?? p.body.slice(0, 280) };
  if (p.type === "debate") {
    const votes = interactions.filter((x) => x.kind === "debateVote" && String(x.postI) === ref);
    row.debate = { proposition: e.proposition ?? p.title, agreeCount: votes.filter((v) => v.choice === "agree").length, disagreeCount: votes.filter((v) => v.choice === "disagree").length, abstainCount: votes.filter((v) => v.choice === "abstain").length };
  }
  if (p.type === "list") row.list = {
    mode: e.mode ?? "community_ranked", intro: e.intro ?? "",
    items: (e.items ?? []).map((raw, k) => {
      // pilot artifacts store plain strings; bulk artifacts store import-shaped objects
      const it = typeof raw === "string" ? { content: raw } : raw;
      return {
        content: it.content ?? "",
        createdByEmail: it.createdByEmail ?? emailOf(p.author),
        voteCount: interactions.filter((x) => x.kind === "listItemVote" && String(x.postI) === ref && x.itemIdx === k).length,
        sortOrder: it.sortOrder ?? k,
      };
    }),
  };
  if (p.type === "showcase") row.showcase = { theThing: e.theThing ?? p.title, ...(e.projectUrl ? { projectUrl: e.projectUrl } : {}) };
  if (p.type === "help") row.help = { problemStatement: e.problemStatement ?? p.title, resolvedStatus: "open" }; // accepts patch later
  if (p.type === "news") {
    const na = newsAssign[i] ?? {};
    row.news = { sourceOfTruthUrl: na.url ?? "https://example.com", keyClaims: e.keyClaims ?? [p.title], publishedOffsetMs: p.dayOffsetMs };
  }
  return row;
});
if (!COVERS_ONLY) for (const [i, c] of chunk(postRows, 8).entries()) console.log("posts", JSON.stringify(run("importPosts/importPosts", { seq: i, worldEnd, rows: c })));

// ── 2b. images (P5): upload cover crops + avatar SVGs, link them (A5.3) ─
{
  // Windows caps one CLI arg near 32KB: small payloads go direct, larger ones
  // go through chunk rows + uploadImageFinalize (demoWorld/importChrome).
  const CH = 24000;
  const upload = (buf, contentType, tag) => {
    const b64 = buf.toString("base64");
    if (b64.length <= CH) {
      const st = run("importChrome/uploadImage", { bytes: b64, contentType });
      if (!st.storageId) throw new Error("uploadImage: no storageId " + JSON.stringify(st).slice(0, 80));
      return st.storageId;
    }
    const uploadId = `${tag}-${Date.now().toString(36)}`;
    const total = Math.ceil(b64.length / CH);
    for (let s = 0; s < total; s++) run("importChrome/uploadImageChunk", { uploadId, seq: s, total, contentType, chunk: b64.slice(s * CH, (s + 1) * CH) });
    const st = run("importChrome/uploadImageFinalize", { uploadId });
    if (!st.storageId) throw new Error("finalize: no storageId " + JSON.stringify(st).slice(0, 80));
    return st.storageId;
  };
  const imgs = (readJson(".demo-world-cache/p5/image-ledger.json") ?? { images: [] }).images ?? [];
  // resume marker: one tag per uploaded+linked image so re-runs skip them
  const donePath = cachePath("p5/upload-done.jsonl");
  const done = new Set(existsSync(donePath) ? readFileSync(donePath, "utf8").trim().split("\n").filter(Boolean) : []);
  const markDone = (tag) => { done.add(tag); appendFileSync(donePath, tag + "\n"); };
  let up = 0, linked = 0, skipped = 0;
  for (const img of imgs) {
    if (img.coverless || !img.file169 || img.fetchError) { skipped++; continue; }
    const tag = `post-${img.postI}`;
    if (done.has(tag)) { up++; linked++; continue; }
    try {
      const storageId = upload(readFileSync(cachePath(img.file169)), img.uploadContentType ?? "image/webp", tag);
      up++;
      const o = run("importChrome/linkCover", { postRef: String(img.postI), storageId });
      if (o.linked) { linked++; markDone(tag); }
    } catch (e) { skipped++; console.log("cover", img.postI, String(e.message).slice(0, 120)); }
  }
  const avs = readJson(".demo-world-cache/p5/avatars.json") ?? [];
  let avUp = 0, avLinked = 0;
  for (const a of avs) {
    if (a.kind !== "illustrated-svg" || !a.file) continue;
    const tag = `av-${a.handle}`;
    if (done.has(tag)) { avUp++; avLinked++; continue; }
    try {
      const storageId = upload(readFileSync(cachePath(a.file)), a.uploadContentType ?? "image/svg+xml", tag);
      avUp++;
      const o = run("importChrome/linkAvatar", { email: emailOf(a.handle), storageId });
      if (o.linked) { avLinked++; markDone(tag); }
    } catch (e) { console.log("avatar", a.handle, String(e.message).slice(0, 120)); }
  }
  console.log("images", JSON.stringify({ coversUploaded: up, coversLinked: linked, avatarsUploaded: avUp, avatarsLinked: avLinked, skipped }));
  console.log("imgChunk sweep", JSON.stringify(run("importChrome/deleteImageChunks", { sweepAll: true })));
}
if (COVERS_ONLY) { console.log("covers-only pass complete"); process.exit(0); }

// ── 3. comments (per post — same-mutation thread semantics) ───────────
{
  let seq = 0, total = 0;
  // Windows caps one CLI arg near 32KB: mega-threads (60+ comments) must be sliced
  // into ≤24KB calls; parents may land in an earlier call (handler resolves via gt)
  const sliceRows = (mapped) => {
    const out = []; let cur = [], size = 0;
    for (const r of mapped) {
      const b = Buffer.byteLength(JSON.stringify(r));
      if (cur.length && size + b > 24000) { out.push(cur); cur = []; size = 0; }
      cur.push(r); size += b;
    }
    if (cur.length) out.push(cur);
    return out;
  };
  for (const [postRef, rows] of commentsByPost) {
    const mapped = rows.map((c, k) => ({
      ref: `${postRef}:${k}`, authorEmail: emailOf(c.author), body: c.body,
      isQuestion: c.intent === "ask" || c.sentiment === "question",
      parentRef: c.parentIdx !== null && c.parentIdx !== undefined ? parentRefOf.get(c.parentIdx) : undefined,
      createdOffsetMs: c.offsetMs,
      sentiment: c.sentiment, intent: c.intent, stance: c.stance, badActorRole: c.badActorRole,
    }));
    for (const part of sliceRows(mapped)) {
      const out = run("importComments/importComments", { seq: seq++, worldEnd, postRef, rows: part });
      total += out.inserted ?? 0;
    }
  }
  console.log("comments", JSON.stringify({ posts: commentsByPost.size, total }));
}

// ── 4. engagement ──────────────────────────────────────────────────────
{
  const reactions = [];
  const reactionRows = interactions.filter((x) => x.kind === "reaction");
  reactionRows.forEach((x, idx) => {
    const ref = String(x.postI);
    const pc = (commentsByPost.get(ref) ?? []).filter((c) => c.author !== x.user);
    if (!pc.length) return;
    const target = pc[idx % pc.length]; // deterministic, self-excluded
    reactions.push({ userEmail: emailOf(x.user), commentRef: `${ref}:${pc.indexOf(target)}`, type: x.type, reason: x.reason, offsetMs: x.offsetMs });
  });
  const postSaves = interactions.filter((x) => x.kind === "save").map((x) => ({ userEmail: emailOf(x.user), postRef: String(x.postI), offsetMs: x.offsetMs }));
  const debateVotes = interactions.filter((x) => x.kind === "debateVote").map((x) => ({ userEmail: emailOf(x.user), postRef: String(x.postI), choice: x.choice, offsetMs: x.offsetMs }));
  const listItemVotes = interactions.filter((x) => x.kind === "listItemVote").map((x) => ({ userEmail: emailOf(x.user), itemRef: `${x.postI}:item:${x.itemIdx}`, offsetMs: x.offsetMs }));
  const accepts = [];
  for (const x of interactions.filter((y) => y.kind === "accept")) {
    const ref = String(x.postI);
    const pc = (commentsByPost.get(ref) ?? []).slice().sort((a, b) => a.offsetMs - b.offsetMs);
    const target = pc[x.commentIdx % Math.max(1, pc.length)]; // crowd stored a plan commentIdx — map onto this post's sorted list
    if (target) accepts.push({ postRef: ref, commentRef: `${ref}:${pc.indexOf(target)}`, acceptedByEmail: emailOf(posts[Number(ref)]?.author ?? "devtest"), offsetMs: x.offsetMs });
  }
  const toolRatings = interactions.filter((x) => x.kind === "toolRating").map((x) => ({ userEmail: emailOf(x.user), toolSlug: x.tool, overallScore: x.overall, dims: x.dims, offsetMs: x.offsetMs }));

  const send = (seq, payload) => run("importEngagement/importEngagement", { seq, worldEnd, ...payload });
  const empty = { reactions: [], commentSaves: [], postSaves: [], debateVotes: [], listItemVotes: [], contextSignals: [], accepts: [], toolRatings: [] };
  let seq = 0;
  const groups = [
    ...chunk(reactions, 100).map((r) => ({ ...empty, reactions: r })),
    ...chunk(postSaves, 100).map((r) => ({ ...empty, postSaves: r })),
    ...chunk(debateVotes, 100).map((r) => ({ ...empty, debateVotes: r })),
    ...chunk(listItemVotes, 100).map((r) => ({ ...empty, listItemVotes: r })),
    ...chunk(accepts, 50).map((r) => ({ ...empty, accepts: r })),
    ...chunk(toolRatings, 50).map((r) => ({ ...empty, toolRatings: r })),
  ];
  let done = 0;
  for (const g of groups) { const o = send(seq++, g); done += o.done ?? 0; }
  // Grok fix: tallies are set ONCE from the vote rows, after all chunks land
  const debates = run("importEngagement/setDebateTallies", {});
  const listItems = run("importEngagement/setListItemVoteCounts", {});
  console.log("engagement", JSON.stringify({ reactions: reactions.length, postSaves: postSaves.length, debateVotes: debateVotes.length, listItemVotes: listItemVotes.length, accepts: accepts.length, toolRatings: toolRatings.length, done, talliesSet: { debates: debates.patched, listItems: listItems.patched } }));
}

// ── 5. events (exposures) + bucket rollups (A5.2) ──────────────────────
{
  const exposures = rawExposures.map((e) => ({ userEmail: emailOf(e.user), postRef: String(e.postI), postType: posts[Number(e.postI)]?.type ?? "help", dwellMs: e.dwellMs, viewportQualified: e.viewportQualified, rankPosition: e.rankPosition, offsetMs: e.offsetMs }));
  // hourly buckets for the first 48h of each post; daily 3-30d where events exist
  const buckets = [];
  for (const [postRef, pc] of commentsByPost) {
    const p = posts[Number(postRef)]; if (!p) continue;
    const evs = [
      ...pc.map((c) => ({ at: c.offsetMs, kind: "comment" })),
      ...interactions.filter((x) => String(x.postI) === postRef).map((x) => ({ at: x.offsetMs, kind: x.kind })),
      ...rawExposures.filter((x) => String(x.postI) === postRef).map((x) => ({ at: x.offsetMs, kind: "view" })),
    ].filter((e) => e.at >= p.dayOffsetMs);
    const byHour = new Map(), byDay = new Map();
    for (const e of evs) {
      const ageH = (e.at - p.dayOffsetMs) / 3_600_000;
      if (ageH <= 48) { const k = Math.floor(ageH); byHour.set(k, (byHour.get(k) ?? 0) + 1); }
      else { const k = Math.floor(ageH / 24); byDay.set(k, (byDay.get(k) ?? 0) + 1); }
    }
    for (const [h, n] of byHour) buckets.push({ postRef, bucketStartOffsetMs: p.dayOffsetMs + h * 3_600_000, granularity: "hour", valuableWeighted: Math.round(n * 0.35), distinctCommenterCount: Math.min(n, Math.max(1, pc.length)), replyCount: Math.round(n * 0.2), saveCount: Math.round(n * 0.05), qualifiedReads: Math.round(n * 0.3), returns: Math.round(n * 0.08), integrityAdjustments: 0 });
    for (const [d, n] of byDay) buckets.push({ postRef, bucketStartOffsetMs: p.dayOffsetMs + d * 86_400_000, granularity: "day", valuableWeighted: Math.round(n * 0.35), distinctCommenterCount: Math.min(n, Math.max(1, pc.length)), replyCount: Math.round(n * 0.2), saveCount: Math.round(n * 0.05), qualifiedReads: Math.round(n * 0.3), returns: Math.round(n * 0.08), integrityAdjustments: 0 });
  }
  let ev = 0, bk = 0;
  for (const [i, c] of chunk(exposures, 100).entries()) { const o = run("importEvents/importEvents", { seq: i, worldEnd, exposures: c, buckets: [] }); ev += o.events ?? 0; }
  for (const [i, c] of chunk(buckets, 100).entries()) { const o = run("importEvents/importEvents", { seq: 100 + i, worldEnd, exposures: [], buckets: c }); bk += o.buckets ?? 0; }
  console.log("events", JSON.stringify({ exposures: ev, buckets: bk }));
}

// ── 6. notifications ───────────────────────────────────────────────────
{
  const rows = [];
  for (const [postRef, pc] of commentsByPost) {
    if (Number(postRef) >= 250) continue; // bulk notifications come from bulk-notifications.jsonl (devtest life)
    const p = posts[Number(postRef)]; if (!p || !pc.length) continue;
    const actors = [...new Set(pc.map((c) => c.author))].slice(0, 5);
    rows.push({ recipientEmail: emailOf(p.author), notificationType: "post_comment", objectType: "post", objectIdRef: postRef, actorEmails: actors.map(emailOf), eventCount: pc.length, dedupeKey: `demo:v1:post_comment:${postRef}`, offsetMs: pc[0].offsetMs + 1_800_000 });
    const replies = pc.filter((c) => c.parentIdx !== null && c.parentIdx !== undefined);
    for (const r of new Set(replies.map((c) => planComments[c.parentIdx]?.author).filter(Boolean))) {
      rows.push({ recipientEmail: emailOf(r), notificationType: "comment_reply", objectType: "comment", objectIdRef: `${postRef}:0`, actorEmails: [emailOf(replies[0].author)], eventCount: replies.filter((x) => planComments[x.parentIdx]?.author === r).length, dedupeKey: `demo:v1:comment_reply:${postRef}:${r}`, offsetMs: (replies[0]?.offsetMs ?? 0) + 1_800_000 });
    }
  }
  let n = 0;
  for (const [i, c] of chunk(rows, 50).entries()) { const o = run("importChrome/importNotifications", { seq: i, worldEnd, rows: c }); n += o.inserted ?? 0; }
  console.log("notifications", JSON.stringify({ planned: rows.length, inserted: n }));

// ── 6b. devtest life notifications (final run) ─────────────────────────
{
  const dn = jsonl("p4/bulk-notifications.jsonl");
  const rowsB = dn.map((n) => ({
    recipientEmail: emailOf(n.recipientHandle), notificationType: n.notificationType,
    objectType: n.objectType, objectIdRef: n.objectIdRef,
    actorEmails: n.actorHandles.map(emailOf), eventCount: n.eventCount,
    dedupeKey: n.dedupeKey, offsetMs: n.offsetMs,
  }));
  let nb = 0;
  for (const [i, c] of chunk(rowsB, 50).entries()) { const o = run("importChrome/importNotifications", { seq: 100 + i, worldEnd, rows: c }); nb += o.inserted ?? 0; }
  console.log("devtestNotifications", JSON.stringify({ planned: rowsB.length, inserted: nb }));
}
}

// ── 7. ground truth (members; posts/comments gt ride their importers) ──
{
  const gt = readJson(".demo-world-cache/p2/ground-truth-members.json").map((g) => ({ scope: "member", refKey: g.handle, payload: g }));
  let n = 0;
  for (const [i, c] of chunk(gt, 100).entries()) { const o = run("importChrome/importGroundTruth", { seq: i, rows: c }); n += o.inserted ?? 0; }
  console.log("groundTruth", JSON.stringify({ inserted: n }));
}

// ── 8. finalize member counters ────────────────────────────────────────
console.log("finalize", JSON.stringify(run("importMembers/finalizeMemberCounts", { seq: 0 })));

console.log("pilot import complete — next: node scripts/demo-world/p6-settle.mjs");
