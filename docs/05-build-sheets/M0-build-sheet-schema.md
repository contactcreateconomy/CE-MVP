# DECISION — M0: The Build-Sheet Schema (LOCKED)

**Status:** LOCKED · **Choice:** Option C (hybrid/tiered — "more when needed, lean when sufficient") · **Date:** 2026-07-28
**RACI:** Responsible = Opus · Accountable = Opus · Consulted = GPT/GLM/Sonnet + Founder · Informed = GPT/GLM/Sonnet + Founder
**This is the template EVERY module's Decision (Build Sheet) fills.**

## How to use
- Each module's Decision file is a Build Sheet filled against this schema.
- Fill only the sections your **Layer Profile** marks applicable; mark the rest **N/A (with a one-line reason)**. Never omit silently.
- Global contracts (RBAC roles, NFR baseline, release process, Admin-console shell, analytics identity) are defined **once** and referenced, not restated per module.

## Standing rules (a sheet FAILS review if violated)
- **R1 Literalness** — every number/limit/duration/copy is a literal value, a fixed enum, or an explicit pointer. No adjective ("secure", "responsive", "reasonable") may stand in for a spec value.
- **R2 Predicate format** — every rule = `TRIGGER → CONDITION → ACTION → FEEDBACK (httpStatus/errorCode/userMessage/uiState) → RECOVERY → PRECEDENCE → EDGE`.
- **R3 Explicit N/A** — sections and applicable states are marked `APPLIES / N-A (reason) / GLOBAL / DEFERRED`, never blank.
- **R4 No-invent copy** — coding agents may NOT invent legal, commercial, moderation, AI-disclosure, or destructive-action copy; other copy may be provisional only if marked.
- **R5 Global projection** — each sheet lists what it contributes to the global data model / RBAC / Admin console / analytics / audit / config.

## Decision tags (on any requirement)
`LOCKED` implement exactly · `CONSTRAINED` choose within stated bounds · `OPEN` do not implement until resolved · `DEFERRED` excluded this phase · `REFERENCE` informational.

## Completion checklist (fail review if any is true)
applicable section blank/omitted · a user action lacks a failure state · an admin action lacks permission + audit · a persisted state lacks entry/exit · a screen lacks empty/loading/error · "responsive" without transformation rules · "configurable" without key + default · "rate-limited" without scope/threshold/reset · an integration lacks timeout + fallback · an open decision silently resolved · a deferred feature required by a P0 flow · AC restate intent instead of verifying · admin governance not projected to the global Admin console · data introduced without source-of-truth + owner.

---

## THE SCHEMA — 20 sections in 5 clusters

### Cluster 1 · Definition
1. **Header & Layer Profile** — id · purpose · owner · status · dependencies (up/down). Layer Profile: Customer-FE / Admin-FE / Backend / Data / Integration / Jobs / SEO / Analytics / Audit = Required / Supporting / N-A.
2. **Canonical Names & Enums** — exact table/field/route/component names + every enum's literal values; used verbatim in all sections.
3. **Scope & Non-Goals** — enumerated; each non-goal with a one-line reason.
4. **Domain Context** — terminology (exact meanings) · Invariants (`INV-###`) · Actors (primary/secondary/operator/automated) · entry/exit/trigger/volume · source of truth.
5. **Dependencies & Cross-Module Contracts** — per dependency: provider · consumer · literal data shape · trigger · failure behavior · sync/async · launch-blocking?

### Cluster 2 · Data & Logic `[DATA][BE]`
6. **Data Model** — entities → fields (name·type·required·default), Convex validators, indexes, relationships · **one worked example record per entity** · owner & source-of-truth.
7. **Domain States & Lifecycle** — states · transitions · guards · terminal states · **precedence** when states overlap.
8. **Rules, Algorithms & Limits** — numbered rules as R2 predicates · algorithms (pseudocode) · separate business-limit / rate-limit / provider-limit / UI-display-limit.
9. **Backend Operations** — functions: name · **Convex type (query/mutation/action)** + rationale · typed args · return type · auth (`ctx.auth` pattern) · idempotency/concurrency. Scheduled jobs (cron expr + fn). Env vars. Shared TS result types.

### Cluster 3 · Customer Frontend `[FE]`
10. **Customer Frontend** — (a) **Routes & access** (path · public/auth/role · indexable? · invalid-id/deleted behavior · auth redirect); (b) **Screen & component/interaction contracts** (data + source · regions · actions · interaction = trigger/precond/validation/feedback/optimistic-or-pessimistic/retry/nav-after/analytics); (c) **UI-state matrix** (checklist: data/action/access/object/system states, each Applicable/N-A/Global); (d) **Responsive & a11y** (S/M/L transforms · keyboard/assistive). Literal copy throughout.

### Cluster 4 · Admin & Governance `[ADMIN]`
11. **Admin & Governance** — routes/queues/tables (filters/sort/columns) · **action contract** (roles·precond·confirm·reason·reversible·consequences·user-notice·audit·failure) · **configuration registry** (key·type·default·range·who-edits·effective-timing·fallback) · preview/simulation · bulk actions (or N-A) · operational monitoring (health/backlog/failure/alerts). **Same state rigor as §10.**
12. **RBAC** — single authoritative role×action matrix (visitor/member/operator/admin) + object visibility. (§11 references these, doesn't redefine.)

### Cluster 5 · Cross-cutting & QA
13. **Integrations** — service · endpoint · auth · request schema · response schema · timeout · retry · fallback · provider-failure behavior (external calls = Convex `action`).
14. **Analytics, Audit & Observability** — events (name · props · **source client|server** · when · why) · admin audit records · health metrics/alerts.
15. **Content & Copy Contract** — literal labels/messages/disclosures/empty-states/errors; mark provisional vs final; honor R4.
16. **Edge Cases & Failure Recovery** — deviations **outside** the §7 state machine only (external failure/abuse/malformed input): trigger → system behavior → user-visible → recovery → recorded state.
17. **NFR / Security / Privacy / SEO** — measurable module-specific constraints; SEO no-index of private/held/deleted (baseline may be GLOBAL).
18. **Fixtures, Tests & Acceptance Criteria** — required fixtures + test matrix (happy/boundary/unauthorized/failure/recovery) · AC as Given-When-Then, testable against literals.
19. **Release, Migration & Rollback** — feature flag · initial state · migration/backfill · rollback · launch verification (process may be GLOBAL).
20. **Global Projections & Open Decisions** — contributions to global specs (R5) · `DEC-###` open items with decision tags + recommended default.

---
*Flex examples:* pure-backend module → Cluster 2 deep, §10/§11 N/A in one line. Pure-frontend → §10 deep, §6–§9 mostly GLOBAL/dependency. Admin-only → §11/§12 deep, §10 N/A. Mixed (e.g., affiliate banner) → all clusters + an end-to-end trace.
