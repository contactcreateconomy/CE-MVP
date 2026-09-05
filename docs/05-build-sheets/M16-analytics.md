# DECISION — M16: Analytics & Instrumentation (Build Sheet · CONFIRMED)

**Status:** **CONFIRMED + CLOSED** · Design HIT mean ~89.7 · **CONFIRMATION HIT** (GPT 94 / Opus 95 / Sonnet 97 / GLM HIT — mean ~96.5; **FATAL-M16-01 baked 2026-08-07**) · Customer-FE deferred · Admin analytics = in-scope · **Date:** 2026-08-07  
**RACI:** R/A = PM · Consulted = GPT/GLM/Sonnet/Opus + Founder  
**Schema:** `M0-build-sheet-schema.md`. Bible = `_data-model.md`. Aggregates: `m16-analytics.md` · confirm `m16-confirm.md`. Auth = **DEC-AUTH (Convex Auth)**.

**North star:** Analytics is the **prized possession** — a versioned **event catalog** + **DEC-L08 lifecycle spine** (honest core + branches) over **`rawEvents`**, with **PostHog as exploration lens only**. Founder weekly review ends in ≤3 owned decisions — not vanity DAU wallpaper.

---

## 1. Header & Layer Profile
- **id:** M16 · **purpose:** instrumentation contracts · event catalog · dual substrate · L08/S18/activation/commerce projections · Founder decision dashboard · privacy · PostHog mirror · erasure alignment. · **owner:** PM · **status:** confirmed + closed.
- **dependencies (up):** DEC-RAWEVENTS · DEC-L08 (reinterpreted — §4) · DEC-S18 · DEC-M11-DATA-HONESTY · M2–M15 event producers · M14 onboarding/retention family · M15 staff/persona exclusion + health deep-link. **(down):** M17 (referrer/organic) · M18 (projection crons / health).
- **Layer Profile:** Backend/Data = **Required** · Jobs (projections · PostHog mirror · reconcile) = **Required** · Integration (PostHog) = **Required** · Admin-FE = **Required** (`/admin/analytics`) · Customer-FE = **DEFERRED** (capture SDK wiring only as contracts) · Analytics = **Required** · Audit = **Supporting**.

## 2. Canonical Names & Enums
- **Routes:** `/admin/analytics` (M16-owned). M15 Home = health dot + deep-link only.
- **Tables (new/deepen):**
  - `eventCatalog` *(source-controlled + deploy-synced registry; may also mirror metadata rows)*
  - deepen `rawEvents` (envelope §6)
  - `users.analyticsSubjectId` *(opaque stable; PostHog distinct_id)*
  - `identityJoins` *(anonymousSessionId → userId)*
  - `analyticsProjections` *(rollup buckets)*
  - `analyticsWeeklyDecisions` *(Founder ritual output)*
  - `analyticsDeletionRequests` *(PostHog erasure tracking)*
  - `instrumentationIncidents` *(mirror/exclusion/catalog health)*
  - **`analyticsEligibilityAdjustments`** *(confirm FATAL-M16-01 — append-only later eligibility)*
- **Enums:**
  - `eventClass`: product_behavior · business_outcome · operational · moderation · commerce_intent · commerce_confirmed · system_health · analytics_control
  - `captureMode`: server_authoritative · client_observational · server_and_posthog · client_and_posthog · server_only_sensitive
  - `piiClass`: none · pseudonymous · restricted · prohibited *(mandatory at catalog registration)*
  - `consentGate`: none · essential · analytics_consent · commercial_measurement
  - `l08Stage`: eligible_impression · eligible_click · destination_viewed · signup_completed · first_action_completed · first_resource_acquired · day7_returned · qualified_affiliate_clicked *(optional downstream — not core ordered stage)*
  - `commerceFunnel`: none · library · affiliate · paid_commerce
  - `conversionType`: resource_acquisition · qualified_affiliate_intent · network_confirmed_sale · paid_order *(never unlabeled “conversion”)*
  - `idempotencyScope`: none · event_id · mutation_id · user_object_lifetime · user_object_window · conversion_id
  - `catalogStatus`: draft · active · deprecated · blocked
  - `actorType`: anonymous · member · staff · persona · system · operator · merchant
  - `integrityState`: unreviewed · eligible · pending · invalid · reversed
  - `tombstoneState`: active · identity_detached · tombstoned · legally_restricted
  - `sampleStatus`: confident · directional *(denominator &lt; 25)*
  - `projectionFreshness`: complete · partial · stale · **recalculating**
  - `deletionRequestStatus`: requested · submitted · confirmed · failed · retrying
  - **`eligibilityAdjustmentType`:** invalidate · reverse · restore · detach_identity · exclude_staff · exclude_test
  - **`currentEligibilityState`:** eligible · invalid · reversed · identity_detached_ineligible · excluded_staff · excluded_test
- **Helpers:** `isCountableAtWrite(...)` · **`effectiveCountable(event)`** · `assertCatalogEvent` · `emitRawEvent` · `appendEligibilityAdjustment` · `mirrorAllowlistedToPostHog` · `reconcilePostHogDaily`
- **Naming:** Amplitude-style `noun_past_tense_verb` + `ownerModule` field. **Preserve locked M14 names** as-is. No freestyle FE names. Autocapture **OFF**.

## 3. Scope & Non-Goals
- **In:** catalog · dual substrate · L08 core+branches · three commerce funnels · activation+catalog annotation · S18 projection · 7-card Founder dash · staff/persona exclusion · seller privacy contract · PostHog mirror+reconcile · instrumentation health · erasure · weekly decision record · search/abandon P0 events · M15 health handoff.
- **Non-Goals:** A/B platform · session replay · heatmaps · warehouse/SQL · vanity dashboard builder · paid-commerce UI before DEC-S18 · PostHog as ledger · M15 queue rebuild · M12 HOW exposure · GA4 third truth · customer-facing analytics.

## 4. Domain Context
- **Terminology:**
  - *L08 core* = ordered 7 stages (impression→click→destination→signup→first action→first acquire→day7 return). **Affiliate is optional downstream / branch**, not a mandatory core stage (**DEC-M16-L08**).
  - *Branch funnels* = discussion · library · affiliate (separate).
  - *Ledger* = `rawEvents`. *Lens* = PostHog.
  - *isCountableAtWrite* = initial eligibility stamp at capture (`!isStaff && !isPersona && integrity ok && production`).
  - *effectiveCountable* = stamp **plus** later adjustments / integrity / tombstone (**DEC-M16-ELIG**).
- **Invariants (INV-M16-1…13):**
  1. `rawEvents` sole ledger for L08/S18/activation/acquire/Signal-eligible/money-adjacent numbers.
  2. Same-mutation authoritative capture (DEC-RAWEVENTS).
  3. PostHog/mirror failure never blocks customer mutation (except when rawEvents write is in the same required tx).
  4. Catalog registration required before emit; unknown → reject/quarantine + `instrumentation_error`.
  5. `isCountableAtWrite` stamped at write with `isStaff`/`isPersona`; **never the sole permanent eligibility decision**.
  6. No PII in event properties; vendors get `analyticsSubjectId` only — **never `tokenIdentifier`**.
  7. DEC-M11-DATA-HONESTY on seller analytics.
  8. M12 HOW / legitimacy / weights never in analytics UI; Signal cards = aggregate outcomes only.
  9. Every rate shows denominator `n% (x/y)`; below **n=25** → directional; **suppress trend arrows & drop-off alerts**.
  10. Three commerce funnels never merge; every conversion labeled with `conversionType`.
  11. L08 core ≠ mandatory affiliate stage; direct-entry ≠ drop-off; incomplete cohorts labeled **cohort incomplete** (not zero-catastrophe).
  12. Activation card **inlines** catalog annotation; acquire rows stamp **`catalogSizeAtTime` · `resourceAgeDays`** (cannot-backfill).
  13. **Effective eligibility** for all product projections = `effectiveCountable` via append-only `analyticsEligibilityAdjustments`; original rawEvents rows are never silently rewritten (confirm FATAL-M16-01).
- **Actors:** anonymous · member · staff · persona · system · Founder (weekly review) · Admin (read analytics) · PostHog (vendor).
- **Source of truth:** domain tables > rawEvents > M16 projections > PostHog.

## 5. Dependencies & Cross-Module Contracts
| Provider | Contract | Failure |
|----------|----------|---------|
| DEC-RAWEVENTS | Append-only same-mutation capture; tombstone/erasure | Fail mutation if authoritative rawEvents cannot persist |
| M2–M15 | Emit catalogued events from owning mutations | Unregistered name rejected |
| M14 | Consume locked onboarding.*/retention.* names | Map semantics; do not silently rename history |
| M15 | Health deep-link; staff/persona flags; STOP does not own funnels | — |
| M11 | Seller aggregate privacy query | k≥5 + anti-differencing |
| M12 | Outcomes only for Signal analytics | Never weights/legitimacy |
| M18 | Runs projection/mirror/reconcile crons | Stale → show freshness, not 0 |
| PostHog | Allowlisted mirror + identify(analyticsSubjectId) | Incident; Convex wins |

## 6. Data Model
- **`eventCatalog`** — eventName, schemaVersion, eventClass, ownerModule, description, captureMode, authoritativeSource?, requiredPropertiesSchemaRef, optionalPropertiesSchemaRef, piiClass, consentGate, l08Stage?, commerceFunnel?, signalEligible, s18Eligible, excludeStaff, excludePersonas, idempotencyScope, retentionClass, posthogMirror, status, effectiveFrom, deprecatedAt?, replacementEventName?, owner.
- **`rawEvents`** *(deepen envelope)* — eventId, eventName, schemaVersion, occurredAt, recordedAt, ownerModule, actorType, userId?, analyticsSubjectId?, anonymousSessionId?, sessionId?, sessionSequence?, source, referrerClass?, surface?, placement?, position?, viewMode?, objectType?, objectId?, authorUserId?, authorType?, **contentAuthorType?**, postTypeId?, **isStaff**, **isPersona**, **isCountableAtWrite**, integrityState, consentVersion?, properties, idempotencyKey?, tombstoneState, catalogSizeAtTime?, resourceAgeDays?, posthogMirroredAt?, environment. *(Do **not** mutate isCountableAtWrite after write.)*
- **`analyticsEligibilityAdjustments`** *(new — FATAL-M16-01)* — sourceEventId, adjustmentType, resultingEligibility, reasonCode, sourceModule, sourceRecordId?, effectiveAt, createdAt, idempotencyKey. Latest valid adjustment + stamp + tombstone → **effectiveCountable**.
- **`users`** *(deepen)* — **analyticsSubjectId** (unique, opaque, assigned at user create/link). `tokenIdentifier` remains Auth-only.
- **`identityJoins`** — anonymousSessionId, userId, joinedAt, unique constraints preventing multi-user merge.
- **`analyticsProjections`** — projectionKey, windowStart, windowEnd, dimensions{}, metrics{}, sampleStatus, definitionVersion, computedAt, freshness, **lastCalculatedAt**.
- **`analyticsWeeklyDecisions`** — periodStart, periodEnd, decision, evidence, **metricSnapshots{}**, **projectionDefinitionVersion**, **catalogVersion**, ownerUserId, nextAction, reviewDate, createdAt.
- **`analyticsDeletionRequests`** — analyticsSubjectId, status, requestedAt, submittedAt?, confirmedAt?, lastError?. *(Erasure incomplete until PostHog delete **confirmed**.)*
- **`instrumentationIncidents`** — type, severity, eventNames[], detail, status, createdAt, resolvedAt?.
- **`analyticsReconcileResults`** *(visible)* — ranAt, mirroredEventDiff, status {ok|untrusted|failed}, affectedEventNames[].

**Worked example (acquire):**
`{ eventName: "resource_acquired", schemaVersion: 1, actorType: "member", isStaff: false, isPersona: false, isCountableAtWrite: true, objectType: "resource", properties: { resource_id, acquisition_id, catalogSizeAtTime: 42, resourceAgeDays: 3 }, integrityState: "eligible", tombstoneState: "active" }`

## 7. Domain States & Lifecycle
- Catalog entry: draft → active → deprecated|blocked.
- rawEvents tombstoneState: active → identity_detached | tombstoned | legally_restricted.
- Deletion request: requested → submitted → confirmed | failed → retrying → confirmed.
- Projection freshness: complete | partial | stale.
- Instrumentation incident: open → resolved.
- Weekly decision: recorded (append-only).

## 8. Rules, Algorithms & Limits

### R-L08-CORE — Ordered lifecycle (not one strict path through affiliate)
TRIGGER: Founder L08 card / projection cron.  
CONDITION: Eligible countable events; windows: impression→signup 7d · signup→first_action 7d · signup→acquire 14d · acquire→day7 30d.  
ACTION: Compute stage counts for core 7; report affiliate as optional branch; report discussion/library/affiliate branch funnels separately; direct-entry share visible.  
FEEDBACK: Rates as `n% (x/y)` · sampleStatus.  
RECOVERY: Rebuild from rawEvents.  
PRECEDENCE: Domain tables for acquire/signup beat mirrored PostHog.  
EDGE: Skip discussion / pre-acquire affiliate / never-affiliate = valid, not false drop-off.

### R-COUNTABLE — Write-time stamp (initial only)
TRIGGER: Any rawEvents write for product metrics.  
CONDITION: Resolve isStaff/isPersona from canonical user/author records (not client trust).  
ACTION: Stamp isStaff, isPersona, **isCountableAtWrite**. Never treat this stamp as irrevocable.  
EDGE: Staff using customer routes still excluded at write.

### R-EFFECTIVE-ELIG — Confirm FATAL-M16-01 / DEC-M16-ELIG
TRIGGER: M12 clawback/fraud · M13 account review · M11 conversion reverse/refund · authorized staff/test reclassification · identity detach.  
CONDITION: Source rawEvents row exists; effective analytics eligibility changes.  
ACTION: Append idempotent `analyticsEligibilityAdjustments` row; **do not rewrite** rawEvents; mark affected projections dirty (`freshness=recalculating`); recompute L08/activation/commerce/S18 windows from **effectiveCountable**.  
FEEDBACK: Founder dash shows recalculating for affected period; S18 shows recalculated eligible count + definitionVersion.  
RECOVERY: Confirmed correction may append `restore`; latest valid adjustment wins.  
PRECEDENCE: Confirmed fraud/reversal/staff-test exclusion **override** isCountableAtWrite.  
EDGE: PostHog may lag; Convex projections authoritative; reconcile flags untrusted until annotated/corrected.

**effectiveCountable =**  
`isCountableAtWrite AND tombstoneState="active" AND currentEligibilityState NOT IN {invalid, reversed, identity_detached_ineligible, excluded_staff, excluded_test}`  
*(currentEligibilityState derived from integrityState + latest adjustment.)*

### R-POSTHOG-ID
TRIGGER: Signup/identify.  
CONDITION: User exists.  
ACTION: Ensure analyticsSubjectId; PostHog identify(analyticsSubjectId); reset on logout before next identity.  
PRECEDENCE: Never send tokenIdentifier/email/phone/name/IP-as-prop/buyer IDs.

### R-MIRROR
TRIGGER: rawEvents row with posthogMirror=true committed.  
ACTION: `scheduler.runAfter(0, mirror…)` best-effort; daily reconcile; diff &gt; max(5, 2%) → instrumentation incident; mark PostHog viz untrusted.  
EDGE: Mirror failure does not roll back domain/rawEvents.

### R-CLIENT-OBS
TRIGGER: Client observational emit.  
CONDITION: Catalog active + captureMode allows client + consentGate.  
ACTION: Accept only observational; reject client emit of server_authoritative names.  
PRECEDENCE: Never creates acquire/download/Signal/mod/sale/quota.

### R-CONFIDENCE
TRIGGER: Render any rate on Founder dash.  
ACTION: Always `n% (x/y)`. If denominator &lt; 25 → sampleStatus=directional; suppress trend arrows and ≥15%/≥30% drop alerts.

### R-ACTIVATION-ANNOTATE
TRIGGER: Activation card.  
ACTION: Inline published catalog size, median age, adds-in-period, category coverage; acquire events carry catalogSizeAtTime + resourceAgeDays at write.

### R-PRIVACY-SELLER
TRIGGER: Seller analytics query.  
ACTION: Aggregate-only; k≥5/cell; ≥1d buckets; ≥24h delay; fixed dims; parent/child suppression; rate-limit overlapping queries; null not raw low counts where required; no buyer identity; Founder richer aggregates still no named clickers/journeys.

### R-SIGNAL-CARD
TRIGGER: Any Signal-related Founder metric.  
ACTION: Totals/trends/broad category only — never event-weight-resolvable breakdown.

### Limits
- Weekly decisions recorded: max **3** highlighted actions.
- Confidence floor: **25**.
- Reconcile threshold: max(5 events, 2%).
- Impression sampling at soft beta: **none** (capture all qualified).

## 9. Backend Operations
| Function | Type | Notes |
|----------|------|-------|
| `analytics.catalog.get` | query | Active catalog |
| `analytics.founderDashboard` | query | 7 cards from projections; Admin/Founder only |
| `analytics.l08.projection` | internalMutation / cron | Core + branches |
| `analytics.s18.projection` | internalMutation / cron | Staff-excluded |
| `analytics.activation.projection` | internalMutation / cron | + catalog dims |
| `analytics.commerce.*.projection` | internalMutation / cron | Separate library/affiliate/store-ops |
| `analytics.emit` / module `emitRawEvent` | mutation helper | Catalog validate + stamp |
| `analytics.identity.join` | mutation | On signup |
| `analytics.posthog.mirror` | internalAction | Best-effort |
| `analytics.posthog.reconcile` | internalAction | Daily |
| `analytics.erasure.request` | mutation | Detach + vendor delete; incomplete until PostHog confirmed |
| `analytics.eligibility.adjust` | internalMutation | Append adjustment; dirty projections |
| `analytics.weeklyDecision.record` | mutation | Founder; stores metricSnapshots + versions |
| `analytics.instrumentation.health` | query | M15 health consumer |
| `analytics.reconcile.latest` | query | Visible reconcile result |
| `effectiveCountable` | TS helper | Stamp + adjustments + tombstone |

**Env:** `POSTHOG_API_KEY` · `POSTHOG_HOST` · `ANALYTICS_ENV=production|preview|dev`.

## 10. Customer Frontend
**DEFERRED** to FE PHASE. Contracts only: no freestyle events; PostHog SDK identify/reset; observational allowlist; autocapture off; never emit server_authoritative names from client.

## 11. Admin & Governance
- **Route:** `/admin/analytics` — Founder + administrator (read); Support **deny** PII-adjacent exports.
- **7 cards (LOCKED IA):**
  1. **L08 Lifecycle** — core stages, drop-offs, direct-entry, branch share → investigate one transition.
  2. **Activation + Library Context** — view→acquire **with inline catalog annotation**.
  3. **Return Loop (counter-metric)** — acquire→d7 return + return-with-genuine-action; guards fake activation.
  4. **Library funnel** — impression→view→acquire→download→reopen→related discussion; quota blocks separate.
  5. **Affiliate funnel** — impression→view→CTA→qualified click→conversion_confirmed?; no buyer ID.
  6. **Store ops funnel** — request→approve→product→live→first qualified click; throughput metrics.
  7. **Gate + Publishing** — DEC-S18 checklist + content throughput.
- Each card: Convex numbers + **PostHog deep-link** (exploration). P0 decisions **must not** use PostHog counts.
- Every card exposes **lastCalculatedAt · definitionVersion · freshness** (incl. recalculating). Incomplete L08 stages show **cohort incomplete**, not a fake zero cliff.
- Footer: methodology note — **erasure does not reduce historical aggregate counts**; reconcile status visible (ok/untrusted).
- Ops throughput: thin / deep-link M15 — label **internal operational health**, not customer SLA.
- Config: none beyond sealed catalog deploy; no free-form seller SQL.

## 12. RBAC
| Role | Analytics |
|------|-----------|
| Founder / administrator | Full Founder dash · weekly decisions · instrumentation |
| editor/publisher/moderator | Read non-PII ops/content cards as permitted by permissionKeys |
| store_operator | Aggregate store metrics only (M11 contract) |
| support_operator | Deny buyer-level / export |
| member | None |

## 13. Integrations
**PostHog:** server mirror for allowlisted events; identify(analyticsSubjectId); person delete on erasure; timeout/retry with dead-letter; never gate mutations. **No GA4.** Autocapture off.

## 14. Analytics, Audit & Observability
- This module **is** the analytics surface. Admin actions: `admin_widget_opened` / `admin_action_completed` as server_only_sensitive where needed.
- Health monitors (P0): unknown_event_count · schema_validation_failure · raw_event_write_failure · posthog_mirror_failure_rate · identity_join_conflict · staff/persona exclusion failure · projection_freshness · reconcile_diff · required_property_null_rate.
- Alerts: unknown prod events &gt;0 · rawEvents mandatory fail &gt;0 · identity conflict &gt;0 · staff in S18 &gt;0 · projection stale &gt;2 intervals · reconcile over threshold.

## 15. Content & Copy Contract
- Dashboard labels use stage names from §2; provisional Admin copy OK if marked.
- Never “conversion” without `conversionType`.
- Ops cards: “Internal operational health — not a customer SLA.”
- Data trust header before interpretation.

## 16. Edge Cases & Failure Recovery
| Trigger | Behavior |
|---------|----------|
| PostHog down | Domain + rawEvents succeed; mirror queues; incident |
| Catalog unknown in prod | Drop/quarantine + instrumentation_error; do not invent |
| Dual browser login | PostHog reset before second identify |
| Erasure | Identity detach rawEvents + PostHog delete; aggregates unchanged |
| Low n | Directional only; no confident WoW language |
| Client forges acquire name | Reject; log |

## 17. NFR / Security / Privacy / SEO
- Privacy by query contract (seller) + PII class mandatory on catalog.
- No session replay until separate erasure design (Park).
- `/admin/analytics` noindex.
- Authz server-side.

## 18. Fixtures, Tests & Acceptance Criteria
**Fixtures:** staff user · persona · countable member · anonymous session · catalog active/blocked events · acquire with catalog stamps · seller k=4 and k=5 cells · fraud-then-adjust · conversion reverse · staff reclass after write.  
**AC (Given-When-Then samples):**
- Given staff acts, When S18/L08 project, Then excluded (isCountableAtWrite false).
- Given countable acquire later clawed back, When adjust+rebuild, Then removed from L08/S18 **without** mutating rawEvents row.
- Given client emits `resource_acquired`, When ingest, Then rejected.
- Given PostHog outage, When acquire, Then acquisition + rawEvents succeed.
- Given denom=20, When L08 card renders, Then directional + no trend arrow.
- Given acquire, When row written, Then catalogSizeAtTime present.
- Given seller query k=4, When read, Then suppressed per M11.
- Given identify, When PostHog payload, Then no tokenIdentifier.
- Given erasure, When complete, Then analyticsDeletionRequests=confirmed and rawEvents identity-detached.

## 19. Release, Migration & Rollback
- Flag: `analytics.founderDashboard.enabled` (default on soft beta after confirm).
- Backfill: none for cannot-backfill fields; assign analyticsSubjectId to existing users on migrate.
- Rollback: disable PostHog mirror + hide dash; rawEvents keep capturing.
- Launch verify: exclusion fixture · reconcile dry-run · L08 core/branch smoke · M15 health deep-link.

## 20. Global Projections & Open Decisions
**Projects to:** Bible Analytics section · `_index` §V · DEC-L08 interpretation · users.analyticsSubjectId · M15 health · M18 crons · M14 event consume.  
**Open / carry:** DEC-M11-AMAZON · Distribution PostHog groups (P1) · replay privacy design (Park) · named ops people (M15).  
**P0 event extras:** `search.performed` (incl. zero-result) if search ships · `resource_acquire_abandoned` · `contentAuthorType` on funnel view/engage.

### Soft-beta cut
**P0:** catalog · validation · rawEvents envelope · analyticsSubjectId · joins · write-time stamps · L08 core+branches · activation annotate · three funnels · 7 cards (Card 3 counter) · S18 · PostHog mirror+reconcile · seller privacy · instrumentation · erasure · weekly decisions · M15 deep-link · search/abandon.  
**P1:** saved drill-downs · Distribution groups · cohorts · anomaly annotations · replay (privacy-reviewed).  
**Park:** A/B · heatmaps · warehouse · SQL · vanity builder · paid UI pre-S18 · autocapture · fingerprint ID.

---

**Consent stamp:** Founder accepted PM Q1–Q7 / D1–D13 on 2026-08-07.  
**Confirm stamp:** FATAL-M16-01 baked as **DEC-M16-ELIG** · hardenings (cohort incomplete · weekly metricSnapshots · visible reconcile · isCountableAtWrite naming · erasure complete-gate) · **CONFIRMED + CLOSED 2026-08-07**.
