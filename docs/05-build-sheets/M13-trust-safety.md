# DECISION — M13: Trust, Safety & Moderation (Build Sheet · CONFIRMED)

**Status:** **CONFIRMED + CLOSED** · BACKEND LOCKED · **DESIGN HIT** (GPT 91 / GLM 91 / Sonnet 79 / Opus 79) · **CONFIRMATION HIT** (GPT 92 / GLM 96 / Sonnet 91 / Opus 88 — mean ~91.8; C1–C5 + hardening baked 2026-08-06) · **Customer FE:** deferred to the FE PHASE (DEC-FE-DIVISION; §10 = reference) · **Date:** 2026-08-06  
**RACI:** R/A = PM · Consulted/Informed = GPT/GLM/Sonnet/Opus + Founder  
**Schema:** fills `M0-build-sheet-schema.md`. Canonical names = `_data-model.md`. Rounds: `Aggregated/m13-trust-safety.md` · confirm `Aggregated/m13-confirm.md` · surface constraint `Aggregated/m10-ugc-ab.md` (**DEC-M10-UGC-PILOT = OFF**). Founder regs: `FOUNDER-LEGAL-AND-REGISTRATIONS.md`.

**North star:** one **lean** ops spine for a soft beta run by **≈1–2 humans** — enterprise **patterns**, not ISO theatre. Every intake (report, auto-hold, DMCA, source takedown, merchant IP, appeal, integrity escalation) becomes a **`moderationCases`** record; humans decide sanctions; **no LLM auto-ban**; M12 owns scores and only consumes **confirmed facts** from M13. Fail-closed UGC publish (DEC-P02) stays; hold queues get a **forcing function** so “private forever” is never silent censorship — without fail-open aged publish.

> **Soft-beta surface (LOCKED).** Constellation UGC + custom avatar upload are **OFF**. This sheet **ships** for **posts/comments** (+ in-house resource / store case types that already exist). **Proactive file CSAM hash, quarantine-bucket ACL, and untrusted binary intake** are **specified but DEFERRED** until any user file/image upload is enabled — then they become launch-blocking for that flag. NCMEC **runbook** + **90-day preservation** (actual-knowledge) still ships at beta.

---

## 1. Header & Layer Profile
- **id:** M13 (trust, safety & moderation) · **purpose:** unified case spine; fail-closed auto-mod for UGC publish; report dedupe; severity queue + claim/lease; AccountStanding + capability sanctions; appeals; legal intake (DMCA / counter-notice / source / merchant / erasure); repeat-infringer; M12 clawback bridge; policy-as-config reason codes; audit; statutory preservation. · **owner:** PM · **status:** confirmed + closed.
- **dependencies (up):** M4 (no-URL reject) · M6 (reactions → mod signals; comment states) · M7 (verification, tiers = velocity not existence, open posting abuse stack) · M2 (`takedownRequests` / publisher content) · M10 (resource unpublish; UGC cascade **deferred**) · M11 (store strikes / merchant complaints → same spine) · **M12 (legitimacy damp ≠ ban; clawback on confirmed fraud; Recipient Neutrality; TrustTier = min(SignalCapacity, IntegrityCeiling, AccountStanding); badge revoke on fraud)** · DEC-P02 / DEC-P15 / DEC-P16. **(down):** M15 (renders queues) · M14 (onboarding copy hooks) · M16 (moderation analytics) · M18 (kill-switches / reliability).
- **Layer Profile:** Backend/Data = **Required** · Jobs (aging, lease expiry, appeal SLA, RI evaluate, legal restore, ingest throttle) = **Required** · Integration (optional classifier; deferred CSAM hash) = **Supporting / Deferred** · Admin-FE (queues) = **Required** (contracts; chrome in M15) · Customer-FE = **DEFERRED** · Analytics/Audit = **Required**.

## 2. Canonical Names & Enums
- **Tables (Bible "Trust & ops (M13)"):** `moderationCases`, `legalIntake`, `strikes`, `capabilityRestrictions`, `policyReasonCodes`, `appeals` *(or fold as `caseType=appeal` + uniqueness)*, deepened `reports`, `moderationActions`, `dmcaNotices`→absorbed into `legalIntake`, `takedownRequests`→`legalIntake` subjectClass, `trustHistory`, `auditLog`. Reuses: `users.accountStanding`, `integrityFlags` (M12), `systemConfig` / feature flags.
- **Enums:**
  - `moderationCases.caseType`: ugc_safety · ugc_conduct · spam_manipulation · account_integrity · store_commercial · merchant_ip · source_takedown · dmca · resource_rights · appeal · moderator_conduct · hard_harm *(Founder-only path)*
  - `moderationCases.status`: open · triaged · claimed · awaiting_user · awaiting_legal · awaiting_external · actioned · resolved_no_action · appealed · closed · auto_released_aged
  - `moderationCases.severity`: s0_critical · s1_high · s2_medium · s3_low
  - `AccountStanding`: good · warned · restricted · suspended · terminated
  - `strike.class`: content_conduct · spam_manipulation · commercial_integrity · copyright_rights · account_integrity
  - `legalIntake.type`: dmca_notice · dmca_counter_notice · source_takedown · merchant_ip · right_of_erasure · grievance_india
  - `legalIntake.subjectClass`: ugc · operator_published · store_listing
  - `legalIntake.erasureOutcome` *(when type=right_of_erasure)*: ERASE_PARTIAL · REFUSED_LEGAL_HOLD
  - `moderationActions.action`: hold · pass_publish · reject · remove · warn · strike · restrict_capability · suspend · terminate · restore · clawback_request · store_pause · reference_block *(dormant)* · legal_honour · legal_reject_deficient · auto_released_aged
  - `badge.revocationBasis` *(M12 bridge)*: fraud_confirmed · sanction · *(absence = ordinary M12 immutability)*
- **Functions:** `mod.autoGate` · `report.submit` · `case.claim`/`case.release` · `case.resolve` · `standing.apply` · `appeal.submit`/`appeal.resolve` · `legal.intake` · `legal.counterNotice` · `ri.evaluate` · `queue.age` (cron) · `lease.expire` (cron) · `legal.restoreEligible` (cron) · `m12.emitConfirmed` · `operator.queue` · `ingest.throttle` (flag).

## 3. Scope & Non-Goals
- **In (soft beta):** DEC-P02 fail-closed pipeline for posts/comments; report→deduped case; severity queue + aging + **allowlisted** S3 auto-release; AccountStanding + capability restrictions; warn/strike/suspend; **TERMINATED = Admin/Founder only**; appeals (one/action + resolve bound); legal intake + counter-notice (complete always eligible); RI policy; India grievance **with clocks**; Recipient Neutrality; M12 confirmed-fact bridge; policyReasonCodes; auditLog 100%; emergency write kill-switch; delayed-review user state; **preserveUntil** + erasure carve-outs.
- **Non-Goals / deferred:**
  - **Proactive CSAM hash + Founder quarantine ACL for user binaries** — DEFERRED (DEC-M10-UGC-PILOT / no custom avatars). Spec retained in §8.
  - **Constellation contributor rights queues / cascade-for-UGC** — DEFERRED with UGC flag.
  - **ISO/SOC2 · published discretionary response-time SLAs · Trusted Flagger · volunteer mods · public juries · Community Notes · custom ML ban models · dual-control bank workflows** — cut (theatre / wrong scale). *(Statutory clocks may be published — INV-12a.)*
  - **Customer FE polish** — FE phase.
  - **M15 chrome** — this sheet owns action contracts; M15 owns screens.

## 4. Domain Context
- **Terminology:** *Case* = the unit of work (`moderationCases`). *Report* = immutable intake row (many → one case). *Hold* = non-public pending human decision (fail-closed). *AccountStanding* = sanctions ceiling feeding M12 TrustTier. *Legal intake* = notice/counter/source/merchant/erasure/grievance with `subjectClass` clocks. *Hard-harm lane* = separate path; mods never render the material. *autoReleaseEligible* = soft-reason predicate after completed gate (C1).
- **Invariants:**
  - **INV-1 One spine.** All intakes create or attach to `moderationCases`. No parallel orphan queues.
  - **INV-2 Many reports → one open case** per `(targetType, targetId, policyFamily, openIncidentWindow)`. Report count ≠ guilt; never moves standing/Signal/Might/rank before human confirmation (Recipient Neutrality).
  - **INV-3 Fail-closed publish.** Classifier/timeout/uncertain → `HELD_FOR_REVIEW`, never public (DEC-P02). Timeout ≠ reject and ≠ publish. **Aged release never applies to incomplete/unavailable classifier states (C1).**
  - **INV-4 No LLM sanction.** LLM may suggest reasonCode/severity/summary; **cannot** warn/strike/suspend/terminate/clawback.
  - **INV-5 Human-only ladder.** Warn / strike / restricted / suspend / terminate / RI finding / DMCA substance / fraud clawback / Rocketeer revoke = human. Auto may: hold, URL reject, exact-dup reject, rate-limit, attach report, **allowlisted** S3 aged auto-release (§8), store BUY disable on confirmed drift (M11).
  - **INV-6 Aging forcing-function.** Unbounded HOLD is forbidden. **S3-only** auto-release at **96h** **and** `autoReleaseEligible=true` (C1); S0–S2 **never** auto-release; queue >**500** → ingest throttle (flag), not a lowered hard gate.
  - **INV-7 AccountStanding is a ceiling.** M13 writes standing only; never touches SignalCapacity/IntegrityCeiling. Restoring standing cannot raise TrustTier above Signal-earned level.
  - **INV-8 Fraud ≠ ordinary decay.** Badge revoke only with `revocationBasis=fraud_confirmed|sanction`; ordinary M12 demotion never revokes badges.
  - **INV-9 Legal subjectClass.** `ugc` vs `operator_published` vs `store_listing` drives clocks (publisher content = faster takedown; no pretending one shield).
  - **INV-10 Hard-harm isolation (when uploads on).** Quarantine bytes Founder-only; generic user copy; no appeal link on CSAM match; mods have **no** code path to quarantine objects.
  - **INV-11 TERMINATED authority.** Only Admin/Founder. Mods may suspend/reject/remove/warn/strike/restrict.
  - **INV-12 No fake discretionary SLAs.** Publish process accuracy (“under review”), never invent “we respond in 1 hour” for internal thresholds.
  - **INV-12a Statutory clocks published (C4).** India grievance ack/disposal and DMCA counter-notice restoration window **are published** where statute/rules require; all other internal aging/queue thresholds remain unpublished.
  - **INV-13 Conditioned legal restore (C3).** Counter-notice restoration never republishes content still held/removed on an independent non-copyright ground.
  - **INV-14 Preservation & erasure carve-out (C5).** Hard-harm / NCMEC actual-knowledge sets `preserveUntil` (+90d); soft-delete only while preserved. `right_of_erasure` never deletes `strikes` / `auditLog` / `legalIntake` / `moderationActions`.
  - **INV-15 Counter-notice intake always open (C2).** Facially complete counter-notices are never categorically refused; abuse chill affects expedited UX only.
- **Actors:** reporter · author · Moderator · Admin/Founder · Legal (counsel) · automated (autoGate, age, lease, RI cron, restoreEligible).
- **Source of truth:** `moderationCases` + `moderationActions` + `legalIntake` + `AccountStanding` on user; scores remain M12.

## 5. Dependencies & Cross-Module Contracts
| Provider | Contract | Failure |
|----------|----------|---------|
| DEC-P02 / M4 / M7 | Publish gate + URL reject + rate limits | Fail closed to hold |
| M12 | Emit `confirmed_fraud` / standing events → clawback; Recipient Neutrality | Download/post still works; Signal pending |
| M10 | Resource unpublish; provenance on in-house PDFs | Legal hold > schedule |
| M11 | Store pause / strike → case types | BUY disable without full ban |
| M15 | Renders queues from these contracts | — |

## 6. Data Model (Bible summary)
- **`moderationCases`** — caseType, targetType, targetId, policyFamily, severity, priority (0–3), status, reasonCode, policyVersion, **autoReleaseEligible?** *(C1)*, **preserveUntil?** *(C5)*, reporterCountDistinct, reporterClusterCount, claimedByUserId?, leaseExpiresAt?, nextReviewAt?, userResponseDueAt?, agingLevel, overflowBehavior, subjectClass?, parentCaseId? *(appeals)*, createdAt, closedAt?.
- **`reports`** *(deepened)* — +reasonCode, +reporterTrustAtTime, +dedupeKey, +caseId, +severityHint; status; createdAt. Immutable intake.
- **`moderationActions`** *(deepened)* — caseId, action, reasonCode, policyVersion, reversible, actorUserId, actorRole, beforeState, afterState, idempotencyKey, appealDeadlineAt?, createdAt.
- **`legalIntake`** — type, subjectClass, caseId, complainantContact, targetType, targetId, payloadHash, status, ackDueAt, actionDueAt, restoreEligibleAt?, strikeId?, counterNoticeId?, operatorUserId?, **erasureOutcome?**, **policyContactSnapshot?** *(agent/grievance contacts + policy version at filing)*, createdAt.
- **`strikes`** — userId, class, caseId, noticeRef?, active, voidedByRestore, **provisional?** *(copyright from valid notice until final — C2)*, expiresAt?, createdAt.
- **`capabilityRestrictions`** — userId, capabilityKey, reasonCode, caseId, startsAt, endsAt?, appealable.
- **`policyReasonCodes`** — code *(immutable)*, severity, defaultAction, userFacingTitle, userFacingBody *(Legal-mutable via **new version record**, never in-place overwrite of historical)*, policyUrlAnchor, appealable, active, version, effectiveFrom, **autoReleaseEligible?** *(soft allowlist only)*.
- **`users`** — **`accountStanding`**, standingExpiresAt?, standingSetByCaseId?; trustTier remains M7/M12 compose.
- **`trustHistory`** — +standingTransition{from,to,caseId,durationDays}, +triggerCaseId.
- **`badges`** — +revocationBasis? (M12).
- **Indexes:** cases by (status, priority, nextReviewAt); (targetType, targetId, status); leaseExpiresAt; reports by dedupeKey; legal by actionDueAt; preserveUntil.

## 7. Domain States & Lifecycle
1. **Content (UGC):** PROCESSING → pass (public) | HELD → pass/reject/remove | rejected/removed terminal for that revision **unless** `preserveUntil` requires soft-delete retention (C5).  
2. **Case:** open → triaged → claimed → (awaiting_*) → actioned → closed; or appealed → closed; or `auto_released_aged`.  
3. **Standing:** good ↔ warned → restricted → suspended → terminated. Terminated has no auto-exit **except** RI void reinstatement when terminating strike voids and active copyright strikes < 3 (§8). Appeal remains available.  
4. **Legal DMCA:** received → acknowledged → honoured/rejected_deficient → (counter → restoreEligible → restored **iff INV-13** | suit_notified). Valid notice → **provisional** copyright strike/takedown event, not a final factual infringement finding (C2).  
5. **India grievance:** received → ack (24h) → disposed (15d) with clocks set at intake (C4).  
6. **Precedence:** hard-harm / statutory legal / preserveUntil > safety quarantine > ordinary hold > editorial schedule > author request. Aging never auto-publishes S0–S2. Legal restore never overrides independent non-copyright remove/hold (C3).

## 8. Rules, Algorithms & Limits
- **R-AUTOGATE (DEC-P02):** `trigger` post/comment submit → deterministic checks (URL, length, dup-hash, velocity) → optional classifier → `pass` | `hold` | hard `reject` (URL/dup). Timeout/unavailable → **hold** `classifier_unavailable` with **`autoReleaseEligible=false`**. Feedback: author processing/held copy. Never fail open.
- **R-REPORT-DEDUPE:** `trigger` report → `condition` open case exists for target+policyFamily → attach; else create case. Critical types may bump severity. Feedback: “Report received” only — no prediction.
- **R-REPORT-RATE:** verified 10/24h · 30/7d (config); clean history may raise; critical ≤5/hour mechanical. Abuse ≠ “mod took no action.”
- **R-BRIGADE:** repeated dismissed reports from same/correlated reporters → new case on **reporting pattern** (M12 correlation reuse); volume never sanctions target alone. On confirmed brigade abuse → **`restrict_capability(report)`** (explicit).
- **R-CLAIM:** lease **20m**, renew **5m**, max continuous **60m**; atomic claim; Admin takeover audited; expired → triaged.
- **R-QUEUE-ORDER:** s0 → legal deadlines → s1 by oldest → appeals near resolve bound → s2 → s3 batch. Report count not a sort key.
- **R-AGING (D1 + C1):** cron 60m. Internal thresholds (not user promises): s0 unclaimed **1h** page Admin; s1 **8 operational hours**; s2 **3d**; s3 **7d**. Soft ops alerts at open-case **250** and **400** (Admin warning / pre-throttle); throttle remains locked at **500**.  
  **S3 auto-release predicate (C1):**
  - TRIGGER: `severity == s3` ∧ age > **96h**
  - CONDITION: `autoReleaseEligible == true` ∧ all required deterministic + classifier checks **completed successfully** ∧ no unresolved safety/legal/integrity flag ∧ no new material evidence ∧ target revision unchanged ∧ AccountStanding permits publication  
  - **Allowlist reason codes only:** `profanity_soft` · `off_topic_uncertain` · `low_substance` · `wrong_post_type_uncertain`  
  - **Never eligible:** `classifier_unavailable` · `classifier_timeout` · `safety_unknown` · `legal_hold` · `hard_harm` · `harassment_uncertain` · `threat_uncertain` · `fraud_uncertain` · `malware_or_phishing` · `prohibited_mature_content` · `copyright_or_rights_hold` · any unknown/higher severity  
  - ACTION: publish **same** revision · close `auto_released_aged` · `moderationActions` + `auditLog` · author “Published after automated-review delay” · **not** a strike  
  - RECOVERY: later valid report → new/attached case  
  - S0–S2 never auto-release. Queue count >**500** → `ingest.throttle` (flag); hard gate unchanged. Throttle **must not** stop: appeals · legal intake · privacy/erasure · safety reports · existing-case responses · Admin actions. Throttle trip → **distinct operator alert** (organic backlog vs flood-to-throttle).
- **R-BATCH:** max **25**; only approve_and_publish / reject_off_topic / reject_duplicate / clear_profanity_hold / suppress_duplicate_reports. Never batch ban/DMCA/RI/clawback/critical.
- **R-STANDING / SANCTIONS:** escalate by strike class (not one global 3-strikes for all harms). Capability keys: `create_post` · `create_comment` · `react` · `report` · `submit_reference` *(dormant)* · `manage_store` · `tag_product` · `tag_resource` · `revival_vote`. Suspend = all writes blocked; read + one appeal + privacy/legal remain. **TERMINATED = Admin/Founder only (D4).**
- **R-RI:** 1 **valid** copyright notice = 1 **provisional** strike; **3 / 12 months → TERMINATED**; counter-notice restore / withdrawal / legal reversal → `voidedByRestore` voids strike retroactively; **`ri.evaluate` re-runs** — if active copyright strikes < 3 and termination rested on that count, reinstate prior standing with audit (no appeal required for that void path). Public `/repeat-infringer`. Cross-surface when store/resources exist.
- **R-APPEAL (D3):** one ordinary appeal / `moderationActionId`; content/warn/strike window **14d**; suspend max(duration, 14d); terminate/store/RI **30d**; max 2k chars; ≤3 evidence refs; **no user URLs**; one human re-review (second human or Admin if solo); **moderator resolve bound = 7 business days** from filing; **overdue → Admin escalation (not auto-deny / not auto-restore)**; appeal does not auto-restore safety holds; success reverses dependent standing + M12 actions.
- **R-LEGAL (C2–C4):**  
  - Clocks: DMCA ack **3bd** / action **10bd** (internal); **source_takedown (`operator_published`) action 2bd** — **Founder/Admin pager** (named owner, not decorative); counter-notice restore window **10–14 bd** unless suit (**published** per INV-12a); **`grievance_india`:** `ackDueAt = +24h`, `actionDueAt = +15d` (**published**); reasonCodes ∈ {intimate imagery, impersonation, nudity} → severity ≥ **s1** and `actionDueAt = +24h`.  
  - Deficient counter → name missing element. Abuse chill: **2 rejected-deficient counters / 90d** → remove **expedited in-product** submission for **180d** + mechanical rate limits + reviewed intake path — **never** refuse a later facially complete counter-notice (C2 / INV-15).  
  - Snapshot agent/grievance contacts + policy version onto `legalIntake` at filing.
- **R-LEGAL-RESTORE (C3):** `legal.restoreEligible` cron → restore **only if** no other active `moderationCase` and no non-reversed `moderationActions.action ∈ {remove, reject}` on the target from a **non-copyright** policyFamily. If blocked: clear copyright ground · case `actioned` · content stays down · contributor told which ground remains · audit line.
- **R-PRESERVE / ERASURE (C5):** On hard-harm actual-knowledge report or NCMEC filing → set `preserveUntil = now+90d`; content **soft-deletes** only (bytes/text retained; no mod visibility of hard-harm material). `right_of_erasure` → anonymise PII + tombstone user; **never** delete `strikes` / `auditLog` / `legalIntake` / `moderationActions`; outcome `ERASE_PARTIAL` or `REFUSED_LEGAL_HOLD` if preserve/RI hold applies.
- **R-M12-BRIDGE:** on confirmed fraud/sanction emit facts only (`confirmed_fraud`, `strike_activated`, `account_suspended`, …). M12 clawback/badge revoke; M13 never recomputes legitimacy.
- **R-HARD-HARM (deferred upload path):** when file upload enabled — CF CSAM (or equiv) → quarantine Founder-only → NCMEC report → generic user message → no appeal. Soft beta: runbook + **preservation** for actual knowledge on text reports. First binary/custom-image upload flag **atomically requires** this path before upload target issuance.
- **R-BAN-EVASION (lean):** at terminate, snapshot M12 device/behavioral signals; new account match → hold for human (not auto-ban).
- **R-INSIDER:** monthly Founder `auditLog` spot-check; no dual-control theatre.

## 9. Backend Operations
- **mutations:** `report.submit`, `case.claim`, `case.resolve`, `appeal.submit`, `standing.apply` (role-gated), `legal.intake` (or http→mutation).  
- **actions:** `mod.autoGate` (classifier), deferred `file.csamScan`.  
- **crons:** `queue.age`, `lease.expire`, `appeal.slaTick`, `ri.evaluate`, `legal.restoreEligible` *(conditioned)*.  
- **auth:** Moderator vs Admin per INV-11; hard-harm / quarantine role = Founder only when enabled.  
- **config:** aging hours, report caps, batch max, appeal windows, RI threshold, `ingest.throttle`, `constellation.ugc.enabled` (M10), `uploads.avatar.enabled=false`.

## 10. Customer Frontend — DEFERRED (reference)
Author states: Processing / Held / Delayed review / Rejected / Removed / Restored / Published after automated-review delay — accuracy framing, no “AI found you guilty.” Standing: capability language + duration + appeal route. Report: received ack only. Legal: `/dmca`, `/repeat-infringer`, `/rules`, Grievance Officer contacts + India ack/disposal clocks, DMCA counter restore window. Built in FE phase to DEC-UX-APPLE.

## 11. Admin & Governance
Queues: Immediate (s0/legal) · Review today (s1/appeals) · Standard (s2) · Batch (s3) · Waiting. Actions per §8 with reason codes + audit. **Moderator** clears s2/s3, warn/strike/restrict/suspend. **Admin/Founder:** terminate, RI, hard-harm, contested DMCA, ingest throttle, mod-conduct, appeal overdue escalation, `operator_published` 2bd. Legal copy on `policyReasonCodes` via new versions. Projects to M15. S0 imminent-harm: documented Founder runbook note (ops, not new architecture).

## 12. RBAC
| Action | member | Moderator | Admin/Founder |
|--------|--------|-----------|---------------|
| Report | ✓ (rate-limited) | ✓ | ✓ |
| Resolve s2/s3 hold | — | ✓ | ✓ |
| Warn / strike / restrict / suspend | — | ✓ | ✓ |
| Terminate / RI | — | — | ✓ |
| Legal substance / counter forward | assist completeness | — | ✓ |
| Quarantine file access | — | **denied** | ✓ (when enabled) |
| Edit reason-code **copy** | — | — | Legal/Admin (new version) |
| Delete auditLog / strikes / legalIntake | — | — | **never** |

## 13. Integrations
- Optional text classifier (timeout → hold, never auto-release).  
- Deferred: Cloudflare CSAM / VT on binaries when uploads on.  
- Email/mailbox → `legalIntake`.  
- NCMEC CyberTipline (Founder runbook + 90d preserve).  
- No payment / no LE portal product.

## 14. Analytics, Audit & Observability
- **Events:** `report_submitted` · `case_created`/`deduped` · `case_aged` · `auto_released_s3` · `action_applied` · `appeal_*` · `legal_*` · `standing_changed` · `ri_triggered` · `ingest_throttled` · `m12_fact_emitted` · `preserve_set` · `erasure_*`.  
- **Audit:** 100% of mod/legal actions — actor, role, before/after, reasonCode, evidence refs, override reason, correlationId.  
- **Health:** open by severity, claim age, appeal overdue, legal overdue, S3 auto-release rate, throttle trips (with organic-vs-flood tag), preserveUntil inventory — **no** public discretionary SLA dashboards.

## 15. Content & Copy Contract *(provisional; R4 — Legal final)*
Held / delayed-review / rejected / aged-publish labels from `policyReasonCodes`. Suspend: end date + appeal. Terminate: appeal window. DMCA pages: agent identity must match USCO filing. Grievance Officer + India clocks published. Counter restore window published. Never invent statutory determination copy. Provisional copyright strike language ≠ “we found infringement.”

## 16. Edge Cases & Failure Recovery
- Classifier outage → mass hold + distinct operator alert (≠ ordinary volume); cases remain **not** autoReleaseEligible.  
- Solo mod → Admin re-reviews appeals.  
- Appeal delay → Admin escalate at 7bd; safety containment stays.  
- Fake DMCA / counter abuse → deficient reject + expedited chill (complete intake remains).  
- In-house PDF complaint → `operator_published` fast clock (Founder pager).  
- Brigade → dedupe + reporter-pattern case + `restrict_capability(report)` on confirm.  
- Counter restore vs other hold → copyright cleared, content stays down (C3).  
- Erasure from terminated RI → strikes/audit survive (C5).  
- Upload flag later → enable §8 hard-harm before first byte.

## 17. NFR / Security / Privacy / SEO
Least privilege on quarantine (when on). Reports private. Standing not a public “shame score.” SEO: no-index held/rejected. India grievance + DPDP/GDPR erasure intake with legal-hold carve-out. Soft beta skips proactive file scan — **not** a skip of actual-knowledge reporting or 90d preservation.

## 18. Fixtures, Tests & Acceptance Criteria
- **Fixtures:** URL post; classifier timeout (never auto-releases); soft S3 hold aged 97h (does release); unavailable-classifier hold aged 97h (does **not**); 50 reports→1 case; s1 hold 5d; lease conflict; solo-mod appeal; DMCA+counter; restore blocked by harassment remove; RI third strike; RI void reinstates; fraud badge revoke vs ordinary demotion; terminate by mod (must fail); Path B no reference upload; terminated RI erasure → strikes survive; grievance_india clocks set.
- **AC-1** Classifier timeout → held, never public; never `autoReleaseEligible`.  
- **AC-2** N reports same target+family → one open case.  
- **AC-3** Report volume alone never lowers target standing/Signal.  
- **AC-4** S3 age>96h + allowlisted completed gate → auto-release + audit; S1 age>96h → still held; `classifier_unavailable` S3 age>96h → still held.  
- **AC-5** Queue>500 → throttle flag + distinct alert; s0 still never auto-release; appeals/legal still accepted.  
- **AC-6** Mod cannot TERMINATE; Admin can.  
- **AC-7** Second appeal same action → reject.  
- **AC-8** Appeal unresolved >7bd → Admin escalation (not auto-deny).  
- **AC-9** `confirmed_fraud` action → M12 fact emitted; legitimacy not recomputed in M13.  
- **AC-10** Soft beta: Constellation upload route disabled; no quarantine worker required.  
- **AC-11** policyReasonCodes copy edit = new version; historical action.reasonCode unchanged.  
- **AC-12** Complete counter-notice accepted during expedited chill.  
- **AC-13** `legal.restoreEligible` blocked when independent non-copyright remove active.  
- **AC-14** `grievance_india` sets ack 24h / action 15d; intimate/impersonation → s1+ +24h action.  
- **AC-15** NCMEC/actual-knowledge → `preserveUntil` set; erasure leaves strikes/audit.

## 19. Release, Migration & Rollback
- **Flags:** `mod.autoGate`, `mod.appeals`, `legal.dmcaIntake`, `ingest.throttle`, `uploads.avatar.enabled=false`, `constellation.ugc.enabled=false`, deferred `uploads.csamScan`.  
- **Order:** reason codes seed (incl. autoReleaseEligible) → autoGate hold → cases+dedupe → standing enforcement → appeals → legal intake → aging cron → preserve/erasure → (later) file scan.  
- **Rollback:** disable posting (`ingest.throttle` / feature flag); holds remain private.  
- **Launch blockers (Path B):** DMCA agent + RI page + ToS/Privacy/Rules + Grievance Officer (published clocks) + NCMEC runbook **with 90d preserve** + auditLog + aging cron (C1) + AccountStanding wired into TrustTier — see founder registration doc. **Not blockers:** PhotoDNA, UGC parser, contribution cascade.

## 20. Global Projections & Open Decisions
- **Projections:** Bible Trust & ops (M13) · RBAC Moderator/Admin · M15 queues · M12 standing ceiling + badge revocationBasis · M10/M11 case types · M16 mod event family · founder legal checklist.  
- **Design scores:** GPT 91 / GLM 91 / Sonnet 79 / Opus 79.  
- **Confirmation scores:** GPT 92 / GLM 96 / Sonnet 91 / Opus 88 — HIT; C1–C5 baked.  
- **Open (outside this module):**
  - **DEC-P15** copy — Legal; codes locked.  
  - **Classifier vendor** — CONSTRAINED (optional; fail closed without it).  
  - **Hard-harm vendor** — DEFERRED until uploads; prefer CF CSAM when on.  
  - USCO agent **3-year renewal** calendar (founder regs — not product code).

---

## DEC register (this module)

| ID | Decision | Status |
|----|----------|--------|
| DEC-M13-SPINE | `moderationCases` one spine; many reports → one case; Recipient Neutrality on volume | LOCKED |
| DEC-M13-FAILCLOSED | DEC-P02 autoGate; timeout→hold; no LLM sanctions | LOCKED |
| DEC-M13-AGING | S3 auto-release @96h **only if** `autoReleaseEligible` allowlist + completed gate (C1); S0–S2 never; queue>500 throttle intake | LOCKED |
| DEC-M13-STANDING | AccountStanding good→warned→restricted→suspended→terminated; capability restrictions; TrustTier ceiling | LOCKED |
| DEC-M13-AUTH | Mods: warn/strike/restrict/suspend; **TERMINATED = Admin/Founder only** | LOCKED |
| DEC-M13-APPEAL | One/action; 14d content; 30d terminate; resolve bound 7 business days; overdue → Admin escalate | LOCKED |
| DEC-M13-LEGAL | legalIntake + subjectClass clocks; counter-notice always intake-eligible (C2); RI 3/12mo; India grievance clocks (C4); conditioned restore (C3) | LOCKED |
| DEC-M13-PRESERVE | `preserveUntil` +90d on actual-knowledge/NCMEC; erasure never wipes strikes/audit/legal (C5) | LOCKED |
| DEC-M13-M12 | Emit confirmed facts only; badge revocationBasis fraud/sanction; never recompute legitimacy | LOCKED |
| DEC-M13-HARDHARM | Separate Founder-only quarantine path — **DEFERRED** until user file/image upload | DEFERRED |
| DEC-M13-SURFACE | Soft beta assumes DEC-M10-UGC-PILOT OFF + no custom avatars | LOCKED |
