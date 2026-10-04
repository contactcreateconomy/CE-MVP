# DEMO-WORLD — P0 Recon Report (GATE P0)

- **Branch:** `demo-world` (from `011-Akilesh-Redesign` @ `132bae0`, per spec §1)
- **Date:** 2026-10-03 · **Builder:** GLM (zcode) · **Status: waiting at GATE P0**
- **Revision 2 (2026-10-04):** fixed per `P0-GROK-REVIEW.md` (verdict **PASS WITH FIXES**, 34 claims / 28 confirmed / 6 wrong — all six findings corrected below) and the PM decisions recorded as spec §6 addendum **A5**. CR-010 is retired and split into CR-011…CR-014. No generation, no DB writes, no keys printed/logged/committed.
- No generation performed. No DB rows written. No keys printed/logged/committed.
- Evidence gathering: 3 read-only recon agents (schema+mutations · jobs+timestamps · seed ritual+module rules) + direct probes. All file:line references below were verified against the working tree.

---

## A. Summary — the ten things that decide everything downstream

1. **Convex 1.34.1 cannot backdate `_creationTime`.** `ctx.db.insert` type-strips system fields (`node_modules/convex/dist/cjs-types/server/database.d.ts:184-189`, `system_fields.d.ts:10-25`); passing it throws document validation. Every imported row gets `_creationTime` ≈ import moment. **All indexes tiebreak on `_creationTime`** → import must insert in world-chronological order per table.
2. **Only two functions in the whole backend read `_creationTime`:** `jobs/legitimacy.ts:142-143` (account_age component) and `analytics/projections.ts:154` (medianAgeDays). Every other job is governed by **document timestamp fields we CAN backdate** (`createdAt`, `publishedAt`, `occurredAt`, `lastInteractionAt`, `bucketStart`, …).
3. **Public mutations are unusable for import** — independent of scale: `classifySafety` returns `{available:false}` without `MODERATION_CLASSIFIER_*` env, so `posts.createPost` would leave every post `lifecycleStatus:"ready", moderationStatus:"pending"` (never published) and every comment pending (`lib/classifier.ts:23-26`). Also: live auth sessions required, `member.posts.hour` 10/h + `member.comments.hour` 60/h + `reactions.toggle` 60/5m rate limits, and **no create mutation accepts a timestamp argument** (all `Date.now()` server-side).
4. **The sanctioned import pattern already exists:** `convex/seed/demo.ts` does direct `ctx.db.insert` with backdated document times, guarded by `seed/devGuard.ts:12-21` (loopback allowlist — the STRONG guard; CR-001 exists because `dev/demoSeed.ts` uses the weak one). `convex/demoWorld/` will follow `seed/demo.ts` exactly.
5. **Every authoritative table carries its own backdatable timestamp field** (`users.createdAt`, `posts.createdAt/publishedAt`, `comments.createdAt/lastActivityAt`, `commentReactions/commentSaves/commentContextSignals/saves/debateVotes/listItemVotes/postListItems/toolRatings.createdAt`, `rawEvents.occurredAt/receivedAt`, `notifications.createdAt`). For projections the split is **(rev 2, A5.1)**: `commentScores` rows import **dirty** and `rank.recomputeDirtyBatch` (`rank.ts:116-133`) genuinely recomputes them from `commentReactions`. `postDistributionScores` is different: `distributionRecompute` (`rank.ts:233-258`) only turns **counters already stored on the row** into `topScore`/`hotScore`/`trendScore` — it never reads events, and the only production insert of those counters is zeros (`lib/distributionScores.ts:38-57`). So the importer writes the **counters as exact tallies of the imported event rows** (the `seed/demo.ts` pattern, A5.1) plus `dirtySince`, and the real job computes the three scores. **Scores are never written by hand.** The production gap (no same-mutation counter writers despite the claim at `rank.ts:186-187`) is logged as **CR-014**, deferred to S02 wiring.
6. **`postDistributionBuckets` has NO writer anywhere in production code** (readers: `jobs/vibing.ts:42`, `jobs/rank.ts:243`). Without buckets, What's-Vibing computes from nothing and `trendScore` stays 0. Gate decision D-2 (recommendation: importer backfills buckets as deterministic rollups of the imported `rawEvents`, then the real `vibingCompute` job runs).
7. **`signal.award.sweep` only looks back 24h** (`signal/award.ts:212` — `Date.now() - 24*3_600_000`) — backdated outcome events older than 24h of wall-clock never award Signals. Recognition/leaderboard is NOT affected (it reads `postHelps`/`toolRatings`/`comment.createdAt` with a 30d window — all backdatable). Gate decision D-3 (recommendation: accept partial Signals; Podium works).
8. **`legitimacy.recompute` account_age reads `users._creationTime`** → every demo member counts as brand-new → geometric-mean legitimacy ≈ 0 for ALL demo members → Signal weights and reach deflated uniformly. `users.createdAt` exists and is what signup sets. Gate decision D-1 (recommendation: one-line CR to read `createdAt ?? _creationTime`).
9. **Images (rev 2, A5.3):** there is no `mediaAssets` table and `posts` has no image column. Covers are stored as `_storage` ids in the **existing** `postSeoMeta.ogImageAssetId` (`schema.ts:814`); avatars in `users.avatarAssetId` (plain string, `schema.ts:83`). Uploads run through an **internalAction** — `ctx.storage.store` is action-only (`node_modules/convex/dist/cjs-types/server/storage.d.ts:173-176`). Note: today's live feed queries read **neither** column (`feed.ts:100-122` returns no cover; the app never reads `avatarAssetId`) — display is **S02 wiring, not demo scope** (R14). Pexels is dead; Unsplash (200, 50/hr) + Pixabay (200, ~100/min) + Wikimedia Commons (200, keyless) + picsum/ArtIC fallbacks — spec §6 addendum A1.
10. **The LLM endpoint is live** (OpenAI-compatible chat completions, model `glm-5.3-flash`, reply `"ok"`, HTTP 200) **and the founder approved local generation** (addendum A2): both drivers share the same committed prompt files and cache formats. Reasoning tokens are emitted and billed (34 of 54 tokens on the probe) — budgets account for it.

---

## B. Environment, ritual, git

| Check | Result |
|---|---|
| `pnpm session:start` | Pull/lockfile steps passed; **data-parity FAILED**: computed fingerprint `3a8462326454` ≠ canonical `63fe5110e230` (known machine drift; documented fix = `reset:local`, needs founder `DEV_TEST_USER_PASSWORD`). Not a P0 blocker (P0 wrote nothing); must be resolved before P6 import (D-5). |
| Branch | `demo-world` created from `011-Akilesh-Redesign` (`132bae0`). Dirty `graphify-out/` from the s00-t04 session was stashed (`git stash` — "graphify-out hook refresh from s00-t04 session") so the PM's refresh survives; graphify hook auto-refreshed for the new checkout. |
| Base-branch gap | `convex/` is byte-identical between 011 and s00-t04 HEAD (verified: `git diff 132bae0..HEAD -- convex/` = empty). 011 lacks the D-012 UI de-fabrication (`ada2e4a`, awaiting Grok) → **GATE P6 screenshots would mix fabricated category/leaderboard UI with demo data** unless s00-t04 merges into 011 first (D-4). |
| `.gitignore` | `.env.local` covered (line 12, verified via `git check-ignore`). Added `.demo-world-cache/`. |
| Env vars present (names only — values never read into output) | `DEMO_LLM_BASE_URL`, `DEMO_LLM_API_KEY`, `DEMO_LLM_MODEL`, `DEMO_LLM_MAX_CONCURRENCY`, `DEMO_IMAGEGEN_MODEL`, `Unsplash_Access_key`, `Unsplash_ApplicationID`, `Unsplash_Secret_key`, plus Convex vars. **No `PEXELS_API_KEY`** (spec §6 A3 recorded). |
| LLM probe | 2 calls, 54 tokens each; call 2: HTTP 200, `finish=stop`, content `"ok"`, reasoning channel present. |
| Image probes | Unsplash search: HTTP 200, 1,391 results ("creator workspace"), quota 50/hr. Picsum: 200 image/jpeg. ArtIC: 200, 133,118 artworks. |

## C. Existing seed infrastructure (what the ritual does today)

- `reset:local` (`scripts/reset-local.mjs`): asserts local deployment → server-side `seed/devGuard:assertLocal` → **wipes ALL table data** via `convex import --replace-all` with an empty table → config seeds (`seed:bootstrap`, `legalContent:seedDefaults`, `rulebook:deploySeed`, `admin/widgetsCatalog:deploySeed`) → recreates `devtest@example.com` (password via env; staff roles via `FOUNDER_EMAILS`) → **`seed/demo:seed`** → `seed:check` fingerprint.
- `seed/demo:seed` (`convex/seed/demo.ts:1230-1250`) is the current demo content: 15 members + devtest + `platform@createconomy.internal` (17 users), 8 tools (slugs `demo-claude-code`, `demo-cursor`, `demo-notion`, `demo-substack`, `demo-beehiiv`, `demo-descript`, `demo-obsidian`, `demo-framer`), exactly 60 posts, 8 hand-built threads/stats, hand-written `postDistributionScores` (Bayesian topScore prior 5/0.3; hotScore `engagement × 2^(−ageHours/12)`), **hand-written** leaderboard/vibing/hero chrome, 6 devtest notifications. All times = `now − fixedOffset`; `_creationTime` never backdated. **It writes zero `rawEvents` and zero `postDistributionBuckets`.**
- `seed:check` (`scripts/seed-check.mjs` + `convex/seed/check.ts`): SHA-256 over per-table **counts** + stable identity keys (emails, post titles, tool slugs, notification dedupeKeys, badge labels) — never timestamps or generated ids. VOLATILE tables excluded from the hash (rawEvents, legitimacyScores, signalSummary, analyticsProjections, feedExplorationState, auth tables, …). ⇒ The demo world changes non-volatile counts (users/posts/comments/…), so **P6 must commit a new `seed-fingerprint.txt`** (spec already requires this). Replay determinism is preserved because the fingerprint ignores timestamps: re-anchored re-imports hash identically.
- `dev/demoSeed.ts` is a DIFFERENT (dest-visual-QA) seeder behind the weak guard; CR-001 (OPEN) asks to harden it. **`convex/demoWorld/` will use the strong `seed/devGuard` loopback guard from day one** (no CR-001 debt inherited).
- `devtest`: created by `dev/ensureTestUser:ensure`; handle `devtest`; full staff roles in local dev. Has **no authored content today** (only the 6 seeded notifications). Being staff, devtest **must not receive tool ratings** (M5 INV-5). P2 gives it 5 posts + replies + reactions (staff CAN post/comment; only rating + reaction-weight are restricted — reactions exclude staff as *reactors*, so demo reactions on devtest's content come from regular members, and devtest receives no rating rows).

## D. Schema surface — timestamp capability per demo table

Own-ts = document field we backdate. All tables below verified in `convex/schema.ts`.

| Table | Own-ts fields | Notes for import |
|---|---|---|
| `users` | `createdAt`, `lastActiveAt`, + lifecycle (`activatedAt`, `firstValueAt`, …) | copy `canonicalSignupFields` (`lib/founder.ts:149-197`) like both seeders; `bootstrapState:"complete"`, `postingEligibilityState:"eligible"`; `timezone` field exists (P2 uses it) |
| `posts` | `createdAt`, `publishedAt` | `lifecycleStatus:"published"`, `moderationStatus:"passed"` (or `"held"` for the moderation-demo slice), `visibility:"public"` |
| payload tables `postReviews/postCompares/postSparks/postDebates/postLists/postShowcases/postHelps/postNews` | none (fine — no time semantics) | `postDebates` tallies must equal imported `debateVotes` counts; `postHelps.resolvedStatus/acceptedCommentId/acceptedAt` set directly |
| `postListItems` | `createdAt` | `voteCount` must equal imported `listItemVotes` |
| `comments` | `createdAt`, `lastActivityAt` (`editedAt/deletedAt` optional) | depth ∈ {0,1} (INV-1); depth-0 self-patch `threadRootCommentId` |
| `commentReactions` / `commentSaves` / `commentContextSignals` | `createdAt` | one per (userId,commentId); `weightAtCast:1`; negative only with reason |
| `saves` (post) | `createdAt` | **no public writer exists at all** — direct insert is the only path |
| `debateVotes` / `listItemVotes` | `createdAt` | uniqueness via `by_user_post` / `by_user_item` |
| `toolRatings` | `createdAt` | `status:"active"`, `moderationStatus:"passed"`; 1–5 ints; N/A dims excluded from sums AND counts (M5 INV-3); one per member per tool (INV-2); non-staff only (INV-5) |
| `tools` | none exist | aggregates recomputed by real `tools.recomputeAggregate` (`tools.ts:534`) |
| `rawEvents` | `occurredAt`, `receivedAt` | direct insert ONLY — `captureEvent` hard-codes `Date.now()` and enforces the `eventCatalog` (CAP-437); catalogued names exist for `comment.created/reacted/saved/signaled`, `feed.card_action`, `search`, `resource_view`, `go_click`, … — no exposure/view name is catalogued (P4 design: use `eventClass:"exposure"` rows with a documented uncatalogued name; direct inserts bypass the gate; consumers that matter read by `occurredAt`) |
| `notifications` | `createdAt`, `updatedAt` | copy `notifyBatched` shape (`notifications/batch.ts:46`), unique `dedupeKey` |
| `threadStats` / `commentScores` / `postDistributionScores` / `postSeoMeta` / `cardSummaries` | `lastActivityAt/updatedAt`, `lastInteractionAt`, `lastEligibleInteractionAt/dirtySince/computedAt`, `generatedAt`, `createdAt` | PROJECTIONS — imported as minimal rows with **`dirty:true` / `dirtySince:now`** so jobs compute all numbers (unlike the current seed, which pre-scores with `dirty:false`) |
| `postRevisions` | `createdAt` | rev 1 per post, as `posts.createPost:332` does |
| `postDistributionBuckets` | `bucketStart` (hour/day granularity) | **no production writer** — see A6/D-2 |
| `categories` / `tags` | none | already seeded by `seed:bootstrap`; demo reuses them; no import |

## E. Jobs the demo must settle (P6) — time-field governance

All are `internalMutation`s, manually runnable via `npx convex run internal.<path>.<name> '{}'` (CLI parses `internal.` names — nothing is cron-only). Demo-relevant subset of the 63-cron inventory:

| Job | Reads (time field) | Window | Backdated-import verdict |
|---|---|---|---|
| `jobs/rank.recomputeDirtyBatch` (1m) | `commentScores.dirty` / `lastInteractionAt` | claim-based | ✅ import dirty → jobs compute best/live/mostDiscussed |
| `jobs/rank.decayLiveScores` (5m) | `lastInteractionAt` | 48h | ✅ |
| `jobs/rank.distributionRecompute` (1m) | `dirtySince` / `lastEligibleInteractionAt`; trend ← `buckets.bucketStart` | claim-based | ✅ import `dirtySince`; **trend needs buckets (D-2)** |
| `jobs/explore.explorationRefresh` (5m) | `post.createdAt` age tiers + `lastEligibleInteractionAt` (take 100/run) | 24h/72h/168h tiers | ✅ both fields backdated; note take-100 → driver loops it until the cohort is covered |
| `jobs/vibing.vibingCompute` (5m) | `postDistributionBuckets` (freshest 100) | bucket-based | ⚠️ dead without D-2 buckets |
| `cards.refreshCards` (5m) / `cards.heroStaleFill` (1h) | `lastEligibleInteractionAt` / `by_topScore` | take 30 / slot windows | ✅ hero auto-fills from Top (spec's "Community Top" behaviour, real) |
| `jobs/recognition.rollup` (6h) | `postHelps`+`toolRatings`+accepted `comment.createdAt` | 30d | ✅ backdatable; **floor = 25 distinct contributors** (`recognition.ts:34,113`) — 500 members clear it |
| `jobs/legitimacy.recompute` (24h) | `rawEvents.occurredAt` (90d) + **`users._creationTime`** | 90d | ⚠️ **R1/D-1**: account_age≈0 tanks the geometric mean for every demo member |
| `signal/award.sweep` (5m) | `rawEvents.occurredAt` per outcome family | **24h** | ⚠️ **R2/D-3**: only world-day-≈60 events award Signals |
| `jobs/signalSummary.recompute` / `attributionSettle` | `provisionalAt`/`finalizedAt` | 90d/7d | partial (follows from D-3) |
| `jobs/might.*` | `distributions.createdAt` (180d dormancy), signalSummary | — | follows from D-1/D-3 |
| `tools.recomputeAggregate` (manual) | all `toolRatings` by tool | none | ✅ date-agnostic — run per tool after rating import |
| `jobs/infer.inferBatch`, `analytics.l08Core` | `rawEvents.occurredAt` | 30d | ✅ for last 30d of world; days 31–60 invisible — realistic window behaviour, noted |
| `analytics activationInline` | **`users._creationTime`** | 30d | ⚠️ medianAgeDays≈0 (admin analytics metric only — accept, R1b) |
| moderation queue aging / brigade sweep | `moderationCases.createdAt` / `reports.createdAt` | bands | ✅ backdated held-cases age correctly on first sweep (good for the moderation demo) |

Everything else (ingest pollers, editorial sweep, personas, store, drip, legal) either has no demo data to touch or no-ops (no sources configured, **zero personas created** — spec §1 "No personas" matches the platform's empty persona layer).

## F. Import path per table (final decision table)

**One new module `convex/demoWorld/`** (internal mutations only, `seed/devGuard.ts` loopback guard on every entry point, `writeAudited` NOT used — no auditLog noise, matching `seed/demo.ts` precedent). Node driver `scripts/demo-world/` calls them via `convex run` (or a thin HTTP loop through `convex run` batches) in dependency order, registering every row in `demoRegistry` **in the same mutation**.

| Order | Table | Path | Side-effects replicated inside the same import mutation |
|---|---|---|---|
| 1 | `tools` (≈100, slug-deduped with the 8 existing) | new internal insert | zero aggregates; ratings come later, then real `recomputeAggregate` |
| 2 | `users` (500 + devtest enrichment) | new internal insert | final patch of `postCount`/`approvedCommentCount`/`lastActiveAt` after content import |
| 3 | `posts` + payload rows + `postRevisions` + `postSeoMeta` | new internal insert (reuse `insertExtensionRow` logic for the 7 member types — plain TS, `posts.ts:394`) + **dedicated `postNews` insert** (`sourceOfTruthUrl` + `keyClaims`, `schema.ts:717-722`) — `insertExtensionRow` has **no news case** (`posts.ts:396-442`) | `postDistributionScores` row with **counters = exact tallies of imported event rows** (A5.1) + `dirtySince`; `activityLedger post_published` |
| 3b | *(record)* post-type availability | `postTypeConfig` seeded state: `launch_pad` + `gigs` **LOCKED** (`seed.ts:43-44`), `news` ACTIVE (`seed.ts:42`) | **create none of the locked types**; news posts use the dedicated insert above |
| 4 | `postListItems` | new internal insert | `voteCount` = imported votes (INV-4-equivalent) |
| 5 | `comments` | new internal insert | `commentScores` zero-row `dirty:true`; parent `replyCount`; `threadStats` insert-or-delta incl. `isQuestion:true` on question comments (drives `unresolvedQuestionCount`, `comments.ts:315`); **`rawEvents comment.created` backdated** (`comments.ts:341-356`; an award family — `signal/award.ts:57-63`); **`activityLedger comment_created`** (`comments.ts:358-369`) |
| 6 | `commentReactions` / `commentSaves` / `commentContextSignals` / `saves` / `debateVotes` / `listItemVotes` / `toolRatings` | new internal insert, backdated `createdAt`, uniqueness respected | bump `commentScores` counters as events (`valuableCount` etc.) + `dirty:true`; **`bumpThreadActivity` on reactions** (`threadStats.latestActivityAt`/`threadRevision`, `reactions.ts:88-96,173`); **`rawEvents comment.reacted` with `isCountableAtWrite:false` for negative reactions** (so the award sweep never awards them — `reactions.ts:104-119`, `award.ts:231-234`); debate tallies; item voteCounts; `activityLedger upvote_given`/`save_added` rows; `postDistributionScores.saveCount` tally |
| 7 | `postHelps` accepts | direct patch (author choice) | `resolvedStatus:"resolved"` / `acceptedCommentId` / **`acceptedByUserId`** (record even though optional — `posts/help.ts:52-57`) / `acceptedAt` |
| 8 | `rawEvents` (≤500k, sampled) | **direct insert** (bypasses `captureEvent`'s `Date.now()` + catalog) | `occurredAt`/`receivedAt` explicit; catalogued names where they exist |
| 9 | `postDistributionBuckets` (if D-2 approved) | deterministic rollup of imported events | hourly buckets first 48h, daily 3–30d (M9 R-PRECOMPUTE) |
| 10 | `notifications` (devtest + members) | new internal insert | typed exactly as the real mutations batch them: **`post_comment` / `comment_reply` / `saved_post_activity`** (`notifications/batch.ts:46`; windows 15m/24h), backdated `createdAt`/`batchWindowStartedAt`, unique `dedupeKey` |
| 11 | images → `_storage` | **internalAction** (`ctx.storage.store` — action-only, `storage.d.ts:173-176`) | cover ids into **`postSeoMeta.ogImageAssetId`**; avatar ids into **`users.avatarAssetId`** (existing columns; feed display is S02 wiring — R14) |
| 12 | settle | **real jobs in loops** | rank×2, distributionRecompute, explorationRefresh, vibingCompute, refreshCards, heroStaleFill, recognition.rollup, legitimacy.recompute, signalSummary, tools.recomputeAggregate — until claim-queues drain |
| 13 | `demoGroundTruth` (P7) | registered insert | — |

**Rejected alternative (for the record):** replaying through the public mutations with 500 real auth sessions — impossible: fail-closed classifier (every post stuck `pending`), rate limits (10 posts/h/user ⇒ 5000 posts ≥ 500 h), no backdating, and `captureEvent` can't backdate. Direct internal inserts are the platform-sanctioned pattern (`seed/demo.ts` docblock).

## G. demoRegistry design (spec §4.5)

```ts
demoRegistry: defineTable({
  table: v.string(),       // table name of the registered doc
  docId: v.string(),       // the doc's _id (v.id() takes a table name — v.string() is correct here; `table` says which table to delete from)
  batch: v.string(),       // "v1:members:0007", "v1:posts:0213", …
}).index("by_table", ["table"]).index("by_batch", ["batch"])
```

- Written in the same internal mutation as each insert (transactional — a row exists iff its registry entry exists).
- **Removal** = (1) delete registered rows in reverse dependency order (rawEvents → engagement → comments → posts+payloads → tools → users → registry self-purge); (2) **orphan sweep**: delete job outputs referencing demo ids that jobs created post-import (`vibingTrends` by demo post, `recognitionEvents` by demo user, `signalLedger` by demo author, `feedExplorationState` by demo post, `heroAssignments`/job-era `heroSlots`); (3) re-run the settle jobs over the remaining base-seed data (projection repair — e.g. `recognition.rollup` upserts leaderboard projections back to base-only values); (4) verify `seed:check` == canonical `63fe5110e230`.
- `demoGroundTruth` (P7) registered the same way. No `isDemo` field is added to any existing table — the registry IS the flag (schema untouched except two NEW tables → CR-011).

## H. Time re-anchoring design (spec §4.6)

- Generation files store **offsets from world end**: `offsetMs ≤ 0` (world day 0 = −60d … day 59 ≈ −6h). No absolute times anywhere in `members/posts/comments/interactions/images` files.
- Import computes `worldEnd = Date.now()` once; every document timestamp = `worldEnd + offsetMs`. Re-import next week ⇒ the whole world shifts forward — 24H/7D/30D windows always contain their designed slice, and the world always looks current.
- Determinism: the fingerprint ignores timestamps, and all identity keys (emails/handles/slugs/dedupeKeys) are stable ⇒ replay on any machine = identical fingerprint. Import order = world-chronological within each table (index tiebreaks fall through to `_creationTime`, which equals insertion order).

## I. Estimates for the full run (P1–P7)

**API driver** (default for bulk; `glm-5.3-flash`, reasoning tokens included):

| Stage | Calls | Tokens (in+out) |
|---|---|---|
| World Architect (world.json) | 1–2 | ~15k |
| Fact Keeper (~100 tools; web verification is free/zcode-side, writing batched) | ~15 | ~100k |
| Casting Director (500 members, 20/call) | 25 | ~180k |
| Editor-in-Chief (allocation is algorithmic; day/topic shaping) | ~80 | ~350k |
| Author (5,000 posts, 1/call, voice+structure context) | 5,000 | ~7.5M |
| Truth Checker (every post) | 5,000 | ~7.5M |
| Realism Critic (every post) | 5,000 | ~5M |
| Regenerations (~25% reject, 1 retry) | ~1,250 | ~1.8M |
| Crowd Simulator (rule engine + 60 macro calls) | ~60 | ~0.3M |
| Commenter (45,000 comments, thread-context) | 45,000 | ~60M |
| Comment truth-check (tool-claim sample ~30%) | ~13,500 | ~17M |
| Comment realism (sample ~20%) | ~9,000 | ~9M |
| Sentiment Auditor + Image briefs | ~110 | ~0.4M |
| **Total** | **≈ 84,000 calls** | **≈ 110M tokens** (~60% input) |

- **Wall-clock:** at concurrency 8 and ~6–10 s/call ⇒ ~24 h pure API time; with retries, validation and pacing ⇒ **≈ 2–4 elapsed days**, dominated by P4 (comments, ~60%). Every step is batch-resumable (cache keyed by agent+input-hash), so interruption never re-pays finished work. (If the endpoint stays stable at higher concurrency, `DEMO_LLM_MAX_CONCURRENCY` is a dial.)
- **Images:** ~1,750 covers (35% of 5,000) × 2 crops ⇒ Unsplash ≈ 300–400 searches paced inside 50/hr (~7–8 h background); remainder from ArtIC/picsum (no quota); ~425 avatars (`DEMO_IMAGEGEN_MODEL` tested at P5; fallback = deterministic local illustrated SVG — zero cost, zero real people, addendum A1). No repeats across all sources (global id ledger).
- **Snapshot (git):** members 0.6 MB + posts ~8 MB + interactions/plans ~15 MB + comments ~20 MB + ground truth ~5 MB, gz ⇒ **~15–25 MB** jsonl.gz.
- **Image bundle (not in git):** ~1,750×2 covers ×~130 KB + 425 avatars ⇒ **~450–500 MB** zip for other machines.
- **DB rows added:** 500 users · ~100 tools · 5,000 posts + ~5,000 payloads + 5,000 revisions + 5,000 seoMeta + 5,000 distScores · 45,000 comments + 45,000 commentScores · ~120k commentReactions · ~15k saves · ~25k debateVotes · ~2k listItemVotes · 3k toolRatings · ≤500k rawEvents · ~10–15k buckets · ~700k demoRegistry rows · job outputs ⇒ **≈ 1.2–1.5M rows** (rev 2: corrected up from 0.9–1.1M — registry + rawEvents alone are ~1.2M, per Grok review note). Import at ~200–500 rows per internal call ⇒ **~2–3 h import + ~0.5–1 h job settle loops**. Commenter prompts must carry a thread **tail**, not the full thread, to hold the ~1.3k-token budget on long threads.

**Local driver** (zcode/GLM direct, addendum A2): used for architecture, fact cross-checks, voice samples, rubric tuning and gate samples at zero API cost. Not practical for 45k comments in-session — hence hybrid: API default, local fallback/override, same prompts and cache (driver switch mid-run is safe).

## J. Risks (complete list) and gate decisions needed

Risks are ordered by impact; each maps to a decision the founder makes at this gate:

| # | Risk | Impact | Recommendation |
|---|---|---|---|
| R1 | `legitimacy.recompute` account_age reads `users._creationTime` (`jobs/legitimacy.ts:142`) — every demo member looks brand-new; geometric mean ⇒ legitimacy ≈ same tiny value for all (the `1e-9` floor at `legitimacy.ts:44-47` prevents literal 0; `account_age = days/180` ≈ 0 for same-day imports); Signal weights/reach uniformly deflated; bad-actor-vs-honest contrast weakened | Breaks the legitimacy-weighting ground-truth test | **DECIDED (A5.4) → CR-012:** read `users.createdAt ?? _creationTime` |
| R1b | `analytics activationInline` age metric ≈ 0 (admin metric; it is a mean of the first 100 users, not a median — Grok note) | cosmetic | accept, document |
| R2 | `signal.award.sweep` 24h lookback (`signal/award.ts:212`) — 59 of 60 world-days of outcome events award no Signals; Might/ladder partial | Signals/Might story partial; Podium unaffected (30d backdatable windows, 25-contributor floor cleared by 500 members) | **D-3: open** (recommend accept; P6-time, non-blocking) |
| R3 | `postDistributionBuckets` has no production writer — Vibing dead + trendScore=0 without buckets | What's-Vibing widget central to the redesign demo | **DECIDED (A5.2) → importer builds buckets as exact rollups of imported rawEvents** (hourly ≤48h, daily 3–30d), then real `vibingCompute` runs; production writer logged as **CR-013**, deferred to S02 wiring |
| R4 | Base branch lacks D-012 de-fabrication (`s00-t04` awaiting Grok) — GATE P6 screenshots would show fabricated category/leaderboard chrome mixed with demo data | Gate P6 evidence quality | **D-4:** merge `s00-fix-tz-tests` + `s00-t04-no-fabricated-data` into 011 (existing review flow) before P6; then rebase `demo-world` (trivial before code lands, cheap until P6) |
| R5 | No moderation classifier configured — the platform's own moderation path cannot run at import; importer must set `moderationStatus` itself | A handful of held `moderationCases` must be inserted directly for admin-console realism | accept + report (spec P4.5 explicitly asks "report what happens"); insert a small held slice via the same autoGate shape |
| R6 | All index tiebreaks fall to `_creationTime` | ordering anomalies if import is shuffled | import strictly world-chronological per table (design §H) |
| R7 | `toolRatings.recentSubmissionCount` assumes `createdAt` monotone with `_creationTime` | velocity auto-flag undercounts (conservative, no crash) | accept; spread rating imports across import batches anyway |
| R8 | `seed:check` fingerprint changes after import; drift-check watermarks; `eventCatalog` unchanged (we only use catalogued names for consumed streams) | ritual parity | new `seed-fingerprint.txt` committed with the P6 import (spec §4 P6.4); driftCheck full-pass alert expected once — documented |
| R9 | Machine data-parity already dirty (`3a8462326454` ≠ `63fe5110e230`) | demo must land on the canonical base | **D-5:** run `reset:local` (founder password) immediately before P6 import; removal-test target = `63fe5110e230` |
| R10 | ~~`ctx.storage.store` availability unverified~~ **RESOLVED (rev 2):** action-only confirmed (`storage.d.ts:173-176`); image import = internalAction | image import path | planned default is the type-correct one |
| R11 | `rawEvents.referrer` documented as non-backfillable; no catalogued exposure event name exists | negligible | leave `referrer` unset; document exposure event naming in P4 design |
| R12 | Unsplash 50/hr | cover pacing | pacing plan in §I; Pixabay (~100/min) + Wikimedia Commons + ArtIC/picsum long tail (all confirmed) |
| R13 | Ingest/editorial/persona crons fire during import | none — no sources, no personas, nothing scheduled | no action (verified: all no-op on empty inputs) |
| R14 | Covers live in `postSeoMeta.ogImageAssetId` and avatars in `users.avatarAssetId`, but **live feed queries read neither today** (`feed.ts:100-122`; app never reads `avatarAssetId`) | GATE P6's "cards with covers" cannot be met inside demo-world scope until feed display is wired | **DECIDED (A5.3):** display is S02 wiring, not demo scope — P6 evidence notes coverless cards where the feed hasn't been wired yet |

**Decisions summary (rev 2):** D-1 **DECIDED → CR-012** (legitimacy account-age). D-2 **DECIDED → A5.1/A5.2** (importer writes exact-tally counters + bucket rollups; production writers logged as CR-013/CR-014, deferred to S02 wiring). D-6 **DECIDED → CR-011** (demo module + `demoRegistry`/`demoGroundTruth`; CR-010/CR-010b retired and split into CR-011…CR-014). Still open, P6-time and non-blocking: **D-3** (accept 24h signal-sweep limitation — recommended accept), **D-4** (merge s00-t04 into 011 before P6 screenshots — recommended yes), **D-5** (run `reset:local` before P6 import — recommended yes, needs founder password). **No `convex/` code until Grok re-checks these fixes (A5.4).**

## K. What was deliberately NOT done

- No content generated (no world/members/posts/comments), no images fetched, no DB writes, no `convex/` code written (waits on CR-011 **and the Grok re-check of these fixes**, per A5.4).
- No fingerprint change, no CHANGELOG entry (nothing shipped; per AGENTS.md §11 a CHANGELOG line lands with the first accepted build gate).
- `DEMO_IMAGEGEN_MODEL` endpoint capability untested (P5 concern; avatar fallback planned).
- Moderation-path behaviour on import observed only by code reading (R5).

## L. Files this branch carries for P0

- `ak-redesign/specs/DEMO-WORLD-SPEC.md` — the approved spec + §6 founder addenda (A1 images, A2 local driver, A3 env delta, A4 reasoning tokens, **A5 PM decisions on the Grok review**)
- `scripts/demo-world/reports/P0-REPORT.md` — this report (revision 2: all six Grok findings fixed)
- `scripts/demo-world/reports/P0-GROK-REVIEW.md` — the Grok review (verdict: PASS WITH FIXES)
- `scripts/demo-world/RUN-LOG.md` — cost/time log (P0 + P0b/P0c image-source probes)
- `ak-redesign/00-control/crs/CR-011-REQUEST.md` — demo module + registry tables (retires CR-010 ask 1+2)
- `ak-redesign/00-control/crs/CR-012-REQUEST.md` — legitimacy account-age fix (retires CR-010b / D-1)
- `ak-redesign/00-control/crs/CR-013-REQUEST.md` — production bucket writer (deferred to S02 wiring)
- `ak-redesign/00-control/crs/CR-014-REQUEST.md` — production same-mutation post counters (deferred to S02 wiring)
- `.gitignore` — `.demo-world-cache/` added

**STOPPED AT GATE P0 (revision 2). P1 generation (world.json + tools.json) proceeds without `convex/` code; import code waits on the Grok re-check.**
