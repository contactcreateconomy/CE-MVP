---
# UTM Builder

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** `getDictionary` previously accepted any staff role via a misleadingly-named `requireAnyAdmin` helper — narrowed to `administrator`, matching the contract.


**Route:** `/admin/utm`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Route drift:** none — E-route CLOSED 2026-08-26: CAP-479's trigger was renamed from `/admin/utm-builder` to `/admin/utm`, matching the inventory (inventory wins). Note the residual actor drift: CAP-479 Actor = Founder/Admin vs inventory "administrator" (contract OQ#3).
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-utm-FINAL.md
**Slice(s):** P7O-06 (dictionary + generator — CAP-566 / CAP-479; CAP-464/465 landing capture consumed, not rebuilt)

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area (generator layout via shell).

```
┌─ 48px §12.4 header (shell chrome) ────────────────────────────┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ admin nav       │ ┌─ generator form (read-only, no persist) ─┐ │
│                 │ │ Text Input: base URL                     │ │
│                 │ │   (states: empty / valid / already-      │ │
│                 │ │   contains-UTMs)                         │ │
│                 │ │ Select: utm_source  (allowedSources[])   │ │
│                 │ │ Select: utm_medium  (allowedMediums[])   │ │
│                 │ │ campaign/content per declared formats;   │ │
│                 │ │ maxLen 80 enforced                        │ │
│                 │ │ [Button: generate] → generated URL       │ │
│                 │ │ (read-only) + copy affordance            │ │
│                 │ └─────────────────────────────────────────┘ │
│                 │ ┌─ dictionary seed/edit (CAP-566) ────────┐  │
│                 │ │ seed/edit allowedSources/allowedMediums/│  │
│                 │ │ campaign+content formats (versioned)    │  │
│                 │ └─────────────────────────────────────────┘  │
│                 │ empty dictionary → disabled dropdowns +     │
│                 │ guidance copy (not an error)                │
│                 │ load state: Skeleton                        │
└─────────────────┴───────────────────────────────────────────────┘
```

## Components required

- §11.2 Select (utm source/medium/campaign dropdowns) → apps/forum/src/components/ui/select.tsx
- Text Input (base URL; generated URL read-only) → apps/forum/src/components/ui/input.tsx
- §11.1 Button (generate/copy) → apps/forum/src/components/ui/button.tsx
- copy-to-clipboard → MISSING: copy-to-clipboard component does not exist in the library (no §11 pattern — contract flag; client action, no server API)
- feedback surface (toast/inline) — unspecified per contract; toast.tsx is available → apps/forum/src/components/ui/toast.tsx (available-not-prescribed per the Wave-1 Toast resolution)
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- §12.4 generator layout via shell

## States required

*(Enum-backed set. GPT's ~40 transient states — each field selected/unselected, each URL sub-step — folded, since the dictionary-loaded / generate / invalid states are authoritative.)*

**A. Dictionary-loaded:** dropdowns constrained to `allowedSources`/`allowedMediums`; campaign/content per declared formats; generated link respects **maxLen 80**.
**B. ~~Empty/unseeded dictionary — behavior undefined (E1).~~ Seeded dictionary (CAP-566) — the pre-fix empty state is no longer reachable at first launch; an explicitly empty dictionary remains an admin-configuration choice, rendered as disabled dropdowns + guidance copy, not an error.**
**C. Generated link:** output render; **copy affordance + feedback surface unspecified** (available-not-prescribed per the Wave-1 Toast resolution — Open Question).
**D. Over-length/invalid combination + arbitrary-param attempt** — rejected by the controlled selector; exact rejection UI unspecified.
**E. Base-URL states:** empty / valid / already-contains-UTMs (replace vs reject unspecified).

## Component library maturity note

⚠️ select.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ input.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): button.tsx, toast.tsx.
