#!/usr/bin/env node
/** Local driver prep — builds batch INPUT files for zcode sub-agents (P3 posts, P4 comments).
 * Same contracts as the API prompts (author+truth+realism fused; commenter with planned
 * sentiment). Output agents write local-out/*.jsonl; merge-local.mjs merges temp→rename. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { readJson, cachePath } from "./lib/util.mjs";

const phase = process.argv[2] ?? "p3";
const IN = cachePath(`local-in/${phase}`);
const OUT = cachePath(`local-out/${phase}`);
rmSync(IN, { recursive: true, force: true });
mkdirSync(IN, { recursive: true });
mkdirSync(OUT, { recursive: true });

const members = Object.fromEntries(readFileSync(cachePath("p2/members.jsonl"), "utf8").trim().split("\n").map((l) => { const m = JSON.parse(l); return [m.handle, m]; }));
const tools = Object.fromEntries(readJson(".demo-world-cache/p1/tools.json").map((t) => [t.slug, t]));

const AUTHOR_CONTRACT = `You are a community member of a creator forum writing posts IN YOUR OWN VOICE. You are not an assistant.
HARD RULES:
- FACTS: state tool facts ONLY from the TOOL FACTS given. If a tool's pricingVerified != "full", NEVER state its exact price as fact (speak from experience instead). For NEWS posts: report ONLY the given real event; never invent details beyond it.
- NO URLS anywhere (no http, www, dot-com).
- BANNED AI-TELLS (any = reject): delve, game-changer/game changer, "in today's", fast-paced, unlock, elevate, "Great question", "Here's the thing", em-dash chains, tidy three-part lists everywhere, a closing summary line, "dive into", "let's explore".
- VOICE: match the member's voice params and sample exactly (sentence length, formality 1-5, humor 0-3, emoji 0-3 max one emoji and only if rate>=2, occasional typo ONLY if typoRate>=1 and never in tool names, regional flavour).
- QUALITY: great = specific and useful; good = solid; mediocre = somewhat vague/dashed off; poor = genuinely low-effort/vague/too short (real people post like this sometimes).
- Before returning each post, SELF-CHECK: every tool claim is in the facts? any banned tell? voice matches? title not formulaic? Fix before writing.
Return ONLY a JSON array, one object per post: {"ref":"<ref>","title":"...","body":"...","extension":{...per type...}}
Extension by type: review:{toolId,score(1-5),pros[3-5],cons[3-5],verdictSummary}; compare:{toolIds,criteria[3-5],winner("slug"|"depends"),reasoning}; debate:{proposition,stance("agree"|"disagree"|"mixed")}; help:{problemStatement}; list:{mode("community_ranked"|"static_creator"),intro,items[5-8]<=200chars}; showcase:{theThing}; spark:{statement<=280chars}; news:{eventTitle,keyClaims[2-4 from the event only]}.`;

const devtestCard = { handle: "devtest", name: "Devtest", role: "creator", nichePrimary: "monetisation", country: "United States", expertiseLevel: "intermediate", voice: { sentenceLength: "medium", formality: 3, humor: 1, emojiRate: 0, typoRate: 0, flavor: "plain international", signatureHabits: ["plain, direct"], sample: "I build small things and write about what breaks. Testing this community out." } };

const plan = readFileSync(cachePath("p3/post-plan.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
const gtPosts = readJson(".demo-world-cache/p3/ground-truth-posts.json");
const newsPool = [
  { event: "OpenAI permanently shut down the Sora 2 models and Videos API on 2026-09-24; no successor named", url: "https://help.openai.com" },
  { event: "Suno launched v6 (Sept 9) built on licensed catalogs with Warner/BMG/Believe, retiring older models; UMG and Sony filed a ~$9B lawsuit over it the week of Sept 18", url: "https://suno.com/pricing" },
  { event: "UMG and ElevenLabs signed a multi-year licensing deal (Sept 10) starting with a licensed AI music remix platform", url: "https://elevenlabs.io" },
  { event: "September price war: Anthropic's Claude Opus 5.5 at 20% lower token price and OpenAI's GPT-6 Sol/Luna at ~half prior API price, both on Sept 22", url: "https://www.anthropic.com/news/claude-opus-5-5" },
  { event: "Claude Sonnet 5.5 released Sept 28: 30%+ faster at the same token price", url: "https://www.anthropic.com/news" },
  { event: "ElevenLabs valuation doubled to $22B via a $300M tender offer (Sept 30)", url: "https://biz.chosun.com" },
  { event: "GitHub Copilot gained computer use Oct 1; four models deprecated Oct 2 including Claude Opus 4.7", url: "https://github.blog/changelog/" },
  { event: "ElevenLabs released Eleven v4, its most emotive voice model (Sept 28)", url: "https://elevenlabs.io" },
  { event: "Filmora 16 shipped camera tracking, AI media analysis, 360 reframing (Sept 23)", url: "https://filmora.wondershare.com/whats-new-in-filmora-video-editor.html" },
  { event: "Synthesia made its AI Assistant auto-b-roll free on all plans (Sept 15)", url: "https://www.synthesia.io" },
  { event: "Patreon shipped 30 creator features incl. Clips and post-level discovery (Aug 20)", url: "https://techcrunch.com/2026/08/20/patreon-launches-30-new-creator-features-including-short-form-clips-and-revamped-discovery/" },
  { event: "Runway announced Solaris, its first 'Interface World Model' research preview (Aug 31)", url: "https://runway.com/research" },
];

if (phase === "p3") {
  // deterministic news assignment in plan order (same order as crowd reads plan)
  let newsIdx = 0;
  const newsAssign = [];
  const BATCH = 20;
  const batches = [];
  for (let i = 0; i < plan.length; i += BATCH) batches.push(plan.slice(i, i + BATCH));
  for (const [bi, batch] of batches.entries()) {
    const rows = batch.map((p) => {
      const m = members[p.author] ?? devtestCard;
      const facts = [...new Set(p.toolRefs ?? [])].map((s) => { const t = tools[s]; return t ? `${t.name} (${t.niche}; pricing: ${String(t.pricingTiers).slice(0, 160)}; verified=${t.verified}; strengths: ${t.strengths.slice(0, 3).join("; ")}; weaknesses: ${t.weaknesses.slice(0, 3).join("; ")})` : null; }).filter(Boolean).join("\n");
      const news = p.type === "news" ? newsPool[newsIdx % newsPool.length] : null;
      if (news) { newsAssign.push({ i: plan.indexOf(p), eventTitle: news.event, url: news.url }); newsIdx++; }
      const qualityNote = { great: "one of your best posts: specific, useful", good: "a solid, normal post", mediocre: "mediocre: somewhat vague, dashed off", poor: "genuinely poor: vague, low-effort, too short" }[p.quality];
      const lengthNote = p.type === "spark" ? "statement only" : p.quality === "poor" || p.quality === "mediocre" ? "30-120 words" : p.quality === "good" ? "120-350 words" : "300-700 words";
      return {
        ref: String(plan.indexOf(p)), author: p.author, type: p.type, topic: p.topicTitle, niche: p.niche,
        member: { role: m.role, expertise: m.expertiseLevel, country: m.country, voice: m.voice },
        toolFacts: facts || null, newsEvent: news, quality: p.quality, qualityNote, lengthNote,
      };
    });
    writeFileSync(path.join(IN, `batch-${String(bi).padStart(2, "0")}.json`), JSON.stringify({ contract: AUTHOR_CONTRACT, posts: rows }, null, 1));
  }
  writeFileSync(cachePath("p3/news-assignment.json"), JSON.stringify(newsAssign, null, 1));
  console.log(`p3 prep: ${batches.length} batch files, ${plan.length} posts, ${newsAssign.length} news assignments`);
}

if (phase === "p4") {
  const comments = readFileSync(cachePath("p4/comments-plan.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const posts = existsSync(cachePath("p3/posts.jsonl")) ? readFileSync(cachePath("p3/posts.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l)) : [];
  const BATCH_POSTS = 8;
  const postIds = [...new Set(comments.map((c) => String(c.postI)))];
  const groups = [];
  for (let i = 0; i < postIds.length; i += BATCH_POSTS) groups.push(postIds.slice(i, i + BATCH_POSTS));
  const COMMENTER_CONTRACT = `You are community members writing ONE comment each, in each member's own voice. Not an assistant.
HARD RULES: 1-4 sentences (one-liners fine for quick reactions); NO URLs; no banned AI-tells (delve, game-changer, unlock, elevate, "Great question", "Here's the thing", closing summary); match each member's voice params and sample; comments with sentiment=question must actually ask something; REPLIES (isReply=true): find the row with ref=parentRef in this same batch — you are answering THAT comment's actual content, reference it specifically; debate comments state the planned stance explicitly; never state exact prices for tools unless given as fact.
Return ONLY a JSON array: {"ref":"<ref>","body":"..."}`;
  for (const [gi, group] of groups.entries()) {
    const rows = [];
    for (const pid of group) {
      const p = posts.find((x) => x.ref === Number(pid)) ?? posts[Number(pid)];
      if (!p) continue;
      const postComments = comments.filter((c) => String(c.postI) === pid).sort((a, b) => a.offsetMs - b.offsetMs);
      postComments.forEach((c, k) => {
        const m = members[c.author] ?? devtestCard;
        // parentIdx indexes the GLOBAL plan; resolve it to this post's sorted-k so parentRef matches the ref scheme
        const parentGlobal = c.parentIdx !== null && c.parentIdx !== undefined ? comments[c.parentIdx] : null;
        const parentK = parentGlobal ? postComments.indexOf(parentGlobal) : -1;
        rows.push({
          ref: `${pid}:${k}`, postTitle: p.title, postType: p.type, postExcerpt: p.body.slice(0, 300),
          author: c.author, member: { voice: m.voice, role: m.role, country: m.country },
          sentiment: c.sentiment, intent: c.intent, stance: c.stance, isReply: parentK >= 0,
          parentRef: parentK >= 0 ? `${pid}:${parentK}` : null,
          parentPreview: parentK >= 0 ? `(by ${parentGlobal.author}, sentiment ${parentGlobal.sentiment}, intent ${parentGlobal.intent})` : null,
          badActorRole: c.badActorRole ?? null,
        });
      });
    }
    if (rows.length) writeFileSync(path.join(IN, `batch-${String(gi).padStart(2, "0")}.json`), JSON.stringify({ contract: COMMENTER_CONTRACT, comments: rows }, null, 1));
  }
  console.log(`p4 prep: ${readdirSync(IN).length} batch files, ${comments.length} comments`);
}
