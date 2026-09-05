# SLICE CATALOG — BUILD PHASE 7-ADMINCORE: HOME, SUPPORT, WIKI, READINESS

**Date:** 2026-08-29 · **Phase order source:** AUDIT-FINAL.md Part D (corrected build order)
**Sub-batch:** 7-AdminCore of remaining Phase-7 firings (7-ECON and 7-TRUST already cataloged). **7-GROWTH** = `SLICE-CATALOG-PHASE7-GROWTH.md`. **7-OPS** = `SLICE-CATALOG-PHASE7-OPS.md`. Slice IDs are `SLICE-P7A-*`.
**Basis:** `CAPABILITY-REGISTER-MERGED.md` (572 rows) · `_data-model.md` (live 2026-08-29, including this firing’s `platformHealth` [BIBLE-FIX]) · `OPEN-DECISIONS.md` (W7B-E5 archived) · `contracts/wave-7/CONTRACT-7-admin-home-FINAL.md` · `CONTRACT-7-admin-support-FINAL.md` · `CONTRACT-7-admin-wiki-FINAL.md` · `CONTRACT-7-admin-readiness-FINAL.md` · `contracts/wave-7/RECONCILIATION-7B.md` (E1/E4/E5) · `M15-admin.md` (R-HOME / R-S0-COVER / R-GRANT / R-CALENDAR / INV-M15-7) · `M18-reliability.md` (R-READINESS / R-LIVENESS / §6 l.73–76) · `M13-trust-safety.md` (R-AGING / AC-5 — CAP-334) · Phase 2 P2-01 (`launchReadinessResults` schema + admission read) · Phase 3 P3-01–P3-11 (shell, two-layer authz, widget seeder, banner, config, roles, audit — **do not rebuild**) · Phase 7-ECON remaining line (CAP-332/334 were deferred off the econ firing; **both now P7A-06**)
**Tagging (this firing and every later slice card):**
- **`[BIBLE-FIX — apply now]`** — a `_data-model.md` edit this slice’s own description requires. Apply in the same session as the catalog (same discipline as the 2026-08-29 correction pass). Do **not** park it as “described in the catalog.”
- **`[CODE — Phase 5 build]`** — anything requiring actual files (`schema.ts`, mutations, components, routes). Describe fully on the card. **Do not create the file in this catalog session.**
**Sizing-rule addendum applied:** every cited bullet checked for ellipsis/`{…}`/"see X"/"as before" incompleteness before sizing. **Catch this firing:** bible `platformHealth` / `platformHealthProbes` was still `…` while CAP-509 Reads it — **[BIBLE-FIX — apply now] landed 2026-08-29 this firing** (verbatim `M18-reliability.md` l.73 + §7 `state` literals into Core-enums). **Already complete, consume:** `launchReadinessResults` (l.307 — P2-01, five fields exactly); M15 console entities l.255–263; `quotaGrants`; `seoHealth` including `thinIndexedCount`/`heldIndexedCount`; `jobDeadLetters`. **True ellipses this firing cites but does not steal:** bible `consentRecords` l.305 still `…` — P7T-13 owns that back-fill; readiness treats CAP-504 as a **category input** (unavailable = FAIL). **Not a bible invention:** `adminWidgets.dataSourceKey` remains `*(enum → code)*` with no corpus-wide literals — P3-03 grew the seeder for config/roles/audit only; this batch **extends the seeder with literals derived only from these four consoles’ named queries** ([CODE], not a bible enum). **M18 §13 does not contain a per-category GATE predicate list** despite R-READINESS’s “see aggregate §13 GPT + Opus” pointer — contract OQ#2 remains open; do not invent predicates.
**Phase boundary (this firing only):** `/admin/home` · `/admin/support` · `/admin/wiki` · `/admin/readiness`. **Already built in Phase 3 — consume, do not re-slice:** shell chrome, two-layer authz (CAP-390), widget seeder substrate (CAP-569), `/admin/config` (including CAP-395/480 signup.mode setter with **pre-Phase-7** fail-closed), `/admin/roles` (including CAP-414 vacant-slot alert writer + CAP-415 ack), `/admin/audit`. **CAP-334** (M13 queue>500 `ingest.throttle`) is **this catalog** — P7A-06, paired with CAP-332 (same open-case count). **Not this firing:** CAP-500 dead-letter **redrive UI** (reliability console / 7-OPS) · CAP-504 CMP machinery (P7T-13) · CAP-415 ack UI (stays on roles) · CAP-398/431 STOP resume (stays on config) · CAP-535 editorial tool verdicts · support-scoped intervention **surface** (no owning row — fence).

---

## Extra-scrutiny confirmations (verify-before-assuming)

### V1. CAP-024 vs CAP-404 (support.timezone.fix) — CONFIRMED; do not duplicate

**Wave 7B E4 (investigated, kept both, 2026-08-26):** CAP-024 is the M1 **policy / backend-contract** row (`timezone.correct`, Has-UI=NO). CAP-404 is the M15 **canonical mutation** `support.timezone.fix` (Has-UI=YES). Same actor/write is expected: two layers of one correction. Support contract OQ#1 is **closed**. Register Notes on both rows already cross-link.

**This sub-batch:** `/admin/support` **implements CAP-404 only**. CAP-024 is **consumed as the write-once + audited-correction rule** (M1 `users.timezone`; bible users bullet). Do **not** invent a second mutation, a `timezone.correct` alias, or a merge. Do not delete CAP-024.

### V2. E5 readiness-gate coupling (CAP-480/395 fail-closed on `signup.mode=open`) — CONFIRMED

**Wave 7B E5 / W7B-E5:** setting `signup.mode=open` must invoke CAP-510 **synchronously, fail-closed** (not a warning). `waitlist` / `closed` always settable. CAP-510 remains the admission-time belt (FATAL-M1A-02) as a **second, independent** check. Setter and gate cannot disagree: one transaction on the write path.

**P3-08 already owns the setter UI** (`config.signupMode.set` / CAP-480, and CAP-395 when the payload is `signup.mode=open`). Pre-Phase-7 semantics: no evaluated passing row → reject `open`. **This firing does not rebuild `/admin/config`.**

**This sub-batch:** build CAP-509 `readiness.evaluate` so it **writes real `launchReadinessResults` rows matching the corrected bible exactly** (`evaluatedAt`, `overall` ∈ `{blocked|warning|ready|revoked}`, `blockers[]`, `warnings[]`, `evidence{}`). Build CAP-510 as a **callable helper** P3-08 invokes. After this firing, P3-08 consumes **latest `overall === ready`** (absent / `blocked` / `warning` / `revoked` all reject `open` — fail-closed; do not invent a `warning`-allows-open path). CAP-435 is the Founder checklist query. Do not re-derive E5.

### V3. Wiki CAP-418 — consume Wave 7B E1; do not re-derive

Register Actor = staff-role set `{editor · publisher · moderator · store_operator · support_operator · administrator}`. Gated-by **CAP-390** (any staff-role shell entry). Sanitization still blocks script injection; disclosure is gated by staff identity. **P3-01 is the two-layer library.** This firing implements `wiki.get` / missing / `wiki.deploySync` **behind that gate**. Do not invent a public wiki, a member wiki, or a second staff-role enum.

### V4. User CAP-list vs contract primary CAPs — contracts win; user list is adjacent / consume / fence

| Screen | Contract primary (slice these) | User list — how this catalog treats it |
|---|---|---|
| `/admin/home` | **391, 399, 407–412** (+ adjacent **427, 428**) | 427/428 sliced with compose. Remote writers **318, 332, 381, 432, 484** sliced as System alert writers (Home **renders**). **414** = P3-10 writer already — **consume, do not duplicate**. User omitted 391/399/407–412 — they are still the screen. |
| `/admin/support` | **402–406** | **404** is the timezone path (V1). **020** = rate gate on support.action (wire, do not invent a second limiter). **029** = public-query allowlist **constraint** on the masked projection (fence fields; do not treat as a slice). **024** = consume-only (V1). **390** = P3-01 shell. **432** = trigger from grant, rendered on Home. **408** = Administrator `intervention.ack` on **Home**, not Support (support OQ#4 — **no surface here**). **535** = M5 editorial verdicts — **not this screen**. |
| `/admin/wiki` | **418, 419, 420** | Matches. **390** consumed (V3). |
| `/admin/readiness` | **435, 509, 510** | **395/480** = P3-08 setter — consume helper, do not rebuild. **414** consume (P3-10). **415** ack stays on roles. **431** STOP resume stays on config (P3-08 CAP-398). **500** = redrive runbook **GATE input / wiki link only** — do not build redrive UI. **504** = consent category input — do not rebuild CMP. **023** = production auth-probe nuance (preview `founder_bootstrap_completed` does **not** satisfy). |

### V5. `launchReadinessResults` consumption matches the corrected bible **exactly**

Corrected bullet (`_data-model.md` l.307, transcribed 2026-08-29 from `M18-reliability.md` l.76):

> `launchReadinessResults` — evaluatedAt, overall {blocked\|warning\|ready\|revoked} *(M18 §7 readiness literals)*, blockers[], warnings[], evidence{}.

**Persist those five names. Nothing else.**

- **Do not invent** `checklistVersion`, `evaluatorUserId`, `schemaVersion`, or a parallel category enum. CAP-435’s “version recorded” is satisfied by **inserting a new row per evaluate**, with `evaluatedAt` (and Convex `_id`) as the version. If a distinct version **field** is required beyond that, **stop-and-report** — do not add it in schema.ts.
- **`evidence{}`** is a map on the sheet. **Do not invent nested predicate keys.** Allowed map keys for this firing: the seven R-READINESS category names verbatim — **identity · safety/legal · data integrity · runtime recovery · consent · supply · ops ownership**. Values are pass/fail/unavailable plus references to **already-named** rows (`platformHealth.probeKey`, `opsAssignments.slot`, etc.). Unavailable probe = **FAIL** (CAP-509 Notes, quoted).
- **`overall`:** `ready` iff every GATE category passes; otherwise `blocked`. Literals `warning` and `revoked` remain on the enum because the sheet named them; **no named trigger exists in M18 §7/R-READINESS** — do not write them until a source names when. Fail-closed: P3-08/`open` accepts **only** `overall === ready`.
- Contract OQ#4 (“schema thin / as before”) is **closed by the P2-01 bible pass**. Do not treat the Wave-7B contract file as the live field list.

### V6. Home priority “tuple” — consume M15 R-HOME; do not invent a numeric formula

Home contract OQ#1 called the tuple unowned. **M15 R-HOME already names the order** (quoted): “critical strip order: **S0 · legal overdue · unsafe destinations · classifier/outage · active STOP · M18 critical · open interventions (critical/high)**. Same case id collapses once.” ≤8 next actions. Use that order. If compose still needs a named numeric tuple **beyond** that list, stop-and-report.

### V7. Banner / intervention chrome — consume P3-06; flag the archetype gap, do not fork

Home §6: intervention banner is a **BANNER ARCHETYPE GAP**. P3-06 already shipped the shared Banner primitive. Home **uses that primitive**. Do not invent a second banner token.

---

## SLICE-P7A-01 — Widget catalog grow: four AdminCore routes (CAP-569 extension)

- **CAP-IDs covered:** CAP-569 (grow-per-phase seeder; P3-03 substrate)
- **Source contract(s):** shell contract via P3-03 · this firing’s four screen contracts §1 (paths + Actor columns)
- **Depends on:** SLICE-P3-03 (seeder + `adminWidgets` schema), SLICE-P3-01 (permission-key filter)
- **Scope:** Extend the source-controlled widget catalog with **exactly four** routes: `/admin/home` (Administrator / CAP-391), `/admin/support` (support_operator / CAP-402–406), `/admin/wiki` (any staff role / CAP-418), `/admin/readiness` (Founder/Admin / CAP-435/509). `dataSourceKey` literals **only** for this firing’s named queries (`admin.home.compose`, `support.userSummary`, `wiki.get`, `readiness.evaluate` / checklist query). Do not invent a platform-wide enum. Do not re-seed config/roles/audit.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`adminWidgets` bullet complete; `dataSourceKey` stays code-side).
  - **[CODE — Phase 5 build]:** `convex/admin/widgetsCatalog.ts` (four rows); no new table.
- **Acceptance criteria:** P3-03 (quoted): “the catalog grows per-phase as later consoles land.” Shell §1 (quoted): hidden/unregistered → FEATURE_DISABLED/NOT_FOUND. A `support_operator` sees support + wiki, **not** home/config/readiness. An Administrator sees home + wiki + readiness, **not** support unless also `support_operator`.
- **Size check:** ≤2 days — four metadata rows on an existing seeder.

## SLICE-P7A-02 — `/admin/home` compose + bounded read + routeKey gate (CAP-391 / 428 / 427)

- **CAP-IDs covered:** CAP-391, CAP-428, CAP-427
- **Source contract(s):** `CONTRACT-7-admin-home-FINAL.md` §1, §3 A/B/G, §4 compose row · M15 R-HOME · INV-M15-7
- **Depends on:** SLICE-P7A-01, SLICE-P3-01/02 (shell + chrome), SLICE-P3-06 (banner primitive), SLICE-P7E-14 (`moderationCases` live reads when present), SLICE-P7E-10 (`legalIntake` remainder). **`dripBatches`:** read live when **P7G-05** has run; otherwise fixtures — **not a hard Depends-on** (later sub-batch).
- **Scope:** Implement `admin.home.compose` for **Administrator** only (narrow gate; CAP-390 is shell only). Compose ≤8 next actions + critical strip + interventions. **Priority order = R-HOME** (V6) — not an invented numeric tuple. CAP-428: s0 / legal overdue / unsafe destinations / STOP **live**; else `adminCounters`; **no unbounded Home reads** (M18 Limits: no `.collect()` unbounded `jobRuns` on Home). CAP-427: `deepLinkRouteKey` rejects arbitrary URLs; source-controlled keys only. Empty interventions = honest empty, not fabricated counts. Do **not** implement ack/resolve/snooze here (P7A-03). Do **not** implement S0 throttle or counter cron here.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none.
  - **[CODE — Phase 5 build]:** `convex/admin/home.ts` (`admin.home.compose`); `app/admin/home/page.tsx`; Home cards on §11.3 / §11.5 / §11.9; Banner via P3-06.
- **Acceptance criteria:** CAP-391 Notes (quoted): “Composes ≤8 next actions + critical strip + interventions; deterministic priority tuple.” R-HOME (quoted): “critical strip order: S0 · legal overdue · unsafe destinations · classifier/outage · active STOP · M18 critical · open interventions (critical/high). … Same case id collapses once.” INV-M15-7 (quoted): “No unbounded Home reads; s0/legal/STOP/unsafe destinations **live**; else `adminCounters`.” CAP-427 (quoted): “deepLinkRouteKey rejects arbitrary URLs; source-controlled keys only.” Actor check: `support_operator` hitting `/admin/home` → narrow-gate reject (not a compose).
- **Size check:** ≤2 days — one compose query + one screen; writers are later slices. If live s0/legal joins blow the budget, ship compose against counters + STOP + open interventions first and flag remaining live columns — do not unbounded-scan to “finish.”

## SLICE-P7A-03 — Intervention lifecycle (CAP-407 create · 408 ack · 409 resolve · 410 snooze)

- **CAP-IDs covered:** CAP-407, CAP-408, CAP-409, CAP-410 · CAP-401 *(added 2026-09-04 — orphan disposition: the M15 shared-lease expiry cron/check that CAP-328/400 consume)*
- **Source contract(s):** home contract §3 F/G, §4 · bible `adminInterventionAlerts` l.263
- **Depends on:** SLICE-P7A-02 (Home surface), SLICE-P1-06 (`auditLog`), SLICE-P7A-01
- **Scope:** System `intervention.create` (severity critical/high/medium; copy **must** include `whatHappening` + `whatToDo` + source-controlled `deepLinkRouteKey`). Administrator `intervention.ack` / `resolve` / `snooze` (snooze ≤24h; **critical forbidden**). Writes match the bible field list. **Fence:** “Support sees only support-scoped alerts” (CAP-408 Notes) — **no owning surface on `/admin/support`** (support OQ#4 / home OQ#2). Do **not** build a support alert inbox. Do **not** invent alert retention/reopen (home OQ#5). Later System writers (P7A-04/05/06/07) **call** `intervention.create`; they do not fork the row shape.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`adminInterventionAlerts` complete).
  - **[CODE — Phase 5 build]:** `convex/admin/interventions.ts`; Home ack/resolve/snooze controls.
- **Acceptance criteria:** CAP-407 (quoted): “copy must include whatHappening + whatToDo + deep link (source-controlled routeKey only).” CAP-408 (quoted): “Scoped to Admin role.” CAP-410 (quoted): “Critical forbidden.” Lifecycle (quoted): “open → acknowledged | snoozed → resolved.” `auditLog` on 408/409/410 (home Entities).
- **Size check:** ≤2 days — one create helper + three admin mutations + three controls on an existing screen.

## SLICE-P7A-04 — Admin counters cron + stale ≠ 0 (CAP-411 / 412)

- **CAP-IDs covered:** CAP-411, CAP-412
- **Source contract(s):** home contract §3 C/D · bible `adminCounters` l.257 · M18 R-LIVENESS (15m heartbeat → `—`)
- **Depends on:** SLICE-P7A-02 (render), SLICE-P7A-03 (`intervention.create` for 412), M18 job catalog substrate if present (otherwise a named cron in `crons.ts` still required — do not schedule `api.*`)
- **Scope:** Cron refreshes `adminCounters` (~60s): `value`, `computedAt`, `health` ∈ `{healthy|stale|failed}`. Home renders **stale → "—" not 0**; heartbeat **>15m → "—"**. CAP-412: cron failure → intervention; **unavailable ≠ zero**. Counter keys this firing may compute: only those the Home compose actually displays from INV-M15-7 / R-HOME (do not invent a platform-wide counter enum). Refresh is **not** a `rawEvents` / analytics event (home §5).
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none.
  - **[CODE — Phase 5 build]:** `convex/admin/counters.ts`; `convex/crons.ts` entry mapped to an `internal.*` jobKey; Home stale rendering.
- **Acceptance criteria:** CAP-411 (quoted): “stale → ‘—’ not 0” + “heartbeat >15m → ‘—’.” CAP-412 (quoted): “Counter failure → intervention; unavailable ≠ zero.” M18 Limits (quoted): “counter refresh freshness per M15.”
- **Size check:** ≤2 days — one cron + one failure writer + render rule. If a named counterKey list is required beyond what compose displays, stop-and-report.

## SLICE-P7A-05 — S0 cover → ingest.throttle (CAP-399)

- **CAP-IDs covered:** CAP-399
- **Source contract(s):** home contract §3 E · M15 R-S0-COVER · register CAP-399
- **Depends on:** SLICE-P7A-03, SLICE-P7E-14 (s0 rows on the case queue), SLICE-P1-05 (`systemConfig` / `ingest.throttle`)
- **Scope:** Unclaimed s0 **>4h** → `systemConfig` `ingest.throttle` + intervention **"INGEST THROTTLED — S0 BACKLOG"** + `operationalIncidents` + `auditLog`. Register Notes (quoted): “+15m backup, +15m Founder; >4h → ingest.throttle.” Home OQ#4 (timer anchor) — **do not invent a new clock field**. Use existing `moderationCases` unclaimed duration (`status` not yet `claimed`, case `createdAt` or the lease fields already on the M13 spine). If those cannot express “unclaimed,” **stop-and-report**. **Shared flag with CAP-334 (P7A-06):** same `ingest.throttle` key. Honor CAP-334 Notes (quoted): throttle must not stop appeals · legal intake · privacy/erasure · safety reports · existing-case responses · Admin. **Do not rebuild the >500 detector here** — that count lives on P7A-06 with CAP-332.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none.
  - **[CODE — Phase 5 build]:** `convex/admin/s0Cover.ts`; cron/internal job; Home already renders the intervention.
- **Acceptance criteria:** CAP-399 (quoted): “>4h → ingest.throttle + intervention ‘INGEST THROTTLED — S0 BACKLOG’.” R-S0-COVER (quoted): “Unclaimed s0: +15m backup · +15m Founder; **>4h → ingest.throttle** + intervention.” UI: intervention banner (P3-06).
- **Size check:** ≤2 days — one detector + one config write + one create-intervention call.

## SLICE-P7A-06 — Remote Home alert writers (CAP-318 / 332 / 334 / 381 / 484) — CAP-414 consume-only

- **CAP-IDs covered:** CAP-318, CAP-332, CAP-334, CAP-381, CAP-484; **CAP-414 consume (P3-10)**
- **Source contract(s):** home contract §3 H · register Notes on each row · M13 R-AGING / AC-5 (CAP-334)
- **Depends on:** SLICE-P7A-03 (`intervention.create`); SLICE-P7A-05 (shared `ingest.throttle` flag — do not duplicate the S0>4h detector); SLICE-P7E-14 (open-case count for 332/334); SLICE-P7E-05 (integrityFlags for 318 — degrade if absent); SLICE-P3-10 (414 already writes vacant-slot alerts); SLICE-P1-05 (`systemConfig`)
- **Scope:** System monitors that **write** `adminInterventionAlerts` Home already renders. Thresholds **quoted, not invented:** CAP-332 soft alerts at open-case **250 and 400**; **CAP-334** (register **M13**, not M9/M18) on the **same open-case count**: queue **>500** → `systemConfig` `ingest.throttle` + `auditLog` + **distinct** operator alert (R-AGING quoted: “organic backlog vs flood-to-throttle”). Hard gate unchanged. Throttle must **not** stop appeals · legal intake · privacy/erasure · safety reports · existing-case responses · Admin (CAP-334 Notes). CAP-381 drip scheduled supply **<14 days** (launch floor 40 banked — do not change the floor) — **reads** `dripBatches` produced by **P7G-05** when that cron exists; until then, fixtures (not a Depends-on). CAP-484 `seoHealth` stale / sitemap / coverage / **thin indexed = 0 · held indexed = 0** (fields exist on bible `seoHealth`; **P7O-07** is the view, not a dep). CAP-318 cause-less rank-drop / coordinated-withdrawal hook (residual risk logged — do not invent a new integrity table). **CAP-414:** P3-10 already owns the vacant-slot writer and “UI: launch readiness blocked.” This slice **must not** insert a second vacant-slot alerter. **CAP-432** is **not** here — it fires from the quota grant path (P7A-07). **CAP-399 (P7A-05)** may also set the same throttle flag from S0 unclaimed >4h — share the config helper; do not fight over the key.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`seoHealth` already has `thinIndexedCount`/`heldIndexedCount`).
  - **[CODE — Phase 5 build]:** `convex/admin/homeAlertWriters.ts` (332/334 share one open-case cron; plus 318/381/484 jobKeys); call `intervention.create`; write `ingest.throttle` via the same helper as P7A-05.
- **Acceptance criteria:** Home §3 H (quoted): “Remote banner writers rendered here: CAP-332 (250/400 open-case), CAP-381 (drip supply <14d), CAP-432 (quotaGrants >3/90d), CAP-484 (seoHealth stale), CAP-318 (cause-less rank-drop), CAP-414 (vacant ops slot).” This slice’s write set is **318/332/334/381/484**; 432 = P7A-07; 414 = P3-10. CAP-334 (quoted): “Queue count >500 → ingest.throttle flag (hard gate unchanged).” AC-5 (quoted): “Queue>500 → throttle flag + distinct alert; s0 still never auto-release; appeals/legal still accepted.” Each alert includes whatHappening + whatToDo + registered routeKey (CAP-407/427). The 500 trip must be a **distinct** banner from the 250/400 pre-throttle warnings.
- **Size check:** ≤2 days — 332 and 334 share the open-case count; 334 is one extra threshold + config write on that job, not a fifth independent monitor. If 318’s integrityFlags join is not yet in schema from 7-ECON, ship 332/334/381/484 and flag 318 degraded — do not invent flags.

## SLICE-P7A-07 — `/admin/support` quota grant / neutralize + rate gate + CAP-432 trigger (CAP-402 / 403 / 020 / 432)

- **CAP-IDs covered:** CAP-402, CAP-403, CAP-020, CAP-432
- **Source contract(s):** `CONTRACT-7-admin-support-FINAL.md` §1, §3 A/B, §4 · M15 R-GRANT
- **Depends on:** SLICE-P7A-01, SLICE-P3-01 (narrow `support_operator`), SLICE-P7A-03 (432 → `intervention.create`), P1 rate-limiter (CAP-020), `quotaGrants` + `operationalIncidents` schema (bible complete)
- **Scope:** `quota.grant`: ≤5 extra acquires · ≤7d · max 1 active/user · unique `incidentId` · **no permanent opsExempt flag**. Rolling **>3 grants / 90d → CAP-432 Admin intervention** (rendered on Home, not on this screen). `quota.neutralize` sets `neutralizedAt`. CAP-020: **support.action 30/1h per operator; staff NOT rate-exempt**. Fence support OQ#5 (incident-eligibility details unspecified) — require an existing `operationalIncidents` id unique per grant as the register already says; do not invent a second incident type. Fence OQ#6 (member notification of neutralize / unused allowance) — **not built**. Do **not** implement timezone/note/summary here (P7A-08). Do **not** implement CAP-408 on this screen (V4).
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`quotaGrants` complete).
  - **[CODE — Phase 5 build]:** `convex/admin/supportQuota.ts`; `app/admin/support/` grant/neutralize UI; rate-limiter wrap; 432 call into P7A-03.
- **Acceptance criteria:** CAP-402 (quoted): “≤5 extra acquires · ≤7d · max 1 active/user · unique incident; rolling >3/90d → Admin intervention.” CAP-020 (quoted): “30 / 1h per operator.” R-GRANT (quoted): same bounds. CAP-432 (quoted): “→ Admin intervention.” Actor: Administrator without `support_operator` cannot grant.
- **Size check:** ≤2 days — two mutations + rate wrap + one threshold hook + bounded grant UI (archetype gap: keep it a confirm-modal + A1-lite, do not invent a new kit component).

## SLICE-P7A-08 — `/admin/support` timezone.fix + note + masked summary (CAP-404 / 405 / 406; CAP-024 consume; CAP-029 constraint)

- **CAP-IDs covered:** CAP-404, CAP-405, CAP-406; **CAP-024 consume-only**; **CAP-029 constraint**
- **Source contract(s):** support contract §1 E4, §3 C/D/E, §4 · M15 R-CALENDAR · M1 write-once timezone
- **Depends on:** SLICE-P7A-07 (same screen shell), SLICE-P3-01, SLICE-P1-06 (`auditLog`), bible `users.timezone`
- **Scope:** **Canonical mutation = `support.timezone.fix` (CAP-404).** CAP-024 is the M1 rule (write-once; Admin+audit correction) — **no second mutation** (V1). Calendar context (quoted): “grievance_india = Asia/Kolkata + India holidays; DMCA = US business days.” Do **not** invent a holiday table if none exists — apply the IANA timezone write + audit; holiday-aware **countdown** remains F-33 / legal OQ#4 (7-TRUST fenced). `support.note.create` writes **auditLog only** (no `users` note field on the bible — do not invent one). `support.userSummary`: masked PII; read `users` + `moderationCases` + `strikes` + `capabilityRestrictions`. **CAP-029:** email never in public queries; never raw users row — this summary is **staff-masked, not public**. Support OQ#2 (masked allowlist not enumerated) — **fence:** return standing, timezone, quota-grant summaries, open-case **counts**, restriction **presence**; **do not return email, mobile, tokenIdentifier, raw case evidence**. If a named field is required beyond that, stop-and-report. Fence OQ#3 (no access-audit on 406) — do **not** silently add `auditLog` for the read unless a later founder call says so; flag remains open. India-holiday live countdown is **not** this screen.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none.
  - **[CODE — Phase 5 build]:** `convex/admin/supportOps.ts` (`support.timezone.fix`, `support.note.create`, `support.userSummary`); support page sections.
- **Acceptance criteria:** CAP-404 Notes (quoted): “canonical **mutation name** for the timezone correction … CAP-024 is the M1 backend-contract row … two layers, not duplication.” R-CALENDAR (quoted): “grievance_india = Asia/Kolkata + India holidays; DMCA = US business days.” CAP-405 (quoted): writes auditLog. CAP-406 (quoted): “Masked PII.” CAP-029 (quoted): “email never in public queries; never raw users row.” No `timezone.correct` export.
- **Size check:** ≤2 days — one write-once override, one audit-only note, one masked query. Allowlist fence is what keeps it in budget.

## SLICE-P7A-09 — `/admin/wiki` get + missing + deploySync (CAP-418 / 419 / 420) — E1 consumed

- **CAP-IDs covered:** CAP-418, CAP-419, CAP-420
- **Source contract(s):** `CONTRACT-7-admin-wiki-FINAL.md` §1 E1, §3 A–D, §4 · bible `adminWikiArticles` l.262
- **Depends on:** SLICE-P7A-01, SLICE-P3-01 (CAP-390 staff-role shell — **do not re-derive E1**), SLICE-P3-02 (Wiki chrome link)
- **Scope:** `wiki.get`: source-controlled **sanitized Markdown; never executable HTML/JS**. Missing slug → CAP-420 explicit **"no article yet"**, not a broken panel. `wiki.deploySync`: repo → table at deploy; **Founder cannot inject scripts**; soft-beta ships **P0 widget articles** linked via `adminWidgets.wikiSlug`. **No in-app editor** (wiki OQ#3 / States D). Actor = staff-role set (V3). Fence OQ#5 (sanitization policy unspecified) — strip script/iframe/on\* ; if a named Markdown-extension list is required, stop-and-report. Fence OQ#4 (archival/stale cleanup) — not built.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`adminWikiArticles` complete).
  - **[CODE — Phase 5 build]:** `convex/admin/wiki.ts`; `app/admin/wiki/`; deploy sync next to the widget seeder; sanitized Markdown reader (archetype gap — static reading column, no new kit name).
- **Acceptance criteria:** CAP-418 Notes (quoted): “requires staff-role shell entry” + “Sanitization still blocks script injection.” CAP-420 (quoted): “explicit ‘no article yet’, not broken panel.” CAP-419 (quoted): “Founder cannot inject scripts; soft-beta ships P0 widget articles.” Anonymous/member `wiki.get` **fails** CAP-390.
- **Size check:** ≤2 days — one query, one empty state, one deploy sync. No editor is the fence that keeps it there.

## SLICE-P7A-10 — Readiness evaluate + CAP-510 helper + `platformHealth` schema (CAP-509 / 510 / 023)

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #8 (+correction):** readiness predicate catalog approved — **8 categories, not 7**: Legal pages · Admission · Moderation · Legal intake · Consent/privacy · Reliability · Content safety · **Ranking calibration reviewed** (the 8th gates PUBLIC LAUNCH, not build). Each predicate: boolean, module-owned, rechecked every 5 min, unavailable = fail-closed; `overall=ready` only when all 8 true.

- **CAP-IDs covered:** CAP-509, CAP-510, CAP-023; **consume CAP-414/415 state (not UI)**; **CAP-504 / CAP-500 as GATE inputs only**
- **Source contract(s):** `CONTRACT-7-admin-readiness-FINAL.md` §3 B/C/D/E · M18 R-READINESS · bible `launchReadinessResults` l.307 · bible `platformHealth` l.304 (**filled this firing**)
- **Depends on:** SLICE-P2-01 (`launchReadinessResults` table exists as admission read), SLICE-P3-08 (setter **calls** this helper — wire, do not rebuild UI), SLICE-P3-10 (ops green OR single-person ack), SLICE-P7T-13 (consent rows — if absent, consent category **FAIL**), SLICE-P3-01
- **Scope:**
  1. **[CODE]** Define `platformHealth` / `platformHealthProbes` in `schema.ts` from the **already-applied** bible bullet (probeKey/jobKey, state, severity, checkedAt, lastSuccessAt, expectedNextRunAt?, latencyMs?, failureClass?, freshUntil, dependency?, affectedCapabilities[], deepLinkKey). `state` literals = Core-enums `platformHealth.state` (this firing).
  2. **`readiness.evaluate` (CAP-509)** inserts a `launchReadinessResults` row whose fields are **exactly** V5: `evaluatedAt`, `overall`, `blockers[]`, `warnings[]`, `evidence{}`. Categories verbatim: **identity · safety/legal · data integrity · runtime recovery · consent · supply · ops ownership**. Unavailable probe = **FAIL**. Ops-ownership = CAP-414/415 (green OR single-person ack) — **read** `opsAssignments` / `opsCoverageAcknowledgements`; do not call CAP-415. Identity includes CAP-023: preview `founder_bootstrap_completed` does **not** satisfy the production probe. Consent: CAP-504 purposes — if `consentRecords` machinery (P7T-13) is not landed, category FAIL (unavailable). Runtime recovery: CAP-500 “Redrive runbook required before open beta” — if `jobDeadLetters` exist, push a **blocker string from that quote**; **do not** implement `jobs.redriveDeadLetter`. CAP-431 is **not** implemented here (STOP resume stays P3-08).
  3. **CAP-510 helper** (internal, scheduled only from trusted backend / called by P3-08): on `signup.mode=open`, read **latest** `launchReadinessResults`; reject unless `overall === ready`. No row → reject (same as P2-01/P3-08 unevaluated). `waitlist`/`closed` do not call this reject. **Do not write `systemConfig` here.** Do not write `auditLog` unless a later founder call closes readiness OQ#3 — flag remains open; do not silently add.
  4. **Do not invent** the M18-§13 predicate list that does not exist (V5 / sizing catch). Evaluate using the seven category names + unavailable=fail + the consume/fence inputs above. If a named GATE predicate beyond that is required, **stop-and-report**.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** `_data-model.md` `platformHealth` — **already applied 2026-08-29 this firing** (M18 l.73 + §7 `state` literals). Do not re-transcribe. If an implementer finds the bible still `…`, that is a regression — re-apply from M18 l.73, do not invent fields. **`consentRecords` stays `…` (P7T-13).** **`launchReadinessResults` stays the five-field P2-01 bullet — do not add columns.**
  - **[CODE — Phase 5 build]:** `convex/schema.ts` (`platformHealth` region); `convex/admin/readiness.ts` (`readiness.evaluate` + internal `assertSignupOpenAllowed` / CAP-510); wire into existing P3-08 setter; **no** `/admin/config` rebuild; **no** redrive UI; **no** CMP rebuild.
- **Acceptance criteria:** CAP-509 (quoted): “All GATE predicates true; unavailable probe = fail; categories: identity · safety/legal · data integrity · runtime recovery · consent · supply · ops ownership.” CAP-510 (quoted): “Server blocks open if any GATE false” + E5 “invoked **synchronously inside CAP-395/480's write path**.” CAP-023 (quoted): “Preview `founder_bootstrap_completed` does NOT satisfy production probe.” M18 AC (quoted): “Given readiness GATE false, When set signup.mode=open, Then reject.” Persisted row **equals** bible l.307 field names. P3-08 `open` after this slice: rejects on absent/`blocked`/`warning`/`revoked`; accepts only `ready`.
- **Size check:** ≤2 days — one table, one evaluate mutation, one helper, setter wire. Predicate invention is the failure mode; the fence is what keeps it in budget.

## SLICE-P7A-11 — `/admin/readiness` checklist UI + Founder query (CAP-435)

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #8 (+correction):** checklist UI renders the **8-category** predicate catalog (see P7A-10 note) — do not build a 7-category view.

- **CAP-IDs covered:** CAP-435
- **Source contract(s):** readiness contract §1, §3 A, §4 query row, §6 · CAP-435 Notes
- **Depends on:** SLICE-P7A-10 (rows exist), SLICE-P7A-01, SLICE-P3-01/02
- **Scope:** Founder query of the latest (and, if cheap, prior) `launchReadinessResults` row. **“Version recorded” = `evaluatedAt` / row id** (V5) — no new field. UI: seven category pills (pass/fail/unavailable), blockers/warnings lists, evaluate/re-evaluate button calling CAP-509 (Founder/Admin). Deep links only to registered `routeKey`s (CAP-427 discipline). **Do not** put a “force open” control on this screen (contract §1: this screen does not bypass readiness). **Do not** build CAP-415 ack or CAP-480 setter here — link to `/admin/roles` and `/admin/config`. CAP-500: wiki slug link if P7A-09 seeded a runbook article; no redrive button (readiness OQ#5 remains a linkage gap if no slug exists — do not invent the article body). CAP-435 Actor = Founder for the **query**; Administrator may still **evaluate** (509) and see the screen via P7A-01 widget keys — do not invent an Administrator-only query name (readiness OQ#6). Freshness/expiry (OQ#7) — **not invented**; latest row is authoritative until the next evaluate.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none.
  - **[CODE — Phase 5 build]:** `convex/admin/readiness.ts` (Founder query); `app/admin/readiness/page.tsx`; checklist cards + §11.5 pills.
- **Acceptance criteria:** CAP-435 (quoted): “Readiness checklist version recorded.” Contract §3 A (quoted): “version recorded per query (R-OPS)” — implemented as evaluate-row identity, not a new column. Contract §1 (quoted): “This screen does **not** directly bypass readiness to open signup — CAP-510 is the server-side gate.” Seven category names match R-READINESS verbatim.
- **Size check:** ≤2 days — one query + one checklist screen over P7A-10 rows.

---

## Dependency graph (within 7-AdminCore)

1. **SLICE-P7A-01** (widget grow) — after P3-03; unblocks shell visibility for all four routes
2. **SLICE-P7A-02** (Home compose) — after 01 + P3-01/02/06
3. **SLICE-P7A-03** (intervention lifecycle) — after 02
4. **SLICE-P7A-04** (counters) — after 02 + 03
5. **SLICE-P7A-05** (S0 throttle) — after 03 + **P7E-14**
6. **SLICE-P7A-06** (remote writers 318/332/334/381/484) — after 03; parallel with 04/05; **414 not in this node**; 334 shares 332’s count + P7A-05’s throttle helper
7. **SLICE-P7A-07** (support quota + 432) — after 01 + 03; parallel with Home writers
8. **SLICE-P7A-08** (timezone/note/summary) — after 07 (same screen)
9. **SLICE-P7A-09** (wiki) — after 01 + P3-01; parallel with Home/Support
10. **SLICE-P7A-10** (evaluate + CAP-510 helper + platformHealth schema) — after P2-01 + P3-08 + P3-10; parallel with 02–09
11. **SLICE-P7A-11** (readiness UI) — after 10 (+ 09 if linking a runbook slug)

**CAP-057-class ownership line (timezone):** execute **CAP-404 `support.timezone.fix` only**. CAP-024 is policy. A slice that exports `timezone.correct` fails the batch.

**CAP-057-class ownership line (signup.mode):** setter UI is **P3-08**. Gate implementation is **P7A-10**. Admission formula remains **P2-01**. Do not merge the three.

**CAP-057-class ownership line (ops coverage):** writer + ack UI is **P3-10**. Readiness **reads** the outcome. Home **renders** P3-10’s vacant-slot alerts. Do not write a second CAP-414.

**CAP-057-class ownership line (interventions):** create/ack/resolve/snooze is **P7A-03** on **Home**. Support does not ack. Quota>3/90d is **P7A-07** calling P7A-03.

**Phase 7-AdminCore exit gate (this sub-batch):** (1) Administrator with Home widget sees composed Home: bounded reads, stale counters as "—", R-HOME strip order, interventions ack/resolve/snooze; `support_operator` cannot compose Home. (2) `support_operator` hits `/admin/support` via CAP-390 then the narrow gate; timezone write is **`support.timezone.fix` only**; grant bounds + CAP-020 hold; CAP-432 lands on Home, not a support inbox. (3) Any staff role opens `/admin/wiki`; anonymous/member cannot; missing slug is “no article yet”; deploySync cannot persist script. (4) `readiness.evaluate` persists **exactly** `evaluatedAt` / `overall` / `blockers[]` / `warnings[]` / `evidence{}`; unavailable probe fails; seven category names verbatim. (5) P3-08 `signup.mode=open` rejects unless latest `overall === ready` (absent included); `waitlist`/`closed` still always settable. (6) No `convex/` files were created by **this catalog session**.

---

## Flags carried forward (stated, not silent)

- **CAP-334** — **closed onto P7A-06** (2026-08-29 slice-decomposition closure). Register module **M13**. Paired with CAP-332 on the same open-case count. Not M9 feed, not M18 reliability.
- **F-38 / CAP-408 support-scoped alerts surface** — home OQ#2 / support OQ#4. No inbox. Ledgered 2026-08-29 as **F-38** (OPEN, non-blocking). Not built. Do not invent a support inbox in a slice.
- **Home OQ#5** — alert retention/reopen. Unspecified. Not built.
- **CAP-399 OQ#4** — +15m steps use existing unclaimed duration; stop-and-report if the spine cannot express it.
- **Support OQ#2/#3/#5/#6** — masked allowlist, 406 access-audit, incident-eligibility detail, member notify. Fenced in P7A-07/08.
- **Wiki OQ#2/#4/#5** — Markdown-reader archetype, archival, sanitization extensions. Fenced in P7A-09.
- **Readiness OQ#2** — per-category predicate list **not** in M18 §13. P7A-10 uses seven names + unavailable=fail + consume/fence inputs; stop-and-report beyond that.
- **Readiness OQ#3** — CAP-509/510 `auditLog`. Not silently added.
- **Readiness OQ#5** — CAP-500 ↔ wiki linkage. Link if a slug exists; no redrive UI.
- **Readiness OQ#6/#7** — unnamed query / Founder vs Admin; freshness/expiry. Query = Founder; latest row authoritative; no override control.
- **`warning` / `revoked` on `overall`** — literals reserved; no write trigger named. Fail-closed treats them like not-ready.
- **F-33 / legal OQ#4** — India-holiday live countdown. Not this screen (7-TRUST fence stands).
- **`consentRecords` bible `…`** — P7T-13. Readiness fail-closed on unavailable consent machinery.
- **F-37 `activationProgress`** — not this batch.
- **Intervention banner archetype** — consume P3-06; gap remains a kit note, not a second component.

---

## Skipped / not sliced (explicit)

| ID | Why |
|---|---|
| CAP-390 / 392 / 430 | P3-01 |
| CAP-394 / 395 / 396 / 397 / 398 / 460 / 480 | P3-07 / P3-08 (this firing **wires** 510 into 395/480; does not rebuild) |
| CAP-413 / 414 / 415 / 416 / 417 / 564 / 008 | P3-09 / P3-10 (414 **consumed**) |
| CAP-421 / 422 / 357 | P3-11 |
| CAP-024 | Policy row; executed via 404 |
| CAP-029 | Constraint, not a screen |
| CAP-408 on `/admin/support` | Wrong screen |
| CAP-535 | M5 editorial; not AdminCore |
| CAP-500 UI | 7-OPS / reliability; GATE input only |
| CAP-504 machinery | P7T-13 |
| CAP-431 | P3-08 STOP resume |
| CAP-023 as a UI | Probe nuance inside P7A-10 evaluate |
| Shell / config / roles / audit screens | Phase 3 |

---

## Sizing-addendum results (this firing)

| Source | Status at catalog time | Action |
|---|---|---|
| `launchReadinessResults` l.307 | **Complete** (P2-01, five fields) | Consume exactly; first **writer** is P7A-10 |
| `platformHealth` l.304 | Was `…`; CAP-509 Reads it | **[BIBLE-FIX — apply now] applied 2026-08-29 this firing** from M18 l.73 + §7 `state` |
| `consentRecords` l.305 | Still `…` | P7T-13; readiness FAIL if unavailable |
| M15 l.255–263 (`adminWidgets` … `adminInterventionAlerts`) | Complete inline | Consume; `dataSourceKey` literals = [CODE] four consoles only |
| `quotaGrants` / `seoHealth` / `jobDeadLetters` | Complete | Consume |
| R-READINESS “§13 GPT + Opus” | §13 is Integrations — **no predicate list** | Fence OQ#2; do not invent |
| `evidence{}` | Map, no key enum | Seven category names only |
| CAP-435 “version recorded” | Not a named field on l.76 | Row `evaluatedAt` / `_id`; stop-and-report if a field is demanded |
| Home OQ#1 tuple | Unowned on contract; **named on R-HOME** | Consume R-HOME order |
| `activationProgress` / F-37 | Unrelated | Ignore |
