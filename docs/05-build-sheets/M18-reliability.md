# DECISION — M18: Reliability & Platform Ops (Build Sheet · CONFIRMED + CLOSED)

**Status:** **CONFIRMED + CLOSED** · Design HIT ~91.8 · Confirm HIT mean ~96 (GPT 94 / Sonnet 98 / Opus 96 / GLM HIT) · Founder consented design 2026-08-07 · **FATAL-M18-04 baked** · **Date:** 2026-08-07  
**RACI:** R/A = PM · Consulted = GPT/GLM/Sonnet/Opus + Founder  
**Schema:** `M0-build-sheet-schema.md`. Bible = `_data-model.md`. Aggregate = `Aggregated/m18-reliability.md` · Confirm = `Aggregated/m18-confirm.md`. Auth = **DEC-AUTH (Convex Auth)**.

**North star:** Soft beta is not a demo — Convex-native durable jobs, **liveness** health, consent that doesn’t erase the ledger, two-system rollback, and **attribution ≠ authorization** on the scheduled path. FABLE-checkable literals throughout.

---

## 1. Header & Layer Profile
- **id:** M18 · **purpose:** jobCatalog/jobRuns · retry/idempotency · executionAuthority · platformHealth · degrade · consent CMP · security baseline · backup/rollback · DEC-L05 readiness gate · legal page hosting · M15 health hooks. · **owner:** PM · **status:** confirmed + closed.
- **dependencies (up):** Convex Auth · DEC-RAWEVENTS · M2–M17 job producers · M15 STOP/incidents/counters · DEC-L07. **(down):** none (last cross-cutting runtime module before M1 foundation polish).
- **Layer Profile:** Backend/Data = **Required** · Jobs = **Required** · Integration (PostHog gate, webhooks, GSC jobs) = **Required** · Customer-FE = **Supporting** (CMP + legal routes) · Admin-FE = **Supporting** (dead-letter visibility via M15) · Audit = **Required**.

## 2. Canonical Names & Enums
- **Tables:** `jobCatalog` *(source-controlled projection)* · `jobRuns` · `jobDeadLetters` · `authorizedCommands` · `platformHealth` · `platformHealthProbes` · `consentRecords` · `deployLog` · `launchReadinessResults` · deepen `systemConfig` · legal page version docs.
- **Enums:**
  - `jobKind`: mutation · action · cron_mutation · cron_action · projection · probe · cleanup
  - `jobRunState`: requested · scheduled · running · succeeded · retry_scheduled · dead_lettered · cancelled · superseded · **manual_review**
  - `retryClass`: none · mutation_native · external_read · external_idempotent_write · external_non_idempotent · high_cost_generation · **manual_only** *(RC-4)*
  - `executionAuthority`: **system** · **revalidate_actor** · **authorized_command** *(FATAL-M18-04)*
  - `dependencyState`: healthy · degraded · unavailable · unknown · recovering · stale · dead · never_ran
  - `platformState`: healthy · degraded · major_degradation · writes_paused · unknown
  - `consentPurpose`: strictly_necessary · functional · analytics · marketing
  - `readinessResult`: blocked · warning · ready · revoked
  - `schemaPhase`: expand · use · contract
  - `authorizedCommandStatus`: pending · consumed · revoked · expired · failed
- **Helpers:** `jobs.dispatch` · `jobs.claim` · `jobs.complete` · `jobs.scheduleRetry` · `jobs.assertExecutionAuthority` · `health.probe` · `health.liveness` · `consent.assertPurpose` · `readiness.evaluate` · `assertInternalOnly`
- **Components:** `@convex-dev/action-retrier` (external actions) · `@convex-dev/workpool` (**GLM/persona generation lane only**).

## 3. Scope & Non-Goals
- **In:** registry · dispatcher · retry law · dead-letter · crons · liveness health · independent watchdog · degrade matrix · CMP + rawEvents boundary · secrets/logging/webhooks · expand/contract · rollback runbook · launch gate · out-of-band critical alert · legal hosting · master P0 job registration.
- **Non-Goals:** Redis/Bull · rebuild domain logic · second STOP · public status page · PagerDuty · chaos · multi-region · formal SLOs · SIEM · inventing Legal officer names · customer FE polish beyond CMP/legal.

## 4. Domain Context
- **Terminology:** *Liveness* = ran successfully within expected window. *RC-4* = never auto-retry. *Expand/contract* = additive schema then code then drop later.
- **Invariants (INV-M18-1…16):**
  1. Schedule **`internal.*` only**; CI fails `api.*` schedule refs.
  2. Every scheduled job is in `jobCatalog` first.
  3. Scheduled mutations: Convex exactly-once; actions: at-most-once + idempotencyKey mandatory.
  4. Bounded retries + **full jitter**; no unbounded retry.
  5. Exhausted retries → `jobDeadLetters` — never silent drop.
  6. **Health is liveness**, not lastStatus (FATAL-M18-03).
  7. Unavailable ≠ 0 (inherit M15).
  8. **`rawEvents` not consent-gated; PostHog is** (FATAL-M18-02).
  9. No non-essential SDK init before affirmative consent.
  10. **Schema expand/contract** (FATAL-M18-01).
  11. Rollback is ordered two-system runbook (FATAL-M18-01).
  12. No secrets in client / `NEXT_PUBLIC_`.
  13. No PII in logs or job args (IDs only).
  14. Readiness = machine predicates, not empty checkboxes.
  15. **One STOP** — M15 owns chrome; M18 triggers it.
  16. **Independent health watchdog** — aggregator failure ≠ frozen green; OOB alert path does not share Convex failure domain.
  17. **`actorUserId` = attribution only, never authorization** (FATAL-M18-04). Every catalog job declares `executionAuthority`; client-supplied IDs never grant authority.
- **Actors:** system · cron · Admin · Founder · Legal (attestations).
- **Source of truth:** Convex scheduler + jobRuns; M15 for incidents; Vercel for frontend deploys; Convex for functions/schema.

## 5. Dependencies & Cross-Module Contracts
| Provider | Contract | Failure |
|----------|----------|---------|
| M2–M17 | Register jobs; domain logic stays in module | Unregistered jobKey throws |
| M15 | Consumes platformHealth; owns STOP/incidents | M18 never duplicates STOP |
| M16 | Mirror/reconcile jobs; rawEvents always; PostHog gated | — |
| M17 | Sitemap/GSC jobs | — |
| Legal | Art. 50 + rawEvents basis + policy copy | Pre-beta gates |

## 6. Data Model
- **`jobCatalog`** — jobKey, ownerModule, kind, internalFunctionKey *(allowlist)*, **executionAuthority** *(required)*, scheduleKey?, timeoutMs, retryClass, maxAttempts, backoffSeconds[], jitterPct=20, idempotencyScope, concurrencyKey?, importance, healthFreshnessSeconds, deadLetterAfterSeconds, featureFlag?, status, catalogVersion. *(Retry literals live per class in catalog — not per-job code.)*
- **`jobRuns`** — jobKey, catalogVersion, runKey, scheduledFor, startedAt?, completedAt?, state, attempt, maxAttempts, idempotencyKey, concurrencyKey?, sourceObjectType?, sourceObjectId?, actorUserId? *(attribution only)*, **executionAuthority**, **authorityOutcome**?, **commandId**?, **permissionVersionChecked**?, scheduledFunctionId?, lastHeartbeatAt?, nextAttemptAt?, timeoutAt?, resultClass?, errorClass?, errorFingerprint?, errorSummaryRedacted?, deadLetterReason?, parentRunId?, correlationId, createdAt, updatedAt. Indexes: by_jobKey_scheduledFor · by_state_nextAttemptAt · by_idempotencyKey · by_concurrencyKey_state · by_timeoutAt_state · by_sourceObject · by_correlationId · by_commandId.
- **`jobDeadLetters`** — jobRunId, jobKey, reason, createdAt, redrivenAt?, redrivenByUserId?. *(Manual redrive path documented in runbook — first non-empty DL is not improvisation.)*
- **`authorizedCommands`** *(FATAL-M18-04)* — commandId, commandType, actorUserId, authorizedByRole, authorizedAt, targetType, targetId, allowedTransition, payloadHash, expiresAt, status, revokedAt?, consumedAt?, idempotencyKey. Indexes: by_status_expiresAt · by_idempotencyKey · by_target. **Server-generated only** — never accept client command payloads.
- **`platformHealth` / probes** — probeKey/jobKey, state, severity, checkedAt, lastSuccessAt, expectedNextRunAt?, latencyMs?, failureClass?, freshUntil, dependency?, affectedCapabilities[], deepLinkKey.
- **`consentRecords`** — userId?, anonymousConsentId?, policyVersion, purposesGranted[], purposesDenied[], jurisdictionClass, collectionSurface, grantedAt, withdrawnAt?, supersededAt?, evidenceHash.
- **`deployLog`** — gitSha, convexVersion, vercelDeploymentId, schemaPhase, createdAt.
- **`launchReadinessResults`** — evaluatedAt, overall, blockers[], warnings[], evidence{}.

## 7. Domain States & Lifecycle
- jobRun: requested → scheduled → running → succeeded | retry_scheduled → … → dead_lettered | cancelled | superseded | **manual_review** *(authz reject / RC-4 fail — not transient retry)*.
- authorizedCommand: pending → consumed | revoked | expired | failed.
- dependency: healthy ↔ degraded ↔ unavailable/recovering; stale/dead/never_ran for liveness.
- consent: granted/withdrawn per purpose; policy version supersession.
- readiness: blocked | warning | ready | revoked.

## 8. Rules, Algorithms & Limits

### R-DISPATCH
TRIGGER: Domain schedules work or cron fires.  
CONDITION: jobKey in catalog · internal fn · feature/STOP permits · **executionAuthority declared**.  
ACTION: Insert jobRuns · schedule internal.dispatch · claim atomically · **assertExecutionAuthority** · execute · complete via mutation.  
EDGE: Pass `actorUserId` for attribution only (auth not propagated). Pass `commandId` only for `authorized_command` jobs.

### R-EXEC-AUTH (FATAL-M18-04)
TRIGGER: An internal scheduled function begins execution.  
CONDITION: Catalog entry exists · jobRun matches catalogVersion · executionAuthority declared.  
ACTION:
- **system** — Execute source-controlled system op only (projections, lease expiry, queue aging, health, counters, sitemap reconcile, quota housekeeping). `actorType=system`. No user authority. Scope constrained by jobKey. No arbitrary target/action args.
- **revalidate_actor** — Resolve `actorUserId`; re-check accountStanding · roleAssignments · permissionKeys · featureFlag · STOP · target state · command cancellation. Reject if authority gone. Used for: scheduled publication, manual retry, store restoration, config activation, operator-triggered generation.
- **authorized_command** — Load command by `commandId`; verify payloadHash · target · allowedTransition · expiry · revocation · idempotency; **atomically consume** and apply only the approved transition. Used when the initiating mutation intentionally authorizes a narrow future op that must survive later role changes (e.g. approved legal deadline transition, already-authorized notification, immutable publication schedule).
FEEDBACK: Write executionAuthority + authorityOutcome (+ permission/command version) into jobRuns / audit.  
RECOVERY: Authz failure → **cancelled** or **manual_review** — never retry as transient dependency failure.  
PRECEDENCE: Legal hold · safety hold · termination · STOP · command revocation · incompatible target state override delayed execution.  
EDGE: Client-supplied `actorUserId` / `commandId` / job args **never** grant authority.  
RC-4: legal restore · money · sanction · final publish · permanent termination remain **manual_only** — not reusable commands that silently repeat. A command may authorize **one** idempotent attempt; RC-4 failure → manual_review.

### R-ACTION-IDEMPOTENCY
TRIGGER: External action attempt.  
CONDITION: idempotencyKey present · no prior succeeded row for (jobKey, key).  
ACTION: Check **before** external call · call once · record result in follow-up mutation.  
RC-4: never auto-retry.

### R-RETRY
| Class | Max attempts | Backoff | Notes |
|-------|--------------|---------|-------|
| mutation_native | platform | Convex | Terminal on developer error |
| external_read | 4 | 30s,120s,600s + 0–20% jitter | |
| external_idempotent_write | 4 | 60s,300s,1800s + jitter | |
| external_non_idempotent | 1 | — | Manual/reconcile if uncertain |
| high_cost_generation | 3 | 60s,600s + workpool | Cost ceiling pauses lane |
| manual_only (RC-4) | 0 auto | — | Legal restore, money, sanction, publish |

### R-LIVENESS (FATAL-M18-03)
TRIGGER: health probe every 5m.  
ACTION: For each enabled catalog job: if now > lastSuccessAt + interval×1.5 → stale; ×3 → dead + alert; never ran → never_ran. Probe writes own heartbeat; if heartbeat >15m → M15 shows `—`.

### R-WATCHDOG (INV-16)
TRIGGER: Independent Vercel/HTTP cron *(different runtime than Convex aggregator)*.  
ACTION: Verify platformHealth.checkedAt freshness; if stale, force unknown/red path — do not trust frozen green snapshot. Alert **out-of-band directly** (email/SMS/Discord webhook) — not only via Convex-hosted alert path (shared failure domain = half a watchdog).

### R-CONSENT (FATAL-M18-02)
TRIGGER: App init / analytics.  
ACTION: strictly_necessary always (incl. server `rawEvents`). analytics → PostHog **not injected** until grant. Withdrawal stops future capture + vendor delete path. Legal confirms Art. 6 basis pre-beta.

### R-ROLLBACK (FATAL-M18-01)
TRIGGER: Production incident.  
ACTION: (1) STOP if write risk (2) Vercel Instant Rollback to schema-compatible deploy (3) Convex redeploy prior ref if needed (4) verify read/auth/safe-write/Admin (5) forward-correct data — never claim Vercel alone restores DB. Expand/contract mandatory. Rehearse once = GATE.

### R-READINESS
TRIGGER: Evaluate launch / set signup.mode=open.  
CONDITION: All GATE predicates true; unavailable probe = fail.  
ACTION: Server blocks open if any GATE false. Categories: identity · safety/legal · data integrity · runtime recovery · consent · supply · ops ownership (see aggregate §13 GPT + Opus).

### Limits
- Workpool maxParallelism GLM lane = **3** · glm.dailyCeilingCents (config) · maxAttempts per class above · health probe 5m · counter refresh freshness per M15 · no `.collect()` unbounded jobRuns on Home.

## 9. Backend Operations
| Function | Type | Notes |
|----------|------|-------|
| `jobs.dispatch` | internalMutation/Action | Shared harness |
| `jobs.complete` / `jobs.fail` | internalMutation | Terminal states |
| `jobs.redriveDeadLetter` | mutation | Admin |
| `health.probe` | internalAction | 5m cron |
| `health.watchdog` | HTTP/cron | Independent |
| `consent.record` / `consent.withdraw` | mutation | |
| `readiness.evaluate` | query/mutation | |
| `platform.backup.verify` | internalAction | Daily |
| Crons | `crons.ts` | All map to catalog keys |

**Env:** All secrets server-side; CI grep forbids credential `NEXT_PUBLIC_`.

## 10. Customer Frontend
CMP banner (granular purposes) · legal routes · no PostHog script pre-consent. Polish deferred.

## 11. Admin & Governance
M15 deep-links platformHealth · dead-letter list · intervention from job failures. No second incident UI. Out-of-band critical alert (email/SMS/Discord webhook) for DEAD jobs / critical probes. M15 onboarding tooltip documents **15-minute** probe heartbeat TTL (`—` when exceeded). Dead-letter **redrive** runbook required before open beta.

## 12. RBAC
| Role | Capability |
|------|------------|
| Founder/Admin | redrive · readiness · ceiling raise · alert channel config |
| Support | none for jobs |
| Member | consent self-service |

## 13. Integrations
Convex scheduler/crons · action-retrier · workpool (GLM) · PostHog (gated) · Vercel rollback · webhook HMAC providers · optional GSC/Bing jobs (M17).

## 14. Analytics, Audit & Observability
jobRuns/deadLetters audited · deployLog · consentRecords · no PII payloads in logs · M16 consumes operational events if catalogued · platformHealth → M15.

## 15. Content & Copy
Legal owns ToS/privacy/AI-disclosure text. CMP copy Legal-reviewed. Privacy notice states rawEvents vs PostHog boundary.

## 16. Edge Cases
| Trigger | Behavior |
|---------|----------|
| Overlapping cron skipped | Liveness → stale/dead; catch-up if allowed |
| Action succeeded, result mutation failed | Next attempt short-circuits via idempotency / reconcile |
| GLM 429 storm | Workpool + ceiling + full jitter; pause lane |
| Vercel rollback only | Allowed only if expand/contract compatible |
| Consent deny analytics | L08 still counts via rawEvents |
| Role revoked after schedule, before run | revalidate_actor → cancelled/manual_review; no privileged mutation |
| STOP activated between schedule and run | Precedence: STOP wins |
| Command revoked / expired / wrong hash | authorized_command rejects; not transient retry |
| RC-4 command fail | manual_review — no auto-retry |

## 17. NFR / Security / Privacy
OWASP L1 baseline · **webhook HMAC + 5m skew (P0 — protects rawEvents/M12 Signal integrity)** · rate limits (auth/legal/webhook/admin) · CORS · upload bounds · production/preview isolation. CI pre-deploy parses `crons.ts` + schedule sites and **non-zero exits** on `api.*` (not ESLint-only).

## 18. Fixtures, Tests & AC
**Fixtures:** catalog job · action with idempotency · RC-4 job · skipped cron · PostHog absent pre-consent · rawEvents without consent · stale probe · incompatible schema rollback blocked · readiness GATE fail · **role revoke after schedule** · **STOP between schedule and run** · **command cancel/expire** · **target-state change before exec**.  
**AC:**
- Given schedule api.*, When CI/lint/`crons.ts` parse, Then fail.
- Given duplicate idempotencyKey success, When retry, Then no second GLM call.
- Given cron skipped 3× interval, When health, Then dead/red not green.
- Given analytics denied, When page load, Then no PostHog network.
- Given analytics denied, When acquire, Then rawEvents still written.
- Given readiness GATE false, When set signup.mode=open, Then reject.
- Given dead-letter P0, When alert, Then M15 intervention + out-of-band.
- Given revalidate_actor + role revoked pre-exec, When run, Then cancelled/manual_review — no domain write.
- Given authorized_command + revoked commandId, When run, Then reject; command not consumed twice.
- Given client-forged actorUserId on system job, When run, Then no elevated authority.

## 19. Release, Migration & Rollback
- Additive schema only in soft beta (`contract` phase deferred post-beta — first contract = real migration + snapshot, not routine).  
- deployLog every prod promote.  
- Rollback rehearsal GATE before open beta.  
- Forward migrations for data correction.  
- Recovery drill: revoke operator role after schedule, before execution.

## 20. Global Projections & Open
**Projects to:** Bible Reliability · `_index` §X · M15 health · all module crons registered.  
**Open/carry:** Legal **bundle** (Art. 50 · Art. 6 rawEvents basis · privacy notice) as one engagement · DEC-O10/O12 names · DEC-L05 item list · DEC-S20 · Grievance Officer · alert channel credential.  
**Master P0 jobs:** Register GPT inventory (M2–M17) + Opus load-bearing set (counters, mod.age, drip, health, backup.verify) — full table in Build Sheet appendix / implementation catalog; no unregistered production cron.  
**Cross-module:** `adminCounters` write transactionality remains **M15** responsibility (not dropped).

### Soft-beta cut
**P0:** catalog (+executionAuthority) · runs · dead-letter+redrive runbook · dispatcher · assertExecutionAuthority · authorizedCommands · retrier · GLM workpool+ceiling · liveness+watchdog (OOB) · degrade · CMP+boundary · webhook HMAC · rollback rehearsal · readiness · M15 hooks · OOB alert · legal hosting · job registration · authz fixtures.  
**P1:** dead-letter UI polish · Sentry · synthetic uptime · status page.  
**Park:** Redis · PagerDuty · chaos · multi-region · formal SLOs · SIEM.

---

**Consent stamp:** Founder accepted Q1–Q5 / D1–D10 on 2026-08-07 (FATAL-M18-01/02/03).  
**Confirm stamp:** FATAL-M18-04 baked 2026-08-07 · M18 **CONFIRMED + CLOSED**.
