---
id: S02-SPEC
type: SPEC
author-model: Opus
tool: Claude Code (cloud)
round: 1
status: DRAFT (display components built; awaiting founder tweak + GLM wiring)
date: 2026-10-03
---

# S02 — Feed + Search (feed part) — spec

**NOTES = the founder's prototype** `ak-redesign/specs/S02-refs/prototype/` (REFERENCE.md; founder-approved look). Only its **feed** is ported here. Built per **D-016**: Opus builds display components (props in, UI out); GLM wires `/feed` (data, states, tests); Grok reviews both; the founder tweaks live after wiring.

Founder rulings applied (2026-10-03): desktop keeps the hero carousel, **mobile starts with the feed**; the product's current post types are final (the prototype's 9 categories are ignored); prototype numbers are placeholders, so every production number comes from real rows (D-012).

## 1. Components (`apps/forum/src/components/feed/`, no Convex imports)

| File | Export | Prototype source | Props |
|---|---|---|---|
| `feed-display-types.ts` | prop types | `types/*` | `FeedCardData`, `FeedPerson`, `FeedCommentPreview`, `FeedHeroSlide`, `FeedNavItem`, `FeedVibingItem`, `FeedPodiumEntry`, `FeedSort`, `FeedPodiumWindow` |
| `feed-post-type-meta.ts` | `postTypeMeta(type)` | `categoryIconMap` | icon + `--cat-*` tint per product type (labels come from data) |
| `feed-avatar.tsx` | `FeedAvatar`, `PersonaLabel` | `user-avatar.tsx` | `person`, `size`. Image or initials (CR-003). "AI" label for personas |
| `feed-card.tsx` | `FeedCard` | `post-card.tsx`, `post-interaction-row.tsx`, `comments-preview-cycler.tsx`, `post-actions-menu.tsx` | `card: FeedCardData`, optional `onToggleValued`, `onToggleSaved`, `onWhy`, `onShare`, `onHide`, `onMute`, `onReport` (a menu item or control renders only if its handler is passed) |
| `feed-tabs.tsx` | `FeedTabs` | `trend-sorter.tsx` | `active: FeedSort`, `onSelect` |
| `feed-hero-carousel.tsx` | `FeedHeroCarousel` | `top-post-hero-carousel.tsx` | `slides: FeedHeroSlide[]` |
| `feed-left-nav.tsx` | `FeedLeftNav` | `left-sidebar.tsx` | `items`, `activeKey`, `onStartDiscussion?` |
| `feed-rail.tsx` | `FeedVibingWidget`, `FeedPodiumWidget` | `whats-vibing-widget.tsx`, `podium-widget.tsx` | `items` / `window`, `onWindowChange`, `entries \| null` (null → "Podium is forming"), `leaderboardHref` |
| `feed-page-view.tsx` | `FeedPageView` | `app-shell.tsx` + `feed/page.tsx` + `feed-client.tsx` | everything above + `listState: loading\|ready\|empty`, `cardActions(card)`, `onEmptyAction`, `footer` (load-more slot), `undo` (reuses existing `feed-undo-toast.tsx`) |

The existing `post-card.tsx` / `canonical-feed-client.tsx` / `top-post-hero-carousel.tsx` etc. are untouched. GLM replaces them when wiring `/feed`, then deletes the dead ones.

## 2. Layout (390 first)

- **390 (< lg):** sort tabs card + feed cards only. No hero, no left nav, no rail. The type label sits in the card's author line (no hover-only affordances, S00 §6). Hit targets ≥ 44 px (menu trigger, tabs, action pills). Bottom padding clears `--tabbar-h` + `--safe-bottom`; the undo toast sits above the tab bar.
- **lg (≥1024):** hero carousel (380 px, 420 px at xl) above a two-column body: left nav 240 px (sticky, "Start Discussion" `.glow-cta` + Discover list with sliding `.glow-active` outline) + feed.
- **xl (≥1280) → 1440:** adds the right rail 320 px (What's Vibing, Podium). Content max width `--container-app` (1440).
- The S00 shell (top bar, tab bar) wraps this. It is not part of S02.

## 3. Both themes

Tokens only (`packages/design-tokens`). Glow utilities are `none` in light (D-007), so light keeps meaning through colour + weight. Verified at 390 + 1440 in both themes: `ak-redesign/specs/S02-evidence/`.

## 4. Motion (S00 §7 applied to the prototype)

Kept: tab/podium sliding indicator (guides), hero slide cross-fade + autoplay 5.2 s paused on hover/focus (signals the featured set), Vibing rotation 4 s, comment preview cycling on hover (lg only), press scale 0.97, card lift at lg only. Every rotation stops under `prefers-reduced-motion`. Removed: conic `GlowingEffect` on the CTA, card hover brand glow, Podium hover shimmer, infinite arrow pulse, `animate-soft-float` on idle cards.

## 5. Data map (prop → existing Convex source)

✓ = exists today · **CR-010 / CR-003 / CR-006** = needs data (renders a designed fallback until then).

| Prop | Source |
|---|---|
| card `id`, `href` | `feed.list` → `postId`, `/discussions/${slug}` (null slug → title not a link) ✓ |
| `type`, `typeLabel` | `type` ✓ · label from `feed.getChrome.typeNav[].label` ✓ |
| `title`, `summary` | `title` ✓, `oneLiner` ✓ |
| `author.name` | `authorName` ✓ |
| `author.handle`, `author.isPersona` | **CR-010 #1** (null / false until then) |
| `author.avatarUrl`, participant avatars | **CR-003** (initials fallback) |
| `timeLabel` | `publishedAt` → `formatRelativeDate` (`lib/format.ts`) ✓ |
| `coverImageUrl` | **CR-010 #6** (no source; text-only layout until then) |
| `commentPreviews` | `runningCommentRef` is an id only → **CR-010 #2** |
| `participants` | `avatarUserIds` are ids only → **CR-010 #3** (`discussingCount` ✓ available) |
| `valuableCount` | `engagement.valuable` is a weighted score → **CR-010 #4** |
| `replyCount` | `engagement.replies` ✓ |
| `isValued`, `isSaved` | **CR-010 #5** |
| `isRising` | `rising` ✓ |
| Why / Hide / Mute / Report / Undo | `feed.getWhy` ✓, `feed.cardAction` ✓, `feed.unhide` ✓ |
| Share | client (`navigator.share` / clipboard) ✓ |
| tabs `active` | `feed.list` `sortMode` ✓ (`fav` → `member_only` for guests) |
| hero `id`, `href`, `title`, `ctaLabel` | `getChrome.hero[]` `postId`, `slug`, `title`, `ctaLabel` ✓ (null `ctaLabel` → a label-map default, founder copy) |
| hero `eyebrow` | `disclosureClass` via a label map ✓ |
| hero `type`, `summary`, `imageUrl`, `metrics` | **CR-010 #7** (no shares counter exists → never shown) |
| nav `items` | `getChrome.typeNav` ✓ + Home · `activeKey` from `?type=` ✓ |
| vibing `id`, `engagedCount` | `getChrome.vibing[]` `objectId`, `humans` ✓ |
| vibing `title`, `href`, `contextLabel` | `hook` ✓ when grounded; fallback title, slug, type → **CR-010 #8** |
| podium `entries` rank / points / name | `getChrome.podium.entries` ✓ (`overall`, `d7` only) · `forming` ✓ |
| podium `href` | **CR-010 #9** |
| podium `window` 24H / 1M | **CR-006** (only d7 is returned; until then the switch shows d7 or hides) |

## 6. Lab

`/lab/feed` (dev-only, 404 in production): the full page from fixtures (`app/(app)/lab/feed/fixtures.ts`; fixtures live only under `/lab`). Params: `theme=dark|light`, `state=ready|loading|empty`, `type=<post type>`, `toolbar=0`. A small toolbar toggles theme and state.

## 7. Not reproduced faithfully (and why)

- **Cover images / "AI thumbnail pipeline":** no data source → CR-010 #6. The lab uses gradient stand-ins.
- **9 prototype categories (launch-pad, gigs…):** replaced by the product's 8 post types (founder ruling).
- **Per-slide hero accent rgb + radial glow:** replaced by the post type's `--cat-*` wash (no copied colours).
- **Black text on active tabs in light:** uses `--text-inverse` (white in light, near-black in dark, like the prototype).
- **Hover-only effects** (conic glow, card glow, podium shimmer, arrow pulse): removed per S00 §7. The type chip's name pop-out is kept at lg+ only.
- **"New post →" prefix in Vibing:** dropped because a trending object isn't always a new post (D-012 honesty).
- **Podium per-window multipliers:** not ported (invented numbers). Windows wait on CR-006.
- **Light theme silver rank icon** (`--rank-silver`) is low-contrast on the light surface. This is a STYLE-KIT token question for the founder, not changed here.

## 8. References for later specs (other screens in the prototype)

| Prototype file | For |
|---|---|
| `app/(app)/new-post/page.tsx`, `drafts/page.tsx` | **S04 Composer** |
| `app/(app)/discussions/[slug]`, `discussion/[id]` + `components/discussion/thread-page.tsx`, `Reference/CREATECONOMY_THREAD_V2_COMPLETE.md` | **S03 Post + Threads** |
| `app/(app)/profile/page.tsx`, `notifications/page.tsx`, top-nav notifications dropdown | **S05 Profile & recognition** |
| `app/(app)/discover/page.tsx` | S06 Discover · `top-nav.tsx` search field → S07 Search |
| `app/(app)/settings/page.tsx` | S08 Settings |
| `app/(app)/leaderboard/page.tsx` | S09 Leaderboard |
| `app/(app)/campaigns/page.tsx` | not in the S-list (no spec, flag before use) |
| `components/auth/*` (login/signup modal, social buttons) | S01 front door |
| `components/layout/top-nav.tsx`, `mobile-tab-bar.tsx` | S00 shell (already specced) |
| `components/states/*` | S00 state kit |

## 9. Handoff

Branch `s02-feed-ui` (from `011-Akilesh-Redesign`). Founder pulls it and tweaks with GLM. GLM wires `/feed` against §5 (no new display markup). Grok reviews. Opus does not push to `s02-feed-ui` again unless asked, and pulls first if asked.
