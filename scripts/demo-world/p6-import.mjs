#!/usr/bin/env node
/**
 * p6-import.mjs — demo-world IMPORT DRIVER (CR-011). Reads the pilot cache
 * artifacts and feeds convex/demoWorld internal mutations in dependency
 * order, re-anchoring all times to worldEnd = now. Batched + idempotent
 * (re-runs skip existing refs). NOT RUN until Grok approves the build.
 *
 * Usage: node scripts/demo-world/p6-import.mjs [--settle]
 */
import { readFileSync, existsSync } from "node:fs";
import { convexRun } from "../lib/local-gate.mjs";
import { readJson, cachePath } from "./lib/util.mjs";

const run = (fn, args) => {
  const out = convexRun(`demoWorld/${fn}`, JSON.stringify(args));
  try { return JSON.parse(out); } catch { return out; }
};
const jsonl = (rel) => existsSync(cachePath(rel)) ? readFileSync(cachePath(rel), "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
const chunk = (a, n) => { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; };

const worldEnd = Date.now();
console.log(`import driver — worldEnd = ${new Date(worldEnd).toISOString()} (re-anchored)`);

// 0. tools
const tools = readJson(".demo-world-cache/p1/tools.json").map((t) => ({
  slug: t.slug, name: t.name, categoryIds: [t.niche], officialUrl: t.officialUrl,
  pricing: { model: t.pricingModel, tiers: t.pricingTiers, verified: t.verified },
  status: /SHUT DOWN/i.test(t.whatItDoes) ? "archived" : "active",
}));
for (const [i, c] of chunk(tools, 25).entries()) console.log("tools", JSON.stringify(run("importTools/importTools", { seq: i, rows: c })));

// 1. members (+ lastActiveOffset by tier — active members recent, quiet older)
const members = jsonl("p2/members.jsonl").map((m) => ({
  handle: m.handle, name: m.name, email: m.email, bio: m.bio,
  joinOffsetMs: m.joinOffsetMs,
  lastActiveOffsetMs: m.tier === "power" ? -Math.round(Math.random() * 6 * 3600_000) : m.tier === "regular" ? -Math.round(Math.random() * 2 * 86_400_000) : m.tier === "occasional" ? -Math.round(Math.random() * 10 * 86_400_000) : -Math.round(10 * 86_400_000 + Math.random() * 40 * 86_400_000),
  verified: m.verified, displayName: m.name.split(" ")[0] + " " + (m.name.split(" ")[1]?.[0] ?? "") + ".",
}));
for (const [i, c] of chunk(members, 25).entries()) console.log("members", JSON.stringify(run("importMembers/importMembers", { seq: i, worldEnd, rows: c })));

// 2. posts (extensions + tallies from plan/posts/interactions)
const plan = jsonl("p3/post-plan.jsonl");
const posts = jsonl("p3/posts.jsonl");
const interactions = jsonl("p4/interactions.jsonl");
const comments = jsonl("p4/comments.jsonl");
const postRows = posts.map((p, i) => {
  const pl = plan[i] ?? {};
  const ref = String(i);
  const postComments = comments.filter((c) => String(c.postI) === ref);
  const commenters = new Set(postComments.map((c) => c.author));
  const valuable = interactions.filter((x) => x.kind === "reaction" && x.type === "valuable" && String(x.postI) === ref).length;
  const saves = interactions.filter((x) => x.kind === "save" && String(x.postI) === ref).length;
  const exposures = jsonl("p4/rawevents.jsonl").filter((e) => String(e.postI) === ref);
  const lastEligible = Math.max(...[...postComments.map((c) => c.offsetMs), ...interactions.filter((x) => String(x.postI) === ref).map((x) => x.offsetMs), -86_400_000]);
  const e = p.extension ?? {};
  const row = {
    ref, authorEmail: p.author === "devtest" ? "devtest@example.com" : `${p.author}@demo.createconomy.invalid`,
    type: p.type, title: p.title, body: p.body, categoryId: pl.niche ?? "video",
    toolIds: p.toolRefs ?? [], createdOffsetMs: p.dayOffsetMs,
    counters: {
      valuableWeighted: valuable, distinctCommenters: commenters.size,
      replyCount: postComments.filter((c) => c.parentIdx !== null && c.parentIdx !== undefined).length,
      saveCount: saves, qualifiedReads: exposures.filter((x) => x.viewportQualified).length,
      returns7d: Math.round(exposures.length * 0.08), qualifiedExposureCount: exposures.length,
      lastEligibleInteractionOffsetMs: lastEligible,
    },
  };
  if (p.type === "review") row.review = { toolId: e.toolId ?? p.toolRefs?.[0] ?? "", verdictScore: e.score ?? 4, verdictSummary: e.verdictSummary, pros: e.pros ?? [], cons: e.cons ?? [] };
  if (p.type === "compare") row.compare = { toolIds: e.toolIds ?? p.toolRefs ?? [], qualitativeGrid: { criteria: e.criteria ?? [], winner: e.winner ?? "depends", reasoning: e.reasoning ?? "" } };
  if (p.type === "spark") row.spark = { statement: e.statement ?? p.body.slice(0, 280) };
  if (p.type === "debate") {
    const votes = interactions.filter((x) => x.kind === "debateVote" && String(x.postI) === ref);
    row.debate = { proposition: e.proposition ?? p.title, agreeCount: votes.filter((v) => v.choice === "agree").length, disagreeCount: votes.filter((v) => v.choice === "disagree").length, abstainCount: votes.filter((v) => v.choice === "abstain").length };
  }
  if (p.type === "list") row.list = { mode: e.mode ?? "community_ranked", intro: e.intro ?? "", items: (e.items ?? []).map((content, k) => ({ content, createdByEmail: `${p.author}@demo.createconomy.invalid`, voteCount: interactions.filter((x) => x.kind === "listItemVote" && String(x.postI) === ref && x.itemIdx === k).length, sortOrder: k })) };
  if (p.type === "showcase") row.showcase = { theThing: e.theThing ?? p.title, projectUrl: e.projectUrl };
  if (p.type === "help") row.help = { problemStatement: e.problemStatement ?? p.title, resolvedStatus: interactions.some((x) => x.kind === "accept" && String(x.postI) === ref) ? "resolved" : "open" };
  if (p.type === "news") {
    const gtPost = readJson(".demo-world-cache/p3/ground-truth-posts.json")[i] ?? {};
    row.news = { sourceOfTruthUrl: gtPost.newsSource ?? "https://example.com", keyClaims: e.keyClaims ?? [p.title], publishedOffsetMs: p.dayOffsetMs };
  }
  return row;
});
for (const [i, c] of chunk(postRows, 8).entries()) console.log("posts", JSON.stringify(run("importPosts/importPosts", { seq: i, worldEnd, rows: c })));

// 3. comments — one call per post (same-mutation thread semantics)
{
  const byPost = new Map();
  comments.forEach((c) => { const k = String(c.postI); (byPost.get(k) ?? byPost.set(k, []).get(k)).push(c); });
  let seq = 0;
  for (const [postRef, rows] of byPost) {
    console.log("comments", JSON.stringify(run("importComments/importComments", {
      seq: seq++, worldEnd, postRef,
      rows: rows.map((c, k) => ({ ref: `${postRef}:${k}`, authorEmail: `${c.author}@demo.createconomy.invalid`, body: c.body, isQuestion: c.intent === "ask" || c.sentiment === "question", parentRef: c.parentIdx !== null && c.parentIdx !== undefined ? `${postRef}:${c.parentIdx}` : undefined, createdOffsetMs: c.offsetMs })),
    })));
  }
}

// 4. engagement
{
  const email = (h) => `${h}@demo.createconomy.invalid`;
  for (const [i, c] of chunk(interactions.filter((x) => x.kind === "reaction"), 100).entries()) {
    console.log("engagement", JSON.stringify(run("importEngagement/importEngagement", {
      seq: i, worldEnd,
      reactions: c.map((x) => ({ userEmail: email(x.user), commentRef: `${x.postI}:${comments.findIndex((cm) => cm.postI === x.postI && cm.author === x.user)}`, type: x.type, reason: x.reason, offsetMs: x.offsetMs })),
      commentSaves: [], postSaves: [], debateVotes: [], listItemVotes: [], contextSignals: [], accepts: [], toolRatings: [],
    })));
  }
  // (saves/votes/ratings/accepts follow the same pattern — full driver maps them all)
}

// 5. events + buckets, 6. notifications, 7. ground truth, 8. images,
// 9. finalizeMemberCounts, 10. settle jobs — see README (driver shipped with
// the build; run order documented). This file is the executable contract.
console.log("import driver: staged — full engagement/events/images/settle stages land with the first approved import run");
