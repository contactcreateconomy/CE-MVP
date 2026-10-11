---
id: FEED-B1
type: BUILD
author-model: Opus
round: 1
status: FOR REVIEW (Grok) → founder in browser (/lab/foundation)
date: 2026-10-11
---

# FEED-B1 — Foundations — build report

**Spec:** FEED-DESIGN.md §16.3 B1 (L-38, L-39, L-40, L-42, §7, §11.2, O-04; FEED-GAP F-2). **Branch:** `feed-b1-foundation` from `feed-base` @ a3eecaa. **Commits:** 2096831 · 659fd0d · feb848b · d201470 · 056292b · 7ab9530 · 9080c58 · 4020b3b · 8c90ac6 (+ this report). No backend touched.

## What changed
| # | File | Change |
|---|---|---|
| 1 | `apps/forum/src/lib/utils.ts` | `cn()` = `extendTailwindMerge` with the 22 named font-size tokens (`FONT_SIZE_TOKENS`, exported) |
| 2 | `packages/design-tokens/tokens.css` | `--frost-{subtle,strong,look}-bg`, `--frost-{subtle,strong}-blur` (no saturate), `--frost-highlight` — light + dark |
| 2 | `packages/design-tokens/utilities.css` | `@utility frost-strong / frost-subtle` (real blur, nested solid fallbacks for no-support + reduced transparency), `@utility frost-look` (no live blur, translucent 85% + 1px inset top highlight) |
| 2 | `components/ui/button.tsx`, `packages/auth-ui/src/ui/button.tsx`, `components/feed/feed-left-nav.tsx`, `components/layout/left-sidebar.tsx`, `components/layout/mobile-tab-bar.tsx`, `components/layout/top-nav.tsx` | glow at rest removed (primary button dark glow, auth-ui primary, Start Discussion CTA → `hover:glow-cta active:glow-active`, sidebar CTA, mobile Create tab, unread-bell pulse — the numeric badge stays). Hover/press glow kept. |
| 3 | `apps/forum/src/lib/motion.ts` (new) | `SPRINGS` feedback 520/34 · settle 260/30 · glide 140/22, `focusPull`, `STAGGER_S` 0.05, `motionFor(reduced)`, `useFeedMotion()`, `usePrefersReducedMotion()` (hydration-safe); rules at the top |
| 4 | `components/ui/createconomy-logo-mark.tsx` | gaps cut by geometry (truly transparent; were canvas-coloured rects), 2 units light / 2.3 dark (+15%), `reveal` prop; unused `separatorColor` dropped (no callers) |
| 4 | `utilities.css` | `.logo-reveal-segment` keyframes (staggered by `--i`, reduced motion = none) |
| 5 | `apps/forum/src/lib/theme-transition.ts` (new) + `utilities.css` | `themeSwitchVariant(?v)`, `runThemeSwitch()` on View Transitions; Iris / Horizon / reduced-motion fade CSS keyed on `html[data-theme-switch]` |
| 6 | `components/feed/canonical-feed-client.tsx` | inline hero grid + the then-unused `getChrome` subscription removed; AppShell hero untouched (B7) |
| lab | `app/(app)/lab/foundation/{page,foundation-client}.tsx`, `lab/page.tsx` link | `/lab/foundation?theme=dark|light&v=a|b` (404 in production) |

## Deviations from the spec (and why)
- **Logo gaps by geometry, not by mask/paint.** A mask needs unique SVG ids (`useId`), and the mark also renders from server components; the old painted separators showed as stripes on frost/photos. Same visual intent, no ids.
- **Frost alongside `glass-*`, not replacing it.** The prompt names `frost-*`; `glass-chrome` (shell today) carries `saturate(150%)` = the colour bleed L-40 forbids. I did not repoint the live shell in B1 (that is B6 scope) → PROPOSED L-68.
- **Mobile Create tab glow removed** although S00-SPEC §8 approved "glow on Create only" — L-38 (later) says never at rest. Needs PM record (see Q3).
- **Extra fixes found by the proofs** (each RED → GREEN): motion's `useReducedMotion` never switched a reduced-motion user after hydration; reduced variant left SSR'd blur/scale/y stuck.

## Evidence (`ak-redesign/specs/FEED-B1-evidence/`)
- RED/GREEN logs: `red-01-cn` → `green-01-cn`; `red-02-06` (frost, glow, logo, hero, motion, theme — all failing first) → `green-02-frost-glow`, `green-03-motion`, `red-04-logo-r2` → `green-04-logo`, `green-05-theme-switch`, `green-06-hero`; `red-03b/03c` → `green-03b/03c` (hydration, reduced reset).
- Screenshots: `foundation-{390,1440}-{dark,light}.png`, `foundation-1440-dark-reduced-motion.png`, `frost-closeup-{dark,light}@2x.png`, `logo-closeup-{dark,light}.png`, `theme-switch-{iris,horizon}-midframe-1440.png`.
- `computed-styles.txt`: frost-strong `blur(24px)` / frost-subtle `blur(12px)` / glass-chrome `blur(12px) saturate(1.5)`; frost-look `backdrop=none` + inset highlight; Primary + Start Discussion `box-shadow: none` at rest both themes; Start Discussion hover = `--glow-cta` in dark, none in light.
- Gate (`gate.txt`): typecheck ✅ · lint ✅ (0) · typecheck:admin ✅ · forum tests **73 files / 997 tests ✅** · convex tests n/a (no backend) · cap-coverage not run (no capability change).
- Not proven here: `/feed` itself (no Convex URL in this container → `CanonicalFeedClient` renders null); hero removal is proven by source test + suite only. The container's headless Chromium paints `backdrop-filter` only with `--use-angle=swiftshader` (used for every capture). Node 22 in the container vs `.nvmrc` 24.

## Acceptance checklist (self-check — not acceptance)
- ✅ cn() keeps size + colour, two sizes still conflict, list == tokens.css
- ✅ frost-strong/subtle real blur + fallbacks, neutral; frost-look no live blur + 1px highlight
- ✅ no glow at rest except listed active/open states + focus (test-fenced)
- ✅ motion springs/focus pull/stagger/reduced crossfades; rules documented
- ✅ logo dark gaps +15%, transparent, 3-segment reveal
- ✅ Iris / Horizon behind ?v=a|b, reduced → crossfade, no API → instant
- ✅ inline hero grid gone; AppShell hero kept
- ✅ both themes · 390 + 1440 · reduced motion screenshot
- ⬜ founder picks Iris vs Horizon (O-04), judges frost/logo in a real browser

## Open questions
1. **PROPOSED L-67** — Iris / Horizon were only named in the spec. Built as: Iris = new theme opens as a circle from the toggle; Horizon = dark falls from the top (dusk), light rises from the bottom (dawn); 500ms `--ease-emerge`; reduced motion = 200ms crossfade. Founder confirms the reading, then picks one (O-04).
2. **PROPOSED L-68** — B6 moves the shell from `glass-chrome` / `glass-strong` to `frost-subtle` / `frost-strong` and retires `glass-*` (one glass family; removes the saturate bleed).
3. **PROPOSED L-69** — L-38 supersedes S00-SPEC §8 "glow on Create only" (mobile tab bar now has no glow at rest).
4. **PROPOSED L-70** — the sorter's active pill counts as `glow/active` (L-38) vs §9.4 "solid brand, no glow at rest". Kept glow-active for now (feed-tabs, trend-sorter); founder to say which wins.
5. Logo reveal is available (`reveal` prop) but not wired to first load — belongs to B6 shell. OK?
6. `/lab/feed` uses the same `?theme=` effect pattern that undid toggles here (not verified there; not changed — outside B1).
7. Graph: `graph-explain` / `tables.json` were fresh at start (built 9fa7af0); the new files (`motion.ts`, `theme-transition.ts`, lab) are not in the graph until GLM regenerates after merge (L-56).

## Lines to append to FEED-DESIGN.md §17
```
- 2026-10-11 — FEED-B1 foundation (branch feed-b1-foundation, FEED-B1-BUILD.md): cn() knows the 22 font-size tokens; frost-strong/-subtle/-look utilities (neutral, no saturate; frost-look no live blur); glow at rest removed (primary button, auth button, Start Discussion, sidebar CTA, mobile Create, bell pulse) and test-fenced; lib/motion.ts (feedback/settle/glide, focus pull, 50ms stagger, hydration-safe reduced motion); logo gaps transparent, +15% in dark, 3-segment reveal; theme-switch candidates Iris/Horizon at /lab/foundation?v=a|b; CanonicalFeedClient hero grid removed (F-2). PROPOSED L-67 (Iris/Horizon reading), L-68 (shell glass-* → frost-* in B6), L-69 (L-38 supersedes S00 Create-tab glow), L-70 (sorter active pill = glow/active?).
```
