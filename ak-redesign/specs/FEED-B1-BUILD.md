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

---

# Round 2 — FEED-B1 FIX (2026-10-12)

Rebased on `feed-base` @ 153c43f (DESIGN-BIBLE v1, L-67…L-72). Cites Bible §3, §9, §10 (L-71).

## What changed
| Decision | Change | Proof (RED → GREEN) |
|---|---|---|
| **L-72** taps critically damped | `SPRINGS.feedback` 520/34 → **520/46** (ratio 0.745 → 1.009). Kept stiffness/damping (one form for all three springs; `bounce/duration` gave no extra clarity). | `red-07` (ratio 0.745; motion's own `spring()` peaked at **1.0298**) → `green-07`: ratio ∈ [1, 1.1), generator peak = **1.0000**, 95% reached at **212ms** (≈ Bible response 0.2s) |
| **L-70** sorter pill no glow | `feed-tabs.tsx` drops `glow-active`, `trend-sorter.tsx` drops `shadow-glow-primary-pill`; glow-at-rest allowlist loses trend-sorter; new test: neither sorter file contains any glow class, brand fill kept | `red-08` → `green-08`; browser: `/lab/feed` pill `box-shadow: none` (`sorter-no-glow-lab-feed-1440-dark.png`) |
| **L-67** Iris chosen | `runThemeSwitch` defaults to Iris; shared `applyTheme()`; `utilities.css` keeps only Iris + reduced-motion fade; **Horizon moved to `lab/foundation/horizon.css`** (lab-only, `?v=b`); **top-nav theme toggle now uses Iris** from the button (reduced motion → crossfade, no API → instant) | `red-09` → `green-09` (incl. "no horizon/dusk/dawn in shared CSS", "top-nav calls runThemeSwitch"); browser: Iris default mid-frame + Horizon under `?v=b` (`theme-switch-iris-default-…`, `theme-switch-horizon-lab-…`) |
| Bible §10.7 (lab only) | lab spring demo press scale 0.94 → **0.97** + dim 0.9 | visual |

Gate: typecheck ✅ · lint ✅ · typecheck:admin ✅ · forum tests **73 files / 1000 tests ✅** · no console errors on `/lab/foundation`.

## Bible check — gaps (reported, not fixed unless listed above)
| # | Bible | Gap in B1 | Proposed fix · phase |
|---|---|---|---|
| G1 | §3.1 shadows per layer (L1 `shadow/xs`, L2 `shadow/md`, L3 `shadow/lg`) | `frost-*` utilities carry material only — no layer shadow | **PROPOSED L-73:** bake the layer shadow into each frost utility (`frost-look`+xs, `frost-subtle/strong`+md) so a material can't be used at the wrong depth; L3 adds `shadow-lg` at the call site · B1-fix or B6 |
| G2 | §3.2 rule 8 `prefers-contrast: more` → solid + 1px border | not handled (only reduced-transparency + no-support) | add nested `@media (prefers-contrast: more)` to all three frost utilities · small, B1-fix |
| G3 | §3.2 rule 4 scroll-edge fade under glass | no utility yet | B6 (shell) |
| G4 | §3.2 rule 5 35% dark dim over bright media | no token/utility | B7 (hero) |
| G5 | §9.3 `settle` ≈1.0 | 260/30 = ratio **0.93** (peak 1.00013 — invisible); `glide` 0.93 is inside 0.9–1.0 ✅ | optional: settle damping 33 (ratio 1.02) · founder taste |
| G6 | §9.2 rule 2 never block input | the Iris View Transition makes the page non-interactive for its 500ms | accept as the one exception (user-caused, rare) or shorten Iris to `--duration-emerge` 420ms · founder |
| G7 | §9.2 rule 5 transform/opacity only | Iris animates `clip-path` | Bible names Iris as a signature move (§9.4) → accepted exception; record it |
| G8 | §9.2 rule 9 no sustained oscillation | `pulse-live` (2000ms infinite) and `.animate-pulse-glow` still exist in `utilities.css` (no product use after B1; `pulse-live` only in `/lab/utilities`) | cap to 3 pulses then rest when Live is built; retire `animate-pulse-glow` · B6/B13 |
| G9 | §9.2 rule 1 + §10.7 press ≈0.97 + dim on pointer-down within 100ms | **`Button` (forum + `auth-ui`) has no press scale**; primary only drops its hover lift; transition is `duration-normal` 200ms (> 100ms); no 100ms duration token exists | **PROPOSED L-74:** base Button gets `active:scale-97` + slight dim and a new `--duration-press: 100ms` token (STYLE-KIT addition → founder/PM) · B5 or a B1-fix |
| G10 | §10.6 focus = visible solid ring, both themes | dark `--glow-focus` = 1px ring + 15px halo (thin; halo is glow); light = solid 2px ✅. `Button` itself uses its own `ring-2` ✅ | make dark `--glow-focus` a solid 2px ring (halo optional) · B13 |
| G11 | §10.2 hover delays (0 / ~150 / ~500ms) | not in B1 scope; no tokens for 150/500 delays yet | B5/B6 |
| — | §3.2 rules 1–3, 6; §4 rules 1–4; §9.2 rules 3, 8, 11; §10 rules 3–6 | ✅ met by B1 pieces (neutral frost, no live blur on cards, reduced motion = crossfade, hover adds no layout in lab) | — |

Also found (outside B1): `/lab/feed` throws a hydration error — `feed-lab-client.tsx:83` renders `resolvedTheme` text during SSR (same bug fixed in `/lab/foundation`); its `?theme=` effect also re-forces the theme on every toggle. B1 only changed class strings in `feed-tabs`. One-line fixes; not applied (lab/feed is s02 scope).

## Open questions
1. G1 + G2 (frost shadows, high-contrast fallback): fold into B1 now (small, frost is B1's) or B6?
2. G9 press state: approve `--duration-press: 100ms` (new token) + `active:scale-97` on Button?
3. G6/G7: record Iris as the accepted exception to Bible §9.2 rules 2 and 5?

## Lines to append to FEED-DESIGN.md §17
```
- 2026-10-12 — FEED-B1 fix round (FEED-B1-BUILD.md "Round 2"): L-72 feedback spring 520/46 (ratio ≈1.01; motion spring peak 1.0000, 95% at 212ms); L-70 sorter pill solid brand, no glow (feed-tabs, trend-sorter; test-fenced); L-67 Iris is the product theme switch (top-nav), Horizon kept lab-only at ?v=b. Bible audit gaps G1–G11 reported: PROPOSED L-73 (layer shadow baked into frost utilities), L-74 (Button press 0.97 + --duration-press 100ms); prefers-contrast fallback for frost missing; Iris = accepted exception to §9.2 rules 2 & 5 (to record).
```
