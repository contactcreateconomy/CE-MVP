# SLICE CATALOG — BUILD PHASE 2: IDENTITY + ENTRY

**Date:** 2026-08-29 · **Phase order source:** AUDIT-FINAL.md Part D (corrected build order)
**Basis:** `CAPABILITY-REGISTER-MERGED.md` (572 rows) · `_data-model.md` (live state verified 2026-08-29) · M1/M18 module sheets · Wave-1 contracts (app-shell, signin, welcome, waitlist, legal-pages) · Wave-7 landing + cmp contracts · OPEN-DECISIONS.md (live state verified)
**Sizing-rule addendum applied:** every slice below was checked against "cited source bullet complete on its own" before sizing. Two incomplete-source catches found and handled **as work-orders, not as already-applied bible edits at catalog time:** (1) bible `launchReadinessResults` — **field list landed 2026-08-29** (this pass; transcribed from `M18-reliability.md` l.76 + §7 `overall` literals). Schema.ts remains Phase 5. (2) bible `utmDictionary` (l.286) enumerates fields but leaves "campaign/content formats" as a shape note — treated as implementation-local, flagged in-slice, not a blocker. P1-carried waitlistEntries/notifications bible lists **did** land in the 2026-08-29 P1 correction pass.
**Phase boundary:** admission + bootstrap + entry surfaces + routing convention + provider shells. No CMP consent machinery (CAP-504–506 = Phase 7), no readiness evaluation machine (CAP-509/510 = Phase 7), no admin surfaces.

---

## SLICE-P2-01 — Admission core: atomic bootstrap + effectiveSignupMode (+ launchReadinessResults schema)
- **CAP-IDs covered:** CAP-001, CAP-002
- **Source contract(s):** `contracts/wave-1/CONTRACT-1-signin-FINAL.md` (§1 admission branches, §2 Entities, §4 Actions) · `contracts/wave-1/CONTRACT-1-welcome-FINAL.md` (§2 CAP-002 txn facts)
- **Depends on:** SLICE-P1-01a (users/privateUserData/roleAssignments schema), SLICE-P1-05 (systemConfig + typed registry — `signup.mode` read), SLICE-P1-08 (seeded `signup.mode` default open)
- **Scope:** Implement `createOrUpdateUser`'s admission branch (CAP-001): the three-mode gate (open → proceed to CAP-002 txn; waitlist → `waitlistEntries` write only; closed → reject; existing users bypass) and the server-computed `effectiveSignupMode` (FATAL-M1A-02). Implement the CAP-002 atomic bootstrap txn (users row + empty privateUserData + default member role + `bootstrapState=pending_context` + `analyticsSubjectId` + `accountStanding=good` + `isStaff=false`). Define the `launchReadinessResults` table from the bible (field list transcribed 2026-08-29 from `M18-reliability.md` §6) — **schema + admission-time read only**; the CAP-509/510 evaluation machine is Phase 7.
- **Files touched (expected):** `convex/schema.ts` (launchReadinessResults region); `convex/auth.ts` (createOrUpdateUser/admission) — Phase 5. **Bible (landed 2026-08-29 — this is the actual application point):** `launchReadinessResults` + `deployLog` field lists from M18 §6; `overall` Core-enum from M18 §7.
- **Acceptance criteria:** FATAL-M1A-02 (quoted): "`effectiveSignupMode = readiness ? signup.mode : closed` server-side before member create." CAP-001 Notes (quoted): "3 modes: open→bootstrap, waitlist→waitlistEntries only, closed→reject. Existing users bypass." CAP-002 Notes (quoted): "Atomic txn; also sets bootstrapState=pending_context, analyticsSubjectId (crypto-random), accountStanding=good, isStaff=false, default member role" — partial-failure test: any component insert failing rolls back all three tables (FATAL-M1A-01/M1B-01). Pre-M18-machine semantics (derived, stated not invented): no `launchReadinessResults` row exists yet → readiness unevaluated → fail-closed to closed per the formula's explicit falsy branch; dev environments enable admission via a seeded dev-only passing row (fixture, not production behavior — production runs closed/waitlist until the Phase-7 machine exists, which is the correct pre-launch posture per DEC-M18-READINESS "server blocks `signup.mode=open` if GATE false").
- **Size check:** ≤2 days — one txn, one formula, one small table. The Phase-7 exclusions (readiness machine, CAP-480 setter coupling) keep it there.

## SLICE-P2-02 — finalizeBootstrap + /welcome screen (+ identityJoins schema, + signup eventCatalog row)
- **CAP-IDs covered:** CAP-003, CAP-004
- **Source contract(s):** `contracts/wave-1/CONTRACT-1-welcome-FINAL.md` (§1–§6 in full — states 1–6, actions, analytics)
- **Depends on:** SLICE-P2-01 (pending_context user exists), SLICE-P1-07 (rawEvents + same-mutation capture helper + CAP-437 catalog gate), SLICE-P1-01a
- **Scope:** Implement `finalizeBootstrap` (CAP-003): valid-IANA-timezone validation, write-once enforcement, member/private verification, `bootstrapState=complete` flip, `identityJoins` write (define the table — bible l.274 "anonymousSessionId → userId, joinedAt", complete). Build the `/welcome` chooser screen (Select §11.2; skip affordance = Button Ghost, required by the CAP-003 skip branch). Fire the CAP-004 signup `rawEvents` row same-mutation — which requires seeding the event's `eventCatalog` row now (CAP-437 rejects unknown events; eventName "signup" is stated by CAP-004 + welcome contract §5; minimal catalog row per the P1-07 schema, full M16 property schema deferred to Phase 7).
- **Files touched (expected):** `convex/schema.ts` (identityJoins region); `convex/bootstrap.ts` (finalizeBootstrap); `convex/welcome.tsx` + route; catalog seed row
- **Acceptance criteria:** CAP-003 Notes (quoted): "Timezone write-once; verifies member/private; skip chooser → stay pending." Contract states 4–6 are canonical (quoted headers): "Invalid timezone," "Guard failure," "Write-once conflict" — each rejects without side effects. CAP-004 (quoted): "`finalizeBootstrap` completes … rawEvents signup event; same-mutation" — finalize whose rawEvents insert fails rolls back (CAP-436 discipline). Vendor side explicitly absent: no PostHog call anywhere (FATAL-M1C-01; identify() is Phase-7 CMP machinery — signin contract §5: "`/welcome` does not implement this mechanism itself"). Completion routes to `/feed` per routing-convention rule 3 (tested in SLICE-P2-06).
- **Size check:** ≤2 days — one mutation, one screen, two tiny tables/rows. Known archetype stretch (no searchable-combobox in §11; full IANA list in a 300px Select) is a UI-polish risk, not a scope risk — flagged in contract §6, shipped as plain Select.

## SLICE-P2-03 — Protected-write guard: assertCustomerCapability (+ capabilityRestrictions schema)
- **CAP-IDs covered:** CAP-005, CAP-393
- **Source contract(s):** N/A — infra-only, no contract (source: register CAP-005 row + M1 sheet R-CUSTOMER-GUARD; `_data-model.md` l.265 "Shared authz (M15 confirm)")
- **Depends on:** SLICE-P1-01a/01b (users fields incl. accountStanding, postingEligibilityState), SLICE-P1-05 (getFlag — STOP/feature-flag precedence steps); `capabilityRestrictions` table defined **here** from bible l.243 (complete bullet: "userId, capabilityKey, reasonCode, caseId, startsAt, endsAt?, appealable") — empty at this phase; M13 writers are Phase 5
- **Scope:** Implement `assertCustomerCapability(ctx, capabilityKey)` in `convex/lib/authz.ts` per the M15 shared-authz contract: full precedence chain evaluated before any side effect. **CAP-005** is the M1 name; **CAP-393** is the M15 FATAL-M15-01 row with the applies-to registry (quoted: create_post/comment/react/report/submit_reference/manage_store/tag_product/tag_resource/revival_vote/resource_acquire) — **one helper, two register rows**. Define `capabilityRestrictions` (empty at this phase — M13 writes it later). Export the guard for every future protected mutation; wire it into `finalizeBootstrap`'s neighborhood as the first real consumer test surface.
- **Files touched (expected):** `convex/schema.ts` (capabilityRestrictions region); `convex/lib/authz.ts` (assertCustomerCapability)
- **Acceptance criteria:** CAP-005 Notes (quoted): "Precedence TERMINATED > SUSPENDED > restrictions > STOP > flag > eligibility. Missing standing → ACCOUNT_STANDING_UNKNOWN reject (fail-closed)." CAP-393 Notes (quoted): "assertCustomerCapability: TERMINATED > SUSPENDED > restrictions > STOP > flag > eligibility." Bible l.265 (quoted): "every protected customer write evaluates TERMINATED > SUSPENDED > capabilityRestrictions > STOP > feature flags > eligibility before any side effect." Phase-2 gate (audit Part D, quoted): "CAP-005 guard rejects incomplete users" — `pending_context` user's protected write rejected server-side independent of client routing (convention rule 4).
- **Size check:** ≤2 days comfortably — one guard function + one 7-field table + precedence tests.

## SLICE-P2-04 — /signin screen + magic-link flow + rate gates
- **CAP-IDs covered:** CAP-016, CAP-017, CAP-018 (+ CAP-001 branch UI; CAP-030 conversion entry)
- **Source contract(s):** `contracts/wave-1/CONTRACT-1-signin-FINAL.md` (§1–§6)
- **Depends on:** SLICE-P2-01 (admission branches), SLICE-P1-09 (auth.magic_link / auth.finalize rate literals), SLICE-P1-05 (signup.mode read)
- **Scope:** Build `/signin`: auth card (420px), magic-link request + `auth.finalize` redemption (Convex Auth built-ins — register names no mutation for the request), the three admission-mode render states + existing-user bypass, wired to the P1-09 rate gates. Post-finalize destinations follow the routing convention (pending_context → `/welcome`, complete → `/feed`).
- **Files touched (expected):** `convex/signin.tsx` + route; rate-limit wiring from `convex/lib/rateLimit.ts`
- **Acceptance criteria:** Contract states 1–9 canonical (quoted headers): open/new-identity, waitlist-mode (email capture only, no user/role), closed-mode reject, existing-user bypass, invited conversion, magic-link-requested, and the three rate-limited states (5/15m ip_hash · 3/1h email_hash · 10/1h finalize). CAP-478 exclusion honored: waitlist capture emits no L08 signup_completed. **Fenced (open, not guessed):** waitlist-mode submit mutation (contract OQ3 — "does it call `waitlist.join` (CAP-014 publicMutation) or a distinct mutation? Register gives the write target, not the call") — the form renders per state 2; its submit delegation awaits that one-line ruling (same class as F-14). Invalid/expired/already-used link error contracts are OQ6 — Convex Auth defaults ship, custom copy flagged open.
- **Size check:** ≤2 days — one screen, no new tables; the two fences subtract scope rather than add it.

## SLICE-P2-05 — /waitlist screen (waitlist.join + conversion representability)
- **CAP-IDs covered:** CAP-014, CAP-015, CAP-030
- **Source contract(s):** `contracts/wave-1/CONTRACT-1-waitlist-FINAL.md` (§1–§6)
- **Depends on:** SLICE-P1-02 (waitlistEntries schema — Phase 5; bible F-13 field list landed 2026-08-29 correction pass, which also resolves OPEN-DECISIONS X2), SLICE-P1-09 (waitlist.join literals: 10/h ip · 3/24h email), SLICE-P2-06 (authed-user redirect rule 3)
- **Scope:** Build `/waitlist`: anonymous auth card, email field, `waitlist.join` publicMutation wired to CAP-015 gates. Identity invariant enforced (no users/role writes — schema-level + test). CAP-030 conversion: the invited-user path re-uses the ordinary admission flow (representable via P1-02's status/invitedAt/converted fields); **invite-delivery mechanism fenced** (signin OQ4 — channel/token/landing undefined).
- **Files touched (expected):** `convex/waitlist.ts` (waitlist.join mutation) + route
- **Acceptance criteria:** CAP-014 Notes (quoted): "publicMutation; not a users row; no role." Contract §1 (quoted): "joining must **not** create a `users` row or role assignment." CAP-030 Notes (quoted): "Conversion uses SAME Auth admission + bootstrap path; not a parallel flow." Contract states 3–4 (quoted): "Rate-limited — IP — 10 / h exceeded," "Rate-limited — email — 3 / 24h exceeded." Duplicate-email behavior: constraint enforced by the P1-02 unique index; outcome UX remains contract OQ2 — flagged open, not guessed.
- **Size check:** ≤2 days comfortably — one publicMutation + one screen; waitlistEntries **bible** field list landed 2026-08-29 correction pass; schema.ts remains Phase 5.

## SLICE-P2-06 — App-shell provider chain + Platform-Wide Routing Convention + CMP reserved slot + BetaBanner stub
- **CAP-IDs covered:** CAP-025, CAP-026, CAP-028 (+ CAP-027's layout carve-out structure; convention = F-15 resolution)
- **Source contract(s):** `contracts/wave-1/CONTRACT-1-app-shell-FINAL.md` (§1 incl. the Platform-Wide Routing Convention, §2–§6) · `contracts/wave-7/CONTRACT-7-cmp-FINAL.md` (§1 — the E2 resolution declaration)
- **Depends on:** SLICE-P2-01/02 (bootstrapState exists to route on), SLICE-P1-01a
- **Scope:** Mount the CAP-025 provider chain in exact order; place ErrorBoundary ABOVE the CMP slot (FATAL-M1C-03); reserve the CMP slot with its interim behavior; stub BetaBanner's slot (mount point only). Implement the routing convention as one shared protected-route helper + middleware-free client guard (rules 1–3) with snapshot tests; rule 4 remains server-side CAP-005 (P2-03). Structure the legal route group outside the ConsentProvider subtree (layout carve-out; pages themselves = SLICE-P2-07).
- **Files touched (expected):** `app/layout.tsx` (provider chain); `app/(legal)/` route group shell; `lib/routing.ts` (convention helper) + tests
- **Acceptance criteria:** CAP-025 Notes (quoted): "ConvexAuthNextjsServerProvider → ConvexAuthNextjsProvider → ErrorBoundary → CMP slot (M18) → BetaBanner → children." Convention rules 1–3 (quoted): anonymous-on-protected → `/signin`; `pending_context` on ≠`/welcome` → `/welcome`; `complete` on `/signin`//`/waitlist`//`/welcome` → `/feed`. CAP-028 degrade (quoted): "App stays up; analytics denied; legal still up" — tested by forcing a slot crash. **CMP slot interim (E2):** the cmp contract declares "This build resolves Wave-1 OPEN-DECISIONS E2" — implemented as the reserved empty slot running the CAP-504 default-deny posture (no analytics request without consent; no consent UI exists yet), which is behaviorally identical to CAP-028's CMP-absent degrade. Noted: ledger row E2 still shows OPEN (audit F-05, unfixed by the applied batch) — the contract's declaration governs here; flag for the next doc-sync pass. **BetaBanner (E1, open):** slot + mount only; content/copy/toggle key ungoverned — stub renders nothing pending the E1 ruling.
- **Size check:** ≤2 days — provider chain + one helper + tests; the two ungoverned chrome pieces are stubs, which shrinks rather than grows scope.

## SLICE-P2-07 — Legal pages: route/shell/access (content rendering BLOCKED-pending-F-16)
- **CAP-IDs covered:** CAP-027 (+ CAP-028 dependency)
- **Source contract(s):** `contracts/wave-1/CONTRACT-1-legal-pages-FINAL.md` (§1–§6)
- **Depends on:** SLICE-P2-06 (legal route group outside ConsentProvider)
- **Scope:** Build the three legal routes (`/privacy`, `/dmca`, `/terms`) as one template: 720px reading column, Wordmark-only, outside ConsentProvider, with the `unavailable_pending_legal` + noindex pre-publish state and CAP-028 reachability under CMP failure. **F-16 fence (verified OPEN — OPEN-DECISIONS E6, l.18):** content source/publish/version model is unresolved (DB vs static, no `systemConfig` publish key exists anywhere); this slice ships the shell + pending state ONLY — the published-content render path is blocked-pending-F-16 and must not guess a storage model. `/terms` trigger coverage: built under the shared template per the contract; E5 (register trigger) remains open — flagged, not blocking, since the contract governs the screen.
- **Files touched (expected):** `app/(legal)/privacy|dmca|terms/page.tsx`; layout from P2-06
- **Acceptance criteria:** CAP-027 Notes (quoted): "Legal layout WITHOUT ConsentProvider; `unavailable_pending_legal` + noindex until M18 publish. Static fallback P1." Contract state 2 (quoted): "`unavailable_pending_legal` + noindex — pre-publish placeholder, served with noindex until M18 publish." CAP-028 (quoted): legal "remains reachable when the CMP has crashed." No content model is invented: the pending state is the only render path until F-16 lands (static-fallback precedence vs pending state is contract OQ3 — open, rides the F-16 resolution).
- **Size check:** ≤2 days comfortably — three thin routes + one state; the F-16 fence is what keeps it small.

## SLICE-P2-08 — Landing (anonymous): signup-mode branches + UTM capture (+ utmDictionary schema)
- **CAP-IDs covered:** CAP-464, CAP-465, CAP-478
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-landing-FINAL.md` (§1–§6)
- **Depends on:** SLICE-P2-01 (effectiveSignupMode), SLICE-P1-07 (rawEvents capture + referrer field), SLICE-P2-06 (providers mount under the CAP-025 tree)
- **Scope:** Build `/` anonymous: §12.3 landing layout (not app-shell chrome), the three-mode CTA set (single CTA, never dual — readiness-closed override state distinct from config-closed), Beta label, secondary/tertiary links. Implement CAP-465 `utm.capture`: dictionary validation, first-touch-once, canonical-URL strip, unknown → `utmValidated=false`. Define the `utmDictionary` table (bible l.286 — fields enumerated; "campaign/content formats" shape note is implementation-local, flagged). Empty-dictionary semantics are spec-correct pre-CAP-566 (Phase 7 seeds it): all UTMs record as unvalidated, which the contract requires anyway ("unknown UTMs recorded as unvalidated must not pollute validated attribution").
- **Files touched (expected):** `app/page.tsx` (anon branch); `convex/utm.ts` (capture); `convex/schema.ts` (utmDictionary region)
- **Acceptance criteria:** CAP-464 Notes (quoted): "Beta label · primary CTA Join public beta · secondary Explore free resources · tertiary Discussions." CAP-478 Notes (quoted): "open → email-verified account; waitlist → email capture only (no L08 signup_completed); closed → no capture. Single CTA set." CAP-465 Notes (quoted): "Validate vs dictionary; store first-touch once; emit M16 observational event; canonical URL strips UTMs; unknown → utmValidated=false" — `referrer` captured at first touch (the one non-backfillable field). **Fenced/noted:** waitlist-mode CTA submit delegation (F-14 — CAP-478 writes only `rawEvents`; delegation to CAP-014 unspecified; audit Part C #9's one-line amendment awaits ruling) — form renders, submit wiring fenced. CAP-478 Actor=member vs "Visitor" trigger (F-07) — built per the contract's documented intent (anonymous render; drift annotation at contract l.40); register row fix rides the F-07 doc-sync.
- **Size check:** ≤2 days — one layout, one capture mutation, one read-only table; the F-14 fence and Phase-7 dictionary seeding keep it under.

---

## Dependency graph (within Phase 2)

Ordered list; items on the same line are parallelizable after their dependencies land.

1. **SLICE-P2-01** (admission core) — after P1-01a/05/08; blocks 02, 04, 08
2. **SLICE-P2-03** (write guard) — parallel with 01 (needs only P1-01a/01b/05); blocks nothing in-phase (first consumer is convention rule 4's server side, tested alongside 06)
3. **SLICE-P2-02** (finalize + /welcome) — after 01 + P1-07
4. **SLICE-P2-06** (provider chain + routing convention) — after 01/02 (routes on bootstrapState); blocks 05 (rule-3 redirect), 07 (legal group), 08 (provider tree)
5. **SLICE-P2-04** (/signin), **SLICE-P2-05** (/waitlist) — after 01 + 06 (+ P1-09 / P1-02 respectively); mutually parallel
6. **SLICE-P2-07** (legal shells) — after 06; content path blocked-pending-F-16 regardless of code order
7. **SLICE-P2-08** (landing) — after 01 + 06 + P1-07; waitlist-CTA submit blocked-pending-F-14

**Phase exit gate (audit Part D, quoted):** "all three signup.mode values round-trip; bootstrap routing per the F-15 convention; CAP-005 guard rejects incomplete users." Plus: absorbed-entity discipline holds (no `takedownRequests`/`dmcaNotices`/`systemJobs` in code), no PostHog mounted anywhere — **those are Phase-5 code gates.** Bible: P1-carried waitlistEntries/notifications lists landed in the **2026-08-29 P1 correction pass**. P2-01 `launchReadinessResults` (+ same-line `deployLog`) bible back-fill landed **2026-08-29** (this pass). Schema.ts remains Phase 5.

---

## P2-AUTH-CUTOVER — Safety gate: founder-bootstrap BEFORE ADMIN_EMAILS removal (added 2026-09-04)

> **Not a buildable slice** — an acceptance gate on P2-04 and the auth cutover
> described in `00-project-status/00-TRANSITION.md`. No code ships here; this gate blocks the
> ADMIN_EMAILS removal until its conditions are met.

- **Problem:** The auth cutover (replacing password/OAuth + ADMIN_EMAILS with
  magic-link + roleAssignments) is described in `00-project-status/00-TRANSITION.md` but has no
  slice assignment and no ordering constraint. Without this gate, an agent could
  remove ADMIN_EMAILS before the founder's `roleAssignments` row exists,
  locking everyone out of the admin surface.

- **Gate conditions (all must be true before ADMIN_EMAILS is removed):**
  1. **Founder-bootstrap executed:** CAP-007 `grantFounder` (internal mutation,
     CLI) has been run at least once, creating an `administrator` role
     assignment for the founder's user.
  2. **Founder-bootstrap verified:** the founder can authenticate and reach an
     admin surface (even a stub `/admin` route) using ONLY `roleAssignments`
     authority — no `ADMIN_EMAILS`, no `memberships`, no `forumProfiles.role`.
  3. **Test coverage:** an automated test proves that `assertAdminPermission`
     (P3-01) authorizes the founder via `roleAssignments` alone.
  4. **Rollback path documented:** if the founder loses access post-cutover,
     the recovery procedure (re-add `ADMIN_EMAILS` env var + redeploy) is
     written in SETUP.md.

- **Sequencing within Phase 2:**
  - P2-01/02/03: Build canonical admission alongside legacy (ADMIN_EMAILS intact).
  - P2-04: Build `/signin` screen (ADMIN_EMAILS still intact — the grant lives
    in `convex/auth.ts`'s afterUser callback, untouched by P2-04's scope).
  - **THIS GATE:** P2-04 ships with a note in its acceptance that the auth
    cutover is BLOCKED until the four conditions above are met.
  - The actual cutover (remove ADMIN_EMAILS + swap providers to magic-link)
    is a separate deploy action, not a slice — performed manually after this
    gate closes.

- **Files affected:** `convex/auth.ts` (the cutover target — not modified by
  P2-04); `SETUP.md` (rollback procedure).
