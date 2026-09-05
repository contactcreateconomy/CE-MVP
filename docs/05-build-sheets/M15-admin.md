# DECISION — M15: Admin & Ops Console (Build Sheet · CONFIRMED)

**Status:** **CONFIRMED + CLOSED** · BACKEND LOCKED · Design HIT mean ~91.4 (A/B/C) · **CONFIRMATION HIT** (GPT 94 / Opus 96 / Sonnet 96 / Opus freeze 100 — mean ~96.5; **FATAL-M15-01 baked 2026-08-07**) · **Admin-FE contracts = in-scope** · Customer-FE N/A · **Date:** 2026-08-07  
**RACI:** R/A = PM · Consulted = GPT/GLM/Sonnet/Opus + Founder  
**Schema:** `M0-build-sheet-schema.md`. Bible = `_data-model.md`. Rounds: `Aggregated/m15a-architecture.md` · `m15b-inventory.md` · `m15c-edges.md` · confirm `Aggregated/m15-confirm.md`. Auth = **DEC-AUTH (Convex Auth)**.

**North star:** SOTA ops cockpit for 1–2 humans — pyramid (holistic → drill → granular) · widget/plug-and-play registry · typed Tuesday config · STOP + intervention when humans must act · **baked-in Wiki** so the team knows what each surface does and its constraints. Not enterprise Trust-org theatre. Not N orphan admin apps.

---

## 1. Header & Layer Profile
- **id:** M15 · **purpose:** single Admin app that materializes every M2–M14 configurable/monitorable/queue · RBAC · audit · Support · DEC-S18 · ops literacy (Wiki) · intervention alerts. · **owner:** PM · **status:** backend locked.
- **dependencies (up):** M1/DEC-AUTH · M2–M14 locked machines (do not re-derive) · DEC-L06 · DEC-O13 · DEC-S18 · DEC-S15/S19 · Path B UGC OFF. **(down):** M16 (deep-link + staff-exclusion inherit) · M17 · M18 (`adminCounters` cron + job health).
- **Layer Profile:** Backend/Data = **Required** · Jobs (counters heartbeat consumer; STOP orphan escalate) = **Required** · Integration (Convex Auth) = **Supporting** · Customer-FE = **N/A** · Admin-FE = **Required** · Analytics = **Supporting** (rawEvents for admin actions; funnels = M16) · Audit = **Required**.

## 2. Canonical Names & Enums
- **Routes:** `/admin` · `/admin/home` · `/admin/work` · `/admin/content` · `/admin/community` · `/admin/commerce` · `/admin/support` · `/admin/system` · `/admin/audit` · `/admin/wiki` · `/admin/wiki/:slug`.
- **Tables (new/deepen):** `adminWidgets` · `configKeyRegistry` · `adminCounters` · `opsAssignments` · `opsCoverageAcknowledgements` · `operationalIncidents` · `quotaGrants` · `adminWikiArticles` · `adminInterventionAlerts` · deepen `systemConfig` · `roleAssignments` · `auditLog` · `users.isStaff` · `legalIntake` (DMCA canonical) · reuse `moderationCases` lease fields.
- **Enums:**
  - `widgetType`: queue · monitor · config_group · entity_crud · kill_switch · support_tool · gate_tracker · audit_explorer · deep_link · wiki_article
  - `widgetStatus`: active · hidden · disabled · deprecated · stub
  - `failDirection`: closed · open_forbidden · degrade · n_a
  - `configBlastTier`: tier1 · tier2 · tier3
  - `interventionSeverity`: critical · high · medium
  - `interventionStatus`: open · acknowledged · resolved · snoozed
  - `opsAssignmentSlot`: editor_primary · editor_backup · publisher_primary · publisher_backup · persona_publisher · moderator_primary · moderator_backup · after_hours_escalation · store_operator_primary · support_owner · support_channel
  - `opsAssignmentState`: filled · single_person_acknowledged · vacant · inactive_assignee
  - `stopIncidentState`: active · recovering · closed
  - Roles (snake_case): member · editor · publisher · moderator · store_operator · support_operator · administrator · founder *(capability; may map to administrator + founder keys)*
- **Functions (shell):** `admin.registry.list` · `admin.home.compose` · `admin.config.get/casUpdate` · `admin.kill.flip` · `admin.stop.activate/resume` · `admin.claim.shared` · `admin.support.*` · `admin.quota.grant` · `admin.opsAssignments.*` · `admin.wiki.get/list` · `admin.intervention.list/ack/resolve` · `admin.audit.query/export` · `assertOperationalCapability` · `assertAdminPermission` · **`assertCustomerCapability`** *(confirm C1 — shared authz layer)*.

## 3. Scope & Non-Goals
- **In:** shell · pyramid · widget registry hybrid · Home next-hour · STOP + Operational Modes · typed config · Work queues over one spine · all P0 domain widgets · Support · roles · opsAssignments launch gate · Wiki · intervention banner · DEC-S18 tracker · M16/17/18 health dots · edge predicates (claim · CAS · grants · calendars · counters · TERMINATE immediate).
- **Non-Goals:** PostHog/SEO/job rebuild (M16–18) · exploration curator · legitimacy editor · UGC Path B UI · Amazon · MoR · dual-control theatre · volunteer mods · public juries · Admin scripting / arbitrary Convex explorer · customer FE · Discord-style 45d audit retention.

## 4. Domain Context
- **Terminology:** *Command Center* = Home · *Widget* = registered source-controlled surface · *STOP* = chrome emergency halt · *Intervention* = Admin-only alert requiring human action · *Wiki* = in-console ops literacy · *failDirection* = what “off” means for a flag.
- **Invariants:**
  - **INV-M15-1** One shell; modules register widgets, never orphan pages.
  - **INV-M15-2** Server is the security boundary (role + permissionKeys + featureFlag for Admin; **`assertCustomerCapability` for customer writes** — standing + restrictions + STOP + flags).
  - **INV-M15-3** One `moderationCases` spine; views not parallel queues.
  - **INV-M15-4** Exploration firewall (Hero/Featured ≠ organic/exploration).
  - **INV-M15-5** Legitimacy firewall; Integrity console **calls** M12 only.
  - **INV-M15-6** Audit completeness; append-only; privileged write fails if audit cannot persist.
  - **INV-M15-7** No unbounded Home reads; s0/legal/STOP/unsafe destinations **live**; else `adminCounters`.
  - **INV-M15-8** Blast radius before Tier2/3 effect.
  - **INV-M15-9** Support = separate mutations only (lookup · TZ · notes · grants · allowlisted retries).
  - **INV-M15-10** STOP always reachable · never auto-resumes · owned incident.
  - **INV-M15-11** Every flag has `failDirection`; `mod.autoGate=false` = hold-all.
  - **INV-M15-12** Sealed keys not in generic config: `legitimacy.medianTarget` · `signal.eventWeights` · `signal.attributionSplit` · `trust.weightCap`.
  - **INV-M15-13** Every cron has heartbeat; stale counters ≠ 0.
  - **INV-M15-14** Policy copy versions forward; no in-place overwrite affordance.
  - **INV-M15-15** Safety clocks have named human or containment (4h s0 → throttle).
  - **INV-M15-16** Wiki is source-controlled / versioned; not free-form executable HTML/JS.
  - **INV-M15-17** Intervention alerts surface only when **human Admin action** is required; clear what / why / do / link.
  - **INV-M15-18** Unavailable ≠ zero.
  - **INV-M15-19** Every protected customer write calls `assertCustomerCapability` (confirm C1).
- **Actors:** founder · administrator · editor · publisher · moderator · store_operator · support_operator · M18 crons · automated monitors.
- **Source of truth:** module tables + `moderationCases` + `systemConfig` + registry metadata + `auditLog`.

## 5. Dependencies & Cross-Module Contracts
| Provider | Contract | Failure |
|----------|----------|---------|
| M2–M14 | Existing mutations/queries; M15 thin wrappers + AuthZ | Wrapper rejects; never reimplement machines |
| M13 | Lease 20m/renew 5m/max 60m · severity views · reason-code versions | Shared lease helper |
| M12 | `m12.damp` / `m12.neutralize` only | No score writes |
| M10 | Library publish/drip; UGC `FEATURE_DISABLED` | Path B hidden+reject |
| M18 | Refresh `adminCounters`; job health | Stale presentation + intervention |
| M16 | Deep-link · inherit `isStaff`/persona funnel exclusion | — |
| DEC-L06 / flags | `assertOperationalCapability` on customer writes | Fail per failDirection |

## 6. Data Model
- **`adminWidgets`** — widgetKey (immutable), moduleId, widgetType, title, routeKey, requiredPermissionKeys[], featureFlagKey?, status, homeEligible, defaultOrder, wikiSlug?, freshnessThresholdSeconds, dataSourceKey *(enum → source-controlled query)*, updatedAt. Indexes: by_status_order · by_domain.
- **`configKeyRegistry`** — key, module, valueType, default, min?, max?, enumValues[]?, editTier, blastRadius (≤140 chars), failDirection?, effectiveTiming, reversible, sealed *(bool — true = not editable in Admin)*, version schema. Keys immutable; values in `systemConfig`.
- **`systemConfig`** *(deepen)* — key, value, valueType, version, updatedByUserId, updatedAt, reason?. CAS on version.
- **`adminCounters`** — counterKey, value, computedAt, health {healthy|stale|failed}. Cron-owned.
- **`opsAssignments`** — slot, userId?, channel?, state, updatedAt. Unique slot.
- **`opsCoverageAcknowledgements`** — single_person_coverage_acknowledged, acknowledgedByUserId, acknowledgedAt, expiresAt?.
- **`operationalIncidents`** — type {stop|coverage|supply|other}, capabilityKey?, ownerUserId, activatedByUserId, reason, reviewAt, handoffDueAt, expectedDurationMin?, recoveryCheckKey, state, createdAt, closedAt?.
- **`quotaGrants`** — userId, extraAcquires (1–5 Support), expiresAt, grantedByUserId, reason, incidentId?, neutralizedAt?. Indexes: by_user_active · by_incident unique.
- **`adminWikiArticles`** — slug, title, domain, bodyMarkdown *(sanitized)*, relatedWidgetKeys[], constraintsSummary, version, updatedAt, updatedBy. Source-synced at deploy; Founder may not inject scripts.
- **`adminInterventionAlerts`** — alertKey, severity, title, whatHappening, whatToDo, deepLinkRouteKey, relatedIncidentId?, status, createdAt, acknowledgedByUserId?, acknowledgedAt?, resolvedAt?, snoozeUntil?. Indexes: by_status_severity · by_open.
- **`users`** *(deepen)* — `isStaff: boolean` (exclude from S18/L08 product counters).
- **Canonical config keys (G1–G3 + M14):** `quota.perDay=5` · `quota.perWeek=20` · `drip.itemsPerDay=1` · `drip.minScheduledDays=14` · `drip.launchInventoryFloor=40` · `drip.targetInventoryPerWeek` *(monitor-only)* · `leaderboard.minParticipants=25` · aliases for deprecated names one release.
- **Sealed (F-B5):** legitimacy/weights keys — code only.
- **Worked example — intervention:** `{ alertKey: "drip.supply.low", severity: "high", title: "Drip supply below 14 days", whatHappening: "Scheduled publishable inventory covers 9 days. First open date: 2026-08-16.", whatToDo: "Open Drip Schedule → fill missing days or pause drip with reason. Page publisher_backup if primary offline.", deepLinkRouteKey: "content.drip_schedule", status: "open" }`.

## 7. Domain States & Lifecycle
1. **Widget:** stub → active | hidden | disabled | deprecated.  
2. **STOP incident:** active → recovering → closed (manual resume only).  
3. **Intervention:** open → acknowledged | snoozed → resolved.  
4. **opsAssignments:** vacant → filled | single_person_acknowledged; inactive on role revoke.  
5. **Launch readiness:** blocked ↔ ready (checklist predicate).  
6. **Precedence:** hard-harm/legal live > STOP > interventions > next-hour work > supply/config.

## 8. Rules, Algorithms & Limits
- **R-SHELL:** All Admin routes require ≥1 Admin-app permission via `tokenIdentifier` → user → roleAssignments.
- **R-REGISTRY:** Executable catalog source-controlled; DB metadata only. Forbidden types rejected at validation.
- **R-AUTHZ:** `assertAdminPermission` + featureFlag before data; hidden route → FEATURE_DISABLED/NOT_FOUND.
- **R-CAPABILITY:** Customer writes call **`assertCustomerCapability(ctx, capabilityKey)`** then module eligibility. Admin/ops flips call `assertOperationalCapability` / `assertAdminPermission`.
- **R-CUSTOMER-GUARD (confirm C1 / FATAL-M15-01):** Every protected customer mutation resolves `tokenIdentifier` → user, then atomically evaluates (precedence): **TERMINATED > SUSPENDED > active capabilityRestrictions > global STOP > module feature flag > ordinary eligibility**. Reject **before** any domain write, event append, counter, notification, or external action. Feedback = approved M13 standing/restriction copy + duration + appeal route where applicable. **Do not rely on** client refresh, JWT regen, UI hide, cached standing, or TrustTier alone. Applies to: create_post · create_comment · react · report · submit_reference · manage_store · tag_product · tag_resource · revival_vote · resource_acquire *(plus other write capabilities as modules add them)*. Legal/privacy/eligible appeal paths keep explicit exceptions. Mutation already committed before standing transition stays; every mutation **beginning after** transition fails. Role/permission revocation for Admin likewise takes effect on the **next server request**.
- **R-FAILDIR:** `mod.autoGate=false` → hold-all; never publish. Moat off → Signals cannot finalize (F-B2). Rulebook: hardGates vs shadowEvaluation (F-B1).
- **R-HOME:** ≤8 next actions; critical strip order: S0 · legal overdue · unsafe destinations · classifier/outage · active STOP · M18 critical · open interventions (critical/high). Deterministic priority tuple (Round A). Same case id collapses once.
- **R-LEASE:** Shared on case; 20/5/60; cross-widget.
- **R-CONFIG:** CAS · reason for tier2/3 · blastRadius mandatory · Tier3 typed confirm · sealed keys absent from editor.
- **R-STOP:** Activate → incident + audit; expectedDurationMin required; never auto-resume; handoffDueAt escalates backup/Founder.
- **R-S0-COVER:** Unclaimed s0: +15m backup · +15m Founder; **>4h → ingest.throttle** + intervention. Launch requires after_hours_escalation or UGC writes disabled.
- **R-GRANT:** Support ≤5 · ≤7d · max 1 active/user · unique incident; rolling >3/90d → Admin intervention.
- **R-CALENDAR:** grievance_india = Asia/Kolkata + India holidays; DMCA = US business days.
- **R-STAFF:** `isStaff` + personas excluded from S18/L08; M16 inherits.
- **R-TERMINATE:** Immediate capability revoke (F-C5).
- **R-WIKI:** Every P0 widget has wikiSlug; Wiki reachable from shell + widget help. Body: What · When to use · Steps · Constraints · Escalation · Related flags.
- **R-INTERVENTION:** Create when human Admin action required (monitor threshold, STOP orphan, counters stale, coverage vacant, drip&lt;14, grant abuse, cron death, readiness red). Banner on Home + optional dedicated `/admin/home#interventions`. Copy must include whatHappening + whatToDo + deep link. Not for informational vanity metrics.
- **Limits:** pageSize default 25 / max 100 · batch ≤25 · Home preview 5 · Wiki body sanitised Markdown only.

### Key predicates (abbrev.)
`TRIGGER admin_home_open → CONDITION authz → ACTION compose live critical + counters + ≤8 actions + open interventions → FEEDBACK Updated[abs] · stale labels → RECOVERY region fail ≠ zero → EDGE case collapse`  
`TRIGGER stop_activate → CONDITION permission+reason+version → ACTION disable+incident+audit → FEEDBACK chrome owner/time → RECOVERY separate resume → PRECEDENCE overrides flags → EDGE activator offline keeps ownership`  
`TRIGGER intervention_threshold → CONDITION human_action_needed → ACTION upsert alert open → FEEDBACK Home banner → RECOVERY ack/resolve → EDGE snooze max 24h critical forbidden`

## 9. Backend Operations
- **Queries:** home.compose · registry.listForActor · config.getNamespace · wiki.get/list · intervention.listOpen · audit.query · opsAssignments.list · support.userSummary (masked).
- **Mutations:** config.casUpdate · kill.flip · stop.activate/resume · claim/release/takeover · quota.grant/neutralize · intervention.ack/resolve · opsAssignments.upsert · roles.assign (Founder) · support.timezone.fix · support.note.create · wrapper calls into module APIs.
- **Actions:** audit.export · rare external health probes.
- **Crons (M18-owned; M15 consumes):** adminCounters.refresh (~60s) · stop.orphanEscalate · drip.supplyCheck (09:00 UTC) · intervention.reconcile.
- **Auth:** every fn `ctx.auth.getUserIdentity()` → tokenIdentifier → user; Support functions are dedicated exports.
- **Idempotency:** claim leaseVersion · config version · grant (userId,incidentId) · intervention alertKey upsert.

## 10. Customer Frontend
**N/A** — Admin-only module. Customer surfaces unchanged except capability guards already owned by modules.

## 11. Admin & Governance
### 11.1 Shell
Constant chrome: env badge · role · search · command palette (P1 nav; P0: search+STOP) · alert count · operational-mode indicator · **Wiki** · profile. Layout: nav | main | optional inspector. Preview cannot mutate production.

### 11.2 L1 Nav
Home · Work · Content · Community · Commerce · Support · System · Audit · **Wiki**.

### 11.3 Home regions
1. **Intervention / Critical banner** (always first if any open critical/high)  
2. Critical strip (S0, legal, unsafe links, STOP, outages)  
3. Next actions ≤8  
4. Queue aging  
5. Operational modes (active only)  
6. Supply  
7. DEC-S18 gate  
8. M16/17/18 health dots  

### 11.4 Wiki (`/admin/wiki`)
- Index by domain matching L1.  
- Article template (required sections): **What this is** · **Who may use it** · **How to operate (steps)** · **Constraints / failDirection** · **When to escalate** · **Related config keys & flags** · **Related widgets**.  
- Entry points: global Wiki · per-widget `?` → slug · intervention “Learn more” → slug.  
- Soft-beta: ship articles for all **P0** widgets (source-controlled Markdown in repo; deploy syncs `adminWikiArticles`).  
- Not a CMS for arbitrary HTML; no scripts.

### 11.5 Intervention banner contract
| Field | Rule |
|-------|------|
| Severity | critical (STOP/S0/legal/authz failure) · high (supply/coverage/counters) · medium (backlog) |
| Copy | Plain English what + what to do; no adjective-only |
| Action | Primary deep-link button · Ack · Resolve (when done) · Snooze (non-critical ≤24h) |
| Audience | Admin-app roles with relevant permission; Support sees only support-scoped alerts |
| Dedup | One open alert per alertKey |

### 11.6 P0 widgets (implementation order)
1 registry · 2 roles · 3 configIndex · 4 killPanel+STOP · 5 audit · 6 Work queues (Immediate→Waiting) · 7 appeals/legal/standing/reasonCodes · 8 editorial+handWrite+sources · 9 libraryPublish/drip · 10 persona review/population · 11 showcase/holds/comments · 12 store validation/conflict · 13 editorial affiliate+linkHealth+storefront+seeds · 14 eligibility/tiles/retention/newsletter · 15 hero/featured · 16 integrity+rankDrop · 17 support.* · 18 opsAssignments+S18+health · 19 **Wiki sync** · 20 **Home+interventions+counters**.

### 11.7 Soft-beta cut
**P0:** above + G1–G8 + F-B1…5 + F-C1…5.  
**P1:** intelligence detail · deep feed-health · season chrome · tool registry CRUD · revival · campaign studio polish · advanced audit export · command palette beyond nav.  
**Park:** UGC UI · Amazon · MoR · experiments · dual-control · exploration curator · legitimacy editor.

## 12. RBAC
| Capability | support | mod | editor/pub | store | admin | founder |
|------------|---------|-----|------------|-------|-------|---------|
| Home / Work read | ✓ limited | ✓ | scoped | scoped | ✓ | ✓ |
| Claim/resolve M13 | — | ✓ | — | — | ✓ | ✓ |
| Terminate | — | — | — | — | ✓ | ✓ |
| Publish editorial/library | — | — | ✓ | — | ✓ | ✓ |
| Store validate | — | — | — | ✓ | ✓ | ✓ |
| Config tier1 | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Config tier2/3 · kill · STOP | — | — | — | — | ✓ | ✓ |
| Role assign · registry · quarantine · sealed | — | — | — | — | — | ✓ |
| Wiki read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Quota grant | ✓ bounds | — | — | — | ✓ | ✓ |
| Intervention ack (scoped) | support-only | ✓ | ✓ | ✓ | ✓ | ✓ |

Presets DEC-O13: Admin / Operator(Editor+Publisher+Store) / Moderator. Founder-only keys as table.

## 13. Integrations
- Convex Auth identity · M18 health() `{status,lastCheckedAt,deepLinkUrl}` · optional PostHog/Search Console deep-links · no new payment providers.

## 14. Observability & Audit
- 100% config/kill/STOP/role/grant/sanction/publish/validate → `auditLog`.  
- Intervention create/ack/resolve audited.  
- Exports audited. Never delete auditLog (archive cold OK).

## 15. Config registry projection
All module keys from inventory appendix grouped under Content / Community / Library / Commerce / Trust / Retention / System. Canonical G1–G8. failDirection on flags. Sealed list excluded.

## 16. Acceptance Criteria
1. Unauthorized user cannot load widget metadata.  
2. Flag false → mutation FEATURE_DISABLED even via direct call.  
3. Two widgets same case → one lease.  
4. Config CAS rejects stale version.  
5. STOP creates owned incident; resume separate; no auto-resume.  
6. S0 unclaimed >4h → throttle + intervention.  
7. Counters stale → "—" not 0 + intervention.  
8. Support cannot terminate/kill/edit config.  
9. Grant stacking rejected (1 active).  
10. Every P0 widget has Wiki article with Constraints section.  
11. Intervention copy includes whatToDo + deep link.  
12. opsAssignments vacant critical → launch readiness blocked.  
13. Staff excluded from S18 counter query.  
14. legalIntake DMCA path only (no dmcaNotices dual write).  
15. Hero assignment does not change organic/exploration scores.  
16. **TERMINATED/SUSPENDED user:** next `create_post`/`create_comment`/… fails with standing response; no write side effects.  
17. Intervention `deepLinkRouteKey` rejects arbitrary URLs (source-controlled keys only).  
18. STOP resume blocked until `recoveryCheckKey` passes.  
19. Missing Wiki article → explicit “no article yet”, not empty broken panel.  
20. s0>4h throttle → intervention title includes “INGEST THROTTLED — S0 BACKLOG”.  
21. Rolling `quotaGrants` >3 in 90d → Admin intervention (PRED-C7).

## 17. Test plan (abbrev.)
Authz matrix · **assertCustomerCapability on every listed mutation** · TERMINATE then immediate write fail · flag×widget · lease cross-view · CAS conflict UI · STOP orphan escalate · resume checks recoveryCheckKey · grant stack + 90d monitor · calendar India vs US · counter heartbeat kill · Wiki sanitise + missing article · intervention dedupe · Path B UGC reject · Amazon reject · Admin revoke next-request.

## 18. Open / Constrained / Deferred
| ID | Status | Note |
|----|--------|------|
| DEC-O01/02/05/08 names | OPEN → **launch gate** | Fill opsAssignments |
| Second Founder account | CONSTRAINED | Required before beta (founder consented) |
| India holidays 2026 | CONSTRAINED | Populate before beta |
| DEC-M11-AMAZON | OPEN | Parked UI |
| DEC-S20 | OPEN | Blocks public download elsewhere |
| Command palette full | DEFERRED P1 | |
| Hard-harm quarantine UI | DEFERRED | Stub + Wiki note |

## 19. Launch blockers (Admin)
opsAssignments green or single-person ack · after_hours set · STOP+single-link pause smoke · counters health visible · Wiki P0 articles shipped · drip ≥14d · inventory ≥40 · Path B rejects · audit atomicity · readiness checklist version recorded · second Founder account exists.

## 20. Global projection
- **Bible:** Admin & Ops (M15) section; snake_case roles; legalIntake DMCA; new tables above; `users.isStaff`.  
- **RBAC:** permission keys + Founder-only.  
- **Config:** unified quota/leaderboard/flags.  
- **Analytics:** admin.* events; funnel exclusion contract to M16.  
- **DEC-M15-***: see `_index`.

---

## Founder addendum (consented 2026-08-07)
1. Overnight: Founder after-hours · single-person ack · **4h → throttle** stated policy (not public SLA).  
2. Second Founder-capable account before beta.  
3. India 2026 holidays populated before beta.  
4. STOP never auto-resumes.  
5. **Wiki baked into Admin** for ops literacy.  
6. **Intervention banner** on Home for Admin errors needing human action — clear what + what to do.

### Confirmation bake-in (2026-08-07)
- **FATAL-M15-01:** `assertCustomerCapability` on every protected customer write (standing → restrictions → STOP → flags → eligibility).  
- Hardening: deepLink = route keys only · Admin revoke next request · Wiki missing-article state · STOP resume checks recoveryCheckKey · throttle intervention copy · grant 90d monitor · audit-fail → intervention.

**One-line:** One cockpit — widgets not pages, typed config, owned STOP, Wiki for humans, intervention when humans must act — and TERMINATE bites on the next server mutation.
