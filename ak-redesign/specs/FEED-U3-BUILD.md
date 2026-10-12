# FEED-U3 — Shell (menu island, tab bar, logo, Start sheet, edge fades)

Branch `feed-u3-shell` from `feed-base`. Not merged. Proof: tests only. No screenshots, no dev server, no browser (budget rule for this phase).

## What changed
| # | Item | Where |
|---|---|---|
| 1 | **Menu island**: `frost-strong`, sticky `top-2` (8px, phones) / `lg:top-3` (12px), `max-w-250` (the ~1000px §8 container), `rounded-xl`, `border-subtle`. Deeper shadow after 8px of scroll: a `shadow-lg` layer that fades in (opacity only, `settle` spring). Raw rgba / white-alpha / `GlowingEffect` / drop-shadow hacks removed (tokens only). Visitor → Login, member → avatar menu (unchanged). The bell shows an unread **dot**; the count moved into the label ("Notifications, 3 unread"). The search field widens on focus (`--container-search` → `--container-reading`). The width change is not animated (Bible §9.2 r5). | `layout/top-nav.tsx` |
| 1 | **L-68: glass-\* retired.** `@utility glass-chrome/glass-strong` and every `--glass-*` token deleted. Lab demos, `e2e/glass-utilities.spec.ts`, `t03-evidence` and `t02-glow-values-check` now point at frost. STYLE-KIT §2.2a has a retirement note. | `packages/design-tokens/*`, lab, e2e, scripts, STYLE-KIT |
| 2 | **Tab bar**: full-width `frost-subtle`, `pb-safe`/`pl-safe`/`pr-safe`, height `--tabbar-h`. Active tab = brand colour + semibold label + `aria-current`. Inactive tabs use `text-secondary`, never muted on frost (Bible §4 r2). Every tab presses at `scale-97` / `duration-press`. Create is a button that opens the Start sheet. It has no glow (L-69). | `layout/mobile-tab-bar.tsx` |
| 3 | **Logo reveal on first load only**: the server and the first client mount reveal. Any later mount shows the mark at rest. This uses a module flag, so hydration stays stable. | `top-nav.tsx` (`useFirstLoadLogoReveal`) |
| 4 | **Start sheet**: a display component (props only). Radix Dialog + motion `layoutId` shared element (`start-sheet-rail` / `start-sheet-tab`) on a `glide` spring. Closing returns along the same path. `frost-strong` + `shadow-lg` (L3), with a `--scrim` overlay. Phones get a bottom sheet with a handle; lg gets a centred panel. Heading: "What do you want to start?". Rows show the post types (icon + label + one-line description, all from `listPostTypes` data). Visitors see "Sign in to start a discussion." + **Sign in** instead. | `feed/feed-start-sheet.tsx` (new) |
| 4 | Shared open state, because the two triggers live in different trees. The shell host reads auth + `useSharedData` (no new subscription) and routes the chosen type to `/new-post?type=<key>`. | `stores/start-sheet-store.ts`, `layout/start-discussion-host.tsx` (new), `app-shell.tsx` |
| 4 | The rail pill is now the shared element. `/feed` opens the sheet for visitors and members (visitors used to go straight to the auth modal). | `feed-left-nav.tsx`, `canonical-feed-client.tsx` |
| 4 | **Existing composer** reads `?type=`: `help`→`qa`, non-composable → none. The chosen type wins over the default and over a restored draft's type. The page is wrapped in Suspense for `useSearchParams`. | `new-post-composer.tsx`, `new-post-page-client.tsx`, `page.tsx`, `lib/new-post/composer-type-param.ts` (new) |
| 5 | **Scroll-edge fade**: new `@utility scroll-edge-fade` (canvas → transparent). It sits under the island (visible once scrolled) and replaces the old solid anti-bleed mask. The mobile sorter now docks `sticky top-16` (8px + 56px island) with a fade below it. It is static on lg. | `utilities.css`, `top-nav.tsx`, `feed-page-view.tsx` |
| 6 | **Reduced motion**: island shadow → crossfade (`motionFor`). Sheet → opacity fade, no `layoutId` (`data-motion="fade"`). Triggers drop `layoutId`. Presses get `motion-reduce:active:scale-100`. The logo is static (existing CSS). There is no animated search width. | all of the above |

## Proofs (RED → GREEN)
- `layout/__tests__/feed-u3-shell.test.tsx` (22) + `feed/__tests__/feed-u3-page.test.tsx` (2).
- RED: `FEED-U3-evidence/red-01-shell.txt`. 23 failed against stubs; the one pass is the visitor/member baseline that already held.
- GREEN: `green-01-shell.txt`, 24/24.
- Gate (`gate.txt`): typecheck 0 · lint 0 (forum + admin) · forum **85 files / 1090 ✅**.

## Not proven (no browser this phase)
- What the shared-element grow/shrink actually looks like, the frost over real content, both themes at 390 / 1440, and safe areas on a device.
- Whether motion keeps `layoutId` working across the Radix portal (the React tree is preserved, so it should).
- Founder: check `/feed` in the browser.

## Open questions
1. **7 vs 8 types.** The sheet shows the **7 member-composable** types. News is platform-injected (CAP-086), so the composer cannot take it. The prompt said 8. → PROPOSED L-86.
2. **Pre-existing key mismatch.** `listPostTypes` returns `help`, but the composer's composable list uses `qa`. With live data, the composer drops Help from its own picker, so `?type=help` falls back to the default. This was not changed here; it needs a small CR or a client mapping.
3. **Tab labels.** All five tabs show labels; only the active one is brand + semibold. Confirm against "active = brand + label" (the alternative is labels on the active tab only).
4. **Bible §3.2 r3.** The rule says a sheet over the island should make the island solid. Not done; the scrim covers it. Confirm whether it is needed.

## Lines to append to FEED-DESIGN.md §17
```
- 2026-10-12 — FEED-U3 shell (branch feed-u3-shell, FEED-U3-BUILD.md): menu bar = frost-strong island (sticky 8/12px, max-w-250, radius xl, shadow-lg layer fades in after 8px, settle), bell unread dot, search widens on focus; glass-* retired (L-68: tokens, utilities, lab, e2e, STYLE-KIT note); mobile frost-subtle tab bar (safe areas, active brand + label, press 0.97, Create opens the sheet, no glow L-69); logo reveal first load only; Start Discussion sheet = shared element from the rail pill / Create tab (glide; same path back), types + one line from data, visitor sign-in, choice → /new-post?type=; scroll-edge-fade utility under the island and the docked mobile sorter; reduced-motion crossfades throughout. PROPOSED L-86: the sheet lists the 7 member-composable types (news is platform-injected, CAP-086). Tests only (24 RED→GREEN); no browser capture this phase.
```
