---
id: S00-T04
type: BUILD
author-model: GLM
tool: zcode
round: 1
status: DRAFT
date: 2026-10-03
---

# S00-T04 — No fabricated data — build report

**Spec:** `specs/S00-SPEC.md` §11 row S00-T04. **Branch:** `s00-t04-no-fabricated-data` (based on `s00-fix-tz-tests` — see Deviation 6). **Commits:** this report ships with the build commit.

## What changed
| File | Change | LOC ± |
|---|---|---|
| `apps/forum/src/lib/labels.ts` | **New** — `POST_TYPE_META`: label + Discover one-liner per post type, mirrored verbatim from postTypeConfig (`convex/seed.ts`) + `POST_TYPE_DESCRIPTIONS` (`convex/categories.ts`) | +38 |
| `apps/forum/src/app/(app)/(content)/category/[slug]/page.tsx` | **Rewrite** — live feed: slug validated against `POST_TYPE_META` (the 10 schema type literals) → `CanonicalFeedClient initialTypeFilter={slug}`; header = label + one-liner; unknown slug `notFound()` | +41/−27 |
| `apps/forum/src/app/(app)/(content)/category/[slug]/category-preview-loader.tsx` | **Delete** — the static "Maya Chen @mayabuilds" seed preview (CS §2.13 P0) | −15 |
| `apps/forum/src/app/(app)/(content)/content/page.tsx`, `content-page-client.tsx`, `content/spark/page.tsx` | **Delete** — orphan demo wrappers rendering the same `_seed` data (Deviation 1) | −80 |
| `apps/forum/src/app/(app)/(content)/content/_seed.ts` | **Keep** — runtime-dead now; type exports still imported by `components/content/*` (T15 dead-code pass owns the family) | 0 |
| `apps/forum/src/components/feed/canonical-feed-client.tsx` | **Extend** — optional `emptyState` prop: designed Empty (`PenLine` icon, heading, "Write one" → `router.push(/new-post?type=…)`) replaces the generic empty card when the filtered feed has no cards | +34 |
| `apps/forum/src/app/(app)/(shell)/leaderboard/leaderboard-page-client.tsx` | **Rewrite** — `categoryMultiplier` (charCodeAt % 5), `windowScore`, the 24H/7D/1M selector and the "M12 / interim" footnote deleted. Overall = the real `feed.getChrome` podium projection (min-25 forming card, CAP-294); the 4 category boards render `EmptyState "Not enough activity yet"` unconditionally until CR-006 | −61/+49 |
| `apps/forum/src/lib/__tests__/fixtures-import.test.ts` | **New** — §11 scan: no file under `src/app/**` may value-import a seed/fixtures/mock path (tests, `/kit`, `/lab` exempt; `import type` stripped — types can't render). Includes a matcher self-test (flags `_seed`/`mocks/`/`seed-demo`; passes `import type` + `seedless`) | +75 |
| `category/[slug]/__tests__/category-page.test.ts`, `leaderboard/__tests__/leaderboard-page.test.ts` | **New** — acceptance source+DOM-adjacent assertions (see Evidence) | +53 +34 |
| `apps/forum/src/components/ui/__tests__/feed-thread-review-fixes.test.tsx` | **Extend** — one-line `next/navigation` mock (the feed client gained a router dep via the empty-CTA) | +2 |

## Deviations from the spec (and why)

1. **`/content` + `/content/spark` deleted** (not in T04's file list). The §11 fixtures-import scan is absolute over `app/**`, and these two orphan demo routes value-imported the same `_seed` data (nothing links to them — verified by grep; CS §3 called them "thin content wrappers"). D-012 covers them exactly like `/category`; deleting them is the only way the scan goes green. Flagging for Opus since it removes two routes.
2. **Window selector (24H/7D/1M) removed**, not just the multipliers. §11's letter deletes the `charCodeAt % 5` derivation, but `windowScore` (×0.23 / ×0.3 formulas) was equally client-invented — any window render on Overall would violate "never client-invented ranks". The CONTRACT-6 15-cell model returns with CR-006's real projections.
3. **`lib/labels.ts` created in T04** (file listed under T13). §11's category header requires the label map now; T13 extends it to the remaining domains.
4. **Category boards show the designed Empty regardless of the 25-contributor floor.** Previously `forming` masked every board; now forming is an Overall-only state (CAP-294 is the Overall activation floor) and the category Empty is unconditional until CR-006, per §11's "category tabs show a designed Empty".
5. **`_seed.ts` kept.** After the route deletions its data constants are runtime-dead, but 9 `components/content/*` files type-import it. Moving the types = 10-file churn into T15's dead-code scope.
6. **Branch stacking.** `s00-t04-no-fabricated-data` sits on `s00-fix-tz-tests` (the CRLF test-determinism fix, pushed unmerged for Grok). Stacking keeps this machine's gate honestly green (987/987); **merge the fix branch first**.
7. Locked types (`launch_pad`, `gigs`) render label-only headers — no invented one-liner. Their empty feed shows the same designed Empty.

## Evidence
- Screenshots under `specs/S00-evidence/T04/` (local backend, real seeded data): `category-review-{dark,light}-390`, `category-review-dark-1440`, `category-gigs-empty-dark-390`, `category-unknown-404-dark-390`, `leaderboard-overall-dark-390` (forming), `leaderboard-category-empty-{dark,light}-390`. DOM-verified in-session: review page rendered 13 real seeded review cards (authors: Luca Rossi, Mateo Reyes, Amina Okonkwo, Iris Kwan, …) — no "Maya Chen @mayabuilds"; `/category/definitely-not-a-type` → 404; gigs empty heading + "Write one" CTA counts = 1; "Podium is forming" (Overall) and "Not enough activity yet" (Best Reviewer tab) counts = 1.
- **RED** (pre-implementation, this tree): fixtures scan failed with 3 violations (`category-preview-loader` → `content/_seed`, `content-page-client` → `./_seed`, `spark/page` → `../_seed`); leaderboard suite 3/4 failed (charCodeAt + interim footnote present, no EmptyState); category suite failed at load (`lib/labels.ts` missing). `Tests 4 failed | 2 passed (6)` + 1 suite load error.
- **GREEN**: the three new suites 12/12; full gate `test:run` **987/987** (975 + 12 new), `typecheck` ✅, `lint` ✅. cap-coverage untouched (no slice-catalog change). Convex untouched (read-only `feed.list` arg).
- Acceptance checklist (spec §12 row T04):
  - `/category/review` shows real seeded review posts (no "Maya Chen @mayabuilds") — ✅
  - unknown slug 404 — ✅
  - leaderboard category tabs show Empty, Overall unchanged — ✅ (Overall: same forming card + real entries path; windows/multipliers gone per Deviation 2)
  - test green — ✅ (fixtures-import scan + category + leaderboard suites)
  - visible at 390 dark AND light — ✅ (review + leaderboard both themes; 1440 captured)
  - self-check is not acceptance — noted; Grok reviews.

## Open issues / questions for Opus
- Deviation 1 (two orphan demo routes deleted) and Deviation 2 (window selector gone until CR-006) deserve a founder glance — both are honest-state trade-offs forced by D-012.
- Leaderboard subtitle now reads "The Podium, expanded — 5 categories." (was "5 categories × 3 windows") — founder-owned copy check.
- `TrendSorter` "Fav" tab on a category page shows the saved-posts empty copy (generic) rather than the category Empty — pre-existing behavior, out of T04 scope.
