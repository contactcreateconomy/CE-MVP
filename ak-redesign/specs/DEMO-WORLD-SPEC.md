---
id: DEMO-WORLD-SPEC
type: SPEC
author: Claude (PM), approved by founder
date: 2026-10-03
status: APPROVED — execute phase by phase, stop at every GATE
builder: GLM (zcode) · reviewer: Grok (every phase) · approver: founder (every gate)
---

# Demo World Engine — build spec

## 0. Why this exists (read first, then re-read before every phase)

We are redesigning the Createconomy feed so the whole page behaves as one
organism: every widget (hero, What's Vibing, Podium, Discover, cards)
morphs from the same data. To design and judge that experience, and to
test sentiment and analytics later, we need a **living, truthful world**
in the local database: 500 members, 5,000 posts, ~45,000 comments,
reactions, votes, ratings, spread across 60 days.

This is a **one-time effort**. Quality beats speed. If a choice trades
realism for convenience, choose realism and report it.

**The five non-negotiables:**
1. **Everything lives as rows in the local Convex database.** Nothing is
   hard-coded in UI or product code. The UI reads it through the real
   queries.
2. **Truth.** Facts about tools, features, pricing and events must be
   real and checked. Opinions are allowed; invented facts are not.
3. **Real behaviour.** People differ. Activity follows a power law,
   sentiment varies, threads evolve over time, some posts get no replies.
4. **Removable.** Every demo row is registered and can be deleted by one
   script, leaving the database exactly as it was.
5. **Replayable.** Generate once, save as data files, replay forever.
   Every machine sees the identical world.

**The world:** AI tools for creators — video, writing, design, audio,
automation, monetisation. Members are creators, freelancers, learners
and builders who use these tools to make and sell work.

---

## 1. Rules you must follow throughout

- **Stop at every GATE.** Report, show the samples asked for, and wait
  for the founder's "go". Never continue past a gate on your own.
- **Never write projections by hand.** Counters, scores, aggregates,
  rankings, trends, leaderboards and thread stats are computed by the
  platform's own jobs and mutations. You write only **authoritative
  events** (users, posts, comments, reactions, votes, ratings, saves,
  rawEvents) and then run the real jobs. If a job can't run on
  backdated data, STOP and report; don't hack around it.
- **Respect every platform rule** in the module sheets (`/M*.md`) and the
  schema: one reply depth (M6 INV-1), no user URLs in posts/comments
  (DEC-M4-URL), post-type structures (M4), tool ratings only from
  non-staff humans (M5 INV-5), one rating per member per tool.
- **No personas.** Personas (M8) are a separate later layer. Create none.
  Demo members are human-shaped accounts, flagged as demo.
- **Secrets:** read API keys only from environment variables. Never print,
  log, commit or echo a key. If a log line could contain one, redact it.
- **Resumable and idempotent:** every generation step works in batches,
  writes its output to the cache, and can resume after a crash without
  duplicating or re-paying for finished work.
- **Cost and time log:** record calls, tokens, images and duration per
  phase in `scripts/demo-world/RUN-LOG.md`.
- **One branch:** `demo-world` from `011-Akilesh-Redesign`. Commit at each
  gate as `[DEMO][Pn][GLM] …`. Push. Grok reviews each phase.

---

## 2. Where things live

| What | Where | In git? |
|---|---|---|
| Generator (Node/TS scripts) | `scripts/demo-world/` | yes |
| Import + removal (Convex internal functions) | `convex/demoWorld/` | yes |
| Work cache (raw LLM output, images, checkpoints) | `.demo-world-cache/` | **no** (add to .gitignore) |
| Final text snapshot (accepted world) | `seed-data/demo-world/v1/*.jsonl.gz` | yes, only the final accepted version |
| Final image bundle | `.demo-world-cache/images/` + a zip for other machines | **no** |
| Keys | `.env.local` at repo root | **no** (verify gitignored) |
| Reports | `scripts/demo-world/reports/` | yes |

The generator calls the LLM from Node only. **Keys never enter Convex.**
Convex only receives finished data through internal import functions.

### Environment variables (founder pastes values; you only read them)
```
DEMO_LLM_BASE_URL     OpenAI-compatible base URL of the GLM endpoint
DEMO_LLM_API_KEY      key
DEMO_LLM_MODEL        model id (GLM Flash)
DEMO_LLM_MAX_CONCURRENCY   default 8
PEXELS_API_KEY        cover photos
DEMO_IMAGEGEN_MODEL   optional: image-generation model id for avatars
```
If a variable is missing, stop with a clear message naming it.
*(Amended 2026-10-03 — Pexels was stopped; see §6 addenda for Unsplash +
keyless fallbacks and the approved local-generation driver.)*

---

## 3. The agents (multi-agent pipeline)

The generator is a pipeline of role agents. Each agent is a prompt + a
JSON output schema + validation. Each has one job. Agents never see the
whole world, only the context their job needs.

| Agent | Job | Output |
|---|---|---|
| **World Architect** | Defines niches, topics, the 60-day calendar of what the community is talking about | `world.json` |
| **Fact Keeper** | Builds and verifies the tool fact sheet (web-checked) | `tools.json` |
| **Casting Director** | Creates 500 member cards | `members.jsonl` |
| **Editor-in-Chief** | Plans 5,000 posts (who, what type, topic, tools, quality, when) without writing text | `post-plan.jsonl` |
| **Author** | Writes one post in the voice of its member, following the type structure | `posts.jsonl` |
| **Crowd Simulator** | Decides, day by day, who sees, reacts to, saves, votes on and comments on each post | `interactions.jsonl` |
| **Commenter** | Writes one comment or reply in the voice of its member, given the post and the thread so far | `comments.jsonl` |
| **Truth Checker** | Checks every factual claim against `tools.json` and verified sources; rewrites or rejects | verdict per item |
| **Realism Critic** | Rejects AI-sounding text, voice drift, repetition across items | verdict per item |
| **Sentiment Auditor** | Checks sentiment/stance/intent distributions against targets; requests rebalancing | `reports/sentiment.md` |
| **Image Curator** | Writes a visual brief per post, finds or generates a unique, relevant image | `images.jsonl` |

The **orchestrator** runs agents in order, in parallel batches up to
`DEMO_LLM_MAX_CONCURRENCY`, with retries and the cache. If zcode can run
sub-agents to build pipeline parts in parallel, do so, but there is one
orchestrator and one source of truth.

The Truth Checker and Realism Critic are **independent passes** (separate
calls), never the author grading itself.

---

## 4. Phases

### P0 — Recon (no generation yet)
1. `pnpm session:start`. Branch `demo-world` from 011.
2. Read: the schema, existing seed scripts, `reset:local`, `seed:check`
   and `scripts/seed-fingerprint.txt`, any demoSeed guard (CR-001),
   `postTypeConfig`, the composer/post mutations, comment/reaction/vote/
   rating mutations, `rawEvents`, and every projection/cron job used by
   M9 (rank, exploration, vibing, hero auto-fill, leaderboard), M12
   (Recognition), M5 (tool aggregates), M6 (thread stats, comment
   scores).
3. For each job, find **which timestamp field it reads** (`createdAt`
   fields vs `_creationTime`). `_creationTime` can't be backdated. List
   any job that depends on it.
4. Decide the import path per table: an existing internal mutation, or a
   new `convex/demoWorld/` internal mutation that writes the same fields
   the real mutation writes.
5. Design the **demo registry**: a table `demoRegistry` {table, docId,
   batch} so removal needs no change to other tables. Removal deletes in
   dependency order and runs projection repair jobs afterwards.
6. Design **time re-anchoring**: store all times as offsets from
   "world end". On every import, world end = now. The world always
   looks current, so 24H and 7D windows always have activity.
7. Check `.gitignore` covers `.env.local` and add `.demo-world-cache/`.
8. Make one tiny test call to the LLM (reply "ok") and one Pexels search.
   Report success without printing keys.
9. Estimate the number of calls, tokens, time and storage for the full run.

**GATE P0:** report findings, the import path table, every risk
(especially `_creationTime` dependencies), the estimate. Wait.

### P1 — The world and the facts
1. **World Architect:** niches with weights:
   video 25% · writing 20% · design 15% · audio/podcast 10% ·
   automation/agents 15% · monetisation/business 15%.
   For each niche: 8–15 recurring topics, and the 60-day calendar:
   which topics heat up when (a tool launch, a pricing change, a
   recurring debate). Real-world rhythm: weekdays busier than weekends,
   a few spikes, one or two quiet stretches.
2. **Fact Keeper:** ~100 real AI tools creators actually use, spread
   across niches. Per tool: name, official URL, category, what it does,
   pricing model and tiers **as of the check date**, 3–5 genuine
   strengths, 3–5 genuine weaknesses or common complaints, notable
   recent changes. **Verify with web search** where available; record
   `verifiedAt` and the source URLs. If something can't be verified,
   mark it `unverified` and authors may not state it as fact.
3. Load the tools into the tool registry (M5) through the import path.
   Existing seeded tools: keep them, merge, no duplicates by slug.

**GATE P1:** niche/topic summary, the calendar, the full tool list (name,
category, pricing, verified yes/no). Wait.

### P2 — The members
**Casting Director**, 500 members. Each card:
- name (globally diverse, realistic), handle, country, timezone
- niche (primary + optional secondary), role: creator / freelancer /
  learner / builder / agency / hobbyist
- expertise level, years of experience, tools they actually use (from
  `tools.json`)
- **voice:** sentence length, formality, humour, emoji use, typo rate
  (0–8%), regional English flavour where natural, signature habits;
  plus a 3-sentence **voice sample** saved to keep them consistent
- **temperament:** agreeableness, scepticism, generosity (how often they
  help), contrarianism
- **activity tier** (power law):
  - power users 4% (~20): post a lot, comment daily
  - regulars 16% (~80)
  - occasionals 35% (~175)
  - quiet 45% (~225): mostly read, react, rarely comment, may never post
- join date (spread over 180 days before world start), verification
  status (most verified, some not), bio, avatar brief, has-avatar (85%)
- **bad actors, 15 total, flagged in ground truth only:** a 5-account
  upvote ring; 4 low-effort comment farmers; 3 self-promoters; 3
  hostile/troll accounts. They behave badly but within what a real site
  would see. They exist to prove legitimacy weighting and moderation work.

Also give the existing **devtest** account a light life: 5 posts, some
replies to them, some reactions, so the founder's own profile and
notifications feel real when he logs in.

Accounts have no passwords; emails use `@demo.createconomy.invalid`.

**GATE P2:** distribution table (niche, role, tier, country), 20 sample
cards across tiers including 2 bad actors. Wait.

### P3 — The posts
1. **Editor-in-Chief plans all 5,000 first, no text.** Per post: author,
   type, topic, tools referenced, simulated day and hour (author's
   timezone), latent quality, intended reception, cover yes/no.
   - Type mix: help 18 · review 18 · showcase 12 · spark 12 · news 10 ·
     debate 10 · compare 10 · list 8 (%). Launch Pad and Gigs are locked
     (M4); create **none** unless P0 shows they're active.
   - Quality: great 15% · good 45% · mediocre 30% · poor 10%.
   - Authors post in their niche and with tools they use; power users
     produce most posts; quiet members almost none.
   - Covers on ~35% of posts (more for showcase/news/review, fewer for
     help/debate).
2. **Author** writes each post in its member's voice, using the real M4
   structure for its type:
   - **review:** one tool, a 1–5 score, real pros/cons consistent with the
     fact sheet and the member's experience
   - **compare:** 2–3 tools, criteria, a winner or "depends", reasoning
   - **debate:** a real proposition the creator community actually argues
     about, the author's opening position
   - **help:** a concrete, specific problem (tool, setup, what they tried)
   - **list:** mode (community-ranked or static), intro, 5–10 items
   - **showcase:** the thing they made, how, with which tools
   - **spark:** a short take, ≤280 chars
   - **news:** **only real, verifiable events** with a source recorded in
     ground truth, dated plausibly inside the world window. If you can't
     verify enough real news, **reduce News and move the slots to Spark**,
     and report it. Never invent news.
   - Lengths vary widely: one-liners to long write-ups. Poor posts are
     genuinely poor (vague, low effort), not just short.
3. **Truth Checker** on every post: every factual claim about a tool must
   match `tools.json`; unsupported claims get rewritten as clearly
   personal experience or removed. Rejects get regenerated.
4. **Realism Critic** on every post. Reject:
   - AI tells: "delve", "game-changer", "in today's fast-paced",
     "unlock", "elevate", "Great question!", "Here's the thing", stacked
     em-dashes, tidy three-part lists everywhere, a closing summary line
   - voice drift from the member's sample
   - near-duplicates of other posts (check titles and openings)
   - titles that all follow one pattern

**GATE P3:** 30 sample posts (≥3 per type, all quality levels), the type
and quality distribution, Truth/Realism rejection rates. Wait.

### P4 — The conversation (simulated day by day)
Run the 60 days in order. For each day:
1. **Crowd Simulator** decides who is active today (tier, timezone,
   weekday), what they see (their niche first, some cross-niche), and
   what they do: read, react Valuable, save, vote, rate a tool, comment,
   reply, accept an answer, or nothing. Better posts earn more; poor
   posts mostly get silence; ~20% of posts never get a comment; a few
   posts take off.
2. **Commenter** writes each comment **with the post and the thread so far
   in context**, in the member's voice, at that moment in the thread.
   Threads evolve: early reactions → replies and corrections → late
   additions. Replies quote or answer earlier comments specifically.
3. Comments are generated in **waves per day**, never a whole thread at
   once, so later comments can respond to earlier ones.
4. **Sentiment and intent are planned per comment**, not left to chance.
   Labels:
   - sentiment: supportive · appreciative · informative · question ·
     constructive critique · sceptical · disagreement · humour ·
     frustration · harsh (rare, still within community rules) ·
     off-topic (rare)
   - intent: answer · ask · share experience · correct · agree ·
     challenge · thank · joke
   - debate stance: agree · disagree · nuanced
   Overall target mix (the Sentiment Auditor enforces ±3%):
   supportive/appreciative 33 · informative 20 · question 14 ·
   constructive critique/sceptical 15 · disagreement 9 · humour 5 ·
   frustration 2.5 · harsh 0.5 · off-topic 1 (%).
   **Vary by post type:** debates carry far more disagreement and stance;
   help is mostly questions and answers; reviews include people whose
   experience contradicts the author; showcases skew supportive with real
   critique; sparks get quick reactions and jokes.
   **Vary by member:** temperament shifts each member's mix.
5. Mechanics:
   - **Help:** ~60% get an accepted answer, chosen by the author, usually
     the genuinely best one, sometimes not.
   - **Debate:** votes from many more members than commenters; splits
     range from lopsided to near 50/50.
   - **List:** community-ranked lists get item votes; members add items.
   - **Tool ratings:** ~3,000 across tools, consistent with each member's
     experience, with honest variance (no tool is all 5s).
   - Reactions: Valuable mostly; saves sparingly; the hidden negative
     reaction and context signals ("needs evidence") occasionally, per
     M6 rules.
   - **Bad actors** act out their role: the ring upvotes each other, farmers
     post short generic comments, promoters push their stuff, trolls get
     harsh. Moderation-worthy items should be caught by the platform's
     own moderation path if it runs on import; report what happens.
6. **rawEvents:** record exposures/views/dwell at a sampled rate so
   ranking and exploration have qualified-exposure data. Target
   ≤500k rows total; report the actual count and import time.
7. Target totals (±10%): ~45,000 comments/replies · ~120,000 Valuable ·
   ~15,000 saves · ~25,000 debate votes · ~3,000 tool ratings.

**GATE P4:** 5 complete threads (one help, one debate, one review, one
showcase, one that took off), the sentiment report vs targets, activity
curves per day, totals. Wait.

### P5 — Images
1. **Image Curator** writes a visual brief per post with a cover: subject,
   mood, setting, no text, no logos, no recognisable people.
2. **Covers:** search Pexels with queries built from the brief. Pick the
   best-matching result that has **never been used before** (track every
   photo id globally; each photo once). Download, crop to 16:9 and 4:3,
   convert to WebP, ~1200px wide, ≤150 KB. Record photographer and
   source URL in ground truth (attribution).
3. **Avatars:** never use photos of real people as fake members.
   Use the image model (`DEMO_IMAGEGEN_MODEL`) for ~60% of avatars
   (varied, natural portraits of non-existent people, diverse, not
   uniform studio shots), illustrated styles for ~25%, and no avatar for
   ~15% (shows the default). If the image model isn't configured, use
   illustrated avatars for all, and report it.
4. No image may repeat. No placeholders, no blank frames.
5. Build `reports/contact-sheet.html`: all covers in a grid grouped by
   type, plus 100 avatars. The founder opens it locally to judge.

**GATE P5:** the contact sheet, counts, any rejected images. Wait.

### P6 — Import into the local database
1. Upload images to Convex local file storage (media assets) through the
   import path. Link covers and avatars.
2. Import in dependency order: tools → members → posts (+ type tables) →
   comments → reactions/saves/votes/ratings → rawEvents. Every row goes
   into `demoRegistry`. Re-anchor times so world end = now.
3. Run the real projection jobs until they settle: ranking, exploration,
   vibing (+ hooks if generation runs locally), hero auto-fill,
   Recognition/leaderboard, tool aggregates, thread stats, comment scores.
4. Wire it into the ritual: `reset:local` replays the snapshot and images;
   update `seed-fingerprint.txt`; `seed:check` passes.
5. **Removal test:** run the removal script → zero demo rows, projections
   repaired, the base seed intact → re-import → identical fingerprint.
6. Open `/feed` at 390 and 1440, dark and light. Screenshots. Check every
   widget shows real data: hero, Vibing, Podium (above the 25-contributor
   floor), cards with covers, comments, avatars.

**GATE P6:** screenshots, row counts per table, import time, fingerprint,
removal test result. Wait.

### P7 — Ground truth, reports, handover
1. Store ground truth in a demo-only table `demoGroundTruth` (registered,
   removable) and in the snapshot: per member (traits, tier, bad-actor
   role), per post (latent quality, intended reception, verified sources),
   per comment (planned sentiment, intent, stance). This lets us later
   **measure** whether our sentiment, ranking and legitimacy systems find
   the truth.
2. Reports in `scripts/demo-world/reports/`: distributions (niche, type,
   quality, activity, sentiment by type), top posts by each sort, the bad
   actors' outcome (did legitimacy weighting neutralise them?), cost log.
3. `scripts/demo-world/README.md`: how to replay, remove, regenerate,
   share the image bundle with another machine.
4. Commit the final snapshot (only once accepted), push, `pnpm session:end`.

**GATE P7:** reports and README. Grok final review. Founder accepts.

---

## 5. Done means
- `/feed` feels like a living community at first glance, at 390 and 1440.
- Nothing in UI or product code changed to make it look that way.
- Every fact is checked; no image repeats; no text reads as AI-written.
- One command removes it all; one command brings it back, identical.
- The ground truth exists to test sentiment and analytics against.

---

## 6. Founder addenda (2026-10-03, in-session — binding; supersede the matching lines above)

**A1 — Image sourcing (Pexels stopped).** `PEXELS_API_KEY` is removed from
the env contract. Covers are sourced, in this order:
1. **Unsplash** (primary) — `Unsplash_Access_key` in root `.env.local`,
   demo quota **50 requests/hour**. The quota cannot cover ~1,750 covers,
   so Unsplash is reserved for the most visible covers (showcase, news,
   review fronts) and the search budget is paced inside 50/hr.
2. **Keyless fallbacks for the long tail** — `https://picsum.photos/`
   (unique by seed) and `https://api.artic.edu/` (public-domain artworks,
   unique by artwork id, attribution available). Free, random-subject,
   and explicitly approved by the founder: "you can use anything until
   it serves the purpose — no questions asked."
Uniqueness is tracked globally across ALL sources (every photo/artwork id
used at most once, avatars never reuse cover ids). Attribution is recorded
in ground truth wherever the source provides it. All other P5 rules stand
(16:9 + 4:3 crops, WebP ~1200px, ≤150 KB, no repeats, no placeholders).

**A2 — Generation driver (local generation approved).** The founder
approved building the world without relying on the external API: GLM
(zcode, including sub-agents) may author any or all agent outputs
directly. Both drivers — `api` (`DEMO_LLM_*`, configured and P0-tested)
and `local` (zcode sub-agents) — consume the same **committed prompt
files** (`scripts/demo-world/prompts/*.md`) and emit the same cache and
snapshot formats, so a phase can switch drivers mid-run without
invalidating finished, cached work. The API driver remains the default
for bulk passes (posts, comments); the local driver is preferred for
architecture, fact cross-checks, exemplars and gate samples.

**A3 — Env contract delta.** Removed: `PEXELS_API_KEY`. Added:
`Unsplash_Access_key` (used), `Unsplash_ApplicationID` / `Unsplash_Secret_key`
(present, unused by the generator). Everything else unchanged. Keys live
only in root `.env.local` (gitignored — verified in P0).

**A4 — Reasoning tokens.** The LLM endpoint emits a reasoning channel
(34 of 54 tokens on the P0 probe). Estimates and per-call `max_tokens`
budgets account for it; parsers read `message.content` only. Logged in
`scripts/demo-world/RUN-LOG.md`.
