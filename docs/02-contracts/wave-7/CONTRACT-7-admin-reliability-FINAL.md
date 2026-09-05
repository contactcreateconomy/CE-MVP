# CONTRACT-7-admin-reliability-FINAL

**Screen:** Reliability / Jobs & Dead-letter — `/admin/reliability`
**Wave:** 7D (M18 Reliability & Platform Ops)
**Template archetype:** Dead-letter table + health dot
**Primary CAP-IDs:** CAP-499, CAP-500, CAP-501, CAP-503
**Actors:** Founder, administrator (redrive is Founder/Admin)
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (resolved on register evidence — GPT's ~90 folded). See RECONCILIATION-7D §2.

---

## 1. Route & Access
- **Path:** `/admin/reliability`, no params. **Actors:** Founder, administrator. Shell CAP-390 → route CAP-392 → widget keys. **CAP-500 Actor = Founder/Admin** is the only human-actor row; CAP-499 System · CAP-501 cron · CAP-503 System. Admin URLs noindex (CAP-486). CAP-019 (60/1m) on redrive.
- Redrive must revalidate current actor authz + STOP + target state + execution authorization at action time (a dead-letter redrive does NOT imply the original actor remains authorized). **STOP takes precedence over scheduled/redriven execution** (CAP-518).
- Must not expose secrets, webhook credentials, sensitive payload bodies, or unrestricted user data.

## 2. Entities

| Entity | Direction | Detail (CAP) |
|---|---|---|
| `jobDeadLetters` | read (list) + write (500 stamps) | jobRunId · jobKey · reason · createdAt · **redrivenAt?** · **redrivenByUserId?** |
| `jobRuns` | read + write (500 re-queue) | actorUserId? *(attribution)* · executionAuthority · authorityOutcome? · commandId? · **state incl. manual_review**; index by_commandId — ⚠️ full state enum owned by the M18 sheet (Open Question) |
| `jobCatalog` | read (context) | jobKey · executionAuthority {system·revalidate_actor·authorized_command} · retryClass · maxAttempts · **healthFreshnessSeconds** · **deadLetterAfterSeconds** · status |
| `platformHealth` / `platformHealthProbes` | read (501/503) | liveness + probe self-heartbeat. Independent Vercel watchdog (CAP-502) alerts **out-of-band** — deliberately NOT a screen surface (alerts OOB precisely because this Convex-rendered screen may be down) |

## 3. States
*(Enum-backed set. GPT's ~90 transient states — each retry sub-step, each STOP/authz combination — folded, since the health enum (healthy/stale/dead/never_ran) + dead-letter/redrive lifecycle are authoritative.)*

**A. Dead-letter (CAP-499, INV-M18-5):** exhausted retries → `jobDeadLetters` row — **never silent drop**.
**B. Redriven (CAP-500):** `redrivenAt` + `redrivenByUserId` stamped; jobRuns re-queued. **"Redrive runbook required before open beta."** Blocked if: actor-authz changed · STOP active · target ineligible · runbook requirement unmet; authorized-command consumed once (reuse rejected).
**C. Liveness (CAP-501, R-LIVENESS / FATAL-M18-03, cron 5m):** healthy · **stale** (`now > lastSuccessAt + interval×1.5` = 7.5m) · **dead** (×3 = 15m → + alert) · **never_ran**. **Liveness = lastSuccessAt, NOT lastStatus.**
**D. Heartbeat stale >15m (CAP-503):** M15 shows **"—"** — unavailable ≠ zero (INV-M15-13); onboarding tooltip documents the 15-min TTL.
**E. Two distinct thresholds (all three confirm — do NOT collapse):** CAP-501's **7.5-min** system-health stale threshold (5-min interval × 1.5) vs CAP-503's **15-min** UI-heartbeat display TTL are separate concerns.
**F. (adjacent, flagged)** `jobRuns` **manual_review** states (CAP-495 authz-fail, CAP-515 RC-4 manual_only) — Has-UI=YES M18 rows with **no inventory placement** (Open Question — where does a human action them?).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Redrive dead-letter | Founder/Admin | CAP-500 `jobs.redriveDeadLetter` | jobDeadLetters (redrivenAt, redrivenByUserId), jobRuns | CAP-499; revalidate authz/STOP/target |
| (System) Create dead-letter | System | CAP-499 (INV-M18-5) | jobDeadLetters | retries exhausted |
| (cron) Health probe | cron | CAP-501 `health.probe` (R-LIVENESS) | platformHealth, platformHealthProbes | none |
| (System) Stale-heartbeat render | System | CAP-503 | none | CAP-501 |

- **Delete dead-letter** — no capability. **Cancel/terminate active job** — not owned by these rows.

## 5. Analytics Events
**None.** Reliability rows write jobDeadLetters/jobRuns/platformHealth, not rawEvents — platform ops is outside the M16 product-event stream. **No auditLog on redrive** — attribution intrinsic to the `jobDeadLetters` row (redrivenByUserId + redrivenAt); observation, not drift.

## 6. Components Used
- **A1 Data table** (dead-letter list — inventory §3's highest-priority gap) · health dot (composable §11.5 pill/badge; no explicit status-dot token — soft flag) · §11 tooltip (CAP-503 names it) · §11.1 Button (redrive) + confirm Modal · §11.9 skeletons · §12.4 layout. Archetype gaps: Data Table + job-run timeline + liveness indicator + authorized-redrive pattern.

## 7. Open Questions
*(Escalated items in RECONCILIATION-7D. These are unspecified detail.)*
1. **Redrive semantics vs RC-4 manual_only (CAP-515)** — some dead-letters are high-stakes (legal restore, money, sanction, final publish, permanent termination); no CAP states whether redrive resets attempt count / respects the no-auto-retry class, or whether redriving a manual_only failure is permitted. (Opus.) → surfaced (money/legal-adjacent).
2. **`jobRuns` manual_review has no action surface** — CAP-495/515 are Has-UI=YES with no inventory placement (where does a human action them?). (GLM + Opus.)
3. **`jobRuns` full state enum** unenumerated in the bible ("state incl. manual_review") — M18 sheet owns. (GLM + GPT.)
4. **Redrive runbook artifact home** unowned (candidate: `adminWikiArticles`); runbook-completion enforcement undefined. (GLM + GPT.)
5. **Failed-redrive behavior** (new dead-letter vs update original) + transaction boundaries — unspecified. (GPT.)
6. **No auditLog on redrive** — confirm self-attributing-row pattern is intended vs the admin-write auditLog norm. (GLM.)
7. **Other M18 Has-UI rows without placement** (CAP-512/514/519/522) — fold here or unowned? (GLM.)
