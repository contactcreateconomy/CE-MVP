# CONTRACT-6-admin-resources-FINAL

**Screen:** Resource Ops Console — `/admin/resources`
**Wave:** 6B (M10 Constellation / Free Resource Store)
**Template archetype:** Review queues + forge + kill-gate
**Primary CAP-IDs:** CAP-205, 206, 207, 209, 210, 218, 219, 220, 221, 222, 225, 226, 555, 556, 557, 558, 559
**Actors (inventory = broadest screen access, Wave 6B E6):** Editor, Publisher, store_operator, Moderator, support_operator. **Not uniform per-action authority.** CAP-221 Administrator-only UGC kill-switch is a **distinct, narrower gate**. CAP-220 cron is not a screen-access actor.
**Register basis:** 559-row register (Wave 6B closeout, through CAP-559). **E1–E8 CLOSED 2026-08-25.**
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: 10-state reference pipeline + status enums adopted (GLM+Opus; GPT's ~120 transient states folded). See RECONCILIATION-6B §4.

---

## 1. Route & Access
- **Path:** `/admin/resources`, no params. No anonymous/member access.
- **Per-row actor sets (verbatim — inventory is broadest access, not uniform authority):**
  - CAP-205/206/222/226/555/556/558/559 = Editor, Publisher, store_operator
  - CAP-209/210 = **Publisher, store_operator** (Editor excluded from publish/schedule)
  - CAP-218/225 = **Moderator, store_operator, support_operator**
  - CAP-557 = **Moderator** only (`resources.status=under_legal_review`)
  - CAP-207 = System (operator-initiated; audited — E4)
  - CAP-220 = cron (not a screen-access actor; dashboard is a render of its writes)
  - CAP-221 = **Administrator only** — UGC kill-switch (`constellation.ugc.enabled=false`). **Distinct, narrower gate.** Presence of other roles on this console does **not** authorize CAP-221. Whether the toggle chrome lives on this console or the M15 shell is an Open Question; the **authority** is Administrator-only either way.
- **Auth sequencing:** minimal basic role-check gate now; full M15 `/admin` shell (CAP-390/392) wraps at Wave 7 (known Wave-3 E5 pattern). CAP-019 rate limit applies. Per-action RBAC enforces the CAP-specific actor rules above.
- **UGC-disabled does not disable the console:** in-house/operator production, review, publish, schedule, pause/archive/legal-review, takedown, supply management remain valid; only user-reference *intake* is dormant (`/contribute` disabled-render).
- **No automatic publication:** forge output must pass artifact validation (CAP-208, System, off-screen) + operator publish/schedule. Human editorial version review is CAP-559 (distinct from CAP-208).
- **Off-screen gates:** CAP-209/210 both gated by **CAP-208** `artifact.validatePdf` (rejects URI/Launch/JS/forms/embedded/remote/QR; fail → not publishable).

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `resourceReferences` | read + write | review pipeline status transitions; sourceClass=rights_verified write (CAP-226) |
| `resourceReferenceGrants` | read (CAP-205/226) | licence evidence backing rights decisions |
| `resourceContributions` | write (CAP-207 seeds, CAP-222 finalizes) | role {primary·supporting·duplicate·independent·source_only}, weight 0–1, weightVersion, isDuplicate — **Σ ≤ 1.0 server-enforced (INV-7)** |
| `resources` | write | draft (CAP-207) · review (CAP-558) · scheduled+releaseDate+releaseBatch (CAP-210) · published (CAP-209) · paused (CAP-555) · under_legal_review (CAP-557) · archived (CAP-556) · removed (CAP-218) · unpublish-within-5-hops (CAP-219) |
| `resourceVersions` | write | generating (CAP-207) · editorial_review → approved (CAP-559, human) · current + isCurrent=true (CAP-209) · validation_failed \| approved (CAP-208 System, off-screen) |
| `contentCandidates`/`contentCandidateSources`/`sourceClaims`/`draftClaimRefs`/`claimClusters`/`generationRuns` | write (CAP-207 — reuses M2/M3 pipeline) | forge synthesis + traceability |
| `tools` | read (CAP-207) | M5 grounding |
| `legalIntake` | read + write (CAP-217 off-screen / CAP-218) | type=dmca_notice; status {received·acknowledged·reviewing·complied·rejected_invalid·counter_notice} — **absorbs prior thin `dmcaNotices` (E1)**. No M10 capability creates a `dmcaNotices` row. |
| `resourceTakedownActions` | write (CAP-218) | legalIntakeId?, action {unpublish·legal_hold·remove}, reasonCode, actorUserId |
| `resourceCascadeReviews` | write (CAP-219) | per-node BFS record; hopDepth ≤5; overflow beyond |
| `strikes` · `capabilityRestrictions` | write (CAP-225) | upload-cap reduction / suspend |
| `signalLedger` · `acquisitions` · `downloads` | read (CAP-220 kill-gate metrics) | |
| `pilotKillGateEvaluations` | write (CAP-220) | append-only evaluation snapshot; outcome {continue\|ditch_recommend}; **does not flip `constellation.ugc.enabled`** |
| `configKeyRegistry` · `systemConfig` | read (CAP-220 thresholds); write (CAP-221 flag only) | kill-gate numeric thresholds admin-configurable (toggle > hardcode — E8); `constellation.ugc.enabled=false` write is **CAP-221 Administrator only** |
| `auditLog` | write | CAP-205/206/207/209/210/218/221/222/225/226/555/556/557/558/559 |
| `resourceTags` · `categories` · `users` | read | content-review allowlist/off-topic checks; contributor identity |

## 3. States
*(10-state reference pipeline + status enums below. GPT's ~120 transient states — each rights-basis value, each hop, each kill-gate condition pass/fail as its own state — folded, since `resourceReferences.status` (10) + `resources.status` (8) + `resourceVersions.status` (8) + the kill-gate's seven named conditions are the authoritative sets.)*

**A. Reference review pipeline (10-state enum; this screen owns 4 transitions):** quarantined → *(scanning — CAP-204, off-screen)* → **rights_review** (CAP-205: → accepted_for_forge | rejected) → **content_review** (CAP-206: → accepted_for_forge | **rejected w/ reason enum — off_topic ≠ unsafe, distinct reasons, INV-11**) → accepted_for_forge. Terminal/parallel: rejected · forge_consumed · legal_hold · deleted.
**B. Rights-verified promotion (CAP-226):** operator marks sourceClass=rights_verified → **unlocks one→many forge for that reference** (INV-4 stays enforced for user_ugc).
**C. Forge states (CAP-207):** accepted_for_forge → `forge.fromReferences` → resources (draft) + resourceVersions (generating) + M2-pipeline artifacts. **Many→one synthesis OK; one→many blocked for user_ugc.** Reuses M2 pipeline + similarity/quote/SSRF gates. Operator-triggered System action; **auditLog written (E4).**
**D. Artifact validation (CAP-208, off-screen gate):** generating → **validation_failed** | approved (System PDF checks).
**E. Human editorial version review (CAP-559, E7):** `resourceVersions.status` editorial_review → approved. Distinct from CAP-208. Does not set `isCurrent`.
**F. Resource lifecycle (CAP-209/210 + E7 CAP-555/556/557/558):** draft → **review** (CAP-558) → **scheduled** (releaseDate, releaseBatch — drip 5–10/week; 40–60 launch inventory, DEC-S16) → **published** (resourceVersions → current, isCurrent=true; **exactly one current per published resource**) · **paused** (CAP-555) · **under_legal_review** (CAP-557, Moderator) · **archived** (CAP-556). CAP-209 RESOLVED 2026-08-09: **no formal license required — in-house curated marketing material only (UGC off), unrestricted use; optional non-blocking caption; no consent-stamp modal.**
**G. Contribution weighting (CAP-222, at forge finalize):** role + weight; **Σ ≤ 1.0 server-enforced; duplicates = 0 weight; upload order never sole determinant** (INV-7).
**H. Takedown (CAP-218, on valid notice — CAP-217 intake off-screen/W7):** `legalIntake` → complied | rejected_invalid | counter_notice; resources → **removed**; resourceTakedownActions written. Takedown ≠ erasure — legal hold may retain under restricted access (INV-8). CAP-557 `under_legal_review` is a prior hold, not a substitute for CAP-218 `removed`.
**I. Cascade walk (CAP-219, System):** BFS over resourceReferences→resourceContributions→resources; **per-node resourceCascadeReviews; depth ≤5; deeper → overflow queue (still recorded); unpublish within 5 hops** (INV-9).
**J. Strike (CAP-225):** rights violation confirmed → strikes + capabilityRestrictions (upload cap reduction / suspend); **residual log even if self-attested false (B7)**; M13 RI policy downstream. Reads `legalIntake` (E1).
**K. Kill-gate (CAP-220 cron):** evaluates named dimensions (publishable rate, ops cost, dispute rate, UGC-vs-in-house quality, parser isolation, legal lag, forge automation). **Numeric thresholds are admin-configurable** — not hardcoded in this contract. Tick cadence (refs-count OR days) is likewise config, not a register literal. Writes **`pilotKillGateEvaluations`** (append-only; continue or ditch_recommend). **Does not itself disable UGC.** CAP-221 Administrator writes `constellation.ugc.enabled=false` (audited) — the dormancy switch for `/contribute`.

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Review rights basis | Editor, Publisher, store_operator | CAP-205 `reference.rightsReview` | resourceReferences (rights_review→accepted/rejected), auditLog | CAP-204 (parse OK) |
| Review content | Editor, Publisher, store_operator | CAP-206 `reference.contentReview` | resourceReferences (content_review→accepted/rejected w/ reason), auditLog | CAP-205 |
| Initiate forge | System (operator-triggered) | CAP-207 `forge.fromReferences` (R-ONE-MANY) | contentCandidates, …, resources (draft), resourceVersions (generating), **auditLog** | CAP-206 (accepted_for_forge); M2/M3 gates |
| Send resource to review | Editor, Publisher, store_operator | CAP-558 `resource.review` | resources (status=review), auditLog | none |
| Pause resource | Editor, Publisher, store_operator | CAP-555 `resource.pause` | resources (status=paused), auditLog | none |
| Archive resource | Editor, Publisher, store_operator | CAP-556 `resource.archive` | resources (status=archived), auditLog | none |
| Place under legal review | Moderator | CAP-557 `resource.legalReview` | resources (status=under_legal_review), auditLog | none |
| Human editorial review of version | Editor, Publisher, store_operator | CAP-559 `version.editorialReview` | resourceVersions (editorial_review→approved), auditLog | none (distinct from CAP-208) |
| Publish resource | Publisher, store_operator | CAP-209 `resource.publish` | resources (published), resourceVersions (current, isCurrent=true), auditLog | CAP-208 (artifact approved) |
| Schedule release batch | Publisher, store_operator | CAP-210 `resource.schedule` | resources (scheduled, releaseDate, releaseBatch), auditLog | CAP-208 |
| Execute takedown | Moderator, store_operator, support_operator | CAP-218 `takedown.execute` (R-DMCA; INV-8) | legalIntake (disposition), resources (removed), resourceTakedownActions, auditLog | CAP-217 (valid notice); M13 RI |
| Cascade walk | System | CAP-219 `cascade.review` (INV-9) | resourceCascadeReviews (per node), resources (unpublish ≤5 hops) | CAP-218 |
| Kill-gate evaluation | cron | CAP-220 `pilot.metrics` (R-KILL-GATE) | pilotKillGateEvaluations (append-only snapshot) | none (thresholds from config) |
| Disable UGC pilot | **Administrator only** | CAP-221 (no mutation name; "Admin toggle") | systemConfig (constellation.ugc.enabled=false), auditLog | CAP-220 (kill-gate fail) — authority remains Administrator; cron cannot fire this write |
| Assign contribution role/weight | Editor, Publisher, store_operator | CAP-222 (R-WEIGHT; no mutation name) | resourceContributions (role, weight, weightVersion, isDuplicate), auditLog | CAP-207 (forge finalize); Σ≤1.0 |
| Strike contributor | Moderator, store_operator, support_operator | CAP-225 (§11 governance; no mutation name) | strikes, capabilityRestrictions, auditLog | CAP-218 (violation confirmed) |
| Mark rights_verified | Editor, Publisher, store_operator | CAP-226 (no mutation name) | resourceReferences (sourceClass=rights_verified), auditLog | CAP-205 |

- **Restore removed resource** — no general restore mutation; valid counter-notice/legal restoration belongs to the legal workflow. **Delete** — no hard-delete (time-bound + status-managed teardown).

## 5. Analytics Events
**None of these rows write rawEvents.** Accountability = `auditLog` on operator mutations including CAP-207 (E4) and CAP-555–559. CAP-220 persists `pilotKillGateEvaluations`; CAP-219 cascade records are the walk audit. Forge truth preserved in `generationRuns` + candidate/claim tables + resources/versions. Kill-gate reads signalLedger/acquisitions/downloads/`legalIntake` as metrics inputs (read-only). No M16 catalog row covers resource-ops.

## 6. Components Used
- Admin-console archetype (§12.4) · **A1 Data table — archetype gap** (highest-priority; §12.4 mentions tables, §11 defines none) · **A12 queue/case board — gap** (rights_review / content_review / forge / DMCA / cascade queues; claim affordances undefined) · **A2 charts/data-viz — gap** (kill-gate dashboard, no §11 chart primitive) · **§11.3 card family** (widget/Stats cards for kill-gate metrics) · **§11.2 Inputs** (reject-reason enums, batch scheduling; **datetime control — no §11 picker, gap**) · **§11.5 Pill/Tag** (status chips across the 10-state pipeline) · **§11.1 Button** (+ Destructive for takedown/strike; Administrator-only control for CAP-221, visually/RBAC-distinct from Editor/Moderator actions) · **§11.7 Modal + Toast** (confirm-gated disables) · **§11.9 Skeleton** · A10 evidence-panel adjacency for forge review (M2 artifacts in queue).

## 7. Open Questions
*(Escalated items E1–E8 closed in RECONCILIATION-6B. These remain unspecified detail.)*
1. **Cascade overflow queue entity home** for >5-hop edges — unspecified (same table with a flag? separate?). (GLM.)
2. **`releaseBatch` on publish** — whether CAP-209 preserves/clears CAP-210's releaseDate/releaseBatch on publish is unstated (minor). (GLM.)
3. **Queue priority / assignment / pagination / filtering / lease behavior** — no consolidated queue-load query is identified. (All three.)
4. **Contribution-weight edit/lock behavior after publication** — unspecified. (GPT.)
5. **Kill-gate config key names** (cost, dispute rate, quality delta, parser failure, legal lag, tick cadence) — values must not be hardcoded; exact key strings unspecified. (GPT; E8 closed the entity + toggle principle.)
6. **Disable handling of already-quarantined/in-review UGC references** when CAP-221 fires — unspecified. (GPT.)
7. **CAP-221 chrome host** — this console vs M15 shell. Authority is Administrator-only either way (E6).
