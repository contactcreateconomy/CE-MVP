---
# Consent Management (CMP)

**Route:** global overlay — no route (mounts in the App Shell's reserved slot)
**Status:** NOT STARTED (no CMP overlay component exists in the app tree; P2-06 reserved the slot with CAP-504 default-deny)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-cmp-FINAL.md
**Slice(s):** P7T-13 (consent.record / consent.withdraw — CAP-504/505/506; back-fills bible `consentRecords` from M18-reliability.md l.74)

## Layout

```
provider stack (CAP-025 order, verified): 
  ConvexAuthNextjsServerProvider → ConvexAuthNextjsProvider →
  ErrorBoundary → [ CMP slot (M18) ] → BetaBanner → children
  (CAP-026: ErrorBoundary ABOVE the CMP slot — FATAL-M1C-03)

┌─ A. Banner (pre-choice) ────────────────────────────────────┐
│  persistent banner, stacked above BetaBanner in the slot     │
│  strictly_necessary always on — non-negotiable (FATAL-M18-02)│
│  [Button: save]  [open preferences]                          │
└──────────────────────────────────────────────────────────────┘
┌─ B. Preferences (Modal/Sheet, focus-trapped) ───────────────┐
│  four-purpose toggle set:                                    │
│    strictly_necessary  [toggle — DISABLED, non-negotiable]   │
│    functional          [toggle]                              │
│    analytics           [toggle — PostHog injection gate]     │
│    marketing           [toggle]                              │
│  [Button: save]  [Button: withdraw]                          │
│  E. degrade state (CMP crashes → app stays up; analytics    │
│     denied; legal still up) → Error                          │
└──────────────────────────────────────────────────────────────┘
```

## Components required

- Banner primitive → apps/forum/src/components/ui/banner.tsx (contract flags "§11 has no persistent banner component" as an archetype gap — the library file exists but has zero production usage; do not silently treat the gap as closed)
- §11.7 Modal/Sheet (preferences) → apps/forum/src/components/ui/dialog.tsx
- §11.2 Inputs (purpose toggles; required-purpose disabled control for strictly_necessary) → apps/forum/src/components/ui/toggle-switch.tsx (nearest toggle primitive; §11.2 base is input.tsx)
- §11.1 Button (save/withdraw) → apps/forum/src/components/ui/button.tsx
- §11.8 Error (degrade state) → MISSING: error component (§11.8) does not exist in the library (nearest stand-in: banner.tsx)
- focus-management/keyboard-trap for the preferences dialog → provided by dialog.tsx (verify — contract names it as a requirement, no separate component exists)

## States required

*(Enum-backed set. GPT's ~60 transient states — each purpose granted/withdrawn, each vendor-delete sub-step — folded, since the 4 consent purposes + grant/withdraw + crash-degrade are authoritative.)*

**A. Banner (pre-choice):** initial; strictly_necessary always on and **non-negotiable** (FATAL-M18-02 — includes server rawEvents).
**B. Preferences (granular):** four-purpose toggle set (strictly_necessary · functional · analytics · marketing).
**C. Granted (per purpose):** analytics grant is the **PostHog injection precondition** — not injected until grant.
**D. Withdrawn (CAP-506):** **stops future capture**; rawEvents NOT consent-gated (continue); **vendor delete path** initiated.
**E. Crash-degrade (CAP-028 — designed degrade, not bug):** CMP crashes → **app stays up; analytics denied; legal still up**. Client-visible status + recovery/retry mechanism **undefined** (Wave-1 open question, still open).
**F. Consentless analytics state:** strictly-necessary-only operation (PostHog absent; rawEvents server capture unaffected).
**G. Anonymous→member reconciliation:** anonymous consent persistence key + stitch to `users` at signup (CAP-387 anonymousSessionId join) — uncovered (Open Question).

## Component library maturity note

⚠️ banner.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ dialog.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ input.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): button.tsx. (toggle-switch.tsx is in neither the zero-production nor production-proven list — no warning attached.)
