# CONTRACT-7-legal-intake-FINAL

**Screen:** Legal & Rights Intake — `/legal/intake`
**Wave:** 7A (M13 Trust/Safety + M2 takedown + M10 DMCA — the screen every Wave 1–6 legal deferral pointed to)
**Template archetype:** Legal intake form set
**Primary CAP-IDs:** CAP-058, CAP-059, CAP-060, CAP-217, CAP-343, CAP-344, CAP-348, CAP-350
**Actors:** member, anonymous (+ webhook, Moderator)
**Register basis:** 561-row register + data-model verified from source. ~~**ESCALATION E1 (takedownRequests↔legalIntake three-way drift) confirmed from source.**~~ **E1 CLOSED 2026-08-25 — takedownRequests ⛔ ABSORBED; CAP-058/059/065 retargeted to legalIntake.**
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~90 folded). See RECONCILIATION-7A §3.

---

## 1. Route & Access
- **Path:** `/legal/intake`, no params. **Actors:** member, anonymous. Branches: anonymous form/mailbox (CAP-217, webhook/anonymous); authenticated full set (CAP-343/344/348/350); operator filing (CAP-058, Moderator). **Designated public agent** contact must be published (CAP-217 — launch-blocking infra).
- **Deferral-delivery check (confirmed):** CAP-058 (takedown.intake), CAP-059 (takedown.action → block source + re-evaluate), CAP-060 (re-eval, keep post if ≥2 independent sources else archive) are all present and deliver the deferred Wave-1–6 workflow. **E1 CLOSED 2026-08-25: delivery is now complete** — CAP-058/059 Writes (and CAP-065's H-SRC Read) target `legalIntake` (`type=source_takedown`); `takedownRequests` carries the ⛔ ABSORBED marker at data-model line 169.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `legalIntake` | read + write | type {dmca_notice · dmca_counter_notice · **source_takedown** · **merchant_ip** · right_of_erasure · grievance_india}; subjectClass {ugc · operator_published · store_listing}; caseId, complainantContact, targetType/Id, status, **ackDueAt, actionDueAt**, restoreEligibleAt?, strikeId?, erasureOutcome? {ERASE_PARTIAL·REFUSED_LEGAL_HOLD}, policyContactSnapshot? — **sole intake entity (E1 CLOSED: absorbs takedownRequests; type=source_takedown rows replace it)** |
| `moderationCases` | write | case spine attach (343/344/348) |
| `sources` · `contentCandidates` · `posts` · `postSources` | read/write (CAP-059/060) | block source; re-evaluate linked content (keep post if ≥2 independent sources remain, else archive + operator review) |
| `resources` · `resourceReferences` | read (CAP-217) | M10 target context |
| `strikes` | read (CAP-344) / write via CAP-345 (off-screen) | provisional copyright strike |
| `users` | write (CAP-350) | erasure: anonymize PII + tombstone |
| `auditLog` | write | all rows |

## 3. States
*(Enum-backed set by intake type. GPT's ~90 transient states — each subject-class × target × completeness combination — folded, since the `legalIntake.type` (6) + `subjectClass` (3) + status enums are authoritative.)*

**A. DMCA notice (CAP-217 public form/webhook + CAP-343 authenticated + CAP-058 operator-filed):** subjectClass ugc | operator_published | store_listing; internal clocks **ack 3 business days / action 10 business days**. CAP-217 writes `legalIntake (type=dmca_notice, status=received)` (Wave-6B retarget from thin `dmcaNotices`).
**B. Counter-notice (CAP-344):** facially-complete → **always intake-eligible**; deficient-reject; **abuse-chill: 2 rejected-deficient / 90d → expedited path removed 180d** (INV-15/AC-12). Restore eligibility computed off-screen (CAP-346 — no republish over independent non-copyright hold).
**C. Source takedown (CAP-058→059→060):** filed → actioned (`sources.trustLevel=block` + re-evaluation: **keep post if ≥2 other independent sources remain, else archive + operator review**) → resolved. **operator_published variant pages Founder/Admin within 2 business days** (CAP-347, off-screen).
**D. Grievance India (CAP-348):** **statutory clocks PUBLISHED on-page (INV-12a): ackDueAt=+24h, actionDueAt=+15d**; expedited branch off-screen (CAP-349: intimate-imagery/impersonation/nudity → severity ≥s1 + actionDueAt=+24h).
**E. Right of erasure (CAP-350):** submitted → off-screen outcome **ERASE_PARTIAL | REFUSED_LEGAL_HOLD** (CAP-351). Invariant: **never delete strikes / auditLog / legalIntake / moderationActions**.
**F. `merchant_ip`:** enum literal exists **with no /legal/intake CAP** — M11's path writes `merchantComplaints` (CAP-268, /admin/store). Two complaint paths named (Open Question).
**G. Valid-notice consequence (off-screen):** CAP-345 writes the **provisional** copyright strike ("not a final infringement finding").

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| DMCA intake (form/mailbox) | anonymous, webhook | CAP-217 `dmca.intake` (R-DMCA) | legalIntake (type=dmca_notice, status=received) | none |
| DMCA intake (authenticated) | member | CAP-343 `legal.intake` (R-LEGAL) | legalIntake, moderationCases, auditLog | none |
| Counter-notice | member | CAP-344 (unnamed) | legalIntake, moderationCases, auditLog | facially complete |
| Grievance India | member | CAP-348 (unnamed) | legalIntake, moderationCases, auditLog | none |
| Erasure request | member | CAP-350 (unnamed; R-PRESERVE) | legalIntake, users, auditLog | none |
| File source takedown | Moderator | CAP-058 `takedown.intake` | legalIntake (type=source_takedown) — E1 CLOSED | external intake |
| Action takedown | Moderator | CAP-059 `takedown.action` | sources (block), legalIntake (status=actioned/resolved) — E1 CLOSED, auditLog | CAP-058; valid notice |
| Re-evaluate linked content | System | CAP-060 (re-eval) | postSources, contentCandidates (archive), posts (archive) | CAP-059 |

- CAP-059/060's **action UI home is admin-side** (M13 console vs /admin/sources — unassigned; Open Question); this screen is the intake surface.

## 5. Analytics Events
**None** — no rawEvents on any row; `auditLog` + `moderationCases`/`legalIntake` only. Legal intake is deliberately outside the event stream. Legal form contents + identity evidence must never be duplicated into observational analytics.

## 6. Components Used
- §11.2 Inputs (form set per type; complainantContact; subjectClass selector) · §11.5 Pill (type/status/clock states) · §11.1 Button · §11.7 Modal (confirm) · §11.8 Error (deficient-counter state) · §11.9 Skeleton · **720px reading-column** (statutory-clock disclosure copy; legal-layout family per CAP-027 pattern).
- **Archetype gaps:** no legal-intake form family, facial-completeness checklist, statutory-clock component, legal-hold state, or erasure-retention-explanation component in §11.

## 7. Open Questions
1. ~~**`takedownRequests` vs `legalIntake (type=source_takedown)` three-way drift**~~ **→ CLOSED (E1, 2026-08-25): `takedownRequests` ⛔ ABSORBED at data-model line 169; CAP-058/059 Writes + CAP-065 H-SRC Reads retargeted to `legalIntake`; register-wide grep zero residual.**
2. **CAP-059/060 action-UI home** at Wave 7 (M13 console vs /admin/sources) — unassigned. (GLM.)
3. **`merchant_ip` type has no intake CAP on this screen** (M11 `merchantComplaints` is the only writer) — relationship to two complaint paths unstated. (GLM.)
4. **Statutory-clock rendering** — CAP-348 publishes ackDueAt/actionDueAt and CAP-404 knows grievance_india = Asia/Kolkata + India holidays, but no CAP on this screen derives/renders the live countdown against those calendars. (Opus.)
5. **Per-form auth gate** (anonymous DMCA vs authenticated grievance/erasure) is real but not a capability. (Opus.)
6. **Unnamed mutations** on CAP-344/348/350/058/059. (All three.)
7. **Anonymous CAP-217 form dedupe/rate-limit** — unspecified (contrast CAP-325 report rates). (GLM + GPT.)
8. **Identity-verification procedure** for counter-notice + erasure — unspecified. (GPT.)

---

## ADDENDUM 2026-09-04 — DECISIONS-LOCKED #6 (F-33 resolved)

Identity + abuse framework locked: **DMCA takedown/counter-notice** require full
legal name, physical address, email, electronic signature attestation (statutory
minimum, 17 U.S.C. §512); **other legal/grievance forms** require verified email
only. **Rate limit 5 submissions/24h per email+IP pair.** Dedupe key
(submitter, target content, claim type) over a rolling 24h window. **SLA clock =
US business days (Mon–Fri, federal holidays excluded).** Lawyer skim recommended
pre-launch — not a build blocker.
