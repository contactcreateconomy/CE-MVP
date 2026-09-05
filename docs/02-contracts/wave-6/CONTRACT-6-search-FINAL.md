# CONTRACT-6-search-FINAL

**Screen:** Search Results (posts / tools / profiles) — `/search`
**Wave:** 6A (M9 Feed & Discovery)
**Template archetype:** Search results grid + filters
**Primary CAP-IDs:** CAP-529
**Actors:** anonymous, member
**Reconciliation:** All-agree on scope (basic keyword, no ML). **E6 CLOSED 2026-08-25** (handle/displayName live on `users`, not `profiles`). States: kept to CAP-529's specified branches (all three converged on not over-building). See RECONCILIATION-6A §3.

---

## 1. Route & Access
- **Path:** `/search`. **Query param:** search string. **Actors:** anonymous, member. Single governing CAP **CAP-529**, `Gated by: none`.
- **Scope discipline (founder decision, Phase 1.5 healing, register-verbatim):** basic functional **keyword/text match only — no ML ranking, not exploratory, not ranked.** Scope: **post title/body · tool name · profile handle/display name.**
- **Registered branch delta:** **anonymous gets the same read-only results, no personalization** (CAP-529 Note); member results are the identical set (no member personalization is registered either).
- **Moderation:** excludes moderation-hidden/removed content (M13).
- **noindex** — CAP-486 lists `/search`; CAP-529's Note confirms the reference "is now grounded."
- No create/update capability exists on this route.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `posts` | read | scope: **title/body** keyword match; published/visible only; moderation-filtered (M13) |
| `tools` | read | scope: **name** match; visible records |
| `users` | read | scope: **username** (handle) + **displayName** — **E6 CLOSED.** These fields live on `users`, not the M7 `profiles` attribute table. **Never reads `privateUserData` / `mobileNumber`.** |
| `profiles` | not a search source | verified: `profiles` holds roleArchetype/ageBand/toolsUsed/bio/consentFlags — none of those are in CAP-529's stated scope (handle/display name only). Not queried. |
| `rawEvents` | write | query logged, privacy-respecting |

- Search writes no post/tool/user domain entity; does not read sealed persona-genome or other non-public data.

## 3. States
*(Kept to CAP-529's specified branches. All three panels converged on not over-building empty/loading/error states beyond what the row specifies — the register defines exactly these branches.)*

**A. Query submitted → results, three result classes:** posts (title/body match) · tools (name match) · profiles (handle/display-name match on `users`). Keyword/text match only.
**B. Exclusion state (invisible, applied within results):** moderation-hidden/removed content excluded (M13); non-visible profiles — `users.profileVisibility=private` (CAP-552 write target) exclusion unspecified (Open Question).
**C. Zero-results state:** unspecified in the register — flagged, no copy invented (Open Question).
**D. Actor branches:** anonymous (same read-only results, no personalization) · member (identical result set; no personalization registered).

## 4. Actions → API

| Action | Actor | CAP | Reads | Writes | Gates |
|---|---|---|---|---|---|
| Submit search query | anonymous, member | CAP-529 — **no mutation/query name given in the row** (Open Question; not invented) | posts, tools, users (username, displayName) | rawEvents (query logged) | none named |

- **Open post result** → navigates to the existing Post Detail route (`/p/[slug]`).
- **Open tool result** → navigates to the existing Tool Profile route (`/tools/[slug]`).
- **Open profile result** → navigates to `/u/[handle]`.
- No filtering, sorting, saving, following, or recommendation mutation is defined by CAP-529.

## 5. Analytics Events
One `rawEvents` write per submitted query — "query logged, privacy-respecting" (verbatim). **eventType literal unnamed** — catalog-owned (CAP-437; `eventCatalog.piiClass` is mandatory for any query-text-bearing event — Open Question). rawEvents never consent-gated (FATAL-M18-02); PostHog mirror separate (CAP-442). No result-click event is specified. Search analytics must not contain sealed/private profile fields (`privateUserData`, mobile numbers).

## 6. Components Used
- Search-results grid archetype · entry point = **top-header search bar** (§11.4 Top Header) · **§11.3 card family** — Post Card (post results), User Card (profile results), grid/card primitive for tool results (**no dedicated Tool Card in §11** — archetype gap) · **§11.5 Pill/Tag** (result-class tabs if used — the archetype's "filters" maps only to the three named scopes; no other filter dimensions registered) · **§11.9 Skeleton** · Search Input §11.2 · zero-results pattern undefined (nothing invented).
- **Archetype gaps:** no mixed-entity search-result component; no dedicated Tool Card.

## 7. Open Questions
*(Escalated item E6 is closed. These remaining items are unspecified detail.)*
1. **No mutation/query name** for CAP-529 (every sibling read surface has one — `feed.list`, `tools.list`). (All three.)
2. **Zero-results / error states + copy** — unspecified. (GLM + GPT.)
3. **Pagination / result-cap / ordering-within-type / interleave-vs-tabbed** — unspecified (unlike `posts.listByType` CAP-091's R-PAGINATE). (All three.)
4. **Private-profile exclusion** — `users.profileVisibility=private` (CAP-552 write target); exclusion from profile results unspecified. (GLM + Opus.)
5. **Deterministic default ordering** — "no ML ranking" ≠ no ordering; register silent on fallback sort/tie-break. (GLM + GPT.)
6. **Visible-content filter values** — which `moderationStatus` values count as searchable (posts: not_required/passed per CAP-107 precedent — inference, not stated here). (GLM.)
7. **No rate-limit row for search** (§8 covers waitlist/auth/admin/report/media; search has none) — possible missing guard vs. the register's rate-limit convention. (GLM.)
8. **Query-text `piiClass`/retention** — eventCatalog entry needed (mandatory piiClass); "privacy-respecting" undefined. (GLM.)
9. **Filters in the screen name but not the CAP** — inventory titles it "grid + filters," but CAP-529 defines only keyword match with no filter dimensions; whether category/type filters exist is a screen-title implication with no capability behind it. (GPT + Opus.)
10. **Query normalization / min-max length / typo handling** — unspecified. (GPT.)
