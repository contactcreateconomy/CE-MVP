# SLICE CATALOG — BUILD PHASE 7-TRUST: NOTIFICATIONS, APPEAL, LEGAL, TRUST PAGES, LANDING, CMP

**Date:** 2026-08-29 · **Phase order source:** AUDIT-FINAL.md Part D (corrected build order)
**Sub-batch:** 7-TRUST of remaining Phase-7 firings (7-ECON already cataloged; this firing is the legal/trust/entry remainder 7-ECON fenced as "7-LEGAL"). **7-GROWTH** = `SLICE-CATALOG-PHASE7-GROWTH.md`. **7-OPS** = `SLICE-CATALOG-PHASE7-OPS.md`. Slice IDs are `SLICE-P7T-*`.
**Basis:** `CAPABILITY-REGISTER-MERGED.md` (572 rows) · `_data-model.md` · `OPEN-DECISIONS.md` (live 2026-08-29) · `contracts/wave-7/CONTRACT-7-notifications-FINAL.md` · `CONTRACT-7-appeal-FINAL.md` · `CONTRACT-7-legal-intake-FINAL.md` · `CONTRACT-7-repeat-infringer-FINAL.md` · `CONTRACT-7-trust-pages-FINAL.md` · `CONTRACT-7-landing-FINAL.md` · `CONTRACT-7-cmp-FINAL.md` · `contracts/wave-1/CONTRACT-1-app-shell-FINAL.md` (F-15 convention) · `CONTRACT-1-legal-pages-FINAL.md` (P2-07, do not re-slice) · AUDIT-FINAL F-14/F-15/F-16/F-33 · Phase 1 P1-02/P1-03 · Phase 2 P2-05/P2-06/P2-07/P2-08 · Phase 5 P5-05/P5-07 · Phase 6 P6-07/P6-13 · Phase 7-ECON P7E-10/14/15/16
**Sizing-rule addendum applied:** every cited bullet checked for ellipsis/`{…}`/"see X" incompleteness. **Two true ellipses at catalog time:** (1) bible `notifications` — **F-18 field list landed in the 2026-08-29 Phase-1 described-vs-applied correction pass** (verbatim from `M14-onboarding.md` l.61). P7T-01 **consumes** that bible bullet + P1-02's schema contract — does **not** back-fill the bible and does not redesign the table. (2) bible `consentRecords` l.305 is still `…` — complete list at `M18-reliability.md` l.74 (`userId?, anonymousConsentId?, policyVersion, purposesGranted[], purposesDenied[], jurisdictionClass, collectionSurface, grantedAt, withdrawnAt?, supersededAt?, evidenceHash`). P7T-13 still back-fills that one. **Not this batch's sources:** bible `users.activationProgress` (7 bits **stop-and-report** 2026-08-29 — not locked on confirmed M14); F-35 `policyFamily` (INV-2 literals — P7T writers that attach cases use the field structurally; stop-and-report if a named family literal is required). `legalIntake` bible now includes `ackDueAt`/`actionDueAt` plus the 2026-08-29 P1-03 remainder (`payloadHash`, `counterNoticeId?`, `operatorUserId?` from M13 l.77).
**Phase boundary (this firing only):** `/notifications` · `/appeal/[actionId]` submit · `/legal/intake` · `/repeat-infringer` · six trust-policy destination routes · F-14 landing waitlist-CTA wire · CMP overlay (CAP-504–506). **Not this firing:** `/privacy` `/dmca` `/terms` (already P2-07 shells) · P7E-16 appeal **resolve**/SLA (CAP-341/342 — consume) · CAP-345–347/349/351–353 off-screen follow-ons · CAP-218 (P6-15) · analytics/SEO/UTM · reliability/readiness · `/admin/home` · M14 visit/coach/drip remainder · mute-toggle (no CAP).

---

## Extra-scrutiny confirmations (founder-debt + no-duplication)

### V1. F-16 — legal/trust content storage/publish/version — still OPEN

**Ledger:** OPEN-DECISIONS **E6** (l.18) still OPEN — "Legal content source & publish trigger undefined … no `systemConfig` publish key exists in any source file." E5 (`/terms` trigger on CAP-027) also still OPEN. F-16 is the audit ID for E6; it is **not** a separate ledger row. Trust-pages OQ#1 residual and repeat-infringer OQ#3 are the same class.

**Phase 2 already shipped:** SLICE-P2-07 built `/privacy` `/dmca` `/terms` as one template (720px · Wordmark-only · outside ConsentProvider · `unavailable_pending_legal` + noindex). Content render **fenced**. **Do not re-slice those three routes.**

**This batch:** new routes (`/about` `/help` `/how-we-review` `/editorial-policy` `/ai-disclosure` `/how-we-use-your-store-data` `/repeat-infringer`) get the **same shell treatment** — route + legal-layout family + pending state. Published-content storage is **blocked-pending-F-16**. Do not invent DB vs static vs `wiki.deploySync`.

### V2. F-33 — legal-intake procedure gaps — still OPEN (not a ledger row)

**Ledger:** no `F-33` row in OPEN-DECISIONS.md. Live status is AUDIT-FINAL F-33 + legal-intake contract OQ#4 / #7 / #8:

- OQ#8 identity verification for counter-notice + erasure — **unspecified**
- OQ#7 anonymous CAP-217 dedupe/rate-limit — **unspecified**
- OQ#4 statutory-clock **holiday-aware live countdown** (CAP-404 Asia/Kolkata + India holidays) — **unspecified** on this screen

**What CAN be built:** intake form structure; CAP-217/343/344/348/350/058 writes to existing P1-03 `legalIntake`; CAP-348 **writes** `ackDueAt=+24h` / `actionDueAt=+15d` (register Notes, quoted below); **display of those stored timestamps**. Schema clocks exist (bible l.241).

**Fenced:** identity-proof upload/KYC; invented CAP-217 rate keys; India-holiday countdown (render stored instants; do not invent a holiday calendar). `merchant_ip` dual-path (OQ#3) — no intake CAP on this screen; M11 CAP-268 remains the writer; do not invent a second path.

### V3. F-15 — Platform-Wide Routing Convention — RESOLVED

**Ledger:** OPEN-DECISIONS archive **E3 + X1** (2026-08-26). Written into `CONTRACT-1-app-shell-FINAL.md` §1 (four rules). Implemented as shared helper in **SLICE-P2-06**.

**This batch:** landing and CMP **reference** `lib/routing.ts` (or successor). They do not re-derive redirects.

- Landing `/` is **anonymous §12.3**, not a protected route (convention rule 1 N/A). Authenticated `/` is Feed (landing contract §1) — already P2-08.
- CMP is a slot, not a route.
- `/notifications` and `/appeal/[actionId]` **are** protected member routes → convention rule 1 (anon → `/signin`) + rule 2 (`pending_context` → `/welcome`) + rule 4 (CAP-005). Consume P2-06; do not fork.

### V4. F-14 — landing waitlist CTA → CAP-014 — still OPEN; P2-08 did **not** close it

**Ledger:** no `F-14` row. Live status is AUDIT-FINAL F-14 + landing OQ#2 + P2-08 fence (quoted): "waitlist-mode CTA submit delegation (F-14 — CAP-478 writes only `rawEvents`; delegation to CAP-014 unspecified) — form renders, submit wiring fenced."

**Already built, consume:** P2-05 implements `waitlist.join` (CAP-014). P2-08 implements landing layout + CAP-464/465 UTM + three-mode CTA **render**.

**This batch (P7T-12):** wire the waitlist-mode landing CTA to **existing** CAP-014. That is the audit Part C #9 one-line ("CTA delegates to CAP-014 `waitlist.join`") — not a second waitlist mutation, not a landing rebuild. **Do not silently patch P2-04** (`/signin` waitlist-mode submit is the same class, contract OQ3, not in this firing's list).

### V5. CAP-568 vs CAP-570 — distinct tables; do not duplicate Journal

| Path | Table | Owner | This batch |
|---|---|---|---|
| **CAP-568** `notifications.list` | `notifications` | P1-02 schema; P7T-01 query | **Build the list-read** |
| **CAP-386** `notifications.markRead` | `notifications.readAt` | P7T-01 | **Build** |
| **CAP-570** `activity.append` | `activityLedger` | P5-05 helper; call-sites P5-02/03/11, P6-07, P7E-09 | **Do not call from notification mutations** |
| Journal Summary/Ledger | `activityLedger` reads | P5-07 | **Do not re-read here** |

The firing's "CAP-570 call-site" on `/notifications` is a **non-duplication check**, not a new append. Notification kinds are not the six v1 ledger event types.

### V6. CMP — extend P2-06; do not rebuild the slot. Distinct from M7 profile consent.

P2-06 reserved the CAP-025 slot with CAP-504 **default-deny** (E2 resolution; ledger E2 now archived). This batch fills CAP-505/506 UI + `consentRecords` writes. P5-06 already owns `profile.consentRecord` / `profile.consentWithdraw` on `userConsentRecords`. CMP surfaces **M18 purposes only** (cmp contract Entities, quoted). Do not merge tables. CAP-506 ↔ CAP-453/454 vendor-delete wiring is OQ#3 — fence; do not invent a second erasure pipeline. **P7O-08** owns 453/454; this firing does not call it.

### V7. CAP-324 — settled; do not re-litigate

Comment-flag target = **comment**. Appeal/moderation surfaces cite it only if a notification or appeal links a comment report. P7E-12 owns `report.submit`. This batch does not rebuild reporting.

### V8. P7E-16 already owns appeal **resolve** (CAP-341/342)

P7T-04 is **CAP-340 submit** on `/appeal/[actionId]` only. Console resolve/SLA stay P7E-16. Submit populates the "appeals near bound" column P7E-16 currently fixtures.

---

## SLICE-P7T-01 — `/notifications` list + mark-read (CAP-568 / CAP-386)

- **CAP-IDs covered:** CAP-568, CAP-386
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-notifications-FINAL.md` (§1, §3 B/E/F, §4) · `M14-onboarding.md` l.61 (field list) · register CAP-568 / CAP-386
- **Depends on:** SLICE-P1-02 (`notifications` schema substrate), SLICE-P2-06 (convention — protected route), SLICE-P2-03 (member session)
- **Scope:** Bible `notifications` field list **already transcribed** (2026-08-29 correction pass — F-18). Implement `notifications.list` (recipient-private, newest-first) and `notifications.markRead`. Build `/notifications` on §11.3 cards. Empty state uses CAP-371 honest-empty **rules** (quoted: "no fabricated counts") — do not implement the full CAP-371 surface. **Do not read `activityLedger`.** Mute-toggle has no CAP (OQ#3) — not built. Delete/clear has no CAP (OQ#4) — not built. Pagination page-size is OQ#6 — use cursor pagination; stop-and-report if a named page-size exists nowhere; do not invent a product number (implementation-local `initialNumItems` flagged).
- **Files touched (expected):** `convex/notifications.ts`; `app/notifications/` — **not** `_data-model.md` (bible already filled).
- **Acceptance criteria:** CAP-568 Notes (quoted): "Recipient-private: returns only the authenticated member's own notifications. Ordering newest-first" + kind set "quota_exhausted / quota_restored / reply / saved / distribution-join / drip_batch / mod-transactional." CAP-386 (quoted): "mark read" — Writes `notifications.readAt`. Contract States F (quoted): "loading → populated → empty → error." Contract §1 (quoted): "a member must never read/mutate another member's records." DEC-P13 (quoted via contract States A): "No Might-shame copy."
- **Size check:** ≤2 days — one query, one mutation, one list screen. Schema contract specified in P1-02 (Phase 5); bible copy already done.

## SLICE-P7T-02 — Quota notification writers (blocked-acquire + restored)

- **CAP-IDs covered:** CAP-378, CAP-379
- **Source contract(s):** notifications contract §3 A, §4 System rows · register CAP-378/379
- **Depends on:** SLICE-P7T-01 (table + kinds), SLICE-P6-07 (`resource.acquire` / quota ledgers), SLICE-P1-07 (rawEvents)
- **Scope:** On blocked acquire (CAP-377/212 quota exhausted), CAP-378 inserts `quota_exhausted` + sets `users.lastQuotaExhaustedPeriodKey` + rawEvents. **No "almost gone" nag.** CAP-379: on authenticated **session start** (register: "On session start/visit.commit"), if marker set ∧ ≠ current periodKey ∧ no unread `quota_restored` → emit once + clear marker. **`visit.commit` the full M14 machine is P7G-04** — this slice uses session-start as the in-app-only trigger the register already names; it does **not** invent qualifyMs/throttle. No midnight cron (quoted). Call-site is a hook inside existing acquire reject path — do not fork P6-07's quota math.
- **Files touched (expected):** `convex/notifications/quota.ts`; hook in `convex/resources.ts` (or acquire module from P6-07)
- **Acceptance criteria:** CAP-378 (quoted): "no 'almost gone' nag." CAP-379 (quoted): "no per-timezone midnight cron; in-app only." Marker cleared only after successful restored-emit. Same-mutation rawEvents (CAP-436).
- **Size check:** ≤2 days — two writers + two call-sites. Quota arithmetic stays P6-07.

## SLICE-P7T-03 — Notification dedupe/batch (CAP-382) + brigade hook (CAP-383, consume)

- **CAP-IDs covered:** CAP-382; CAP-383 (hook only — writes `moderationCases` via existing P7E-15 CAP-326 path, does not re-implement brigade)
- **Source contract(s):** notifications contract §3 A/C/D · register CAP-382/383 · M14 R-NOTIFY
- **Depends on:** SLICE-P7T-01, SLICE-P5-02/03 (comment/save writers), SLICE-P7E-02 or join mutation if distribution-join exists, SLICE-P7E-15 (CAP-326) optional
- **Scope:** DedupeKey = recipient+type+object+window. Batch windows (quoted): reply **15m**, saved **24h**, distribution join **6h**, drip one per batch. Mute suppresses **social kinds only — never legal/mod** (mute **setter** still has no CAP — honor the invariant if a mute flag already exists on schema; if not, ship unmute-all and flag OQ#3). Reply flood → CAP-383 hook into CAP-326; **never drop a real reply**. CAP-382 writes **no rawEvents** (contract §5 — do not silently add). Call-sites on existing comment/save/join mutations — same-mutation insert/upsert notification row, not a parallel ledger write.
- **Files touched (expected):** `convex/notifications/batch.ts`; call-sites in comments/saves/distribution join
- **Acceptance criteria:** CAP-382 Notes (quoted): "mute suppresses social not legal/mod; reply flood → M13 R-BRIGADE hook." M14 R-NOTIFY (quoted): "dedupeKey = recipient+type+object+window; batch reply 15m, saved 24h, distribution join 6h, drip one per batch." CAP-383 (quoted): "never drop a real reply." If P7E-15 is absent, flood still never drops the reply and flags the hook as degraded.
- **Size check:** ≤2 days — one batch helper + three call-sites. Drip-batch emit stays with **P7G-05** `drip.release` — this slice only defines the window rule so that cron can attach; do not invent `drip.release` here.

## SLICE-P7T-04 — `/appeal/[actionId]` submit (CAP-340)

- **CAP-IDs covered:** CAP-340
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-appeal-FINAL.md` (§1–§4) · register CAP-340
- **Depends on:** SLICE-P7E-15 (CAP-336 sanction exists), SLICE-P7E-10 (`moderationActions` / cases), SLICE-P7E-16 (resolve/SLA **consume** — not rebuilt), SLICE-P2-06 (protected route), SLICE-P1-06 (auditLog)
- **Scope:** Member submits one appeal per action. Gates: already appealed · 14d content / 30d terminate · >2,000 chars · >3 evidence refs · URLs hard-reject · not-appealable · not-owned. Writes `moderationCases` + `auditLog`. **Does not decide** (CAP-341 is P7E-16). Withdraw/amend: no CAP — not built. Deadline-expiry UI vs server-reject is OQ#3 — **server-reject is mandatory**; UI-disable is additive. Sanction-class field for 14d/30d is OQ#1 — stop-and-report if the read set cannot distinguish content vs terminate; do not invent a new column (use `moderationActions.action` if that union already contains terminate).
- **Files touched (expected):** `convex/appeal.ts`; `app/appeal/[actionId]/`
- **Acceptance criteria:** CAP-340 trigger (quoted): "one/action; 14d content/30d terminate; max 2k chars; ≤3 evidence refs; no URLs." Contract §1 (quoted): "This route submits the appeal; it does not decide it." Queue placement (quoted): "appeals near bound" in CAP-330 order. No rawEvents (contract §5 — do not add).
- **Size check:** ≤2 days — one form + one mutation. Evidence-ref entity (OQ#4) — URL-free ids only; if format unspecified, accept existing post/comment/moderationAction ids and reject URLs (already a gate).

## SLICE-P7T-05 — `/legal/intake` shell + DMCA intake (anonymous CAP-217 + authenticated CAP-343)

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #6:** DMCA intake identity = statutory minimum (legal name, physical address, email, signature attestation — 17 U.S.C. §512); rate limit 5/24h per email+IP; dedupe (submitter, target, claim type) over rolling 24h; SLA clock = US business days. Build these fields/limits.

- **CAP-IDs covered:** CAP-217, CAP-343
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-legal-intake-FINAL.md` (§1, §3 A, §4, §6) · register CAP-217/343 · bible `legalIntake` l.241
- **Depends on:** SLICE-P1-03 (`legalIntake` schema), SLICE-P2-06 (legal layout family / convention), SLICE-P1-06 (auditLog), SLICE-P7E-10 (cases attach)
- **Scope:** Build `/legal/intake` form-set shell (720px reading column, legal-layout family). Anonymous/webhook branch: `dmca.intake` writes `legalIntake (type=dmca_notice, status=received)`. Authenticated: `legal.intake` writes legalIntake + moderationCases + auditLog; subjectClass `{ugc|operator_published|store_listing}`; internal clocks ack 3bd / action 10bd **stored on the row**. Shared clock **display** reads `ackDueAt`/`actionDueAt` as stored instants (F-33: no India-holiday countdown invented). **F-33 fences:** CAP-217 anonymous **rate-limit/dedupe unspecified** — form submits; do not invent keys (contrast CAP-325, do not copy). Designated public agent contact: launch-blocking infra (CAP-217 Notes) — render a config-keyed contact string if present; stop-and-report if missing rather than invent copy. Absorbed-entity discipline: **no `dmcaNotices` / `takedownRequests` tables.**
- **Files touched (expected):** `convex/legal/intake.ts`; `app/legal/intake/`
- **Acceptance criteria:** CAP-217 Notes (quoted): "Writes retargeted `dmcaNotices` → `legalIntake`." CAP-343 Notes (quoted): "DMCA ack 3bd / action 10bd internal." Bible l.241 (quoted): "Absorbs prior thin `dmcaNotices` / publisher `takedownRequests`." Contract §5 (quoted): "Legal intake is deliberately outside the event stream" — no rawEvents. CAP-028 (quoted): legal "remains reachable when the CMP has crashed" — this route sits in the legal layout family (no ConsentProvider), same carve-out as P2-07.
- **Size check:** ≤2 days — shell + two intake mutations. Remaining form types are P7T-06/07.

## SLICE-P7T-06 — Counter-notice, Grievance India, erasure submit (CAP-344 / 348 / 350)

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #6:** counter-notice/grievance/erasure forms use verified-email-only identity; same rate/dedupe/SLA-clock rules as P7T-05.

- **CAP-IDs covered:** CAP-344, CAP-348, CAP-350, CAP-361
- **Source contract(s):** legal-intake contract §3 B/D/E · register CAP-344/348/350
- **Depends on:** SLICE-P7T-05 (shell + clock display), SLICE-P1-03, SLICE-P2-03 (member), SLICE-P7E-10
- **Scope:** Three authenticated form branches on the same route. CAP-344: facially complete → always intake-eligible; deficient-reject. **CAP-361** is the **System writer** for the abuse-chill counter (2 rejected-deficient / 90d → expedited path removed 180d) — count from existing `legalIntake` rows; do not invent a new table; **never refuse a facially complete counter**. CAP-348: write `ackDueAt=+24h`, `actionDueAt=+15d`; clocks **published on-page** via P7T-05 display (stored instants). CAP-350: submit erasure; anonymize PII + tombstone; **never delete** strikes / auditLog / legalIntake / moderationActions. **F-33 fence:** identity-verification procedure unspecified — do **not** invent ID-document upload; facial completeness (344) and authenticated session (348/350) are the gates that exist. CAP-345 provisional strike, CAP-346 restore cron, CAP-349 expedited clock, CAP-351 outcome — **off-screen, not built here** (flag).
- **Files touched (expected):** `convex/legal/counterNotice.ts`; `convex/legal/grievance.ts`; `convex/legal/erasure.ts`; form branches on `app/legal/intake/`
- **Acceptance criteria:** CAP-344 Notes (quoted): "always intake-eligible when facially complete" + "abuse chill: 2 rejected-deficient /90d → remove expedited 180d." CAP-361 Notes (quoted): "never refuse facially complete counter." CAP-348 Notes (quoted): "statutory clocks PUBLISHED (INV-12a)" + register trigger "ackDueAt=+24h, actionDueAt=+15d." CAP-350 Notes (quoted): "anonymize PII + tombstone; never delete strikes/auditLog/legalIntake/moderationActions." No rawEvents.
- **Size check:** ≤2 days — three mutations, one shared shell. Identity fence is what keeps it inside the cap.

## SLICE-P7T-07 — Operator source takedown (CAP-058 / 059 / 060)

- **CAP-IDs covered:** CAP-058, CAP-059, CAP-060
- **Source contract(s):** legal-intake contract §3 C, §4 · register CAP-058/059/060 · Wave 4 E2 (full escalation wires when `/legal/intake` exists)
- **Depends on:** SLICE-P7T-05, SLICE-P4-08 (`sources` / claims tables), SLICE-P3-01 (Moderator), SLICE-P1-06
- **Scope:** Moderator files `takedown.intake` → `legalIntake (type=source_takedown)`. `takedown.action` blocks source + sets legalIntake status actioned/resolved. CAP-060 re-eval: **keep post if ≥2 other independent sources remain, else archive + operator review.** Operator branch lives on `/legal/intake` (contract §1). CAP-059/060 action-UI home vs `/admin/sources` is OQ#2 — **mutations land here**; a second admin-sources button is not required this slice (flag). CAP-347 operator_published pager is off-screen (flag). Wave 4 CAP-031 minimal block stays; this is the full legal path.
- **Files touched (expected):** `convex/legal/takedown.ts`; operator branch on intake UI
- **Acceptance criteria:** CAP-058 Notes (quoted): "Writes retargeted `takedownRequests` → `legalIntake (type=source_takedown)`." CAP-059 Notes (quoted): "Block source; re-evaluate linked candidates/posts." CAP-060 Notes (quoted): "Keep post if ≥2 other independent sources remain (drop the source); else archive + operator review." Zero live `takedownRequests` writes.
- **Size check:** ≤2 days — two mutations + one system re-eval. Re-eval can be same-transaction from CAP-059 (CAP-060 gated by 059).

## SLICE-P7T-08 — `/repeat-infringer` public policy page (CAP-339)

- **CAP-IDs covered:** CAP-339
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-repeat-infringer-FINAL.md` · register CAP-339
- **Depends on:** SLICE-P2-06 (legal layout family), SLICE-P2-07 (template pattern — **do not duplicate** privacy/dmca/terms files; reuse layout)
- **Scope:** Public anonymous route. Render-only. **E3:** no per-user `strikes`/`users` queries. Policy text + precomputed aggregates only. **F-16 fence:** content source unowned (OQ#3) — ship `unavailable_pending_legal` + noindex until F-16; do not invent storage. Aggregate counts: if no admin-published aggregate row exists, render policy-pending without inventing a statistics table (stop-and-report rather than query live strikes). Indexability OQ#2 — not in CAP-486 noindex list; **fail-closed noindex** until F-16 publish (same as P2-07).
- **Files touched (expected):** `app/(legal)/repeat-infringer/page.tsx`
- **Acceptance criteria:** CAP-339 Notes (quoted): "The page shows: (1) the policy text itself, (2) aggregate statistics only … per-user moderation data never surfaces on an unauthenticated public route." Writes: none. Authenticated users see the same public content (contract §1).
- **Size check:** ≤2 days comfortably — one static route; F-16 fence keeps it thin. CAP-338 is P7T-09, not this slice.

## SLICE-P7T-09 — Repeat-Infringer evaluate cron (CAP-338)

- **CAP-IDs covered:** CAP-338
- **Source contract(s):** register CAP-338 · repeat-infringer contract §2 (policy reference) · bible `strikes`
- **Depends on:** SLICE-P7E-10 (`strikes`), SLICE-P7E-15 (CAP-336 terminate path), SLICE-P1-04 (jobCatalog), SLICE-P1-06
- **Scope:** Cron `ri.evaluate`: 3 valid copyright strikes / 12 months → TERMINATED. Counter-notice/withdrawal/reversal **voids a strike retroactively → reinstate if <3**. Writes users standing + moderationActions + auditLog. Does **not** power the public page's per-user view (P7T-08 must still not read this). Register Gated-by CAP-336 is the terminate capability, not a UI gate on `/repeat-infringer`.
- **Files touched (expected):** `convex/jobs/repeatInfringer.ts`
- **Acceptance criteria:** CAP-338 Notes (quoted): "counter-notice/withdrawal/reversal voids strike retroactively → reinstate if <3." CAP-337 (P7E-15) remains the human terminate mutation; this cron applies the RI **policy** standing write. Strike class for "valid copyright" is `copyright_rights` (bible `strikes.class` — already enumerated).
- **Size check:** ≤2 days — one cron + tests against voided strikes. 12-month window uses `strikes.createdAt` / `expiresAt` as already modeled; do not invent a parallel ledger.

## SLICE-P7T-10 — Trust & policy destination routes (six)

- **CAP-IDs covered:** CAP-562, CAP-563, CAP-262 (content host only — **write already P6-13**), destinations for CAP-468/469
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-trust-pages-FINAL.md` · register CAP-562/563/262
- **Depends on:** SLICE-P2-06/07 (legal layout; **do not re-slice** `/privacy` `/dmca` `/terms`), SLICE-P6-13 (CAP-262 `dataUseVersion` writer — consume)
- **Scope:** Six anonymous routes, one shared template: `/how-we-review` · `/editorial-policy` · `/ai-disclosure` · `/about` · `/help` · `/how-we-use-your-store-data`. Same family as P2-07: 720px · Wordmark-only · no ConsentProvider · `unavailable_pending_legal` + noindex. **F-16 fence on all six** — no storage model. CAP-262 **acceptance mutation is not rebuilt** (P6-13 `store.apply.acceptDataHonesty`). This surface hosts the content pointer only. CAP-563 Notes (quoted): "content is founder-owned help text, NOT a support-ticket surface." CAP-468/469 **host-page footers** are P7T-11.
- **Files touched (expected):** `app/(legal)/how-we-review|editorial-policy|ai-disclosure|about|help|how-we-use-your-store-data/`
- **Acceptance criteria:** CAP-562 Notes (quoted): "Mirrors CAP-027's exact pattern … static render, no API … no-ConsentProvider." CAP-563 same pattern. CAP-262 (quoted): "/how-we-use-your-store-data page; aggregate-only disclosed" — page is read-only here. Contract §1 (quoted): "six share one template, not six contracts."
- **Size check:** ≤2 days — six thin routes + one template; F-16 fence is the size control (same as P2-07's three).

## SLICE-P7T-11 — Provenance + AI-disclosure footers on existing host pages (CAP-468 / CAP-469)

- **CAP-IDs covered:** CAP-468, CAP-469
- **Source contract(s):** trust-pages contract §3 A–C, §4 · register CAP-468/469 · FATAL-M17-01/02
- **Depends on:** SLICE-P7T-10 (destination routes exist, even if pending), SLICE-P4-04/05 (posts/tools indexable hosts), SLICE-P5-09 (persona hosts), SLICE-P6-07 (resources)
- **Scope:** On indexable host pages, always render provenance block + footer links to `/how-we-review` · `/editorial-policy` · `/ai-disclosure`. Persona/AI-assisted hosts: visible AI label + machine-readable provenance; `/ai-disclosure` is the responsibility-holder page (destination may still be pending). **Do not invent body copy for the destination routes** (F-16). CAP-466 `assertIndexable` remains the indexability gate (P4) — this slice adds the footer, does not flip noindex. Art. 50 confirm is a **process gate listed not designed** (contract States C) — not a form in this slice.
- **Files touched (expected):** provenance footer component; call-sites on post/tool/resource/persona page queries
- **Acceptance criteria:** CAP-468 Notes (quoted): "Always render provenance block + footer links to /how-we-review · /editorial-policy · /ai-disclosure." CAP-469 Notes (quoted): "Visible AI label + machine-readable provenance; /ai-disclosure states editorial responsibility holder." Provenance rendering "must not generate Signal or Recognition" (contract §5).
- **Size check:** ≤2 days — one shared footer + four host call-sites. Body-contract OQ#4 is F-16, not this slice.

## SLICE-P7T-12 — Landing waitlist CTA delegates to CAP-014 (F-14 close)

- **CAP-IDs covered:** CAP-478 (waitlist-mode **submit wire only**). CAP-464/465 **already P2-08 — consume, do not re-implement.**
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-landing-FINAL.md` OQ#2 · AUDIT-FINAL Part C #9 · register CAP-014 / CAP-478
- **Depends on:** SLICE-P2-08 (landing render + UTM), SLICE-P2-05 (`waitlist.join`), SLICE-P2-01 (`effectiveSignupMode`)
- **Scope:** When `effectiveSignupMode=waitlist`, landing primary CTA submit calls existing `waitlist.join` (CAP-014). Still emit CAP-478 mode-annotation `rawEvents`. **No L08 signup_completed.** **No users/role write** (CAP-014 invariant). Open/closed modes unchanged from P2-08. Do not rebuild §12.3 layout, UTM capture, or dictionary. Do not patch `/signin` waitlist submit (P2-04 OQ3). CAP-478 Actor drift (F-07) — keep P2-08's documented anonymous render; register edit is doc-sync, not this slice.
- **Files touched (expected):** landing CTA handler in `app/page.tsx` (or P2-08 module); no new mutation
- **Acceptance criteria:** AUDIT-FINAL F-14 close (quoted intent): CTA "delegates to CAP-014 `waitlist.join`." CAP-014 Notes (quoted): "publicMutation; not a users row; no role." CAP-478 Notes (quoted): "waitlist → email capture only (no L08 signup_completed)." CAP-015 rate gates already on `waitlist.join` apply (10/h ip · 3/24h email).
- **Size check:** ≤2 days comfortably — one submit wire + tests. The landing itself is not in scope.

## SLICE-P7T-13 — CMP overlay: consent.record / consent.withdraw (CAP-504–506)

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #7:** consent withdrawal now WIRES to vendor deletion via the approved outbox pattern (durable deletion-requested record → background job calls PostHog deletion API with retry → pending/confirmed status visible to admin). The prior "do not call CAP-453/454" fence is REMOVED.

- **CAP-IDs covered:** CAP-504, CAP-505, CAP-506
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-cmp-FINAL.md` · register CAP-504/505/506 · `M18-reliability.md` l.74
- **Depends on:** SLICE-P2-06 (slot + default-deny + CAP-028 degrade + provider order), SLICE-P1-07 (rawEvents never consent-gated)
- **Scope:** Back-fill bible `consentRecords` from M18 l.74. Fill the reserved slot: banner (strictly_necessary on, non-negotiable) + preferences (four purposes: strictly_necessary · functional · analytics · marketing) + `consent.record` / `consent.withdraw`. Analytics/PostHog **not injected until grant**. Withdrawal stops future capture; **rawEvents continue**. **Extend P2-06; do not remount the provider chain.** Distinct from P5-06 profile consent. **Fences:** anonymous persistence key + stitch (OQ#2 / CAP-387) — member path ships; anonymous grant stop-and-report rather than invent a cookie scheme if `anonymousConsentId` cannot be bound without CAP-387. CAP-506 "vendor delete path" vs CAP-453/454 (OQ#3) — **P7O-08 owns the `analyticsDeletionRequests` mutations.** This slice must **not** call them and must **not** invent a second erasure pipeline. Initiate a **flagged no-op or stop-and-report** on withdraw until a founder call wires OQ#3. Filling `consentRecords` from M18 l.74 unblocks **CMP CAP-504–506 only** — it does **not** unblock 453/454 (different table). Functional/marketing vendor bindings OQ#6 — toggles persist; no invented third-party SDKs.
- **Files touched (expected):** `_data-model.md` (consentRecords bullet + revision); `convex/consent.ts`; CMP overlay in the P2-06 slot
- **Acceptance criteria:** CAP-504 Notes (quoted): "strictly_necessary always (incl. server rawEvents); analytics → PostHog NOT injected until grant." CAP-505 Notes (quoted): "Granular purposes: strictly_necessary · functional · analytics · marketing." CAP-506 Notes (quoted): "Withdrawal stops future capture; rawEvents NOT consent-gated; vendor delete path." CAP-025 order unchanged (quoted): "ErrorBoundary → CMP slot (M18) → BetaBanner → children." CAP-028 (quoted): "App stays up; analytics denied; legal still up."
- **Size check:** ≤2 days, full — schema transcription + overlay + two mutations. Anonymous/vendor fences subtract scope. Split line: member grant/withdraw vs anonymous stitch if CAP-387 binding blocks — flagged, not pre-split.

---

## Dependency graph (within Phase 7-TRUST)

Ordered list; items on the same line are parallelizable after their dependencies land.

1. **SLICE-P7T-01** (notifications list + mark-read) — after P1-02 / P2-06; blocks 02, 03
2. **SLICE-P7T-02** (quota notifs) — after 01 + P6-07
3. **SLICE-P7T-03** (batch/dedupe) — after 01 + P5-02/03; parallel with 02
4. **SLICE-P7T-04** (appeal submit) — after P7E-15/16 + P2-06; parallel with notifications
5. **SLICE-P7T-05** (legal shell + DMCA) — after P1-03 / P2-06 / P7E-10; blocks 06, 07
6. **SLICE-P7T-06** (counter / India / erasure) — after 05
7. **SLICE-P7T-07** (operator takedown) — after 05 + P4 sources; parallel with 06
8. **SLICE-P7T-08** (RI public page) — after P2-06/07; parallel with legal writers; F-16-fenced regardless of order
9. **SLICE-P7T-09** (ri.evaluate cron) — after P7E-10/15; parallel with 08
10. **SLICE-P7T-10** (trust destination routes) — after P2-06/07; F-16-fenced; parallel with 08
11. **SLICE-P7T-11** (host provenance footers) — after 10 + P4/P5/P6 hosts
12. **SLICE-P7T-12** (F-14 landing wire) — after P2-05/08; parallel with everything except it must not rebuild landing
13. **SLICE-P7T-13** (CMP machinery) — after P2-06; parallel with trust/legal (legal routes remain outside ConsentProvider)

**CAP-057-class ownership line (notifications):** list-read is **P7T-01** (CAP-568). Emit is **P7T-02/03**. Journal/ledger-read stays **P5-07**. A slice that lists `activityLedger` on `/notifications` fails the batch.

**CAP-057-class ownership line (appeal):** submit is **P7T-04** (CAP-340). Resolve/SLA is **P7E-16** (CAP-341/342). Do not merge.

**CAP-057-class ownership line (legal content):** P2-07 owns `/privacy` `/dmca` `/terms` shells. This batch owns **new** legal-family routes only. Content storage is **nobody** until F-16.

**Phase 7-TRUST exit gate (this sub-batch):** (1) `/notifications` shows only the session member's rows, mark-read persists, quota/batch writers do not touch `activityLedger`. (2) `/appeal/[actionId]` submits under CAP-340 gates; P7E-16 still decides. (3) `/legal/intake` accepts DMCA / counter / India / erasure / operator takedown into `legalIntake` (never `dmcaNotices`/`takedownRequests`); identity-proof and invented 217 rate-limits absent by fence; India clocks **display stored** `ackDueAt`/`actionDueAt`. (4) Trust + RI + legal-family new routes exist as pending shells; `/privacy` `/dmca` `/terms` untouched. (5) Landing waitlist CTA persists via CAP-014. (6) CMP grant/withdraw works for members; PostHog still absent pre-grant; P2-06 slot/order unchanged.

---

## Flags carried forward (stated, not silent)

- **F-16 / E6 / E5** — content storage/publish/version + `/terms` CAP-027 trigger. All new legal-family routes pending. Do not invent.
- **F-33 / legal OQ#4/#7/#8** — holiday countdown, 217 rate-limit, identity proof. Fenced in P7T-05/06.
- **F-35** — `policyFamily` literals. Structural field only until founder enum.
- **F-14 ledger hygiene** — implementation closes the hole in P7T-12; OPEN-DECISIONS has no F-14 row (same as F-33). Founder may archive when confirming this sub-batch.
- **F-07** — CAP-478 Actor=member vs Visitor; P2-08 documented intent stands.
- **CAP-345 / 346 / 347 / 349 / 351 / 352 / 353** — off-screen follow-ons (provisional strike, restore cron, pager, expedited grievance, erasure outcome, preserveUntil, hard-harm deferred). Not dropped.
- **CAP-218** — already P6-15; not re-sliced.
- **CAP-383** — hook only; brigade engine is P7E-15.
- **Mute-toggle + teardown/clear** — no CAPs (notifications OQ#3/#4).
- **`visit.commit` / drip.release / CAP-366** — **P7G-04** (`visit.commit` + since) · **P7G-05** (`drip.release`). P7T-02 still uses session-start as the in-app restored trigger; P7T-03 does not invent the drip cron. CAP-366 remain Phase-5 flag.
- **CAP-387 anonymous→member consent stitch** — CMP OQ#2; fenced in P7T-13.
- **CAP-453/454 vendor delete** — **P7O-08** (M16 analytics erasure). CMP OQ#3 remains fenced on P7T-13 (do not auto-wire CAP-506). Filling `consentRecords` does not unblock these.
- **merchant_ip intake CAP** — OQ#3; CAP-268 remains M11 path.
- **CAP-059/060 UI home vs `/admin/sources`** — OQ#2; mutations on intake this firing.
- **P2-04 `/signin` waitlist submit** — same class as F-14, **not** patched here.
- **P1-02 bible remainder** — **closed** by the 2026-08-29 Phase-1 described-vs-applied correction pass (F-18 `notifications` + F-13 `waitlistEntries`), not by P7T-01. P7T-01 consumes the filled `notifications` bullet. Waitlist is not redesigned in 7-TRUST.
- **E1 BetaBanner** — still OPEN; CMP slot must not steal its mount.
- **CAP-324** — settled (comment target); do not re-litigate.
