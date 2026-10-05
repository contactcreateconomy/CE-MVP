# demo-world RUN-LOG

Cost and time log per phase (spec §1): calls, tokens, images, duration.
Driver notes apply to the API driver (`DEMO_LLM_*`); the local/self-generation
driver (founder addendum A2) is measured in sessions, not API tokens.

## P0 — Recon (2026-10-03)

| Item | Count | Tokens | Notes |
|---|---|---|---|
| LLM probe call 1 | 1 call | 54 total (34 reasoning) | HTTP 200, visible reply empty — `max_tokens:8` consumed by reasoning channel |
| LLM probe call 2 | 1 call | 54 total (34 reasoning, 3 visible) | HTTP 200, reply `"ok"`, finish `stop`. Model confirmed: GLM flash via OpenAI-compatible endpoint. **Reasoning tokens are billed** — bulk estimates include a reasoning factor; driver reads `message.content`, never `reasoning_content`. |
| Unsplash search | 1 | — | HTTP 200, 1,391 results for "creator workspace". Demo limit 50 req/hr. |
| Picsum fetch | 1 | — | HTTP 200, image/jpeg |
| Art Institute of Chicago API | 1 | — | HTTP 200, 133,118 artworks |
| Recon sub-agents (zcode, local driver) | 3 | n/a | schema+mutations, jobs+timestamps, seed-ritual+rules (read-only) |

No images downloaded, no DB rows written, no generation started (P0 = recon only).
Total external API spend this phase: 2 LLM calls, 4 HTTP probes. Duration ≈ 1 h (session).

## P0b — image-source addendum probes (2026-10-03, founder added Pixabay + Wikimedia)

| Item | Count | Tokens | Notes |
|---|---|---|---|
| Wikimedia Commons search | 1 | — | HTTP 200, 3 results, sample license `CC BY 2.0` via `extmetadata`; keyless. Per-image author+license recorded in ground truth at P5. |
| Pixabay search | 0 | — | P0b SKIPPED — key not yet saved; **P0c re-probe after founder saved `.env.local` (23:57): HTTP 200, 500 hits ("creator workspace"), key len 34 (value never printed).** |

Spend this sub-phase: 2 HTTP probes (1 Commons, 1 Pixabay).

## P1 — The world and the facts (2026-10-04) — driver: LOCAL (addendum A2)

| Item | Count | Tokens | Notes |
|---|---|---|---|
| LLM API calls | **0** | 0 | entire phase produced by the local driver (zcode/GLM sub-agents) per A2 |
| Web-verification sub-agents | 9 | n/a (local) | 7 tool batches (100 tools: official pricing pages + corroborating sources + recent-changes checks) + 2 real-event research agents (Aug 2–Oct 4 2026, per niche cluster). ~500 web fetch/search actions total. |
| Tool rows produced | 100 | — | 59 verified:full, 41 verified:partial, 0 none; 0 duplicate slugs; 2 shutdowns discovered (OpenAI Sora, Relay.app), 4 pivots recorded (Copy.ai, Writesonic, BrandWell, Podcastle→Async) |
| Calendar | 29 entries | — | 27 anchored to sourced real events (Suno licensing arc, Sept model-price war, Sora shutdown, Patreon 30 features, Copilot changelog…) |
| Validator | 1 run | — | `scripts/demo-world/validate.mjs` PASS (weights 1.000, niche spread exact) |

No images fetched, no DB writes, no convex/ code (blocked until Grok re-check, A5.4).
Artifacts: `.demo-world-cache/p1/{world,tools,events-media,events-text}.json` + `batches/*.json` (gitignored cache).

## Lean run (2026-10-04, founder+PM: no gates, pilot P3–P5, one line per phase)

| Phase | Counts | LLM calls | Tokens (in/out) | Time |
|---|---|---|---|---|
| P2 casting | 500 members (20/80/175/225 tiers, 15 bad actors in ground truth, 460 verified, 407 avatars, 500 unique handles) | 25 (+~3 repairs) | ~45k/~30k | ~4 min |
| BUILD convex/demoWorld | CR-011 module (lib+importTools/Members/Posts/Comments/Engagement/Events/Chrome + remove) + 2 schema tables + CR-012 legitimacy fix + drivers (p6-import/remove/settle); 93/93 convex tests green, convex tsc + forum typecheck clean | 0 (code) | — | ~50 min |
| P3 posts | **BLOCKED at 29/250**: LLM endpoint returned HTTP 429 "Insufficient balance or no resource pack" after ~460k tokens; 149 calls exhausted retries; a refill attempt overwrote posts.jsonl (29→3 rows) — **nothing lost permanently: the deterministic plan + LLM cache rebuild all posts the moment balance returns** (re-run p3-posts.mjs) | 252 calls (+616 retries, 149 failed) | ~156k/~305k | ~45 min to block |
| P4 conversation | BLOCKED (needs posts ≥240) — script ready (p4-conversation.mjs: deterministic crowd sim + commenter) | 0 | — | — |
| P5 images | BLOCKED (needs posts) — script ready (p5-images.mjs: Pixabay/Unsplash/Commons/picsum + sharp crops; Pixabay probe still HTTP 200) | 0 | — | — |


## FINAL run (2026-10-05, founder [DEMO][FINAL]: quality-first, no second demo job)

| Item | Result |
|---|---|
| Step 0 login | devtest@example.com password account exists locally (password from DEV_TEST_USER_PASSWORD env; reset = delete account row + re-ensure, reported to founder) |
| Step 1 tallies | setDebateTallies/setListItemVoteCounts set ONCE from vote rows after all chunks @ 5e7da53; verifyTallies live = 0 mismatches (26 debates, 134 list items, helps/accepts) |
| Posts | 1,500/1,500 written + verified (250 pilot + 1,250 bulk; types review175/help165/showcase170/debate180/spark150/news150/compare135/list125; windows 24h61/7d386/30d457/60d346) |
| Comments | **15,094/15,094 complete** (1,981 pilot + 13,113 bulk; 385 batch files, zero lost rows; both quality gates PASSED at 200 posts/2k comments) |
| Step 5 covers r1 | 136/581 filled (unsplash 36, pixabay 91, commons 9) + 94 pilot = 230/675 flagged; 443 coverless "no unused relevant match" (shared v2 queries exhausted 8-result Commons pages), 2 HTTP 429 |
| Step 5 covers r2 | commons-only v2-query retry: 1/445 (probe: Commons ~3% usable = raster+permissive for tech queries; structurally dead end) |
| Step 5 covers r3+ | query fix: v1 unique-per-post subject keywords first on Unsplash/Pixabay (r1-proven 36/45, 91/91) + v2 visual+variant/page rotation fallback; hourly rounds until tail (<60) or 3 rounds — awaiting Unsplash window (~14:56) |
| Avatars | 80 SVG for active authors confirmed correct; 12 active authors intentionally no-avatar (founder edge case); +0 top-up needed |
| Step 5 covers r4 | +126 filled (unsplash 32/45, pixabay 91/91) → 486/675 |
| Step 5 covers r5 | +130 filled → **616/675 = 91% of flagged, 41% of all posts**; 59 remaining = honest non-visual tail (Commons structurally unusable: ~3% permissive+raster hit rate) |
| Avatars final | 407/500 SVG (all hasAvatar members via --avatars-all); 93 default (founder no-avatar edge case) |
| Non-Latin names | casting romanized everything (artifact check: 0) → patch-names.mjs renamed 20 members across 10 countries in artifact + DB (importMembers:patchNames) |
| Step 7 import | posts/comments/engagement/events/notifications/finalize complete: 12,578+ comments this pass (15,122 total in DB), 29,827 reactions, 4,659 saves, 11,895 debate votes, 98 accepts, 890 tool ratings, talliesSet 206 debates/140 lists, 10,920 exposures, 28,991 buckets, devtest 28 notifications |
| Step 7 fixes | emailOf TDZ (risingCohort fired on non-empty bulk adjustments); list.items object-shape normalization (pilot strings vs bulk objects); mega-thread argv cap (66-83 comments > 32KB → driver slices ≤24KB + gt parent fallback + cumulative threadStats); legitimacy CAP-283 actor bound (40/run oldest-first, was 125k reads); decayLiveScores index-range (was post-filter full scan); worldFingerprint paged client-fold (was 33k reads) |
| Step 7 settle | 12/12 jobs drained (2 passes + decay spot-drain); 106/106 tool aggregates recomputed |
| Verify (DB) | types compare168/debate212/help219/list154/news175/review232/showcase207/spark193; windows 24h:60/7d:637/30d:511/older:352; titles long84/short75; threads 0-comment:515, 60+:14, largest:83; comments oneLine:157/long:1417; podium 272-276 distinct contributors/category/30d; help resolved:97/open:122/unanswered:33; debates lopsided:97/close:42; lists ranked:100/static:54; tools 100 rated, top-10 45-59 each + 90 tail; bad actors live (upvote-ring/troll roles verified in gt) |
| Step 6 export | fingerprint **79236da0a5d85d8c5e4767b870339150** (posts 1,500, comments 15,094, tallies 0 mismatches, registry 224,462 rows) — paged commutative-FNV client fold (one-shot query hit read caps; collect-all fold OOM'd; paginate cursor must ride in the opts object on convex 1.34) |
| Step 6 removal | collectIds rewritten (take(500) loop re-read the same page + capped ids at 500; now paginated per-table) + removeBatch 500→200 (timeouts vs 224k registry) + sweeps chunked 25 (activityLedger 3-user chunks, 55,980 rows) + upload markers cleared on purge; registryRows → **0** |
| Step 6 removal gap | typed-post extension rows (postSeoMeta/postRevisions/postReviews/postCompares/postSparks/postDebates/postHelps/postNews/postShowcases) were NOT registered by importPosts → removeBatch drained them as no-ops; fixed at root (all extension inserts now register()) + remove:orphanSweep repaired this world (3,544 orphans deleted) |
| Step 6 base parity | seed:check mismatched after clean removal (2c0c…→2a25…) — non-volatile job-output tables (cardSummaries, adminInterventionAlerts…) carry run-history effects removal can't un-write; canonical **63fe5110e230** restored via reset:local (deterministic reseed); BETA-SWITCH.md updated with this step |
| Step 6 re-import | running onto the fresh base → settle → fingerprint must equal 79236da0a5d85d8c5e4767b870339150 |
| Step 6 re-import identity | **PASS** — remove (registryRows 0) → reset:local (63fe5110e230) → re-import + 12/12 settle → fingerprint **79236da0a5d85d8c5e4767b870339150** = pre-removal export (posts 1,500, comments 15,094); 106/106 tool aggregates recomputed |
