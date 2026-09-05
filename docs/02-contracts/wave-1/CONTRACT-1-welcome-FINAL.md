# CONTRACT-1-welcome-FINAL

**Screen:** Bootstrap Finalize (timezone chooser) — `/welcome`
**Wave:** 1 (M1 Foundation)
**Template archetype:** Onboarding step / modal
**Primary CAP-IDs:** CAP-002, CAP-003 (+ CAP-004 adjacent, Has-UI=NO)
**Actor:** member (authenticated, `bootstrapState=pending_context`)
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. Three States were clean **GPT+GLM majorities against Opus** (invalid-timezone, guard-failure, write-once-conflict) → adopted, Opus divergence explained. See RECONCILIATION-1 §4.

---

## 1. Route & Access
- **Path:** `/welcome`. **Dynamic params:** none. **Actor:** member.
- **Requires:** authenticated user with `bootstrapState=pending_context` (CAP-002 sets `pending_context` in the admission txn; CAP-003 `Gated by: CAP-002`, trigger "Authenticated pending_context user submits valid IANA timezone").
- **Entry condition:** reached immediately after `createOrUpdateUser` admits a new user in open mode and atomically creates bootstrap records (CAP-002).
- **Timezone is write-once** (CAP-003; data-model `users.timezone` "IANA, write-once; Admin+audit correction"). Corrections happen **off-screen** via support (CAP-024 / CAP-404 `support.timezone.fix`), never through this screen.
- **Skip behavior:** skipping the chooser leaves the user in `pending_context` (CAP-003).
- **Protected-write rule:** protected customer writes remain unavailable until bootstrap is `complete` (CAP-002/CAP-005). Pending users are effectively funneled here — **but the routing itself is owned by no CAP** (CAP-005 gates writes, not navigation). → ESCALATION E3.
- **Redirect rules (resolved 2026-08-26):** per the **Platform-Wide Routing Convention** (CONTRACT-1-app-shell §1) — unauthenticated visitors → `/signin` (rule 1); pending_context users force-routed here from any other route (rule 2); already-`complete` users → `/feed` (rule 3).

## 2. Entities
- **CAP-002** (upstream System txn — listed for flow fidelity): Reads **none** · Writes `users`, `privateUserData`, `roleAssignments`. Atomic; sets `bootstrapState=pending_context`, `analyticsSubjectId` (crypto-random), `accountStanding=good`, `isStaff=false`, default active global member role.
- **CAP-003:** Reads `users`, `roleAssignments`, `privateUserData` · Writes `users` (timezone, `bootstrapState=complete`), `identityJoins`.
- **CAP-004** (adjacent, Has-UI=NO — fires on this screen's completion): Reads `users` · Writes `rawEvents`.
- **Grounded entity facts:** `users.timezone` IANA write-once; `users.bootstrapState ∈ {pending_context, complete}`; `identityJoins` = anonymousSessionId → userId stitch (unique active per anonymousSessionId).

## 3. States
1. **Atomic bootstrap-created / pending_context** — one txn has created `users`, empty `privateUserData`, default active global member `roleAssignments`, `bootstrapState=pending_context`, `analyticsSubjectId`, `accountStanding=good`, `isStaff=false` (CAP-002). Timezone chooser shown.
2. **Timezone submitted → complete** — CAP-003 writes `users.timezone` (once), flips `bootstrapState=complete`, writes `identityJoins`; the CAP-004 signup `rawEvent` fires same-mutation.
3. **Chooser skipped → stays pending** — user remains `pending_context`; protected writes stay blocked (CAP-005) (CAP-003 "skip chooser → stay pending").
4. **Invalid timezone** — CAP-003 requires a **valid** IANA timezone → implies a validation gate / rejection state. *[GPT+GLM majority; Opus omitted — Opus kept states to the three explicit CAP-003 outcomes. Validation key undefined → Open Questions.]*
5. **Guard failure** — CAP-003 "verifies member/private"; submit rejected when member-role / `privateUserData` verification fails. *[GPT+GLM majority; Opus omitted. Client-facing failure undefined → Open Questions.]*
6. **Write-once conflict** — timezone already set (previously completed, or a support correction); re-submission rejected by write-once. *[GPT+GLM majority; Opus raised only as an open question. Grounded in CAP-003 + data-model write-once.]*

## 4. Actions → API
1. **Submit timezone → finalize bootstrap** — completion mutation is **`finalizeBootstrap`**, Source Rule **R-FINALIZE** (CAP-003). *Naming note: the CAP-003 row itself names no submit mutation; `finalizeBootstrap` is sourced from CAP-004's trigger ("`finalizeBootstrap` completes") and the data-model Bootstrap line.* Writes timezone once, marks `complete`, creates the identity join; verifies member + `privateUserData`.
2. **Create admitted user bootstrap records** — `createOrUpdateUser`, CAP-002, R-BOOTSTRAP-CORE. This is an **upstream auth-callback System action**, not a button on `/welcome`; it produces the state this screen renders.
3. **Record signup event** — same finalize flow, CAP-004 (no separate user action); writes `rawEvents` as part of completion.
4. **Skip chooser** — no mutation name specified; governing behavior = remain `pending_context` (CAP-003).

## 5. Analytics Events
- **Event: `signup`** — trigger `finalizeBootstrap` completes successfully (CAP-004), written to `rawEvents` **same-mutation**. This server-side write is `strictly_necessary` and fires **unconditionally, regardless of consent state** (FATAL-M18-02).
- **Key:** CAP-004 does not enumerate a key; M16 CAP-441 requires the opaque `users.analyticsSubjectId` for PostHog `identify` and prohibits PII as the vendor identity. The **vendor-side `identify()` call is gated behind CMP consent (FATAL-M18-02 / CAP-504):** if consent is not yet granted at finalize time, `identify()` is deferred/queued for replay once consent flips to granted, via the CMP/consent mechanism M18 owns (the slot App Shell reserves). `/welcome` does not implement this mechanism itself — it only defers to it.
- **L08:** `signup_completed` is the honest completion point of the funnel here (CAP-445 projection); open-mode produces it (CAP-478 confirms waitlist does not).
- **Capture integrity:** authoritative `rawEvents` persistence must accompany the triggering mutation — failure to persist fails the mutation (CAP-436); the event must be catalog-registered or it is rejected/quarantined (CAP-437).
- **Mirror:** CAP-442 (R-MIRROR) applies to any `rawEvents` with `posthogMirror=true` (best-effort, no rollback on failure).
- **No skip event and no invalid-timezone event** are identified.

## 6. Components Used
- **Onboarding step / modal archetype** — §11.7 Modal (sm 420px) for the modal form, or an auth-card-width step container (§4.3, 420px). **Bottom Sheet** (§11.7) as the mobile replacement.
- **Select** — §11.2, states per §11.8 (Default/Hover/Focused/Error/Disabled/Loading); dropdown max-height 300px, scrollable — the closest §11 component for choosing an IANA timezone.
- **Button Primary** (finalize; Loading) + **Button Ghost** (skip affordance — **required** by the CAP-003 skip branch; component/copy unspecified) — §11.1. **Spinner** — §11.9.
- **Archetype gaps (flagged):**
  - §11 defines Modal and Bottom Sheet but **no exact Onboarding Step component, step indicator, or timezone chooser.**
  - A full IANA list inside a 300px Select dropdown is a stretch; **no searchable-combobox / timezone-picker archetype exists** in §11 (Search Input exists; the combined pattern is undefined). *[GPT+GLM flagged; Opus lighter.]* → Open Questions.

## 7. Open Questions
1. ~~**Post-completion redirect** after `finalizeBootstrap` is not specified.~~ **→ CLOSED (2026-08-26, E3/X1): completion makes the user `complete`, so `/welcome` falls under rule 3 of the Platform-Wide Routing Convention (CONTRACT-1-app-shell §1) → `/feed`.**
2. ~~**Redirect for unauthenticated visitors** to `/welcome` is not specified.~~ **→ CLOSED (2026-08-26): rule 1 of the convention → `/signin`.**
3. ~~**Redirect for already-`complete` users** visiting `/welcome` is not specified.~~ **→ CLOSED (2026-08-26): rule 3 of the convention → `/feed`.**
4. **Timezone acquisition** — browser auto-detect prefill vs. manual search, the timezone-options query, default/detection, search behavior, validation key, and unavailable-options state are undefined.
5. **Skip semantics** — whether "skip" means closing the browser, a visible action, or both is undefined.
6. **Client-facing result** for missing `roleAssignments`, missing `privateUserData`, or an `identityJoins` uniqueness conflict is undefined.
7. **Event-catalog name/version/property schema** for the `signup` event (beyond CAP-004's description) is undefined.
8. **Skip-then-stranded recovery** — CAP-003 allows skipping, leaving the user in `pending_context` and blocked from protected writes indefinitely; **no CAP defines a re-prompt, reminder, or default-timezone fallback.** → ESCALATION E4.
9. **Pending↔complete routing ownership** — no CAP governs the client-side routing of a `pending_context` user to `/welcome` (and a `complete` user away). → ESCALATION E3.

---

## ADDENDUM 2026-09-04 — DECISIONS-LOCKED #2 (E4 resolved)

**The Skip path is REMOVED.** Timezone is auto-detected from browser/IP silently at
signup (no user action); default UTC only if detection fails; editable later in
Settings. `bootstrapState=pending_context` is **no longer reachable via skip** —
States 3 (chooser skipped) is retired; the re-prompt/recovery question (E4) is moot.
The timezone-chooser combobox remains for the confirm step and the Settings edit path.
