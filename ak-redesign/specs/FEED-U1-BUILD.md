---
id: FEED-U1
type: BUILD
author-model: Opus
round: 1
status: FOR REVIEW (Grok) → founder in the browser (/lab/feed)
date: 2026-10-12
---

# FEED-U1 — Port the Make look into the canonical display layer — build report

**Source of the look:** `ak-redesign/specs/S02-refs/make/` (Figma Make code + `make-feed-1440.png`, founder-approved).
**Branches:** `feed-u1-port` from `feed-base` @ 737c5ed, with `feed-l77-border-layer` (L-77, its own branch per the decision) merged in. Push only, no merge.
**Commits:** `db461d7` L-77 · `664339b` card (+ the L-51 deletions rode this commit — they were already staged) · `0cedaff` layout/rail/hero · `163375d` lab · report/evidence commit.
**Rules held:** props only, no Convex (D-016) · our tokens + B1 utilities (frost-look / frost-subtle / frost-strong, `lib/motion`, `active:scale-97 active:duration-press`), not Make's CSS · no glow at rest (L-38) · lab fixtures only in `/lab` (D-012).

## What changed
| File | Change |
|---|---|
| `components/feed/feed-display-types.ts` | Card contract rebuilt for §10: `topicLabel`, `updated`, `pinned`, `facet` (review · compare · debate · help · list · showcase · news · meta), `whyCare` (line / best comment), `gravity`, `strings`, `discussing`, `viewer` interactions. `FeedPerson` gets `isEditorial`, `levelLabel`. Podium entries carry `did` (plain words) instead of `points` (R-10); `FeedPodiumDimension`; nav `count`; vibing `shortTitle` / `featured`; hero `featured`. |
| `feed-format.ts` (new) | `formatGravity` (L-62: "18G", "1,240G", "12.4K G" with a thin space, hidden at 0), `stringsLabel` (L-65), `gSwitchReason` (L-63). |
| `feed-g-switch.tsx` (new) | G-switch: "G" mark; capsule slides in and docks once the viewer appreciated / saved / commented / shared; tap = appreciate; title/SR names why; celebrate glow only on the user's own tap (dark only by token); reduced motion = instant. |
| `feed-card.tsx` | Make skeleton: pinned row · identity (avatar / editorial logo mark, name, Level mark, "AI persona" / "Createconomy" labels, mono time, Updated, ⋯) · kind chip (type · topic) · title (Spark larger) · facet · why-care line (hover detail, no height change; best comment expands in place) · footer (G-switch + Gravity, strings, save, share · faces + "N discussing"). `frost-look` surface, hover lift 1px + shadow. ⋯: Why am I seeing this? · Not for me · Hide · Mute @x · Report. |
| `feed-tabs.tsx` | Make sorter: text-only equal tabs, solid brand pill sliding on the settle spring (L-70), Fav `glow-text-new` only on new activity (L-47), hover note after 400ms / first-use tap note (labels from props → config, L-07). |
| `feed-left-nav.tsx` | Start Discussion pill (glow on hover/press only) + `frost-subtle` Discover: types then "Your topics", mono counts (none at 0). New `FeedDiscoverChips` for <lg. |
| `feed-rail.tsx` | Vibing v2 (inner card h-45, context → hook → meta, sequential 6s rotation, pause on hover/focus + pause button WCAG 2.2.2, Featured label) + `FeedVibingTicker`. Podium: "Podium · {window}", dimension picker, crown/number rank, "what they did", Level, Forming state, "Full leaderboard ↗"; `FeedPodiumCard` (mobile in-feed). |
| `feed-page-view.tsx` | §8 grid: max 1000, 170 · fluid · 226, gap 22 (lg+). <lg: chips → sorter → ticker → cards, Podium card after the 5th. New-posts pill (floats, never pushes), caught-up divider. |
| `feed-hero-carousel.tsx` | L-43 large = centred cover-flow (480×270 active, side frames scale 0.8 / brightness 0.45 / 14° turn, **no blur**), compact = cascade with text beside it; no autoplay (L-31); arrows, ← →, wheel lockout, drag; "1 / 5"; CTA pill with ↗ pulsing 3× after reveal (L-38); Featured chip + ring (L-30); tease → reveal once per session. |
| `feed-post-type-meta.ts` | "All" row icon = LayoutGrid (Make). |
| `packages/design-tokens/utilities.css` | `@utility glow-text-new` (L-47, reuses `--glow-primary-text`, none in light) · `@utility no-scrollbar`. |
| `packages/design-tokens/tokens.css` | **L-77**: `* { border-transparent }` moved into `@layer base` (see `L77-evidence/`). |
| `app/(app)/lab/feed/*` | Fixtures from the Make round (all 8 types, all relationship / life-stage lines, mixed viewer states, 5 hero frames incl. Featured, 5 Vibing hooks incl. Featured, Podium dimensions incl. a Forming one); lab state for G / save / vote-to-reveal / Fav clears on open / new-posts pill / hide-undo. |
| Deleted (L-51) | `post-card.tsx`, `post-interaction-row.tsx`, `comments-preview-cycler.tsx`, `post-actions-menu.tsx` — no importers. |
| `src/test/setup.ts` | jsdom stubs: `matchMedia`, `IntersectionObserver` (inert). |

## Proofs
- **RED → GREEN** (`FEED-U1-evidence/`): `red-01-format` → `green-01-format` (7) · `red-02-card` (18 failing) → `green-02-card` (25 incl. format) · `red-03-hero-tease` → `green-03-hero-tease` (the reveal timer was cancelled by its own effect → hero stuck blurred; caught in the first screenshot, test written against the buggy code first). L-77: `L77-evidence/red.txt` → `green.txt`. L-70 test narrowed (only `glow-text-new` may glow on the sorter).
- **Gate:** typecheck 0 · lint 0 (forum + admin) · typecheck:admin 0 · forum tests **80 files / 1042 ✅** · no console errors on `/lab/feed` (dark + light, 390 + 1440).
- **Screenshots:** `u1-feed-{1440,390}-{dark,light}.png` (full page), `u1-feed-1440-{dark,light}-viewport.png`; **side by side with Make:** `compare-make-vs-u1-1440-{dark,light}.png`; copies next to the reference: `S02-refs/make/u1-port-1440-dark{,-viewport}.png`.
- **L-77 before/after:** `L77-evidence/` — themed-border elements with a visible colour: `/lab/feed` 1/48 → 48/48, `/lab/foundation` 0/16 → 16/16, `/landing` 0/2 → 2/2 (both themes). Founder visual pass before merging that branch.

## Differences from Make — and why
| # | Make | Port | Why |
|---|---|---|---|
| 1 | Gem icon + "96" | G-switch + "96G" | L-63 / L-62 / L-64 (decided after the Make round) |
| 2 | Comment count "31" | "31 strings"; 0 → "No strings attached · start one" | L-65 |
| 3 | "See fewer like this" in ⋯ | "Not for me" (private) | L-64 names the interaction set |
| 4 | Menu bar island (logo, search, +, theme, bell, Login) | not in this port | shell = B6 (top-nav / AppShell), not the canonical feed layer |
| 5 | Real Unsplash photos (covers, avatars) | gradient stand-in covers, initials avatars | container can't reach Unsplash; display renders `coverImageUrl` / `avatarUrl` from data (L-41 real photos from rows) |
| 6 | Hero overlay: black gradient + white text in both themes | canvas-coloured scrim + themed text (light mode = light caption band) | tokens only — no "on-media" token exists. **PROPOSED L-78:** add `--media-scrim` + `--text-on-media` so the overlay matches Make in light mode |
| 7 | Hero six frame kinds (debate vote, tool count-up, topic surge sparkline, milestone, community answer), subject band, mobile subject header | one post-frame look for every slide; eyebrow carries the label | kinds + lens header are B7 / B9 data + UI |
| 8 | Discover drill-down (sub-maps), per-topic icons | flat list, Hash icon for topics | drill-down + lens bus = B9; topic icons wait for the taxonomy (O-06) |
| 9 | Podium peek, Leaderboard page, pinned dimensions, "You · #14" standing | not ported | B10 |
| 10 | Vibing quiet / lens fallback | renders nothing when empty | fallback copy needs lens (B9); D-012 |
| 11 | Hidden card collapses inline to "Hidden · Undo" | existing page-level undo toast (`FeedUndoToast`) | kept the existing component (rule 1); inline collapse is a small follow-up if the founder prefers it |
| 12 | Fav glow: `brand-200` + tight 10px text-shadow | `--brand-primary` + existing `--glow-primary-text` (40px, softer) | no new token minted; founder judges in the browser |
| 13 | Debate split animates (bars grow) | split renders static | motion-light first pass; vote-to-reveal logic (L-29 / L-37) is in |
| 14 | `glass` utilities with `saturate(1.5)` | frost-* (no saturate) | L-40 / L-68 |
| 15 | Silver crown on white is faint in light | same token (`--rank-silver`) | flag for founder (contrast in light) |
| 16 | Kind chip parts are buttons into the lens | plain text | lens = B9 |

## Open questions
1. **PROPOSED L-78** — media overlay tokens (`--media-scrim`, `--text-on-media`) so hero text over photos matches Make in light mode (diff #6).
2. Hidden card: keep the toast or switch to Make's inline "Hidden · Undo" (diff #11)?
3. Why-care copy still says "valued" ("14 valued in the last 3h", "Still valued…") per §10.3; Gravity wording ("+14G in 3h") is not decided — PM to rule.
4. Rising line, author flux ("412 saw · 18G ↗", L-61) are fixture text; their data comes with B2/B3/B5a.
5. `CanonicalFeedClient` (/feed) still renders its own plain card — wiring the canonical layer onto `/feed` is the B5 wiring step.
6. Not run here: graphify regen (L-56 — GLM after merge); STATUS / CHANGELOG lines wait for acceptance (D-006).

## Lines to append to FEED-DESIGN.md §17
```
- 2026-10-12 — FEED-U1 port (branch feed-u1-port, FEED-U1-BUILD.md): Make look ported into the canonical feed-* layer (props only): card skeleton with 8 facets, why-care line, G-switch + "18G" (L-62/L-63), strings (L-65), vote-to-reveal debate (L-29/L-37); text sorter with solid pill + Fav glow-text-new (L-70/L-47); Discover + topics with counts; Vibing v2 sequential rotation + ticker; Podium "what they did" + dimensions; §8 1000px grid 170/fluid/226; hero centred cover-flow + cascade, no autoplay (L-43/L-31). Retired post-card family deleted (L-51). L-77 border reset in @layer base on its own branch feed-l77-border-layer (before/after: 1/48 → 48/48 themed borders on /lab/feed). PROPOSED L-78 media overlay tokens.
```
