# Persona Genome Config (back-door)

**Route:** `/admin/personas/genome`
**Status:** NOT STARTED
**Contract:** PRD/02-contracts/wave-5/CONTRACT-5-personas-genome-FINAL.md
**Slice(s):** P5-12

## Layout

From contract §6 Components Used: **§12.4 Admin Console Layout** (§7.4 motion: fade-in only) — **no normal nav item must be created for this back-door route** (intentional back-door, direct-URL access; obscurity is not the security control — Administrator authorization still required). Select/Radio bounded enums; constrained array inputs; Text Input/Textarea bounded textual fields; Slider only where canonical bounds exist; Button Primary (save, run preview fixture) + Secondary/Ghost; Modal (edit confirm) + Toast; Skeleton; A1 Data table for `personaGenomeEdits` history. Inventory Template archetype: "Admin config (intentional back-door)". The three config modes come from contract §3 States A.

```
+------------------+---------------------------------------------------+
| (admin sidebar,  |  DENSE CONTENT (§12.4) — NO nav item for this     |
|  §12.4 — this    |  back-door route (direct-URL only)                |
|  route absent    |                                                   |
|  from it)        |  CONFIG MODES (contract States A, three):         |
|                  |   1. Tune genome template (scope=template;        |
|                  |      affects all instances compiled from it)      |
|                  |   2. Override instance (scope=instance)           |
|                  |   3. Hand-craft persona genome (seam with        |
|                  |      CAP-159 hand-craft birth)                    |
|                  |                                                   |
|                  |  GENOME EDITORS                                   |
|                  |   Select/Radio — bounded enums: analyticalLens,   |
|                  |     humorLevel {none|dry|light|sharp},            |
|                  |     sarcasmLevel {none|mild|pointed}, register,   |
|                  |     verbosity, scope (never free text for         |
|                  |     humor/sarcasm)                                |
|                  |   Constrained array inputs — rankedValues[3],     |
|                  |     signatureMoves[≤2], abstentionTopics[]       |
|                  |   Text Input/Textarea — bounded textual fields    |
|                  |                                                   |
|                  |  [ Save (Primary) ] [ Run preview fixture         |
|                  |    (Primary, CAP-548) ] [ Secondary/Ghost ]       |
|                  |   Modal: edit confirm · Toast feedback            |
|                  |                                                   |
|                  |  personaGenomeEdits HISTORY — A1 data table       |
|                  |  (append-only, field-level oldValue/newValue;     |
|                  |  rollback to prior version via CAP-546 — also     |
|                  |  fires CAP-547 invalidation)                      |
+------------------+---------------------------------------------------+
```

## Components required

- §11.2 Select / Radio (bounded enums: `analyticalLens`, `humorLevel`, `sarcasmLevel`, `register`, `verbosity`, `scope`) → apps/forum/src/components/ui/select.tsx (note: no radio component exists in the library — select or dropdown-menu covers the enumerated choice; flagged, not invented)
- Constrained array inputs (`rankedValues[3]`, `signatureMoves[≤2]`, `abstentionTopics[]`) → apps/forum/src/components/ui/combobox.tsx (nearest multi-entry primitive) + apps/forum/src/components/ui/input.tsx
- §11.2 Text Input / Textarea (bounded textual fields) → apps/forum/src/components/ui/input.tsx; MISSING: no textarea component exists in the library
- Slider only where canonical bounds exist → MISSING: Slider — no slider component exists in the library
- §11.1 Button Primary (save, run preview fixture) + Secondary/Ghost → apps/forum/src/components/ui/button.tsx
- §11.7 Modal (edit confirm) + Toast → apps/forum/src/components/ui/dialog.tsx + apps/forum/src/components/ui/toast.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- A1 data table (`personaGenomeEdits` history) → apps/forum/src/components/ui/data-table/index.tsx
- MISSING: Genome Editor / trait-vector editor, template-vs-instance inheritance viewer, version-diff, preview-fixture render surface (`previewFixtureRef` exists; its viewer is unpatterned), rollback component — contract §6 states none exist in §11

## States required

*(Copied VERBATIM from CONTRACT-5-personas-genome-FINAL §3.)*

*(Config modes + edit-safety below. GPT enumerated each of the ~20 genome fields as its own edit-state plus each humor/sarcasm enum value (~55); folded — the substantive contract is the three config modes + the versioned/preview-fixtured safety invariant.)*

**A. Config modes (CAP-178, three):**
1. **Tune genome template** (`scope=template`; affects all instances compiled from it).
2. **Override instance** (`scope=instance`; per-persona).
3. **Hand-craft persona genome** (seam with CAP-159's hand-craft birth branch — see `/admin/personas` OQ-3).

**B. Edit-safety states:**
1. Every edit **versioned** (`genomeVersion`) + **preview-fixtured** (`previewFixtureRef`) + written to `personaGenomeEdits` + `auditLog`.
2. Humor/sarcasm are **bounded enum inputs, never free-text executable** (M8 confluence; register note verbatim). Over-limit inputs (e.g. `signatureMoves[>2]`, `rankedValues≠3`) rejected by field constraints.
3. **Audit-write-fail → fail-closed** — a privileged change must not persist unaudited (CAP-426 pattern).

**C. Downstream-activation state — CLOSED (E-F / E-G, 2026-08-24):**
- Genome edit (CAP-178) or rollback (CAP-546) **must** fire **CAP-547**, which discards the CAP-158 `(in-memory compiled prompt)` and persisted `personas.systemPrompt` so the next generate recompiles. A `scope=template` edit invalidates every instance compiled from that template. *(In-flight drafts remain insulated — `personaCommentDrafts.genomeVersion` snapshots at generation.)*
- **Preview-fixture** is **CAP-548**: admin generates a preview output from draft/unsaved genome parameters before commit; writes `personaGenomeEdits.previewFixtureRef`. CAP-158 remains the System compile helper, not the admin preview action.

## Component library maturity note

- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ combobox has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- button, toast are production-proven (no warning).
