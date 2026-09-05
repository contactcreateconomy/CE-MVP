# Createconomy — Founder Decisions Locked (Decision Sprint, 2026-09-04)

**Status:** All 11 blocking decisions from the Workstream D backlog are resolved.
**Purpose:** Hand this directly to the build agent to unblock the corresponding slices. Each decision below replaces a "STOP — do not invent" fence in the PRD.

---

## 1. SMS/OTP Provider — unblocks CAP-551 → CAP-141 (comment eligibility)

**Decision:** Twilio Verify.
**Action:** Wire CAP-551 to Twilio Verify's API (send/verify/expire/retry handled by Twilio). No custom OTP logic needed.

---

## 2. Timezone-Skip Trap (E4) — unblocks CAP-003/005 (onboarding)

**Decision:** Remove the Skip button entirely. Auto-detect timezone from browser/IP at signup (silent, no user action). Default to UTC only if detection fails. Editable later in Settings.
**Action:** Delete the Skip path from the welcome/onboarding contract. `pending_context` state should no longer be reachable.

---

## 3. `activationProgress` 7-Bit Checklist (F-37) — unblocks P1-01b (first slice in build order)

**Decision:** Approved as proposed.

| # | Bit | Fires when |
|---|---|---|
| 1 | `emailVerified` | Email confirmed at signup |
| 2 | `mobileVerified` | Twilio OTP confirmed |
| 3 | `profileComplete` | Display name + avatar + bio set |
| 4 | `firstPostPublished` | User's first post goes live |
| 5 | `firstCommentPosted` | User's first comment posted |
| 6 | `firstReactionGiven` | First upvote/save on someone else's content |
| 7 | `firstFollowMade` | User follows their first creator/category |

**Action:** Add these 7 booleans to the `users` schema per M14/P1-01b. Wire M14's drip-release cron to this checklist.

---

## 4. `policyFamily` Taxonomy (F-35) — unblocks P7E-10/12 (moderation dedupe)

**Decision:** Approved as proposed.

| Family | Covers |
|---|---|
| `spam` | Duplicate/promotional/bot content |
| `harassment_abuse` | Targeted harassment, hate speech, threats |
| `misinformation` | False/misleading claims (News, Review, Compare) |
| `copyright_ip` | DMCA/IP claims — routes to legal intake |
| `legal_other` | Privacy, defamation, other non-IP legal claims |
| `quality_guidelines` | Off-topic, low-effort, category-rule violations |
| `safety_illegal` | Illegal content, imminent harm — highest severity/fastest SLA |

**Action:** Enumerate this literal set in `moderationCases.policyFamily`. Case dedupe key = (target, policyFamily, time window).

---

## 5. `manual_review` / RC-4 Disposition Actions (F-22) — unblocks P7O-04/05

**Decision:** Two admin actions only.
- **Approve & Retry** — re-run the job once with same parameters. Idempotent, logged.
- **Cancel** — mark permanently failed, trigger compensating cleanup, logged.

**Action:** Build these two actions into the reliability/job admin screen. Both require admin auth + audit log entry. No auto-escalation, no SLA timers for MVP.

---

## 6. Legal Intake Identity + Rate Rules (F-33) — unblocks P7T-05/06

**Decision:** Approved as proposed (matches DMCA statutory requirements, not invented policy).
- **DMCA takedown/counter-notice:** full legal name, physical address, email, electronic signature attestation (statutory minimum, 17 U.S.C. §512).
- **Other legal/grievance forms:** verified email only.
- **Rate limit:** 5 submissions / 24h per email+IP pair.
- **Dedupe key:** (submitter, target content, claim type) within rolling 24h window.
- **SLA clock:** US business days (Mon–Fri, federal holidays excluded).

**Action:** Build these fields/limits into the legal-intake contract and forms.
**Note:** Recommend a real lawyer skim this framework before public launch — not a build blocker.

---

## 7. Consent Withdrawal → Vendor Deletion (OQ#3) — unblocks P7T-13/P7O-08

**Decision:** Automated outbox pattern.
- Withdrawal writes a durable "deletion requested" record.
- Background job calls PostHog deletion API with retry on failure.
- Status visible (pending/confirmed) to admin.

**Action:** Wire CAP-506 → CAP-453/454 via outbox + retry job. Remove the "do not call" fence in P7T-13/P7O-08.

---

## 8. Readiness Predicate Catalog — unblocks P7A-10/11 (signup.mode=open gate)

**Decision:** Approved, 7 categories mapped to decisions above.

| Category | Predicate |
|---|---|
| Legal pages | Terms/Privacy/DMCA published and versioned |
| Admission | Magic-link + activation checklist functional |
| Moderation | policyFamily dedupe operational |
| Legal intake | DMCA/grievance forms + identity rules live |
| Consent/privacy | CMP + vendor-deletion outbox operational |
| Reliability | manual_review resolution actions live |
| Content safety | M2/M3 safety pipeline (27 orphan CAPs) implemented |

Each predicate: boolean, owned by implementing module, rechecked every 5 min, unavailable = fail-closed (not-ready). `overall=ready` only when all 7 true.

**⚠️ Correction added after Decision 11:** add an **8th category — "Ranking calibration reviewed"** — gating public launch (not build) on someone actually looking at the ranking constants before strangers see the feed. This was missed when the 7-category table was first drafted.

---

## 9. Legal Content Source (E5/E6) — unblocks legal/trust pages + SEO indexability

**Decision:** Self-drafted for now (Claude drafts Terms/Privacy/DMCA/Repeat-Infringer as structured Markdown, flagged "founder-drafted, not lawyer-reviewed").
**Gate:** Lawyer review required **before public launch** (signup.mode=open), not before build.
**Technical wiring:** Versioned Markdown rows in an admin-editable table. Manual publish action. Append-only versions (no destructive edits); rollback = revert to prior published version.

**Action:** Draft the 4 documents next; wire the versioned-content table per M17/M18.

---

## 10. A10 Evidence-Review Interaction (editorial claim verification) — unblocks P4-09

**Decision:** Simple two-pane layout.
- Draft on left, source evidence on right, synced by claim highlighting on click.
- Approve button disabled until every claim checked at least once.
- Mobile: tabs (Draft / Evidence) instead of side-by-side.

**Action:** Build per this spec; update P4-09's acceptance criteria to match.

---

## 11. Ranking/Legitimacy Formula Constants (M6/M9/M12) — unblocks P5-04, P6-02/03, P7E-05/08

**Decision:** Ship versioned placeholder config defaults now; mark every constant `calibration_pending`. No hardcoded values — all in config, tunable without code changes. Real calibration happens post-beta, using actual user behavior data, gated by Readiness Category 8 (above) before public launch.

**Action:** Implement standard time-decay gravity (Hot), recency+engagement blend (Top), conservative legitimacy weights (Signal). Tag config keys `calibration_pending: true`.

---

## Summary Table

| # | Decision | Blocks | Status |
|---|---|---|---|
| 1 | OTP: Twilio Verify | CAP-141 (all commenting) | ✅ Locked |
| 2 | Timezone: auto-detect, no Skip | Onboarding (E4) | ✅ Locked |
| 3 | 7-bit activation checklist | P1-01b (first slice) | ✅ Locked |
| 4 | policyFamily taxonomy | P7E-10/12 (moderation) | ✅ Locked |
| 5 | manual_review actions | P7O-04/05 (reliability) | ✅ Locked |
| 6 | Legal intake identity/rate | P7T-05/06 | ✅ Locked |
| 7 | Consent → vendor deletion | P7T-13/P7O-08 | ✅ Locked |
| 8 | Readiness predicates (+8th added) | P7A-10/11 | ✅ Locked |
| 9 | Legal content source | Legal pages, SEO | ✅ Locked |
| 10 | A10 interaction contract | P4-09 (editorial) | ✅ Locked |
| 11 | Ranking formula defaults | P5-04, P6-02/03, P7E-05/08 | ✅ Locked |

**All Workstream D blockers are now resolved. Next: Workstream A (mechanical fixes) + Workstream C (27 orphan CAP disposition) can proceed immediately.**
