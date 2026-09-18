# Qualification Thresholds & Rules

**Route:** `/admin/rulebook`
**Status:** NOT STARTED
**Contract:** PRD/02-contracts/wave-3/CONTRACT-3-rulebook-FINAL.md
**Slice(s):** P4-06 (schema + CAP-536 seed + this editor page); P4-07 (qualify orchestrator + live/replay write paths the Calibrate action triggers — backend wiring, no extra screen)

## Layout

From contract §6 Components Used: **§12.4 Admin Console Layout** (220px sidebar; dense content) + **§7.4 Admin console motion** ("Minimal — fade-in only, duration/fast"). Inventory Template archetype: "Admin config panel (STYLE-KIT §12.4)". Section labels below come from the contract's §3 "Seven threshold sections (per the §4 consolidation)".

```
+------------------+---------------------------------------------------+
| (220px sidebar)  |  DENSE CONTENT (§12.4)                            |
|                  |                                                   |
|  admin chrome    |  S1 Rule config core — rules list (A1 table)      |
|  (§12.4; no      |    ruleKey | ruleClass pill | severity pill |     |
|   screen-        |    enabled toggle | thresholdConfig input/slider  |
|   specific       |    | applicablePostTypes | versions |            |
|   navigation     |    updatedByUserId/updatedAt                     |
|   specified in   |                                                   |
|   the contract)  |  S3 H-QUOTE  S4 H-SIM  S5 H-DUP  S6 H-CAT        |
|                  |    (numeric threshold editors, each row with     |
|                  |     enabled/disabled sub-state)                  |
|                  |                                                   |
|                  |  S7 H-TYPE — per-type required-field list editor |
|                  |    (NOT a numeric slider; structural, E2)        |
|                  |                                                   |
|                  |  S2 List & calibrate core                        |
|                  |    [Run calibration replay] [Manage calibration  |
|                  |     set (calibrationExamples)]                   |
|                  |    threshold-drift view (no §11 chart primitive) |
|                  |                                                   |
|                  |  [Save] (Primary)      Toast feedback / inline   |
|                  |                         Error (both available,   |
|                  |                         unspecified — OQ4)       |
+------------------+---------------------------------------------------+
```

Thin-layout note: the contract names only the §12.4 frame + the component list above; it does not place S1–S7 into columns, tabs, or an accordion — that arrangement is unspecified and must not be invented silently.

## Components required

- A1 data table (dense, sortable, editable rule list) → apps/forum/src/components/ui/data-table/index.tsx
- §11.2 toggle/switch (per-rule `enabled`) → apps/forum/src/components/ui/toggle-switch.tsx
- §11.2 inputs (threshold values; Error state = out-of-bounds rejection surface) → apps/forum/src/components/ui/input.tsx
- MISSING: Slider — the contract lists "Text Input and/or Slider … both are defined primitives, flagged not decided"; no slider exists in the library
- §11.2 Select (`applicablePostTypes[]`, H-TYPE) → apps/forum/src/components/ui/select.tsx
- H-TYPE per-type required-field list editor (checkboxes/multi-select over required M4 fields) → apps/forum/src/components/ui/checkbox.tsx and apps/forum/src/components/ui/combobox.tsx are the closest composable primitives; the contract flags "No multi-select primitive" and "No checkbox-group primitive" in §11
- §11.5 pills (`ruleClass`/`severity` display) → apps/forum/src/components/ui/badge.tsx
- §11.9 skeleton (Text-line / Card variants, list load) → apps/forum/src/components/ui/skeleton.tsx
- §11.1 Primary/Secondary Button (save, run calibration) → apps/forum/src/components/ui/button.tsx
- §11.7 Toast (save success / out-of-bounds error) → apps/forum/src/components/ui/toast.tsx
- §11.3 Stats Card can carry a drift summary number → apps/forum/src/components/ui/card.tsx
- MISSING: Charts (A2) — the calibration threshold-drift visualization has no chart primitive; see PRD/04-design-system/DESIGN-SYSTEM-OPEN-ITEMS.md
- MISSING: Config Row / Rule Editor / Threshold Group typed-config component — contract §6 flags no such component in §11

## States required

*(Copied VERBATIM from CONTRACT-3-rulebook-FINAL §3.)*

*(Editor/config states only. Runtime rule-evaluation outcomes — exact-span match, category ties, per-post-type contract pass/fail, etc. — are NOT states of this screen; they occur in the Wave-4 `qualify` pipeline. See RECONCILIATION-3 §3.)*

**Panel-level:**
1. **Rules list** — `rulebook.listRules` renders `qualificationRules` rows: `ruleKey`, `ruleClass {hard|soft}`, `severity`, `enabled`, `thresholdConfig`, `applicablePostTypes[]`, versions, `updatedByUserId`/`updatedAt` (CAP-085 + data-model). **E3 RESOLVED (founder, 2026-08-23):** rows are guaranteed present — **CAP-536 seeds all 7 tunable `qualificationRules` rows with baked default threshold values at deploy time** (runs once at deploy/migration, not user-triggered); the empty-panel state is therefore unreachable by design, not merely unhandled.
2. **Rule edit** — two editable dimensions only: toggle `enabled`, tune `thresholdConfig` (CAP-084).
3. **Out-of-bounds rejection** — "Bounded ranges validated; out-of-bounds → reject; audited" (CAP-084, verbatim).
4. **Saved** — `qualificationRules` + `auditLog` written; **fails closed if audit cannot persist** (CAP-426).
5. **Admin-write rate-limited** — CAP-019: 60/1m per operator exceeded; staff not exempt.
6. **Calibrate / threshold-drift view** — `rulebook.calibrate` (internal) replays the labeled set, writing `qualificationRuleResults` **with `source=replay`** (a distinct logical stream from CAP-083's immutable `source=live` rows), to surface threshold drift (CAP-085). **E4 RESOLVED (founder, 2026-08-23):** the labeled set is now a modeled entity — `calibrationExamples` (candidateSnapshot + expectedOutcome per rule) — and its curation is on this screen (CAP-537).
6a. **Calibration-set management** *(new, E4)* — add/edit `calibrationExamples` rows: select a candidate snapshot, set the human-graded expectedOutcome label per rule (CAP-537, administrator, audited). Distinct from triggering the replay (item 6).
7. **Loading** — §11.9 skeletons (component-level; no screen-level loading contract in the register).

**Seven threshold sections (per the §4 consolidation):**
- **S1 — Rule config core (CAP-084):** generic over `qualificationRules`; not restricted to the five flagged rows (see rule-list-scope Open Question).
- **S2 — List & calibrate core (CAP-085 + CAP-537):** listing (no write) + calibrate replay (writes `qualificationRuleResults` `source=replay`); reads `qualificationRuns` for replay context; calibration-set curation (add/edit `calibrationExamples`, CAP-537) joins this section post-E4.
- **S3 — H-QUOTE caps (CAP-068):** three bounded caps — per-quote ≤ `maxQuoteWords`; ≤ `maxQuotesPerPost`; total ≤ `maxQuotedBodyPct`. (Exact-span equality + attribution are code-enforced behaviors, not thresholds.) Runtime edge: "exceeding cap → re-enters H-SIM."
- **S4 — H-SIM semantic threshold (CAP-070):** cosine threshold(s) — "thresholds from `qualificationRules`" (register verbatim). Runtime: `ctx.vectorSearch` cosine vs published posts, same category.
- **S5 — H-DUP threshold (CAP-071):** evaluated by both layers — "Semantic + surface over dup threshold vs recent window." Window size named nowhere (Open Questions).
- **S6 — H-CAT confidence (CAP-072):** failure condition verbatim — "No locked category (of 5) above confidence threshold AND no operator override." The override path is editorial-side, not this screen.
- **S7 — H-TYPE contract (CAP-074):** mapping verbatim — **News→source; Review→tool+verdict; Compare→2–4 tools; Debate→proposition; List→items; Showcase→metadata** — **completed (E2, 2026-08-23) for all 8 active types per CAP-186/§4: Help→problemStatement; Spark→statement (≤280 chars).** Reads `postTypeConfig` at runtime. **E2 RESOLVED (founder, 2026-08-23):** H-TYPE is **NOT a numeric threshold** like its siblings — it is a **structural contract** (per-type required-field list). Its editor treatment differs from H-QUOTE/H-SIM/H-DUP/H-CAT: a **per-type required-field list editor**, not a numeric slider (see §6).

Each S1/S3–S7 row also carries an **enabled / disabled** sub-state. Behavior of a *disabled hard* rule inside `qualify` is stated nowhere (Open Questions).

## Component library maturity note

- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ checkbox has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ combobox has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- button, card, toast are production-proven (no warning).
- toggle-switch.tsx is on neither the provided zero-production nor production-proven list — maturity unknown, not invented here.
