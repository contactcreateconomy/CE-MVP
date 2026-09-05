# CONTRACT-2-tool-profile-FINAL

**Screen:** Tool Profile — `/tools/[slug]`
**Wave:** 2 (M5 Tool Registry & Review Spine)
**Template archetype:** Profile + two labeled segments + rating form
**Primary CAP-IDs:** CAP-110, CAP-112, CAP-113, CAP-117, CAP-118 (+ CAP-119 archived-state, adjacent)
**Actor:** member
**Reconciliation:** Route/Access, Entities, Actions, States all aligned. Three shared escalations (withdraw mutation name, rating auto-flag, N/A dimension scope). See RECONCILIATION-2 §4.

---

## 1. Route & Access
- **Path:** `/tools/[slug]`. **Dynamic param:** `[slug]` (`tools.slug`, unique). **Actor:** member (inventory).
- **Interactive load:** `tools.getProfile` (CAP-110, actor member). ⚠️ CAP-118 (System) performs the SSR public render — same anonymous-read tension as `/tools` (Open Questions).
- **Rating submission gated by M1 R-CUSTOMER-GUARD** on CAP-112. **Eligibility (CAP-112):** verified member (R-DAY1 "Open to verified members day 1") AND non-staff / no privileged role (R-STAFF) AND no existing active rating (R-ONE, unique one active per (userId, toolId)).
- **Edit access:** owner of the existing rating (CAP-113). **Withdraw access:** owner of the existing rating (CAP-117).
- **Indexability:** `status=active` → SSR + indexable; `archived` / `draft` → noindex (CAP-118). **noindex (Wave 2 default, flips at Wave 7 per CAP-468)** — indexability gated behind CAP-468 (provenance block: /how-we-review, /editorial-policy, /ai-disclosure links + provenance metadata); FATAL-M17-01 requires same-wave pairing, never separated (founder decision 2026-08-23; CAP-118 Notes amended).
- **Archived access:** CAP-119 keeps the profile renderable with an **archived banner** and **freezes** the aggregate.
- **Redirect rules:** none stated.

## 2. Entities
- **CAP-110** (`tools.getProfile`): Reads `tools, toolRatings, postReviews` · Writes **none**. Returns `{tool, aggregate, editorialVerdicts, ratingsPage}` — *editorialVerdicts sourced from the `tools` editorialVerdict* fields (CAP-535 write target; corrected 2026-08-23, Wave 2 item #4 — formerly read as `postReviews.verdictScore`)*.
- **CAP-112** (`toolRatings.submit`): Reads `tools, toolRatings, roleAssignments, users` · Writes `toolRatings, tools (ratingSum/ratingCount/dimensionSums/dimensionCounts deltas)`.
- **CAP-113** (`toolRatings.update`): Reads `toolRatings, tools` · Writes `toolRatings, tools (R-AGG delta)`.
- **CAP-117** (withdraw): Reads `toolRatings, tools` · Writes `toolRatings (status=withdrawn), tools (R-AGG decrement)`.
- **CAP-118** (SEO render): Reads `tools` · Writes **none**.
- **CAP-119** (archived tool, adjacent render-state): Reads `tools` · Writes `tools (status=archived)` — aggregate frozen; profile shows "archived" banner.
- **Canonical aggregate invariant:** only eligible human-member `toolRatings` feed `tools.ratingSum/ratingCount/dimensionSums/dimensionCounts`. Curated editorial verdicts live on the **`tools` editorialVerdict* fields** (CAP-535, display-only) and per-review `postReviews.verdictScore` is auto-computed member-content (CAP-086, display-only); **neither ever** enters the community aggregate.

## 3. States
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

## 4. Actions → API
1. **Open tool profile** — `tools.getProfile` (CAP-110, §9 tools.getProfile / R-VERDICT).
2. **Submit rating** — `toolRatings.submit` (CAP-112, §9 toolRatings.submit / R-STAFF / R-ONE / R-DAY1 / R-AGG).
3. **Edit own rating** — `toolRatings.update` (CAP-113, §9 toolRatings.update / R-AGG).
4. **Withdraw own rating** — CAP-117; Source Rule column reads only "**§7 Domain States / R-AGG**" — **no mutation name is given in the register** (→ ESCALATION E-adjacent; Open Questions). *[All three panels independently flagged this absence.]*
5. **Load another ratings page** — `ratingsPage` exists in the CAP-110 response, but no separate query or cursor action is named.
6. *(System)* **SSR render** — CAP-118 (§17 NFR / SEO).
7. **Moderate rating** — `toolRatings.moderate` (CAP-114) — **not a member action on this screen**; display must reflect its held/removed/restored outcomes.

## 5. Analytics Events
**None identified within Wave-2 scope.** CAP-110/112/113/117/118 name no `rawEvents` write, and the visible M16 catalog names no tool-profile view or rating event; capture would be generic same-mutation (CAP-436) only. *(M17's JSON-LD `AggregateRating` rule — CAP-471, ≥3 distinct human raters, personas/staff/editorial excluded, visible copy states exact count — is Wave 7, deferred, not a Wave-2 gap.)*

## 6. Components Used
- **Stats Card** (community aggregate values; §11.3 usage: "profile insights") — §11.3.
- **Two labeled segments** — composed from cards; **no single §11 component**. If implemented as tabs, note §11.8 lists a **Tab** in the state matrix but §11 has **no dedicated Tab spec section** → the two-segment layout has no fully specified primitive (flag).
- **Radio or Slider** (1–5 scores; control unspecified by register) · **Select** (`not_applicable`) · **Textarea** (`reviewText`, character counter) — §11.2.
- **Button Primary** (submit — Loading + Disabled) · **Button Ghost** (edit) · **Button Destructive** (withdraw, if treated as destructive — variant unspecified, flagged not chosen) — §11.1.
- **Avatar** (rater identity in ratings page) — §11.6. **Toast** (403 rejection feedback) — §11.7. **Modal / Bottom Sheet** (withdrawal confirmation) — §11.7. **Skeleton** — §11.9.
- **Archetype gaps — flag, not invented:**
  - **No rating-input / star / dimension-rating composite** in §11 (Slider/Radio exist but no star or dimensional rating with N/A). `star → Points/rating` icon exists (§9.3) but no display component.
  - **No persistent banner** for the CAP-119 archived banner (§11.7 Toast is transient).
  - **No pagination control** for `ratingsPage` (§11 has none).
  - **No Tool Logo / image component** for `logoAssetId`.
  - **No community-rating distribution, editorial-verdict card, or review-list-item** component.

## 7. Open Questions
1. **CAP-117 withdraw mutation name is absent** from the register's Source Rule column ("§7 Domain States / R-AGG" only), though every neighboring mutation is named. → surfaced to founder (RECONCILIATION-2 §4).
2. ~~**Rating auto-flag path is undefined.**~~ **RESOLVED (W2-E5, 2026-08-23):** CAP-533 (M5) added — System auto-flags a rating for review on threshold breach (velocity/outlier pattern); `moderationCases` row targets the `toolRatings` row (CAP-127 precedent). Admin-configurable threshold (default TBD); exact formula deliberately unspecified — flag-mechanism capability, not a specific rule.
3. ~~**N/A dimension scope is internally contradictory.**~~ **RESOLVED (W2-E6, 2026-08-23):** enum note is authoritative — `not_applicable` is supported **only on `value_for_money`**; ease-of-use/output-quality/reliability are always ratable. `_data-model.md` field prose corrected to match. Rating form updated accordingly.
4. **Anonymous read scope** — CAP-110 is actor member; only CAP-118 (SSR) is anonymous-facing. Whether an anonymous visitor sees the full `ratingsPage` + `editorialVerdicts` segments or only the aggregate is unspecified.
5. **Missing-slug HTTP behavior / redirect** — not specified.
6. **`ratingsPage` pagination** — cursor schema, page size, and follow-up query name are not specified.
7. **Editorial-verdict segment has no local writer** — the `postReviews` verdicts shown here originate from Review post-type authoring (CAP-086) elsewhere; this screen only reads them (CAP-110). The segment is empty until Review posts referencing the tool exist; whether it links back to source review posts is unspecified.
8. **Ineligible-but-authenticated presentation** — given "reject, not UI-hide," whether the form renders for everyone with server-side rejection or eligibility is surfaced pre-submit is unspecified.
9. **Withdrawal constraints** — time window, effect on visible review text, and re-rating after withdrawal under R-ONE are unspecified.
10. **CAP-119 inventory attachment** — CAP-119 specifies the archived banner + frozen aggregate, but the primary screen inventory does not list CAP-119 against `/tools/[slug]` (adjacent, not primary).
11. **Seller-affiliated review labeling** ("Seller-affiliated — not in Community Score," CAP-254/255) surfaces on this profile but is **Wave 6 / M11** — deferred, not a Wave-2 gap.
