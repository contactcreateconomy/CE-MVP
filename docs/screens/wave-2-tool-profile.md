# Tool Profile

**Status (2026-09-18 screen audit correction):** LIVE. Audited against CONTRACT-2-tool-profile-FINAL.md — compliant, no deviations found.

**Route:** `/tools/[slug]`
**Status:** NOT STARTED (no route under `PRD/app/apps/forum/src/app/`)
**Contract:** PRD/02-contracts/wave-2/CONTRACT-2-tool-profile-FINAL.md
**Slice(s):** SLICE-P4-04 (registry backend + profile surface with two labeled segments, honest zero-state, SSR/noindex — ratings render zero-state only), SLICE-P4-05 (tool ratings submit/update/withdraw + R-AGG + recompute + auto-flag — the rating form itself)

## Layout

Derived from contract §6 (Components Used) + the inventory's "Profile + two labeled segments + rating form" archetype only:

```
┌───────────────────────────────────────────────┐
│ Tool profile                                  │
│  [archived banner — status=archived (CAP-119, │
│   persistent banner; aggregate frozen)]       │
├───────────────────────────────────────────────┤
│ TWO LABELED SEGMENTS (mandatory; conflation   │
│ prohibited):                                  │
│ ┌──────────────────────┐ ┌─────────────────┐ │
│ │ COMMUNITY AGGREGATE  │ │ EDITORIAL       │ │
│ │ Stats Card (§11.3) — │ │ VERDICTS        │ │
│ │ overall + per-       │ │ (tools          │ │
│ │ dimension averages   │ │ editorialVerdict│ │
│ │ from tools aggregates│ │ * fields; empty │ │
│ │ honest zero-state    │ │ state when      │ │
│ │ when ratingCount=0   │ │ fields empty)   │ │
│ └──────────────────────┘ └─────────────────┘ │
├───────────────────────────────────────────────┤
│ Rating form (eligible member; edit mode if    │
│  existing active rating):                     │
│  overallScore 1–5 · dimensionScores           │
│  (ease_of_use · output_quality · reliability ·│
│  value_for_money — not_applicable ONLY on     │
│  value_for_money) · optional reviewText       │
├───────────────────────────────────────────────┤
│ Ratings page — user ratings (Avatar rows),    │
│  paginated via ratingsPage                    │
└───────────────────────────────────────────────┘
```

Whether the two segments render side-by-side or stacked is not specified — the contract only mandates "two labeled segments" with no single §11 component (tabs flagged as an incomplete option). No profile-header layout, logo placement, or page width is specified in the contract.

## Components required

- Stats Card — community aggregate (§11.3, usage: "profile insights") → `PRD/app/apps/forum/src/components/ui/card.tsx` (generic card as host; §11.3's Stats Card is a STYLE-KIT pattern, the library has no stats-card variant)
- Two labeled segments — if implemented as tabs → `PRD/app/apps/forum/src/components/ui/tabs.tsx`
  - ⚠️ tabs has zero production usage — expect possible integration friction, report don't silently patch.
  - Contract caveat: §11.8 lists a Tab in the state matrix but §11 has no dedicated Tab spec section — the two-segment layout has no fully specified primitive (flag).
- Select — `not_applicable` (§11.2) → `PRD/app/apps/forum/src/components/ui/select.tsx`
  - ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- Radio or Slider — 1–5 scores (control unspecified by register, §11.2) → MISSING: neither Radio nor Slider exists in the library — no 1–5 score input primitive.
- Textarea — `reviewText` with character counter (§11.2) → MISSING: Textarea does not exist in the library — `ui/input.tsx` is the only text-entry primitive.
- Button Primary (submit — Loading + Disabled) · Button Ghost (edit) · Button Destructive (withdraw — variant unspecified, flagged not chosen) (§11.1) → `PRD/app/apps/forum/src/components/ui/button.tsx`
- Avatar — rater identity in ratings page (§11.6) → `PRD/app/apps/forum/src/components/ui/avatar.tsx` (also present: `avatar-with-name.tsx`, `user-avatar.tsx` — outside both maturity lists)
- Toast — 403 rejection feedback (§11.7) → `PRD/app/apps/forum/src/components/ui/toast.tsx`
- Modal / Bottom Sheet — withdrawal confirmation (§11.7) → `PRD/app/apps/forum/src/components/ui/dialog.tsx` (covers the modal; MISSING: no bottom-sheet primitive exists for the mobile replacement)
  - ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- Skeleton (§11.9) → `PRD/app/apps/forum/src/components/ui/skeleton.tsx`
  - ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- Archived banner (CAP-119 — persistent) → `PRD/app/apps/forum/src/components/ui/banner.tsx`
  - ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
  - Contract caveat: §11.7 Toast is transient — the contract flags **no persistent banner** pattern in §11; `banner.tsx` is the library's nearest host, fit unverified.
- MISSING: rating-input / star / dimension-rating composite does not exist in the library (no star or dimensional rating control with N/A; Slider/Radio absent too).
- MISSING: pagination control for `ratingsPage` does not exist in the library (§11 has none).
- MISSING: Tool Logo / image component for `logoAssetId` does not exist in the library.
- MISSING: community-rating distribution, editorial-verdict card, and review-list-item components do not exist in the library.

## States required

(Copied verbatim from CONTRACT-2-tool-profile-FINAL.md §3)

1. **Two labeled segments (mandatory)** — **community aggregate** (from `tools`: overall = `ratingSum/ratingCount`; per-dimension averages from `dimensionSums/dimensionCounts`) vs **editorialVerdicts** (from the **`tools` editorialVerdict* fields** — CAP-535's write target, staff-assigned, display-only, never aggregated; *source corrected 2026-08-23, Wave 2 item #4: no longer `postReviews.verdictScore`*) — returned distinctly by CAP-110 / R-VERDICT. Segment conflation is prohibited. Empty editorialVerdict* fields → segment renders its empty state.
2. **Honest zero-state** — `ratingCount=0`: render an explicit zero-state, not editorial verdicts masquerading as the community aggregate (CAP-110).
3. **Ratings page** — `ratingsPage` pagination of user ratings (cursor mechanics undefined — Open Questions).
4. **Rating form (eligible)** — verified, non-staff, no active rating: `overallScore` (1–5 int) · `dimensionScores` (`ease_of_use · output_quality · reliability · value_for_money`, each 1–5 int; `not_applicable` supported **only on `value_for_money`** — resolved W2-E6, enum note authoritative) · optional `reviewText`.
5. **`not_applicable` dimension** — increments neither sum nor count (CAP-112).
6. **Existing active rating → edit mode** — R-ONE rejects resubmission; `toolRatings.update` applies prior→new eligible delta atomically (CAP-113).
7. **Withdraw** — `status=withdrawn`; aggregate decremented; excluded from aggregate (CAP-117).
8. **Privileged-role / persona attempt** — server rejects **403 `RATING_STAFF_FORBIDDEN`** (R-STAFF); data-model is explicit: *reject, not UI-hide*; personas cannot write (no userId). Covers editor/publisher/moderator/store_operator/support_operator/administrator.
9. **Duplicate active rating** — R-ONE reject (one active per (userId, toolId)) (CAP-112).
10. **Auto-flagged submission** — CAP-112: `moderationStatus=passed` on submit (reactive) **unless auto-flag**; a flagged rating awaits moderation (CAP-114, admin-side W7). **Auto-flag is now a real, specified mechanism (resolved W2-E5):** CAP-533 (M5) — System auto-flags a rating for review when a threshold is breached (e.g. rating velocity, outlier score pattern); flag target = `moderationCases` row with `target=toolRatings` row (consistent with CAP-127's precedent). Threshold is admin-configurable (default TBD); exact trigger formula is intentionally unspecified post-launch tuning.
11. **Moderation-derived display** (governed by CAP-114, actions occur on the moderation screen): passed → aggregate-eligible · held/removed/withdrawn → excluded · restored → delta reapplied.
12. **Archived tool** — `status=archived`: noindex (CAP-118), aggregate frozen, archived banner (CAP-119).
13. **Draft tool** — noindex (CAP-118).

*(GPT enumerated each privileged role and each per-dimension score as discrete states; folded above — same substance.)*

## Component library maturity note

- ⚠️ tabs has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- button, card, avatar, toast are production-proven — no warning.
