# SLICE CATALOG — BUILD PHASE 3: ADMIN SHELL + SHARED COMPONENTS

**Date:** 2026-08-29 · **Phase order source:** AUDIT-FINAL.md Part D (corrected build order)
**Basis:** `CAPABILITY-REGISTER-MERGED.md` (572 rows) · `_data-model.md` (admin entities l.255–263, all field-complete) · Wave 7B contracts (admin-shell, admin-config, admin-roles, admin-audit) · AUDIT-FINAL F-04/F-21/F-24 · STYLE-KIT §12.4/§11
**Sizing-rule addendum applied:** every cited bullet checked for ellipsis/`{…}`/"see X" incompleteness. One catch: `adminWidgets.dataSourceKey` is annotated "*(enum → code)*" with **no enumerated literals anywhere in the corpus** — handled inside SLICE-P3-03 by deriving literals only from this phase's three named consoles (corpus-grounded), not inventing a platform-wide enum. All other admin-entity bullets (l.255/258/259/260/263) are complete on their own.
**Phase boundary:** the shell, the two-layer authz model, shared admin components, and the three console screens that are pure M15 (config, roles, audit). Domain consoles (rulebook, sources, editorial, moderation…) are Phases 4–7 — they INHERIT this phase's outputs. **Deliberately deferred to later phases:** `/admin/home` (CAP-391/399/407–412) — it composes `moderationCases`, `legalIntake`, `dripBatches`, `resources`, counters and interventions, i.e. data that does not exist until Phases 4–7 land; it is sequenced with the cross-cutting completion phase (audit Part D's Phase 7 cluster), not skipped. `/admin/support`, `/admin/wiki`, `/admin/readiness` are Wave-7B surfaces the audit's Part D also places outside Phase 3 (wiki needs CAP-418's staff content; readiness needs the CAP-509/510 machine = Phase 7).

---

## SLICE-P3-01 — Two-layer admin authz foundation (assertAdminPermission + widget-route resolution + next-request revoke)
- **CAP-IDs covered:** CAP-390, CAP-392, CAP-430
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-admin-shell-FINAL.md` (§1 two-layer model, §2 Entities, §3 States A/C/D, §4)
- **Depends on:** SLICE-P1-01a (roleAssignments schema + role enum), SLICE-P1-05 (getFlag — fail-closed flag resolution)
- **Scope:** Implement `assertAdminPermission` as ONE shared library output (`convex/lib/authz.ts`) encoding the two-layer model: broad shell entry (any staff role) + narrow per-action authority left to each screen's own Actor column — explicitly NOT duplicated per-console. Implement CAP-392 widget-route resolution (registered+permitted → render; hidden/unregistered → FEATURE_DISABLED/NOT_FOUND; flag false → fail-closed) and CAP-430 next-request revoke enforcement. This slice's output is the dependency every later admin slice (this phase AND Phases 4–7) cites.
- **Files touched (expected):** `convex/lib/authz.ts` (assertAdminPermission + resolveWidgetRoute); `convex/admin/shell.ts` (widget-catalog filtered read)
- **Acceptance criteria:** Shell contract §1 (quoted): "**Shell entry = any staff role (broadest gate). Individual screen/action authority = each screen's own per-CAP actor column (narrow gate), unchanged by the broadening.**" CAP-392 Notes (quoted): "Source-controlled executable catalog; DB metadata only; hidden route → FEATURE_DISABLED/NOT_FOUND." CAP-430 Notes (quoted): "Admin revoke → enforcement on NEXT server request." State A (quoted): "a support_operator sees only support widgets; an Editor sees only editorial ones" — catalog read filtered by `requiredPermissionKeys[]`. Route resolution fail-closed per shell §1: "`featureFlagKey` resolution fail-closed (M1 `getFlag`)." Verified narrow-gate spot-checks from §1 must hold: `/admin/config` (CAP-396 Administrator; CAP-397/398 Founder/Admin), `/admin/roles` assignment (CAP-413 Founder-only), `/admin/audit` (CAP-421/422 Administrator).
- **Size check:** ≤2 days — one authz module + one resolver + enforcement tests; the two-layer model is one library, not per-console work (that is the point).

## SLICE-P3-02 — Admin shell chrome + A11 command palette
- **CAP-IDs covered:** CAP-390 (UI surface)
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-admin-shell-FINAL.md` (§1 chrome list, §3 States E/F, §6)
- **Depends on:** SLICE-P3-01 (entry/route resolution), SLICE-P3-03 (a seeded catalog to render)
- **Scope:** Build the §12.4 admin layout + constant chrome — env badge · role · search · command palette · alert count · operational-mode indicator · Wiki · profile — plus the A11 Command palette component (archetype gap; CAP-390 explicitly lists one; §11 defines none). Palette states per contract §3 F: closed / open / authorized-results / no-match / unauthorized-excluded / back-door-genome-excluded (`/admin/personas/genome` must never appear as a normal result).
- **Files touched (expected):** `app/admin/layout.tsx` + chrome components; `components/admin/CommandPalette.tsx` (A11)
- **Acceptance criteria:** CAP-390 Notes chrome list (quoted): "Constant chrome: env badge, role, search, command palette, alert count, operational-mode indicator, Wiki, profile." States F (quoted): "closed / open / authorized-results / no-match / unauthorized-excluded / back-door-genome-excluded." Shell §1 (quoted): "`/admin/personas/genome` remains intentional back-door — must not become a normal command-palette result." Palette results drawn only from `adminWidgets` reads; no mutation is named for search/palette (navigation only, §4).
- **Size check:** ≤2 days, palette is the risk item — A11 is a from-scratch component (no §11 pattern). Chrome itself is §12.4 layout + pills/badges. Flagged: if palette keyboard/fuzzy scope creeps past a day, split palette into its own follow-on; v1 = widget-catalog navigation only (contract names no other query surface — OQ4 explicitly leaves scope unspecified).

## SLICE-P3-03 — adminWidgets catalog + deploy seeder (F-21 closure)
- **CAP-IDs covered:** CAP-569 (M15 — the F-21 seeder row, **added to the register 2026-08-29 during Phase 3 slice decomposition**; register 568→569)
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-admin-shell-FINAL.md` (§2 ⚠️ note + OQ3) · register CAP-536 (the precedent row) · CAP-419 `wiki.deploySync` (named analogous mechanism)
- **Depends on:** SLICE-P1-08 (seed/bootstrap deploy pattern), SLICE-P1-01a
- **Scope:** Define `adminWidgets` in `convex/schema.ts` (bible l.255 — 14 fields, complete bullet). Implement the deploy-time seeder per CAP-569: source-controlled executable catalog (code) synced into DB metadata, run once at deploy like CAP-536 ("Runs once at deploy/migration, not user-triggered"). Seed initial rows for THIS phase's three consoles only (`/admin/config`, `/admin/roles`, `/admin/audit`) with their real permission keys — the catalog grows per-phase as later consoles land (same discipline as eventCatalog).
- **Files touched (expected):** `convex/schema.ts` (adminWidgets region); `convex/admin/widgetsCatalog.ts` (source-controlled catalog + seeder); register row addition (spec-sync in same PR)
- **Acceptance criteria:** Shell contract §1 (quoted): "Widget catalog: source-controlled executable catalog; `adminWidgets` holds **DB metadata only**; hidden/unregistered route → **FEATURE_DISABLED / NOT_FOUND** (never resolve on URL knowledge)." CAP-536 precedent shape (quoted Notes): "Without this, /admin/rulebook renders empty at first launch. Runs once at deploy/migration, not user-triggered" — same hole class F-21 names for the shell: "admin shell renders an empty widget catalog at first deploy." CAP-569 Notes (quoted): "Mirrors CAP-536: the source-controlled executable catalog is authoritative; `adminWidgets` holds DB metadata only (CAP-390/392); runs once at deploy/migration, not user-triggered." **Addendum catch, resolved in-slice:** `dataSourceKey` has no enumerated literals in the corpus — this slice defines literals ONLY for the three Phase-3 consoles' actual queries; a platform-wide enum is NOT invented. If any Phase-3 console's widget metadata proves under-specified beyond that, stop and report per the addendum.
- **Size check:** ≤2 days — one 14-field table, one idempotent seeder, three rows. (CAP-569's register row already landed 2026-08-29; this slice implements it — no spec-sync work remains in the PR.)

## SLICE-P3-04 — A1 Data Table (design-system component, F-24 primary)
- **CAP-IDs covered:** none directly (design-system substrate; consumed by CAP-394/421/413 consoles this phase and ~13 screens per F-24)
- **Source contract(s):** N/A — infra-only, no contract (source: AUDIT-FINAL F-24: "17 genuine STYLE-KIT archetype gaps (A1–A13 + banner, datetime picker, combobox, legal-prose/empty-state) — A1 Data Table alone hits ~13 screens"; consumers' Components Used sections: config §6 "A1 data table (namespace listing — gap)", roles §6 "A1 data table (assignments; ops-coverage matrix)", audit §6 "A1 Data table … archetype gap")
- **Depends on:** none — foundational (buildable in parallel with P3-01/02/03)
- **Scope:** Build the shared A1 Data Table component on the shadcn/ui base: typed columns, per-column filter/sort, cursor-based pagination wired to Convex paginated queries, row-level action slots, loading skeleton + error + empty states, mobile-responsive collapse per §12.2. v1 fence (no cited consumer demands more): no virtualization, no column reorder, no inline cell editing.
- **Files touched (expected):** `components/ui/data-table/` (+ storybook-style demo route or fixture page)
- **Acceptance criteria:** F-24 impact line (quoted): "every admin slice hand-rolls its own table/queue; visual + behavioral divergence" — the acceptance is the inverse: the three Phase-3 consoles (SLICE-P3-07/09/10/11) render ON this component with zero per-console table code. Consumers' needs, each quoted from their contracts: dense namespace listing (config), assignment + matrix views (roles), "Dense data table (append-only audit)" (audit) — includes masked-value rendering hooks (audit §6: "masked-value rendering"). Pagination follows the Convex cursor contract (`.paginate()` + `usePaginatedQuery`), not offset paging.
- **Size check:** ≤2 days for the fenced v1 — real component work, but shadcn-base + fixed scope keeps it there; the fence exists precisely so later phases don't pay for speculative features.

## SLICE-P3-05 — A12 Queue/case board (design-system component, F-24)
- **CAP-IDs covered:** none directly (substrate; consumed by moderation, editorial, persona queues — Phases 4/5/7 — per F-24 "~5 screens")
- **Source contract(s):** N/A — infra-only, no contract (source: AUDIT-FINAL F-24; consumer shape from the register's established polymorphic case model — CAP-330 ordering, per the E-mod-2 resolution)
- **Depends on:** none — foundational; demo fixtures stand in until Phase 4+ queues exist
- **Scope:** Build the shared A12 queue/case board: column/group views over a case-ordered dataset, case cards with status pills, select-and-act row actions (approve/reject/escalate slots), ordering by the consuming queue's key (moderationCases age-priority at Phase 7; editorial/persona queues at Phases 4–5). Empty/locked/loading column states.
- **Files touched (expected):** `components/ui/queue-board/` (+ fixture demo)
- **Acceptance criteria:** F-24 (quoted): the gap class means "every admin slice hand-rolls its own table/queue" — acceptance is that no Phase 4–7 queue console builds its own board. Component contract: renders any dataset exposing the case-card interface (id, title, status, age, target-link); actions dispatched via slots, never hard-coded per queue; supports the register's polymorphic case pattern (one board, many `targetType`s — the CAP-127/135/154/268/318/324 + CAP-101/103/114 model) without per-type forks.
- **Size check:** ≤2 days — one board component + card interface; queues' business rules stay with their owning phases.

## SLICE-P3-06 — Banner primitive + datetime/scheduler picker (F-24 minor items)
- **CAP-IDs covered:** none directly (substrate; ~3 screens each per F-24)
- **Source contract(s):** N/A — infra-only, no contract (source: AUDIT-FINAL F-24; banner's named consumers: cmp contract §6, BetaBanner slot E1, admin operational-mode chrome; datetime's: Phase 4–5 scheduling flows — CAP-173/175-class schedule actions)
- **Depends on:** none — foundational
- **Scope:** Two small independent primitives (separable PRs if needed): (1) persistent Banner component — cmp contract §6 (quoted): "**ARCHETYPE GAP: §11 has no persistent banner component** (modals/sheets/toast ≠ banner)" — variants for persistent/awareness/operational-mode use, dismissible-when-allowed; (2) datetime/scheduler picker — timezone-aware (IANA, per the M1 users.timezone posture), min/max fences, for the scheduling surfaces Phases 4–5 consume.
- **Files touched (expected):** `components/ui/banner.tsx`; `components/ui/datetime-picker/`
- **Acceptance criteria:** Banner: renders above content without displacing the CMP slot order (CAP-025 chain unchanged); serves the BetaBanner stub (SLICE-P2-06) and the shell's operational-mode indicator states (shell §3 E: "normal / degraded / STOP-active") without either consumer hand-rolling chrome. Datetime: emits IANA-safe timestamps; keyboard-navigable; degrades to native input on mobile per §12.2 posture. Both: no consumer-specific logic inside — slots/config only.
- **Size check:** ≤2 days comfortably — two small well-bounded components.

## SLICE-P3-07 — /admin/config: typed namespace forms + CAS update
- **CAP-IDs covered:** CAP-394, CAP-395
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-admin-config-FINAL.md` (§1–§4; States A/B)
- **Depends on:** SLICE-P3-01 (shell entry), SLICE-P3-04 (A1 table), SLICE-P1-05 (registry validation core), SLICE-P1-06 (audit writer)
- **Scope:** Build `/admin/config` read + edit: namespace listing on A1, registry-driven typed forms (valueType/min/max/enumValues/editTier/blastRadius/failDirection), `config.casUpdate` flow with version-conflict state, tier gating (reason required tier2/3, Tier-3 typed confirm modal). Sealed keys absent from the editor by construction. **Read set = `configKeyRegistry` + `systemConfig` only** (contract §2). **Do not read `policyReasonCodes`.** That table does not exist until **P7E-10**; the Legal copy section (CAP-358/429) is **P7E-10's additive UI on this same route**, not a Phase 3 panel. Contract States J panels (Store · Feature Flags · Content-Pipeline · Persona-Tuning · Trust & Signals non-sealed · Trust-&-Safety Timers · Platform/Jobs) contain no reason-code list. Do **not** Depends-on P7E-10 (later-phase). Until P7E-10 lands, this screen has no Legal/reason-codes section — honest absence, not an empty query.
- **Files touched (expected):** `app/admin/config/page.tsx`; `convex/config.ts` (getNamespace/casUpdate — validators from P1-05)
- **Acceptance criteria:** CAP-394 Notes (quoted): "Sealed keys (legitimacy.medianTarget, signal.eventWeights, signal.attributionSplit, trust.weightCap) absent from editor." CAP-395 Notes (quoted): "CAS on version; reason required for tier2/3; blastRadius mandatory; Tier3 typed confirm; sealed keys not editable." Actor stays Administrator (quoted, two-layer verification): "Actor remains Administrator — E2's shell broadening does not admit Editor/support to this screen." Audit fail-closed (contract §3 I, quoted): "privileged write fails if auditLog cannot persist." CAS conflict surfaces inline error (§6).
- **Size check:** ≤2 days — the validation core is P1-05's; this slice is forms + conflict UX on top.

## SLICE-P3-08 — /admin/config: STOP surface, kill-switches, signup.mode setter, mirror rollback
- **CAP-IDs covered:** CAP-396, CAP-397, CAP-398, CAP-431, CAP-460, CAP-480
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-admin-config-FINAL.md` (States D–H; §4 Actions rows 3–7)
- **Depends on:** SLICE-P3-07 (same screen, config mutation base), SLICE-P3-06 (banner — operational-mode chrome), SLICE-P2-01 (`launchReadinessResults` table exists)
- **Scope:** Implement the four high-authority mutations + their UI states: `kill.flip` (failDirection honored), `stop.activate`/`stop.resume` (incident lifecycle, never auto-resume, recovery check), `config.signupMode.set` (E5 fail-closed readiness gate), PostHog mirror disable. Operational-mode chrome reflects STOP-active. **CAP-431** is the **gate-fail path of CAP-398** (not a second mutation): STOP resume is **blocked until `recoveryCheckKey` passes** (quoted AC-18). A passing resume still writes via 398; a failing key is 431. **CAP-429** (Founder policy-copy version bump) is **not this slice** — `policyReasonCodes` is born in **P7E-10**; putting 429 here would be a later-phase schema dependency.
- **Files touched (expected):** `convex/admin/stop.ts`, `convex/admin/signupMode.ts`; config page sections
- **Acceptance criteria:** CAP-396 (quoted): "failDirection honored (closed/open_forbidden/degrade/n_a)." CAP-397 (quoted): "Creates owned incident; expectedDurationMin required; never auto-resumes; handoffDueAt escalates backup/Founder." CAP-398 (quoted): "Separate mutation; recoveryCheckKey must pass." CAP-431 Notes (quoted): "STOP resume blocked until recoveryCheckKey passes." CAP-480/E5 (quoted): "setting `open` requires the CAP-510 readiness gate to pass **synchronously inside this mutation** — setter and gate are now one transaction; `waitlist`/`closed` are always settable (fail-open for closing down, fail-closed for opening up)." Pre-Phase-7 semantics (derived, same as P2-01's): readiness machine absent → `launchReadinessResults` unevaluated → `open` rejected fail-closed — which is exactly the E5 posture and DEC-M18-READINESS's intent. CAP-460 (quoted): "rawEvents keep capturing; hide dash."
- **Size check:** ≤2 days, full — four mutations, but each is thin over P1-05/06 helpers; the STOP incident lifecycle is the meatiest piece and it is one small state machine.

## SLICE-P3-09 — /admin/roles: RBAC assignment + UI revoke + Second-Founder gate
- **CAP-IDs covered:** CAP-008, CAP-413, CAP-564
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-admin-roles-FINAL.md` (§1, States A/B/G, §4)
- **Depends on:** SLICE-P3-01 (shell entry + CAP-430 revoke enforcement to test against), SLICE-P3-04 (A1)
- **Scope:** Build `/admin/roles` assignment surface: Founder-only `roles.assign`, administrator/Founder `roles.revoke` with last-Founder/Administrator guardrail and founder-keys-CLI-only boundary, and the Second-Founder flow (CAP-008: env-scoped `founder_bootstrap_completed` key via the config path, gated on TESTED `/admin` + Tier-3 typed flip). CAP-007/009 CLI rows stay out of scope (no UI by design).
- **Files touched (expected):** `app/admin/roles/page.tsx`; `convex/admin/roles.ts` (roles.assign/roles.revoke)
- **Acceptance criteria:** CAP-413 (quoted): "Founder-only." CAP-564 Notes (quoted): "Must reject revoking the last active Founder/Administrator (guardrail)" and "Administrator may revoke staff roles but NOT founder keys (Founder = administrator + founder-only permission keys — those keys are CLI-only per CAP-007/009)." Contract §1 (quoted): "Founder may revoke Administrator-assigned roles." CAP-008 contract §1 (quoted): "requires **TESTED /admin + Tier-3 flip**; persisted **env-scoped `founder_bootstrap_completed` (preview ≠ production)**" — preview completion must not satisfy production (CAP-023). Revoke enforcement verified end-to-end: next server request after `roles.revoke` loses authority (CAP-430 via P3-01). **Fenced:** CAP-008's mutation is unnamed (contract OQ2) — implemented as a systemConfig key write through the Tier-3 config path; exact CLI choreography stays open.
- **Size check:** ≤2 days — two mutations + one gated key flip on an A1 table; the guardrail is one query.

## SLICE-P3-10 — /admin/roles: ops-coverage slots, single-person ack, escalation
- **CAP-IDs covered:** CAP-414, CAP-415, CAP-416, CAP-417
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-admin-roles-FINAL.md` (States C–F, §2 Entities, §4 rows 2/3/6/7)
- **Depends on:** SLICE-P3-09 (same screen, roles base), SLICE-P3-04 (A1 matrix view)
- **Scope:** Build the ops-coverage matrix on the roles screen: 11-slot upsert (`opsAssignments.upsert`), single-person acknowledgement (`opsCoverage.ack`), System vacant-slot alert writes (CAP-414) surfaced as launch-readiness blockers, and after-hours escalation writes (CAP-417). Three entities defined from complete bible bullets (l.258/259/263).
- **Files touched (expected):** `convex/admin/opsCoverage.ts`; roles page matrix section
- **Acceptance criteria:** CAP-416 Notes (quoted slot enum): "slot ∈ editor_primary/backup, publisher_primary/backup, persona_publisher, moderator_primary/backup, after_hours_escalation, store_operator_primary, support_owner, support_channel." CAP-414 Notes (quoted): "Launch gate: opsAssignments green OR single-person ack" + "UI: launch readiness blocked." CAP-415 Notes (quoted): "Required before beta if only one human per critical slot." CAP-417 (quoted): after_hours_escalation slot → `operationalIncidents` + auditLog. Slot states per bible l.258 (quoted): "{filled|single_person_acknowledged|vacant|inactive_assignee}."
- **Size check:** ≤2 days — one upsert, one ack, two System writers, one matrix UI.

## SLICE-P3-11 — /admin/audit: query + export + Founder spot-check
- **CAP-IDs covered:** CAP-421, CAP-422, CAP-357
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-admin-audit-FINAL.md` (§1–§6)
- **Depends on:** SLICE-P3-01 (shell entry), SLICE-P3-04 (A1 — explicitly its archetype consumer), SLICE-P1-06 (auditLog schema + writer)
- **Scope:** Build `/admin/audit`: filtered query (actor/action/target/time/env/correlation) on A1 with pagination, export as an audited action (fail-closed on its own audit write), and the Founder monthly spot-check record. Never-delete invariant enforced; masked-value rendering hooks.
- **Files touched (expected):** `app/admin/audit/page.tsx`; `convex/admin/audit.ts` (audit.query / audit.export)
- **Acceptance criteria:** CAP-421 Notes (quoted): "Never delete auditLog (cold archive OK)." CAP-422 Notes (quoted): "Export itself audited" — contract §3 B (quoted): "**the export itself is audited** (Writes: 'auditLog (read), auditLog'); **export must fail-closed if the export-audit write fails.**" CAP-357 Notes (quoted): "no dual-control theatre." Erasure interplay (contract §2, quoted): "Erased values never retained in `auditLog.prev`." **Fenced:** export format/destination/row-limit (contract OQ2 — unspecified; v1 = server-generated file behind a confirm modal, flagged open), CAP-357's Writes-column oddity (OQ1 — spot-check logs itself; taken as intentional, verbatim flag preserved).
- **Size check:** ≤2 days — one paginated query, one audited export action, one tiny Founder-only write.

---

## Dependency graph (within Phase 3)

Ordered list; items on the same line are parallelizable after their dependencies land.

1. **SLICE-P3-01** (authz foundation) — first; every admin slice below depends on it. **Carried forward: every Phase 4–7 admin-console slice cites SLICE-P3-01 as its authz dependency** (shell entry + per-action layer), plus SLICE-P3-03 for registering its own widget route.
2. **SLICE-P3-04, SLICE-P3-05, SLICE-P3-06** (design-system components) — parallel, no backend deps; buildable alongside 01
3. **SLICE-P3-03** (widgets catalog + seeder) — after P1-08; parallel with the component slices
4. **SLICE-P3-02** (shell chrome + A11 palette) — after 01 + 03 (needs a seeded catalog to render)
5. **SLICE-P3-07** (config forms) — after 01 + 04 + P1-05/06
6. **SLICE-P3-08** (STOP/kill/signup.mode/mirror) — after 07 + 06
7. **SLICE-P3-09** (RBAC + revoke) — after 01 + 04
8. **SLICE-P3-10** (ops coverage) — after 09
9. **SLICE-P3-11** (audit viewer) — after 01 + 04 + P1-06; parallel with 07–10

**Phase exit gate (audit Part D, quoted):** "staff-role user sees permission-filtered catalog; revoke enforced next request; one console renders on the shared table." Concretely: a support_operator login sees only permitted widgets (03+02); `roles.revoke` → authority gone on the next request (09 exercising 01); `/admin/audit` renders on A1 with zero bespoke table code (11 exercising 04).
