---
id: S02-SPEC
type: SPEC
author-model: Opus
tool: Claude Code (cloud)
round: 2
status: DRAFT (display components on prototype-v2; awaiting founder tweak + GLM wiring)
date: 2026-10-03
---

# S02 — Feed + Search (feed part) — spec

**NOTES = the founder's prototypes.** `specs/S02-refs/prototype-v2/` (README; `screens/` = visual truth, source = structure + motion) **wins for the feed**; `specs/S02-refs/prototype/` stays the reference for every other screen. Only the **feed** is ported here. Built per **D-016**: Opus builds display components (props in, UI out); GLM wires `/feed` (data, states, tests); Grok reviews both; the founder tweaks live after wiring.

Founder rulings applied (D-017): desktop keeps the hero, **mobile starts with the feed**; the product's post types are final (real set: news, review, compare, help, spark, debate, list, showcase + launch_pad, gigs locked at runtime); prototype numbers and names are placeholders. Every production number comes from real rows (D-012).

Round 2 (prototype-v2) changes: polymorphic hero (3D cover-flow ↔ compact cascade), per-type card strip (`extras`), author row links to the profile, the whole text block is one link, hover lift, sliding nav pill with fill, staggered entrance, hero + card skeletons. **Props contract, fixtures and `/lab/feed` params are kept.** Additions are optional only: `FeedCardData.extras`, `FeedTabs.ref`, `FeedHeroCarousel.alignToRef` / `initialMode`, `FeedPageView.heroLoading` / `heroMode`, lab param `hero=compact`.

## 1. Components (`apps/forum/src/components/feed/`, no Convex imports)

| File | Export | v2 source | Props |
|---|---|---|---|
| `feed-display-types.ts` | prop types | `types/*` | `FeedCardData` (+ `extras`), `FeedCardExtras`, `FeedPerson`, `FeedCommentPreview`, `FeedHeroSlide`, `FeedNavItem`, `FeedVibingItem`, `FeedPodiumEntry`, `FeedSort`, `FeedPodiumWindow` |
| `feed-post-type-meta.ts` | `postTypeMeta(type)` | `categoryIconMap` | icon per real type (+ `launch_pad` Rocket, `gigs` Briefcase); `--cat-*` wash for the hero backdrop only (v2 draws type icons in `--text-primary`) |
| `feed-avatar.tsx` | `FeedAvatar`, `PersonaLabel` | `user-avatar.tsx` | image or initials (CR-003); "AI" label for personas |
| `feed-card.tsx` | `FeedCard`, `FeedCardSkeleton` | `post-card.tsx`, `post-interaction-row.tsx`, `comments-preview-cycler.tsx`, `post-actions-menu.tsx`, `categories/*/CardExtras` | `card`, optional `onToggleValued`, `onToggleSaved`, `onWhy`, `onShare`, `onHide`, `onMute`, `onReport` (a control renders only if its handler is passed) |
| `feed-tabs.tsx` | `FeedTabs` | `trend-sorter.tsx` | `active`, `onSelect`, `ref?` (the hero aligns to it) |
| `feed-hero-carousel.tsx` | `FeedHeroCarousel`, `FeedHeroCarouselSkeleton` | `top-post-hero-carousel.tsx` | `slides`, `alignToRef?`, `initialMode?` |
| `feed-left-nav.tsx` | `FeedLeftNav` | `left-sidebar.tsx` | `items`, `activeKey`, `onStartDiscussion?` |
| `feed-rail.tsx` | `FeedVibingWidget`, `FeedPodiumWidget` | `whats-vibing-widget.tsx`, `podium-widget.tsx` | `items` / `window`, `onWindowChange`, `entries \| null` ("Podium is forming"), `leaderboardHref` |
| `feed-page-view.tsx` | `FeedPageView` | `app-shell.tsx` + `feed-client.tsx` | all of the above + `listState`, `cardActions(card)`, `onEmptyAction`, `footer`, `undo`, `heroLoading?`, `heroMode?` |

The live `/feed` files (`canonical-feed-client.tsx`, `post-card.tsx`, `top-post-hero-carousel.tsx`, …) are untouched. GLM swaps them for these when wiring, then deletes the dead ones.

## 2. Layout (390 first)

- **390 (< lg):** sort tabs card + feed cards only; no hero, nav or rail. Card image sits under the text, full width (v2). The type label lives in the author line (no hover-only affordances, S00 §6). Hit targets ≥ 44 px. Bottom padding clears `--tabbar-h` + `--safe-bottom`.
- **lg (≥1024):** polymorphic hero (`--radius-hero`). Default is 440 px, compact is 220 px. Below it, left nav 240 px plus the feed.
- **xl (≥1280) → 1440:** hero 520 / 260 px; right rail 320 px (What's Vibing, Podium). Max width `--container-app`.
- **Hero geometry (v2):** the focus card is exactly the sort control's width (2:1) and centred over it; side cards recede ±440 px / −160 z / ±12° / 0.5→0.35 scale. Compact: 16:9 front card whose left edge aligns with the sort control; up to 3 upcoming cards fan 96 px left.
- The S00 shell (top bar, tab bar; v2 also shows a Terms · Privacy footer) wraps this; it is not S02.

## 3. Both themes

Tokens and S00 utilities only (`packages/design-tokens`). **Token diff: 0.** No token or STYLE-KIT change was needed. v2's `isDark` rgba overlays become `--bg-surface` gradients, which read black in dark and white in light (same intent). Its glass pills become `.glass-chrome`, and its brand box-shadows become `.glow-active` / `.glow-cta`, which are `none` in light per D-007. The accent-tinted card shadow becomes neutral `shadow-2xl`, and the per-slide `accentRgb` becomes the post type's `--cat-*` wash. Evidence: `specs/S02-evidence/` (`feed-*`, `compare-feed-*` = ours | v2).

## 4. Motion — "a blink with a reason" (D-007, VISION rule 2)

Every micro-interaction in v2's feed, with its purpose. **RM** = what `prefers-reduced-motion` does. **FLAG** = no clear purpose or a conflict with a binding rule. It's listed for a founder call, never dropped silently.

| # | Where | Interaction | Purpose | RM | Status |
|---|---|---|---|---|---|
| 1 | Hero | Autoplay every 5.2 s, paused on hover/focus | Signals: the featured set rotates | **off** (WCAG 2.2.2) | ported (v2 keeps autoplay under RM → deviation) |
| 2 | Hero | Cover-flow spring re-layout (x / z / rotateY / scale / opacity) on change | Guides: where the next post came from | x + opacity only | ported |
| 3 | Hero | Side cards blurred 8/16 px + dimmed | Guides focus to the active post | no blur | ported |
| 4 | Hero | Active title/eyebrow fade-up 280 ms | Confirms which post is active | opacity | ported |
| 5 | Hero | Ambient backdrop: active cover blurred, 600 ms cross-fade | Ties the stage to the post (atmosphere) | 150 ms fade | ported · **FLAG** decorative (v2 signature) |
| 6 | Hero | Press scale 0.97 spring on focus card | Confirms the press | off | ported |
| 7 | Hero | Drag / swipe with velocity threshold | Guides: direct manipulation | — | ported |
| 8 | Hero | Wheel / trackpad advance, 400 ms lockout | Guides | — | ported **horizontal only** · **FLAG** v2 also maps vertical wheel, which changes slides while the page scrolls |
| 9 | Hero | Minimize ↔ maximize: height spring 440↔220 + state cross-fade | Guides: the hero gets out of the way | instant | ported |
| 10 | Hero | Minimize control appears on hero hover (0 → 50 → 100 %) + `.glow-active` on hover | Confirms it is interactive | — | ported · **FLAG** hidden until hover (keyboard focus reveals it) |
| 11 | Hero compact | Cascade cards fan / enter from depth / exit by direction | Guides direction | opacity | ported |
| 12 | Hero compact | Text slides ±56 px, matched to direction | Guides | opacity | ported |
| 13 | Hero | Explore: on hero hover border → brand + `.glow-active`, arrow → brand | Guides to the primary action | static | ported |
| 14 | Hero | Explore arrow **infinite pulse** on hover | none (not a live state) | — | **not ported · FLAG** D-007 #2 (pulse = live only) |
| 15 | Hero | Prev/next hover wash | Confirms | — | ported |
| 16 | Tabs | Sliding brand indicator 300 ms (+ `.glow-active`, dark) | Guides: you are here | instant | ported |
| 17 | Tabs, CTA, pills | Press scale 0.97 | Confirms the tap | — | ported |
| 18 | Card | 2 px lift on hover / focus-within (lg) | Guides: this card is the target | none | ported |
| 19 | Card | Brand-tinted hover glow (`.feed-post-card`) | none beyond #18 | — | **not ported · FLAG** S00 §7 removed card-hover glow; neutral `shadow-md` instead |
| 20 | Card | Cover zoom 1.02 on card hover, 500 ms | none (decorative) | off | ported · **FLAG** |
| 21 | Card | Comment preview cycles every 1.7 s while hovered/focused | Signals the conversation behind the card | off | ported |
| 22 | Card | Action pills lift 2 px on hover (lg) | Guides: hoverable control | — | ported · **FLAG** weak (three lifts in one row) |
| 23 | Card | Valuable: icon ArrowUp → ChevronsUp + scale 1.1 | Confirms the action | no transition | ported |
| 24 | Card | Fav: hover scale 1.04 + wash; press 0.95; icon 1.1 hover / 1.25 press; fill on save | Confirms the save | no transition | ported |
| 25 | Card | Type chip name pops out on hover (AvatarWithName) | Guides: names the type | — | ported (label also in author line < lg) |
| 26 | Card | Author row hover wash | Guides: profile link | — | ported |
| 27 | Left nav | Active pill slides (translateY 300 ms) with fill + `.glow-active` | Guides: you are here | instant | ported |
| 28 | Left nav | Item hover **text glow** (drop-shadow) | none | — | **not ported · FLAG** D-007 #1 (glow only on CTA/active/focus) |
| 29 | Left nav | Conic `GlowingEffect` around "Start Discussion" | none | — | **not ported · FLAG** S00 §7 removal; static `.glow-cta` kept |
| 30 | Page | Entrance soft-float 220 ms on tabs / nav / rail cards, staggered 0 / 60 / 100 / 160 ms | Guides: chrome settles (weak) | off | ported · **FLAG** runs on every load |
| 31 | Rail | What's Vibing rotates every 4 s (slide-up / scale), paused on hover/focus | Signals what's trending now | off | ported |
| 32 | Rail | Vibing arrow nudge + brand colour on hover | Guides: it's a link | — | ported |
| 33 | Rail | Vibing arrow **infinite pulse** + drop-shadow glow on hover | none | — | **not ported · FLAG** D-007 #1/#2 |
| 34 | Rail | Podium window indicator slide | Guides | instant | ported |
| 35 | Rail | Podium top-3 hover sheen sweep 700 ms | none (decorative) | hidden | ported · **FLAG** |
| 36 | Rail | Leaderboard link hover glow | none beyond colour | — | **not ported · FLAG** D-007 #1 (colour change kept) |
| 37 | Page | Skeleton pulse (hero + cards) | Signals loading | static | ported |
| 38 | Page | Undo toast (existing `feed-undo-toast`) | Confirms hide/mute/report, with Undo | — | kept |

## 5. Data map (prop → existing Convex source)

✓ = exists today · **CR-0xx** = needs data (renders nothing until then).

| Prop | Source |
|---|---|
| card `id`, `href` | `feed.list` → `postId`, `/discussions/${slug}` ✓ |
| `type`, `typeLabel` | `type` ✓ · label from `getChrome.typeNav[].label` ✓ |
| `title`, `summary` | `title` ✓, `oneLiner` ✓ |
| `author.name` | `authorName` ✓ |
| `author.handle` (also the profile link), `author.isPersona` | **CR-010 #1** |
| `author.avatarUrl`, participant avatars | **CR-003** (initials) |
| `timeLabel` | `publishedAt` → `formatRelativeDate` ✓ |
| `coverImageUrl` | **CR-010 #6** |
| `commentPreviews` | **CR-010 #2** |
| `participants` | **CR-010 #3** |
| `valuableCount` | **CR-010 #4** (today's `engagement.valuable` is weighted) |
| `replyCount` | `engagement.replies` ✓ |
| `isValued`, `isSaved` | **CR-010 #5** |
| `isRising` | `rising` ✓ |
| `extras` review `stars` | `postReviews.verdictScore` exists, not on the card → **CR-010 #10** |
| `extras` debate `agree` / `disagree` / `proposition` | `postDebates.agreeCount` / `disagreeCount` / `proposition` exist, not on the card → **CR-010 #10** |
| `extras` review `verdict` pill | **SCOPE** (see §6) |
| `extras` meta (gigs) | **SCOPE** (see §6) |
| Why / Hide / Mute / Report / Undo | `feed.getWhy`, `feed.cardAction`, `feed.unhide` ✓ |
| tabs `active` | `feed.list` `sortMode` ✓ |
| hero `id`, `href`, `title`, `ctaLabel` | `getChrome.hero[]` ✓ (null `ctaLabel` → "Explore", v2's label) |
| hero `eyebrow` | `disclosureClass` via a label map ✓ |
| hero `type` (backdrop wash), `summary` (compact), `imageUrl` (cards + backdrop) | **CR-010 #7** |
| hero `metrics` | prop kept; v2 doesn't render it |
| nav `items` | `getChrome.typeNav` ✓ + Home |
| vibing `id`, `engagedCount` · `title` / `href` / `contextLabel` | `getChrome.vibing[]` ✓ · **CR-010 #8** |
| podium entries · `href` · 24H / 1M | `getChrome.podium` ✓ (d7) · **CR-010 #9** · **CR-006** |

## 6. GAP list — what v2 shows that MVP 1 data or scope can't support

Rendered from fixtures in `/lab/feed` only.

**NEEDS DATA (→ CR-010):** cover images on cards and hero (#6, #7); comment previews (#2); participant faces (#3, CR-003); author handle and the profile link (#1); viewer Valuable/Fav state (#5); raw Valuable count (#4); hero summary and type (#7); review stars and debate votes/proposition on the card (#10); Vibing title/link/type (#8); Podium links (#9) and windows (CR-006).

**SCOPE (founder call):**
1. **Sidebar labels:** v2 shows "Q&A" and no Spark. The product's labels come from `postTypeConfig` (help, Spark active). Not copied.
2. **Review verdict pill** ("Recommended / With caveats / Not recommended"): there is no categorical verdict, only `verdictScore` 1–5 + `verdictSummary`. Should a label map from the score exist?
3. **Gigs meta strip** (role · employment · location · budget): gigs is locked in MVP 1 and has no typed gigs table.
4. **launch_pad / gigs** in the feed: locked at runtime. Icons exist and the lab shows one gig card.
5. **Hero size:** v2 shows "1 / 10". `feed.getChrome` serves 4–6 active slots (bible l.132).
6. **v2 hero empty state** ("Add a few high-signal creator posts…"): this is staff-facing copy (COPY-1). Not ported; no slides means no hero.
7. **v2 fallbacks** "Unknown author" / "@unknown" / "General": not ported (D-012). Missing values render nothing.
8. **Footer** (Terms · Privacy) and top nav: S00 shell, not S02.

## 7. Lab

`/lab/feed` (dev-only, 404 in production) renders the full page from fixtures (`app/(app)/lab/feed/fixtures.ts`, the only fixtures). Params: `theme=dark|light`, `state=ready|loading|empty` (loading also shows the hero skeleton), `type=<post type>`, `hero=compact`, `toolbar=0`.

## 8. Not reproduced faithfully

- Every **FLAG / not ported** row in §4.
- **Focus card radius:** 24 px (`--radius-2xl`), where v2 uses 20 px. No 20 px radius token exists except the auth-modal one.
- **Wheel:** horizontal only (§4 #8).
- **Autoplay** stops under reduced motion (§4 #1).
- **Fonts:** VM screenshots use a fallback font because the proxy blocks the web-font fetch. Real browsers get the app font.
- **Rising badge and relative time** are kept although v2 doesn't show them (S02 scope: relative time; trend data exists).

## 9. References for later specs

From `prototype/` (still the reference outside the feed and auth): new-post / drafts → **S04**; discussions/[slug], discussion/[id], thread-page, `Reference/CREATECONOMY_THREAD_V2_COMPLETE.md` → **S03**; profile, notifications → **S05**; discover → S06; search field → S07; settings → S08; leaderboard → S09; campaigns → no spec (flag). From `prototype-v2/`: login / sign-up modal → **S01** (`s01-auth-ui`); `categories/*` Body / Insights / ComposeForm → S03 / S04.

## 10. Handoff

Branch `s02-feed-ui`. Founder pulls and tweaks with GLM. GLM wires `/feed` against §5. Grok reviews. Opus pushes again only when asked, after pulling.
