# Editorial Workspace / Candidate Review

**Status (2026-09-18 screen audit correction):** LIVE. Audited against CONTRACT-4-editorial-FINAL.md — highly compliant, no deviations found.

**Route:** `/admin/editorial`
**Status:** NOT STARTED
**Contract:** PRD/02-contracts/wave-4/CONTRACT-4-editorial-FINAL.md
**Slice(s):** P4-09 (forge + review workspace + CAP-542/543 core); P4-10 (approve / reject / schedule / regen decisions); P4-11 (publish + social derivatives); P4-12's inject/remove pair (CAP-049/050) also lands on this surface post-approval

## Layout

From contract §6 Components Used: **§12.4 Admin Console Layout** (dense) + **§7.4 admin motion** (fade-in only, duration/fast). Inventory Template archetype: "Evidence-review + operator queue (densest screen after `/admin/rulebook`)". Candidate selection occurs inside the operator queue — no candidate-detail route. Slice P4-09 scopes the A10 gap as "v1 = synchronized three-pane layout composed from §11 primitives, flagged not invented" with a degrade path to "tabbed panes".

```
+------------------+---------------------------------------------------+
| (admin sidebar,  |  DENSE CONTENT (§12.4)                            |
|  §12.4)          |                                                   |
|                  |  OPERATOR QUEUE — A12 queue board + A1 table      |
|                  |  Tabs (queue status filters): submitted |         |
|                  |  extracting | drafting | review | approved |      |
|                  |  scheduled | published | rejected               |
|                  |  (status pills per candidate)                    |
|                  |                                                   |
|                  |  REVIEW-DETAIL WORKSPACE (a `review` candidate)  |
|                  |  A10 evidence/diff review panel — synchronized   |
|                  |  panes (MISSING archetype; v1 composed):         |
|                  |    [ draft body ]  [ claim evidence:             |
|                  |      sourceClaims + draftClaimRefs +             |
|                  |      exactValidation × operatorConfirmed         |
|                  |      (CAP-542 confirm/reject) ]  [ similarity    |
|                  |      checks + qualification rule results +       |
|                  |      source conflicts ]                          |
|                  |                                                   |
|                  |  Per-claim pills (pass/fail/flag) · Tag pills    |
|                  |  Buttons: Approve (Primary, fail-closed until    |
|                  |  every draftClaimRef operatorConfirmed=true) ·   |
|                  |  Regen (Secondary) · Reject (Destructive,        |
|                  |  rejectionReason Textarea required) ·            |
|                  |  Schedule (datetime picker, CAP-054)             |
|                  |  Modals: regen confirm · affiliate-inject picker |
|                  |  Tooltip on icon-only controls                   |
+------------------+---------------------------------------------------+
```

## Components required

- A12 queue board → apps/forum/src/components/ui/queue-board/index.tsx
- A1 data table (operator queue) → apps/forum/src/components/ui/data-table/index.tsx
- MISSING: Evidence / diff review panel (A10) — does not exist in the library; contract §6 calls it the "highest-fidelity need on this screen" (draft + claim evidence + similarity side-by-side, synchronized panes undefined)
- Tabs (§11.8 state matrix, queue status filters) → apps/forum/src/components/ui/tabs.tsx
- §11.2 Text Input / Select (regen params, affiliate tool picker) → apps/forum/src/components/ui/input.tsx + apps/forum/src/components/ui/select.tsx
- MISSING: Textarea (rejection reason — field unspecified, E6; editable derivative/candidate text) — no textarea component exists in the library
- datetime picker for CAP-054 scheduling — contract §6 flags "No datetime-picker in §11"; the library provides one → apps/forum/src/components/ui/datetime-picker/index.tsx
- §11.5 pills (candidate status, per-rule pass/fail/flag, "stale" derivative) + Tags (source/category markers) → apps/forum/src/components/ui/badge.tsx
- §11.1 Button Primary/Secondary/Destructive (approve / regen / reject) → apps/forum/src/components/ui/button.tsx
- §11.7 Toast + Modal (regen confirm, affiliate-inject picker) → apps/forum/src/components/ui/toast.tsx + apps/forum/src/components/ui/dialog.tsx
- Tooltip (icon-only controls) → apps/forum/src/components/ui/tooltip.tsx
- §11.9 Skeleton (queue + evidence panes) → apps/forum/src/components/ui/skeleton.tsx
- MISSING: Spinner (regen/export/publish in-flight) — no spinner component exists in the library
- MISSING: Claim-Evidence Card / traceability row / exact-validation indicator / similarity-diff viewer / source-conflict panel / generation-history panel / persona-comment review block / affiliate-injection selector / social-derivative editor — contract §6 flags none exist in §11

## States required

*(Copied VERBATIM from CONTRACT-4-editorial-FINAL §3.)*

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

## Component library maturity note

- ⚠️ tabs has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ datetime-picker has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ tooltip has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ queue-board has zero production usage — expect possible integration friction, report don't silently patch.
- button, toast are production-proven (no warning).
