# CONTRACT-6-feed-FINAL

**Screen:** Feed / Home — `/` (authed) · `/feed`
**Wave:** 6A (M9 Feed & Discovery)
**Template archetype:** 3-col app feed (STYLE-KIT §12.1)
**Primary CAP-IDs:** CAP-182, 183, 184, 185, 186, 189, 190, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 553
**Actors:** anonymous, member
**Register basis:** 554-row register; in-scope rows verified from source. **E1–E6 CLOSED 2026-08-25.**
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; Opus in majority → vote dropped, resolved on evidence — GPT's transient micro-states folded). See RECONCILIATION-6A §1.

---

## 1. Route & Access
- **Paths:** `/` (authed) and `/feed`, no params. **Actors:** anonymous, member. All four sort CAPs (182–185) are **`Gated by: none`** — public. **Two explicit branches required** (anonymous-safe vs full-member) per the Public-Read-Query rule.
- **Registered branch deltas (enumerated from the rows):** anonymous default landing = **Hot** (CAP-183); **Fav sort is member-only** (CAP-185 Actor=member); session repetition controls member-only (CAP-200 / **CAP-553 unhide/unmute**); "Why am I seeing this?" drawer member-only (CAP-199); Fav's unread-activity ordering depends on member `threadReadStates`. Per-field anonymous-safe card projection lists beyond these are unspecified (Open Question).
- **Shared-CAP division (stated in both contracts):** CAP-192 appears here **and** on `/admin/curation`. **This screen is the RENDER surface** for `heroSlots`/`heroAssignments` (+ CAP-193 System auto-fill); the upsert/schedule **mutation lives on `/admin/curation`**. Same for `vibingFeatured`: booking is `/admin/curation` (CAP-191); emergency-pull is `/admin/curation` (**CAP-554**); the labeled frame renders here.
- **Controlled-participation firewall:** Hero and Featured provide **labeled display visibility only** — they must not alter organic ranking, exploration deficit, or Vibing `trendScore`. CAP-423 (INV-M15-4) gates hero-assignment mutations (Hero/Featured ≠ organic/exploration scores). Personas/staff = ZERO in core ranking (sole exception: Vibing momentum's human anchor).
- **Indexing:** feed routes are **noindex** (CAP-486).
- **Backend dependencies NOT on this screen:** CAP-187/188 (cron recompute / exploration refresh), CAP-129/130 (M6 rank crons), CAP-132/133 (M6 MAX compute — artifacts consumed via CAP-190), CAP-293/294 (M12 computes Podium; this screen renders per CAP-194).

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `posts` | read | feed inventory; moderation/visibility filtering per M13/M4 |
| `postDistributionScores` | read | topScore, hotScore, trendScore, integrityMultiplier, valuableWeighted, distinctCommenters, replyCount, saveCount, qualifiedReads, returns7d, qualifiedExposureCount, explorationDeficit — **projection; read = index scan, never compute-at-read**. **The ranking home.** Card assembly must not write these fields. |
| `postDistributionBuckets` | read | rolling hour/day aggregates feeding the 7d windows |
| `feedExplorationState` | read | exposure-deficit queue; **NEVER an operator curation surface** (INV-4) |
| `cardSummaries` | read (+ System writes CAP-195/196/197) | oneLiner, generationRunId, supportingClaimIds[], groundingStatus, stale, **runningCommentRef** (CAP-196), **avatarUserIds[]** + **discussingCount** (CAP-197). Pre-computed display projection (E4 closed). Must not write rank/score fields. |
| `feedSessions` | read + write (CAP-200, CAP-553) | sessionId, userId?, sortMode, rankingVersion, createdAt, expiresAt; hide/mute state; CAP-553 reverses hide/mute |
| `saves` | read (Fav) | saved posts |
| `commentSaves` | read (Fav) | saved comments — **E5 CLOSED:** CAP-185 Reads now includes `commentSaves` |
| `comments`, `threadReadStates` | read (Fav — Your Discussions + unread-activity) | |
| `vibingTrends` | read (written by CAP-189 cron) | objectType {post\|tool\|category\|theme}, trendScore, velocity, acceleration, distinctHumanCount, interactionTypeCount, integrityMultiplier, cooldownUntil, status |
| `vibingHooks` | read (written by CAP-190) | hookText, valence {tension\|curiosity\|informational\|positive}, sourceIntelligenceRunId, groundingStatus {grounded\|insufficient}, entailment {supported\|contradicted\|insufficient}, supportingSpans[], opposingSpans[], stale |
| `vibingFeatured` | read (render of Featured frames) | ⚠️ no anonymous/member-facing row lists it in Reads (Open Question). Pulled items (CAP-554 `status=pulled`) must not render. |
| `heroSlots`, `heroAssignments` | read (render; writes on /admin/curation; CAP-193 auto-fill writes heroAssignments) | |
| `leaderboardProjections` | read | category {overall\|commenter\|helper\|reviewer\|rising}, window {h24\|d7\|m1}, entries[], minThresholdMet — **M12-computed** |
| `users` | read | author rep (CAP-184), engaged avatars (CAP-197), Podium entries (CAP-194); opted-out exclusion. **Never `privateUserData`.** |
| `posts`/`postSources`/`sourceClaims` | read (CAP-195 one-liner grounding) | |
| `comments`/`commentScores`/`commentReactions` | read (CAP-196/197 running-comment + avatars) | |
| `rawEvents` | write | CAP-183 (anonymous session), CAP-184, CAP-199 (read), CAP-200 only |
| `reports` | write (CAP-200 report branch) | |
| `systemConfig` | read | per-row read sets |

## 3. States
*(Enum-backed states enumerated below. GPT's ~90 transient micro-states — each threshold-fail, each Podium cell as its own state, each post-snapshot eligibility change — are folded, since they are behaviors/derived conditions, not enum-backed screen states. Per RECONCILIATION-6A §1, this wave's enum-backed set is genuinely rich, so the enumerated list is larger than prior waves.)*

**A. Sort modes (`feed.sortMode`, four — genuinely distinct):**
1. **Top** (CAP-182) — **Bayesian confidence-damped positive score; NOT Wilson** (no trials denominator; Wilson variant deferred pending qualified-exposure trials); per-type normalized; 7-day rolling by interaction; evergreen protected.
2. **Hot** (CAP-183) — momentum formula; **anonymous default landing**; quality floor kills comment-farming; velocity anomaly → integrity review (**never viral bonus**).
3. **New** (CAP-184) — reverse-chron + interleaved exploration; cold-start author boost; anti-bubble cross-injection; dynamic rate (launch-high, taper); personas excluded from exploration injection.
4. **Fav** (CAP-185, member-only) — Saved + Your Discussions (participated); unread-activity → latest human activity; **saved comments (commentSaves) surface alongside saved posts** (2026-08-09 extension; E5 Reads column caught up).

**B. Post-type nav (CAP-186):** active types only (8: news·review·compare·help·spark·debate·list·showcase); **launch_pad + gigs hidden** until ~1000-DAU flip (admin CAP-104, not deploy). Reads `postTypeConfig.state`.

**C. Vibing ticker — qualification (CAP-189):** unqualified → **qualified** (≥3 distinct humans + ≥2 human interaction types + anti-domination + min duration) → active → **cooldown** (cooldownUntil) → exit. `objectType {post·tool·category·theme}`. **Personas contribute ZERO** to velocity/acceleration/type-count/confidence/threshold/rank; persona participation = display-only context **after** human qualification (M9 CONFIRMED). Integrity multiplier applied.

**D. Vibing hook (CAP-190) — `valence {tension·curiosity·informational·positive}`:** valence-drift guard (tension-cap ~35% rolling + ≥1 curiosity + ≥1 positive per cycle + question-over-contempt scorer + drift audit); representativeness (min distinct-human/cluster-support + supporting+opposing spans + **no emotion attributed to a named user** + neutral fallback); entailment-verified via M6 MAX (sourceIntelligenceRunId); `groundingStatus=insufficient`/`stale` → regenerate or **fall back to neutral title**.

**E. Featured overlay (render of CAP-191 bookings):** time-bound window; labeled "Featured", **visually unmistakable**; cadence ≤1/cycle, ≤1–2 active; **NEVER mutates trendScore**; empty slot → next algorithmic item; **CAP-554 `status=pulled`** removes the item before natural expiry (admin write on `/admin/curation`).

**F. Hero band — `hero.status {draft·scheduled·active·expired·paused·archived}`:** 10 managed (slotOrder 0–9), **4–6 rendered**, **≥2 rotate per 24h**; desktopEnabled/mobileEnabled; overrides (headlineOverride?/textOverride?/mediaAssetId?/ctaLabel?); fallbackPostId?; **stale >24h with no fresh slots → CAP-193 auto-fill from TOP labeled "Community Top"**; **never Recognition-selected**.

**G. Podium widget (CAP-194) — 5 categories × 3 windows (15 cells):** Overall · Best Commenter · Best Helper · Best Reviewer · Rising × 24H · 7D · 1M. Min activation 25 contributors *(updated 2026-08-26, Wave 7C L25 — matches data-model `leaderboard≥25`; register CAP-194/294 amended)*; below → `minThresholdMet=false` → **"Podium is forming"** (per CAP-294). Personas/staff excluded. Rising = period-over-period growth + baseline + eligible-event floor. Reads M12 projections only (renders empty/"forming" until M12 ships — deferred, not a gap).

**H. Card assembly (CAP-195/196/197):**
- **One-liner (CAP-195):** 90–160 chars, neutral/factual, M2-grounded (supportingClaimIds); **stale on material revision → excerpt fallback**; member posts only, not persona. **E3 CLOSED:** Gated-by is `none` (stale CAP-173 removed).
- **Running comment (CAP-196):** pre-computed onto `cardSummaries.runningCommentRef`; same trust-weighted Best score as M6 (register's "M6 Best/Wilson" phrasing is legacy — authoritative = Bayesian); **freeze ≥15min anti-flicker**; personas excluded; **empty → "Start the discussion"**.
- **Engaged avatars (CAP-197):** pre-computed onto `cardSummaries.avatarUserIds[]` + `discussingCount`; up to **3 distinct recent genuine human engagers**; **savers counted but NOT shown**; personas/staff/suspended/opted-out excluded.
- **Per-type CardExtras (LOCKED 2026-08-31 — product-fit review; this ships):** each post-type card may render one compact, type-specific extension strip beneath the one-liner, dispatched by `post.type` (registry pattern): **review** → score dial (verdict + weighted score preview) · **debate** → stance chip (motion + current agree/disagree split) · **gigs** → gig chips (role · budget · duration) · compare → winner-row preview · list → top-3 preview · showcase → media thumb · help → solved/unsolved state · spark → none (statement is the card) · news → corroboration count. Rules: **max 1 line, no images except the showcase thumb; no interactive controls on the card** (weight sliders / re-ranking are archived — see FUTURE-M5-01/02); extras are display-only projections of per-type extension data — they must not write rank/score fields, and the uniform-card firewall (§3M) applies unchanged. Absent extension data → no strip (never a placeholder).
- **E4 CLOSED:** these are stored projections, not live render queries. Display only — must not write `postDistributionScores`.

**I. Realtime (CAP-198):** snapshot feed; **only visible-card counters + "newer material exists" pushed** — never a live reorder. **E1 CLOSED:** gated by CAP-182/183/184/185 (feed open).

**J. Per-card session controls (CAP-200 / CAP-553):** hide (feedSessions) · mute (feedSessions) · **unhide/unmute (CAP-553 `feed.unhide`)** · see-fewer (⚠️ no distinct write target — Open Question) · report (→ reports).

**K. "Why am I seeing this?" drawer (CAP-199):** per-card reason render from postDistributionScores/feedExplorationState/cardSummaries/rawEvents. Founder-picked MVP feature.

**L. Rising badge (CAP-201):** card badge → routes to Podium (**E2 CLOSED:** CAP-194, not CAP-175).

**M. Firewall invariants (govern every state):** personas/staff ZERO in core ranking; controlled participation display-only; Recognition/featuring never boost organic; exploration never operator curation (INV-4); velocity anomaly → integrity review, never viral bonus; **cardSummaries display projections never write rank**.

**N. Empty state:** governed by M14 CAP-371 R-EMPTY (honest empty; feed uses Hot/Top/New before empty; personas never count as human activity) — ⚠️ that governor is Wave 7 (Open Question).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Open feed on Top | anonymous, member | CAP-182 `feed.list (Top)` | none | none |
| Open feed on Hot | anonymous, member | CAP-183 `feed.list (Hot)` | rawEvents (anon session) | none |
| Open feed on New | anonymous, member | CAP-184 `feed.list (New)` | rawEvents | none |
| Open feed on Fav | member | CAP-185 `feed.list (Fav)` | none | member session |
| Render post-type nav | System | CAP-186 (R-NAV; no mutation named) | none | postTypeConfig.state |
| Vibing momentum compute | cron | CAP-189 `vibing.compute` | vibingTrends | human-activity-only qualification |
| Hook generation | System | CAP-190 `card.generateHook` | vibingHooks | CAP-189 (qualified); CAP-132 (MAX grounding — neutral fallback if absent) |
| Hero stale auto-fill | System | CAP-193 (writes heroAssignments) | heroAssignments ("Community Top") | CAP-192 (no fresh slots); CAP-187 (TOP scores) |
| Podium render | anonymous, member | CAP-194 `leaderboard.render` | none | minThresholdMet |
| One-liner generation | System | CAP-195 `card.generateSummary` | cardSummaries (oneLiner) | none (member posts only, not persona — constraint in Notes, not a CAP-173 gate) |
| Running-comment pick | System | CAP-196 `card.pickRunningComment` | cardSummaries (runningCommentRef) | CAP-129 (rank scores) |
| Engaged-avatars pick | System | CAP-197 (no mutation named) | cardSummaries (avatarUserIds, discussingCount) | CAP-129 |
| Realtime push | System | CAP-198 (R-PRECOMPUTE; no mutation) | none | CAP-182/183/184/185 (feed open) |
| Open why-drawer | member | CAP-199 (render; no mutation named) | none (reads rawEvents) | none |
| Hide / mute / see-fewer / report card | member | CAP-200 (mutation unnamed) | feedSessions (hide/mute), reports (if report), rawEvents | none |
| Unhide / unmute previously hidden item | member | CAP-553 `feed.unhide` | feedSessions (hide/mute reversed) | none |
| Click Rising badge | member | CAP-201 (UI route) | none | routes to Podium (CAP-194) |

## 5. Analytics Events
Only **CAP-183, CAP-184, CAP-200** write `rawEvents` (same-mutation capture per CAP-436; catalog gate CAP-437; stamps CAP-438). CAP-199 **reads** rawEvents for the drawer — no write. CAP-553 writes no `rawEvents`. **No eventType literals are named in any of the rows — catalog-owned; none invented.** CAP-183's anonymous-session capture is the pre-login join seam (anonymousSessionId → identityJoins, CAP-387/441). rawEvents are never consent-gated (FATAL-M18-02); PostHog mirroring is separate best-effort (CAP-442). Featured/Hero exposure telemetry must preserve placement/surface context so controlled visibility isn't misread as organic performance.

## 6. Components Used
- §12.1 3-col app feed layout · §11.3 card family (post card; **Widget Card** for Podium/Vibing; hero cards) · **§11.6 Avatar** (engaged avatars, ≤3, stack) · **§11.5 Pill/Tag** (type nav, Featured badge — visually unmistakable, Rising badge) · §11.4 nav/sort tabs · **§11.1 Button** · **§11.7 Sheet** (why-drawer nearest pattern; report → Report modal overlay CAP-324) · Toast §11.7 (available-not-prescribed) · **§11.9 Skeleton** (stagger-load).
- **Archetype gap: A7 momentum ticker** — inventory §3 (do not invent). Also undefined: Hero rotator, Podium category/window matrix, reason drawer, avatar stack, realtime-new-material indicator.

## 7. Open Questions
*(Escalated items in RECONCILIATION-6A are closed. These remaining items are unspecified detail.)*
1. **vibingFeatured render read path** — no anonymous/member row lists it in Reads; the ticker's Featured frames have no registered read capability (CAP-191 is the admin write). (GLM.)
2. **"Cycle" in the Featured cadence cap** (≤1/cycle, ≤1–2 active) — window length undefined; no systemConfig key named. (All three.)
3. **"See-fewer" (CAP-200)** — no distinct write target; Writes cover only hide/mute (feedSessions), report (reports), rawEvents. CAP-553 reverses hide/mute only. (GLM + GPT.)
4. **Anonymous-safe vs full-member card projection field lists** — only capability-level deltas registered. (All three.)
5. **Realtime cadence bounds (CAP-198)** — unspecified (M6's hot-window analog has explicit bounds; feed's do not). (GLM + GPT.)
6. **Hero "New/just-added" returner detection** — mechanism unspecified (needs a last-visit signal; M14 `lastVisitAt` lands W7). (GLM.)
7. **Empty-feed governor is W7** (CAP-371/372) — this screen ships W6 before it; interim empty behavior unspecified. (GLM + Opus.)
8. **`feedSessions.expiresAt` session-reset** — CAP-553 owns unmute/unhide; no CAP governs automatic session-repetition reset at `expiresAt`. (residual of the prior standing-rule note.)
9. **Podium + Vibing-hook cross-wave deferrals** — Podium reads W7 M12 `leaderboardProjections` ("Podium is forming" until then); hook depends on M6 MAX (CAP-132) with neutral fallback if absent. Both handled by fallback, flagged as deferred not gaps. (Opus.)
