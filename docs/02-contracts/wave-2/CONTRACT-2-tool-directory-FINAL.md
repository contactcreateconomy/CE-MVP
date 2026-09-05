# CONTRACT-2-tool-directory-FINAL

**Screen:** Tool Directory — `/tools`
**Wave:** 2 (M5 Tool Registry & Review Spine)
**Template archetype:** Grid/list + filter
**Primary CAP-IDs:** CAP-111
**Actor:** anonymous, member
**Reconciliation:** All three aligned on the single-CAP spine. GPT's finer combined-filter enumeration folded in as non-normative; grid/list view-mode confirmed ungoverned by all three. See RECONCILIATION-2 §3.

---

## 1. Route & Access
- **Path:** `/tools`. **Dynamic params:** none. **Actors:** anonymous, member (inventory).
- **Query capability:** `tools.list` — paginated/filterable by **category, tag, search** (CAP-111).
- **Gated by:** CAP-108 (tool creation is operator-side; no user-facing gate on browse).
- ⚠️ CAP-111's actor column says **member** while the inventory lists anonymous+member — anonymous browse authorization is not stated in the register (Open Questions).
- **Redirect rules:** none stated.

## 2. Entities
- **CAP-111** (`tools.list`): Reads `tools, categories, toolTags` · Writes **none**.
- **Canonical tag relationship:** `toolTags` is the join between `tools` and `tags`; no `tagIds[]` array may be inferred.

## 3. States
1. **Default browse** — paginated listing (CAP-111: "Paginated/filterable (category, tag, search)").
2. **Filtered by category** — the 5 locked topic set.
3. **Filtered by tag** — `toolTags` join.
4. **Search-filtered.**
5. **Combined filters** — CAP-111 permits category + tag + search parameters on the one query and does not forbid combining them (category+tag, category+search, tag+search, all-three). *[GPT enumerated each combination as a discrete state; folded here as one "combined filters" state — same substance.]*
6. **Paginated** — first page / subsequent page / cursor advance.
7. **Loading** — §11.9 skeleton card variants (component-level; the register defines no screen-level loading contract here).

*(No empty/zero-result state, no invalid-category/tag behavior, and no `tools.status` inclusion rule are defined by CAP-111 — Open Questions.)*

## 4. Actions → API
1. **Browse / filter / search directory** — `tools.list` query (CAP-111, §9 tools.list). Category, tag, and search are **parameters of the one query**; no separate filter/search mutations are named.
2. **Load next page** — `tools.list` (same query, cursor advance) — CAP-111.
3. **Switch grid/list presentation** — **no query/mutation and no CAP-governed persistence rule is specified** (inventory archetype says "grid/list," but CAP-111 defines no view-mode parameter).

## 5. Analytics Events
**None identified within Wave-2 scope.** No M16 catalog row references `tools.list`, and CAP-111 writes none (no `rawEvents`). If instrumented as observational events (page view, filter use, search, pagination), they fall under CAP-444 and require an active event-catalog definition + consent-compliant client capture; the exact `eventCatalog.eventName` is not supplied.

## 6. Components Used
- **Search Input** (search icon left, X-clear right, focus-expand) · **Select** (chevron-down; category/tag filter) — §11.2.
- **Category pill** / **Tag** (clickable filters; Tag has a defined Hover state) — §11.5.
- **Button Secondary / Ghost** (filter / pagination affordances) — §11.1.
- **Dropdown / Popover** (filter menus) — §11.7.
- **Skeleton** (loading grid; §7.3 STAGGER CHILDREN for grid load) — §11.9. Grid constants: "Grid cards: 16px both axes" (§4.2).
- **Archetype gaps — flag, not invented (all three agree):**
  - **No Tool Card component** — §11.3 defines Post/User/Stats/Notification/Widget cards only.
  - **No filter-bar / facet-sidebar pattern.**
  - **No pagination control exists anywhere in §11** (affects this screen, ratings pages, and later admin tables).
  - **No named segmented grid/list view-mode control** (Lucide `layout-grid` / `list` icons exist, §9.3, but no composed control).
  - **No logo/image display component** for `tools.logoAssetId` (§11 has only an Image *skeleton*, §11.9).

## 7. Open Questions
1. **Actor mismatch** — CAP-111 actor = member vs. inventory anonymous+member; explicit public-query authorization is missing.
2. **Directory card contents** — which `tools` fields render (aggregate rating? pricing? logo?) is unspecified; Reads permit them but the register names none.
3. **`tools.status` inclusion** — whether archived/draft tools are excluded from the listing is unspecified (the field exists; CAP-111 states no status filter).
4. **Empty/zero-tools state** — no register row covers a tools empty state (R-EMPTY / CAP-371 reads posts/comments/resources/distributions, not tools), unlike CAP-110's explicit `ratingCount=0` zero-state on the profile.
5. **Default sort + available sort modes** — not specified.
6. **Query-parameter names** for category, tag, search, cursor, and grid/list mode — not specified.
7. **Default grid/list mode + persistence** — not specified; no CAP governs view-mode.
8. ~~**Directory indexability** — CAP-118 covers tool-*profile* SEO and CAP-486 marks feed/search noindex, but **no CAP governs whether `/tools` (the directory) is indexable.**~~ **RESOLVED (FATAL-M17-01 fail-closed default, 2026-08-23):** indexability unspecified = **noindex by default** (fail-closed pattern) until an explicit capability states otherwise (CAP-111 Notes amended).
9. **Directory search vs. global `/search` overlap** — CAP-111's in-directory search filter and the global `/search` (CAP-529, which explicitly includes tools) both search tools; their relationship/precedence is unspecified.
