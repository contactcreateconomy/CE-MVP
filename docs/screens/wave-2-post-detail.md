# Post Detail (all 8 active types + mechanics)

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** review-type posts now resolve and render `reviewTool.name` / `verdictSummary` / `pros` / `cons` (the detail query never joined `toolId` before, so these fields silently rendered blank). Compare posts now render `qualitativeGrid` as the structured object the UI expects (composer previously wrote it as a single string, a shape mismatch). `static_creator` lists can now be populated by their own author (a `gateListMember` bug rejected the author's own adds).

**Route:** `/p/[slug]`
**Status:** LIVE, ROUTE DRIFT — live route is `/discussions/[slug]` at `PRD/app/apps/forum/src/app/(app)/discussions/[slug]/page.tsx` (plus `loading.tsx` and a `(slug)` dir layout)
**Route drift:** spec `/p/[slug]` vs live `/discussions/[slug]` — DECISION NEEDED: rename live route to match spec, OR update spec to match live route. Not silently picked.
**Contract:** PRD/02-contracts/wave-2/CONTRACT-2-post-detail-FINAL.md
**Slice(s):** SLICE-P4-13 (base render + type index + SEO SSR), SLICE-P4-14 (debate + list mechanics), SLICE-P4-15 (Help accept/reopen + Showcase URL submit). Wave-5 discussion enrichment (thread mounts on this screen, not a new route): SLICE-P5-02 (comments.create + gates), SLICE-P5-03 (comment reads + reactions + saves + signals + read-state); schema substrate SLICE-P5-01.

## Layout

Derived from contract §6 (Components Used) + the inventory's "Reading column + thread" archetype only:

```
┌────────────────────────────────────────────┐
│ Reading column (max 720px, §4.3) — post    │
│  content                                   │
│  Author row — Avatar (§11.6)               │
│  Category pill + Time badge (§11.5:        │
│    🔥Hot / ⏰Recent / 💎Ever)               │
│  Per-type content block (States A1–A9:     │
│    news / review / compare / spark /       │
│    debate / list×2 / showcase / help)      │
│  Mechanic affordances (States B–D):        │
│    debate vote (radio + buttons) ·         │
│    list item entry + icon votes (tooltip + │
│    aria-label) · help accept/reopen ·      │
│    showcase outbound button (approved only)│
│                                            │
│  Thread — NOT Wave-2 scope; arrives with   │
│  the Wave-5 enrichment slices (P5-02/03)   │
└────────────────────────────────────────────┘
```

Tallies/counts render in `code/sm` (Geist Mono, §3.3) per contract §6. No sidebar, header, or other regions are specified by the contract.

## Components required

- Category pill + Time badge (§11.5) → `PRD/app/apps/forum/src/components/ui/badge.tsx`
  - ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- Avatar, author row (§11.6) → `PRD/app/apps/forum/src/components/ui/avatar.tsx` (also present: `avatar-with-name.tsx`, `user-avatar.tsx` — outside both maturity lists)
- Button Primary / Secondary / Ghost (§11.1) — debate `agree|disagree|abstain`, list-vote affordances, Showcase outbound button (`rel="ugc nofollow noopener noreferrer"`) → `PRD/app/apps/forum/src/components/ui/button.tsx`
- Tooltip (§11.7 — icon-only list-vote requires `aria-label` + tooltip per §9.4) → `PRD/app/apps/forum/src/components/ui/tooltip.tsx`
  - ⚠️ tooltip has zero production usage — expect possible integration friction, report don't silently patch.
- Text Input, list-item entry (§11.2) → `PRD/app/apps/forum/src/components/ui/input.tsx`
  - ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- Radio, debate choices (§11.2) → MISSING: Radio does not exist in the library — and the contract separately flags §11 has no segmented three-way (debate) single-select control.
- Toast (§11.7) → `PRD/app/apps/forum/src/components/ui/toast.tsx`
- Skeleton, Text-line / Heading variants (§11.9) → `PRD/app/apps/forum/src/components/ui/skeleton.tsx`
  - ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- Compare grid (qualitativeGrid + live numeric rows) → `PRD/app/apps/forum/src/components/ui/data-table/index.tsx` exists in the library as the admin A1 table pattern, but the contract flags STYLE-KIT §11 has **no comparison-table / data-grid primitive** for the public Compare grid ("related to but distinct from admin gap A1"). SLICE-P4-13: "Compare grid composed from §11 primitives (archetype gap — flag, not invent a table kit)."
  - ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- MISSING: reading-column article component does not exist in the library (contract flags §11 has cards/inputs/nav only; `reading-affordances.tsx` in the library is a scroll-progress strip, not an article container — supplementary at most)
- MISSING: accepted-Help-answer highlight pattern does not exist in the library (contract flags it as undefined, intertwined with the W5 thread)

## States required

(Copied verbatim from CONTRACT-2-post-detail-FINAL.md §3)

**A. Per-type render states** — `posts.getDetail` returns `{post, extension, threadContext}`; `threadContext = {type, mechanic state, acceptedCommentId?, userVote?}` (CAP-090 Notes):
1. **news** — `postNews` block: `sourceOfTruthUrl` (platform-injected), `keyClaims`, `publishedAt`.
2. **review** — `postReviews` block: `toolId`, `verdictScore` (**display-only, never feeds the `tools` aggregate**), `verdictSummary`, `pros`, `cons`.
3. **compare** — `qualitativeGrid` merged with **live-computed** numeric rows: per tool, overall = `ratingSum/ratingCount`; per-dimension = `dimensionSums/dimensionCounts`; **count 0 → "—"** (skip); 2 ≤ `toolIds` ≤ 4 enforced; **no numeric scores stored in `postCompares`** (CAP-092).
4. **spark** — `postSparks.statement`.
5. **debate** — `proposition` + `agreeCount/disagreeCount/abstainCount` (derived tallies; source of truth = `debateVotes`; persona/editorial votes excluded).
6. **list, `community_ranked`** — items votable (CAP-097); verified members add (CAP-095); members remove own (CAP-096); `voteCount` displayed (derived from `listItemVotes`).
7. **list, `static_creator`** — only the author edits items (CAP-095). *(Whether vote-toggle is disabled in this mode is unstated — Open Questions.)*
8. **showcase** — `theThing` + projectUrl button rendered **only when `approvalStatus=approved`** (render rule per CAP-101; the approve/reject action lives on `/admin/moderation`, W7). Sub-states per `approvalStatus {none|pending|approved|rejected}`: pending/rejected render without the button; approved button is platform-rendered with `rel="ugc nofollow noopener noreferrer"`.
9. **help** — `problemStatement`; **open** vs **resolved** (`resolvedStatus {open|resolved}`); resolved shows the accepted marker (`acceptedCommentId`).

**B. Debate vote interaction states:** no vote → cast affordance (`agree|disagree|abstain`, verified member, type=debate, active, unique (userId, postId), CAP-093) · vote exists → change affordance (atomic decrement-old + increment-new, CAP-094; `userVote?` in `threadContext` powers the branch) · cast rejected (existing vote uniqueness or unverified member, CAP-093).

**C. List interaction states:** add item (content ≤200 chars, CAP-095) · remove own item with `voteCount` recompute (CAP-096) · toggle vote (unique (userId, postListItemId), `voteCount` maintained same-mutation, CAP-097 / INV-4).

**D. Help interaction states:** author accepts (single accepted, **replaces prior**; user-Help → author only, editorial-Help → Editor/Publisher, CAP-098) · author reopens (`resolvedStatus=open`, CAP-099) · **cleared-reference edge (CAP-106):** when the accepted comment is deleted, `postHelps.acceptedCommentId` is cleared and the M4 read **tolerates the cleared ref → Help reverts to open**.

**E. SEO render states (CAP-107):** indexable (public + passed/not_required, SSR) · noindex (held / rejected / private / unlisted).

*(GPT also enumerated missing-extension and archived-post states; register specifies no behavior for either → Open Questions.)*

## Component library maturity note

- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ tooltip has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- button, avatar, toast are production-proven — no warning.
