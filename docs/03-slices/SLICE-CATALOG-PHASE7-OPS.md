# SLICE CATALOG — BUILD PHASE 7-OPS: ANALYTICS, RELIABILITY, UTM, SEO CONSOLES

**Date:** 2026-08-29 · **Phase order source:** AUDIT-FINAL.md Part D (corrected build order)
**Sub-batch:** 7-OPS — analytics / reliability / UTM / SEO **consoles**. **Not** the omitted 7-GROWTH batch — that file is `SLICE-CATALOG-PHASE7-GROWTH.md` (M17 engine + M14 retention). Slice IDs are `SLICE-P7O-*`. Prior Phase-7 catalogs: 7-ECON (`P7E`), 7-TRUST (`P7T`), 7-AdminCore (`P7A`), 7-GROWTH (`P7G`).
**Basis:** `CAPABILITY-REGISTER-MERGED.md` (572 rows) · `_data-model.md` (live 2026-08-29, including this firing’s `rawEvents` M16 deepen + `utmDictionary` [BIBLE-FIX] + P7O-08 `analyticsDeletionRequests` timestamps) · `OPEN-DECISIONS.md` (F-22 **ledgered this firing**; leftover CAP-334/453/454 sliced not ledgered) · `contracts/wave-7/CONTRACT-7-admin-analytics-FINAL.md` · `CONTRACT-7-admin-reliability-FINAL.md` · `CONTRACT-7-admin-utm-FINAL.md` · `CONTRACT-7-admin-seo-FINAL.md` · `RECONCILIATION-7D.md` · `M16-analytics.md` · `M17-growth-seo.md` · `M18-reliability.md` · AUDIT-FINAL F-22 · Phase 1 P1-04 / P1-07 · Phase 2 P2-08 · Phase 3 P3-01/03/08 · Phase 7-ECON P7E-01 (`signalLedger`) · Phase 7-TRUST P7T-01 (CAP-568) / P7T-12 (F-14) / P7T-13 (`consentRecords`; OQ#3 fence) · Phase 7-AdminCore P7A-06 (CAP-484 **and CAP-334**) / P7A-10 (`platformHealth` schema)
**Tagging (this firing):**
- **`[BIBLE-FIX — apply now]`** — a `_data-model.md` edit this slice’s own description requires. Apply in the same session as the catalog. Do **not** park it as “described in the catalog.”
- **`[CODE — Phase 5 build]`** — anything requiring actual files. Describe fully. **Do not create the file in this catalog session.**
**Sizing-rule addendum applied:** every cited bullet checked for ellipsis/`{…}`/"see X"/"as before" incompleteness. **Catches this firing (applied now):** (1) bible `rawEvents` M16 deepen l.271 was still `…` while analytics crons Read it — transcribed `M16-analytics.md` l.91 + §7 `tombstoneState` (does **not** delete the M12 l.121 envelope; schema unions). (2) bible `utmDictionary` l.286 used a “campaign/content formats” shape note — replaced with `campaignFormat` · `contentFormat` · `updatedAt` from `M17-growth-seo.md` l.75. (3) `analyticsWeeklyDecisions` gained sheet `createdAt` (M16 l.96). **Already complete, consume:** `seoHealth` (incl. `thinIndexedCount`/`heldIndexedCount`); `jobCatalog` / `jobRuns` / `jobDeadLetters` (P1-04); `eventCatalog` (P1-07); `analyticsProjections`; `platformHealth` (7-AdminCore). **True ellipsis this firing cites but does not steal:** `consentRecords` l.305 still `…` — P7T-13 (filling it unblocks CMP 504–506 **only**, not CAP-453/454). **Catch this firing (P7O-08):** bible `analyticsDeletionRequests` gained M16 l.97 timestamps. **Not this batch:** `subIdRegistry` (M11 storefront; no CAP on these four screens). **M16 `sampleStatus`:** only `directional` is named (CAP-449); do not invent a full enum.
**Phase boundary (this firing only):** `/admin/analytics` · `/admin/reliability` · `/admin/utm` · `/admin/seo` · **plus P7O-08** (M16 analytics erasure mutations; no new inventory route) · **plus P7O-09** (client observational emit helper; no new route). **Consume, do not redefine:** P1-04 jobs spine · P1-07 `rawEvents`/`eventCatalog` capture helper · P2-08 landing UTM capture (CAP-464/465) · P3-08 CAP-460 PostHog hide-dash · P7A-06 CAP-484 seoHealth→Home alert writer **and CAP-334 throttle** (AdminCore, not this console) · P7A-10 `platformHealth` schema · P7T-01 CAP-568 `notifications.list`. **Not this firing:** CAP-502 OOB watchdog (deliberately not a Convex screen) · CAP-466 `assertIndexable` override · sitemap regenerate · landing rebuild · `/admin/home` intervention ack · **CAP-506 auto-wire** of vendor delete (CMP OQ#3 — P7T-13 fence). **CAP-334 is not 7-OPS** (register **M13** → P7A-06).

---

## Extra-scrutiny confirmations (verify-before-assuming)

### V1. F-22 — STILL OPEN; was missing from OPEN-DECISIONS (ledger drift, now closed)

**AUDIT-FINAL F-22 (VERIFIED, BAS):** “`jobRuns` manual_review (CAP-495/515) has no action surface; redrive-vs-RC-4 semantics unstated (‘legal restore · money · sanction…’).” Reliability contract OQ#1 / OQ#2 are the same finding.

**OPEN-DECISIONS.md before this firing:** **no F-22 row.** Not resolved — never migrated from the audit into the founder ledger.

**This firing:** F-22 is **ledgered as OPEN** (same session). Slice what **can** be built: dead-letter + job **list/status** (including `manual_review` as a **visible state**, not an action). CAP-500 redrive **is specified** for ordinary exhausted-retry dead-letters (stamp `redrivenAt`/`redrivenByUserId`, re-queue, revalidate authz/STOP/target). **Fence:** do **not** redrive `retryClass=manual_only` or `jobRunState=manual_review` — **reject fail-closed** until F-22 names whether that is permitted. Do **not** invent a “approve/release from manual_review” mutation (no CAP).

### V2. Phase 1 consume — do not re-derive

| Substrate | Owner | This batch |
|---|---|---|
| `jobCatalog` / `jobRuns` / `jobDeadLetters` + `jobRunState` incl. `manual_review` + `retryClass` incl. `manual_only` | **P1-04** | Read/write **rows**; do not redesign tables or re-copy enums |
| `rawEvents` / `eventCatalog` + `assertCatalogEvent` / same-mutation capture | **P1-07** | Crons **read** via `effectiveCountable` (CAP-440). Bible M16 deepen filled **this firing**; schema union with l.121 is still P1-07’s Phase-5 job plus any additive columns from the deepen |
| Rate limit CAP-019 (60/1m) on redrive | **P1-09** | Wrap CAP-500; do not invent a second limiter |

### V3. CAP-568 on the user’s `/admin/seo` list — **(a)**, not this screen

Register CAP-568 = M14 `notifications.list` (member). SEO contract primary CAP-IDs = **483, 484, 567**. Screen inventory `/admin/seo` matches that. CAP-568 is **P7T-01**. Same class as CAP-535 on support: firing-list adjacency (7D generalization check mentioned both gaps in one paragraph), not inventory drift. **Do not re-slice.**

### V4. CAP-464 / 465 — landing, already P2-08

`/admin/utm` is CAP-479 generate + CAP-566 dictionary seed/edit. First-touch capture stays on `/` (P2-08). P7T-12 wires waitlist CTA; it does not rebuild UTM capture. **Consume.**

### V5. CAP-484 — already P7A-06

SEO **view** is CAP-567; **GSC pull** is CAP-483. CAP-484 writes `adminInterventionAlerts` rendered on Home. **Do not insert a second stale-seo alerter.**

### V6. Bible sweep (entities this sub-batch touches)

| Entity | Status | Action |
|---|---|---|
| `seoHealth` | Complete (7D E3 thin/held) | Consume |
| `utmDictionary` | Shape note → **filled this firing** from M17 l.75 | [BIBLE-FIX] applied |
| `rawEvents` M16 deepen | `…` → **filled this firing** from M16 l.91 | [BIBLE-FIX] applied; l.121 M12 envelope kept |
| `jobRuns` / `jobCatalog` / `jobDeadLetters` | Complete (P1-04) | Consume |
| `platformHealth` | Complete (7-AdminCore) | Consume |
| `analyticsProjections` / `eventCatalog` | Complete | Consume; projections **schema** is [CODE] this batch if P1-07 did not add the M16 projection tables |
| `analyticsWeeklyDecisions` | `createdAt` added this firing | [BIBLE-FIX] applied |
| `consentRecords` | Still `…` | P7T-13; do not steal. Filling it unblocks CMP **504–506 only**, **not** CAP-453/454 |
| `analyticsDeletionRequests` | Status enum was present; timestamps from M16 l.97 **filled this firing (P7O-08)** | [BIBLE-FIX] applied |
| `subIdRegistry` | Complete on M11; **not cited** by these four screens | Ignore |
| `sampleStatus` | Only `directional` named | Do not invent a full enum |

---

## SLICE-P7O-01 — Widget catalog grow: four 7-OPS routes (CAP-569 extension)

- **CAP-IDs covered:** CAP-569 (grow-per-phase seeder)
- **Source contract(s):** P3-03 · four screen contracts §1
- **Depends on:** SLICE-P3-03, SLICE-P3-01
- **Scope:** Register `/admin/analytics` (Founder/Admin · CAP-463; CAP-452 Founder-only is an **intra-screen** narrow gate, not a widget hide), `/admin/reliability` (Founder/Admin · CAP-500), `/admin/utm` (Founder/Admin generate · administrator dictionary), `/admin/seo` (administrator · CAP-567). `dataSourceKey` literals **only** for this firing’s named queries. Do not re-seed prior consoles.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none.
  - **[CODE — Phase 5 build]:** `convex/admin/widgetsCatalog.ts` (four rows).
- **Acceptance criteria:** P3-03 grow-per-phase. Hidden/unregistered → FEATURE_DISABLED/NOT_FOUND. `support_operator` does not see these four.
- **Size check:** ≤2 days — four metadata rows.

## SLICE-P7O-02 — `/admin/analytics` founder dashboard (CAP-463 / 449 / 451 / 452 / 458 / 459 + fold-in render)

- **CAP-IDs covered:** CAP-463, CAP-449, CAP-451, CAP-452, CAP-458, CAP-459; **fold-in render** CAP-439 (recalculating), CAP-440 (cards depend), CAP-443 (reconcile status visible), CAP-461 (activation annotation). **CAP-460 consume** (P3-08 hide dash). **CAP-434 consume** (staff exclusion already on users).
- **Source contract(s):** analytics contract §1–§4, §3 A–J · M16 R-L08-CORE / R-CONFIDENCE / R-SIGNAL-CARD
- **Depends on:** SLICE-P7O-01, SLICE-P3-01/02, SLICE-P7O-03 (empty/recalculating honest until crons land — ship against fixtures), SLICE-P7E-01 (`signalLedger` for 451), SLICE-P3-08 (CAP-460)
- **Scope:** Query `analytics.founderDashboard`. **Seven cards** = L08 + S18 + Activation + Library/Affiliate/Store commerce + Signal (contract OQ#2 arithmetic; use that set; stop-and-report if a named eighth exists). Always render rates as `n% (x/y)`; denom **< 25 → sampleStatus=directional**; suppress trend arrows + drop alerts (no M16 drop-alert CAP exists — OQ#6 — suppressing a non-existent alert is a no-op). Freshness complete/partial/stale/**recalculating** visible; lastCalculatedAt + definitionVersion visible. L08 incomplete → **"cohort incomplete"**, not a fake zero cliff. Signal card: totals/trends/broad category **only** — never event-weight-resolvable breakdown (sealed keys stay sealed). CAP-452 **Founder only** (≤3 highlighted actions; persist metricSnapshots + projectionDefinitionVersion + catalogVersion + `createdAt`). Administrator may **view**, not record. **P0 decisions must not use PostHog counts.** If CAP-460 mirror-disabled, hide PostHog-derived chrome; Convex cards remain. CAP-443 untrusted → label PostHog viz untrusted; Convex still authoritative. **Fence CAP-455** (F-23 / analytics OQ#4): may **read** `instrumentationIncidents` onto this host as a status strip; do **not** invent a Home intervention or a new CAP. **Fence OQ#7** weekly-decision edit/delete — append-only (M16 §7: recorded). No rawEvents emit from this screen.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none remaining (`analyticsWeeklyDecisions.createdAt` already applied this firing).
  - **[CODE — Phase 5 build]:** `convex/schema.ts` (`analyticsProjections`, `analyticsWeeklyDecisions`, `analyticsReconcileResults`, `instrumentationIncidents` if not present); `convex/admin/analytics.ts`; `app/admin/analytics/`; A2 charts gap — stats cards + honest labels, do not invent a new kit name.
- **Acceptance criteria:** CAP-463 (quoted): “7 cards; lastCalculatedAt + definitionVersion + freshness visible; P0 decisions must not use PostHog counts.” CAP-449 (quoted): “Always `n% (x/y)`; if denom < 25 → sampleStatus=directional.” CAP-459 (quoted): “Labeled ‘cohort incomplete’; not zero-catastrophe.” CAP-451 (quoted): “Totals/trends/broad category only — never event-weight-resolvable breakdown.” CAP-452 (quoted): “Stores metricSnapshots + projectionDefinitionVersion + catalogVersion.” Actor: administrator record-weekly **rejected**.
- **Size check:** ≤2 days — one dashboard query + one Founder mutation + seven cards over cron tables. A2 gap is fenced to cards, not a chart library.

## SLICE-P7O-03 — Analytics projection crons + effectiveCountable (CAP-445 / 446 / 447 / 448 / 439 / 440 / 443)

- **CAP-IDs covered:** CAP-445, CAP-446, CAP-447, CAP-448, CAP-439, CAP-440, CAP-443 · CAP-457 *(added 2026-09-04 — orphan disposition: dual-browser-login detection event writer; surfaces as an instrumentation-health anomaly, not a security block)*
- **Source contract(s):** analytics contract §3 D–G · M16 R-L08-CORE / R-EFFECTIVE-ELIG / R-MIRROR · FATAL-M16-01
- **Depends on:** SLICE-P1-07 (capture + catalog), SLICE-P1-04 (schedule `internal.*` only), users.isStaff, P6-07 acquire stamps (CAP-462 **consume** — do not rebuild acquire)
- **Scope:** Define `analyticsEligibilityAdjustments` in schema from the **already-complete** bible bullet. Implement `effectiveCountable` (CAP-440, quoted formula): `isCountableAtWrite ∧ tombstoneState=active ∧ not invalid/reversed/detached/excluded`. CAP-439: source events append adjustments; **never rewrite rawEvents**; mark projections `freshness=recalculating`. Four projection crons write `analyticsProjections` only: L08 core 7 ordered stages (windows verbatim: impression→signup **7d** · signup→first_action **7d** · signup→acquire **14d** · acquire→day7 **30d**; affiliate optional/branch); S18 staff-excluded; Activation inlines catalog size / median age / adds-in-period / category coverage (cannot backfill CAP-462 stamps); Commerce three funnels **never merge**, every conversion labeled `conversionType`. CAP-443 daily reconcile writes `analyticsReconcileResults`; diff > max(5, 2%) → incident + untrusted (dash already renders). **Do not redefine `rawEvents` or `eventCatalog`.** Unknown prod events → CAP-455 incident rows (writer here or thin helper; **UI** stays P7O-02 strip / F-23 fence).
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** `_data-model.md` `rawEvents` M16 deepen — **already applied 2026-08-29 this firing**. Do not re-transcribe. If still `…`, re-apply from M16 l.91, do not invent. **Do not edit l.121.**
  - **[CODE — Phase 5 build]:** `convex/schema.ts` (eligibility adjustments + projections); `convex/analytics/projections.ts`; `convex/crons.ts` (`internal.*` jobKeys).
- **Acceptance criteria:** CAP-440 (quoted): “effectiveCountable = isCountableAtWrite ∧ tombstoneState=active ∧ not invalid/reversed/detached/excluded.” CAP-439 (quoted): “Never rewrite rawEvents; mark projections dirty (recalculating).” CAP-445 (quoted windows). CAP-448 (quoted): “Three funnels never merge.” CAP-446 (quoted): “Staff excluded.” M16 AC (quoted): “Given countable acquire later clawed back, When adjust+rebuild, Then removed from L08/S18 **without** mutating rawEvents row.”
- **Size check:** ≤2 days — shared eligibility helper + four cron writers. If H-SIM-scale join work appears, split L08/S18 from commerce — flagged, not pre-split.

## SLICE-P7O-04 — `/admin/reliability` job + dead-letter list + liveness (CAP-499 / 501 / 503)

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #5:** RC-4/`manual_review` rows get two admin actions — Approve & Retry (single idempotent re-run, logged) and Cancel (permanent fail + compensating cleanup, logged). Both admin-auth + auditLog. No auto-escalation, no SLA timers (MVP).

- **CAP-IDs covered:** CAP-499, CAP-501, CAP-503; **read** `jobRuns` including `manual_review` (no action)
- **Source contract(s):** reliability contract §3 A/C/D/E/F · M18 R-LIVENESS / FATAL-M18-03 · INV-M18-5
- **Depends on:** SLICE-P7O-01, SLICE-P1-04 (schema — **consume**), SLICE-P7A-10 (`platformHealth` schema — **consume**), SLICE-P3-04 (A1)
- **Scope:** Paginated dead-letter list (`jobDeadLetters`) + job-run status (states from Core-enums `jobRunState`, **including `manual_review` as display**). CAP-499: exhausted retries → insert `jobDeadLetters` — **never silent drop**. CAP-501: 5m `health.probe` writes `platformHealth` / probes; liveness from `lastSuccessAt` **not** lastStatus; stale = interval×1.5 (7.5m at 5m interval); dead = ×3 (15m) + alert; never_ran. CAP-503: heartbeat **>15m → "—"** (unavailable ≠ zero). **Do not collapse** the 7.5m system-health threshold with the 15m UI TTL (contract §3 E). **Do not** implement redrive here (P7O-05). **Do not** invent cancel/terminate/delete (no CAP). **Fence OQ#7 / F-23:** CAP-512/514/519/522 have no inventory placement — do not fold a second console; probe/liveness already covers 522’s stale/dead. CAP-502 OOB watchdog is **not** this screen.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`jobRuns` / `platformHealth` complete). Reliability OQ#3 (“state enum unenumerated in bible”) is **closed by P1-04** — consume Core-enums `jobRunState`.
  - **[CODE — Phase 5 build]:** `convex/admin/reliability.ts` (list queries); `convex/health/probe.ts`; `crons.ts` 5m probe; `app/admin/reliability/` A1 table + health dots (STYLE-KIT status dot exists — F-25; use it).
- **Acceptance criteria:** CAP-499 (quoted): “Never silent drop.” CAP-501 (quoted): “Liveness not lastStatus; if now > lastSuccessAt + interval×1.5 → stale; ×3 → dead + alert; never ran → never_ran.” CAP-503 (quoted): “M15 shows ‘—’.” `manual_review` rows **visible**, with **no** action button (F-22).
- **Size check:** ≤2 days — two paginated queries + one probe cron + A1. Redrive is the next slice.

## SLICE-P7O-05 — Dead-letter redrive (CAP-500) — F-22 fence on RC-4 / manual_review

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #5:** redrive stays rejected for RC-4/manual classes, but the P7O-04 disposition actions (Approve & Retry / Cancel) are the sanctioned recovery path — no longer a dead end.

- **CAP-IDs covered:** CAP-500; **CAP-518 consume** (STOP wins); **CAP-019** rate wrap
- **Source contract(s):** reliability contract §1, §3 B, §4 · CAP-500 Notes · F-22 / OQ#1
- **Depends on:** SLICE-P7O-04, SLICE-P3-08 (STOP), SLICE-P1-09 (CAP-019), SLICE-P1-04 (`retryClass` / `executionAuthority`)
- **Scope:** `jobs.redriveDeadLetter` for **ordinary** exhausted-retry dead-letters: stamp `redrivenAt` + `redrivenByUserId`; re-queue `jobRuns`; **revalidate current actor authz + STOP + target state + execution authorization at action time** (redrive does **not** imply the original actor remains authorized). Authorized-command consumed once — reuse rejected. CAP-019 60/1m. **F-22 fence (fail-closed, quoted RC-4):** if the parent `jobCatalog.retryClass=manual_only` **or** the source `jobRuns.state=manual_review`, **reject** — do not reset attempt count, do not silently retry. No “approve manual_review” control. **Fence OQ#4** runbook-completion enforcement — if no wiki slug exists, do not invent a boolean; readiness already treats “runbook required” as a GATE input (P7A-10). **Fence OQ#5** failed-redrive (new DL vs update) — stop-and-report if a named behavior appears nowhere; v1: failed redrive does not delete the original DL row. **Fence OQ#6** — no `auditLog` unless a later founder call says so (row is self-attributing).
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none.
  - **[CODE — Phase 5 build]:** `convex/admin/jobsRedrive.ts`; confirm modal on P7O-04 table; **disabled/reject** on RC-4 and `manual_review` rows.
- **Acceptance criteria:** CAP-500 (quoted): “Redrive runbook required before open beta.” Contract §1 (quoted): “Redrive must revalidate current actor authz + STOP + target state.” CAP-515/RC-4 (quoted): “legal restore · money · sanction · final publish · permanent termination; not reusable silent-repeat.” F-22: those classes **cannot** be redriven by this slice. Ordinary DL redrive stamps the two bible fields and creates a new scheduled run (`internal.*`).
- **Size check:** ≤2 days — one mutation + confirm + two reject tests. The fence is what keeps F-22 from being silently “solved.”

## SLICE-P7O-06 — `/admin/utm` dictionary + generator (CAP-566 / 479) — CAP-464/465 consume

- **CAP-IDs covered:** CAP-566, CAP-479; **CAP-464 / CAP-465 consume (P2-08)**
- **Source contract(s):** UTM contract §1–§4 (E1/E-route closed) · DEC-M17-UTM
- **Depends on:** SLICE-P7O-01, SLICE-P2-08 (`utmDictionary` table exists), SLICE-P3-01
- **Scope:** `utm.dictionary.seedEdit` writes versioned `allowedSources[]` / `allowedMediums[]` / `campaignFormat` / `contentFormat` (bible fields **this firing**). `utm.builder.generate` is **read-only** — dropdowns from dictionary, maxLen 80, no persistence, no first-touch write. Empty dictionary = disabled dropdowns + guidance (States B), not an error. Must not allow arbitrary parameter names. **Do not rebuild landing or CAP-465.** Copy-to-clipboard is client-only (OQ#4 — toast available-not-prescribed). **Fence OQ#5/#6** field-requiredness / link history — not built.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** `_data-model.md` `utmDictionary` — **already applied 2026-08-29 this firing** (M17 l.75). Do not invent format grammars.
  - **[CODE — Phase 5 build]:** `convex/admin/utm.ts`; `app/admin/utm/`.
- **Acceptance criteria:** CAP-566 (quoted): “Seeds and edits valid source/medium/campaign values; versioned per DEC-M17-UTM.” CAP-479 (quoted): “Dropdown generate links.” CAP-465 remains landing-only (quoted): “Validate vs dictionary; store first-touch once.” Generate Writes = none.
- **Size check:** ≤2 days — one seed/edit mutation + one pure generator.

## SLICE-P7O-07 — `/admin/seo` health view + GSC pull (CAP-567 / 483) — CAP-484 consume; CAP-568 is P7T-01

- **CAP-IDs covered:** CAP-567, CAP-483; **CAP-484 consume (P7A-06)**
- **Source contract(s):** SEO contract §1–§4 (E3/E4 closed)
- **Depends on:** SLICE-P7O-01, SLICE-P3-01, SLICE-P7A-06 (stale→Home alert already), `seoHealth` bible (complete)
- **Scope:** `seo.health.view` reads `seoHealth` (all eight fields including thin/held). Unavailable metrics **"—"**, not zero. Never-pulled / GSC-not-connected (OQ#3) = **"—"** / unspecified copy — **not** healthy zeroes. CAP-483 weekly GSC pull (“Optional API”) writes `seoHealth`; if the API is unconfigured, do not invent counts. **Cannot** override `assertIndexable` (CAP-466). No on-screen mutation. Ack/resolve/snooze stay on Home. **CAP-568 is not this screen** (V3). **Do not duplicate CAP-484.**
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`seoHealth` complete).
  - **[CODE — Phase 5 build]:** `convex/admin/seo.ts`; `convex/seo/gscPull.ts`; `app/admin/seo/`.
- **Acceptance criteria:** CAP-567 (quoted): “Render-only; cannot override `assertIndexable`.” CAP-483 (quoted): “Optional API.” Contract §3 F (quoted): “Unavailable metric rendered as ‘—’, not zero.” Absence of GSC must not become zero coverage errors / healthy status (contract §5).
- **Size check:** ≤2 days — one query + one optional cron + four stat cards.

## SLICE-P7O-08 — Analytics subject erasure (CAP-453 / 454) — XS; CMP OQ#3 not wired

- **CAP-IDs covered:** CAP-453, CAP-454
- **Source contract(s):** register CAP-453/454 · `M16-analytics.md` l.97 + §7 deletion-request lifecycle · R-POSTHOG-ID · `CONTRACT-7-cmp-FINAL.md` OQ#3 (fence only)
- **Depends on:** SLICE-P1-07 (`rawEvents` tombstone + `analyticsSubjectId`), SLICE-P7O-03 (`effectiveCountable` / `detach_identity` adjustment helper — consume, do not fork), users.analyticsSubjectId
- **Scope:** Member `analytics.erasure.request` (CAP-453) writes `analyticsDeletionRequests` (`status=requested`, `requestedAt`) and identity-detaches the subject’s `rawEvents` (register Writes: tombstone/identity-detach). Prefer P7O-03’s `detach_identity` adjustment so projections rebuild without a second eraser; stamp `tombstoneState` only as the register requires — if both would double-count, **stop-and-report** rather than apply twice. System `analytics.erasure.confirm` (CAP-454) marks `confirmed` / `confirmedAt` when PostHog person-delete completes (webhook or internal job). Failed submit → `failed`/`retrying` + `lastError?`. **Quoted:** erasure does **not** reduce historical aggregate counts. Incomplete until PostHog confirmed. **Distinct from** P5-06 CAP-151 (profile attribute detach) and P7T-06 CAP-350 (legal-intake PII anonymize — never delete strikes/audit/legalIntake). **Do not call from P7T-13 CAP-506** (CMP OQ#3: wired vs parallel unspecified). **Do not invent a screen:** Has-UI=YES has **no** inventory row (settings/CMP/legal already list other erasure CAPs). Export the member mutation; no new route. Do not attach the button to `/legal/intake` or `/settings/profile` in this slice (would invent placement). PostHog SDK call is `[CODE]` behind an env flag; unconfigured vendor → request row stays `requested`/`failed`, never fake-`confirmed`.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** `_data-model.md` `analyticsDeletionRequests` timestamps — **applied 2026-08-29 this firing** from M16 l.97. **Do not** fill `consentRecords` (P7T-13).
  - **[CODE — Phase 5 build]:** `convex/schema.ts` (`analyticsDeletionRequests`); `convex/analytics/erasure.ts` (`analytics.erasure.request`, `analytics.erasure.confirm` as `internal.*` or webhook action); optional `convex/http.ts` PostHog confirm path. **No** `app/` route.
- **Acceptance criteria:** CAP-453 (quoted): “Detach identity + vendor delete; incomplete until PostHog confirmed.” CAP-454 (quoted): “Erasure does NOT reduce historical aggregate counts.” M16 §7 (quoted lifecycle): requested → submitted → confirmed | failed → retrying → confirmed. P7T-13 withdraw still does **not** write this table until OQ#3 is decided. CAP-350 / CAP-151 paths unchanged.
- **Size check:** XS — one table + two mutations + consume existing detach helper. Vendor HTTP is a thin action. Missing inventory button is F-23-class placement, not a founder blocker for the machine.

## SLICE-P7O-09 — Client observational emit (CAP-444) + forged-name reject (CAP-456)

- **CAP-IDs covered:** CAP-444, CAP-456
- **Source contract(s):** `M16-analytics.md` R-CLIENT-OBS · register CAP-444 / CAP-456 · P1-07 `assertCatalogEvent`
- **Depends on:** SLICE-P1-07 (`eventCatalog` + capture helper — **extend**, do not fork), SLICE-P7T-13 (`consentRecords` / CMP purposes — **fail-closed if consent machinery absent**; do not steal `consentRecords` fill)
- **Scope:** Member client helper `analytics.clientEmit` (name in-slice, flagged): accept **only** when catalog row is `status=active` **and** `captureMode` allows client **and** `consentGate` is satisfied for the session. Writes `rawEvents` via the P1-07 helper (same-mutation discipline). **Never** creates acquire / download / Signal / mod / sale / quota (quoted precedence). **CAP-456:** client emit of a `server_authoritative` event name → **reject + log**; do not persist. **No new inventory route** (Has-UI=YES, no screen row — same class as P7O-08). Consent default-deny until CMP grant. Do not call this from authoritative product mutations (those stay CAP-436).
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`eventCatalog` complete).
  - **[CODE — Phase 5 build]:** `convex/analytics/clientEmit.ts`; client helper used by existing screens; **no** `app/` route.
- **Acceptance criteria:** CAP-444 Notes (quoted): “Catalog active + captureMode allows client + consentGate; never creates acquire/download/Signal/mod/sale/quota.” CAP-456 Notes (quoted): “Reject; log.” R-CLIENT-OBS (quoted): “Accept only observational; reject client emit of server_authoritative names.” A test that records a click as a conversion or a `resource.acquire` from this helper **fails this slice**.
- **Size check:** XS — one public action wrapping P1-07 + consent check + one reject path.

---

## Dependency graph (within 7-OPS)

1. **SLICE-P7O-01** (widgets) — after P3-03
2. **SLICE-P7O-03** (projection crons) — after P1-07 (+ this firing’s rawEvents deepen in schema); parallel with 04/06/07
3. **SLICE-P7O-02** (analytics UI) — after 01 + 03 (or fixtures)
4. **SLICE-P7O-04** (reliability list + probe) — after 01 + P1-04 + P7A-10; parallel with 02/03
5. **SLICE-P7O-05** (redrive + F-22 fence) — after 04
6. **SLICE-P7O-06** (utm) — after 01 + P2-08; parallel
7. **SLICE-P7O-07** (seo) — after 01 + P7A-06; parallel
8. **SLICE-P7O-08** (analytics erasure 453/454) — after P1-07 + P7O-03; **not** after P7T-13; never called by CAP-506 until OQ#3
9. **SLICE-P7O-09** (client observational emit 444/456) — after P1-07 + P7T-13; parallel with 08

**CAP-057-class ownership line (jobs schema):** P1-04 owns tables/enums. This batch owns **console + probe + fenced redrive**.

**CAP-057-class ownership line (events schema):** P1-07 owns capture. This batch owns **projections + dash**. Bible M16 deepen applied this firing — additive columns only.

**CAP-057-class ownership line (UTM write):** dictionary = **P7O-06 CAP-566**. Capture = **P2-08 CAP-465**. Generate = **P7O-06 CAP-479** (no write).

**CAP-057-class ownership line (SEO alert):** writer = **P7A-06 CAP-484**. View = **P7O-07 CAP-567**. Pull = **P7O-07 CAP-483**.

**CAP-057-class ownership line (notifications list):** **P7T-01 CAP-568**. Not `/admin/seo`.

**CAP-057-class ownership line (analytics erasure):** **P7O-08** CAP-453/454. Distinct from P5-06 CAP-151 and P7T-06 CAP-350. CMP CAP-506 must **not** call it until OQ#3.

**CAP-057-class ownership line (queue>500 throttle):** **P7A-06 CAP-334** (M13). Not this catalog.

**CAP-057-class ownership line (client observational emit):** **P7O-09** CAP-444/456. Distinct from P1-07 authoritative CAP-436. Never creates domain outcomes.

**Phase 7-OPS exit gate (this sub-batch):** (1) Founder dash shows seven Convex-authoritative cards with freshness + `n% (x/y)`; administrator cannot record weekly decisions; PostHog counts are not P0. (2) Reliability lists dead-letters and job states including `manual_review` with **no** action on those rows; probe dots use liveness; ordinary DL redrive works; RC-4/`manual_review` redrive **rejects**. (3) `/admin/utm` dropdowns seed from CAP-566; generate writes nothing; landing capture unchanged. (4) `/admin/seo` is render-only over real `seoHealth` fields; "—" not 0; CAP-484 not duplicated. (5) CAP-453/454 mutations exist; CAP-506 does not call them; no invented erasure screen. (6) CAP-444 client emit is consent-gated and cannot mint acquire/Signal/mod; CAP-456 rejects forged server_authoritative names. (7) No `convex/` files created by **this catalog session**. (8) F-22 is on OPEN-DECISIONS as OPEN. CAP-334 is **not** an open leftover (P7A-06).

---

## Flags carried forward (stated, not silent)

- **F-22** — OPEN (ledgered 2026-08-29 this firing). P7O-05 fail-closed fence is not a resolution.
- **Reliability OQ#4/#5/#6** — runbook enforcement, failed-redrive shape, auditLog-on-redrive. Fenced.
- **Analytics OQ#1/#4/#6/#7** — CAP-460/443 wiring (partially consumed), CAP-455 placement (F-23), drop-alert CAP missing, weekly-decision supersession. Fenced.
- **SEO OQ#3/#5/#6** — GSC-not-connected copy, cadence config home, thin vs held severity. Fenced ("—" not 0).
- **UTM OQ#3–#6** — Actor understatement, copy pattern, field requiredness, no history.
- **`consentRecords` `…`** — P7T-13. Filling it does **not** unblock CAP-453/454.
- **CAP-453/454** — **sliced P7O-08**. CMP OQ#3 (506 wire) remains fenced on P7T-13; not a new F-row.
- **CAP-444 / 456** — **sliced P7O-09**. Not a Founder dash card.
- **CAP-334** — **P7A-06** (M13). Not 7-OPS.
- **CAP-502** — OOB watchdog, not this screen.
- **CAP-512/514/519/522** — F-23 placement; not a second console.
- **F-14** — P7T-12 is the close **when built**; not this batch.
- **E1 / E4 / E5 / E6 / F-16 / F-33 / F-34–F-38 / FUTURE-* / FOUNDER-DECISION-M7-01** — see ledger pass below.

---

## Skipped / not sliced (explicit)

| ID | Why |
|---|---|
| CAP-464 / 465 | P2-08 |
| CAP-568 | P7T-01 (`/notifications`) |
| CAP-484 writer | P7A-06 |
| CAP-390 / 569 substrate | P3-01 / P3-03 |
| CAP-460 setter UI | P3-08 |
| CAP-434 | Constraint; users.isStaff already exists |
| CAP-462 | P6-07 acquire stamp |
| CAP-466 override | Intentionally no CAP |
| CAP-502 | OOB, not Convex UI |
| CAP-495 / 515 **action** | F-22; display only in P7O-04 |
| job schema / eventCatalog schema | P1-04 / P1-07 |
| `subIdRegistry` | M11; not these screens |
| CAP-334 | P7A-06 (M13; not this catalog) |
| CAP-444 / 456 | **P7O-09** (this firing; no new route) |

---

## OPEN-DECISIONS status pass (2026-08-29 — slice-decomposition close)

Verified against the live ledger + AUDIT-FINAL. **No silent closes.**

### Still OPEN on the ledger (accurate)

| ID | Status check |
|---|---|
| **E1** | Still OPEN — BetaBanner ungoverned. Unchanged. |
| **E4** | Still OPEN — skip-then-stranded. Unchanged. |
| **E5** | Still OPEN — `/terms` vs CAP-027 trigger. Unchanged. |
| **E6** | Still OPEN — legal content source/publish (audit **F-16**). Unchanged. |
| **FUTURE-M2-01** | Still OPEN (tracked future). Unchanged. |
| **FOUNDER-DECISION-M7-01** | Still OPEN — OTP vendor. Unchanged. |
| **FUTURE-M7-01** | Still OPEN (tracked future). Unchanged. |
| **FUTURE-M11-01** | Still OPEN (tracked future). Unchanged. |
| **F-34** | Still OPEN — eligibility-state routing. Unchanged. |
| **F-35** | Still OPEN — `policyFamily` enum. Unchanged (7-OPS does not need literals). |
| **F-36** | Still OPEN — dual waitlist surfaces. P7T-12 closes **F-14** (landing→CAP-014) when built; it does **not** merge `/signin` vs `/waitlist`. Unchanged. |
| **F-37** | Still OPEN — `activationProgress` 7 bits. Unchanged. |
| **F-38** | Still OPEN — support-scoped inbox. Unchanged. |
| **F-22** | **Was missing from the ledger; still OPEN in AUDIT-FINAL.** **Added this firing** (see `OPEN-DECISIONS.md`). |

### Resolved / aliased (do not reopen)

| ID | Current home |
|---|---|
| **E2 / X1 / E3 / X2** | Archived (CMP slot; bootstrap routing / F-15; waitlistEntries / **F-13**). |
| **F-13** | RESOLVED via X2 (2026-08-29 bible). |
| **F-15** | RESOLVED (Platform-Wide Routing Convention). |
| **F-18** field list | Bible filled 2026-08-29; mute/clear still no CAP (notifications OQ). |
| **F-19** enums | `caseType`/`status` + `jobRunState` bible-filled; **F-35** is the `policyFamily` remainder. Reliability OQ#3 closed. |
| **F-21** | Sliced P3-03 / CAP-569 (not a founder-open row). |
| **F-14** | No ledger row (same class as F-33). **Sliced** P7T-12; still OPEN until Phase-5 build. Not 7-OPS. |
| **F-16** | = ledger **E6** (+ E5). Not a duplicate F-row. |
| **F-17** | = ledger **E1**. |
| **F-33** | No ledger row; fenced in P7T-05/06. Still OPEN as audit BAS. |

W2-E3 archive note (My Drafts = own screen vs filter) remains a sub-question inside a resolved escalation — not promoted.

---

## Sizing-addendum results (this firing)

| Source | Result |
|---|---|
| `rawEvents` l.271 `…` | **Caught + applied** from M16 l.91; l.121 kept |
| `utmDictionary` shape note | **Caught + applied** from M17 l.75 |
| `analyticsWeeklyDecisions` missing `createdAt` | **Caught + applied** from M16 l.96 |
| `seoHealth` | Already complete |
| `jobRuns` state enum | Already complete (P1-04); contract OQ#3 stale |
| `consentRecords` | Left for P7T-13 (does **not** unblock CAP-453/454) |
| `analyticsDeletionRequests` timestamps | **Caught + applied** from M16 l.97 (P7O-08) |
| `subIdRegistry` | Not in scope |
| F-22 | OPEN; was unledgered; **now on OPEN-DECISIONS** |
| CAP-334 leftover | Not 7-OPS; **P7A-06** (M13) |
| CAP-453/454 leftover | **Sliced P7O-08**; CMP OQ#3 still fenced on P7T-13; no F-row |
| CAP-568 on SEO firing list | P7T-01; not orphaned |

---

## SLICE-P7-CLEANUP — Legacy retirement + canonical tightening (00-TRANSITION closeout)

- **CAP-IDs covered:** none directly (cleanup substrate for the whole register)
- **Source contract(s):** N/A — infra-only (source: `PRD/00-project-status/00-TRANSITION.md` — the RESET/strangler decision, founder-approved 2026-09-04)
- **Depends on:** ALL strangler ports complete — P4-13 (posts), P5-02/03 (comments), P6-03 (feed), P7T-01 (notifications), P7O-03 (analytics), P7E-14 (moderation), P2-01/P3-01 (auth/authority cutover live)
- **Scope:** The one-time retirement pass. (1) Drop every legacy `forum*` table + its indexes + dead helpers (`forumFeedCache` crons, virality scorer, local-optimistic reaction code) + `memberships`/`ADMIN_EMAILS` authority remnants. (2) **Tighten the canonical `users`/`privateUserData`/`roleAssignments` fields from schema-optional back to bible-required** — the P1-01a deviation-1 coexistence window (legacy auth inserted bare users) is closed once the P2-01 admission cutover is the only writer; this slice makes the schema enforce what the bible always required. (3) Full-repo grep asserts zero `forum*` references remain.
- **Files touched (expected):** `convex/schema.ts` (drop + tighten), `convex/forum/*` (delete), seed scripts, any residual imports
- **Acceptance criteria:** (a) `grep -r "forumPosts\|forumPostComments\|forumProfiles\|memberships\|forumNotifications\|forumReports\|forumModActions\|forumAnalyticsEvents\|forumDailyStats\|forumFeedCache" convex/ apps/` returns zero source hits; (b) inserting a `users` row WITHOUT the bible-required canonical fields (tokenIdentifier, accountStatus, bootstrapState, …) is **rejected by schema validation** (tested); (c) `roleAssignments` requires role/scopeType/status/grantedAt on insert (tested); (d) tsc/vitest/build green; (e) the P1-01a deviation comment block in `schema.ts` is removed with the tightening.
- **Size check:** ≤2 days — mechanical deletion + validator tightening + the (b)/(c) tests; no product logic.
