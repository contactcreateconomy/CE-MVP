# 00-ROUTES — Canonical route names (live names adopted)

**Decision (founder-approved 2026-09-04):** where live code exists, **its route
name becomes canonical** — working routes are not churned. Spec documents
(contracts, screen sheets, slice catalogs, `_data-model` route mentions) are the
side that updates. Resolves FINAL-HOLISTIC-AUDIT **HOL-P2-008** and retires every
"DECISION NEEDED" route-drift flag in `PRD/screens/`.

## The table (authoritative)

| Spec (old canonical) | Live → NEW canonical | Decision |
|---|---|---|
| `/p/[slug]` | **`/discussions/[slug]`** | keep live name (was already accepted in AGENT-START-HERE §1b) |
| `/compose` · `/compose/[type]` | **`/new-post`** | keep live name |
| `/u/[handle]` | **`/users/[handle]`** | keep live name |
| `/settings/profile` | **`/profile` + `/settings`** | keep live split (profile = identity/bio surface; settings = privacy/consents surface). Contracts' field ownership maps across unchanged. |
| `/` (anon landing) | **`/` (anon landing)** | unbuilt — build fresh per CONTRACT-7-landing; the current redirect `/` → `/feed` moves to `/` → landing when it lands (authed `/` continues to `/feed`). |
| `/feed` | `/feed` | match (already canonical) |
| `/search`, `/notifications`, `/privacy`, `/terms` | unchanged | match |
| `/dmca`, `/repeat-infringer` | unbuilt | build fresh at these paths (now served from the versioned-content table per DECISIONS-LOCKED #9) |
| All `/admin/*`, `/sell`, `/s/*` | unchanged | serve from the forum app per 00-TOPOLOGY |

## Consequences

1. **`discussionHrefForPostShape`** (`app/convex/forum/constants.ts`) and the
   `next.config.mjs` `/discussions/mvp` header rule are **already correct** —
   nothing to rename (the pre-rename auth risk-check found no other couplings;
   that analysis is now moot since no renames happen).
2. Screen sheets' "DECISION NEEDED" route-drift rows for compose, post-detail,
   u-handle, settings-profile are **resolved by this document** — treat those
   sheets' Route fields as superseded by this table. (Sheets not edited in place;
   this file is the precedence doc.)
3. New links/sitemaps/SEO machinery use ONLY the new canonical names above.
4. The contracts' route fields remain historically accurate (they describe spec
   intent at drafting time); when a slice builds one of these screens, it uses
   this table's live name and notes the alias in the PR description.
