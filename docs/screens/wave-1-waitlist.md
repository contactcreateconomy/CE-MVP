# Waitlist Join

**Route:** `/waitlist`
**Status:** NOT STARTED (no route under `PRD/app/apps/forum/src/app/`)
**Contract:** PRD/02-contracts/wave-1/CONTRACT-1-waitlist-FINAL.md
**Slice(s):** SLICE-P2-05 (screen + `waitlist.join` publicMutation + CAP-015 gates)

## Layout

Derived from contract §6 (Components Used) + the inventory's "Form/auth card" archetype only:

```
┌──────────────────────────────────────┐
│ Form / auth card (420px max, §4.3 /  │
│   §12 form layout)                   │
│  Text Input — email (the only field  │
│    implied by the register, CAP-015  │
│    keys on email)                    │
│  Button Primary — submit             │
│    (incl. Loading state)             │
└──────────────────────────────────────┘
```

Page-level placement and any content beyond the card are not specified in the contract. No logo is listed in the contract's Components Used — do not invent one. Feedback surface (inline vs toast) is register-silent (contract §6, Open Question 7).

## Components required

- Form / auth card (§4.3, 420px max — composed from primitives; §11 defines no named Auth/Form Card) → `PRD/app/apps/forum/src/components/ui/card.tsx`
- Text Input, email (§11.2; states Default/Hover/Focused/Error/Disabled) → `PRD/app/apps/forum/src/components/ui/input.tsx`
  - ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- Button Primary, submit, incl. Loading state (§11.1) → `PRD/app/apps/forum/src/components/ui/button.tsx`
- Feedback surfaces (register-silent): inline error via the input's Error state (§11.8); Toast (§11.7) available but not prescribed → `PRD/app/apps/forum/src/components/ui/toast.tsx`

## States required

(Copied verbatim from CONTRACT-1-waitlist-FINAL.md §3)

1. **Form idle** — anonymous user can submit the join form; **email is the only field implied by the register** (CAP-015 keys on email). Anything beyond email is unspecified (Open Questions).
2. **Joined / success** — `waitlistEntries` row written (CAP-014); confirmation presentation unspecified.
3. **Rate-limited — IP** — 10 / h exceeded (CAP-015).
4. **Rate-limited — email** — 3 / 24h exceeded (CAP-015).

*Not locked as canonical states (register silent): field-focus/submitting micro-states, duplicate/existing-entry outcome, network/server failure. → Open Questions. Invited-later conversion is **not** rendered by `/waitlist` — it uses the ordinary Auth admission/bootstrap flow under CAP-030.*

## Component library maturity note

- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- button, card, toast are production-proven — no warning.
