#!/usr/bin/env node
/** local-prep-bulk.mjs — FINAL RUN batch prep for the bulk corpus.
 * Usage: node local-prep-bulk.mjs posts   → local-in/p3b/batch-NN.json (20 posts each, MISSING refs only)
 *        node local-prep-bulk.mjs comments → local-in/p4b/batch-NN.json (wave format per step 3:
 *        one batch = up to 3 posts' threads (≤36 comments) written in waves of 4-6,
 *        context = post + last 6 comments + thread plan; mega-threads (≥37) get a dedicated batch)
 *        node local-prep-bulk.mjs check   → sample 10 random written items for the quality gate */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import path from "node:path";
import { cachePath } from "./lib/util.mjs";

const mode = process.argv[2] ?? "posts";
const members = Object.fromEntries(readFileSync(cachePath("p2/members.jsonl"), "utf8").trim().split("\n").map((l) => { const m = JSON.parse(l); return [m.handle, m]; }));
const tools = Object.fromEntries(JSON.parse(readFileSync(cachePath("p1/tools.json"), "utf8")).map((t) => [t.slug, t]));
const bulkPlan = readFileSync(cachePath("p3/bulk-post-plan.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const devtestCard = { handle: "devtest", name: "Devtest", role: "creator", nichePrimary: "monetisation", country: "United States", expertiseLevel: "intermediate", voice: { sentenceLength: "medium", formality: 3, humor: 1, emojiRate: 0, typoRate: 0, flavor: "plain international", signatureHabits: ["plain, direct"], sample: "I build small things and write about what breaks. Testing this community out." } };
const cardOf = (h) => members[h] ?? devtestCard;

const AUTHOR_CONTRACT = `You are a community member of a creator forum writing posts IN YOUR OWN VOICE. You are not an assistant.
HARD RULES:
- FACTS: state tool facts ONLY from the TOOL FACTS given. If a tool's pricingVerified != "full", NEVER state its exact price as fact (speak from experience instead). For NEWS posts: report ONLY the given real event (title + angle); never invent details beyond it.
- NO URLS anywhere (no http, www, dot-com).
- BANNED AI-TELLS (any = reject): delve, game-changer/game changer, "in today's", fast-paced, unlock, elevate, "Great question", "Here's the thing", em-dash chains, tidy three-part lists everywhere, a closing summary line, "dive into", "let's explore".
- VOICE: match the member's voice params and sample exactly (sentence length, formality 1-5, humor 0-3, emoji 0-3 max one emoji and only if rate>=2, occasional typo ONLY if typoRate>=1 and never in tool names, regional flavour).
- QUALITY: great = specific and useful; good = solid; mediocre = somewhat vague/dashed off; poor = genuinely low-effort/vague/too short (real people post like this sometimes).
- TITLES: match the given titleStyle instruction when present (long: 120-190 characters, natural run-on like real people write; short: 2-4 words only).
- Before returning each post, SELF-CHECK: every tool claim is in the facts? any banned tell? voice matches? title not formulaic? Fix before writing.
Return ONLY a JSON array, one object per post: {"ref":"<ref>","title":"...","body":"...","extension":{...per type...}}
Extension by type: review:{toolId,score(1-5),pros[3-5],cons[3-5],verdictSummary}; compare:{toolIds,criteria[3-5],winner("slug"|"depends"),reasoning}; debate:{proposition,stance("agree"|"disagree"|"mixed")}; help:{problemStatement}; list:{mode("community_ranked"|"static_creator" per row),intro,items[5-8] objects {content,createdByEmail,voteCount:0,sortOrder}}; showcase:{theThing}; spark:{statement<=280chars}; news:{eventTitle(from the given event only),keyClaims[2-4 from the event only]}.`;

if (mode === "posts") {
  const IN = cachePath("local-in/p3b");
  rmSync(IN, { recursive: true, force: true });
  mkdirSync(IN, { recursive: true });
  const already = new Set(existsSync(cachePath("p3/posts.jsonl")) ? readFileSync(cachePath("p3/posts.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l).ref) : []);
  const todo = bulkPlan.filter((p) => !already.has(p.ref));
  const BATCH = 20;
  let bi = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const rows = todo.slice(i, i + BATCH).map((p) => {
      const m = cardOf(p.author);
      const facts = [...new Set(p.toolRefs ?? [])].map((s) => { const t = tools[s]; return t ? `${t.name} (${t.niche}; pricing: ${String(t.pricingTiers).slice(0, 160)}; verified=${t.verified}; strengths: ${t.strengths.slice(0, 3).join("; ")}; weaknesses: ${t.weaknesses.slice(0, 3).join("; ")})` : null; }).filter(Boolean).join("\n");
      const qualityNote = { great: "one of your best posts: specific, useful", good: "a solid, normal post", mediocre: "mediocre: somewhat vague, dashed off", poor: "genuinely poor: vague, low-effort, too short" }[p.quality];
      const lengthNote = p.type === "spark" ? "statement only" : p.quality === "poor" || p.quality === "mediocre" ? "30-120 words" : p.quality === "good" ? "120-350 words" : "300-700 words";
      const titleStyle = p.edgeTitle === "long" ? "LONG TITLE: make it 120-190 characters, a natural detailed run-on" : p.edgeTitle === "short" ? "SHORT TITLE: exactly 2-4 words" : null;
      return {
        ref: String(p.ref), author: p.author, type: p.type, topic: p.topicTitle, niche: p.niche,
        member: { role: m.role, expertise: m.expertiseLevel, country: m.country, voice: m.voice },
        toolFacts: facts || null,
        newsEvent: p.newsEvent ? { event: p.newsEvent.event, url: p.newsEvent.url, angle: p.newsEvent.angle } : null,
        quality: p.quality, qualityNote, lengthNote, titleStyle,
        listMode: p.listMode ?? null, debateSplitHint: p.debateSplit ? `community leans ${p.debateSplit === "close" ? "split ~50/50" : "heavily one side"}` : null,
      };
    });
    writeFileSync(path.join(IN, `batch-${String(bi++).padStart(2, "0")}.json`), JSON.stringify({ contract: AUTHOR_CONTRACT, posts: rows }, null, 1));
  }
  console.log(`bulk posts prep: ${bi} batch files, ${todo.length} posts to write (${already.size} already present)`);
}

if (mode === "comments") {
  const IN = cachePath("local-in/p4b");
  rmSync(IN, { recursive: true, force: true });
  mkdirSync(IN, { recursive: true });
  const postsAll = existsSync(cachePath("p3/posts.jsonl")) ? readFileSync(cachePath("p3/posts.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l)) : [];
  const postsByRef = new Map(postsAll.map((p) => [p.ref, p]));
  const planAll = readFileSync(cachePath("p4/bulk-comments-plan.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
  const already = existsSync(cachePath("p4/comments.jsonl")) ? new Set(readFileSync(cachePath("p4/comments.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l).ref)) : new Set();
  // group per post, sorted by offsetMs; skip posts whose refs are ALL written
  const perPost = new Map();
  for (const c of planAll) {
    const arr = perPost.get(c.postI) ?? [];
    arr.push(c);
    perPost.set(c.postI, arr);
  }
  let skippedPosts = 0;
  for (const [pid, arr] of perPost) {
    arr.sort((a, b) => a.offsetMs - b.offsetMs);
    const done = arr.every((_, k) => already.has(`${pid}:${k}`));
    if (done) { perPost.delete(pid); skippedPosts++; }
  }
  const WAVE_CONTRACT = `You are community members writing ONE comment each, in each member's own voice. Not an assistant.
WAVE DISCIPLINE: write the comments of each post IN ORDER, in waves of 4-6. Each wave must read like it arrived after the previous one — reference the thread state where natural (a reply answers its parent specifically; later comments may react to earlier ones).
HARD RULES: NO URLs; no banned AI-tells (delve, game-changer, unlock, elevate, "Great question", "Here's the thing", closing summary); match each member's voice params and sample; sentiment=question must actually ask something; debate comments state the planned stance explicitly; never state exact prices for tools unless given as fact; length hints: oneline = one short sentence, long = 4-6 sentences with real substance, normal = 1-4 sentences.
Return ONLY a JSON array: {"ref":"<ref>","body":"..."}`;
  const batches = [];
  let current = { posts: [], arrs: [] };
  let curCount = 0;
  for (const [pid, arr] of [...perPost.entries()].sort((a, b) => a[0] - b[0])) {
    if (arr.length >= 37) { batches.push({ posts: [pid], arrs: [arr] }); continue; } // mega thread: dedicated batch
    if (curCount + arr.length > 36 || current.posts.length >= 3) { if (current.posts.length) batches.push(current); current = { posts: [], arrs: [] }; curCount = 0; }
    current.posts.push(pid); current.arrs.push(arr); curCount += arr.length;
  }
  if (current.posts.length) batches.push(current);
  const OUTDIR = cachePath("local-out/p4b");
  let bi = 0;
  if (existsSync(OUTDIR)) {
    for (const f of readdirSync(OUTDIR)) { const m = f.match(/^batch-(\d+)\.jsonl$/); if (m) bi = Math.max(bi, Number(m[1]) + 1); }
  }
  for (const b of batches) {
    const rows = [];
    for (const [pi, pid] of b.posts.entries()) {
      const p = postsByRef.get(pid);
      const arr = b.arrs[pi];
      if (!p) continue;
      arr.forEach((c, k) => {
        const m = cardOf(c.author);
        const parentGlobal = c.parentIdx !== null && c.parentIdx !== undefined ? planAll[c.parentIdx] : null;
        const parentK = parentGlobal ? arr.indexOf(parentGlobal) : -1;
        rows.push({
          ref: `${pid}:${k}`, author: c.author,
          voice: m.voice,
          sentiment: c.sentiment, intent: c.intent, stance: c.stance,
          isReply: parentK >= 0, parentRef: parentK >= 0 ? `${pid}:${parentK}` : null,
          parentPreview: parentK >= 0 ? `(by ${planAll[c.parentIdx].author}, ${planAll[c.parentIdx].sentiment})` : null,
          length: c.length, badActorRole: c.badActorRole ?? null,
          postTitle: p.title, postType: p.type, postExcerpt: p.body.slice(0, 420),
          postI: pid, waveHint: Math.floor(k / 5) + 1,
        });
      });
    }
    if (rows.length) writeFileSync(path.join(IN, `batch-${String(bi++).padStart(2, "0")}.json`), JSON.stringify({ contract: WAVE_CONTRACT, waves: rows }, null, 1));
  }
  console.log(`bulk comments prep: ${bi} batch files, ${[...perPost.values()].reduce((a, x) => a + x.length, 0)} comments to write (${skippedPosts} posts fully done, ${already.size} refs present)`);
}

export {};
