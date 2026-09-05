# CONTRACT-7-admin-home-FINAL

**Screen:** Admin Home — `/admin/home`
**Wave:** 7B (M15 Admin & Ops Console)
**Template archetype:** Admin dashboard (composed widgets + interventions)
**Primary CAP-IDs:** CAP-391, CAP-399, CAP-407, CAP-408, CAP-409, CAP-410, CAP-411, CAP-412
**Actor:** administrator
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~40 folded). See RECONCILIATION-7B §2.

---

## 1. Route & Access
- **Path:** `/admin/home`, no params. **Actor:** administrator. **Gated by CAP-390** (shell). Composition governed by CAP-391; System writers CAP-399/407/411/412; admin actions CAP-408/409/410.
- **Adjacent gates rendered here (register-backed, not on the screen row):** **CAP-427** (deep-link routeKey validation — arbitrary URLs rejected), **CAP-428** (INV-M15-7 bounded Home reads) → Open Questions.
- Home does not reimplement domain queues; deep links must target registered `routeKey` values.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `adminWidgets` · `adminCounters` · `adminInterventionAlerts` · `operationalIncidents` · `opsAssignments` · `moderationCases` · `legalIntake` · `dripBatches` · `resources` | read (CAP-391) | ✓ `legalIntake` is canonical (Standing-Rule-2 clean — no dmcaNotices/takedownRequests residue in this Read set) |
| `adminCounters` | write (System, CAP-411) | value, computedAt, health |
| `adminInterventionAlerts` | write (System CAP-399/407/412; admin CAP-408–410) | alertKey, severity, title, whatHappening, whatToDo, deepLinkRouteKey, status |
| `systemConfig` | write (System, CAP-399) | `ingest.throttle` |
| `auditLog` | write | 399/408/409/410 |

## 3. States
*(Enum-backed set. GPT's ~40 transient states — each severity, each counter sub-state — folded, since the severity enum + intervention lifecycle + counter-health enum are authoritative.)*

**A. Composition (CAP-391):** **≤8 next actions + critical strip + interventions**; "deterministic priority tuple" — tuple definition unowned (Open Question).
**B. Bounded read (CAP-428 / INV-M15-7):** s0/legal/STOP/unsafe destinations live; **else adminCounters; no unbounded Home reads.**
**C. Counter render (CAP-411 `adminCounters.refresh`, ~60s cron, M18-owned/M15-consumed):** health {healthy|stale|failed}; **stale → "—" not 0**; heartbeat >15m → "—".
**D. Counter cron failure (CAP-412):** → intervention; **unavailable ≠ zero**.
**E. S0 coverage escalation (CAP-399):** unclaimed >4h → +15m backup, +15m Founder; **>4h → `ingest.throttle` + intervention "INGEST THROTTLED — S0 BACKLOG"**.
**F. Intervention lifecycle (CAP-407→410):** open → **acknowledged** (408, Admin-scoped; **Support sees only support-scoped alerts** — surface for those unowned, Open Question) → **resolved** (409) | **snoozed** (410, ≤24h, **critical forbidden**).
**G. Severity:** critical · high · medium; copy MUST include whatHappening + whatToDo + deep link (**CAP-427: source-controlled routeKey only; arbitrary URLs rejected**).
**H. Remote banner writers rendered here:** CAP-332 (250/400 open-case), CAP-381 (drip supply <14d), CAP-432 (quotaGrants >3/90d), CAP-484 (seoHealth stale), CAP-318 (cause-less rank-drop), CAP-414 (vacant ops slot).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Compose home | administrator | CAP-391 `admin.home.compose` (R-HOME) | none | CAP-390 |
| Acknowledge intervention | administrator | CAP-408 `intervention.ack` | adminInterventionAlerts (acknowledgedAt, acknowledgedByUserId), auditLog | CAP-407 |
| Resolve intervention | administrator | CAP-409 `intervention.resolve` | adminInterventionAlerts (resolvedAt), auditLog | CAP-407 |
| Snooze intervention | administrator | CAP-410 `intervention.snooze` | adminInterventionAlerts (snoozeUntil), auditLog | CAP-407; non-critical only |
| (System) Create intervention | System | CAP-407 `intervention.create` | adminInterventionAlerts | none |
| (System) S0 cover / throttle | System | CAP-399 (R-S0-COVER) | systemConfig (ingest.throttle), operationalIncidents, auditLog | none |
| (cron) Refresh counters | cron | CAP-411 `adminCounters.refresh` | adminCounters | none |
| (System) Escalate stale counter | System | CAP-412 | adminInterventionAlerts | CAP-411 |

## 5. Analytics Events
**None** — no rawEvents on any row; internal surface; `auditLog` is the record. Counter refreshes must not be treated as user analytics.

## 6. Components Used
- §11.3 stats/widget cards · §11.5 severity/health pills · §11.9 skeletons + stale-state ("—") rendering · **Intervention banner — BANNER ARCHETYPE GAP** (§11 defines none; M15 module sheet names "intervention banner"; same class as the 7A CMP banner flag) · next-action cards · ack/resolve/snooze controls.

## 7. Open Questions
1. **Priority-tuple definition** for the ≤8 next actions — referenced, not enumerated. (GLM + GPT.)
2. **Support-scoped alerts surface** (CAP-408 note) — no owning row on /admin/support. (GLM.)
3. **CAP-427/428 are System gates with no UI-owning row** — confirm render-side enforcement attribution. (GLM + Opus.)
4. **CAP-399's two +15m escalation steps** need an explicit timer anchor. (GPT.)
5. **Alert retention/reopen after resolution** — unspecified. (GPT.)
6. **Banner primitive** — archetype gap. (GLM + GPT.)
