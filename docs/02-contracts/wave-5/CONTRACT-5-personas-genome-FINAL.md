# CONTRACT-5-personas-genome-FINAL

**Screen:** Persona Genome Config (back-door) — `/admin/personas/genome`
**Wave:** 5 (M8 Persona — restricted admin config)
**Template archetype:** Admin config (intentional back-door)
**Primary CAP-IDs:** CAP-178, CAP-546, CAP-548 (+ CAP-158 / CAP-547 System, no-UI, for wiring only)
**Actor:** Administrator only
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: GPT's ~55 per-field-edit states folded to config-mode + edit-safety set. **E-F and E-G CLOSED 2026-08-24** (CAP-546 rollback + CAP-547 compiled-prompt invalidation + CAP-548 preview fixture). See RECONCILIATION-5A §5.

---

## 1. Route & Access
- **Path:** `/admin/personas/genome`. **Dynamic params:** none. **Actor:** Administrator only (CAP-178) — the most restricted of the three admin persona screens. Editor/Publisher not granted; no anonymous/member access.
- **Intentional back-door** (register UI note verbatim: "admin genome config back-door") — no normal nav entry; direct-URL access. **Obscurity is not the security control** — direct-link access still requires Administrator authorization.
- **Auth sequencing:** minimal Administrator gate at Wave 5; M15 shell at Wave 7 (known pattern). CAP-019 applies.
- **Prompt compilation (wiring only, no UI):** CAP-158 `genome.compileSystemPrompt` — `systemPrompt` is COMPILED from the genome, never hand-written (data-model). Genome = cognitive style, **not** fictional biography; backstory/`identityCharter` do NOT enter the generation prompt.
- **No persona lifecycle mutation** — this route modifies genome configuration, not activation/pause/retirement/revival.

## 2. Entities
- **CAP-178** Reads: `personaGenomes, personaGenomeEdits, systemConfig, auditLog`. Writes: `personaGenomes, personaGenomeEdits (versioned), auditLog`.
- **Canonical fields:**
  - `personaGenomes` — `personaId?, version, scope {template|instance}, analyticalLens, secondaryLenses[], disagreementStyle, confidenceCalibration, register, verbosity, domainLevels, evidencePosture, rankedValues[3], triggerConditions[], signatureMoves[≤2], contributionArchetypes[], humorLevel {none|dry|light|sharp}, sarcasmLevel {none|mild|pointed}, blindSpot, counterweight, abstentionTopics[], prohibitedOverreach, embedding (diversity check), createdByUserId, createdAt`.
  - `personaGenomeEdits` (append-only audit) — `personaId?, genomeVersion, field, oldValue, newValue, scope {template|instance}, adminId, previewFixtureRef?, createdAt`.
  - `systemConfig` — trait ranges/weights ("admins tune templates + trait ranges/weights") — **keys unnamed** (Open Question).
  - `auditLog` — every edit.

## 3. States
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

## 4. Actions → API

| Action | Actor | CAP | Writes | Gates |
|---|---|---|---|---|
| Tune template / override instance / hand-craft | Administrator | CAP-178 (§11 governance, genome config back-door; R-GENOME) — **no mutation name in the register** | personaGenomes, personaGenomeEdits (versioned), auditLog | none — fires CAP-547 |
| Preview fixture (draft/unsaved genome) | Administrator | CAP-548 | personaGenomeEdits (previewFixtureRef) | CAP-178 |
| View history / rollback to prior version | Administrator | CAP-546 | personaGenomes (reverted), personas (genomeVersion), personaGenomeEdits (rollback event), auditLog | CAP-178 — fires CAP-547 |
| Compile prompt (wiring only) | System | CAP-158 `genome.compileSystemPrompt` (R-GENOME) | (in-memory compiled prompt) | none — System-owned; no client direct prompt-execution authority |
| Invalidate compiled prompt (edit or rollback) | System | CAP-547 | (in-memory compiled prompt); personas (systemPrompt discarded) | CAP-178, CAP-546 |

- **Delete / deactivate genome** — no API operation; historical versions + edit records must not be silently removed.
- **Rollback genome** — **CAP-546** (E-F closed).

## 5. Analytics Events
**None identified.** Accountability = **`personaGenomeEdits` (append-only, field-level `oldValue`/`newValue`) + `auditLog`** — this screen has the strongest audit posture in the batch; every back-door edit is versioned and preview-fixtured. No `rawEvents`; no M16 catalog row applies.

## 6. Components Used
- **§12.4 Admin Console Layout** (§7.4 motion: fade-in only) — **no normal nav item must be created for this back-door route.**
- **§11.2** Select/Radio (bounded enums: `analyticalLens`, `humorLevel {none·dry·light·sharp}`, `sarcasmLevel {none·mild·pointed}`, `register`, `verbosity`, `scope` — never free text for humor/sarcasm) · constrained array inputs (`rankedValues[3]`, `signatureMoves[≤2]`, `abstentionTopics[]`) · Text Input/Textarea (bounded textual fields) · Slider only where canonical bounds exist.
- **§11.1** Button Primary (save, run preview fixture) + Secondary/Ghost · **§11.7** Modal (edit confirm) + Toast · **§11.9** Skeleton.
- **A1 Data table** for the `personaGenomeEdits` history — archetype gap.
- **Archetype gaps:** no Genome Editor / trait-vector editor, template-vs-instance inheritance viewer, version-diff, **preview-fixture render surface** (`previewFixtureRef` exists; its viewer is unpatterned), or rollback component in §11.

## 7. Open Questions
*(Escalated items in RECONCILIATION-5A. These are unspecified detail.)*
1. **CAP-178 names no mutation** (same class as Wave-4's unnamed inventory mutations). (GLM + GPT + Opus.)
2. **Trait range/weight `systemConfig` keys** — read by the row, never named anywhere. (All three.)
3. **Field-level validators / enum sets beyond humor/sarcasm/scope / numeric bounds / requiredness** — incomplete in the data model. (GPT.)
4. **Template inheritance + instance-override precedence** — unspecified. (GPT.)
5. **Direct-entry mechanism for the back-door route** — unspecified; must remain outside normal navigation. (GPT.)
6. **CAP-158 compile failure/recovery** — unspecified. (GPT + Opus.)
7. **Whether retired-instance genomes remain editable** — retirement preserves history; genome-record treatment unspecified. (GPT.)
