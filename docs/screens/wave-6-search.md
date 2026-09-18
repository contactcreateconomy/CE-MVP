---
# Search Results (posts / tools / profiles)

**Route:** `/search`
**Status:** LIVE — PRD/app/apps/forum/src/app/(app)/(shell)/search/page.tsx (+ search-page-client.tsx, loading.tsx in the same directory) — route matches spec
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-search-FINAL.md
**Slice(s):** P6-05

## Layout
Derived from contract §6 (Components Used) + inventory Template archetype "Search results grid + filters":

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top header (§11.4) — search bar / Search Input (§11.2) — entry point    │
├────────────────────────────────────────────────────────────────────────┤
│ /search — results grid + filters                                       │
│  result-class tabs/pills (§11.5, "if used"): posts · tools · profiles   │
│  (the archetype's "filters" maps ONLY to these three named scopes —     │
│   no other filter dimensions are registered, search OQ9)                │
├──────────────────────────────┬─────────────────────────────────────────┤
│  POST CARDS (§11.3)          │  USER CARDS (§11.3)                      │
│  title/body keyword match    │  handle / display-name match (`users`)   │
│  → /p/[slug]                 │  → /u/[handle]                           │
├──────────────────────────────┴─────────────────────────────────────────┤
│  TOOL results — grid/card primitive (no dedicated Tool Card, §11 gap)   │
│  name match → /tools/[slug]                                             │
├────────────────────────────────────────────────────────────────────────┤
│  Zero-results state — unspecified in the register (OQ2; nothing         │
│  invented; empty-state.tsx exists in the library as the available       │
│  pattern)                                                               │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- Top-header search bar (§11.4) / Search Input (§11.2) → apps/forum/src/components/ui/input.tsx
- Post Card + User Card (§11.3 card family) → apps/forum/src/components/ui/card.tsx (generic card base)
- Tool result grid/card primitive → apps/forum/src/components/ui/card.tsx — MISSING: dedicated Tool Card does not exist in the library (contract §6 archetype gap)
- Result-class tabs/pills (§11.5, "if used") → apps/forum/src/components/ui/badge.tsx (pills) and apps/forum/src/components/ui/tabs.tsx (if tabbed; contract leaves interleave-vs-tabbed unspecified, OQ3)
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- Zero-results state (unspecified, OQ2) → apps/forum/src/components/ui/empty-state.tsx (available pattern; copy must not be invented — flagged, OQ2)
- MISSING: Mixed-entity search-result component does not exist in the library (contract §6 archetype gap)

## States required
*(Kept to CAP-529's specified branches. All three panels converged on not over-building empty/loading/error states beyond what the row specifies — the register defines exactly these branches.)*

**A. Query submitted → results, three result classes:** posts (title/body match) · tools (name match) · profiles (handle/display-name match on `users`). Keyword/text match only.
**B. Exclusion state (invisible, applied within results):** moderation-hidden/removed content excluded (M13); non-visible profiles — `users.profileVisibility=private` (CAP-552 write target) exclusion unspecified (Open Question).
**C. Zero-results state:** unspecified in the register — flagged, no copy invented (Open Question).
**D. Actor branches:** anonymous (same read-only results, no personalization) · member (identical result set; no personalization registered).

## Component library maturity note
- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ tabs has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ empty-state has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button, card, avatar, toast.
---
