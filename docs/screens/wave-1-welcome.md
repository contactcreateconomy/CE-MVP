# Bootstrap Finalize (timezone chooser)

**Route:** `/welcome`
**Status:** NOT STARTED (no route under `PRD/app/apps/forum/src/app/`)
**Contract:** PRD/02-contracts/wave-1/CONTRACT-1-welcome-FINAL.md
**Slice(s):** SLICE-P2-02 (`finalizeBootstrap` + `/welcome` screen + identityJoins schema + signup eventCatalog row)

## Layout

Derived from contract §6 (Components Used) + the inventory's "Onboarding step / modal" archetype only:

```
Desktop: Modal (sm 420px, §11.7) — OR an auth-card-width step
         container (§4.3, 420px); archetype allows either.
┌─────────────────────────────────────┐
│  Select — IANA timezone choice      │
│   (dropdown max-height 300px,       │
│    scrollable; closest §11          │
│    component per contract)          │
│  [ Button Primary — finalize        │
│    (Loading) ]                      │
│  [ Button Ghost — skip affordance   │
│    (required by CAP-003 skip        │
│    branch; copy unspecified) ]      │
└─────────────────────────────────────┘
Mobile: Bottom Sheet (§11.7) as the modal replacement.
```

No further layout description is given in the contract (step indicator, ordering, header content are all unspecified — contract flags §11 has no Onboarding Step component).

## Components required

- Modal (sm 420px, §11.7) → `PRD/app/apps/forum/src/components/ui/dialog.tsx`
  - ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- Step container fallback (auth-card width, §4.3) → `PRD/app/apps/forum/src/components/ui/card.tsx`
- Select (§11.2; states Default/Hover/Focused/Error/Disabled/Loading per §11.8; dropdown max-height 300px scrollable) → `PRD/app/apps/forum/src/components/ui/select.tsx`
  - ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- Alternative the library offers despite the STYLE-KIT gap: `PRD/app/apps/forum/src/components/ui/combobox.tsx` (searchable) — the contract flags "no searchable-combobox / timezone-picker archetype exists in §11," and SLICE-P2-02 ships the plain Select; combobox is a library option, not a contract mandate.
  - ⚠️ combobox has zero production usage — expect possible integration friction, report don't silently patch.
- Button Primary (finalize; Loading) + Button Ghost (skip) (§11.1) → `PRD/app/apps/forum/src/components/ui/button.tsx`
- Spinner (§11.9) → no standalone spinner component in the library; the Loading state is carried by `ui/button.tsx`. MISSING: standalone Spinner does not exist in the library (skeleton.tsx is §11.9's skeleton, not a spinner).
- MISSING: Bottom Sheet does not exist in the library — `ui/dialog.tsx` covers the desktop modal; no mobile bottom-sheet primitive exists despite the contract requiring it as the mobile replacement.
- MISSING: Onboarding Step component / step indicator / timezone-chooser composite does not exist in the library (contract archetype gap — §11 defines none).

## States required

(Copied verbatim from CONTRACT-1-welcome-FINAL.md §3)

1. **Atomic bootstrap-created / pending_context** — one txn has created `users`, empty `privateUserData`, default active global member `roleAssignments`, `bootstrapState=pending_context`, `analyticsSubjectId`, `accountStanding=good`, `isStaff=false` (CAP-002). Timezone chooser shown.
2. **Timezone submitted → complete** — CAP-003 writes `users.timezone` (once), flips `bootstrapState=complete`, writes `identityJoins`; the CAP-004 signup `rawEvent` fires same-mutation.
3. **Chooser skipped → stays pending** — user remains `pending_context`; protected writes stay blocked (CAP-005) (CAP-003 "skip chooser → stay pending").
4. **Invalid timezone** — CAP-003 requires a **valid** IANA timezone → implies a validation gate / rejection state. *[GPT+GLM majority; Opus omitted — Opus kept states to the three explicit CAP-003 outcomes. Validation key undefined → Open Questions.]*
5. **Guard failure** — CAP-003 "verifies member/private"; submit rejected when member-role / `privateUserData` verification fails. *[GPT+GLM majority; Opus omitted. Client-facing failure undefined → Open Questions.]*
6. **Write-once conflict** — timezone already set (previously completed, or a support correction); re-submission rejected by write-once. *[GPT+GLM majority; Opus raised only as an open question. Grounded in CAP-003 + data-model write-once.]*

## Component library maturity note

- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ combobox has zero production usage — expect possible integration friction, report don't silently patch.
- button, card are production-proven — no warning.
