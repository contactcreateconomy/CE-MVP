# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The 0.1.0 entry below is **reconstructed from the project-status docs** (`docs/00-project-status/PROJECT-STATUS.md` and companions) — the git history itself contains only the single 2026-09-05 initial commit.

## [Unreleased]

### Phase 4 — P4-14 + P4-15 post-detail mechanics (2026-09-05) — PHASE 4 CODE COMPLETE
- **P4-14 debate (CAP-093/094):** `posts/debate.ts` — `cast` (unique userId+postId; active published user-debates only — persona/editorial votes excluded from tallies by construction) and `change` (atomic decrement-old + increment-new in one transaction).
- **P4-14 list (CAP-095/096/097):** `posts/listItems.ts` — `add` (≤200 chars, community_ranked only — static_creator author-lock enforced), `remove` (item creator or post author; votes deleted with the derived tally), `toggleVote` (unique userId+item; voteCount maintained in the same mutation). OQ#7 fence honored: static_creator vote-toggle suppression unstated — not invented.
- **P4-15 help (CAP-098/099):** `posts/help.ts` — `accept` (single accepted, replaces prior; user-Help author-only, editorial-Help Editor/Publisher) and `reopen`. The accept affordance targets a comment id whose thread arrives with Phase 5 (contract OQ#6) — the mutation is live now; P7E-13 stops fixturing these writers.
- **P4-15 showcase (CAP-100):** `posts/showcase.ts` — `submitProjectUrl` with the full server-side admission check (normalized hostname, HTTPS-only, no embedded credentials, IP-literal/localhost/reserved rejection, exact-host-or-authorized-subdomain vs `systemConfig.showcase.allowedDomains`, **no preview fetch**, fail-closed when the allowlist is missing); `approvalStatus=pending`; moderator review stays P7E-13 CAP-101. `postShowcases.approvalStatus` added (bible l.94/359); the ShowcaseBody button now renders only when approved. Allowlist registry+config row seeded (empty default = fail-closed posture until an administrator populates it).
- UI: debate vote buttons (cast/change with your-vote state), list add/vote/remove affordances, help accept/reopen — wired into `PostDetailClient`.
- Verified: typecheck/lint 0 errors, 315/315 tests (+8 — incl. the exhaustive CAP-100 admission suite), coverage 572/572, pushed live + seeded. Remaining for the phase: the exit-gate E2E (needs G1 founder bootstrap + GLM/classifier keys).

### Phase 4 — P4-13 post-detail render (2026-09-05)
- Schema (bible l.93–99/166): `postSeoMeta` (slug = the canonical route key, `previousSlugs` reserved for P7G-01 301s), `debateVotes` (unique userId+postId; persona votes excluded from tallies), `listItemVotes` (unique userId+item).
- `convex/posts/detail.ts`: `getDetail` (CAP-090 — `{post, extension, threadContext}` with mechanic state per type, signed-in `userVote` only, CAP-106 read tolerance reverting cleared Help refs to open, live CAP-092 compare rows from the tools aggregate with count-0 → "—" and nothing stored, and the CAP-049 structured affiliate CTAs `rel="sponsored nofollow noopener"`); `listByType` (CAP-091, Convex cursor pagination — M4-owned, P6-03 consumes); `softDelete` (CAP-089 — author-only tombstone via `lifecycleStatus=archived`, thread preserved).
- Route strangler (00-TRANSITION): `/discussions/[slug]` resolves **canonical `postSeoMeta` first**, falls back to the legacy forum thread — both render paths live in one loader. `generateMetadata` sets **noindex unconditionally** (CAP-107 Wave-2 posture; the indexable flip is inseparable from the P7G-01/P7T-11 pairing per FATAL-M17-01). Held/rejected/private/unlisted never resolve a live detail.
- `PostDetailClient`: the §4.3 720px reading column with per-type blocks (news source-of-truth, review verdict, compare live grid, spark statement, debate tallies, list items, showcase UGC-rel project button, help state), the CAP-089 tombstone render, and an honest Phase-5 thread placeholder. Mechanic affordances render read-only — P4-14/15 wire them.
- Publish (CAP-051 seo.generate): `persistPublish` now writes the deterministic postSeoMeta base (slug + title/description from the final approved revision; GLM enrichment rides the pipeline).
- Fixed en route: TS narrowing exposed that the published-only guard made the CAP-089 tombstone unreachable — archived-public posts now resolve.
- Verified: typecheck/lint 0 errors, 307/307 tests (+6), coverage 572/572, pushed live (new tables + indexes); live probes — unknown slug → null, paginated listByType → cursor contract.

### Phase 4 — P4-12 affiliate inventory (2026-09-05)
- Schema (bible l.206-208, Wave-4B E1–E6 verbatim): `commercialEntities` → `affiliateRelationships` → `affiliateLinks` (+ `postAffiliateLinks.affiliateLinkId` tightened to the id type). Logo asset via CAP-012 (`forum/mutations.generateUploadUrl` — reuse, no fork).
- `convex/affiliateInventory.ts` (administrator-only per W4B-E4, CAP-019 rate-limited, writeAudited): `listInventory` (CAP-544 connected read), `entityUpsert`/`relationshipUpsert`/`linkUpsert` (CAP-539/540/541 with **server-side parent-chain rejection** — create-child-without-parent blocked in UI and mutations; URLs on the E3 HTTPS/no-creds discipline), `deactivate` (CAP-545 soft cascade: entity → relationships terminated + links inactive; relationship → terminated + its links; link → itself; published posts keep their links per FUTURE-M2-01).
- `convex/editorial/inject.ts` (CAP-049/050): inject verifies active status **at injection time** (link active AND relationship active — the E1/E2 stamps), enforces the CAP-057 boundary server-side, and stages onto `draft.plannedAffiliateLinks` (publish validates + materializes); remove un-stages (published posts immutable per FUTURE-M2-01). `listInjectable` powers the picker (tool name-match as the operator's selection aid).
- `/admin/affiliate-inventory` console (dense §12.4 panel): entity cards with nested relationships/links, parent-gated create buttons (contract state B), CAP-545 confirm modals, logo upload. Widget catalog grew the console row (administrator-only; the P3-03 test evolved with the catalog's designed per-phase growth).
- Editorial surface: "Inject link (n/2)" affordance on approved/scheduled candidates with the active-link picker + staged-link removal.
- Verified: typecheck/lint 0 errors, 301/301 tests (+7), coverage 572/572, pushed live; widget catalog re-seeded (4 consoles).

### Phase 4 — P4-11 publish (2026-09-05)
- `convex/editorial/publish.ts`: time-fired `publishCandidate` (internalAction → atomic `persistPublish`) — one transaction writes posts (authorType=editorial) + postNews source-of-truth block + postRevisions (changedByUserId = the approver stamped at approve) + postAffiliateLinks materialization + contentEmbeddings copy (candidate→post) + candidate status flip; idempotent (scheduled-only re-check).
- **CAP-046 re-run** at publish: URL half checked inside the transaction; similarity half enforced by revision-staleness (latest run must pass AND be on the current candidateRevision — a post-edit draft without re-qualification cannot publish). **CAP-057 cap binds HERE** (FATAL-adjacent): `affiliateCapViolation` (≤2/post, ≤1/tool) runs inside the publish gate — inject 3 → publish blocked. **CAP-056** persona density trivially satisfied — persona fan-out (CAP-047/051) stays fenced to Phase 5 (flagged).
- **OQ5 outcome (chosen + documented):** publish-gate failures keep the candidate `scheduled` + `draft.lastPublishFailure` recorded + "publish blocked" badge on the queue + warning Banner in the workspace.
- Scheduler: `candidateSchedule` now arms `runAfter(fireAt, publishCandidate)`; a 5-minute `sweepScheduled` cron covers missed fire-times and rows scheduled before this wiring.
- Social derivatives (States G): CAP-052 System GLM generation (twitter/linkedin/hook/teaser) attempted post-commit — GLM failure does not un-publish (flagged choice); CAP-053 Editor export is copy+mark-exported only (DEC-O07 export-only, never auto-posted). New schema: `postSocialDerivatives` + `postAffiliateLinks` (bible l.167/168 verbatim) + `contentEmbeddings.by_ref` index.
- Client: regenerated api types surfaced stricter inference — boundary casts added in tools/campaigns/notifications/tag-picker/vibing clients; landing CTA gained a fail-closed default branch.
- Verified: typecheck/lint 0 errors, 294/294 tests (+9), coverage 572/572, pushed live (new tables + indexes + cron active).

### Phase 4 — P4-10 editorial decisions (2026-09-05)
- `convex/editorial/decisions.ts`: `candidate.approve` (Publisher; fail-closed server-side on unconfirmed refs via canApprove per CAP-542/043, on status≠review per CAP-041, and on anything but a passing latest qualification run per CAP-040; status-flip only — INV-2, no auto-publish), `candidate.reject` (rejectionReason required, terminal-for-revision, records preserved; reason is the retained legal-audit record distinct from the generic auditLog trail per CAP-044), `candidate.schedule` (CAP-054: approved-only, future fire-time recorded as draft.scheduledFor — the personaCommentDrafts status-pattern; NO auditLog, register-faithful flagged OQ2), `candidate.regen` (Editor; GLM ≤3 attempts per candidate lineage counted from generationRuns, exhausted state; bridges to the forge.draft action via scheduler.runAfter per the CAP-543→045 precedent).
- `/admin/editorial` decision bar: Approve wired to the live gate, Reject modal with required reason, Schedule modal with the §11.14 DatetimePicker, Regen with attempts-used display + exhausted-disable; decision errors via Banner, successes via Toast. `candidateReview` now returns `regen` state (States C).
- Schema tightening: `contentCandidates.claimClusterId` → `v.id("claimClusters")` (its own stale-TODO note — the table exists since P4-08).
- **Fence (flagged, not silent):** `persona.regenComment` (CAP-048) deferred to P5-08/11 — persona tables are M8-owned; publish-time persona fan-out (CAP-047/051) defers with it and P4-11 proceeds without persona comments (CAP-056 cap trivially satisfied).
- Verified: typecheck/lint 0 errors, 285/285 tests (+6 new), coverage 572/572, pushed live; id-validator fail-closes fabricated candidate ids; role gate via the assertAdminPermission chain live-proven on sibling functions. Full authenticated E2E rides the phase exit-gate run (G1 + GLM keys).

### Phase 4 — Step 0 foundation (2026-09-05, pre P4-10)
- **P4 validation audit findings fixed:** `postTypeConfig` was never seeded anywhere (createPost's R-TYP gate rejected every type — now 8 active + 2 locked rows seeded idempotently by `seed:bootstrap`); URL regex false-positived on decimals ("4.5", "v1.2"); showcase URL carve-out exempted the whole body instead of the `projectUrl` field; `updatePost` read a nonexistent `posts.projectUrl` and silently dropped extension updates (extension rows + verdictScore now ride the same transaction per W2-E4); editorial workspace queries (`queueList`/`candidateReview`/`loadCandidateRefs`) were publicly readable (now Editor-role-gated — live-verified: anonymous calls rejected); qualify replay persisted a type-invalid id (replay runs are now report-only — the immutable audit is for live runs).
- **Rate limits enforced (gate G2 closed):** `@convex-dev/rate-limiter` component installed (`convex/convex.config.ts`), `checkRateLimit` wired per the P1-09 contract; `waitlist.join` enforces CAP-015's 3/24h per-email gate BEFORE the duplicate lookup (attempts count; email-probing via `alreadyJoined` blocked). Live-verified: 3 attempts pass, 4th throws. ip-side gates need the client IP (Convex mutations don't receive it) — activate at http/edge entry points (flagged).
- **Rulebook seeded (DEV-HANDOFF #12 partial):** `rulebook:deploySeed` run — 5 qualification rules (H-QUOTE/H-SIM/H-DUP/H-HAT/H-TYPE) live on the deployment.
- CLI note: `npx convex run` needs the colon form (`rulebook:deploySeed`) for nested names on convex 1.34.

### Audited — Phases 1–3 verification (2026-09-05)
- **Static:** 279/279 tests, lint 0 errors, coverage 572/572; bug-class sweep clean (no `ctx.db` inside any action; absorbed entities `takedownRequests`/`dmcaNotices`/`systemJobs` exist only in comments/tests asserting their absence; PostHog unmounted; flag defaults fail closed, no `?? true`).
- **Live (dev deployment):** `effectiveSignupMode` fail-closes to `closed` with no readiness row (FATAL-M1A-02 ✓); sealed keys absent from registry and rejected by `casUpdate` ✓; unregistered config keys throw ✓; admin widget catalog seeded via `deploySeed` (3 consoles — DEV-HANDOFF #5 closed) ✓; `seed:bootstrap` idempotent (37/37 skipped on re-run) ✓; E5 gate blocks `signup.mode=open` ✓.
- **Fixed — runtime-breaking:** `eventCatalog` was never seeded anywhere, so `captureEvent` rejected `signup` and `waitlist_join` (CAP-437) → **public `waitlist.join` and `finalizeBootstrap` would have failed on first real use**. Rows now seeded idempotently by `seed:bootstrap`. Separately, every `rawEvents` insert missed the required `isAiPersona` field (bible unions M12's `isAiPersona` with M16's `isPersona`) — `captureEvent` now derives both from one truth. E2E-verified: `waitlist.join` joins, duplicate-joins idempotently, writes no `users` row (CAP-014), captures the event same-mutation (CAP-436).
- **Fixed — logic:** `config.casUpdate` allowed setting `signup.mode=open` through the generic editor path, bypassing the E5 readiness gate that `admin/stop.signupModeSet` enforces — now the same in-transaction rule applies (CAP-480 "setter and gate are one transaction").
- **Not yet E2E-verifiable (needs G1 founder bootstrap):** P3's permission-filtered catalog / revoke-next-request with a real staff session; P2's CAP-005 precedence against an authenticated `pending_context` user. Guards verified to reject unauthenticated calls (fail-closed direction). Known open: rate limits defined-not-enforced (G2); `launchReadinessResults` reads use `.first()` (oldest) — P7A-10 must move to "latest row" semantics when multiple rows exist.

### Added
- Root `README.md` — product overview, quickstart with repo-correct paths, scripts, environment variables, docs map, pre-development checklist.
- Root `AGENTS.md` — operating instructions for coding agents: spec path mapping (`PRD/` → `docs/`), read order, hard rules, architecture decisions, code conventions, open items.
- This `CHANGELOG.md`.
- `LICENSE` — proprietary, all rights reserved (swap before any open-sourcing).
- ~~GitHub Actions CI~~ — added then removed the same day per founder decision; CI returns at production readiness on `main` (note for then: `pnpm build` needs `NEXT_PUBLIC_CONVEX_URL` at build time — admin pages prerender without the `isConvexConfigured()` guard the shell pages use).

### Connected — Convex dev deployment (2026-09-05)
First-ever deployment push of the backend to the dev deployment `watchful-chameleon-570` (team `harinie`, project `cemvp`): functions + 82-table schema live; `convex/_generated/api.d.ts` regenerated by real codegen (supersedes the hand-extended version; verified to contain every module it had, plus the previously missing `waitlist`, `seed`, `lib/*`); all four legal docs seeded v1 published (`legalContent:getPublished` verified); platform bootstrap seeded (categories, fail-closed config registry, rulebook constants); dev-server smoke test `/feed` → 200 against live data.

### Fixed — deployment push blockers (surfaced by the first real push)
- `convex/lib/safeFetch.ts` split: pure R-SSRF validators (`validateUrlSyntax`, `isBlockedIp`, fetch types) moved to new default-runtime module `lib/urlGuards.ts`, re-exported for node importers. `convex/sources.ts` (V8 runtime) no longer imports the node-only fetch module.
- New `convex/sourcesValidate.ts` (`"use node"`): the `validateSourceUrl` action moved out of `sources.ts` — actions may use Node APIs, queries/mutations may not. Frontend call site updated (`api.sourcesValidate.validateSourceUrl`).
- `convex/waitlist.ts`: `publicMutation` (PRD vocabulary, not a Convex API) aliased to `mutation`.
- `convex/forge.ts` and `convex/ingest/extract.ts`: dropped unnecessary `"use node"` (they use only `fetch`/`process.env`, which the default runtime provides) — mutations cannot be defined in Node-runtime files.
- `convex/ingest/pollers.ts` split: the four internal mutations moved to new `ingest/pollersData.ts` (same reason); `recordPoll` rewritten as a `recordPollState` mutation + wrapper — the old helper called `ctx.db` directly from inside actions, which cannot work at runtime.
- `convex/lib/hash.ts`: pure `hashContent` extracted so non-node modules (`forge`) can import it; `pollers.ts` re-exports it.
- `convex/schema.ts` `forumProfiles`: tolerate legacy-only `managedByAutomation` flag present on pre-copy demo-persona rows in the shared deployment (forum* tables are transitional per 00-TRANSITION; dropped in SLICE-P7-CLEANUP).
- ESLint: 79 pre-existing errors fixed to zero — typed casts replace `any` in admin audit/config/layout, escaped apostrophe in signin, command-palette render loop no longer reassigns `runningIndex` (prefix-sum section offsets); phase test files carry the same `no-explicit-any` disable header as `p4-08`.
- `scripts/cap-coverage.mjs` no longer hardcodes the original Windows workspace path; it now reads `docs/03-slices/` relative to the repo root, so the coverage gate runs on any machine.
- `apps/forum/README.md` doc links that pointed at files never carried into this repo now resolve (root README, SETUP.md, PRD docs).
- `SETUP.md` paths updated from the older `PRD/app` wording to this repo's layout.

### Environment (dev machine)
- pnpm 10.28.2 installed; `node_modules` rebuilt for darwin-arm64 (the Windows-copied tree had broken pnpm links, stale bin shims with foreign `NODE_PATH`s, and missing execute bits).
- Convex CLI authenticated (device login, `~/.convex/config.json`); root `.env.local` created by the CLI with the deployment config.

### Repository hygiene (2026-09-05)
- Added `.gitignore` (dependencies, build outputs, `.env*`, `.DS_Store`, tooling caches).
- Untracked `node_modules/` — root and the nested copies in `apps/admin`, `apps/marketplace`, `apps/seller`, `packages/auth-ui` — from the initial commit, and removed the unused 122 MB Windows SWC binary (`@next/swc-win32-x64-msvc`). Repository pack size went from ~127 MB to ~1.5 MB, unblocking the GitHub push.

## [0.1.0] - 2026-09-05

Initial import: the PRD reference app and the complete, audited build specification.

### Product specification (docs/)
- Complete PRD: **572 capabilities**, **54 screens** (56 contracts, waves 1–7), **132 slices** across 7 build phases, 19 module build sheets (M0–M18), and the design system (`STYLE-KIT.md`: tokens, §11.1–§11.26 component specs, layouts).
- All 11 former stop-and-report decision fences **resolved and locked** (2026-09-04): OTP via Twilio Verify, timezone auto-detect, 7 activation-progress bits, policyFamily taxonomy, manual_review actions, legal-intake rules, consent→vendor-deletion outbox, 8-category readiness predicates, versioned legal content, A10 two-pane evidence review, `calibration_pending` ranking constants.
- Founder-approved transition plan (2026-09-04): RESET + strangler — canonical tables alongside legacy `forum*` tables, no data migration, no dual-write; live route names canonical (`/discussions/[slug]`, `/new-post`, `/users/[handle]`, `/profile` + `/settings`); forum app owns all MVP routes with admin/seller/marketplace parked.

### Implemented (reference app)
- **Phase 1 — schema + platform spine:** identity core (`users`, `privateUserData`, `roleAssignments`), waitlist/notifications, moderation/legal-intake tables, jobs spine, `systemConfig` + fail-closed flags, audit log, `rawEvents`/`eventCatalog`, bootstrap seeding, rate-limit helpers, SSRF-safe fetch.
- **Phase 2 — identity + entry:** signin/welcome/waitlist/landing surfaces and auth wiring.
- **Phase 3 — admin shell + shared components.**
- **Phase 4 — content core (partial, P4-01..P4-09):** typed-post content model, qualification pipeline seams, ingestion groundwork.
- Convex backend: **82-table schema**, auth (magic-link, password, OAuth providers), crons (feed cache, analytics, ingestion pollers), `forum/`, `admin/`, `ingest/`, `qualify/`, `lib/` modules.
- Reference implementations verified working: `/feed` (ISR + Convex), the auth popup (`packages/auth-ui`), `/discussions/[slug]` (partial — extends toward its wave-5 contract).
- Test suite: **279 tests passing**; typecheck and lint clean; production build (Turbopack) green.

### Known limitations at import
- The code has **never run against a live Convex deployment** — all verification used mocks; no deployment push was ever made.
- Rate limits are defined but **not enforced** (`@convex-dev/rate-limiter` not installed).
- OAuth provider secrets are not part of this copy — the auth UI is a reference implementation; magic-link email throws in production until a provider is wired.
- Legal pages render `unavailable_pending_legal` until `pnpm convex:seed-legal` is run (requires one-time Convex CLI login).
- Remaining scope: Phases 4 (7 slices), 5 (12), 6 (18), and 7 (57) — 94 slices not started.
- Open (non-blocking) decisions: E1, F-34, F-36, F-38, and the FUTURE-* rows in `docs/06-open-items/OPEN-DECISIONS.md`; wave-4-editorial's A10 panel flagged NEEDS HUMAN REVIEW.
