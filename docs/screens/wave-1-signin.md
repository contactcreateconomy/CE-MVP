# Sign In (magic link)

**Route:** `/signin`
**Status:** LIVE — `apps/forum/src/app/(auth)/signin/page.tsx` (SLICE-P2-04). All 9 contract states implemented (open-email, code-entry, waitlist, closed, existing-user bypass via routing convention, 3 rate-limit states, generic error). Full logo (§10.2) now used per remediation below.
**Remediation (2026-09-18 screen audit):** The waitlist-mode branch (§3 State 2) was a stub — `joinWaitlist()` only did `console.log(email)` and moved to the magic-link code-entry copy ("Code sent to... enter the 6-digit code"), so an anonymous visitor in waitlist-mode never actually joined `waitlistEntries` and saw the wrong confirmation copy. Wired to the same `waitlist.join` publicMutation the dedicated `/waitlist` screen calls (CAP-014/015), with its own joined/already-joined/rate-limited/error states and copy. Logo swapped from the Mark to the Full logo component (§10.2 explicitly lists "auth" as a Full-logo usage; only the Mark existed before this audit).
**Contract:** PRD/02-contracts/wave-1/CONTRACT-1-signin-FINAL.md
**Slice(s):** SLICE-P2-04 (screen + magic-link flow + rate gates; the admission backend it renders is SLICE-P2-01)

## Layout

Derived from contract §6 (Components Used) + the inventory's "Auth card (420px)" archetype only:

```
┌──────────────────────────────────────┐
│ Auth card container (420px max, §4.3)│
│  Full logo (§10.2 — "auth" usage)    │
│  Text Input — sign-in identifier     │
│    (states Default/Hover/Focused/    │
│     Error/Disabled, §11.8)           │
│  Button Primary — request magic link │
│    (incl. Loading spinner + Disabled)│
└──────────────────────────────────────┘
```

Page-level placement (centering, surrounding chrome, shell inheritance) is not specified in the contract. Feedback surface (toast vs inline input error) is **unresolved by the register** — both are available, neither prescribed (contract §6).

## Components required

- Auth card container (§4.3, 420px max — composed from primitives; §11 has no dedicated Auth Card) → `PRD/app/apps/forum/src/components/ui/card.tsx`
- Text Input (§11.2, sign-in identifier) → `PRD/app/apps/forum/src/components/ui/input.tsx`
  - ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- Button Primary incl. Loading/Disabled (§11.1) → `PRD/app/apps/forum/src/components/ui/button.tsx`
- Feedback surfaces (register-silent, both available): Toast (§11.7) → `PRD/app/apps/forum/src/components/ui/toast.tsx`; inline error via the input's Error state (§11.8)
- MISSING: Full logo does not exist in the library — the library has only `createconomy-logo-mark.tsx` (the Mark); no full-logo/wordmark lockup component. STYLE-KIT §10.2 requires the Full logo on auth surfaces.
- Reusable pieces exist in `PRD/app/packages/auth-ui/` (login-form, signup-form, auth-modal) but are modal machinery, not the spec'd `/signin` route — reuse is possible, equivalence is not established.

## States required

(Copied verbatim from CONTRACT-1-signin-FINAL.md §3)

1. **Open mode / new identity** — magic-link request form active; new identity proceeds to bootstrap (CAP-001 → CAP-002).
2. **Waitlist mode** — email capture only; writes `waitlistEntries` only, no user/role (CAP-001; CAP-478 "no L08 signup_completed").
3. **Closed mode** — new identity rejected (CAP-001; also the effective mode when readiness fails while `signup.mode=open`).
4. **Existing-user sign-in** — bypasses admission in any mode (CAP-001).
5. **Waitlist-invited conversion** — invited identity converts via the identical Auth admission path (CAP-030).
6. **Magic-link requested** — post-submit confirmation (flow-implied; register specifies no copy).
7. **Rate-limited — IP path** — 5 / 15m per `ip_hash` (CAP-016).
8. **Rate-limited — email path** — 3 / 1h per `email_hash` (CAP-017).
9. **Rate-limited — finalize** — `auth.finalize` 10 / 1h per user (CAP-018).

*Not locked as canonical states (register has no error contract): request-loading / request-accepted copy, invalid/expired/already-used magic link, provider/auth-service failure. → Open Questions.*

## Component library maturity note

- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- button, card, toast are production-proven — no warning.
- createconomy-logo-mark.tsx is outside both lists — no warning supplied by the live-status map (but note the Full-logo gap above).
