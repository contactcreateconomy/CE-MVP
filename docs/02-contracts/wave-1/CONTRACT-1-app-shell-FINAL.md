# CONTRACT-1-app-shell-FINAL

**Screen:** App Shell / Providers — `(root layout)`
**Wave:** 1 (M1 Foundation)
**Template archetype:** App-shell layout (STYLE-KIT §12.1 / §10)
**Primary CAP-IDs:** CAP-025, CAP-026, CAP-028
**Actor:** System
**Reconciliation:** All three panels aligned on the spine. Two evidence-resolved points (Actions framing, BetaBanner-as-state) and one clean GPT+GLM majority (nav chrome) — see RECONCILIATION-1 §1.

---

## 1. Route & Access
- **Path:** root layout wrapping the entire customer route tree; not independently addressable, no dynamic params.
- **Auth state required:** none — the shell serves all auth states (anonymous + member). CAP-025/026/028 are all `Gated by: none`.
- **Provider mount order is the contract (CAP-025, Source Rule §10 Customer Frontend / FATAL-M1C-01):**
  `ConvexAuthNextjsServerProvider` → `ConvexAuthNextjsProvider` → `ErrorBoundary` → CMP slot (M18) → `BetaBanner` → children.
- **Error containment (CAP-026, FATAL-M1C-03):** `ErrorBoundary` sits **above** the CMP slot.
- **Routing constraint (not a redirect):** legal routes (`/privacy`, `/dmca`, `/terms`) render **outside the ConsentProvider subtree** (CAP-027 — see CONTRACT-1-legal-pages).
- **PostHog is never mounted in root** (data-model FATAL-M1C-01; analytics injection is consent-gated by M18 CAP-504).
- **Redirect rules:** governed by the Platform-Wide Routing Convention below (added 2026-08-26, closing OPEN-DECISIONS E3/X1 per AUDIT-FINAL F-15).

### Platform-Wide Routing Convention *(2026-08-26 — resolves OPEN-DECISIONS E3/X1; AUDIT-FINAL F-15)*

This is not a new capability. It makes explicit the client-routing convention that CAP-001/002/003/005/030's existing behavior (Wave 1) and the Wave-7B shell model already imply. Every Wave 1–7 contract references THIS block rather than restating it.

1. **Anonymous user hits any protected/authed route → redirect to `/signin`.**
2. **Authenticated user with `bootstrapState=pending_context` hits ANY route other than `/welcome` → redirect to `/welcome`** — they cannot proceed until bootstrap completes, per CAP-003/CAP-005's write-gate.
3. **Authenticated user with `bootstrapState=complete` hits `/signin`, `/waitlist`, or `/welcome` → redirect to `/feed`** — there is nothing for them on entry surfaces, per CAP-001 Notes "Existing users bypass."
4. **Any write attempted by a non-complete user is rejected server-side regardless of client routing** — CAP-005's guard is the actual enforcement; client routing is UX convenience, not the security boundary.

*Scope note: this convention governs auth/bootstrap state only. It does not decide M7 profile-completion routing (`/setup`), staff-authz failure responses on `/admin/*` (403 vs redirect — per-screen), or post-action success destinations.*

## 2. Entities
- CAP-025: Reads **none** · Writes **none**
- CAP-026: Reads **none** · Writes **none**
- CAP-028: Reads **none** · Writes **none**
- *Non-normative (kept so the diff shows it wasn't dropped):* the mounted CMP slot reads/writes `consentRecords`, but that is CAP-504/505/506 (M18, Wave 7), not this screen's capability.

## 3. States
1. **Normal mount** — full provider chain live; children render beneath `BetaBanner` (CAP-025).
2. **Render-error caught** — `ErrorBoundary` fallback fires; because it sits above the CMP slot, a downstream (CMP) crash is contained (CAP-026). Fallback UI is unspecified (Open Questions).
3. **CMP runtime-crash / degrade** — a **designed degrade, not a bug:** app stays up, analytics denied, legal pages still reachable (CAP-028, exact register language).
4. **Soft-beta chrome present** — `BetaBanner` is mounted in the CAP-025 chain. ⚠️ Included as a condition, not a governed state: no CAP defines its visibility/dismissal (Open Questions + ESCALATION E1).

## 4. Actions → API
**None (no user-facing API actions).** CAP-025/026/028 are System-actor mount / error / degrade behaviors and carry **no Source-Rule mutation or query name.** For traceability, the system behaviors are:
- App load → mounts the CAP-025 provider hierarchy.
- Render failure → `ErrorBoundary` intercepts an app-tree error (CAP-026).
- CMP runtime failure → falls back to app-up / analytics-denied / legal-up operation (CAP-028).

## 5. Analytics Events
**None identified at shell level.** The shell emits no product event and mounts no vendor provider. PostHog is never injected in root and stays behind the CMP consent grant (M18 CAP-504); analytics default-deny until grant. Any product event emitted by a child route must be captured same-mutation and catalog-registered under M16 CAP-436/CAP-437 — this does not create a shell-specific event.

## 6. Components Used
- **App-shell layout** — STYLE-KIT §12.1 Desktop App Layout (56px fixed header; left sidebar 240px / 64px collapsed; right sidebar 320px) + §12.2 Mobile App Layout (48px header; 64px bottom tab bar). §10 logo system (Mark 24px in header, §11.4).
- **Navigation chrome (§11.4):** Top Header, Left Sidebar, Right Sidebar, Bottom Tab Bar (Nav Item states Default / Hover / Active). *Available to the archetype; whether they render on every child route or only post-auth is unspecified (Open Questions).*
- **Archetype gaps — flagged, not invented (all three panels agree):**
  - No **ErrorBoundary fallback** component exists in §11.
  - No **CMP slot / consent-banner** component exists in §11 (the CMP surface is assigned to CAP-504–506, Wave 7).
  - No **BetaBanner** component exists in §11.

## 7. Open Questions
1. **BetaBanner is ungoverned** — wired into the CAP-025 provider chain, but no CAP owns its content, copy, visibility rule, dismissibility, or the `systemConfig` key that toggles beta. `signup.mode` (CAP-480) exists but is not a beta switch. → **ESCALATION E1.**
2. **Wave-1 CMP slot placeholder** — CAP-025 mounts a "CMP slot (M18)," but the CMP itself (CAP-504–506) is Wave 7. What the slot renders before Wave 7 ships (nothing vs. placeholder) is undefined. → **ESCALATION E2.**
3. **ErrorBoundary fallback UI** for CAP-026 is specified nowhere (register silent; §11 has no pattern) — retry behavior and whether route-level vs provider-init errors differ are undefined.
4. **Nav-chrome scope** — no source rule states whether Top Header / Left+Right Sidebar / Bottom Tab Bar render on every child route or only on authenticated app routes.
5. **Analytics-denied client status** after a CMP crash (CAP-028) — the client-visible status and any recovery/retry mechanism are undefined.
6. **Legal-route shell inheritance** — CAP-027 says only "legal outside ConsentProvider"; whether legal routes inherit app chrome or a standalone layout is unspecified (cross-listed with CONTRACT-1-legal-pages Q).
