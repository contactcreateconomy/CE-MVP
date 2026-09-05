# SLICE CATALOG — BUILD PHASE 7-GROWTH: SEO/INDEXABILITY ENGINE + M14 RETENTION BEHAVIOR

**Date:** 2026-08-29 · **Phase order source:** AUDIT-FINAL.md Part D (corrected build order)
**Sub-batch:** 7-GROWTH — the catalog three prior headers promised (`SLICE-CATALOG-PHASE7-ECON.md`, `SLICE-CATALOG-PHASE7-ADMINCORE.md`, `SLICE-CATALOG-PHASE7-TRUST.md`). Slice IDs are `SLICE-P7G-*`. **Not** the 7-OPS four consoles (analytics/reliability/utm/seo **views**). This batch owns the **M17 evaluator + structured-data/sitemap/noindex family** and the **M14 retention behavior layer** (empty-states, visit/since, drip.release, newsletter overlay, admin retention knobs).
**Basis:** `CAPABILITY-REGISTER-MERGED.md` (572 rows) · `_data-model.md` (live 2026-08-29) · `M17-growth-seo.md` (R-INDEXABLE / R-AGGREGATE-RATING / **FATAL-M17-C1** / R-PROVENANCE) · `M14-onboarding.md` (R-EMPTY / R-DRIP / R-VISIT / R-SINCE / R-NEWSLETTER / R-QUOTA) · `CONTRACT-7-admin-seo-FINAL.md` (consume P7O-07 view; this batch is the engine underneath) · `CONTRACT-2-post-detail-FINAL.md` CAP-107 Wave-2 noindex default · P7T-11 (CAP-468/469 **destinations** — provenance + AI-disclosure **pages**; this batch **pairs** them to indexability) · P4-13 (post detail SSR already ships **noindex** until this batch + 468 flip) · P6-03/05 (feed/search noindex **consume** CAP-486 helper) · P7A-06 CAP-381 (drip supply **alert** — this batch **produces** dripBatches)
**Tagging (this firing):**
- **`[BIBLE-FIX — apply now]`** — a `_data-model.md` edit this slice’s own description requires. Apply in the same session. Do **not** park it as “described in the catalog.”
- **`[CODE — Phase 5 build]`** — anything requiring actual files. Describe fully. **Do not create the file in this catalog session.**
**Sizing-rule addendum applied:** cited M17 §6 (`utmDictionary`, `seoHealth`, indexable-entity deepen, `postSeoMeta` l.166) and M14 (`dripBatches` l.52, `newsletterConsents` l.51) are **complete inline**. Indexable deepen (`previousSlugs[]`, `lastReviewedAt?`, `reviewedByUserId?`, `provenanceVersion`) is already on the bible (l.288) — **consume; schema.ts additive columns are [CODE]**. `consentRecords` still P7T-13 — not stolen. **CAP-466 override** remains intentionally no CAP (P7O-07 / 7-OPS skipped table) — this batch implements **`assertIndexable` the evaluator**, not an admin override.
**Phase boundary (this firing only):** M17 indexability engine + M14 retention **behavior**. **Consume, do not rebuild:** P7O-07 `/admin/seo` view + GSC pull · P7A-06 CAP-484/381 alert writers · P7T-11 trust-policy destinations (468/469) · P4-13 CAP-107 Wave-2 noindex shell · P6-07 acquire quota calendar (CAP-376/377 **landed there** — not re-sliced) · P1-02 notifications schema · P7T-01 notifications list (uses CAP-371 **rules** only until P7G-04). **Not this firing:** CAP-466 override · sitemap **regenerate UI** · UTM dictionary (P7O-06) · coach cards CAP-369/370 (M14 remainder still flagged if unsliced — not in the SF-01 list).

---

## Extra-scrutiny confirmations

### V1. CAP-471 = FATAL-M17-C1 — same care as every FATAL-adjacent slice

Quoted `M17-growth-seo.md` R-AGGREGATE-RATING: AggregateRating **only if** `distinctHumanCommunityRaterCount ≥ 3` AND aggregates from **M5 community fields only** AND `authorType=human`. Personas / staff / editorial **never** enter ratingValue/ratingCount. **Else omit AggregateRating entirely** (page may still index). Visible copy states the **exact** count. A test that emits AggregateRating from n=2, from personas-only, or from editorial `verdictScore` **fails this slice**.

### V2. CAP-468/469 destinations already exist — pair, do not duplicate

P7T-11 owns `/how-we-review`, `/editorial-policy`, `/ai-disclosure` (and related trust routes). FATAL-M17-01: indexable content pages **must** render the provenance block + those footer links. This batch’s `assertIndexable` **fails closed** (stays noindex) until those destinations resolve. Do **not** rebuild the pages.

### V3. CAP-380 is the PRIMARY retention mechanism

Register Notes + M14 R-DRIP + bible `dripBatches` (quoted): “Primary retention; soft-beta drip.itemsPerDay default **1**; **launch floor 40**.” Hourly UTC cron. This is **not** a minor capability. CAP-381 (P7A-06) is the **<14 day supply alert** on Home — it **reads** scheduled supply this cron maintains. Do not implement a second drip publisher.

### V4. CAP-376 / 377 are P6-07, not this catalog

P6-07 already implements user-local calendar DEC-S19 + lazy reset inside acquire. SF-03 adds those CAP-IDs to P6-07’s covered line. **Do not re-slice quota here.**

### V5. CAP-371 rules vs owner

P7T-01 already applies CAP-371 **honesty rules** on `/notifications` empty state. **P7G-04 is the owning slice** for the platform empty-state helper. P7T-01 **consumes**.

---

## SLICE-P7G-01 — `assertIndexable` evaluator + 404/410 + density/thin/affiliate gates (CAP-466 / 467 / 470 / 476 / 481 / 482) — FATAL-M17-01 pairing

- **CAP-IDs covered:** CAP-466, CAP-467, CAP-470, CAP-476, CAP-481, CAP-482
- **Source contract(s):** `M17-growth-seo.md` R-INDEXABLE · register Notes on each row · FATAL-M17-01 (founder 2026-08-23) · P4-13 CAP-107
- **Depends on:** SLICE-P4-13 (post SSR already noindex), SLICE-P4-04 (tools), SLICE-P6-06 (resources), SLICE-P7T-11 (468/469 destinations), SLICE-P1-05 (`systemConfig`)
- **Scope:** Implement `seo.assertIndexable(entity)` as a shared TS helper (quoted predicate): published ∧ moderation=passed ∧ visibility=public ∧ not duplicate ∧ not doorway ∧ not thin ∧ HTTP 200 ∧ affiliate-survivable ∧ persona-density OK. **CAP-476:** main content must remain useful if affiliate block removed; else noindex. **CAP-481:** persona-heavy + zero community ratings → noindex. **CAP-482:** tool/hub **≥150–300 words** per surface rules; thin → noindex. **CAP-467:** false → **404/410 + noindex,nofollow**; exclude sitemap; generic OG if URL hit. **CAP-470:** non-published → 410 (was public) or 404 + noindex; never rely on sitemap absence alone. **Wave-2/7 pairing:** P4-13 already ships noindex; this slice is the **flip** to indexable **only** when CAP-468 provenance can render (P7T-11). **No admin override** (intentionally no CAP — 7-OPS skipped). Apply indexable-entity deepen columns on posts/tools/resources from bible l.288 (`previousSlugs[]`, `lastReviewedAt?`, `reviewedByUserId?`, `provenanceVersion`) — **already on the bible**; schema.ts additive only.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (l.288 complete).
  - **[CODE — Phase 5 build]:** `convex/lib/assertIndexable.ts`; wire into P4-13 / P4-04 / resource SSR; 404/410 routes.
- **Acceptance criteria:** CAP-466 Notes (quoted): “assertIndexable = published ∧ moderation=passed ∧ visibility=public ∧ not duplicate ∧ not doorway ∧ not thin ∧ HTTP 200 ∧ affiliate-survivable ∧ persona-density OK.” CAP-467 Notes (quoted): “Else 404/410 + noindex,nofollow; exclude sitemap; generic OG if URL hit.” CAP-107 Notes (quoted): “flips to indexable only when CAP-468 ships.” M17 AC (quoted): “Given affiliate-only thin, When assertIndexable, Then false.”
- **Size check:** ≤2 days — one helper + three gate clauses + status mapping. FATAL-adjacent: never index without provenance destinations.
- **FATAL-adjacent flag:** FATAL-M17-01 pairing. Indexable=true without P7T-11 links is a blocker.

## SLICE-P7G-02 — JSON-LD / FAQ / sitemap / slug 301 / post-edit similarity (CAP-471 / 472 / 473 / 474 / 475) — FATAL-M17-C1

- **CAP-IDs covered:** CAP-471, CAP-472, CAP-473, CAP-474, CAP-475
- **Source contract(s):** M17 R-AGGREGATE-RATING · R-INDEXABLE sitemap · §7 slug · R-POST-EDIT-SIMILARITY
- **Depends on:** SLICE-P7G-01 (`assertIndexable`), SLICE-P4-04 (toolRatings community aggregate), SLICE-P4-15 (Help accepted-answer for FAQ), SLICE-P4-07 (M3 similarity — consume, do not fork)
- **Scope:** **CAP-471 (FATAL-M17-C1):** JSON-LD AggregateRating on tool pages **only** if ≥3 distinct **human** community raters (`authorType=human`); personas/staff/editorial **excluded**; **omit below**; visible copy states exact count. **CAP-472:** FAQ/HowTo only when visible real Q&A (≥2 pairs) or Help accepted-answer steps exist. **CAP-473:** sitemap ISR 3600s; **include only assertIndexable=true**. **CAP-474:** slug change appends `previousSlugs`; 301; admin audit if indexed ≥7d. **CAP-475:** substantive post-publish edit → flag / light re-run M3 similarity vs sources AND own corpus; do not silently bypass anti-doorway/plagiarism. Other JSON-LD types (WebSite/Organization/Article/…) per M17 §3 — emit only when the matching entity is indexable; do not invent types absent from the sheet list.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none.
  - **[CODE — Phase 5 build]:** `convex/seo/jsonld.ts`; `convex/seo/sitemap.ts`; `convex/seo/slugs.ts`; post-edit hook on P4-02/P4-11 update/publish.
- **Acceptance criteria:** M17 AC (quoted): “Given communityRatingCount=2 humans, When JSON-LD, Then **no** AggregateRating.” “Given communityRatingCount≥3 distinct humans, When JSON-LD, Then AggregateRating from M5 only.” “Given persona ratings only (n≥3), When JSON-LD, Then **no** AggregateRating.” “Given editorial score only, When JSON-LD, Then no AggregateRating.” CAP-473 Notes (quoted): “Include only assertIndexable=true.” CAP-474 Notes (quoted): “301 from previousSlugs; admin audit required if indexed ≥7d.”
- **Size check:** ≤2 days, full — AggregateRating tests are the precision item. Split line: 471/472 vs 473/474/475 if overflow — flagged, not pre-split.
- **FATAL-adjacent flag:** FATAL-M17-C1. Any AggregateRating that includes persona/staff/editorial or n<3 is a blocker.

## SLICE-P7G-03 — Link-rel / OG / noindex family (CAP-477 / 485 / 486 / 487 / 488)

- **CAP-IDs covered:** CAP-477, CAP-485, CAP-486, CAP-487, CAP-488
- **Source contract(s):** M17 §4 link rel · §6 / §17 OG · register CAP-486/487
- **Depends on:** SLICE-P7G-01, SLICE-P4-13 (Showcase already has rel on approved button — **share the helper**), SLICE-P6-12 (storefront product cards)
- **Scope:** Shared SSR helpers. **CAP-485:** user-authored links `rel="ugc nofollow"`; affiliate `rel="sponsored nofollow"`; Showcase **shared component** (do not fork P4-13’s approved-button rel). **CAP-486:** profiles · feed/search · admin · UTM-URLs **noindex** — this slice **owns the helper**; P5-07 / P6-03 / P6-05 / admin shell **consume** (many already say “noindex per CAP-486”; wire the helper, do not duplicate predicates). **CAP-487:** storefront product cards **DEFAULT noindex** unless substantive (doorway prevention). **CAP-477:** OG for unpublished/draft = generic Createconomy card. **CAP-488:** OG uses immutable state/version keys. Generic OG on 467 hits already specified in P7G-01 — call the same card.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none.
  - **[CODE — Phase 5 build]:** `convex/seo/robots.ts`; `convex/seo/og.ts`; `components/seo/OutboundRel.tsx`.
- **Acceptance criteria:** CAP-485 Notes (quoted): '`rel="ugc nofollow"`; affiliate `rel="sponsored nofollow"`; Showcase shared component.' CAP-486 Notes (quoted): “Profiles noindex · feed/search noindex · admin noindex · UTM-URLs noindex.” CAP-487 Notes (quoted): “Storefront product cards DEFAULT noindex unless substantive.” CAP-488 Notes (quoted): “OG uses immutable state/version keys.”
- **Size check:** ≤2 days — helpers + consume call-sites on already-sliced routes. Do not rebuild those screens.

## SLICE-P7G-04 — Honest empty-states + visit/since (CAP-371 / 372 / 373 / 374 / 375)

- **CAP-IDs covered:** CAP-371, CAP-372, CAP-373, CAP-374, CAP-375
- **Source contract(s):** M14 R-EMPTY / R-VISIT / R-SINCE · inventory global overlay note (empty-state renders)
- **Depends on:** SLICE-P1-01b (`users.lastVisitAt`), SLICE-P1-07 (rawEvents), SLICE-P6-03 (feed empty), SLICE-P5-03 (thread empty), SLICE-P7T-01 (consume honesty rules)
- **Scope:** Platform empty-state helper: **no fabricated counts; personas ≠ human activity**. Feed uses Hot/Top/New **before** empty; hide podium if participants **<25** (CAP-371; P6-03 Podium already has min-25 — **align**, do not invent a second threshold). Thread empty = **“No human comments yet”** (+ AI perspectives line if personas) (CAP-372). **CAP-373 `visit.commit`:** session qualifies (≥30s OR qualified action); preserve prior `lastVisitAt` as comparison anchor; write throttle ≥30m. **CAP-374:** `newItemsSince(lastVisitAt) ≥3` → show since-last-visit modules; only real events; else suppress + emit `retention.since_last_visit_suppressed`. **CAP-375:** suppressed → event + drip card **if any** (drip rows from P7G-05; if drip not landed, suppress without inventing a card). **CAP-376/377 are P6-07.**
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`dripBatches` / visit fields complete).
  - **[CODE — Phase 5 build]:** `convex/lib/emptyState.ts`; `convex/retention/visit.ts`; `convex/retention/sinceLastVisit.ts`.
- **Acceptance criteria:** CAP-371 Notes (quoted): “feed uses Hot/Top/New before empty; hide podium if <25.” CAP-372 Notes (quoted): “No human comments yet.” CAP-373 Notes (quoted): “preserve prior lastVisitAt as comparison anchor; write throttle ≥30m.” CAP-374 Notes (quoted): “only real events; else suppress + emit retention.since_last_visit_suppressed.”
- **Size check:** ≤2 days — helper + visit commit + since query. Overlay, not new routes.

## SLICE-P7G-05 — `drip.release` cron — PRIMARY retention (CAP-380)

- **CAP-IDs covered:** CAP-380
- **Source contract(s):** M14 R-DRIP · register CAP-380 · bible `dripBatches` l.52
- **Depends on:** SLICE-P1-04 (jobCatalog, `internal.*` only), SLICE-P1-05 (`drip.itemsPerDay` / `drip.releaseHourUtc` / `drip.launchInventoryFloor` / `drip.minScheduledDays` — M14 l.64 **named keys**, transcribe to registry seed if missing), SLICE-P6-06 (resources), SLICE-P7A-06 (CAP-381 **consumes** scheduled supply — do not write a second alert)
- **Scope:** **PRIMARY retention mechanism.** Cron **hourly UTC** publishes due items as `dripBatches` at `drip.releaseHourUtc`. Notify intersecting interests (copy = **supply announcement**, not human activity/social proof). Batch 0 → **no notif**. Default `itemsPerDay=1`. **Launch floor 40** banked (`drip.launchInventoryFloor`). CAP-381 already alerts when scheduled supply **<14 days** (`drip.minScheduledDays`) — this cron must leave a countable scheduled supply; do not duplicate the Home writer. **Flag explicitly:** this is not a minor capability.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`dripBatches` complete; config **key names** are on M14 l.64 — seed rows are [CODE] `configKeyRegistry`, not a bible field-list gap).
  - **[CODE — Phase 5 build]:** `convex/jobs/dripRelease.ts`; `crons.ts` hourly; notify via existing notifications writer (P7T-02/03 consume; do not invent a new notif type beyond catalog seed).
- **Acceptance criteria:** CAP-380 Notes (quoted): “notify intersecting interests; batch 0 → no notif; default itemsPerDay=1.” R-DRIP (quoted): “Soft-beta default `drip.itemsPerDay=1`; launch floor **40** banked; alert when scheduled supply < **14** days.” Bible l.52 (quoted): “Primary retention.”
- **Size check:** ≤2 days — one cron + notify. Floor/alert constants are named config keys, not invented.

## SLICE-P7G-06 — Newsletter-consent overlay + admin retention knobs (CAP-384 / 385 / 388 / 389)

- **CAP-IDs covered:** CAP-384, CAP-385, CAP-388, CAP-389
- **Source contract(s):** M14 R-NEWSLETTER / R-TILES-OPS / DEC-M14-CONFIG · inventory **global overlay** (Newsletter-consent modal CAP-384/385)
- **Depends on:** SLICE-P6-07 (first acquire is the single-ask trigger), SLICE-P3-07 (`/admin/config` typed forms — **knobs land as registry keys on that screen**, not a new route), SLICE-P1-06 (audit)
- **Scope:** **CAP-384:** global overlay; single ask **after first acquire only**; unchecked; trigger-based copy “No fixed schedule, no marketing”; unsubscribe live **before** capture. Writes `newsletterConsents`. **CAP-385:** unsubscribe terminal; never re-prompt; works pre-send. **CAP-388:** Admin edits retention/activation levers on `systemConfig` (1–2 humans act Tuesday without deploy; audit). Keys from M14 l.64 (quoted set) — **do not invent extra knobs**. **CAP-389:** Admin disables interest tile with **<5 published resources** via config, without deploy. Actor Administrator via existing config authz (CAP-394/395). Do not rebuild `/admin/config`.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`newsletterConsents` complete).
  - **[CODE — Phase 5 build]:** `convex/newsletter.ts`; overlay component (inventory: not a route); config registry seed for M14 keys; P3-07 namespace section.
- **Acceptance criteria:** CAP-384 Notes (quoted): “unchecked; trigger-based copy … unsubscribe live before capture.” CAP-385 Notes (quoted): “terminal; never re-prompt; works pre-send.” CAP-388 Notes (quoted): “1-2 humans act Tuesday without deploy; audit config changes.” CAP-389 Notes (quoted): “disable via config without deploy.”
- **Size check:** ≤2 days — overlay + two member mutations + registry keys on an existing console.

---

## Dependency graph (within 7-GROWTH)

1. **SLICE-P7G-01** (assertIndexable + gates) — after P4-13 + P7T-11; blocks 02/03
2. **SLICE-P7G-02** (JSON-LD FATAL-C1 + sitemap + slugs + post-edit) — after 01 + P4-04/15
3. **SLICE-P7G-03** (rel / OG / noindex family) — after 01; parallel with 02
4. **SLICE-P7G-04** (empty + visit/since) — after P6-03 + P5-03; parallel with SEO
5. **SLICE-P7G-05** (drip.release PRIMARY) — after P1-04/05 + P6-06; P7A-06 CAP-381 consumes
6. **SLICE-P7G-06** (newsletter + knobs) — after P6-07 + P3-07; parallel with 05

**CAP-057-class ownership line (indexability):** evaluator = **P7G-01**. Destinations 468/469 = **P7T-11**. Post-detail SSR shell = **P4-13** (noindex until flip). `/admin/seo` **view** = **P7O-07**. Override = **intentionally no CAP**.

**CAP-057-class ownership line (drip):** publisher cron = **P7G-05 CAP-380**. Supply alert = **P7A-06 CAP-381**. Do not merge.

**CAP-057-class ownership line (quota calendar):** **P6-07 CAP-376/377**. Not this catalog.

**CAP-057-class ownership line (empty-state helper):** **P7G-04**. P7T-01 / P6-03 consume.

**Phase 7-GROWTH exit gate:** (1) `assertIndexable` is the only index flip; Wave-2 pages stay noindex until 468 destinations render. (2) Tool JSON-LD never emits AggregateRating for n<3 humans or persona/staff/editorial. (3) Sitemap contains only indexable URLs. (4) `drip.release` runs hourly with launch floor 40; CAP-381 still the sole <14d Home alert. (5) Newsletter overlay is a global overlay, not a new inventory route. (6) No `convex/` files created by **this catalog session**.

---

## Flags carried forward (stated, not silent)

- **CAP-369/370 coach cards** — M14 remainder **not** in the SF-01 list; still unsliced unless a later firing takes them. Do not silently fold into P7G-04.
- **CAP-366 engage-bit** — still Phase-5 flag; not this list.
- **CAP-466 override** — intentionally no CAP.
- **F-37 activationProgress** — still OPEN; drip/visit do not invent the 7 bits.
- **E1 BetaBanner** — still OPEN; newsletter overlay must not steal its mount.

## Skipped / not sliced (explicit)

| ID | Why |
|---|---|
| CAP-376 / 377 | **P6-07** (already the DEC-S19 acquire path) |
| CAP-381 writer | **P7A-06** |
| CAP-468 / 469 pages | **P7T-11** |
| CAP-107 Wave-2 shell | **P4-13** |
| CAP-483 / 567 / 484 | **P7O-07 / P7A-06** |
| CAP-464 / 465 / 566 / 479 | **P2-08 / P7O-06** |
| Coach CAP-369/370 | Not in SF-01 list; remainder |
