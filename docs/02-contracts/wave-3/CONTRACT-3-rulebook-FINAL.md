# CONTRACT-3-rulebook-FINAL

**Screen:** Qualification Thresholds & Rules — `/admin/rulebook`
**Wave:** 3 (M3 Content Qualification Rulebook — backend-heavy, minimal UI)
**Template archetype:** Admin config panel (STYLE-KIT §12.4)
**Primary CAP-IDs:** CAP-084, CAP-085, CAP-537 *(calibration-set management, added E4)* (+ consolidated threshold rows CAP-068, CAP-070, CAP-071, CAP-072, CAP-074 per inventory §4; CAP-536 seeds at deploy, no UI)
**Actor:** administrator
**Register basis:** 537-row register (Phase 3). Rulebook rows CAP-068/070/071/072/074 amended in place (Wave-3 E1/E2 stamps); CAP-083/085 annotated (E4); CAP-084/085 annotated (E5); new rows CAP-536 (E3 seed) and CAP-537 (E4 calibration-set management) land here.
**Reconciliation:** Route/Access, Entities, Actions, Analytics locked (all three aligned). States: GPT's runtime-evaluation sub-states dropped on register evidence (GLM+Opus majority upheld independently of Opus's vote). Six escalations — **all six resolved by founder 2026-08-23** (E4 calibration design resolved in a second pass the same day). See RECONCILIATION-3.

---

## 1. Route & Access
- **Path:** `/admin/rulebook`. **Dynamic params:** none. **Actor:** administrator (CAP-084).
- **Scope ruling (inventory §4, verbatim):** the 5 M3 rows (CAP-068, 070, 071, 072, 074) collapse into one "Qualification Thresholds" panel that sits with CAP-084/085 on this route. Zero net-new standalone screens beyond `/admin/rulebook`.
- **Auth:** CAP-084 `Gated by: none` at the row level. Admin-only enforcement is **inherited from the M15 `/admin` shell** — `assertAdminPermission` (CAP-390, R-SHELL) + route registry/authz (CAP-392, hidden route → FEATURE_DISABLED/NOT_FOUND). **E5 RESOLVED (founder, 2026-08-23):** minimal admin auth gate (basic role check) enforces administrator-only at Wave 3; the full M15 shell (CAP-390/392) wraps it at Wave 7. This minimal-gate-now/full-shell-later pattern was anticipated in Phase 2's screen-inventory sequencing notes on operator-console roll-out — it is the plan, not a gap.
- **Role-revocation:** an Admin whose role is revoked loses protected access on the **next server request** (CAP-430).
- **Adjacent write gates binding this screen's mutations:**
  - **CAP-019** (§8 Rate limits, admin.write) — **60 / 1m per operator; staff NOT rate-exempt** — applies to `rulebook.setRuleConfig`.
  - **CAP-426** (INV-M15-6) — a privileged write **fails closed if its `auditLog` record cannot persist** — binds `rulebook.setRuleConfig` (which writes `auditLog`).
- **Sealed-key exclusion (CAP-394):** this screen must not expose the four sealed economy keys — `legitimacy.medianTarget`, `signal.eventWeights`, `signal.attributionSplit`, `trust.weightCap`. **Confirmed clear (all three panels, independently):** the seven rulebook CAPs govern only `qualificationRules` (M3 qualification keys); this screen's only Writes are `qualificationRules`, `auditLog`, and `qualificationRuleResults` — it never writes `systemConfig`/`configKeyRegistry`, the namespace CAP-394/395 seal. Zero intersection.
- **Redirect rules:** none stated in the register (unauthorized response / missing-route behavior unspecified → Open Questions).

## 2. Entities

| CAP-ID | Reads (verbatim) | Writes (verbatim) | Execution site |
|---|---|---|---|
| **CAP-084** | `qualificationRules` | `qualificationRules`, `auditLog` | **This screen** |
| **CAP-085** | `qualificationRules`, `qualificationRuns`, `calibrationExamples`, `contentCandidates` | `none` (list) / `qualificationRuleResults` (`source=replay` — calibrate replay) — dual-branch, not collapsed to "none" | **This screen** |
| **CAP-537** *(new, E4)* | `calibrationExamples`, `contentCandidates` | `calibrationExamples`, `auditLog` | **This screen** |
| CAP-068 (H-QUOTE) | `contentCandidates`, `sourceClaims` | `qualificationRuleResults` | Runtime `qualify` (CAP-064, W4) — screen edits its threshold row only |
| CAP-070 (H-SIM semantic) | `contentEmbeddings`, `posts` | `similarityChecks`, `qualificationRuleResults` | Runtime (CAP-064) |
| CAP-071 (H-DUP) | `contentEmbeddings`, `posts` | `similarityChecks`, `qualificationRuleResults` | Runtime (CAP-064) |
| CAP-072 (H-CAT) | `categories`, `contentCandidates` | `qualificationRuleResults` | Runtime (CAP-064) |
| CAP-074 (H-TYPE) | `postTypeConfig`, `contentCandidates` | `qualificationRuleResults` | Runtime (CAP-064) |

- **The five H-rule evaluators contribute no writes on this screen.** They are `Has-UI=NO`, System-actor, `Gated by: CAP-064` runtime checks; their `similarityChecks`/`qualificationRuleResults` writes occur during the Wave-4 `qualify` path, not from the admin editor. Here they only supply the `ruleKey` + `thresholdConfig` shape being tuned.
- **Editable storage for all five threshold rows = `qualificationRules`.** Data-model fields: `ruleKey, ruleVersion, ruleClass {hard|soft}, severity, enabled, thresholdConfig (bounded), applicablePostTypes[], updatedByUserId, updatedAt` — "Admin toggles enabled + tunes thresholds; implementations are typed code." All edits flow through the single CAP-084 mutation; the five candidate rows expose **no mutation of their own**. **E1 RESOLVED (founder, 2026-08-23):** `configKeyRegistry` is the **authoritative bounds owner** (min/max/type per key, CAP-395 pattern — one validation mechanism platform-wide). `qualificationRules.thresholdConfig` is **deprecated as a bounds-owner**; it stores only the current **live values**. CAP-084's `setRuleConfig` validates proposed values against `configKeyRegistry` bounds before write (out-of-bounds → reject + audit).
- **Adjacent gates (not primary):** CAP-019 (Reads none / Writes none) · CAP-426 (Reads `auditLog` / Writes none, fail-closed) · CAP-390 (Reads `roleAssignments, adminWidgets` / Writes none) · CAP-394 (Reads `systemConfig, configKeyRegistry` / Writes none — exclusionary sealed-key filter).
- **Audit invariant:** every accepted config mutation writes `auditLog` (CAP-084); the write fails closed if audit cannot persist (CAP-426).

## 3. States
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

## 4. Actions → API
1. **List rules** — `rulebook.listRules` (CAP-085, §9 rulebook.listRules). Reads `qualificationRules`, `qualificationRuns`; writes none in the list branch.
2. **Enable/disable a rule · tune a threshold (H-QUOTE / H-SIM / H-DUP / H-CAT)** — `rulebook.setRuleConfig` (CAP-084, §9 rulebook.setRuleConfig / §11). Single mutation writing the target rule's `enabled` and/or `thresholdConfig`; bounded-range validated **against `configKeyRegistry` (E1 resolution — authoritative bounds owner)**; writes `auditLog`. H-TYPE edits go through the same mutation but target `applicablePostTypes[]` + the per-type required-field list (structural, E2) — not numeric bounds.
3. **Run calibration replay** — `rulebook.calibrate` (CAP-085, §9 rulebook.calibrate). Internal action; replays `contentCandidates` snapshots from `calibrationExamples` against candidate rule configurations, writing `qualificationRuleResults` with **`source=replay`** — segregated from CAP-083's immutable `source=live` stream by the source discriminator (E4 resolution). **Invocation (E4, 2026-08-23):** Actor remains System (the replay execution); the admin action on this screen triggers it — intentional, not a mismatch: admin initiates, system executes and writes. The browser-invocable wrapper is the screen's client action calling the internal function.
4. **Attempt to edit a sealed economy key** — no action permitted; CAP-394 requires the four keys to be absent from the editor and never forwarded to `setRuleConfig`.
5. **Manage the calibration labeled set** *(new, E4)* — add/edit `calibrationExamples` (candidate snapshot + expectedOutcome label per rule; audited). **CAP-537** — distinct action from triggering calibrate: this curates the set the replay runs against.

**The five threshold capabilities contribute zero mutations and zero queries** — they are System-actor evaluations inside the CAP-064 `qualify` orchestrator (Wave 4); this screen only edits the `qualificationRules` rows they read thresholds from.

## 5. Analytics Events
**None identified** within M16 (CAP-436–463). No M16 row references the rulebook, `qualificationRules`, or config edits; no `rawEvents` write appears in any of the seven capabilities' Writes lists. Accountability runs through **`auditLog`** (CAP-084 Writes) — the M13/M15 audit spine, not an M16 analytics event; CAP-436's same-mutation capture rule therefore does not attach. If a rulebook interaction is ever registered as an observational event, it must use an active `eventCatalog` entry, pass `assertCatalogEvent` (CAP-437), and satisfy CAP-444's capture-mode + consent gates.

## 6. Components Used
- **§12.4 Admin Console Layout** (220px sidebar; dense content) + **§7.4 Admin console motion** ("Minimal — fade-in only, duration/fast").
- **§11.2 Toggle / Switch** (44×24px; track-on = `brand/primary`) — per-rule `enabled`; §11.8 states Default/Hover/Active(on)/Disabled.
- **§11.2 Text Input and/or Slider** for threshold values — **register names no control type; both are defined primitives, flagged not decided.** Text Input **Error** state (border feedback/error, message below) is the defined surface for the CAP-084 out-of-bounds rejection (bounds sourced from `configKeyRegistry`, E1).
- **§11.2 Select** — `applicablePostTypes[]` (H-TYPE); §11.5 Pill for `ruleClass`/`severity` display.
- **H-TYPE distinct editor type (E2, 2026-08-23):** H-TYPE does **not** use the Text Input/Slider threshold control — it is a **per-type required-field list editor** (checkboxes/multi-select over the required M4 fields per `post.type`, sourced from `postTypeConfig`; 8 active types now all mapped). A §11 checkbox-group primitive is itself an archetype gap (see below).
- **§11.9 Skeleton** (Text-line / Card variants) for list load.
- **§11.1 Primary/Secondary Button** (save, run calibration) + **§11.7 Toast** (save success / out-of-bounds error) — *feedback surface (inline Error vs Toast) unspecified by the register; both listed available.*
- **Archetype gaps — flag, not invent (all three panels):**
  - **A1 Data table** (dense, sortable, editable rule list) — §12.4 mentions "tables" but §11 defines **no table component**. Inventory §3 A1's needed-by list omits `/admin/rulebook` though this is exactly the A1 need → the list should be amended.
  - **No multi-select primitive** for `applicablePostTypes[]` — §11.2 Select is single-select.
  - **No checkbox-group primitive** for the H-TYPE per-type required-field list editor (E2 resolution) — §11 defines no multi-check control.
  - **A2 Charts / data-viz** — the calibration threshold-drift visualization has no §11 chart primitive (Stats Card §11.3 can carry a drift summary number, not a chart).
  - **No Config Row / Rule Editor / Threshold Group** typed-config component in §11.

## 7. Open Questions
*(Non-blocking detail gaps. All six Wave-3 escalations (E1–E6) resolved by founder 2026-08-23; E4 calibration design closed in a second pass — see RECONCILIATION-3.)*
1. **Rule-list scope** — CAP-085 reads **all** `qualificationRules`, so hard rules not in this wave's tunable set (H-SRC/CAP-065, H-SUF/CAP-066, H-TRACE/CAP-067, H-SIM-surface/CAP-069, H-SAFE/CAP-073, H-DISC/CAP-075, H-AFF/CAP-076, H-EXP/CAP-077, and soft S-rules CAP-078–082) would appear in the same list. Whether they render as read-only rows or are hidden — so "list all rules" and "edit only these five" can coexist — is unstated. *(GLM + Opus both flagged.)*
2. **`ruleVersion` / `effectiveTiming` on edit** — no CAP states whether `setRuleConfig` bumps `ruleVersion`, inserts a row, or updates in place, nor whether an edit applies to in-flight candidates or only new `qualify` runs (no `effectiveTiming`, unlike M15's `configKeyRegistry`). `qualificationRuns.rulebookVersion` depends on the answer. *(GLM + Opus.)*
3. **Disabled-hard-rule behavior** — CAP-064 "runs hard then soft"; whether a disabled hard rule is skipped or fail-closed applies is stated nowhere. *(GLM.)*
4. **Feedback surface** — inline Error vs Toast for save-success / out-of-bounds is register-silent (both listed available in §6).
5. **Unauthorized-access response** for `/admin/rulebook` (redirect / 403 / Admin-shell error state) is not specified.
6. **Empty / partially-seeded `qualificationRules`** rendering — **RESOLVED 2026-08-23 (E3):** CAP-536 seeds all 7 tunable rows at deploy; empty state unreachable by design. Partial-seed (migration interrupted) remains an edge case for build-time tests only.
7. **Unresolvable section references** — Source Rule `§8`/`§9`/`§11` citations point to the M3 module decision doc, and the register header designates `RECONCILIATION-1.md`/`RECONCILIATION-2.md` as authoritative for wave changes; none of these are among the four provided sources. Mutation names were taken verbatim where the register supplies them; the referenced sections could not be checked. *(GLM file-availability note.)*
