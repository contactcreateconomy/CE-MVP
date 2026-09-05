# CONTRACT-4-editorial-FINAL

**Screen:** Editorial Workspace / Candidate Review — `/admin/editorial`
**Wave:** 4 (M2 Content Engine — backend; operator UI)
**Template archetype:** Evidence-review + operator queue (densest screen after `/admin/rulebook`)
**Primary CAP-IDs:** CAP-041, CAP-042, CAP-043, CAP-044, CAP-048, CAP-049, CAP-050, CAP-052, CAP-053, CAP-054, CAP-055, CAP-542, CAP-543
**Actors:** Editor, Publisher (+ System for CAP-052/055)
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. CAP-019 adopted (GPT+GLM majority). States: GPT's ~120 sub-states folded to the organized GLM+Opus set on register evidence. **E4/E5/E6 closed (founder 2026-08-24).** E5 leftover (manual draft edit) closed as **CAP-543** (Scribe audit, founder 2026-08-24). E3 closed as a register gap (CAP-539/540/541 + CAP-544 list); `/admin/affiliate-inventory` screen contract still deferred — see RECONCILIATION-4. See RECONCILIATION-4 §2.

---

## 1. Route & Access
- **Path:** `/admin/editorial`. **Dynamic params:** none. Candidate selection occurs inside the operator queue, not via an inventory-defined candidate-detail route.
- **Role split is load-bearing (register Actor columns, verbatim):**

| Actor | Capabilities |
|---|---|
| **Editor** | CAP-041 (review), CAP-042 (candidate regen), **CAP-543 (manual draft edit — distinct from regen)**, CAP-048 (persona-comment regen), CAP-049/050 (affiliate inject/remove), CAP-053 (social-derivative export), **CAP-542 (per-claim entailment confirm/reject)** |
| **Publisher** | CAP-043 (approve — **also Gated by CAP-542**), CAP-044 (reject), CAP-054 (schedule) |
| **System** | CAP-052 (`social.generate`, Has-UI=NO — output surfaces via CAP-053), CAP-055 (`candidate.publish`, Has-UI=YES — surfaced as queue status only, no operator control) |

- **Entry capability:** CAP-041 (§9 candidate.review / §11 Editorial workspace), **`Gated by: CAP-040`** (forge completion delegates to M3).
- **Editor attempting a Publisher action** (approve/reject/schedule) must be unavailable / server-rejected unless the Editor also holds Publisher authority.
- **Auth sequencing:** minimal Editor/Publisher role-check gate at Wave 4; M15 shell (CAP-390/392) wraps at Wave 7 — known Wave-3 E5 pattern, not re-flagged.
- **Systemic limit:** CAP-019 (`admin.write` 60/1m per operator) on all operator mutations.
- **Takedown separation:** CAP-058/059/060 are Wave 7 `/legal/intake`; this workspace exposes no takedown mutation.
- **Redirect rules:** none specified; candidate state changes occur within the queue/workspace.

## 2. Entities
**Screen-render reads:**

| Entity | Fields in play (verbatim) | Grounding |
|---|---|---|
| `contentCandidates` | `status`, `draft`, `evaluation` (nested: `overallResult`, `ruleResults[]`), `claimClusterId?`, `postType?`, `operatorId`, `createdAt` | CAP-041/042/043/044/054 |
| `sourceClaims` | `claimText`, `claimType {fact|stat|quote|opinion|prediction|data_point}`, `evidenceText`, `attributionRequired`, `verificationStatus`, `confidence` | CAP-041 |
| `similarityChecks` | `checkType {source_ngram|source_jaccard|source_lcs|crosspost_vector|crosspost_jaccard}`, `score`, `threshold`, `result`, `matchedText?`, `matchedSourceText?` | CAP-041 |
| `qualificationRuleResults` | `ruleKey`, `result {pass|fail|flag}`, `evidence`, `failureCode?` — **live-run rows** (calibration/replay stream is CAP-085's, on `/admin/rulebook`) | CAP-041 |
| `contentCandidateSources` | `contentCandidateId`, `sourceId`, `relationshipType {primary|supporting|contrasting|furtherReading}`, `extractionId`, `createdAt` — source-conflict display. **CAP-041's read set contains no `sources`; blocked-source status surfaces via H-SRC rule evidence (CAP-065), not a direct `sources` read.** | CAP-041 |
| `draftClaimRefs` | `candidateRevision`, `assertionText`, `sourceClaimIds[]`, `exactValidation` (numbers/dates/quotes/entities → pass/fail), `operatorConfirmed` | CAP-041 (read); **CAP-542 writes `operatorConfirmed`** |
| `claimClusters` | `topicLabel`, `sourceDomainCount`, `status` | CAP-042 |
| `personaCommentDrafts` | `body`, `editedBody?`, `status`, `contributionIntent`, `supersededByDraftId?`, `earliestPublishAt?` | CAP-048 |
| `personas` | `displayName` + permanent AI label (draft attribution) | CAP-048 |
| `tools` · `affiliateRelationships` · `affiliateLinks` | inject eligibility: tool name-matched in draft + `affiliateRelationship.relationshipStatus` active; `affiliateLinks.url` + `disclosureClass` | CAP-049 |
| `postAffiliateLinks` | existing injections: `labelType` (banner.labelType enum), `position`, `injectedByUserId`, `injectedAt` | CAP-049/050 |
| `postSocialDerivatives` | `derivativeType {twitter|linkedin|hook|teaser|shorts_caption|…}`, `content`, `status`, `exportedByUserId?`, `exportedAt?` | CAP-053 |

**Action-only reads (System, not render):** `posts`, `postRevisions` (CAP-052); `contentCandidates`, `postSeoMeta`, `postAffiliateLinks`, `personaCommentDrafts` (CAP-055).

**Writes (verbatim register):**
- `contentCandidates` status transitions — CAP-042/043/044/054/055; **CAP-044 also writes `rejectionReason` (required on reject)**; **CAP-543 writes `contentCandidates.draft` (manual edit, distinct from CAP-042 regen) and triggers CAP-045 re-qualify**
- `draftClaimRefs.operatorConfirmed` — **CAP-542** writes per-claim confirm/reject; **CAP-543 resets ALL `draftClaimRefs.operatorConfirmed` on this candidate to `false`** (full reset on every manual edit — no surgical region detection). Editor must re-confirm via CAP-542 before approve can fire.
- `generationRuns` — CAP-042, CAP-048
- `auditLog` — CAP-043, CAP-044, CAP-049, CAP-050, CAP-053, + System CAP-055 — **NOT CAP-042 or CAP-054** (verified; see Open Questions on CAP-054)
- `postAffiliateLinks` — CAP-049/050
- `postSocialDerivatives` — CAP-052 (generate, backend), CAP-053 (export)
- `posts`, `postRevisions`, `postSources`, `comments` (authorType=persona, staggered), `contentEmbeddings`, `personaCommentDrafts` (status=published) — CAP-055 only

**Canonical invariants:** claims-first pipeline (atomic `sourceClaims` → `draftClaimRefs` map each assertion to cited claims → deterministic similarity + traceability gates before operator approval); `generationRuns` retained across regen (never overwritten); rejection terminal-for-revision but claims/evidence/results/reason preserved; `postSocialDerivatives` export-only (never auto-published externally, DEC-O07).

## 3. States
*(Organized by lifecycle + detail panes. GPT's per-attempt / per-branch enumeration — "First/Second/Third regeneration-attempt," each rule-result as a separate state — is folded into the grouped states below on register evidence. See RECONCILIATION-4 §2.)*

**A. Queue states — `contentCandidate.status`, all 8 (not collapsed):**
1. `submitted` — ingested, pre-extraction (System).
2. `extracting` — extraction in flight (System).
3. `drafting` — `forge.draft` in flight (System).
4. `review` — **the primary state of this screen**; CAP-041 evidence workspace active.
5. `approved` — post-approval staging: affiliate inject/remove (CAP-049/050, post-approval per their gates), persona-comment regen (CAP-048; drafts exist only post-approval per CAP-047's gate), awaiting schedule.
6. `scheduled` — awaiting publish fire-time (CAP-055).
7. `published` — terminal success; social derivatives become exportable (CAP-052 output → CAP-053).
8. `rejected` — terminal **for the revision**; claims/evidence/results/reason preserved (legal audit), never deleted (CAP-044).

**B. Review-detail states (inside a `review` candidate, CAP-041):**
- Qualification: `evaluation.overallResult ∈ {pass|fail|flag}`; per-rule results {pass|fail|flag} with evidence + failureCode.
- Similarity: per-check row, score vs threshold, result, matchedText/matchedSourceText.
- Claim citation (per `draftClaimRef`): `exactValidation` pass/fail × `operatorConfirmed` false/true/unset — **CAP-542 is the required per-claim confirm/reject action.** Approval is fail-closed until every `draftClaimRef` on the candidate has `operatorConfirmed=true` (CAP-067 H-TRACE; CAP-043 Gated by CAP-542). **Approve must not enable (UI) and must not succeed (server) while any ref is `false` or unset.** **E5 RESOLVED 2026-08-24.** **CAP-543 is the required manual draft-edit action** (distinct from CAP-042 regen). A material CAP-543 commit triggers CAP-045 re-qualify **and resets ALL `operatorConfirmed` on this candidate to `false`**. Prior confirmations do not survive the edit; the editor must re-confirm every claim via CAP-542 before approve is possible again.
- Source conflicts: contrasting/furtherReading relationships; blocked-source status via H-SRC evidence.

**C. Candidate regen states (CAP-042):** available (GLM attempts < 3) · in-flight · completed (prior `generationRuns` retained) · **exhausted** (≤3 attempts/candidate reached → affordance disabled).

**D. Persona-comment draft states (CAP-047 output; CAP-048 regen):** `generated` · `edited` · `approved` · `rejected` · `published`. Regen-failure → **keep previous comment, never blank** (CAP-048); priors retained via `supersededByDraftId`. Approve/reject/schedule of persona drafts is **intentionally out of scope** on this screen (CAP-173/174/175 → Wave 5) — E4 RESOLVED, founder 2026-08-24; not a gap.

**E. Affiliate injection states (post-approval, CAP-049/050):** no-eligible-tool (no draft name-match OR no active relationship → inject disabled) · 0 / 1 / 2 links injected (≤2/post + ≤1/tool, enforced at the **publish** mutation per CAP-057, not at inject time) · structured-CTA-only (`rel="sponsored nofollow noopener"`, never prose).

**F. Scheduling → publish states (CAP-054/055):** `scheduled` awaiting fire-time · publish in-flight (transactional, idempotency key; re-runs URL + similarity HARD checks per CAP-046; persona density cap ≤2/post per CAP-056) · published (persona comments staggered, real timestamps; body embedding indexed) · **publish-gate failure outcome unspecified** — no enum state exists (Open Questions).

**G. Social-derivative states (published candidates only, CAP-052/053):** `generated` · `edited` · `exported` · `stale` (`stale` trigger: post materially changes after export). Export-only, never auto-posted externally.

**Auth/shell:** Editor-authorized · Publisher-authorized · dual-role · unauthorized · Wave-4-minimal-shell vs Wave-7-M15-shell.

## 4. Actions → API

| Action | Actor | API (register name) | Writes | Gates |
|---|---|---|---|---|
| Review candidate | Editor | `candidate.review` (query; Writes = none) | — | CAP-040 (M3 `qualify` has run) |
| Confirm/reject claim entailment | Editor | unnamed mutation (CAP-542) | draftClaimRefs (`operatorConfirmed`) | CAP-041; per-claim; required before approve. Feeds CAP-067 fail-closed H-TRACE. **E5 RESOLVED.** |
| Edit candidate draft (manual) | Editor | unnamed mutation (CAP-543) | contentCandidates (`draft`); **draftClaimRefs (`operatorConfirmed=false` on ALL refs for this candidate)** | CAP-041. **Distinct from CAP-042 regen** (no GLM call, no generationRuns row). Material commit triggers CAP-045 re-qualify. **Editing the draft clears all prior claim confirmations** — the editor must re-confirm every claim via CAP-542 before CAP-043 approve can fire. Full reset (not surgical). **E5 leftover RESOLVED (Flag 2 + pre-FATAL integrity fix).** |
| Regen candidate draft | Editor | `candidate.regen` (action) | contentCandidates, generationRuns | CAP-038; GLM ≤3 attempts/candidate |
| Approve candidate | Publisher | `candidate.approve` (mutation) | contentCandidates (approved), auditLog | CAP-040 + CAP-041 + **CAP-542**; M3 latest run pass + operator approval (INV-2, no auto-publish). **Must not be possible while any `draftClaimRef` on the candidate has `operatorConfirmed=false` or unset** (server-enforced; UI disable is not sufficient). |
| Reject candidate | Publisher | `candidate.reject` (mutation) | contentCandidates (status=rejected, `rejectionReason` required), auditLog | CAP-040; terminal-for-revision. `rejectionReason` is the retained legal-audit record (non-deletable). `auditLog.reasonCode`/`justification` is a separate generic trail — not a duplicate, not a substitute. **E6 RESOLVED.** |
| Regen persona comment | Editor | `persona.regenComment` (action) | personaCommentDrafts, generationRuns | CAP-047; failure keeps previous, never blank |
| Inject affiliate link | Editor | `affiliate.inject` (mutation) | postAffiliateLinks, auditLog | CAP-043 (post-approval); tool name-matched + active relationship; structured CTA; never prose |
| Remove affiliate link | Editor | `affiliate.remove` (mutation) | postAffiliateLinks, auditLog | CAP-049 |
| Generate social derivatives | System | `social.generate` (action, Has-UI=NO) | postSocialDerivatives | CAP-056; export-only (DEC-O07) |
| Export derivative | Editor | `social.export` | postSocialDerivatives (exported), auditLog | CAP-052; records who/when |
| Schedule candidate | Publisher | `candidate.schedule` (mutation) | contentCandidates (scheduled) — **no auditLog write in register** (Open Questions) | CAP-043 |
| Publish (time-fired) | System | `candidate.publish` (mutation, transactional, idempotent) | posts, postRevisions, postSources, comments, contentEmbeddings, personaCommentDrafts (published), auditLog | CAP-046 + CAP-054; CAP-056 density cap; CAP-057 affiliate cap |

**Draft-body editing is specified:** CAP-543 (manual text edit on `contentCandidates.draft`). Distinct from the CAP-042 regen button. Material commit triggers CAP-045 **and resets ALL `draftClaimRefs.operatorConfirmed` on this candidate to `false`**. Prior CAP-542 confirmations do not survive the edit. Approve stays fail-closed until the editor re-confirms every claim.

## 5. Analytics Events
**None identified** for any of the 11 CAP rows. Grounded observability surfaces instead:
- **`auditLog`** — CAP-043/044/049/050/053 (+ System CAP-055).
- **`generationRuns`** — every GLM action (042/048/052) records provider, model, promptVersion, inputClaims, tokenUsage, estimatedCost, failureCode.

No `eventCatalog` row (CAP-436–463) names an editorial-review/approve/publish event; none write `rawEvents`, so CAP-436 same-mutation capture does not attach. *Downstream note:* CAP-055 creates `posts` + `contentEmbeddings`, which later feed M9 card generation (CAP-195) and exposure capture — but those events belong to the published post's surfaces, not this screen. Whether operator actions should also emit cataloged `rawEvents` (isStaff-stamped, product-counter-excluded per CAP-434/438/446) is unspecified (Open Questions).

## 6. Components Used
- **§12.4 Admin Console Layout** (dense) + **§7.4 admin motion** (fade-in only, duration/fast).
- **§11.2** Text Input / Select (regen params, affiliate tool picker) · Textarea (rejection reason — field unspecified, E6; editable derivative/candidate text).
- **§11.5** Pill mechanism (candidate status, per-rule pass/fail/flag, "stale" derivative) · Tag (source/category markers).
- **§11.1** Button Primary/Secondary/Destructive (approve / regen / reject) · **§11.7** Toast, Modal (regen confirm, affiliate-inject picker) · Tooltip (icon-only controls).
- **§11.9** Skeleton (queue + evidence panes) · Spinner (regen/export/publish in-flight).
- **Tab** (§11.8 state matrix) for queue status filters.
- **Archetype gaps — flag, not invent:**
  - **A10 Evidence / diff review panel** — inventory §3 names CAP-041 as the consumer (draft + claim evidence + similarity side-by-side; synchronized panes undefined). **Highest-fidelity need on this screen.**
  - **A1 Data table** — the operator queue; §11 has no table component.
  - **A12 Queue / case board** — claim/lease/aging affordances undefined.
  - **No datetime-picker** in §11 for CAP-054 scheduling.
  - No Claim-Evidence Card / traceability row / exact-validation indicator / similarity-diff viewer / source-conflict panel / generation-history panel / persona-comment review block / affiliate-injection selector / social-derivative editor exists in §11.

## 7. Open Questions
*(W4-E3/E4/E5/E6 closed 2026-08-24. E5 leftover closed as CAP-543 the same day. Remaining items are unspecified detail.)*
1. **Intentionally deferred — NOT a Wave-4 gap (founder 2026-08-24, matching `/p/[slug]` Wave-5/6 deferrals):** CAP-173/174/175 (persona-comment approve / reject / schedule, M8) are **explicitly out of scope** for `/admin/editorial`. They belong to Wave 5. CAP-048 regen remains on this screen; approve/publish is a Wave-5 home, not a missing affordance here.
2. **CAP-054 writes no `auditLog`** (register-verbatim), unlike approve/reject/inject/remove/export. Intentional or gap? (GLM.)
3. **`postSocialDerivatives.status=edited` has no writer** — only System generate (CAP-052) and Editor export (CAP-053) exist; the enum's `edited`/`editedByUserId` has no capability. Missing capability or dead state? (GLM.)
4. **Persona-regen cap ambiguity** — CAP-048 states no numeric cap; M8's 2–3 regen language lives in CAP-172; R-COST/CAP-062 says "max ~3 GLM attempts/candidate." Whether the ≤3 ceiling covers persona regens or only candidate regens is unconfirmed. (GLM + GPT.)
5. **Publish-gate failure state** — if CAP-046's URL/similarity re-run fails inside `candidate.publish`, no enum state covers the outcome (remains `scheduled`? returns to `review`?). (GLM.)
6. **CAP-055 Has-UI=YES with Actor=System** — interpreted as queue status display (scheduled→published transition + outcome), no operator control. Confirm. (GLM.)
7. **`contentCandidates.evaluation` snapshot vs live `qualificationRuleResults`** — CAP-041 reads immutable per-run results while the model keeps `evaluation` as "the latest snapshot projection"; which the review panel renders when a regen (CAP-042) produced a newer run than the last snapshot is unstated. (Opus.)
8. **Queue ordering** — no M2 analog of M13's R-QUEUE-ORDER; candidate queue sort/filter unspecified (status tabs + `createdAt` defaulted here). (GLM + GPT.)
9. **CAP-042 regen cap** — caps at three attempts but doesn't define whether the initial generation counts toward the limit. (GPT.)
10. **CAP-049 tool-match semantics** — exact vs normalized matching, ambiguity handling, multiple-tool selection undefined. (GPT.)
11. **CAP-053 export format/destination** — file/clipboard format and destination undefined; only export status + audit are established. (GPT.)
12. **CAP-054 scheduling detail** — timezone, minimum lead time, rescheduling, unscheduling, invalid-past-time behavior undefined. (GPT.)

---

## ADDENDUM 2026-09-04 — DECISIONS-LOCKED #10 (A10 approved)

A10 evidence-review interaction contract: **two-pane layout** — draft left, source
evidence right, synchronized by claim highlighting on click. **Approve disabled
until every claim has been checked at least once.** Mobile: Draft / Evidence tabs
instead of side-by-side. STYLE-KIT §11.21 remains the visual spec; this addendum
supplies the interaction contract P4-09 was missing. The screen-sheet
NEEDS-HUMAN-REVIEW flag for A10 is retired (M12 legitimacy formulas separately
unblocked by DECISIONS-LOCKED #11).
