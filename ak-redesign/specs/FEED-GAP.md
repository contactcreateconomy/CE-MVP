---
id: FEED-GAP
type: AUDIT (FEED-B0 — ground truth, no code)
author: Opus (builder), FEED-B0
date: 2026-10-11
base: feed-base @ 6d149d5 (011 + demo-world + s02-feed-ui)
branch: feed-b0-audit
reads: FEED-DESIGN.md §9, §10, §13, §16.1 · DEMO-WORLD-SPEC.md · CR-010/013/014
status: FOR REVIEW (Grok) → PM records the PROPOSED L-xx in §F
---

# FEED-GAP — what exists vs FEED-DESIGN

**Method.** Source reading on `feed-base`. The graphify graph (`graphify-out/graph.json`) indexes functions, not tables, so table writers were found by grepping `ctx.db.insert/patch("<table>")` across `convex/`. Demo writers (`convex/demoWorld/*`, `convex/seed/*`, `convex/dev/demoSeed.ts`) were excluded to get the **production** writer set. "Prod writer" means the code path a real member triggers, or a cron, on a deployment where seeding is blocked. **Nothing here was run against a live deployment.** Rows marked *(code-read)* still need a browser or `convex run` check before anyone relies on them.

**Legend.** EXISTS = meets the spec row · PARTIAL = some of it exists or it exists in a different shape · MISSING = nothing usable · DEAD-IN-PROD = the code exists but its inputs are never written in prod, so its output is constant.

**One-line verdict.** The feed's read side is built (`feed.list`, `getChrome`, `getWhy`, the projection crons), but in production **nothing is pumping into it**. No production path writes the post counters, the day buckets, the post saves, or any exposure. So Top, Hot, Vibing, Rising, exploration and Fav are all flat or empty outside the demo world. B2 (bloodstream) is the real start line, as the spec's ordering already says.

---

## A. §13 data needs D-01 … D-15

| # | Need | State | Where (file · function) | Prod writes / reads |
|---|---|---|---|---|
| D-01 | CR-013 `postDistributionBuckets` writer | **MISSING** (DEAD-IN-PROD readers) | Only writer: `convex/demoWorld/importEvents.ts:60`. Readers: `convex/jobs/rank.ts · distributionRecompute` (trendScore), `convex/jobs/vibing.ts · vibingCompute` | **No prod writer.** `trendScore` is always 0 in prod → `rising` flag is always false, and `vibingTrends` never gains rows → Vibing is empty. CR-013 is OPEN. |
| D-02 | CR-014 post engagement counters on `postDistributionScores` | **MISSING** (DEAD-IN-PROD readers) | Row creation: `convex/lib/distributionScores.ts · ensurePostDistributionScoreTx` (called from `posts.ts` publish + `editorial/publish.ts`) inserts zeros + `dirtySince`. Recompute: `jobs/rank.ts · distributionRecompute` (cron "distribution rank recompute") | Nothing in prod ever increments `valuableWeighted / replyCount / saveCount / qualifiedReads / distinctCommenters / qualifiedExposureCount` or bumps `lastEligibleInteractionAt`. `reactions.ts` (toggleValuable/toggleSave/signalContext) writes **comment-level** `commentScores` + `threadStats` only. `comments.ts` writes `commentScores/threadStats`, never the post row. Result: every prod post has `hotScore = 0` and the same prior-only `topScore`. CR-014 is OPEN. |
| D-03 | CR-010 card payload | **PARTIAL** | `convex/feed.ts · assembleCard` | Has: postId, slug, coverImage (CR-010a, from `postSeoMeta.ogImageAssetId`), type, title, authorName, publishedAt, oneLiner, runningCommentRef (id only), discussingCount, avatarUserIds (ids only), engagement{valuable,replies,saves,reads}, rising. **Missing:** author avatar URL + handle, resolved comment preview text + participants (URLs/names), viewer state (isValued/isSaved/voted), raw Valuable (it sends the weighted value), review stars, debate votes, hero summary/image/type, Vibing title/link, Podium links/handles. CR-010 is OPEN. |
| D-04 | Envelope L-12 + qualified exposure L-13 + controls L-14 + reveal L-14a | **PARTIAL** (schema) / **MISSING** (writes) | `convex/schema.ts · rawEvents`; `convex/lib/events.ts · captureEvent` (same-mutation, catalog-gated) | Schema has `surface, placement, rankPosition, sortMode, feedSessionId, viewportQualified, dwellMs, rankingVersion (string), experimentId, variantId`. **No `whyShown` field, no `lens` field.** No feed exposure event exists: `feed.list` is a query and logs nothing. The only feed event is `feed.card_action` (hide/mute/report, `feed.ts · cardAction`). There are no events for see fewer, caught-up reached, return after caught-up, or reveal. L-13 dedup (once per post per session) has no implementation. |
| D-05 | Momentum + Quality projections, per exposure split by why-shown, windows from config | **PARTIAL** | `jobs/rank.ts · distributionRecompute` (topScore = Bayesian-damped valuableWeighted × integrity × corroboration; hotScore = engagement × 2^(−h/halfLife); trendScore = 2-bucket delta). Config keys: `feed.top.priorWeight`, `feed.top.priorMean`, `feed.hot.halfLifeHours` (seeded in `convex/seed.ts:89-91`) | These are single scores, not normalized per exposure, with no why-shown split and no per-type normalization. **No time windows**: Top/Hot scan the whole index, with no 7D/30D cut. Also present: the older `recomputeDirtyBatch` / `decayLiveScores` (comment ranking, M6), which are separate. |
| D-06 | Life stage + why numbers | **MISSING** | — | No field, no job. Only the `rising: trendScore > 0` boolean in `assembleCard`. |
| D-07 | Exploration in Hot + per-author cap; rankingVersion; safe mode; rollback | **PARTIAL** (DEAD-IN-PROD) | `jobs/explore.ts` (cron "exploration refresh") writes `feedExplorationState` + `postDistributionScores.explorationDeficit`; `feedSessions.rankingVersion` (number, hard-coded 1 in `feed.ts · ensureSessionRow`); `RANK_CONFIG_VERSION`/`DISTRIBUTION_CONFIG_VERSION = "calibration_pending.v1"` constants | `feed.list` **never injects** exploration slots (it reads only the score index). The deficit is computed from `qualifiedExposureCount`, which nothing increments. No per-author cap. No safe-mode or rollback config key. The rankingVersion is not stamped on events. |
| D-08 | Caught-up since last visit | **PARTIAL** | `convex/retention/visit.ts · commit` (patches `users.lastVisitAt` / `priorVisitAt`, ≥30s qualify, 30m throttle), `· sinceLastVisit` query (CAP-374/375) | The anchor exists. `feed.list` doesn't use it: there's no caught-up boundary or divider data. |
| D-09 | Unified topic taxonomy, post/tool topics, search signal, affinity, StellarMap | **MISSING** (three separate systems exist) | `categories` (+ `posts.categoryId`), `tags`/`postTags`/`toolTags`, `interestTaxonomy` + `userInterests` (written by `setup.ts`), `search.ts` emits `search.query_executed` | The three are not unified (L-23). There's no 1–3 post topics, no search → topic signal, no affinity rerank, and no Explored/Earned tables. Blocked on O-06 (taxonomy list). |
| D-10 | Card additions (Level, persona/editorial flag, main topic, facets, pricing, community score, best human comment, faces, life stage, viewer relation, author-only reach) | **PARTIAL** (sources exist, not in payload) | Level: `distributionLevelAssignments` (written by `jobs/might.ts`, `signal/promoteDemote.ts`). authorType: `posts.authorType` (editorial/persona/user). Facets: `postReviews` (written by `posts.ts`), `debateVotes` (`posts/debate.ts`), `toolRatings` (`toolRatings.ts`) + tools `ratingCount`. Best comment: `cardSummaries.runningCommentRef` | None of it is assembled into the card. **`feed.list` drops every non-`user` post** (`if (post.authorType !== "user") continue`), so editorial posts can never show with a "Createconomy" label in organic sorts (see F-4). |
| D-11 | Hero slots: kind, lens, label class, holdout, community answer | **PARTIAL** | `heroSlots` (written by `admin/curation.ts` + `cards.ts · heroStaleFill`), `disclosureClass` (string), `headlineOverride`, `ctaLabel`, `slotOrder` | No `kind`, `lens` or holdout fields. Community-answer source (M6 discussion map) isn't wired. The auto-fill draws from `topScore`, which is flat in prod (D-02). |
| D-12 | Podium dimension registry + projections + pins | **PARTIAL** | `leaderboardProjections` schema: categories `overall/commenter/helper/reviewer/rising` × windows `h24/d7/m1`. Writer: `jobs/recognition.ts · rollup` | The writer **only writes `overall` × `d7`**. There are no solutions/tools/personas dimensions, no user pins, and no "what they did" text: entries are `{userId, rank, points, trend}`, and `points` is the opaque number R-10 rejects. |
| D-13 | Fav activity query (human activity since last Fav open) | **MISSING** (and Fav is DEAD-IN-PROD) | `feed.ts · list` sortMode `fav` reads `saves` (post), `commentSaves`, own posts | **`saves` (post) has no prod writer.** Only demo/seed code inserts it, and there's no toggle-save-post mutation. Fav therefore shows only own posts + posts of saved comments. No "since last Fav open" anchor or new-activity glow source. |
| D-14 | Demo flag honoured by every projection + global exclude switch | **MISSING** | See §D | No per-row flag, no `feed.excludeDemo` key. No projection consults `demoRegistry`. |
| D-15 | Feed admin config, kill switches, placements, health, explain, experiments | **PARTIAL** | `systemConfig` + `configKeyRegistry` (typed config), `adminWidgets` (`admin/widgetsCatalog.ts`), `admin/curation.ts` (heroSlots, vibingFeatured), `admin/stop.ts` (STOP), `auditLog` | Placements exist (hero + Featured). Missing: per-widget kill switches for feed widgets, safe mode, rollback, dials beyond the 3 rank keys, the 5 health numbers, Explain per post/user, the experiments registry and holdout. |

---

## B. §9 widgets + §10 card

"Live" means the `/feed` route on `feed-base`: `app/(app)/(shell)/feed/page.tsx` → `CanonicalFeedClient`, inside `(shell)/layout.tsx` → `AppShell`. "s02" means the display components shown only at `/lab/feed` (`feed-page-view.tsx` and children).

| Widget | Live (prod data) | s02 display (lab only) | State | Gap |
|---|---|---|---|---|
| 9.1 Menu bar | AppShell header (not audited in depth) | — none in `components/feed/` | **PARTIAL** | No subject chip, announcement strip or search-focus states per §9.1. Lives outside `components/feed/` (B6). |
| 9.2 Hero | **Two hero renderers on `/feed`** *(code-read)*: `AppShell` → `layout/top-post-hero-section.tsx` → `feed/top-post-hero-carousel.tsx` (**autoplay `setInterval` at :159**, violates L-31/R-06), **and** an inline badge grid in `canonical-feed-client.tsx:86-99` (prints raw `disclosureClass`, violates COPY-1). Both read `getChrome().hero` | `feed-hero-carousel.tsx` (2-state, autoplay with pause, `:171`) | **PARTIAL** | Duplicate render, autoplay, no kinds/lens header/tease-reveal/labels per §9.2; data per D-11. |
| 9.3 Start Discussion | Composer entry exists (`/new-post`) | — | **PARTIAL** | No pill → publisher shared-element expand (B8). |
| 9.4 Sorter + Fav | `trend-sorter.tsx` (used by CanonicalFeedClient) | `feed-tabs.tsx` (v2 sliding pill) | **PARTIAL** | Two sorter components (see F-1). No hover note/first-use tooltip, no Fav glow (D-13), no visitor popover. The windows (24H/7D/30D) aren't applied in the backend (D-05). |
| 9.5 What's Vibing | Not rendered by CanonicalFeedClient beyond chrome data; `getChrome().vibing` = `vibingTrends` (empty in prod, D-01) | `feed-rail.tsx · FeedVibingWidget` | **PARTIAL** (DEAD-IN-PROD) | No hook writer (`vibingHooks` has no writer anywhere → hook always null). No title/link in payload (CR-010). |
| 9.6 Discover | Type filter via `initialTypeFilter` + `getChrome().typeNav` (`postTypeConfig` active rows) | `feed-left-nav.tsx` | **PARTIAL** | No "Your topics" (D-09), no new-since-last-visit counts, no drill-down sub-maps, no lens bus (L-05). |
| 9.7 Podium | `getChrome().podium` → forming unless `overall/d7.minThresholdMet` | `feed-rail.tsx · FeedPodiumWidget` (renders `formatPoints(points)`, **R-10**) | **PARTIAL** | One dimension only; opaque points; no picker, peek, leaderboard page, pins (D-12). |
| 9.8 Page states | Empty card, `snapshot: true` cursor walk (no reorder, CAP-198) | `FeedListState = loading/ready/empty`, `FeedCardSkeleton`, `feed-undo-toast.tsx` | **PARTIAL** | No new-posts pill, caught-up divider (D-08), thin-lens fallback, offline banner or safe mode. |
| §10 Card | `canonical-feed-client.tsx · FeedCard` (inner, plain `Card` + `Badge`, "Why this?" toggles `getWhy`) | `feed-card.tsx` (v2: per-type strip, avatar, comment previews, participants, valuable/reply, extras review/debate/meta) | **PARTIAL** | See §E. |

---

## C. Specific verifications asked by B0

1. **Who writes `postDistributionBuckets` and the engagement counters (CR-013/014)?** In production, **no one**. Buckets: only `demoWorld/importEvents.ts`. Counters: rows are created at zero by `ensurePostDistributionScoreTx`, and no reaction, comment or save path ever patches them. Demo rows are hand-written by `demoWorld/importPosts.ts` + `importEngagement.ts`, which is why the demo world "works" and prod does not. (DEMO-WORLD-SPEC records the same: "CR-013 production bucket writer (deferred); CR-014 production post counters (deferred)".)
2. **`rawEvents` envelope vs L-12/L-13.**

   | Field | L-12/13 wants | Schema has |
   |---|---|---|
   | why shown | organic/exploration/pinned/featured/hero_autofill/editorial | **missing** |
   | lens | subject × time × viewer | **missing** (only `sortMode`) |
   | ranking version | yes | `rankingVersion: string?` — never written by feed code |
   | variant | yes | `experimentId?`, `variantId?` — never written |
   | position / surface / placement / session | M16 | present (`rankPosition`, `surface`, `placement`, `feedSessionId`) |
   | qualified exposure (≥50% ≥1s, once/post/session) | yes | `viewportQualified?`, `dwellMs?` exist; **no exposure event, no dedup** |

   Every new event type must also be registered in `eventCatalog` (seeded in `convex/seed.ts`), or `captureEvent` throws (CAP-437).
3. **How `cardSummaries` and `postDistributionScores` are computed.**
   - `postDistributionScores`: inserted at publish (`ensurePostDistributionScoreTx`, dirty). Every minute `jobs/rank.ts · distributionRecompute` claims ≤50 dirty rows (`by_dirtySince ≥ 0`) and recomputes `topScore` / `hotScore` / `trendScore` from the stored counters and the latest 2 buckets. `jobs/explore.ts` patches `explorationDeficit`. Since the counters never change in prod, the row is recomputed once and then never becomes dirty again.
   - `cardSummaries`: `cards.ts · refreshCards` (cron "card summaries refresh") takes the **30 freshest** rows by `lastEligibleInteractionAt` and writes `oneLiner` (neutral body slice, `groundingStatus: "insufficient"`), `runningCommentRef` (best `commentScores.bestScore` among human passed top-level comments, frozen 15 min), `avatarUserIds` (≤3 human commenters) and `discussingCount`. Posts outside the freshest 30 keep stale or missing summaries, and `assembleCard` falls back to `post.title`.
4. **What `getChrome` returns** (`convex/feed.ts:235`): `{ hero[≤6]: {slotOrder, postId, slug, coverImage, title, ctaLabel, disclosureClass, isCommunityTop}, vibing[≤8]: {objectType, objectId, hook|null, humans}, featured: {postId, label}[], podium: {forming:true} | {forming:false, entries[≤5]{userId, rank, points, trend, displayName}}, typeNav: {type,label}[] }`. It takes no lens argument and no viewer argument.
5. **Demo rows flagged and excludable?** Registry-tagged, **not** flagged in-row, and **not excludable at read time**. See §D.

---

## D. Demo world — where it lives, how it's flagged, whether projections can exclude it (D-14)

**Where the code lives**

| Piece | Path |
|---|---|
| Spec | `ak-redesign/specs/DEMO-WORLD-SPEC.md` |
| Importers (Convex, local-only) | `convex/demoWorld/importMembers.ts · importTools.ts · importPosts.ts · importComments.ts · importEngagement.ts · importEvents.ts · importChrome.ts` |
| Guard + registry helper | `convex/demoWorld/lib.ts · guard()` (→ `assertLocalDeployment`, loopback only) · `register(ctx, table, docId, batch)` |
| Removal | `convex/demoWorld/remove.ts · REGISTRY_ORDER, collectIds, removeBatch, sweepBatch` + driver `scripts/demo-world/p6-remove.mjs` → `p6-settle.mjs` |
| Verify | `convex/demoWorld/verifyWorld.ts`, `scripts/seed-check.mjs` (base fingerprint) |
| Generation pipeline | `scripts/demo-world/*` (p2–p6), cache `.demo-world-cache/` |
| Beta switch runbook | `scripts/demo-world/BETA-SWITCH.md` |
| **Other demo sources (not the world)** | `convex/seed/demo.ts` (base seed, `RUN_KEY = "demo-seed-r3"`, emails `@demo.createconomy.invalid`), `convex/dev/demoSeed.ts` (admin-console fixtures). **These are not registered in `demoRegistry`.** |

**How demo rows are flagged**
- `demoRegistry {table, docId, batch}` (schema `convex/schema.ts` §DEMO-WORLD) gets one row per imported document, written in the same transaction (`register`). Indexes: `by_table`, `by_batch`. There's no index by `docId`, so "is this doc demo?" is a full scan or needs a new index.
- `demoGroundTruth` holds planned traits (bad actors, sentiment, etc.). It's a measurement baseline, not a flag.
- Members: emails `@demo.createconomy.invalid`, no auth accounts. That's a convention, not a field.
- **No table has an `isDemo` field.** `rawEvents` has no demo stamp either (it has `isStaff` / `isPersona` / `isCountableAtWrite` only).
- Job outputs created *after* import (threadStats, activityLedger, leaderboardProjections entries, cardSummaries, etc.) are **not registered**. `sweepBatch` finds them by demo user/post ids at removal time.

**Can every projection exclude them?** **No, not today.**
- Exclusion works only by **deleting** the world (BETA-SWITCH), not by filtering at read or compute time. No projection job (`rank`, `vibing`, `explore`, `cards`, `recognition`, `legitimacy`, `might`, `analytics/projections`) consults `demoRegistry`, and there's no `feed.excludeDemo` key.
- The base seed (`seed/demo.ts`) and `dev/demoSeed.ts` rows are invisible to the registry, so a registry-based exclude would miss them.
- Mitigating fact: all three demo writers are guarded to loopback deployments, so **prod Convex Cloud should hold zero demo rows**. D-14 is therefore about the **local/staging** world and about future beta data mixed with demo. The spec should say which (F-5).
- The cheapest additive path for B2 (proposal only): add `v.optional(v.boolean())` `isDemo` on the roots (`users`, `posts`, `comments`) + `rawEvents`, stamped by the importers, and have each projection filter `isDemo !== true` when `feed.excludeDemo` is on. Alternatively, add a `by_docId` index on `demoRegistry` and look up per row. That's cheaper to add but costs a read per candidate row in every job. Either way it's backend, so it needs a CR (L-03).

---

## E. s02 display components vs `CanonicalFeedClient` — what each lacks

**Important file-naming fact (contradicts FEED-DESIGN §16.1, see F-1).** The s02 port (`426f8a3`, upgraded `c77e6d4`) built a **new set** of files: `feed-page-view.tsx, feed-card.tsx, feed-hero-carousel.tsx, feed-tabs.tsx, feed-left-nav.tsx, feed-rail.tsx, feed-avatar.tsx, feed-display-types.ts, feed-post-type-meta.ts`. The files §16.1 and the B5/B6/B7 prompts name (`post-card.tsx, post-interaction-row.tsx, comments-preview-cycler.tsx, post-actions-menu.tsx, trend-sorter.tsx, top-post-hero-carousel.tsx`) are **older pre-s02 components**:
- `post-card.tsx` (+ `post-interaction-row`, `comments-preview-cycler`, `post-actions-menu`): **imported by nothing** (dead).
- `trend-sorter.tsx`: used by the live `CanonicalFeedClient`.
- `top-post-hero-carousel.tsx`: used by the live `AppShell` hero.
- `report-post-dialog.tsx`: used by `discussion/thread-header.tsx`.
- `feed-undo-toast.tsx`: used by s02 `feed-page-view.tsx`.

| | `CanonicalFeedClient` (live, Convex) | s02 `FeedPageView` + children (lab, props-only) |
|---|---|---|
| Data | `feed.list`, `getChrome`, `getWhy`, `cardAction`, `unhide` (D-016-violating: display + data in one file) | None (correct per D-016); fixtures in `app/(app)/lab/feed/fixtures.ts` |
| Card | Plain admin-looking card: type badge, title, oneLiner, Rising badge, engagement, "Why this?" drawer, hide/mute/report | v2 card: per-type strip, avatar + persona label, cover, comment previews, participants, valuable/reply, saved/valued state, extras (review stars, debate agree/disagree, meta) |
| **Lacks (live)** | v2 visuals; avatars, previews and participants (payload lacks them, D-03); persona/editorial labels; facets; why-care line; Valuable/save actions on the card | — |
| **Lacks (s02)** | — | "Why am I seeing this?" sheet (no `getWhy` slot), "Hidden · Undo" wiring (toast exists, no hide action in the card menu: *to verify*), see-fewer/mute, life stage + why-care line (§10.3), Updated marker, pinned label, Gem icon, facets for Compare/Help/List/Showcase/News/Spark (only review/debate/meta), debate vote-to-reveal with equal weights (it shows counts as data, which contradicts L-29 if counts show before voting), Level icon, `points` on Podium (R-10), Fav glow, hover note/tooltip, lens header, compact/large hero split per L-43, autoplay removal (L-31) |
| Hero | Inline badge grid (+ AppShell autoplay carousel) | `feed-hero-carousel.tsx`, 2-state, autoplay with pause |
| Sorter | `trend-sorter.tsx` | `feed-tabs.tsx` |

Mapping gap for the wiring phase: `assembleCard` output → `FeedCardData` needs an adapter in the container (author → `FeedPerson{name, handle, avatarUrl, isPersona}`, `runningCommentRef` → `commentPreviews[]`, `avatarUserIds` → `participants[]`, viewer `isValued/isSaved`, `href` from slug). At least half the fields have no backend source until CR-010 / D-10 land.

---

## F. Spec vs code — STOP items (PROPOSED decisions for the PM)

- **F-1 — Which component set is canonical?** §16.1/B5/B6/B7 say "EXTEND `post-card.tsx` / `trend-sorter.tsx` / `top-post-hero-carousel.tsx`", but the approved v2 work (D-016, `c77e6d4`) lives in `feed-card.tsx` / `feed-tabs.tsx` / `feed-hero-carousel.tsx`. Extending the named files would mean building on the pre-v2 look and leaving the v2 port parallel, which breaks standing rule 1 either way.
  **PROPOSED L-51:** the s02 `feed-*` set is the canonical display layer. `post-card.tsx`, `post-interaction-row.tsx`, `comments-preview-cycler.tsx` and `post-actions-menu.tsx` are retired (deleted in B5 once unreferenced). `trend-sorter.tsx` is replaced by `feed-tabs.tsx` in B6. `top-post-hero-carousel.tsx` + `layout/top-post-hero-section.tsx` are replaced by `feed-hero-carousel.tsx` in B7. §16.1 and the B5–B7 prompts are amended to name the `feed-*` files.
- **F-2 — Two heroes on `/feed`** *(code-read)*. AppShell renders the autoplay carousel and `CanonicalFeedClient` renders its own hero grid. **PROPOSED:** until B7, the inline grid in `CanonicalFeedClient` is the one removed (it prints the raw `disclosureClass`, a COPY-1 breach). Founder to confirm in the browser.
- **F-3 — "New·24H" isn't what `new` does.** `feed.list` orders `new` by `lastEligibleInteractionAt` (last activity), not `publishedAt`, and no sort applies a time window. **PROPOSED L-52:** New = `publishedAt` within the config window (24H). Hot/Top candidates are bounded by their config windows (7D/30D) in B3. This needs a new `by_publishedAt` index on `postDistributionScores` or a scan of `posts.by_..._publishedAt` (additive).
- **F-4 — Editorial posts are excluded from organic sorts** (`authorType !== "user"` → skip). The spec wants an "editorial · Createconomy" card label and `why shown = editorial`. **PROPOSED L-53:** organic engines keep scoring human posts only (persona/staff weight 0). Editorial posts can appear only as labelled placements (hero / pinned), never in organic rank. Otherwise the founder must say editorial posts enter organic sorts.
- **F-5 — D-14 scope.** Prod cannot hold demo rows (loopback guard). **PROPOSED L-54:** D-14 means (a) every projection job filters an in-row `isDemo` stamp when `feed.excludeDemo` is on, on local/staging, and (b) the base seed and admin fixtures are stamped too, not only the registry world. The founder confirms whether a staging deployment with demo + real data is planned. If not, D-14 shrinks to "BETA-SWITCH removal is sufficient".
- **F-6 — Post-level Valuable doesn't exist.** M6 reactions are on comments. §10.1 shows a Valuable count on the post card, and `valuableWeighted` on the post row has no source. **Open:** does the post's Valuable = the sum of legitimate Valuables on its comments, or a new post-level reaction (a new table, so a CR)? This blocks CR-014's exact definition.
- **F-7 — Post saves have no mutation.** `saves` has no writer, so Fav and the save counter are dead. B2 must add a `toggleSavePost` mutation (additive). Confirm it belongs in B2, not B5.

---

## G. Dependency-ordered risk list

| # | Risk | Blocks | Severity | Mitigation / phase |
|---|---|---|---|---|
| 1 | No prod post counters (CR-014) and no post-level Valuable definition (F-6) | Top, Hot, Rising, Hero auto-fill, Quality engine, card counts | **Critical** | Founder answers F-6 → B2 writes counters in the same mutation as reactions/comments/saves. Dev review (L-03). |
| 2 | No bucket writer (CR-013) | Vibing, trend/rising, Momentum engine | **Critical** | B2 bucket upsert in the same mutations (hour/day key). |
| 3 | No exposure event (L-13) + no whyShown/lens fields (L-12) | exploration, per-exposure scoring (L-30), author reach line, health numbers, E-01/E-03 | **High** | B2: `feed.exposure` catalog event via a client mutation with session dedup. Add `v.optional` fields. Mind the write volume (sample raw, aggregate on write). |
| 4 | No post-save mutation (F-7) | Fav, save counts, "save → return" grammar | High | B2 additive mutation. |
| 5 | Demo exclusion not possible at compute time (D-14, F-5) | Trustworthy health numbers on local/staging; B12 sim with mixed data | Medium (prod-safe by guard) | B2 `isDemo` stamp + `feed.excludeDemo`, after F-5 is answered. |
| 6 | No time windows; New sorts by activity (F-3) | L-07/L-08 truthfulness of tab labels | High | B3 (needs an index, additive). |
| 7 | Exploration computed but never injected; no per-author cap | L-18 fair first look (north-star reason #1) | High | B3, after risk 3 so the deficit moves. |
| 8 | Card payload thin (CR-010, D-10) | B5 card cannot show avatars/previews/facets with real rows (D-012) | High | B5a, after B2/B3 so the numbers are real. |
| 9 | Canonical component set ambiguous (F-1); dead `post-card` family; two sorters, two heroes | Every UI phase (rule 1, "never parallel") | High (process) | PM records L-51 before B1/B5. |
| 10 | Live hero autoplay (L-31) + raw `disclosureClass` text (COPY-1) on `/feed` today | Prod UX / copy rules | Medium | F-2 now; full fix B7. |
| 11 | `refreshCards` covers only the freshest 30 posts | Card summaries missing for older Top/Hot posts | Medium | B5a: drive from dirty set or sort-specific cohorts. |
| 12 | Podium: only overall/d7 written; opaque points (R-10) | §9.7, L-28, L-32 | Medium | B10a. |
| 13 | Taxonomy split three ways; O-06 open | Discover topics, lens subjects, StellarMap, affinity | Medium (B4 gate) | Founder list (O-06) → B4. |
| 14 | `vibingHooks` has no writer → Vibing always shows neutral titles | §9.5 hook quality | Low | B8 (GLM-gated, fail closed). |
| 15 | Feed admin keys missing (kill switches, safe mode, rollback, health) | L-02 "gates ship with the feed" | Medium | B11; safe-mode/rollback keys stubbed in B3. |

---

## H. Proofs

No code was changed, so there are no screenshots or test runs for this phase. Every claim cites a file and function. These claims are *(code-read)* only and need confirming with a browser or `npx convex run` before acting: the double hero on `/feed` (F-2), the s02 hide/undo wiring, and the prod-zero counters (verify on prod with a read-only `postDistributionScores` sample — founder/dev, Bucket-1).

## I. Lines to append to FEED-DESIGN.md §17

```
- 2026-10-11 — FEED-B0 audit: ak-redesign/specs/FEED-GAP.md. Prod has no writer for post counters (CR-014), day buckets (CR-013), post saves or exposure events → Top/Hot/Vibing/Rising/Fav/exploration are flat in prod; demo world is registry-tagged only (no in-row flag, no read-time exclusion). PROPOSED L-51 (s02 feed-* components canonical; §16.1/B5–B7 file names amended), L-52 (New = publishedAt in window; windows bound candidates), L-53 (editorial only as labelled placements), L-54 (D-14 scope = in-row isDemo stamp + feed.excludeDemo on local/staging). Open: F-6 post-level Valuable definition; F-7 post-save mutation lands in B2.
```
