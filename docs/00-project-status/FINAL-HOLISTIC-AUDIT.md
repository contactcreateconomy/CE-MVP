# Createconomy PRD — Final Holistic Build-Executability Audit

**Audit date:** 2026-09-04  
**Audit mode:** Read-only source audit; this report is the only created file.

## 0. Executive Answer

- **PRD Build-Executability Score: 59/100**
- **Verdict:** The canonical specification is unusually extensive, but the package is not currently an executable build system because the mandatory live reference app and the canonical schema/auth architecture are incompatible and no migration, adapter, retirement, or data-reset plan connects them.
- **Can broad slice implementation begin? NO**
- **Can unaffected foundation work begin immediately? YES**
- **Number of P0 findings:** 1
- **Number of P1 findings:** 12
- **Number of P2 findings:** 8
- **Number of P3 findings:** 1
- **Number of known-item state mismatches:** 6

A strong team can use this PRD to understand the intended product and can begin isolated, non-conflicting foundation work. It cannot safely begin broad autonomous slice execution. The entry guide says to extend the existing Feed, Auth, and Discussion implementations, while the slices create a different identity, authorization, post, comment, notification, moderation, and analytics model without saying how live records and routes move across. In addition, 27 registered capabilities are absent from every slice, several high-risk workflows are intentionally fenced at their decisive step, and the current readiness score treats most affected screens as autonomous. Developers would spend substantial time debugging specification composition, not merely implementation.

## 1. Audit Scope and Verification Coverage

### Repository inventory

| Measure | Actual repository result |
|---|---:|
| Raw files under `PRD/` | 37,012 |
| Canonical PRD documents outside `app/` | 148 |
| Raw files under `PRD/app/` | 36,864 |
| App files after excluding dependency/build trees | 341 |
| Fully read text/config files | 460: all 148 canonical PRD documents + 312 authored app text/config files |
| Structurally inspected | 20: 17 generated/build-metadata files, 1 lockfile, 2 local-env files by key name only |
| Intentionally excluded | 35,218 dependency files in `node_modules`; 1,305 `.next` files; 9 binary font/favicon assets |
| Unread relevant authored text | 0 |

The 148 canonical documents comprise 1 entry guide, 3 product-spec files, 56 contracts, 11 slice catalogs, 2 design-system files, 19 module sheets, 2 open/readiness ledgers, and 54 screen sheets. Generated Convex declarations, generated AI guidance, `next-env.d.ts`, TypeScript build metadata, dependency source, build output, lockfile internals, binaries, and secret values were not represented as line-by-line authored-spec review.

### Coverage ledger by path

| Path or path family | Files | Classification |
|---|---:|---|
| `AGENT-START-HERE.md` | 1 | Fully read |
| `01-product-spec/*.md` | 3 | Fully read |
| `02-contracts/wave-*/*.md` | 56 | Fully read |
| `03-slices/*.md` | 11 | Fully read |
| `04-design-system/*.md` | 2 | Fully read |
| `05-build-sheets/*.md` | 19 | Fully read |
| `06-open-items/*.md` | 2 | Fully read |
| `screens/*.md` | 54 | Fully read |
| `app/apps/forum` authored text/config/source | 212 | Fully read |
| `app/apps/admin`, `marketplace`, `seller` authored text/config/source | 54 | Fully read individually; duplicate content was hash-checked |
| `app/convex` authored text/source, excluding `_generated` | 26 | Fully read |
| `app/packages/auth-ui` and `app/packages/convex-client` | 17 | Fully read |
| `app` root authored config excluding lock/local env | 3 | Fully read |
| `app/**/_generated/**`, `next-env.d.ts`, `*.tsbuildinfo` | 17 | Structurally inspected; generated output excluded from line-level authorship review |
| `app/pnpm-lock.yaml` | 1 | Structurally inspected for lock format and resolved key versions |
| `app/.env.local`, `app/apps/forum/.env.local` | 2 | Key names inspected only; values intentionally excluded |
| Binary fonts/favicon | 9 | Intentionally excluded as non-text assets |
| `app/node_modules/**` | 35,218 | Intentionally excluded as vendored dependencies |
| `app/apps/forum/.next/**` | 1,305 | Intentionally excluded as generated build/cache output |

### Review method

Six independent specialist passes were run before synthesis: senior full-stack, solution architecture, backend/data/security, frontend/design-system, QA/adversarial integration, and product fidelity. They did not receive one another's conclusions. Their claims were then checked against current files; conclusions based on forbidden historical paths, incomplete samples, stale repository state, or unsupported “fully read” assertions were discarded. No unresolved panel dispute survived direct source verification; A8/A9 design alternatives remain documented product choices rather than audit disputes.

### Actual package counts

| Artifact | Claimed | Actual |
|---|---:|---:|
| Capability rows | 572 | **572**, contiguous CAP-001 through CAP-572; no missing or duplicate row IDs |
| Highest CAP-ID | 572 | **572** |
| Inventory rows | 54 screens | **55 rows**, one being the Discussion enrichment; **54 distinct screen templates** |
| Contract files | 56 | **56** |
| Screen sheets | 54 | **54** |
| Slice headings | 132 | **132 unique** |
| Explicit slice dependency references | not claimed | **400; all resolve to a real slice** |
| Module build sheets | 19 | **19**, M0 through M18 |
| Style-kit numbered component specs | 26 | **26**, §11.1 through §11.26 |
| Current forum UI modules | not claimed | **34 TSX component modules + 1 hook** under `components/ui` |
| Current route page files | not claimed | **22** across four apps: 19 forum, one each admin/marketplace/seller |
| Current screen-sheet implementation status | not claimed | **8 LIVE, 1 partially live legal group, 45 NOT STARTED** |
| Current test files | prior claim 44/44 tests | **5 files, 48 syntactic `it`/`test` declarations**; current pass/fail unverified |
| Current handwritten Convex tables | not claimed | **23 `defineTable` declarations**, plus imported Convex Auth tables |
| Canonical active/planned entity-style definitions | not claimed | **182 parsed names**, excluding 3 absorbed/deprecated pointers |

The first three slice catalogs and the inventory still say “568” even though the register now contains CAP-569 through CAP-572: [MASTER-SCREEN-INVENTORY-MERGED.md](01-product-spec/MASTER-SCREEN-INVENTORY-MERGED.md#L3), [SLICE-CATALOG-PHASE1.md](03-slices/SLICE-CATALOG-PHASE1.md#L4), [SLICE-CATALOG-PHASE2.md](03-slices/SLICE-CATALOG-PHASE2.md#L4), and [SLICE-CATALOG-PHASE3.md](03-slices/SLICE-CATALOG-PHASE3.md#L4).

### Execution attempts

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` from `PRD/app` | **Not run:** `pnpm` is not installed/on PATH |
| `node --version` | **Not run:** `node` is not installed/on PATH |
| `npm --version` | **Not run:** `npm` is not installed/on PATH |
| `corepack --version` | **Not run:** `corepack` is not installed/on PATH |
| `pnpm typecheck` | **Unverified:** prerequisite runtime unavailable |
| `pnpm test:run` | **Unverified:** prerequisite runtime unavailable |
| `pnpm build` and sibling builds | **Unverified:** prerequisite runtime unavailable |

The statements “tsc clean · vitest 44/44 · next build exit 0” in [SCREEN-SCORES.md](06-open-items/SCREEN-SCORES.md#L4) are historical package claims, not current audit results. The current source contains 48 declared test cases, so the 44/44 statement is already stale as a count even if all tests still pass.

### Self-containment

The folder is **not genuinely self-contained** for setup or for all current design authority:

- [apps/forum/README.md](app/apps/forum/README.md#L9-L13) requires a missing root `README.md` and four missing `docs/*` files.
- [app/package.json](app/package.json#L28) invokes missing `scripts/generate-convex-auth-jwt.mjs`.
- The forum README says its scripts use `next dev --webpack` and `next build --webpack`, while [apps/forum/package.json](app/apps/forum/package.json#L6-L7) uses `next dev` and `next build`.
- Current PRD Markdown contains 27 outside-PRD reference lines across 16 files. Many are provenance-only, but [M9-feed-discovery.md](05-build-sheets/M9-feed-discovery.md) declares customer FE locked against a `Brainstorm/legacy` image that the entry guide forbids agents to inspect.

## 2. How the PRD Works as an Agent Build System

### What works

- [AGENT-START-HERE.md](AGENT-START-HERE.md) is obvious and short.
- Its precedence rule is useful: data model first; contracts control UI/states/actions; slice catalogs control scope/dependencies; module sheets control business logic; open items prevent guessing.
- Every one of the 54 screen sheets references an existing contract and only real slice IDs.
- All 400 explicit `Depends on` slice references resolve; no identifier-level dependency cycle was found.
- The package repeatedly uses stop-and-report fences and generally distinguishes deferred work from MVP work.

### Where navigation breaks

- The entry guide calls the folder “complete, verified” and clears 53 screens for autonomous build, but it does not surface the Phase-1 `activationProgress` stop, the OTP dependency on all comment creation, the legal-intake procedure fence, the `manual_review` dead end, or the canonical/live migration conflict.
- Agents are told to extend live Feed/Auth/Discussion code, but the canonical schema and slices do not define how to preserve, adapt, migrate, or retire the live `forum*` model.
- The monorepo has separate `admin`, `marketplace`, and `seller` apps, while slice paths use unqualified `app/admin/...` and canonical URLs use `/admin/*`, `/sell`, and `/s/*`. No deployment-topology rule decides which Next.js app owns those routes.
- Screen sheets mix accepted aliases with unresolved drift. `/discussions/[slug]` is accepted by the entry guide, while `/new-post`, `/users/[handle]`, `/profile` + `/settings`, and anonymous `/` are still labeled as drift or unbuilt.

### Stop-and-report reliability

Stop controls are real but too late. Several foundational or high-risk slices are described as executable and only stop after an agent enters implementation: P1-01b on seven activation bits, P7E moderation on `policyFamily`, P7T legal intake on identity/rate rules, P7O on `manual_review`, and P7T consent on vendor deletion. This contains some guessing, but it does not support autonomous build-order selection because an agent discovers the block after selecting the slice.

### Multi-agent safety

Identifier dependencies are clean; file-level concurrency is not. At least eight Phase-1 slices modify `convex/schema.ts`, while the catalog calls many of them parallelizable. Later phases repeatedly modify the same schema, authz helper, event catalog, widget catalog, cron registry, app shell, and shared components. Parallel work needs an explicit integration owner or serialized merge windows.

### Completion verification

Acceptance criteria are abundant, but package-wide completion is not executable today: no runnable Node toolchain was available, no E2E suite exists, several required algorithms have no exact fixture oracle, and no migration acceptance test exists for the live app.

## 3. Holistic Architecture and Product Coherence

The intended architecture is coherent at the conceptual level: M1 owns identity/admission, M2–M6 content and discussion, M7–M8 people/personas, M9–M12 discovery/economy, M13–M18 trust/admin/analytics/growth/reliability. The strongest parts are the append-only audit posture, Signal/Recognition firewall, route-level `/go` revalidation, legal-hold precedence, actor revalidation for delayed jobs, and fail-closed moderation intent.

The assembled repository is not coherent because it contains two systems:

| Canonical PRD | Live reference app |
|---|---|
| `users` + `privateUserData` + `roleAssignments` | Auth `users` + `memberships` + `forumProfiles` |
| `posts` + typed extension tables | `forumPosts` + `forumCategoryPayloads` + `forumRichThreads` |
| `comments` + reaction/save/score/read-state tables | `forumPostComments` with local optimistic reactions |
| `notifications` with dedupe/batching | `forumNotifications` with four legacy kinds |
| `rawEvents` + `eventCatalog` + eligibility adjustments | `forumAnalyticsEvents` + `forumDailyStats` |
| unified `moderationCases` + actions + legal intake | `forumReports` + `forumModActions` |
| magic-link admission/readiness/bootstrap | Password/OAuth callback creating profiles/memberships immediately |

The slices add the left column but never transition the right column. Completing them literally can leave both data paths active, with reference Feed and Discussion still reading legacy tables while new workflows write canonical tables. The product can compile and still appear empty, show stale content, bypass gates, or duplicate identities.

The product promise remains visible in the canonical plan, but critical differentiators are not all executable: sourced editorial publishing depends on A10 and omitted qualification CAPs; Signal depends on unspecified legitimacy components; legal and consent closure remain fenced; and the current live app implements a conventional forum rather than the intended trust/economy architecture.

## 4. Traceability Results

### Quantitative coverage

| Mapping | Result |
|---|---|
| CAP register integrity | 572/572 unique rows, CAP-001…CAP-572, no gaps/duplicates |
| CAP → slice, range-expanded | **545/572 named; 27 absent** |
| CAP → contract, range-expanded | 476/572 named; omissions are mixed backend/no-UI rows and real integration gaps |
| CAP → screen sheet, range-expanded | 340/572 named |
| CAP → inventory, range-expanded | 333/572 named |
| Screen sheet → contract | 54/54 valid references |
| Screen sheet → slice | 54/54 sheets contain only valid slice references |
| Slice → prerequisite slice | 400/400 explicit references resolve |
| Screen templates → contracts | 54 templates → 56 contracts: Discussion enrichment + profile-economy addendum account for the difference |
| Canonical entities → live schema | 182 active/planned entity-style definitions vs 23 handwritten live tables; no transition map |
| Component spec → module | 26 numbered specs; 34 TSX UI modules + one hook; several functional patterns remain composition-only or absent |
| Screen → live implementation | 8 LIVE labels, 1 partially live legal group, 45 NOT STARTED |

### Capabilities absent from every slice

The following registered IDs do not occur anywhere in the 132 slice definitions, even after expanding CAP ranges:

`CAP-009, CAP-047, CAP-051, CAP-061, CAP-062, CAP-063, CAP-065, CAP-066, CAP-067, CAP-069, CAP-073, CAP-075, CAP-076, CAP-077, CAP-078, CAP-079, CAP-080, CAP-081, CAP-082, CAP-105, CAP-155, CAP-156, CAP-401, CAP-438, CAP-441, CAP-442, CAP-457`.

The highest-risk omissions are the M2/M3 pipeline checks: safe ingest, budgets/fan-out, source authorization/sufficiency, grounded traceability, surface similarity, safety classifier, disclosure, affiliate separation, persona-experience protection, and five advisory scores. Several contracts mention these rows, but the slice catalog never assigns them to an implementation ticket or acceptance test.

### Orphan and stale mappings

- CAP-115 and CAP-116 explicitly have no owning screen in [MASTER-SCREEN-INVENTORY-MERGED.md](01-product-spec/MASTER-SCREEN-INVENTORY-MERGED.md#L184-L185).
- CAP-156 has Has-UI=YES but is intentionally deferred without an inventory route; its future ledger warns not to invent a third board.
- CAP-105 is a real composer read but has no slice CAP assignment despite being required to hide locked types.
- `CAP-573` appears once only in a sentence saying a reserved identity is “not CAP-573”; it is not a stale assignment.
- The module sheets are rule-centric and do not provide a reliable CAP-by-CAP mapping; the slice catalog is therefore the only implementation ownership ledger and its 27 omissions matter.

### Semantic completeness

IDs alone do not close traceability. Examples:

- P4-07 says it implements selected hard rules but omits 13 registered M3 rule IDs.
- P7E-12 needs `policyFamily` for one-case-per-policy-family dedupe, but the literal set is absent.
- P7T-13 implements consent withdrawal while explicitly not invoking the vendor-erasure mutations.
- P7A-10 writes a readiness result using seven category labels without a canonical predicate set.
- The current Feed and Discussion routes resolve against `forumPosts`/`forumPostComments`, not the canonical `posts`/`comments` written by future slices.

## 5. Slice and Build-Order Assessment

### Ordering

The high-level order is sensible: schema/helpers → admission/admin spine → content → people/discussion → feed/resources/store → economy/trust/ops/growth. All explicit dependency IDs resolve, and several dangerous cross-module orderings are correctly called out: provenance before indexability, link approval before `/go`, comments before product shadow threads, and Signal summary before Might/Level rendering.

### Hidden prerequisites and inversions

1. **Live-data transition is absent.** This precedes every schema-owning slice but is nowhere in the graph.
2. **P1-01b is foundational but blocked** on seven activation bits.
3. **CAP-551 blocks comment eligibility**, yet it is presented as a local setup/vendor decision.
4. **P7E moderation depends on `policyFamily`** before report dedupe can be tested.
5. **P7T legal workflows depend on identity verification and abuse controls** absent from the ledger.
6. **P7T consent cannot complete withdrawal** until CAP-506 is connected to CAP-453/454.
7. **P7A readiness cannot produce defensible `ready`** without predicate ownership and freshness.

### Conflict hotspots

- `app/convex/schema.ts`: Phase 1, 4, 5, 6, and 7 schema slices; current legacy tables also live here.
- `app/convex/auth.ts`: current Password/OAuth callback vs P2 admission/bootstrap replacement.
- `convex/lib/authz.ts`: config, customer guard, admin shell, delayed-job checks.
- `convex/crons.ts`: feed, moderation, analytics, reliability, growth, Signal jobs.
- `adminWidgets`, `eventCatalog`, `configKeyRegistry`, `auditLog`: phased shared registries.
- Forum root layout/global CSS and shared navigation components.

The Phase-1 catalog marks table slices as parallel while many all edit the same schema file. Semantic independence does not make those edits merge-safe.

### Slice sizing

The catalogs themselves call P4-07, P4-08, P4-09, P6-11, P6-18, P7E-03, P7E-07, P7E-08, P7E-10, and P7E-14 borderline and include split lines. That is honest, but these are not uniformly one-agent tickets until their formulas, provider choices, and component boundaries are closed.

### Intermediate repository validity

Without a transition plan, early phases can compile with canonical tables added while all live routes continue reading legacy tables. This is a deceptively green intermediate state: tests can pass and screens can render, but no new canonical write appears in the reference UI.

## 6. Reference Application Assessment

### Current runnable state

The package contains installed dependencies and build output, but the documented clean setup could not be reproduced because Node, npm, Corepack, and pnpm are absent from the audit environment. Current tests, typecheck, production builds, and a dev server are therefore **unverified**.

### Implemented routes

There are 22 Next.js `page.tsx` route entries: 19 in the forum and one placeholder root in each of admin, marketplace, and seller. Only 8 screen sheets label their target live, one legal group is partially live, and 45 are not started.

### Feed reference

`/feed` exists and is Convex-backed. It is useful for visual composition, responsive shell patterns, cursor loading, and interaction ergonomics. It is **not** a canonical domain implementation:

- It reads `forumPosts`, `forumFavorites`, `forumFeedCache`, and legacy counters.
- Current ranking uses a legacy virality function and denormalized counters, not `postDistributionScores`, legitimacy weighting, exploration deficit, or canonical feed sessions.
- Hide is client-local with a timed undo; canonical CAP-200/CAP-553 require persisted state.
- Current `top/hot` paths are not paginated like `new/fav`.

### Auth reference

The popup is a functioning component library, but not the canonical sign-in experience:

- [auth.ts](app/convex/auth.ts#L65) enables Password plus three OAuth providers; Wave-1 requires magic-link admission.
- [app-auth-provider.tsx](app/packages/auth-ui/src/app-auth-provider.tsx) calls Password sign-in/sign-up.
- [auth.ts](app/convex/auth.ts#L15) grants admin membership from `ADMIN_EMAILS`; M1 requires internal Founder bootstrap, tested second-Founder gate, and canonical `roleAssignments`.
- Signup immediately creates `forumProfiles`/`memberships`; it does not create the canonical atomic bootstrap tuple or `pending_context` state.

It is a reusable modal shell, not a completed product auth implementation.

### Discussion reference

`/discussions/[slug]` exists with real Convex queries, category templates, comment creation, post upvote/bookmark, and useful MIN/MAX presentation patterns. It remains partial in the consequential places:

- It reads legacy rich threads/posts/comments.
- Comment-level reactions are local UI state, not canonical `commentReactions` mutations.
- MAX presentation is mostly category-specific/static rather than canonical grounded `threadThemes`/`threadPositions`/`threadQuestions` lifecycle.
- Reporting writes `forumReports`, not unified `moderationCases`.

### Route drift

| Canonical | Live | Status |
|---|---|---|
| `/feed` | `/feed` | match |
| `/p/[slug]` | `/discussions/[slug]` | explicitly accepted by entry guide |
| `/compose` | `/new-post` | screen sheet says decision needed |
| `/u/[handle]` | `/users/[handle]` | screen sheet says decision needed |
| `/settings/profile` | `/profile` + `/settings` | split is not canonically resolved |
| anonymous `/` landing | redirects to `/feed` | contradictory; landing unbuilt |
| `/admin/*` | separate admin app exposes only `/` | owner/deployment unresolved |
| `/sell`, `/s/*` | seller app exposes only `/` | owner/deployment unresolved |

### Trust verdict

The app is a credible **visual and interaction reference** for Feed, Discussion, auth modal composition, tokens, and many UI primitives. It is not a trustworthy backend/domain foundation until HOL-P0-001 is resolved.

## 7. Frontend Foundation Assessment

### Tokens and themes

The forum CSS contains a substantial semantic token system for light/dark surfaces, text, borders, feedback, category accents, rank medals, spacing, typography, duration, easing, z-index, shadows, and dark-only glows. Reduced-motion rules disable the major animations. This is a credible anti-slop base.

Three sibling apps duplicate their CSS and primitive files byte-for-byte rather than consuming one shared design package. That creates drift risk once real admin/seller/marketplace screens begin.

### Core components

The forum contains 34 TSX UI modules plus one hook. Direct inspection confirms the previously reported Layer-3 gaps in Combobox, DataTable mobile loading, Command Palette loading, QueueBoard hover/focus, Dropzone progress, and Banner reduced motion have been repaired in current source. TieredLadder implements the provisional A8-A direction and has focused tests.

Functional patterns still absent as shared components include Textarea, Radio, Slider, Momentum Ticker, Evidence/Diff Panel, and Sanitized Markdown Reader. Some can be composed locally; A10 cannot be safely improvised because it controls claim-level evidence confirmation. A9 has an authorized composed-panel default and is not a blocker.

### Layout foundations

The live forum provides an app shell, three-column feed, mobile tab bar, content/reading shell, compose shell, profile, directory-like routes, and full-page error/loading patterns. Admin, seller, and marketplace are single-page placeholders. Static policy and legal layouts are specified but mostly unbuilt.

### Screen sheets

The sheets are useful: routes, contracts, slices, component paths, live status, and missing functions are generally explicit. All contract and slice references resolve. Their weakness is confidence labeling: “LIVE” can mean legacy behavior that violates the canonical model, and “90+” can coexist with several product-level open questions.

### Accessibility

The primitives use Radix where appropriate, native semantics, focus-visible rings, aria labels/roles, reduced motion, and mobile fallbacks. No browser or assistive-technology run was possible. Screen-specific custom controls and missing components remain unverified.

### Drift risk

**MEDIUM-HIGH** until the app boundary is resolved; **MEDIUM** afterward. The visual language is credible, but agents currently have four app roots, duplicated primitives, accepted and unresolved route aliases, and two domain schemas.

## 8. Backend, Data, Security, and Operational Assessment

### Schema readiness

The canonical data model is broad and generally careful, but it contains unresolved `activationProgress` and `policyFamily` shapes. More importantly, the live Convex schema has only 23 handwritten tables and uses a legacy vocabulary. The absence of a transition plan makes schema readiness **blocked**, not merely incomplete.

### Actor and permission correctness

Canonical rules are strong: one authz helper, fail-closed standing, role revalidation, STOP precedence, and next-request revocation. Current code does not implement those rules. It grants admin membership through `ADMIN_EMAILS`, checks moderator authority against `forumProfiles.role`, and allows ordinary authenticated mutations without canonical bootstrap/standing/restriction checks.

### Lifecycle, idempotency, and concurrency

The PRD specifies append-only ledgers, unique acquisition semantics, claim leases, retry classes, and authorized commands well. Gaps remain at the exact recovery boundaries: manual-review release, duplicate post submission/client-response loss, legal identity proof, readiness freshness, and several unnamed config thresholds. The live app has no general idempotency keys and no canonical audit log.

### Moderation and legal

The unified M13 case spine, fail-closed classifier posture, appeals, legal hold, counter-notice, and repeat-infringer policy are strong designs. `policyFamily` prevents implementation of the core dedupe invariant. F-33 leaves anonymous legal abuse controls and identity verification unresolved while slices are otherwise marked ready. Legal content publication is unowned.

### Consent and privacy

The rawEvents/PostHog distinction is clear. The actual withdrawal journey is incomplete: CAP-506 is explicitly prevented from calling the vendor deletion mutations pending an open decision. Profile privacy also lacks a canonical non-self/public projection and search rule.

### Commerce and Signal integrity

The `/go` branch revalidates `approved_locked` at the route, evidence tiers are separated, Amazon self-report is unverified, and seller conflict rules are thoughtful. Store circuit-breaker thresholds remain unspecified. Signal/Recognition separation is strong; core legitimacy component formulas and several rank priors remain insufficiently executable.

### STOP, jobs, and readiness

STOP precedence and delayed-actor revalidation are good. RC-4/manual-review rows have no human resolution. Readiness stores an overall result using seven category labels but lacks the complete predicate catalog, ownership, freshness, and audit behavior needed to make `overall=ready` defensible.

## 9. End-to-End Journey Simulation

### 9.1 Anonymous visitor → signup/waitlist → bootstrap → Profile/Distribution

- **Status:** CONTRADICTORY
- **Trace chain:** `/` or `/signin` → CAP-464/478 or CAP-001 → CAP-002/003 → CAP-142 → CAP-565.
- **Missing/contradictory links:** Live `/` redirects to `/feed`; live auth uses Password/OAuth and immediate `forumProfiles`/`memberships`; E4 permits a permanent `pending_context` trap; OTP is unresolved; canonical Distribution has no live-schema transition.
- **Consequence:** A developer must choose between preserving working auth and implementing canonical admission. Existing users have no migration path.
- **Findings:** HOL-P0-001, HOL-P1-002, HOL-P1-009, HOL-P1-012, HOL-P2-008.

### 9.2 Member → create/save/submit post → moderation/qualification → Feed/Post Detail

- **Status:** CONTRADICTORY
- **Trace chain:** `/compose` → CAP-531/086 → CAP-153/154 → M3 CAP-064 rules → publish → CAP-091/182–198 → `/p/[slug]`.
- **Missing/contradictory links:** Live `/new-post` writes `forumPosts`, allows News and locked categories, lacks canonical customer guard/qualification, and Feed reads the legacy row. Several M3 rules have no slice.
- **Consequence:** The app can publish content that the PRD forbids, while canonical posts may never appear in the live Feed.
- **Findings:** HOL-P0-001, HOL-P1-001, HOL-P1-011, HOL-P2-008.

### 9.3 Content source → candidate → claims/evidence → editorial review → publication

- **Status:** MISSING LINK
- **Trace chain:** CAP-031/032/033 → CAP-036/037 → CAP-038/039 → CAP-064/065–082 → CAP-041/542/543 → CAP-043/054/055.
- **Missing/contradictory links:** Eighteen M2/M3 CAPs are absent from slices; A10 is missing; some provider thresholds and publish-failure behavior remain unspecified.
- **Consequence:** An agent may build a compiling pipeline without the safety, traceability, or advisory checks promised by the register.
- **Findings:** HOL-P1-001, HOL-P1-010, HOL-P1-011.

### 9.4 Member → comment/reply → report/context flag → moderation case → resolution

- **Status:** CONTRADICTORY
- **Trace chain:** CAP-120/121 → CAP-127/324 → CAP-330 → CAP-335/336/359.
- **Missing/contradictory links:** `policyFamily` is undefined; live comments/reports use legacy tables and local reactions; unified case creation is absent.
- **Consequence:** Dedupe cannot be tested and current reports never enter the canonical queue.
- **Findings:** HOL-P0-001, HOL-P1-003.

### 9.5 Persona draft → review → publish/schedule → discussion display

- **Status:** EXECUTABLE WITH LOCAL IMPLEMENTATION CHOICE
- **Trace chain:** CAP-168–171 → CAP-172–175 → canonical `comments` → Discussion UI.
- **Missing/contradictory links:** Exact regen cap is “2–3,” model/provider thresholds are incomplete, and the live thread reads legacy comments.
- **Consequence:** Canonical implementation is locally specifiable after the data transition; current Discussion cannot consume it yet.
- **Findings:** HOL-P0-001, HOL-P1-011.

### 9.6 Member → resource view → acquire → quota → download → re-download

- **Status:** EXECUTABLE WITH LOCAL IMPLEMENTATION CHOICE
- **Trace chain:** `/resources` CAP-224/215/212 → `acquisitions` + quota ledger → CAP-213 download → CAP-211 viewer.
- **Missing/contradictory links:** Anonymous teaser details, viewer TTL, flag interaction, and removed-after-acquire behavior need local decisions.
- **Consequence:** Core quota semantics are implementable; edge UX and retention policy need explicit tests.
- **Findings:** HOL-P2-002, HOL-P2-005.

### 9.7 Resource reference → rights/content review → forge → publish → pause/remove/legal

- **Status:** MISSING LINK
- **Trace chain:** CAP-202/203/204 → CAP-205/206 → CAP-207/208/559 → CAP-209/210/555–558 → CAP-217/218/219.
- **Missing/contradictory links:** CAP-202/203 circular sequencing, A10 evidence surface, legal identity/rate controls, and cascade-overflow ownership are unresolved. UGC is OFF at launch, which contains but does not resolve the path.
- **Consequence:** In-house resources can proceed; UGC and legal closure cannot be autonomously implemented.
- **Findings:** HOL-P1-005, HOL-P1-010, HOL-P2-002.

### 9.8 Seller → apply → operator approval → product validation → storefront activation

- **Status:** EXECUTABLE WITH LOCAL IMPLEMENTATION CHOICE
- **Trace chain:** CAP-230/231/262 → CAP-232 → CAP-234/235/236/237 → CAP-233.
- **Missing/contradictory links:** App ownership is ambiguous, circuit-breaker thresholds are unset, and several form/control patterns are absent.
- **Consequence:** The lifecycle is coherent, but autonomous deployment and safety tuning are not.
- **Findings:** HOL-P1-011, HOL-P2-003, HOL-P2-005.

### 9.9 Buyer → BUY → internal redirect → in-app/off-platform → click evidence

- **Status:** COMPLETE AND EXECUTABLE
- **Trace chain:** product/store CTA → CAP-247 → `/go/[linkId]` → CAP-248 or CAP-249 → `storefrontClicks`.
- **Missing/contradictory links:** Founder/legal copy is intentionally owned outside automation; route ownership remains unresolved.
- **Consequence:** Backend behavior is sufficiently explicit: both route branches independently revalidate `approved_locked`, and dead-link/gate-fail/proceed are distinct.
- **Findings:** HOL-P2-003.

### 9.10 Amazon destination → click → seller self-report → unverified interim Signal

- **Status:** COMPLETE AND EXECUTABLE
- **Trace chain:** CAP-524 → standard `/go` → CAP-525 → `salesEvidence(type=self_report,status=unverified)` → interim Signal.
- **Missing/contradictory links:** Visual badge is composition-only, but data distinction is explicit.
- **Consequence:** The money-path semantics can be implemented without equating self-report with network verification.
- **Findings:** HOL-P2-005 only.

### 9.11 Distribution membership → Reach → Signal → Might → monthly Level → profile

- **Status:** MISSING LINK
- **Trace chain:** CAP-300/301 → CAP-302 → CAP-281 → CAP-304 → CAP-305 → CAP-313.
- **Missing/contradictory links:** Legitimacy component formulas are unnamed; the live profile/data model is incompatible; A8 visual sign-off remains open but has a safe provisional implementation.
- **Consequence:** Display plumbing is clear, but authoritative calculation cannot be implemented without product/security choices.
- **Findings:** HOL-P0-001, HOL-P1-011.

### 9.12 Notification generation → batching/deduplication → read state

- **Status:** EXECUTABLE WITH LOCAL IMPLEMENTATION CHOICE
- **Trace chain:** CAP-378/379/382 → `notifications` → CAP-568 list → CAP-386 mark read.
- **Missing/contradictory links:** Mute has no action, pagination is open, and live `forumNotifications` is incompatible with the canonical table.
- **Consequence:** Canonical list/read works after migration; preference and historical migration remain open.
- **Findings:** HOL-P0-001, HOL-P2-002.

### 9.13 Appeal submission → claim → review → SLA escalation → outcome

- **Status:** MISSING LINK
- **Trace chain:** CAP-340 → CAP-330/328 → CAP-341/342.
- **Missing/contradictory links:** No member outcome-read capability; evidence-reference type and deadline source remain open.
- **Consequence:** Operators can decide an appeal, but a complete member-facing closure cannot be verified.
- **Findings:** HOL-P2-002.

### 9.14 DMCA/counter-notice/grievance/erasure → handling → retention/tombstone

- **Status:** CONTRADICTORY
- **Trace chain:** CAP-217/343/344/348/350 → `legalIntake`/case → CAP-345–351 → retention/tombstone.
- **Missing/contradictory links:** Identity proof, anonymous dedupe/rate limit, holiday-aware computation, and some action UI are intentionally absent; F-33 is not in the live ledger.
- **Consequence:** Implementing these forms today requires legal/security policy invention.
- **Findings:** HOL-P1-005, HOL-P1-008.

### 9.15 Admin role assignment/revocation → next-request enforcement

- **Status:** CONTRADICTORY
- **Trace chain:** CAP-413/564 → `roleAssignments` → CAP-430.
- **Missing/contradictory links:** Canonical flow is clear, but live auth uses `memberships`, `forumProfiles.role`, and `ADMIN_EMAILS` auto-grant.
- **Consequence:** Two authority stores can disagree; revocation can succeed canonically while a legacy route still authorizes.
- **Findings:** HOL-P0-001, HOL-P2-003.

### 9.16 Kill switch or STOP → affected requests/jobs → recovery → resume

- **Status:** EXECUTABLE WITH LOCAL IMPLEMENTATION CHOICE
- **Trace chain:** CAP-397 → customer/job guards CAP-393/518 → incident → CAP-398/431 recovery check.
- **Missing/contradictory links:** STOP subsystem scope and some recovery-key ownership are open.
- **Consequence:** The fail-closed posture is implementable; exact blast radius needs a local registry decision.
- **Findings:** HOL-P2-002.

### 9.17 Job failure → retries exhausted → dead letter → authorized redrive

- **Status:** BLOCKED BY KNOWN ITEM
- **Trace chain:** `jobCatalog`/`jobRuns` → CAP-499 → `jobDeadLetters` → CAP-500.
- **Missing/contradictory links:** RC-4 and `manual_review` explicitly reject redrive and have no approve/cancel/resolve action.
- **Consequence:** Legal restore, money, sanction, final-publish, and termination work can become permanently operationally stuck.
- **Findings:** HOL-P1-004.

### 9.18 Publication/state change → canonical indexability → sitemap/SEO health

- **Status:** COMPLETE AND EXECUTABLE
- **Trace chain:** CAP-466 → CAP-468/469 → CAP-473 → CAP-483/484/567.
- **Missing/contradictory links:** GSC-not-connected and remediation copy are local choices; readiness does not explicitly require SEO health.
- **Consequence:** The indexability/provenance pairing is strong and testable once legal destination content exists.
- **Findings:** HOL-P1-008, HOL-P1-007.

### 9.19 Consent grant → optional analytics → withdrawal → future capture stops

- **Status:** MISSING LINK
- **Trace chain:** CAP-504/505 → PostHog enable → CAP-506 withdrawal → CAP-453/454 vendor erasure.
- **Missing/contradictory links:** P7T-13 and P7O-08 explicitly prohibit the CAP-506→CAP-453/454 call pending OQ#3.
- **Consequence:** Future client capture can stop while vendor-held data remains undeleted and untracked from the consent record.
- **Findings:** HOL-P1-006.

### 9.20 Readiness evaluation → attempt `signup.mode=open` → pass/block

- **Status:** MISSING LINK
- **Trace chain:** CAP-509 → `launchReadinessResults` → CAP-480 setter synchronously calls CAP-510.
- **Missing/contradictory links:** Seven labels exist, but no canonical predicate catalog, ownership list, freshness rule, or audit requirement does.
- **Consequence:** The setter is fail-closed only against a result whose truth conditions are underdefined.
- **Findings:** HOL-P1-007.

## 10. Edge Cases and Failure Modes

### Correctly specified edge cases

- `/go` direct/pasted requests revalidate the locked destination on both branches.
- Resource acquisition is unique and atomic with quota; re-download is free; user-local calendar uses IANA with UTC fallback.
- Signal corrections use append-only reversal/clawback entries.
- Delayed jobs revalidate actor authority or consume a narrow authorized command.
- Moderation claims have bounded lease/renew/max durations and queue ordering.
- Legal hold overrides erasure; immutable legal/audit records are retained.
- PostHog is consent-gated while server `rawEvents` remain strictly necessary.
- Indexability fails closed until provenance and AI-disclosure destinations exist.

### Locally underspecified edge cases

- Duplicate waitlist submissions and invited-link errors.
- Draft-save versus publish races and server-success/client-response loss.
- Notification batch-window boundary behavior and target deletion.
- Product/link status changing after page load but before BUY.
- Resource removal while an acquired file or viewer session is active.
- Profile privacy effects on comments, search, and anonymous projection.
- Case lease expiry during an operator write and partial batch outcomes.
- Route migration/redirects for `/new-post`, `/users`, and `/settings`.

### Dangerous missing failure paths

- Migration/dual-write/rollback between legacy and canonical tables.
- Current admin/auth authority coexisting with canonical role revocation.
- RC-4/manual-review resolution.
- Legal-intake identity and anonymous abuse controls.
- Consent withdrawal to vendor deletion.
- Readiness predicate ownership/freshness.
- Exact moderation dedupe enum and core legitimacy/ranking calculations.

### Recovery and rollback gaps

The PRD has a good expand/contract deployment principle but no first migration from the already populated live schema. It also lacks rollback behavior if some routes move to canonical tables while Feed/Discussion remain legacy. Several high-risk states have “fail closed” entry but no recovery action, especially `manual_review`, legal publication pending, and bootstrap timezone skip.

### Integration-only failures likely to surface late

- Canonical writes invisible on the live Feed.
- Canonical comments absent from `/discussions/[slug]`.
- Role revoked in `roleAssignments` but still authorized by legacy `forumProfiles.role`.
- New signup represented in one identity system but not the other.
- Legacy notification/read state diverging from canonical batching.
- Search and profile privacy using different stores.

## 11. Development-Friction Forecast

### Normal development debugging

Expected work includes component wiring, query optimization, CSS polish, provider setup, fixture creation, and implementation defects inside a defined state machine.

### Spec-induced debugging

Expected to be **HIGH** until P0/P1 corrections: schema ownership, migration, auth authority, omitted CAPs, undefined enums, algorithm constants, legal identity, consent deletion, readiness predicates, and route/app ownership.

### Integration-induced debugging

Expected to be **HIGH**: canonical versus legacy writes, four Next.js app roots, shared schema churn, phased registries, Feed/Discussion adapters, and cross-module async behavior.

### Environment/operations debugging

Expected to be **MEDIUM-HIGH**: missing setup docs/JWT script, cloud Convex requirement, OAuth/JWT setup, no current clean-run verification, and root scripts that validate only the forum by default.

### Top ten troubleshooting hotspots

| Rank | Discovery phase | Symptom | Root cause | Rework radius |
|---:|---|---|---|---|
| 1 | First canonical schema slice | New data exists but Feed/Discussion are empty | no live→canonical transition | all phases/routes |
| 2 | Admission/auth integration | duplicate users, bypassed readiness, role disagreement | Password/ADMIN_EMAILS/memberships vs canonical auth | M1, M7, M15, all protected writes |
| 3 | M3 qualification | publish path lacks required checks | 18 content CAPs absent from slices | M2–M4, editorial, SEO |
| 4 | Moderation integration | duplicate or undedupable cases | undefined `policyFamily` | M4/M6/M10/M11/M13 |
| 5 | Reliability operations | high-risk job cannot progress | `manual_review` has no action | M13/M18/admin |
| 6 | Legal launch testing | cannot validate filer or calculate deadlines | F-33 procedure gaps | legal, moderation, support |
| 7 | Consent withdrawal | vendor data remains after withdraw | CAP-506 disconnected from 453/454 | M16/M18/CMP |
| 8 | Signup-open rehearsal | readiness can neither prove nor explain result | missing predicate catalog/freshness | M1/M15/M18 |
| 9 | Feed/Signal calibration | agents choose incompatible math | missing priors/component formulas | M6/M9/M12 |
| 10 | Multi-agent merge | repeated schema/authz/catalog conflicts | parallel slices touch shared files | Phase 1 and Phase 7 |

## 12. Findings

### HOL-P0-001 No transition exists between the mandatory live reference app and the canonical architecture

- **Severity:** P0 — BUILD-STOPPING
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** [AGENT-START-HERE.md](AGENT-START-HERE.md#L11-L19) requires agents to extend Feed/Auth/Discussion. The live schema defines `memberships`, `forumProfiles`, `forumPosts`, and `forumPostComments` at [schema.ts](app/convex/schema.ts#L54-L64), [schema.ts](app/convex/schema.ts#L93), and [schema.ts](app/convex/schema.ts#L150). Canonical Phase 1 creates `users`/`privateUserData`/`roleAssignments` in `SLICE-P1-01a`; Phase 4 creates `posts`; Phase 5 creates `comments`. [M4-post-system.md](05-build-sheets/M4-post-system.md#L158) says “no production data yet.” No slice contains a migration, adapter, dual-write, cutover, retirement, or reset for the live forum tables.
- **Affected files:** Entry guide; canonical data model; all slice catalogs; `app/convex/schema.ts`; current auth, queries, mutations, Feed, Discussion, profile, notification routes.
- **Affected CAP-IDs:** Broadly CAP-001–005, CAP-086–139, CAP-182–201, CAP-321–342, CAP-436–463, CAP-568.
- **Affected slices:** P1-01a/b onward; especially P2-01–03, P4-01/02/13, P5-01–03, P6-01–03, P7E-10–17, P7O-03, P7T-01.
- **Affected routes/screens:** `/feed`, `/discussions/[slug]`, `/new-post`, `/users/[handle]`, `/profile`, `/settings`, `/notifications`, all future canonical routes.
- **What the coding agent is likely to do:** Add canonical tables/functions beside the live ones while preserving reference components, then wire different routes to different stores.
- **Resulting bug or rework:** Split identities, split authorization, invisible new content, duplicated notifications/moderation, destructive migration later, and broad route rewrites.
- **Why existing stop-and-report controls do or do not contain it:** They do not mention legacy table names or require a transition decision; “extend, don’t rebuild” pushes in the opposite direction.
- **Required correction:** Declare the live app either disposable or migratable. Provide a table/API/route mapping, data reset/backfill policy, dual-write or cutover sequence, auth-account transition, rollback, and acceptance tests proving Feed/Discussion consume canonical writes.
- **Must be corrected before:** broad build.

### HOL-P1-001 Twenty-seven registered capabilities have no implementation slice

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** Range-expanded comparison of all 572 register rows against every `CAP-` reference in the 132 slice definitions leaves 27 IDs absent: `CAP-009, 047, 051, 061, 062, 063, 065, 066, 067, 069, 073, 075–082, 105, 155, 156, 401, 438, 441, 442, 457`. Register rows define concrete behavior; for example CAP-065/066/067/073/075–082 are the source, sufficiency, traceability, safety, disclosure, affiliate, persona-experience, and soft-score rules.
- **Affected files:** [CAPABILITY-REGISTER-MERGED.md](01-product-spec/CAPABILITY-REGISTER-MERGED.md); all slice catalogs.
- **Affected CAP-IDs:** The 27 IDs above.
- **Affected slices:** P2/P4/P5/P7 slices that currently imply these behaviors without owning them.
- **Affected routes/screens:** Editorial, composer, rulebook, admin moderation/support, analytics, auth, tools.
- **What the coding agent is likely to do:** Implement only the named subset, infer that a range is covered, or silently fold logic into a neighbor with no acceptance test.
- **Resulting bug or rework:** The application passes slice gates while omitting registered product/safety behavior; ownership and regression tests remain unknowable.
- **Why existing stop-and-report controls do or do not contain it:** No catalog-level completeness check exists; the phase exit gates do not enumerate these rows.
- **Required correction:** Add each CAP to one owning slice with files/tests, or mark it explicitly absorbed/deferred with the successor owner. Re-run range-expanded CAP coverage as a gate.
- **Must be corrected before:** affected slice.

### HOL-P1-002 `activationProgress` blocks an early shared users-schema slice

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** KNOWN ITEM STATE MISMATCH (F-37)
- **Exact evidence:** OPEN-DECISIONS F-37 says seven bits are unnamed. [SLICE-P1-01b](03-slices/SLICE-CATALOG-PHASE1.md#L21-L25) requires the exact shape and says “stop and report — do not invent.” The entry guide nevertheless says all screens except editorial are cleared for autonomous build.
- **Affected files:** `_data-model.md` users section; M14; Phase-1 catalog; open ledger; entry guide.
- **Affected CAP-IDs:** CAP-362, CAP-368–370.
- **Affected slices:** P1-01b and downstream M7/M14 slices.
- **Affected routes/screens:** `/setup`, onboarding coach/retention surfaces.
- **What the coding agent is likely to do:** Stop in Phase 1 or invent boolean names that later analytics/UI cannot reconcile.
- **Resulting bug or rework:** Schema migration and onboarding event rewrites after downstream code exists.
- **Why existing stop-and-report controls do or do not contain it:** The local stop is correct; global readiness messaging is not.
- **Required correction:** Founder/PM locks the seven names and trigger semantics; update data model, M14, P1-01b, and tests together.
- **Must be corrected before:** affected slice.

### HOL-P1-003 Moderation dedupe cannot be implemented without `policyFamily`

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** KNOWN ITEM WITH ADDITIONAL IMPACT (F-35)
- **Exact evidence:** OPEN-DECISIONS F-35 and the data-model Core-enums state `moderationCases.policyFamily` is not enumerated. P7E-10 preserves it as a string and P7E-12 requires one case per target + policyFamily + window.
- **Affected files:** `_data-model.md`, M13, P1-03, P7E-10/12/14, moderation contract.
- **Affected CAP-IDs:** CAP-321–328, CAP-324, CAP-330.
- **Affected slices:** P1-03 schema; P7E-10–14.
- **Affected routes/screens:** report modal, `/admin/moderation`.
- **What the coding agent is likely to do:** Alias `caseType`, accept arbitrary strings, or skip dedupe.
- **Resulting bug or rework:** Duplicate cases, inconsistent sanctions, broken queue metrics, and a later data migration.
- **Why existing stop-and-report controls do or do not contain it:** It correctly blocks the query but allows surrounding slices to be called ready, delaying discovery until integration.
- **Required correction:** Lock a dedicated literal set and mapping from every report writer; add uniqueness/window fixtures.
- **Must be corrected before:** affected slice.

### HOL-P1-004 RC-4 and `manual_review` have no terminal human action

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** KNOWN ITEM STATE MISMATCH (F-22)
- **Exact evidence:** OPEN-DECISIONS F-22 says no action surface exists. [SLICE-P7O-04](03-slices/SLICE-CATALOG-PHASE7-OPS.md) shows rows read-only; [SLICE-P7O-05](03-slices/SLICE-CATALOG-PHASE7-OPS.md#L110-L119) rejects `manual_only` and `manual_review` redrive and explicitly says this is not a resolution.
- **Affected files:** M18, reliability contract/sheet/screen, P7O-04/05.
- **Affected CAP-IDs:** CAP-495, CAP-500, CAP-515.
- **Affected slices:** P7O-04/05 and producers of RC-4 work.
- **Affected routes/screens:** `/admin/reliability`; legal restore, money, sanction, final publication, termination workflows.
- **What the coding agent is likely to do:** Display permanently stuck rows or add an unsafe generic retry button.
- **Resulting bug or rework:** Unrecoverable operational state or duplicate high-risk side effects.
- **Why existing stop-and-report controls do or do not contain it:** Fail-closed prevents unsafe retries but leaves no recovery path while the slices remain marked executable.
- **Required correction:** Define approve/deny/cancel/reissue semantics, authority, audit event, idempotency, and route placement for each RC-4 class.
- **Must be corrected before:** affected slice.

### HOL-P1-005 Legal intake is sliced without identity verification or anonymous abuse controls

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** KNOWN ITEM STATE MISMATCH (F-33 is referenced by current slices but absent from the live open ledger)
- **Exact evidence:** `SLICE-CATALOG-PHASE7-TRUST.md` heading “V2. F-33” says CAP-217 rate-limit/dedupe and identity verification are unspecified; P7T-05 says “form submits; do not invent keys”; P7T-06 says do not invent ID-document upload. The ledger has no F-33 row.
- **Affected files:** legal-intake contract/screen; P7T-05/06; M13; OPEN-DECISIONS.
- **Affected CAP-IDs:** CAP-217, CAP-343, CAP-344, CAP-348, CAP-350, CAP-361.
- **Affected slices:** P7T-05/06.
- **Affected routes/screens:** `/legal/intake`.
- **What the coding agent is likely to do:** Accept anonymous legal claims with no abuse ceiling or choose an ad hoc identity proof.
- **Resulting bug or rework:** Legal abuse, privacy overcollection, invalid counter-notice handling, and manual cleanup.
- **Why existing stop-and-report controls do or do not contain it:** The slice explicitly proceeds with submission despite the missing controls, and the central ledger does not warn a new agent.
- **Required correction:** Define filer authentication/identity evidence by intake type, public rate/dedupe keys, retention, failure response, and business-day source.
- **Must be corrected before:** affected slice.

### HOL-P1-006 Consent withdrawal is disconnected from vendor deletion

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** Phase 7 OPS exit criteria say CAP-453/454 exist but CAP-506 does not call them. P7T-13 explicitly says “do not call CAP-453/454” until OQ#3 is resolved, while the CMP contract says withdrawal initiates vendor deletion.
- **Affected files:** CMP contract/screen; P7T-13; P7O-08; M16/M18.
- **Affected CAP-IDs:** CAP-453, CAP-454, CAP-506.
- **Affected slices:** P7O-08, P7T-13.
- **Affected routes/screens:** global CMP; analytics erasure operations.
- **What the coding agent is likely to do:** Stop future PostHog capture but leave existing vendor data without a deletion request.
- **Resulting bug or rework:** Privacy/compliance failure and an unprovable deletion lifecycle.
- **Why existing stop-and-report controls do or do not contain it:** They prevent invention but permit both slices to close independently while the required journey remains broken.
- **Required correction:** Specify the transactional/outbox handoff, linkage fields, retry/dead-letter policy, status shown to the user/operator, and deletion confirmation.
- **Must be corrected before:** affected slice.

### HOL-P1-007 Readiness has labels, not an executable predicate catalog

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** [SLICE-P7A-ADMINCORE](03-slices/SLICE-CATALOG-PHASE7-ADMINCORE.md#L9) says M18 §13 contains no predicate list. It permits only seven category names and says not to invent nested keys. `launchReadinessResults.evidence{}` is untyped; freshness/expiry and CAP-509/510 audit are open.
- **Affected files:** M18, readiness/config contracts and screens, P7A-10/11, P3-08.
- **Affected CAP-IDs:** CAP-435, CAP-480, CAP-509, CAP-510.
- **Affected slices:** P7A-10/11, P3-08.
- **Affected routes/screens:** `/admin/readiness`, `/admin/config`, signup admission.
- **What the coding agent is likely to do:** Choose predicates and evidence shape locally or treat stale `overall=ready` as authoritative.
- **Resulting bug or rework:** Signup can open without demonstrable legal/recovery/consent readiness or remain permanently blocked for incompatible implementations.
- **Why existing stop-and-report controls do or do not contain it:** The slice can write `overall=ready` without a canonical truth function; “unavailable=fail” alone is insufficient.
- **Required correction:** Define versioned predicate IDs, owner/query, pass condition, freshness TTL, evidence schema, aggregation, audit event, and explicit exemptions.
- **Must be corrected before:** affected slice.

### HOL-P1-008 Legal/trust content has no source, version, or publish trigger

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** KNOWN ITEM STATE MISMATCH (E5/E6, F-16 alias)
- **Exact evidence:** OPEN-DECISIONS E5/E6 remain open. Phase 2 P2-07 and Phase 7 P7T-08/10 explicitly build only `unavailable_pending_legal` shells and state that published content is blocked pending F-16.
- **Affected files:** CAP-027; legal/trust contracts/screens; P2-07; P7T-08/10/11; M1/M17/M18.
- **Affected CAP-IDs:** CAP-027, CAP-339, CAP-468, CAP-469, CAP-562, CAP-563.
- **Affected slices:** P2-07, P7T-08, P7T-10/11.
- **Affected routes/screens:** `/privacy`, `/dmca`, `/terms`, `/repeat-infringer`, all six trust pages.
- **What the coding agent is likely to do:** Ship permanent pending shells, hard-code policies, or invent a CMS/table.
- **Resulting bug or rework:** Launch blocked by unavailable legal pages or unversioned policy changes without audit/provenance.
- **Why existing stop-and-report controls do or do not contain it:** Local fences are clear, but 53 screens are globally described as autonomous and the slices are still counted as executable.
- **Required correction:** Legal/PM selects source, version schema, publication state, rollback, owner, audit, and readiness predicate; explicitly add `/terms` to CAP-027 or give it an owner.
- **Must be corrected before:** affected slice.

### HOL-P1-009 OTP provider choice blocks the canonical comment path

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** KNOWN ITEM STATE MISMATCH (FOUNDER-DECISION-M7-01)
- **Exact evidence:** The ledger says CAP-551 is unbuildable until an SMS/OTP provider is selected. The setup and P5 catalogs state CAP-141 comment eligibility requires email + mobile verification, so this is not limited to optional profile polish.
- **Affected files:** OPEN-DECISIONS; M7; setup/discussion contracts; P5-02/05.
- **Affected CAP-IDs:** CAP-141, CAP-551.
- **Affected slices:** P5-02 and P5-05.
- **Affected routes/screens:** `/setup`, `/p/[slug]`/`/discussions/[slug]` comment composer.
- **What the coding agent is likely to do:** Stub verification while comments remain impossible, or weaken the server gate.
- **Resulting bug or rework:** Core discussion either does not work or launches without the specified identity assurance.
- **Why existing stop-and-report controls do or do not contain it:** The provider fence is explicit, but the entry guide still clears the discussion-related screens for autonomous build.
- **Required correction:** Select provider and delivery/retry/expiry/rate limits, or change CAP-141’s launch eligibility rule explicitly.
- **Must be corrected before:** affected slice.

### HOL-P1-010 A10 is missing from the editorial integrity path

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** KNOWN ITEM WITH ADDITIONAL IMPACT
- **Exact evidence:** [SCREEN-SCORES.md](06-open-items/SCREEN-SCORES.md#L10) marks `PRIMARY-SURFACE-MISSING(A10)` and NEEDS HUMAN REVIEW. P4-09 requires synchronized draft/claims/similarity review and CAP-542 confirmation before CAP-043 approval.
- **Affected files:** STYLE-KIT; design open items; editorial contract/screen; P4-09.
- **Affected CAP-IDs:** CAP-041, CAP-043, CAP-045, CAP-542, CAP-543.
- **Affected slices:** P4-09/10/11.
- **Affected routes/screens:** `/admin/editorial`; downstream publishing.
- **What the coding agent is likely to do:** Invent a generic table or omit synchronized evidence context while still exposing Approve.
- **Resulting bug or rework:** Unsupported claims can be approved, or the screen is rebuilt after founder review.
- **Why existing stop-and-report controls do or do not contain it:** This is correctly flagged; its impact extends beyond one visual screen to the sourced-content publication journey.
- **Required correction:** Approve an A10 interaction contract covering pane synchronization/tab fallback, claim selection, exact-validation state, keyboard access, mobile behavior, and approve gating.
- **Must be corrected before:** affected slice.

### HOL-P1-011 Core ranking and legitimacy algorithms require product invention

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** M0 requires every rule/number to be literal or point to a bounded config. M6 describes a Bayesian confidence-damped score without the formula/prior keys; M9 leaves Top/Hot priors, weights, gravity, exploration taper, trend baselines, and cooldowns partially undefined; P7E-05 says the seven legitimacy component formulas are unnamed and to stop/report.
- **Affected files:** M0, M6, M9, M12; P5-04, P6-02/03, P7E-05/08.
- **Affected CAP-IDs:** CAP-123–130, CAP-182–190, CAP-283/284, CAP-302–305.
- **Affected slices:** P5-04, P6-02/03, P7E-05/08.
- **Affected routes/screens:** Discussion sort, Feed, Vibing, profile economy, moderation anti-gaming.
- **What the coding agent is likely to do:** Preserve the live virality formula, select arbitrary priors, or implement different formulas in M6/M9/M12.
- **Resulting bug or rework:** Ranking compiles but violates the product’s legitimacy promise and yields incompatible test fixtures.
- **Why existing stop-and-report controls do or do not contain it:** Some slices mention stop gates, but the module sheets are labeled locked/confirmed and the package does not centralize the missing constants.
- **Required correction:** Publish exact formulas, versioned config keys/defaults/bounds, tie-breaks, fixture vectors, and migration behavior for each algorithm.
- **Must be corrected before:** affected slice.

### HOL-P1-012 Timezone skip creates an unrecoverable bootstrap state

- **Severity:** P1 — BLOCKS AFFECTED SLICE
- **New finding or known-item mismatch:** KNOWN ITEM STATE MISMATCH (E4)
- **Exact evidence:** OPEN-DECISIONS E4 says CAP-003 allows skip, leaves `pending_context`, and provides no re-prompt/default/recovery CAP. CAP-005 then blocks every protected write.
- **Affected files:** signin/welcome contracts/screens, M1, P2-02/03, open ledger.
- **Affected CAP-IDs:** CAP-003, CAP-005.
- **Affected slices:** P2-02/03.
- **Affected routes/screens:** `/welcome` and every protected workflow.
- **What the coding agent is likely to do:** Implement the visible Skip button exactly and strand users, or invent a recovery redirect.
- **Resulting bug or rework:** Authenticated users cannot post, comment, acquire, report, or manage a store and require support mutation.
- **Why existing stop-and-report controls do or do not contain it:** The issue is known but not promoted into the global autonomous-build warning.
- **Required correction:** Remove Skip or define a deterministic re-entry/default/force-complete policy with UI and server tests.
- **Must be corrected before:** affected slice.

### HOL-P2-001 Public-read and privacy projections are not closed

- **Severity:** P2 — REAL DEVELOPMENT RISK
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** Post Detail and Tool Directory inventory actors include anonymous while CAP-090/CAP-111 are member rows; contracts leave the branch open. `/u/[handle]` does not define what a non-self viewer sees when `profileVisibility=private`; Search does not define private-profile exclusion.
- **Affected files:** post-detail/tool-directory/profile/search contracts and screens; M7/M9.
- **Affected CAP-IDs:** CAP-090, CAP-111, CAP-526, CAP-529, CAP-552.
- **Affected slices:** P4-04/13, P5-07, P6-05.
- **Affected routes/screens:** `/p/[slug]`, `/tools`, `/u/[handle]`, `/search`.
- **What the coding agent is likely to do:** Return full member projections to anonymous callers or inconsistently hide private profiles.
- **Resulting bug or rework:** Privacy leakage or incompatible public query contracts.
- **Why existing stop-and-report controls do or do not contain it:** The standing public-read rule is good, but these concrete branches remain open.
- **Required correction:** Enumerate anonymous/member/self/private projections and search/comment behavior.
- **Must be corrected before:** integration.

### HOL-P2-002 Exact API ownership and several recovery transitions remain unnamed

- **Severity:** P2 — REAL DEVELOPMENT RISK
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** Contracts/slices flag missing names or transitions for CAP-117 withdraw, CAP-031 source upsert, CAP-529 search query, CAP-200 see-fewer, legal actions, notification mute, appeal outcome read, and multiple pause/resume paths.
- **Affected files:** Wave 1–7 contracts, matching slice catalogs.
- **Affected CAP-IDs:** CAP-031, CAP-117, CAP-200, CAP-340–342, CAP-386, CAP-529 and adjacent rows.
- **Affected slices:** P4-05/08, P6-03/05, P7T-01/04, P7E-16.
- **Affected routes/screens:** Sources, Tool Profile, Feed, Search, Notifications, Appeal.
- **What the coding agent is likely to do:** Independently choose names, return shapes, and terminal states.
- **Resulting bug or rework:** Contract drift, duplicated APIs, and integration adapters.
- **Why existing stop-and-report controls do or do not contain it:** OQs identify many gaps but do not assign a resolution owner before implementation.
- **Required correction:** Add a compact API catalog with exact names, args, returns, auth, idempotency, and terminal/recovery states.
- **Must be corrected before:** integration.

### HOL-P2-003 Application/deployment ownership is ambiguous

- **Severity:** P2 — REAL DEVELOPMENT RISK
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** `app/apps/admin`, `marketplace`, and `seller` are separate Next.js apps with only `/`. Canonical screens use `/admin/*`, `/sell`, and `/s/*`; slice file paths use unqualified `app/admin/...`; no topology document exists (the README points to a missing architecture document).
- **Affected files:** workspace config, sibling apps, all admin/store slices/screens.
- **Affected CAP-IDs:** CAP-230–271, CAP-390–435, CAP-463, CAP-479, CAP-500, CAP-509/510, CAP-567.
- **Affected slices:** P3 admin, P6 store, all Phase-7 admin/ops slices.
- **Affected routes/screens:** All admin, seller, marketplace/store routes.
- **What the coding agent is likely to do:** Build `/admin` inside forum, inside the admin app, or both.
- **Resulting bug or rework:** Broken URLs/auth boundaries, duplicated shells, and deployment rewiring.
- **Why existing stop-and-report controls do or do not contain it:** No precedence rule identifies route host or domain.
- **Required correction:** Publish app/domain ownership, route mounting, cross-app auth/session behavior, and deployment matrix.
- **Must be corrected before:** affected slice.

### HOL-P2-004 Declared parallelism targets the same high-conflict files

- **Severity:** P2 — REAL DEVELOPMENT RISK
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** Phase 1 declares multiple table slices parallel while P1-01a/b, P1-02/03/04/05/06/07/08 all add regions to `convex/schema.ts`. Similar convergence occurs in crons, authz, event catalog, widget catalog, and shared layouts.
- **Affected files:** slice catalogs; future `convex/schema.ts`, `convex/crons.ts`, `convex/lib/authz.ts`, registries.
- **Affected CAP-IDs:** Cross-cutting.
- **Affected slices:** Phase 1 and many Phase 7 slices.
- **Affected routes/screens:** Broad.
- **What the coding agent is likely to do:** Generate incompatible schema edits/types in parallel and resolve conflicts manually.
- **Resulting bug or rework:** Lost validators/indexes, generated-type churn, and integration delays.
- **Why existing stop-and-report controls do or do not contain it:** Dependency graph measures semantic order, not edit collision.
- **Required correction:** Assign integration owners and serialization windows for shared files; split schema regions only if the actual code structure supports it.
- **Must be corrected before:** broad build.

### HOL-P2-005 Several required functional frontend patterns are absent

- **Severity:** P2 — REAL DEVELOPMENT RISK
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** The current UI folder has no shared Textarea, Radio, Slider, Momentum Ticker, Evidence/Diff Panel, or Sanitized Markdown Reader. Screen sheets rely on these for composer/rating/rulebook, legal/wiki, Feed, and editorial workflows.
- **Affected files:** STYLE-KIT; screen sheets; `app/apps/forum/src/components/ui`.
- **Affected CAP-IDs:** Broad UI surface; highest risk CAP-041/542, CAP-086, CAP-112, CAP-418/419, CAP-189.
- **Affected slices:** P3-09, P4-02/05/09, P6-03, P7A-09, P7T legal slices.
- **Affected routes/screens:** Composer, Tool Profile, Rulebook, Feed, Editorial, Wiki/legal forms.
- **What the coding agent is likely to do:** Create screen-local controls with divergent validation/accessibility.
- **Resulting bug or rework:** Component duplication and inconsistent mobile/error behavior.
- **Why existing stop-and-report controls do or do not contain it:** Many sheets mark the gaps, but only A10 is globally gated.
- **Required correction:** Define/implement shared functional controls needed by the first consuming slice; composition-only patterns should have one canonical example.
- **Must be corrected before:** integration.

### HOL-P2-006 Test evidence does not match the risk profile

- **Severity:** P2 — REAL DEVELOPMENT RISK
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** Current source has five test files and 48 declared cases, concentrated in UI primitives/category registry/feed scoring. No E2E suite exists for the 20 journeys, no migration test exists, and no current command could run. SCREEN-SCORES still reports historical 44/44.
- **Affected files:** Vitest config/tests; SCREEN-SCORES; all slice acceptance criteria.
- **Affected CAP-IDs:** Cross-cutting, especially auth, moderation, money, consent, legal, jobs.
- **Affected slices:** All high-risk slices.
- **Affected routes/screens:** All.
- **What the coding agent is likely to do:** Treat prose acceptance criteria and a successful compile as journey completion.
- **Resulting bug or rework:** Cross-module failures surface only during integration or live operations.
- **Why existing stop-and-report controls do or do not contain it:** Slice criteria request tests but no package-wide harness/fixture plan connects them.
- **Required correction:** Add a canonical test matrix and minimum gates: migration, auth/admission, protected writes, moderation dedupe, `/go`, consent deletion, RC-4 recovery, readiness, and all 20 journeys.
- **Must be corrected before:** integration.

### HOL-P2-007 The package is not self-contained for setup

- **Severity:** P2 — REAL DEVELOPMENT RISK
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** [apps/forum/README.md](app/apps/forum/README.md#L9-L13) links five absent documents; [app/package.json](app/package.json#L28) invokes an absent JWT generator; README script claims conflict with package scripts; 27 outside-reference lines exist in 16 PRD documents.
- **Affected files:** app README/package/config; 16 PRD docs with external references.
- **Affected CAP-IDs:** Environment-level.
- **Affected slices:** Initial setup/auth/deployment.
- **Affected routes/screens:** All runtime surfaces.
- **What the coding agent is likely to do:** Search outside PRD despite the prohibition, improvise JWT/OAuth setup, or use stale commands.
- **Resulting bug or rework:** Setup failure, inconsistent local environments, and false conclusions about reference behavior.
- **Why existing stop-and-report controls do or do not contain it:** The entry guide promises self-containment; it does not identify these missing dependencies.
- **Required correction:** Restore or remove referenced docs/script, document Node/Corepack/pnpm prerequisites and commands, and internalize any currently authoritative external asset/decision.
- **Must be corrected before:** broad build.

### HOL-P2-008 Route drift is only partly governed

- **Severity:** P2 — REAL DEVELOPMENT RISK
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** The entry guide accepts live-route naming differences and specifically protects `/discussions/[slug]`. Screen sheets still label `/new-post`, `/users/[handle]`, `/profile` + `/settings`, and anonymous `/` as unresolved drift/unbuilt behavior.
- **Affected files:** entry guide; corresponding screen sheets; forum route tree/navigation.
- **Affected CAP-IDs:** CAP-086, CAP-090, CAP-143/526–529, CAP-464/478.
- **Affected slices:** P2-08, P4-02/13, P5-06/07.
- **Affected routes/screens:** `/`, `/compose`, `/p/[slug]`, `/settings/profile`, `/u/[handle]`.
- **What the coding agent is likely to do:** Preserve some aliases, rename others, and generate links inconsistently.
- **Resulting bug or rework:** 404s, duplicate routes, broken canonical URLs/SEO, and navigation churn.
- **Why existing stop-and-report controls do or do not contain it:** The accepted-naming note is broad, while the individual sheets still request a decision.
- **Required correction:** Publish a route migration table with canonical URL, live URL, keep/redirect/remove decision, redirect status, and owner.
- **Must be corrected before:** integration.

### HOL-P3-001 Counts and readiness evidence are stale in current canonical files

- **Severity:** P3 — DOCUMENTATION OR OPERABILITY DEBT
- **New finding or known-item mismatch:** New finding
- **Exact evidence:** The actual register is 572 contiguous rows, while inventory and Phase 1–3 slice headers say 568. SCREEN-SCORES says 44/44 tests while 48 test declarations exist now.
- **Affected files:** inventory; Phase 1–3 catalogs; SCREEN-SCORES.
- **Affected CAP-IDs:** CAP-569–572 are most affected by stale headers.
- **Affected slices:** P3-03, P5-05, P6-12 and consumers.
- **Affected routes/screens:** Admin catalog, Journal, seed stores, `/go` SubID handling.
- **What the coding agent is likely to do:** Trust stale totals during coverage checks or overlook late rows.
- **Resulting bug or rework:** Audit noise and false completeness reports rather than direct runtime failure.
- **Why existing stop-and-report controls do or do not contain it:** Direct row counting catches it; normal reading may not.
- **Required correction:** Regenerate count headers and current verification evidence from repository scripts.
- **Must be corrected before:** may remain documented.

## 13. Known Items With Additional Impact

| Item | Classification | Additional impact |
|---|---|---|
| F-37 `activationProgress` | KNOWN ITEM STATE MISMATCH | Blocks P1-01b, not merely M14 UI; contradicts the “53 autonomous screens” operating claim. |
| F-35 `policyFamily` | KNOWN ITEM WITH ADDITIONAL IMPACT | Blocks the report-to-case dedupe invariant and integration testing across all report writers. |
| F-22 `manual_review` | KNOWN ITEM STATE MISMATCH | Affects legal restore, money, sanction, final publish, and termination; read-only + reject-redrive leaves no recovery. |
| F-33 legal procedure | KNOWN ITEM STATE MISMATCH | Referenced as open in current slices but absent from OPEN-DECISIONS, so a new agent can miss it. |
| E5/E6/F-16 legal publication | KNOWN ITEM STATE MISMATCH | Blocks readiness and indexability destinations, not merely final legal copy. |
| FOUNDER-DECISION-M7-01 | KNOWN ITEM STATE MISMATCH | Blocks CAP-141 comment eligibility, not only an optional mobile-profile enhancement. |
| E4 timezone skip | KNOWN ITEM STATE MISMATCH | Creates an authenticated user with no in-product route to any protected action. |
| A10 | KNOWN ITEM WITH ADDITIONAL IMPACT | Correctly flagged, but it gates the claim-verification/publish integrity loop, not only visual fidelity. |
| A8 | Known and correctly contained | Provisional A8-A code is usable; only founder/Figma reconciliation remains. No build deduction beyond local rework risk. |
| A9 | Known and correctly contained | A9-KEEP is an explicit executable default; no blocker unless founder chooses graph. |

## 14. Scorecard

| Category | Weight | Score | Principal deductions |
|---|---:|---:|---|
| Navigation and Agent Operability | 10 | **6** | HOL-P0-001, HOL-P1-002/008/009/012, HOL-P2-003/007/008 |
| End-to-End Traceability | 12 | **9** | HOL-P1-001, HOL-P2-002; 27 CAPs lack slice ownership |
| Cross-Layer Semantic Consistency | 15 | **7** | HOL-P0-001, HOL-P1-003/006/007/011, HOL-P2-001/008 |
| Slice and Build-Order Executability | 13 | **7** | HOL-P0-001, HOL-P1-001/002/004/005/008/009/010, HOL-P2-004 |
| Backend, Data, and Security Readiness | 15 | **8** | HOL-P0-001, HOL-P1-003–009/011/012 |
| Frontend Foundation Readiness | 12 | **9** | HOL-P1-010, HOL-P2-003/005/008 |
| Testability and Failure Recovery | 10 | **4** | HOL-P0-001, HOL-P1-004–007/011, HOL-P2-006 |
| Product-Promise Fidelity | 8 | **6** | HOL-P1-001/004–011; core promise is preserved in prose but several journeys do not close |
| Self-Containment and Environment Reproducibility | 5 | **3** | HOL-P2-007, HOL-P3-001; current execution unavailable |
| **Total** | **100** | **59** |  |

### Category rationale

**Navigation and Agent Operability — 6/10.** Full marks require one start path that identifies the valid next slice, all blockers, app ownership, migration posture, and completion command. Read order and precedence are good; global readiness claims and deployment/reference ambiguity are not.

**End-to-End Traceability — 9/12.** Full marks require every CAP to have semantic slice ownership and acceptance coverage. Screen→contract and dependency references are excellent, but 27 CAPs are absent from slices and several API names/recovery actions remain unowned.

**Cross-Layer Semantic Consistency — 7/15.** Full marks require one compatible system. The canonical documents mostly agree internally, but the executable app implements different tables, auth, routes, roles, events, and workflows.

**Slice and Build-Order Executability — 7/13.** Full marks require a valid intermediate repository and safe parallelism. The phase order is thoughtful; the missing migration boundary, blocked foundational fields, shared-file conflicts, and ready-but-fenced high-risk slices prevent broad execution.

**Backend, Data, and Security Readiness — 8/15.** Full marks require no dangerous policy invention. Strong fail-closed, ledger, legal-hold, Signal-firewall, and `/go` rules earn substantial credit. Auth divergence, moderation enum, legal identity, consent deletion, readiness, and algorithm gaps prevent a higher score.

**Frontend Foundation Readiness — 9/12.** Full marks require all required functional patterns and one deployment/route foundation. Tokens, themes, layouts, primitives, responsive states, and screen sheets are strong. A10, missing shared controls, four app roots, and route drift remain material.

**Testability and Failure Recovery — 4/10.** Full marks require executable acceptance tests for negative/retry/stale/rollback paths. There are only five current test files, no E2E suite, no migration tests, no current run, and unresolved recovery states.

**Product-Promise Fidelity — 6/8.** Full marks require every distinctive promise to close in slices and UI. The plan preserves sourced editorial, personas, MAX, resources, store, Signal, legal, and ops, but several decisive links are omitted or fenced.

**Self-Containment and Environment Reproducibility — 3/5.** Full marks require all docs/scripts and a reproducible clean run. Dependencies and env templates exist, but setup references and JWT script are missing; current execution could not be verified.

## 15. PRD Build-Executability Score

# 59/100

> If this PRD were handed today to a strong coding agent with no historical project context, how much of the designated Createconomy application could be implemented correctly before the agent encountered a product-level ambiguity, contradiction, missing dependency, or misleading reference?

Approximately **35%** could be implemented before the first unavoidable product-level stop if the agent follows build order: P1-01b encounters F-37 almost immediately, and a careful agent should stop even earlier on the live/canonical architecture collision. Across the whole designated product, approximately **52%** is executable without clarification by isolating unaffected schema/helpers, visual components, `/go`, resource acquisition, portions of storefronts, and several read-only surfaces.

- **Percentage executable without clarification:** **52%**
- **Percentage executable after resolving all P1 findings:** **84%**
- **Expected spec-induced rework risk:** HIGH
- **Expected frontend-foundation drift risk:** MEDIUM-HIGH
- **Expected backend/integration risk:** HIGH

The remaining gap after P1 resolution is ordinary implementation detail plus P2 integration/documentation work. The current P0 makes those percentages conditional: code should not cross the canonical/live boundary until the transition is decided.

## 16. Pre-Development Correction Gate

### Must fix before broad implementation

| Finding | Exact file or owner | Required correction | Effort | Expected risk reduction |
|---|---|---|---:|---|
| HOL-P0-001 | Architecture owner; entry guide, Phase 1/4/5/6 catalogs, app schema/auth | Decide reset vs migrate; publish table/API/route/auth cutover, adapters, rollback, and tests | L | Removes split-brain and broad rework |
| HOL-P1-001 | Slice-catalog owner | Assign all 27 orphan CAPs or explicitly absorb/defer them | M | Prevents silent capability loss |
| HOL-P1-002 | Founder/PM, M14/P1 | Lock seven activation bits and triggers | XS | Unblocks shared users schema |
| HOL-P1-009 | Founder/security, M7 | Select OTP provider or change comment gate | S | Unblocks canonical discussion writes |
| HOL-P2-003 | Solution architect | Declare app/domain/route ownership and auth/session topology | S | Prevents duplicate admin/seller builds |
| HOL-P2-004 | Build lead | Serialize shared-file edits; assign registry/schema owners | XS | Reduces merge and generated-type failures |

### Must fix before affected slices

| Finding | Exact file or owner | Required correction | Effort | Expected risk reduction |
|---|---|---|---:|---|
| HOL-P1-003 | Founder/M13 | Enumerate `policyFamily` and mappings | XS | Makes case dedupe testable |
| HOL-P1-004 | PM/M18 | Define RC-4/manual-review human disposition | S | Restores recoverability |
| HOL-P1-005 | Legal/Security/M13 | Lock identity, rate/dedupe, calendar, retention rules | M | Prevents unsafe legal intake |
| HOL-P1-006 | Privacy/M16/M18 | Wire consent withdrawal to durable vendor deletion | S | Closes privacy lifecycle |
| HOL-P1-007 | Reliability/M15/M18 | Publish versioned readiness predicate catalog | M | Makes signup-open gate meaningful |
| HOL-P1-008 | Legal/PM | Choose policy storage/version/publish/rollback | S | Unblocks legal/trust/indexability |
| HOL-P1-010 | Founder/Design/M2 | Approve A10 interaction contract | M | Protects evidence review |
| HOL-P1-011 | M6/M9/M12 owners | Lock formulas, defaults, bounds, fixtures, versions | M | Prevents incompatible ranking/economy |
| HOL-P1-012 | Product/M1 | Remove Skip or define recovery path | XS | Eliminates stranded accounts |
| HOL-P2-001 | M4/M5/M7/M9 | Define public/member/self/private projections | S | Prevents privacy leaks |
| HOL-P2-002 | Contract owners | Complete API names, args/returns, terminal/recovery actions | M | Reduces integration adapters |
| HOL-P2-005 | Frontend owner | Land shared controls at first consumer; A10 separately gated | M | Reduces UI duplication |

### May resolve during implementation

| Finding | Exact file or owner | Required correction | Effort | Expected risk reduction |
|---|---|---|---:|---|
| HOL-P2-006 | QA/build lead | Add migration, journey, negative-path, and E2E gates | L | Detects integration failures early |
| HOL-P2-008 | Routing owner | Publish redirects/aliases and canonical links | S | Prevents route duplication/SEO drift |
| HOL-P3-001 | Docs automation | Regenerate counts and verification status | XS | Removes audit noise |

### May defer until pre-launch

- A8 founder visual reconciliation, provided A8-A remains explicitly provisional.
- A2 charts, provided analytics ships as honest cards/tables and no contract claims chart interaction.
- Tracked FUTURE capabilities that are correctly out of MVP scope.

## 17. Recommended Implementation Posture

**PAUSE BROAD IMPLEMENTATION**

Work that can start immediately: isolated UI primitives, test harness work, migration discovery, route/topology decision records, non-schema design-system examples, and safe infrastructure helpers that do not bind to the legacy/canonical split.

Work that must wait: canonical identity/schema rollout, Feed/Discussion extension, moderation/reporting, legal intake, consent erasure, readiness, Signal calculations, editorial approval, and any admin/seller route deployment.

Build shared foundations in this order:

1. Resolve HOL-P0-001 and publish the transition map.
2. Resolve Phase-1 identity bits, OTP, app topology, and shared-file ownership.
3. Close 27 CAP ownership gaps and exact algorithm fixtures.
4. Build canonical authz/audit/event/schema with migration tests.
5. Adapt Feed/Discussion/Auth to canonical APIs before feature expansion.
6. Gate moderation, legal, consent, readiness, and RC-4 on human-approved contracts.

Agents should treat every OPEN/CONSTRAINED item as a hard local stop, record the finding ID in the ticket, and never create an implementation-only answer to a product/legal/security question. Human review remains mandatory for A10, legal identity/content, OTP, policyFamily, activation bits, manual-review disposition, readiness predicates, and ranking/legitimacy formulas.

## 18. Final Brutal Verdict

**DO NOT START BROAD BUILD**

The PRD does not yet serve its central promise as an executable package. It contains a strong product model, disciplined contracts, useful slices, and a credible frontend design foundation, so it will reduce development effort after targeted corrections. Today, however, the mandatory reference app and canonical plan are two incompatible systems, 27 capabilities have no slice owner, and several legal, moderation, consent, reliability, readiness, and ranking decisions remain at the exact point where code must be deterministic. Developers would build product in isolated areas but spend too much of integration debugging the specification. The frontend library is a credible anti-slop visual foundation; the remaining problems are not a need to rewrite the whole PRD, but the live/canonical transition is foundational and must be resolved before broad implementation, followed by local P1 gates.
