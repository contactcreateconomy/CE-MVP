---
id: S00-SPEC
type: SPEC
author-model: Opus
tool: Claude Code (cloud)
round: 1
status: APPROVED (founder, 2026-09-29; Q1–Q4 = yes)
date: 2026-09-29
---

# S00 — Foundation — spec

**Built from:** `S00-NOTES.md` (founder, FINAL) · `00-control/CURRENT-STATE.md` §1, §2.17, §5, §6, §7 · VISION §5–§6 ·
DECISIONS D-007, D-010, D-011, D-012, D-013, D-014 (S00 skips EXPLORE).
**Lane:** full. **Scope:** the foundation every later spec stands on. **No backend changes** (no `convex/` edits). No new npm dependencies.
**Owner of "today":** CURRENT-STATE. This spec cites it; it does not re-derive it.

---

## 0. Benchmark

**Beats Threads web at feeling installed** — home-screen icon, standalone (no browser chrome), theme-coloured status bar, no blank screen on any core route —
**and X web at first load on a mid-range phone** — Core Web Vitals "good" (§9) on `/feed` and `/discussions/[slug]`.
**Check:** side-by-side at 390 (dark + light): Add-to-Home-Screen → launch → `/feed` cold load, vs `threads.net` and `x.com` doing the same on the same phone (D-005 gate item). Lighthouse mobile numbers in the GATE file.

## 1. The six questions (VISION §6)

| # | Question | Answer for S00 |
|---|---|---|
| 1 | **Trust** | Removes every trust-killer that isn't screen-specific: spec language in the UI (~45 strings, CS §6), raw enum keys, fabricated data (`/category`, leaderboard — CS §2.13–2.14), blank screens and "Connect Convex" cards (CS §1 States), invisible Create label, website chrome. After S00 nothing on screen says "unfinished". |
| 2 | **Feel special** | S00 builds the *means*: the celebration glow utility, the sheet (for publish/recognition moments), identity-first shell (Profile tab → **your** profile, D-010). The moments themselves land in S03–S05. S00's own contribution: the app treats the user's time with respect — no blank waits, no internal jargon. |
| 3 | **Purposeful motion** | "A blink with a reason" (founder). §7 lists every allowed motion with its purpose; everything else is removed. Reduced-motion removes all glow motion. |
| 4 | **One thumb** | Tab bar (Home, Search, Create, Alerts, Profile) inside the thumb zone with safe-area inset; Create centred and labelled; sheets open from the bottom with the primary action at the bottom; no core action lives only in the top bar at 390. |
| 5 | **Benchmark** | §0: Threads web (installed feel), X web (load performance). |
| 6 | **Scope** | MVP-1 polish + supporting functionality only. No new features. `/lab` is a dev-only tool (D-014), never shipped to users. |

## 2. Today (from CURRENT-STATE — cite, don't re-derive)

- **Tokens:** forum and admin `globals.css` are 1,073-line copies differing on one line (L522) — CS §1.
- **Glow/glass:** 10 glow vars in 25 TSX files; `glowing-effect.tsx` animated conic border; ad-hoc `backdrop-blur-*` in 10 files; per-token rulings CS §7 (D-007).
- **States:** 5 spinner / 3 `return null` / 2 "Loading…" / 1 `Suspense fallback={null}` / 1 Skeleton; **no `error.tsx` anywhere**; `loading.tsx` files render a spinner + "Loading..."; 5 "Connect Convex …" guards — CS §1, §6.
- **App-feel:** no manifest, icons, `viewport` export, theme-color; `apps/forum/public/` doesn't exist (only `app/favicon.ico`); `layout.tsx` exports only `metadata` (title "Createconomy", description "Where AI Creates Value") — CS §1.
- **Shell:** `components/layout/mobile-tab-bar.tsx` — tabs Home→`/feed`, **Search→`/discover`**, Create→`/new-post`, Alerts→`/notifications`, Profile→`/profile`(→settings). Create label uses `text-(--text-inverse)` on the grey bar (invisible). `pb-4`, **no safe-area inset**. `bg-(--bg-surface)/95 backdrop-blur-sm`. Active = exact pathname match only. `components/layout/top-nav.tsx` (482 LOC) carries a **theme toggle** (L222–228) and a **"+"** link to `/new-post` (L210–218) at all widths.
- **Copy:** ~45 literal leaks + 4 data-driven classes; dates `toLocaleDateString()` in feed (14 files use `toLocale*`) — CS §6.
- **Fabricated data:** `/category/[slug]` static seed; leaderboard `charCodeAt % 5` multipliers — CS §2.13, §2.14 (D-012).
- **Dead code:** CS §5 list. `/kit` publicly routable — CS §3.
- **Bundle (measured 2026-09-29, `pnpm build`, gzip, initial client JS per route):** shared framework/main **166 KB**; `/landing` 276, `/signin` 276, `/new-post` 278 (TipTap 142 KB chunk is lazy — excluded), `/discussions/[slug]` 316, `/discover` 325, `/notifications` 325, `/search` 326, `/leaderboard` 326, `/drafts` 326, `/feed` 327, `/users/[handle]` 327, `/setup` 327, `/category/[slug]` 329, `/settings/profile` 345. The in-app shell adds ~50 KB over `/landing`.

## 3. Target experience (390 first; desktop follows)

A creator opens `createconomy` from their home screen. It launches **standalone**: status bar tinted to the theme, no URL bar. The **top bar** is a thin subtle-glass strip: logomark + wordmark left, bell (with unread badge) and avatar right — nothing else at 390. Content never flashes blank: every route paints a **skeleton shaped like its content** within the first frame, then content. If something fails, a calm **error card** says what happened in plain words and offers **Try again**; if the network drops, an **offline** notice says so. The **tab bar** sits above the home indicator, subtle glass, five labelled tabs; **Create** is the one glowing element on screen (brand circle, label readable). **Profile** opens *my* public profile. Choices that used to be menus (theme, overflow actions, pickers) open as **bottom sheets** that can be swiped down. Both **dark** (default) and **light** look intentional. Nothing on any screen mentions how the product was built.

Desktop (≥1024) keeps the current three-column shell, restyled by the same tokens; the top bar may keep "+ Create" and search at desktop widths only.

## 4. Components and files

| # | Component / file | New / extend / delete | Notes |
|---|---|---|---|
| 1 | `packages/design-tokens/tokens.css` | **New** (workspace folder, no package.json deps) | All shared `@theme inline` + `:root` / `.dark` token blocks, moved verbatim from `apps/forum/src/app/globals.css`. Imported by both apps with a relative `@import` (same pattern as the existing `@source "../../../../packages/auth-ui/…"`) — **no lockfile change**. |
| 2 | `apps/forum/src/app/globals.css`, `apps/admin/src/app/globals.css` | **Extend** (shrink) | Keep only app-local rules; forum keeps `min-h-screen`, admin `min-h-0` (the L522 difference). |
| 3 | `packages/design-tokens/utilities.css` | **New** | Glow/glass/pulse/safe-area/state utilities (§5). The only place glow `box-shadow` and `backdrop-filter` may be written. |
| 4 | `docs/04-design-system/STYLE-KIT.md` | **Extend** | §2.2 rewritten to the D-007 guardrails; new tokens (§5) documented; removed tokens struck with date. |
| 5 | `apps/forum/src/app/manifest.ts` | **New** | Web app manifest (§6). |
| 6 | `apps/forum/src/app/icon.tsx`, `apple-icon.tsx`, `app/icons/[size]/route.tsx` | **New** | Icons generated with `next/og` `ImageResponse` from the logomark paths in `ui/createconomy-logo-mark.tsx` (no new deps). Sizes 192, 512, 512-maskable, apple 180. |
| 7 | `apps/forum/src/app/layout.tsx` | **Extend** | `export const viewport` (§6), `metadata.appleWebApp`, `metadata.manifest`. |
| 8 | `components/ui/sheet.tsx` | **New** | Bottom sheet + side drawer on the existing Radix Dialog (no vaul). §5.4. |
| 9 | `components/ui/skeleton.tsx` | **Extend** | Add route-shaped compositions: `FeedCardSkeleton`, `ThreadSkeleton`, `ProfileSkeleton`, `ListRowSkeleton`, `FormSkeleton`. Shimmer respects reduced motion. |
| 10 | `components/ui/empty-state.tsx` | **Extend** | Becomes the kit's Empty (icon, title, one line, optional action). |
| 11 | `components/ui/error-state.tsx` | **New** | Error card: title, plain-words line, **Try again** (calls `reset`/refetch), optional "Go to feed". Never shows stack traces or codes. |
| 12 | `components/ui/offline-state.tsx` | **New** | Two causes, one look: browser offline (`navigator.onLine` + events) and backend not configured. Copy never names vendors (D-011). Replaces all 5 "Connect Convex" guards. |
| 13 | `app/(app)/error.tsx`, `app/(auth)/error.tsx`, `app/(compose)/error.tsx` | **New** | Route-group error boundaries using ErrorState. `global-error.tsx` stays (pre-CSS). |
| 14 | existing `loading.tsx` files (9) + new ones per core route | **Extend / new** | Spinner → the route's skeleton. |
| 15 | `components/layout/mobile-tab-bar.tsx` | **Extend** | §8 shell. |
| 16 | `components/layout/top-nav.tsx` | **Extend** | §8 shell; drop `GlowingEffect`; theme toggle + "+" hidden below `lg`; theme choice moves into the avatar menu (System / Dark / Light). |
| 17 | `app/(app)/(shell)/profile/page.tsx` | **Extend** | D-010: signed in → redirect to `/users/{user.handle}` (`useAuth().user.handle` already exists in `packages/auth-ui` `AuthUser`); signed out → open the auth modal, fall back to `/feed`. |
| 18 | `src/lib/labels.ts` | **New** | Label maps for every enum shown to users (§10). |
| 19 | `src/lib/time.ts` | **New** | `relativeTime(ts)` via `Intl.RelativeTimeFormat` (§10). |
| 20 | `src/lib/__tests__/copy-leak.test.ts` | **New** | COPY-1 source scan (§10). |
| 21 | `app/(app)/(content)/category/[slug]/*` | **Extend** | Live filtered feed (§11). Delete `category-preview-loader.tsx` + its static seed. |
| 22 | `app/(app)/(shell)/leaderboard/leaderboard-page-client.tsx` | **Extend** | Remove invented per-category multipliers (§11). |
| 23 | `app/(app)/kit/page.tsx` | **Extend** | `notFound()` unless `process.env.NODE_ENV !== "production"`. |
| 24 | `app/(app)/lab/page.tsx` (+ `lab/[variant]`) | **New** | Dev-only variant canvas for D-014 EXPLORE; same production guard as `/kit`. Empty shell only in S00. |
| 25 | Dead components | **Delete** | `feed/post-card.tsx`, `discussion/thread-header.tsx`, `discussion/thread-sidebar.tsx`, `discussion/category-bodies.tsx`, `discussion/insight-rail-extras.tsx`, `states/empty-state.tsx`, `states/error-state.tsx`, `states/loading-state.tsx`, `ui/interactive-hover-button.tsx`, `ui/glowing-effect.tsx` (CS §5). Keep: `feed-undo-toast`, `tag-picker`, `dropdown-menu`, `tabs`, `switch`, `pdf-viewer`. Remove their tests only if they test the deleted file. |
| 26 | `scripts/route-budgets.mjs` + `pnpm perf:budget`, `scripts/lighthouse-mobile.mjs` + `pnpm perf:lh` | **New** | §9. Chromium is used from the existing Playwright install; Lighthouse via `npx lighthouse` at run time (not a dependency). |

## 5. Tokens (STYLE-KIT is the source; `packages/design-tokens` is its code)

### 5.1 Single source
Both apps `@import` `packages/design-tokens/tokens.css` then `utilities.css`. No token may be declared in an app `globals.css` after S00-T01 (enforced by a test that fails if `apps/*/src/app/globals.css` declares **any** `--*` custom property — corrected at S00-CP1; the original 10-prefix list missed `--brand-*`, `--feedback-*`, `--border-*`, `--z-*` …).

### 5.2 Glow (D-007 — "a blink with a reason")
Keep/remove per CS §7. Final set:

| Token | Value (dark) | Light | Used only by utility |
|---|---|---|---|
| `--glow-cta` (was `primary-md`) | unchanged `primary-md` value | `none` | `.glow-cta` — primary CTA + Create (max one per screen) |
| `--glow-active` (was `primary-sm`) | unchanged | `none` | `.glow-active` — active tab/nav item |
| `--glow-focus` (was `primary-border`) | unchanged | `0 0 0 2px hsl(199 89% 48%)` (solid ring) | `.focus-ring` on `:focus-visible` |
| `--glow-celebrate` (was `primary-lg`) | unchanged | `none` | `.glow-celebrate` — one-shot keyframe, 600 ms, runs once |
| `--glow-live` (pulse) | `primary-sm ↔ primary-md`, 2000 ms | `none` | `.pulse-live` — live states only |
| `--glow-track` | unchanged | `none` | navigation progress bar |
| **Removed** | `primary-text`, `primary-pill`, `primary-pill-hover`, `primary-card-hover`, `primary-halo` | | struck in STYLE-KIT with date |

`@media (prefers-reduced-motion: reduce)`: `.pulse-live` and `.glow-celebrate` animations off (static glow may stay).
Light theme keeps "blink" meaning through **colour + weight**, not glow (glow tokens are `none` in light, as today).

### 5.3 Glass (D-007)
| Token | Value | Use |
|---|---|---|
| `--glass-subtle-bg` | `--bg-surface` at 72% (dark) / 78% (light) | top bar, tab bar, sheets, modals |
| `--glass-subtle-blur` | `blur(12px) saturate(150%)` (a full filter value — corrected at T03) | same |
| `--glass-strong-bg` / `-blur` | 55% / `blur(24px)` | **only** by explicit spec exception |
| `--glass-border` | `--border-subtle` at 60% | hairline under/over chrome |

Utilities `.glass-chrome`, `.glass-strong`: `@supports not (backdrop-filter: blur(1px))` → solid `--bg-surface`; `@media (prefers-reduced-transparency: reduce)` → solid. **Max 2 stacked glass layers** (e.g. sheet over tab bar): a sheet opened over glass chrome sets the chrome behind it to solid.

### 5.4 Sheet
`--sheet-radius` (= `radius/xl` top corners), `--sheet-max-h: 90dvh`, `--sheet-handle` (36×4, `--border-default`), `--scrim` (black 40% dark / 25% light), z from the existing z-ladder (`--z-modal`). Motion: slide-up §7.

### 5.5 Safe area & app chrome
`--safe-top: env(safe-area-inset-top)`, `--safe-bottom: env(safe-area-inset-bottom)`, `--safe-left/right`. `--tabbar-h: 56px` (+ `--safe-bottom`), `--topbar-h: 48px` (+ `--safe-top`). `--theme-color-dark` = dark `--bg-canvas` value, `--theme-color-light` = light `--bg-canvas` value (there is no `--bg-base`; corrected at S00-CP1) (mirrored as literals in `viewport.themeColor`, with a test asserting they match the CSS).

### 5.6 State kit
`--skeleton-base`, `--skeleton-shine` (both themes), shimmer `duration/shimmer` (1200 ms, existing). No new colours: error uses `--feedback-error-*`, offline uses `--feedback-warning-*`.

### 5.7 Both themes (D-013)
Every new token has dark + light values. Theme stays `defaultTheme="dark" enableSystem`. Theme choice: avatar menu + (later) Settings (S08).

## 6. App-feel

- **Manifest** (`app/manifest.ts`): `name: "Createconomy"`, `short_name: "Createconomy"`, `description` = current metadata description (founder-owned copy; unchanged), `start_url: "/feed?source=pwa"`, `scope: "/"`, `display: "standalone"`, `orientation: "portrait"`, `background_color` = dark `--bg-canvas`, `theme_color` = dark `--bg-canvas`, icons 192/512/512-maskable.
- **Icons:** logomark on brand-contrast background, generated (§4 #6). **Founder may supply a designed app icon later — it replaces the generated one, no code change beyond the image.**
- **Viewport** (`layout.tsx`): `width: "device-width"`, `initialScale: 1`, `viewportFit: "cover"`, `themeColor: [{ media: "(prefers-color-scheme: dark)", color: <dark> }, { media: "(prefers-color-scheme: light)", color: <light> }]`, `colorScheme: "dark light"`. Do **not** set `maximumScale`/`userScalable: false` (a11y).
- When the user picks a theme manually, update `<meta name="theme-color">` client-side to match (next-themes `resolvedTheme` effect).
- **Apple:** `metadata.appleWebApp = { capable: true, title: "Createconomy", statusBarStyle: "black-translucent" }`.
- **Standalone polish:** `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` on interactive elements, `overscroll-behavior-y: none` on the app root (keep inner scroll), `100dvh` not `100vh`, no hover-only affordances below `lg`.
- **Service worker: not in S00** (deliberate). Offline is handled by the state kit's offline notice. Revisit after beta. *(Q3 = yes, D-015.)*

## 7. Motion principles — "a blink with a reason"

Rule: an animation exists only if it **guides** (where did this come from / go), **confirms** (your action worked), **signals live** (something is happening now) or **celebrates** (a creator moment). Everything else is removed. `prefers-reduced-motion`: movement → opacity-only fade ≤ 160 ms; all glow motion off.

| Motion | Tokens | Purpose | Where |
|---|---|---|---|
| Press feedback (scale 0.97) | `duration/fast` 160, `ease/out-cubic` | Confirms the tap registered | tab items, buttons, cards |
| Sheet slide-up / swipe-down dismiss | `duration/overlay-in` 320 / `overlay-out` 300, `ease/pop-in` | Guides: the choice came from the bottom and goes back there | `ui/sheet.tsx` |
| Modal pop | `modal-in` 360 / `modal-out` 320 | Guides focus to a blocking decision | dialogs |
| Fade-in of loaded content over skeleton | `duration/normal` 200 | Guides: content replaced the placeholder, no jump | state kit |
| Skeleton shimmer | `duration/shimmer` 1200, linear | Signals live: still loading | skeletons (off under reduced motion) |
| Toast soft-float | `duration/float` 220 | Confirms an action (saved, hidden — with Undo) | toasts |
| Navigation progress track | `glow-track` + width | Signals live: navigation in progress | top progress bar |
| Tab switch icon/colour | `duration/fast` | Guides: you are here | tab bar |
| Pulse | `glow-live` 2000 ms | Signals live **state** (new items arriving, live thread) — never idle | only where a spec names a live state |
| Celebrate glow (one-shot) | `glow-celebrate` 600 ms | Celebrates a creator moment | publish, first comment, award (S03–S05 call it) |
| **Removed** | — | no reason | route "emerge" slide (420 ms) → replaced by the 200 ms fade; search 2.5 s spin ring; conic `glowing-effect`; card-hover glow; hover lift on touch; infinite pulses on idle UI; landing text glow |

## 8. Shell

- **Top bar (390):** `.glass-chrome`, height `--topbar-h` + `--safe-top`. Left: logomark + "Createconomy". Right: bell (unread badge) and avatar (menu: My profile, Settings, **Appearance: System / Dark / Light**, Sign out — as a **sheet** at < `lg`). **No theme toggle, no "+" below `lg`.** Logged out: "Sign in" button instead of bell + avatar.
- **Tab bar (founder: unchanged set):** Home · Search · Create · Alerts · Profile. `.glass-chrome`, padding-bottom `--safe-bottom`, hit targets ≥ 44×44. Labels always visible; **Create label uses `--text-primary`** (readable in both themes); only the Create circle carries `.glow-cta`. Active tab: `--brand-primary` icon + label + `.glow-active` (dark only); active matches the tab's **section** by path prefix: Home = `/feed`, `/discussions`, `/category`; Search = `/search`, `/discover`; Create = `/new-post`, `/drafts`; Alerts = `/notifications`; Profile = `/users/{own handle}`, `/settings`. Another member's `/users/…` activates no tab.
- **Search tab target:** today `/discover`. S00 points it to **`/search`**, whose empty state (S07) links to Discover. *(Q1 = yes, D-015.)*
- **Profile tab (D-010):** href = `/users/{handle}` when signed in; signed out → opens the auth modal. `/profile` redirects to own profile.
- **Content padding:** main content gets bottom padding `--tabbar-h` so nothing hides behind the bar; the composer's fixed bottom bar (CS §2.7) uses `--safe-bottom`.

## 9. Performance budget ("X performance")

**Field targets (p75, mobile, Vercel Speed Insights — already in `layout.tsx`):** **LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1** on every core route.
**Lab gate (Lighthouse mobile: Moto G Power emulation, slow 4G, 4× CPU; local seeded backend):** `/feed`, `/discussions/[slug]`, `/landing`, `/users/[handle]` — LCP ≤ 2.5 s, TBT ≤ 200 ms (INP proxy), CLS ≤ 0.1, Performance ≥ 90, in **both themes**.

**Initial client JS budgets (gzip, measured by `pnpm perf:budget` after `pnpm build`; today → budget):**

| Route | Today | Budget |
|---|---|---|
| `/landing`, `/signin` | 276 | **≤ 240** |
| `/feed` | 327 | **≤ 285** |
| `/discussions/[slug]` | 316 | **≤ 285** |
| `/new-post` (TipTap lazy, excluded) | 278 | **≤ 260** |
| `/users/[handle]`, `/notifications`, `/search`, `/discover`, `/category/[slug]`, `/leaderboard`, `/drafts`, `/setup` | 325–329 | **≤ 285** |
| `/settings/profile` | 345 | **≤ 300** |
| Any new route | — | ≤ 285 unless its spec sets one |

Where the savings come from (shell is ~50 KB over `/landing`): lazy-load `command-palette` (desktop only), drop `glowing-effect`, keep `motion` out of the shell (CSS transitions for §7 shell motions), remove dead components. **Ratchet rule:** budgets only go down; a spec that needs more must say so and why.
**CLS rules:** skeletons match final layout dimensions; images reserve aspect ratio; fonts `display: swap` with Geist metrics (already local).
**Check:** `scripts/route-budgets.mjs` reads `.next/build-manifest.json` + each `server/app/**/page_client-reference-manifest.js` `entryJSFiles`, gzips the union with root main files, prints the table and exits non-zero over budget (method used for the numbers in §2). Added to `pnpm` scripts; wiring into CI is a separate, later decision (CI only runs on `main`).

## 10. Copy — COPY-1 (D-011)

- **Label maps** (`src/lib/labels.ts`), one exported map per domain, every value human: notification types (all 17 literals in `schema.notifications.notificationType`), post types (`review` → "Review", …), completion badges (`email_verified` → "Email verified", `basic_profile_complete` → "Profile complete"), profile fields (`roleArchetype` → "Role", `ageBand` → "Age range", `toolsUsed` → "Tools you use", `bio` → "Bio"), hero slot kinds (`community_top` → "Community top", `editorial` → hidden — the pill already says "Featured"), review dimensions, report reasons, list modes. Unknown key → **hide the element** and `console.warn` in dev (never render the raw key).
- **Relative dates** (`src/lib/time.ts`): < 1 min "just now"; < 1 h "12m"; < 24 h "5h"; < 7 d "3d"; same year "Sep 21"; else "Sep 21, 2025". Full date + time in `title`/`<time dateTime>`. Replace every user-facing `toLocale*` date (14 files).
- **Leak cleanup:** fix all literal hits in CS §6 (top files: `post-detail-client.tsx`, `leaderboard-page-client.tsx`, `sell/*`, `new-post/*`, `settings-profile-client.tsx`, `canonical-thread.tsx`, `canonical-profile.tsx`, `canonical-feed-client.tsx`, the 5 "Connect Convex" guards). Pattern: **"not built yet" text → remove the element**; developer errors → human message (e.g. `POST_URL_NOT_ALLOWED … (CAP-087)` → "Links aren't allowed in posts yet. Add the link as a product or tool instead."). **Owner-review list:** every replacement string goes in `specs/S00-copy.md` (key, old, new) for founder sign-off in the BUILD report; legal/founder-owned strings keep their wording minus IDs.
- **Source-scan test** (`copy-leak.test.ts`): scans `apps/forum/src/**/*.tsx` and `packages/auth-ui/src/**/*.tsx` (excluding `__tests__`, comments, `className`, imports) for string literals / JSX text matching `CAP-\d|Phase \d|Wave-?\d|MAX pass|honest empty|\(M\d+\)|\bv\d\b|rules\.v\d|toolRatings|derivation-trail|display-only|[Ii]nterim|Convex|OAuth|\b[a-z]+_[a-z_]+\b` (last one only inside JSX text). Allowlist file `copy-leak.allow.ts` with a reason per entry (e.g. `/kit`, `/lab`). Fails the suite on any new hit.

## 11. No fabricated data (D-012)

- **`/category/[slug]`:** render the live feed filtered by type — reuse `CanonicalFeedClient` with a `typeFilter` prop passed to `api.feed.list` (arg exists: `convex/feed.ts:130`). Keep the slug validation + `notFound()`. Header = the type's human label + its one-line description (from the Discover copy, via label map). Empty → Empty state "No {type} posts yet" + "Write one" (to `/new-post?type=…`). Delete the static preview loader and its seed. S06 later designs the category home.
- **Leaderboard:** delete the `charCodeAt % 5` multiplier derivation. "Overall" keeps the real server data; category tabs (Best Commenter / Helper / Reviewer / Rising) show a designed Empty ("Not enough activity yet") until CR-006 lands — **never** client-invented ranks. Remove the "M12 / interim" footnote.
- **Rule for every later spec:** no static seeds, placeholder people, or client-computed scores on user-visible surfaces. Test: a Vitest scan fails if `apps/forum/src/app/**` imports from a `seed`/`fixtures`/`mock` path outside tests, `/kit` and `/lab`.

## 12. Tasks for the builder (one GLM build each, in order)

Every task's acceptance includes: **visible at 390 in dark AND light**, logged-in and logged-out where it applies; typecheck · lint · `pnpm test:run` green; no new copy-leak hits (from T14 on); screenshots in `specs/S00-evidence/T##/`.

| Task | Scope | Main files | Done when (acceptance) |
|---|---|---|---|
| — | **Verdict cadence (D-003 amendment):** Grok REVIEW after every task; Opus VERDICT batched at checkpoints **after T03, T12, T18**. | | |
| **S00-T01** Token single source | Move shared tokens to `packages/design-tokens/tokens.css`; both apps import it; app files keep only local rules; add the "no tokens in app globals" test. | `packages/design-tokens/*`, both `globals.css` | Forum + admin render **pixel-identical** to before at 390 + 1440, both themes (screenshot diff); admin `globals.css` < 100 lines; test green. |
| **S00-T02** New tokens + STYLE-KIT | Add glass, sheet, safe-area, theme-color, skeleton tokens (both themes); rename glow tokens per §5.2 (aliases kept until T05); update STYLE-KIT §2.2 + new sections with date. | `tokens.css`, `STYLE-KIT.md` | STYLE-KIT documents every new token with dark/light values; no visual change yet. |
| **S00-T03** Utilities | `.glow-cta`, `.glow-active`, `.focus-ring`, `.glow-celebrate`, `.pulse-live`, `.glass-chrome`, `.glass-strong`, safe-area helpers; reduced-motion + reduced-transparency + `@supports` fallbacks. `/lab/utilities` demo page (dev-only guard from T15 can land here first). | `utilities.css`, `app/(app)/lab/*` | Demo shows each utility in both themes; toggling OS reduced-motion stops pulse/celebrate; reduced-transparency makes glass solid. |
| **S00-T04** No fabricated data | §11: category = live filtered feed; leaderboard multipliers removed; fixtures-import test. | `category/[slug]/*`, `leaderboard-page-client.tsx` | `/category/review` shows real seeded review posts (no "Maya Chen @mayabuilds"); unknown slug 404; leaderboard category tabs show Empty, Overall unchanged; test green. |
| **S00-T05** Apply glow/glass guardrails | Replace all 25 glow uses + 10 ad-hoc `backdrop-blur` uses with utilities per CS §7; delete `glowing-effect.tsx`, search spin ring, removed tokens + aliases; add a scan test: no `backdrop-blur`/glow `shadow-[` outside `utilities.css`. | files listed in CS §7 / §2 | At 390 dark: only Create (and the page's one primary CTA) glow; focus ring visible on keyboard focus; no animated borders anywhere; light theme: no glow, focus ring solid; scan test green. |
| **S00-T06** App-feel | §6 manifest, icons, apple icon, viewport, theme-color (+ manual-theme sync), appleWebApp, standalone polish CSS. | `manifest.ts`, `icon.tsx`, `apple-icon.tsx`, `icons/[size]/route.tsx`, `layout.tsx` | iOS Safari + Android Chrome "Add to Home Screen" show the Createconomy icon and launch standalone; status bar matches theme in both themes; Lighthouse "installable" passes; pinch-zoom still works. |
| **S00-T07** Safe areas | Apply `--safe-*` to top bar, tab bar, composer bottom bar, sheets; content bottom padding = `--tabbar-h`; `100dvh`. | shell files, `new-post-composer.tsx` (bar only) | On a notched phone (or Safari device emulation) nothing sits under the notch/home indicator; last feed card fully visible above the tab bar. |
| **S00-T08** Sheet primitive | `ui/sheet.tsx`: bottom sheet (handle, auto height ≤ 90dvh, swipe-down dismiss via pointer events, scrim, focus trap, Esc, reduced motion) + side drawer (≥ `lg`); glass per §5.3 with the 2-layer rule. `/lab/sheet` demo. | `ui/sheet.tsx` | One-thumb: open, scroll content, swipe to dismiss at 390; keyboard + screen-reader operable; both themes. |
| **S00-T09** State kit components | Skeleton compositions, Empty (extend), ErrorState, OfflineState; route-group `error.tsx` ×3; `/lab/states` demo. | `ui/skeleton.tsx`, `ui/empty-state.tsx`, `ui/error-state.tsx`, `ui/offline-state.tsx`, `error.tsx` ×3 | Each state renders in both themes; ErrorState "Try again" re-renders the segment; OfflineState appears when DevTools goes offline and clears when back. |
| **S00-T10** Wire states — core A | `/feed`, `/discussions/[slug]`, `/new-post`, `/users/[handle]`, `/notifications`: skeleton loading (replace `return null`, `Suspense fallback={null}`, spinners, "Loading…"), Empty, Error, Offline (replace "Connect Convex"). | loaders/page clients of those routes, their `loading.tsx` | Throttled "Slow 4G": each route shows its skeleton from first paint (never blank); forced query error shows ErrorState; offline shows OfflineState; CLS ≤ 0.1 on swap. |
| **S00-T11** Wire states — core B | Same for `/landing`, `/signin`, `/setup`, `/search`, `/discover`, `/category/[slug]`, `/leaderboard`, `/drafts`, `/settings/profile`. Redirect routes unchanged. | same pattern | Same acceptance; scorecard CS §2.17 has no ✗ left in Loading/Error columns. |
| **S00-T12** Shell | §8: top bar (no theme toggle / "+" below `lg`, avatar-menu sheet with Appearance), tab bar (visible Create label, glow on Create only, prefix active state, Search → `/search`*, safe area, glass), Profile → own profile, `/profile` redirect (D-010); lazy-load command palette (desktop). | `top-nav.tsx`, `mobile-tab-bar.tsx`, `profile/page.tsx` | At 390 both themes: Create label readable; Profile tab opens `/users/{me}`; theme switch works from the avatar sheet and updates theme-color; logged-out Profile opens sign-in. *Search → `/search` (Q1 = yes, D-015). |
| **S00-T13** Labels, dates, leak cleanup | §10 label maps + relative time + fix every CS §6 literal and data-driven class; `specs/S00-copy.md` old→new table. | `lib/labels.ts`, `lib/time.ts`, CS §6 files | Baselines show no raw keys (`email_verified`, `community_top`, `roleArchetype`, "post comment"), no CAP/Phase/Wave/M-numbers, no "Connect Convex"; feed dates relative. |
| **S00-T14** COPY-1 test | §10 source-scan test + allowlist. | `lib/__tests__/copy-leak.test.ts` | Test green on the T13 tree; re-adding any CS §6 string makes it fail (prove with a temporary revert in the BUILD report). |
| **S00-T15** Hide `/kit`, `/lab` guard, dead code | `/kit` + `/lab` → `notFound()` in production; delete CS §5 dead components (+ tests that only cover them). | `kit/page.tsx`, `lab/*`, deleted files | `pnpm build && pnpm start`: `/kit` and `/lab` 404; dev: both work; no remaining imports of deleted files; test count change explained. |
| **S00-T16** Motion pass | §7: remove unlisted motions (route emerge → 200 ms fade, hover lift below `lg`, idle pulses); add press feedback; reduced-motion rules. | `globals.css` animations, shell, `ui/*` | Every animation on core routes maps to a §7 row (BUILD report lists them); OS reduced-motion → only fades ≤ 160 ms. |
| **S00-T17** Performance | `scripts/route-budgets.mjs` + `pnpm perf:budget`; `scripts/lighthouse-mobile.mjs` + `pnpm perf:lh`; make budgets pass (lazy/deferral as §9). | scripts, `package.json` scripts, shell imports | `pnpm perf:budget` green with the §9 table; Lighthouse mobile meets §9 on the 4 routes in both themes (numbers in BUILD report). |
| **S00-T18** Both-theme polish + baselines | Walk the 16 core routes at 390 in both themes; fix contrast/token issues found (tokens only); recapture baselines (`scripts/capture-baselines.mjs`) incl. **light** variants; CHANGELOG line; hand to GATE. | tokens, `capture-baselines.mjs` (add theme dimension) | WCAG AA contrast on text in both themes; baselines committed for dark + light × in/out × 390/1440; GATE file ready. Needs CR-009 for the open-signup baseline. |

## 13. Acceptance for the whole spec (GATE, Astra + founder)

- [ ] Benchmark side-by-side at 390 (dark + light): installed-app launch + `/feed` cold load vs Threads web and X web (D-005).
- [ ] Every core route: skeleton on first paint, Empty, Error, Offline — both themes.
- [ ] Manifest/icons/standalone/theme-color verified on one iPhone and one Android.
- [ ] Only purposeful glow (Create, primary CTA, active, focus, celebrate, live); glass only on chrome, ≤ 2 layers, solid fallbacks work.
- [ ] Profile tab → own profile; Create label readable; no theme toggle / "+" in the 390 top bar.
- [ ] No fabricated data on `/category/*` and `/leaderboard`.
- [ ] COPY-1 test green; `S00-copy.md` signed off by the founder.
- [ ] `pnpm perf:budget` green; Lighthouse mobile ≥ 90 with LCP/TBT/CLS in §9 on the 4 routes.
- [ ] typecheck · lint · forum tests · cap-coverage 572/572 · admin typecheck/lint.

**Founder questions — ANSWERED 2026-09-29: all four = yes (D-015). Build to the defaults below.**
- **Q1** Search tab → `/search` (Discover reachable from it) [**yes**] — today it opens `/discover`.
- **Q2** Theme switch at 390 lives in the avatar menu (sheet) [**yes**]; full appearance settings arrive in S08.
- **Q3** No service worker before beta [**yes**]; offline handled by the state kit.
- **Q4** Generated logomark icon is fine until a designed app icon is supplied [**yes**].

## 14. Data and influence signals

- **Queries used (existing only):** `feed.list` (with `typeFilter`), `feed.getChrome`, existing route queries unchanged. `useAuth().user.handle` for D-010. **No CR required for S00.** CR-009 (seed readiness → open sign-up) is needed only for T18's baselines.
- **Report-card signals:** S00 produces none. It must not change or drop any existing event emission (`rawEvents`, notifications, activity ledger) — label maps change display only, never stored keys. The state kit's ErrorState reports client errors to the console only (no new telemetry in S00).

## 15. Out of scope

Screen redesigns (feed card, thread, composer, profile, notifications — S02–S05), the 779-LOC hero carousel replacement (S02), settings content (S08), service worker, new npm dependencies, any `convex/` change, admin screen changes beyond consuming the shared tokens.
