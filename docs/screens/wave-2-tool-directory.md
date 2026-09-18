# Tool Directory

**Route:** `/tools`
**Status:** NOT STARTED (no route under `PRD/app/apps/forum/src/app/`)
**Contract:** PRD/02-contracts/wave-2/CONTRACT-2-tool-directory-FINAL.md
**Slice(s):** SLICE-P4-04 (tools registry backend + `/tools` + `/tools/[slug]`)

## Layout

Derived from contract §6 (Components Used) + the inventory's "Grid/list + filter" archetype only:

```
┌──────────────────────────────────────────────┐
│ Filter/search bar:                           │
│  Search Input (search icon left, X-clear     │
│    right, focus-expand — §11.2)              │
│  Select(s) — category / tag filter (§11.2)   │
│  Category pill / Tag as clickable filters    │
│    (§11.5; Tag has a defined Hover state)    │
│  Dropdown / Popover filter menus (§11.7)     │
├──────────────────────────────────────────────┤
│ Tool card grid                               │
│  grid gap constant: "Grid cards: 16px both   │
│  axes" (§4.2)                                │
│  ┌─────┐ ┌─────┐ ┌─────┐                     │
│  │     │ │     │ │     │  (grid/list view-   │
│  └─────┘ └─────┘ └─────┘   mode switch is    │
│  loading = skeleton grid, §11.9,             │
│    §7.3 STAGGER CHILDREN                     │
│    — view-mode ungoverned by any CAP)        │
├──────────────────────────────────────────────┤
│ Pagination / next-page affordance            │
│  (Button Secondary / Ghost)                  │
└──────────────────────────────────────────────┘
```

What renders inside each card is **unspecified** (contract Open Question 2 — which `tools` fields render: aggregate rating? pricing? logo? are all unnamed). Filter-bar arrangement (bar vs facet sidebar) is likewise an undefined pattern (§11 has no filter-bar/facet-sidebar).

## Components required

- Search Input (§11.2) → `PRD/app/apps/forum/src/components/ui/input.tsx`
  - ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- Select — category/tag filter (§11.2) → `PRD/app/apps/forum/src/components/ui/select.tsx`
  - ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- Category pill / Tag, clickable filters (§11.5) → `PRD/app/apps/forum/src/components/ui/badge.tsx`
  - ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- Button Secondary / Ghost — filter + pagination affordances (§11.1) → `PRD/app/apps/forum/src/components/ui/button.tsx`
- Dropdown / Popover — filter menus (§11.7) → `PRD/app/apps/forum/src/components/ui/dropdown-menu.tsx`
  - ⚠️ dropdown-menu has zero production usage — expect possible integration friction, report don't silently patch.
- Skeleton — loading grid (§11.9) → `PRD/app/apps/forum/src/components/ui/skeleton.tsx`
  - ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- Tool card — MISSING: no Tool Card component exists in the library (§11.3 defines Post/User/Stats/Notification/Widget cards only); compose from `PRD/app/apps/forum/src/components/ui/card.tsx` (production-proven generic card)
- List view mode — `PRD/app/apps/forum/src/components/ui/data-table/index.tsx` exists as a candidate for the "list" presentation, but the view-mode itself is ungoverned (contract §4 Action 3: no CAP, no persistence rule)
  - ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- MISSING: filter-bar / facet-sidebar pattern does not exist in the library.
- MISSING: pagination control does not exist anywhere in the library (contract flags: affects this screen, ratings pages, and later admin tables).
- MISSING: segmented grid/list view-mode control does not exist in the library (Lucide `layout-grid` / `list` icons exist, §9.3, but no composed control).
- MISSING: logo/image display component for `tools.logoAssetId` does not exist in the library (`image-uploader.tsx` is upload input, not display; §11 has only an Image *skeleton*, §11.9).

## States required

(Copied verbatim from CONTRACT-2-tool-directory-FINAL.md §3)

1. **Default browse** — paginated listing (CAP-111: "Paginated/filterable (category, tag, search)").
2. **Filtered by category** — the 5 locked topic set.
3. **Filtered by tag** — `toolTags` join.
4. **Search-filtered.**
5. **Combined filters** — CAP-111 permits category + tag + search parameters on the one query and does not forbid combining them (category+tag, category+search, tag+search, all-three). *[GPT enumerated each combination as a discrete state; folded here as one "combined filters" state — same substance.]*
6. **Paginated** — first page / subsequent page / cursor advance.
7. **Loading** — §11.9 skeleton card variants (component-level; the register defines no screen-level loading contract here).

*(No empty/zero-result state, no invalid-category/tag behavior, and no `tools.status` inclusion rule are defined by CAP-111 — Open Questions.)*

## Component library maturity note

- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dropdown-menu has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- button, card are production-proven — no warning.
