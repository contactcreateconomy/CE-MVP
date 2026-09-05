# CREATECONOMY — STYLE KIT (visual extraction)

> **Scope:** Pure visual style kit extracted from `CREATECONOMY_DESIGN_SYSTEM.md` v2.0.
> Styling tokens and component mechanics only. Product/page/category/gamification logic
> has been stripped (see `NOTES.md` for what was excluded and why).
> Extraction-only — no rewriting or reconciliation.
>
> **2026-08-29 — F-24 close:** §11.10–§11.25 add mechanical component specs for
> `AUDIT-FINAL.md` F-24 gaps (A1–A13 extras + banner / datetime / combobox /
> legal-prose / empty-state / sanitized-markdown). All new specs reuse existing
> tokens (`space/*`, `radius/*`, color, `duration/*`, `ease/*`). §11.26
> (tiered ladder) is **reserved** — founder sign-off in `DESIGN-SYSTEM-OPEN-ITEMS.md`.
> Token sections §2–§10 and existing §11.1–§11.9 are unchanged.

---

## 2. DESIGN TOKENS — COLOR

> **RECONCILED 2026-08-31 against the real app (`apps/forum/src/app/globals.css`).**
> Where this section and the shipped app disagreed, **the app won**; all corrections are
> logged in `Decisions/RECONCILIATION-NOTE.md` (#2–#6). Canonical token sheet:
> `CEMVP/frontend-kit/globals.css`. Key changes: dark surfaces are **pure-neutral
> `hsl(0 0% n%)`**, not zinc; brand/feedback are stored as **hsl()**; text/link tokens
> and category accents are now tokenized. Below, the tables reflect the corrected values.

### 2.1 Brand Primary — Electric Blue

This is not a corporate blue. It is a luminous, energy-based cyan-blue that feels alive on dark surfaces.

**Why #0EA5E9 (Sky-500) over standard Blue-500 (#3B82F6)**:
- More cyan = more electric, more futuristic
- Better glow rendering on dark backgrounds
- Distinct from Facebook/LinkedIn/Twitter blues
- Superior light-to-dark range for full spectrum usage
```
TOKEN NAME              HEX         TAILWIND      USAGE
─────────────────────────────────────────────────────────────
brand/primary           #0EA5E9     sky-500       Hero CTA, active states, links, focus rings
brand/primary-hover     #38BDF8     sky-400       Hover state, glow halo
brand/primary-bright    #7DD3FC     sky-300       Highlights, selection indicators
brand/primary-subtle    #BAE6FD     sky-200       Light mode tints, badge backgrounds
brand/primary-whisper   #E0F2FE     sky-100       Background tints (light mode only)
brand/primary-pressed   #0284C7     sky-600       Active/pressed state
brand/primary-deep      #0369A1     sky-700       Dark borders, deep accents
brand/primary-midnight  #075985     sky-800       Surface accents on dark backgrounds
brand/primary-abyss     #0C4A6E     sky-900       Deepest accent layer
```

### 2.2 Electric Glow System

The signature visual trait. Glows only appear in dark mode — light mode substitutes solid color treatments.

```
GLOW TOKEN                CSS VALUE (hsl, real-app notation)            USAGE
──────────────────────────────────────────────────────────────────────────────────
glow/primary-sm           0 0 10px hsl(199 89% 48% / 0.20)              Cards on hover, active nav items
glow/primary-md           0 0 20px hsl(199 89% 48% / 0.35),             Primary buttons, CTAs, focus states
                          0 0 60px hsl(199 89% 48% / 0.15)
glow/primary-lg           0 0 30px hsl(199 89% 48% / 0.40),             Hero elements, featured content
                          0 0 80px hsl(199 89% 48% / 0.20)
glow/primary-text         0 0 40px hsl(199 89% 48% / 0.50)              Landing page hero headings only
glow/primary-border       0 0 0 1px hsl(199 89% 48%),                   Focused inputs, active cards
                          0 0 15px hsl(199 89% 48% / 0.25)
glow/primary-pulse        Animated: glow-sm → glow-md → glow-sm        Live indicators, active states
                          Duration: 2000ms, infinite loop
```

**Plus four app-supplied glows that previously lived as raw box-shadows in components (now named — RECONCILIATION-NOTE #6):**

```
glow/primary-pill           0 8px 24px hsl(199 89% 48% / 0.28)          Sidebar primary pill
glow/primary-pill-hover     0 10px 28px hsl(199 89% 48% / 0.35)         Sidebar primary pill hover
glow/primary-card-hover     0 0 22px /0.09, 0 0 40px /0.04,             Feed post-card hover glow
                            0 10px 28px hsl(199 89% 48% / 0.035)
glow/primary-track          0 0 6px /0.5, 0 0 14px hsl(199 89% 48% / 0.2)  Navigation progress bar
```

**Rule**: Glow effects are DISABLED in light mode and when `prefers-reduced-motion` is active. In the app this is implemented by setting the glow tokens to `none` in `:root` (light) and real values only in `.dark`.

### 2.3 Dark Mode Surfaces

Default mode. All designs start here.

**Values below are the real app's (`globals.css` `.dark`) — pure-neutral hue-0 grays, NOT zinc's blue-hued 240. This was the single largest drift (see RECONCILIATION-NOTE #2).**

```
TOKEN NAME              REAL VALUE                        USAGE
──────────────────────────────────────────────────────────────────────────────
bg/canvas               hsl(0 0% 2%)        ≈ #050505     Root app background
bg/surface              hsl(0 0% 7.1%)      ≈ #121212     Cards, panels, containers
bg/surface-elevated     hsl(0 0% 9%)        ≈ #171717     Dropdowns, modals, tooltips
bg/overlay              hsl(0 0% 12%)       ≈ #1F1F1F     Hover backgrounds
bg/inset                hsl(0 0% 4%)        ≈ #0A0A0A     Recessed areas, code blocks
bg/wash                 hsl(0 0% 100% / 0.03)              Subtle surface differentiation
```

```
TOKEN NAME              REAL VALUE                          USAGE
──────────────────────────────────────────────────────────────────────
border/subtle           hsl(0 0% 11%)        ≈ #1C1C1C     Lightest separation
border/default          hsl(0 0% 15%)        ≈ #262626     Standard borders
border/prominent        hsl(0 0% 20%)        ≈ #333333     Emphasized borders
border/active           hsl(199 89% 48%)     = sky-500     Focus/active state borders
```

```
TOKEN NAME              REAL VALUE                          USAGE
──────────────────────────────────────────────────────────────────────
text/primary            hsl(0 0% 98%)        ≈ #FAFAFA     Headings, body text
text/secondary          hsl(0 0% 65%)        ≈ #A6A6A6     Supporting text, metadata
text/muted              hsl(0 0% 46%)        ≈ #757575     Timestamps, hints, placeholders
text/disabled           hsl(0 0% 34%)        ≈ #575757     Disabled state text
text/inverse            hsl(0 0% 2%)         = canvas      Text on light/accent backgrounds
text/link               hsl(199 89% 48%)     = sky-500     Interactive links
text/link-hover         hsl(199 94% 60%)     ≈ sky-400     Link hover state
```

**Light mode glow substitution**:
| Dark Mode | Light Mode Equivalent |
|---|---|
| Blue glow shadow | Solid blue borders or underlines |
| Glowing buttons | Solid filled buttons with subtle shadow |
| Neon accent lines | Sky-100 background tints + solid blue accents |
| text-shadow glow | No text-shadow; use color intensity instead |

### 2.4 Light Mode Surfaces

Toggle-available. Same semantic tokens, different values.

**Values below are the real app's (`globals.css` `:root`) — light mode was already aligned with the intent here; notation corrected to hsl.**

```
TOKEN NAME              REAL VALUE (LIGHT)
─────────────────────────────────────────────
bg/canvas               hsl(0 0% 100%)          white
bg/surface              hsl(0 0% 98%)
bg/surface-elevated     hsl(240 5% 96%)
bg/overlay              hsl(240 5% 90%)
bg/inset                hsl(240 5% 96%)
bg/wash                 hsl(0 0% 0% / 0.02)
```

```
border/subtle           hsl(240 5% 96%)
border/default          hsl(240 5% 90%)
border/prominent        hsl(240 5% 84%)
border/active           hsl(199 89% 48%)       (same as dark)
```

```
text/primary            hsl(240 10% 4%)
text/secondary          hsl(240 5% 34%)
text/muted              hsl(240 4% 46%)
text/disabled           hsl(240 5% 65%)
text/inverse            hsl(0 0% 98%)
text/link               hsl(200 98% 39%)        (darker for contrast on white)
text/link-hover         hsl(199 89% 48%)
```

### 2.5 Semantic / Feedback Colors

```
SUCCESS
  Token                   Dark Mode                Light Mode
  ─────────────────────────────────────────────────────────────
  feedback/success         #22C55E (green-500)      #22C55E
  feedback/success-bg      rgba(34,197,94,0.10)     #F0FDF4 (green-50)
  feedback/success-border  #16A34A (green-600)      #16A34A
  feedback/success-text    #4ADE80 (green-400)      #15803D (green-700)

ERROR / DESTRUCTIVE
  Token                   Dark Mode                Light Mode
  ─────────────────────────────────────────────────────────────
  feedback/error           #EF4444 (red-500)        #EF4444
  feedback/error-bg        rgba(239,68,68,0.10)     #FEF2F2 (red-50)
  feedback/error-border    #DC2626 (red-600)        #DC2626
  feedback/error-text      #F87171 (red-400)        #B91C1C (red-700)

WARNING
  Token                   Dark Mode                Light Mode
  ─────────────────────────────────────────────────────────────
  feedback/warning         #F59E0B (amber-500)      #F59E0B
  feedback/warning-bg      rgba(245,158,11,0.10)    #FFFBEB (amber-50)
  feedback/warning-border  #D97706 (amber-600)      #D97706
  feedback/warning-text    #FBBF24 (amber-400)      #92400E (amber-800)

INFO
  Token                   Dark Mode                Light Mode
  ─────────────────────────────────────────────────────────────
  feedback/info            #0EA5E9 (sky-500)        #0EA5E9
  feedback/info-bg         rgba(14,165,233,0.10)    #E0F2FE (sky-100)
  feedback/info-border     #0284C7 (sky-600)        #0284C7
  feedback/info-text       #38BDF8 (sky-400)        #0369A1 (sky-700)
```

*(Subsections 2.6 category colors and 2.7 gamification colors omitted — tied to stale product lists.)*

---

## 3. DESIGN TOKENS — TYPOGRAPHY

### 3.1 Font Family

**Primary**: Geist (by Vercel)
- Optimized for screen rendering, not print
- Ships natively with Next.js (zero-config CDN)
- Variable font: single file, all weights
- Free, open-source, commercial-ready
**Monospace**: Geist Mono
- Code blocks, terminal output, technical content, point values
**Fallback stack**: `'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
**Mono fallback**: `'Geist Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace`

### 3.2 Type Scale (4px Grid Aligned)

All line heights are multiples of 4px. All font sizes are tested for WCAG AA contrast.

```
DISPLAY (Landing page heroes, marketing headlines)
──────────────────────────────────────────────────────────────────────────
Token            Size    Line-H   Tracking   Weight           Mobile Size
display/2xl      72px    80px     -2.0px     Geist Bold 700   48px
display/xl       60px    68px     -1.8px     Geist Bold 700   36px
display/lg       48px    56px     -1.5px     Geist Bold 700   30px
display/md       36px    44px     -1.2px     Geist Semi 600   24px
display/sm       30px    36px     -0.8px     Geist Semi 600   24px

HEADING (Page titles, section headers, card titles)
──────────────────────────────────────────────────────────────────────────
Token            Size    Line-H   Tracking   Weight           Mobile Size
heading/xl       30px    36px     -0.5px     Geist Semi 600   24px
heading/lg       24px    32px     -0.4px     Geist Semi 600   20px
heading/md       20px    28px     -0.3px     Geist Med 500    18px
heading/sm       16px    24px     -0.2px     Geist Med 500    16px
heading/xs       14px    20px     -0.1px     Geist Med 500    14px

BODY (Post content, comments, descriptions, form labels)
──────────────────────────────────────────────────────────────────────────
Token            Size    Line-H   Tracking   Weight
body/lg          18px    28px     0.0px      Geist Regular 400
body/md          16px    24px     0.0px      Geist Regular 400
body/sm          14px    20px     0.0px      Geist Regular 400
body/xs          12px    16px     0.0px      Geist Regular 400

LABEL / CAPTION (Buttons, tags, badges, timestamps, metadata)
──────────────────────────────────────────────────────────────────────────
Token            Size    Line-H   Tracking   Weight
label/lg         14px    20px     0.1px      Geist Med 500
label/md         12px    16px     0.1px      Geist Med 500
label/sm         11px    16px     0.2px      Geist Med 500
caption          12px    16px     0.0px      Geist Regular 400
overline         11px    16px     0.8px      Geist Semi 600 UPPERCASE

CODE / MONO (Code blocks, terminal, technical content, point values)
──────────────────────────────────────────────────────────────────────────
Token            Size    Line-H   Tracking   Weight
code/lg          16px    24px     0.0px      Geist Mono Regular
code/md          14px    20px     0.0px      Geist Mono Regular
code/sm          12px    16px     0.0px      Geist Mono Regular
```

### 3.3 Typography Rules

1. **Maximum 3 weights on any single screen**: Regular (400), Medium (500), Semibold (600). Bold (700) reserved for display/hero only.
2. **Never use Geist Thin or UltraLight** in the product UI. Reserved for marketing/print if ever needed.
3. **Heading hierarchy must be sequential**: H1 → H2 → H3. Never skip.
4. **Body text never exceeds 720px line length** (approximately 65-75 characters per line for optimal readability).
5. **Point values always use Geist Mono** to give them a "counter" feel.
6. **All-caps usage is restricted to**: overline labels, category pills, badge text, and button text on specific variants.

---

## 4. DESIGN TOKENS — SPACING & GRID

### 4.1 Spacing Scale (4px Base)

```
TOKEN           VALUE    USAGE
────────────────────────────────────────────────────────────────
space/0         0px      Reset
space/0.5       2px      Micro gaps (icon-to-text when extremely tight)
space/1         4px      Tight inline spacing, hairline gaps
space/1.5       6px      Small icon internal padding
space/2         8px      Small gaps, badge internal padding, inline element gaps
space/3         12px     Component internal padding (compact)
space/4         16px     Standard padding, card internal padding, form field gaps
space/5         20px     Medium vertical gaps
space/6         24px     Section padding, generous card padding
space/8         32px     Large gaps between sections, page horizontal padding (desktop)
space/10        40px     Major section breaks
space/12        48px     Page-level vertical spacing
space/16        64px     Hero section internal spacing
space/20        80px     Landing page section gaps
space/24        96px     Landing page mega section gaps
space/32        128px    Landing hero top padding
```

### 4.2 Layout Constants

```
PAGE PADDING
  Desktop:              32px (space/8) horizontal
  Tablet:               24px (space/6) horizontal
  Mobile:               16px (space/4) horizontal

CARD PADDING
  Standard:             16px (space/4) all sides
  Compact:              12px (space/3) all sides
  Generous:             24px (space/6) all sides

CARD GAPS
  Feed cards:           16px (space/4) vertical gap
  Grid cards:           16px (space/4) both axes
  Sidebar widgets:      16px (space/4) vertical gap

SECTION GAPS
  App pages:            32px (space/8) between sections
  Landing page:         80px-96px (space/20 to space/24) between sections
  
FORM ELEMENTS
  Field gap:            16px (space/4) between form fields
  Label-to-input:       6px (space/1.5)
  Input internal:       10px top/bottom, 12px left/right
  Button internal:      8px top/bottom, 16px left/right (default size)

INLINE ELEMENTS
  Icon-to-text:         6px (space/1.5)
  Badge-to-badge:       4px (space/1)
  Avatar-to-name:       8px (space/2)
```

### 4.3 Grid System

```
DESKTOP (≥1024px)
  Grid:                 12-column
  Gutter:               24px
  Margin:               32px
  Max container:        1440px (centered)

  APP LAYOUT:
  ┌──────────┬────────────────────────────────┬───────────┐
  │ Left     │ Main Content                   │ Right     │
  │ Sidebar  │ (fluid, fills remaining)       │ Sidebar   │
  │ 240px    │                                │ 320px     │
  │ fixed    │                                │ fixed     │
  └──────────┴────────────────────────────────┴───────────┘

  Collapsed sidebar: 64px (icon-only mode)

TABLET (768px-1023px)
  Grid:                 8-column
  Gutter:               16px
  Margin:               24px
  Layout:               2-column (left sidebar + main content)
  Right sidebar:        Hidden → moved to separate page or bottom

MOBILE (<768px)
  Grid:                 4-column
  Gutter:               16px
  Margin:               16px
  Layout:               Single column
  Sidebars:             Hidden → bottom tab nav + drawer

CONTENT COLUMN WIDTHS
  Landing page:         1280px max
  App layout:           1440px max (with sidebars)
  Reading column:       720px max (post content, editor)
  Modal content:        560px max (standard modal)
  Auth cards:           420px max (login/signup forms)
```

---

## 5. DESIGN TOKENS — ELEVATION & SHADOWS

> **RECONCILED 2026-08-31:** dark-mode xs–lg values are the real app's (`globals.css`); `shadow/xl` is kit-supplied (reserved lightbox tier, unused in the app today). Light-mode values unchanged. Notation is hsl, per the app.

### 5.1 Shadow Scale

```
DARK MODE SHADOWS (Use hsl black for depth on dark surfaces — real app values)
──────────────────────────────────────────────────────────────────────────
Token               CSS Value                                         Usage
shadow/none         none                                              Reset
shadow/xs           0 1px 2px hsl(0 0% 0% / 0.30)                    Subtle depth on cards at rest
shadow/sm           0 1px 3px hsl(0 0% 0% / 0.25),                   Post cards, buttons
                    0 1px 2px hsl(0 0% 0% / 0.15)
shadow/md           0 4px 6px hsl(0 0% 0% / 0.30),                   Dropdowns, popovers, elevated cards
                    0 2px 4px hsl(0 0% 0% / 0.15)
shadow/lg           0 10px 15px hsl(0 0% 0% / 0.35),                 Modals, sheets, menus
                    0 4px 6px hsl(0 0% 0% / 0.20)
shadow/xl           0 20px 25px hsl(0 0% 0% / 0.40),                 Dialogs, lightbox (kit-supplied)
                    0 10px 10px hsl(0 0% 0% / 0.25)

LIGHT MODE SHADOWS (Lighter opacity, less dramatic — unchanged)
──────────────────────────────────────────────────────────────────────────
shadow/xs           0 1px 2px hsl(0 0% 0% / 0.05)
shadow/sm           0 1px 3px hsl(0 0% 0% / 0.08),
                    0 1px 2px hsl(0 0% 0% / 0.04)
shadow/md           0 4px 6px hsl(0 0% 0% / 0.10),
                    0 2px 4px hsl(0 0% 0% / 0.05)
shadow/lg           0 10px 15px hsl(0 0% 0% / 0.12),
                    0 4px 6px hsl(0 0% 0% / 0.06)
shadow/xl           0 20px 25px hsl(0 0% 0% / 0.15),
                    0 10px 10px hsl(0 0% 0% / 0.08)
```

### 5.2 Elevation Layers (Conceptual Mapping)

```
Layer 0 — Canvas (bg/canvas)           No shadow
Layer 1 — Surface (bg/surface)         shadow/xs           Cards at rest, panels
Layer 2 — Elevated (bg/surface-elevated) shadow/md         Dropdowns, active cards, hover
Layer 3 — Overlay (bg/overlay)         shadow/lg           Modals, sheets, drawers
Layer 4 — Top (no specific bg)         shadow/xl           Lightbox, critical dialogs
```

---

## 6. DESIGN TOKENS — BORDER RADIUS

> **RECONCILED 2026-08-31:** the real app uses four undocumented radii (`rounded-[14px]` menus/panels, `[10px]`/`[9px]` menu rows, `[20px]` auth modal, `[28px]` hero cards) alongside the four tokens below. All are now named (RECONCILIATION-NOTE #8). Rule: the named scale governs; raw `rounded-[Npx]` is banned in new code.

```
TOKEN           VALUE    USAGE
────────────────────────────────────────────────────────────────
radius/none     0px      Razor-sharp elements (rare, intentional only)
radius/sm       4px      Small inline tags, code snippets
radius/md       8px      DEFAULT — cards, inputs, buttons, dropdowns
radius/lg       12px     Modals, large cards, panels
radius/xl       16px     Feature cards, hero sections, sheets
radius/2xl      24px     Pill-shaped special elements
radius/full     9999px   Avatars, pills, badges, toggles, chips
radius/menu     14px     Dropdown/command panels, category pills, toast cards (real app)
radius/menu-item 10px    Menu rows, search-result rows (real app)
radius/modal-auth 20px   Auth modal surface (real app)
radius/hero     28px     Hero carousel media cards (real app)
```

**Rules**:
- **Cards**: `radius/lg` (12px)
- **Buttons**: `radius/md` (8px) — except pill buttons use `radius/full`
- **Inputs**: `radius/md` (8px)
- **Modals/Sheets**: `radius/xl` (16px) — rounded top only for bottom sheets
- **Avatars**: Always `radius/full`
- **Category pills & badges**: `radius/full`
- **Tags**: `radius/md` (8px)
- **Nested element rule**: Inner radius = outer radius - padding. If a card (12px radius) has 16px padding, inner elements use max 8px radius.

---

## 7. DESIGN TOKENS — MOTION & ANIMATION

### 7.1 Duration Scale

> **RECONCILED 2026-08-31:** STYLE-KIT's original scale (50/100/200/300/400/600) never shipped — the real app's animation vocabulary is below (RECONCILIATION-NOTE #9). Values in ms.

```
TOKEN                       VALUE    USAGE
────────────────────────────────────────────────────────────────────────────
duration/instant            0ms      No animation (accessibility override)
duration/stagger-step       50ms     Stagger step; toggle-word entry delay
duration/fast               160ms    Micro opacity/fades (toggle letter), fast hovers
duration/normal             200ms    DEFAULT — hover states, card lifts
duration/float              220ms    soft-float-up toasts/menus (app)
duration/toggle-word        240ms    Mode-toggle word slide
duration/slow               300ms    Top-nav bg, large shadow hovers, overlay exit
duration/overlay-out        300ms    Overlay fade-out
duration/overlay-in         320ms    Overlay fade-in; toggle-track spring enter
duration/modal-out          320ms    Modal pop-out
duration/toggle-enter       320ms    Toggle track spring
duration/modal-in           360ms    Modal pop-in
duration/emerge             420ms    route-emerge page transitions (app)
duration/media              500ms    Showcase media shadow settle
duration/shimmer            1200ms   Progress-bar shimmer loop
duration/pulse              2000ms   Glow pulse loop
duration/search-spin        2500ms   Search focus ring rotation
```

### 7.2 Easing Curves

> **RECONCILED 2026-08-31:** the app shipped a different curve set (RECONCILIATION-NOTE #10). `ease/spring` (0.34, 1.56, 0.64, 1.0) and `ease/snap` (0.2, 0, 0, 1) are retained as kit-supplied reference for gamification moments; the app-real set governs.

```
TOKEN                CSS VALUE                                USAGE
──────────────────────────────────────────────────────────────────────────────
ease/out-cubic       cubic-bezier(0.215, 0.61, 0.355, 1)      Entering view, hovers, general (app default)
ease/loop            cubic-bezier(0.645, 0.045, 0.355, 1)     Continuous looping (glow pulse)
ease/emerge          cubic-bezier(0.2, 0.9, 0.2, 1)           Route emerge, page transitions
ease/pop-in          cubic-bezier(0.16, 1, 0.3, 1)            Modal pop-in
ease/pop-out         cubic-bezier(0.4, 0, 1, 1)               Modal pop-out
ease/toggle          cubic-bezier(0.32, 0.72, 0, 1)           Mode-toggle word slide
ease/spring-soft     cubic-bezier(0.22, 1, 0.36, 1)           Toggle track spring
ease/spring          cubic-bezier(0.34, 1.56, 0.64, 1)        Celebrations (kit reference)
ease/snap            cubic-bezier(0.2, 0, 0, 1)               Snappy card/tab transitions (kit reference)
```

### 7.3 Animation Patterns

```
PATTERN                 PROPERTIES                              CONTEXT
──────────────────────────────────────────────────────────────────────────

HOVER LIFT              transform: translateY(-1px)             Buttons, cards
                        + shadow increase (shadow/sm → shadow/md)
                        Duration: duration/fast
                        Easing: ease/out

FADE IN                 opacity: 0 → 1                         Content appearing, search results
                        Duration: duration/normal
                        Easing: ease/out

SLIDE UP                translateY(8px) → translateY(0)         Modals, bottom sheets, toasts
                        + opacity: 0 → 1
                        Duration: duration/slow
                        Easing: ease/out

SLIDE RIGHT             translateX(-8px) → translateX(0)        Sidebar menu items, list items
                        + opacity: 0 → 1
                        Duration: duration/normal
                        Easing: ease/out

SCALE REVEAL            scale(0.95) → scale(1.0)               Badge earned modal, level-up
                        + opacity: 0 → 1
                        Duration: duration/slow
                        Easing: ease/spring

GLOW PULSE              box-shadow cycles glow/sm → glow/md     Live indicators, active elements
                        Duration: 2000ms, infinite
                        Easing: ease/in-out

SKELETON SHIMMER        background gradient sweeps L → R        Loading placeholders
                        Duration: 1500ms, infinite
                        Easing: linear

STAGGER CHILDREN        Each child delays by 50ms               Feed cards loading, list items
                        animation-delay: calc(var(--i) * 50ms)
                        Pattern: slide-up + fade-in

PROGRESS FILL           width: 0% → N%                         XP bars, upload progress
                        Duration: duration/slower
                        Easing: ease/out

CONFETTI BURST          Particle explosion from center           Level up, badge earned (gamification)
                        Duration: 1200ms
                        Easing: ease/out (gravity)
```

### 7.4 Context Rules for Motion

```
CONTEXT                 MOTION LEVEL        ALLOWED PATTERNS
──────────────────────────────────────────────────────────────────
Landing page            Expressive          Parallax, scroll reveals, counters, hero animations, stagger
App pages               Moderate            Hover lift, fade in, slide up (for new content), transitions
Gamification moments    Celebratory         Scale reveal, confetti burst, glow pulse, spring easing
Admin console           Minimal             Fade in only, duration/fast for all transitions
Reduced motion pref     None                Instant transitions, no movement, opacity-only if needed
```

---

## 8. DESIGN TOKENS — Z-INDEX

> **RECONCILED 2026-08-31:** the original 10/20/30/40/50/60 ladder never shipped. The real app's ladder (evidence: top-nav `z-40`, dropdowns/dialogs `z-50`, toasts `z-60`, auth modal `z-70`, nav-progress `z-100`) is now canonical — RECONCILIATION-NOTE #7. Old tokens map: sticky 10→40, dropdown 20→50, overlay/modal 30/40→50, toast 50→60, tooltip 60→80 (reserved).

```
TOKEN               VALUE    USAGE
────────────────────────────────────────────────────────────────────────
z/behind            -1       Decorative backgrounds, canvas effects
z/base              0        Default content layer
z/sticky-local      5        Sticky table columns / rails within a component
z/raised            10       Content above siblings (local)
z/progress          20       Inline reading-progress strip
z/layer             30       Local badges / overlays within a card
z/sticky            40       Sticky headers, FABs, fixed composer bar
z/dropdown          50       Menus, search results, dialogs + their overlays
z/toast             60       Toast notifications
z/modal-auth        70       Global auth modal
z/tooltip           80       Tooltips (declared in app @theme; reserved)
z/max               100      Navigation progress bar, critical system overlays
```

---

## 9. ICONOGRAPHY

### 9.1 Library
- **Primary**: Lucide Icons (https://lucide.dev)
- **Style**: Outline/stroke only (no filled icons). Consistent 1.5px stroke weight.
- **Why Lucide**: ShadCN default, open-source, 1400+ icons, consistent design language, production-proven, React-native components.

### 9.2 Icon Sizes

```
TOKEN           SIZE     STROKE    USAGE
────────────────────────────────────────────────────────────────
icon/xs         14px     1.5px     Inline with small text, badge icons
icon/sm         16px     1.5px     Button icons (small), inline actions
icon/md         20px     1.5px     DEFAULT — nav items, card actions, standard buttons
icon/lg         24px     2px       Page headers, featured elements
icon/xl         32px     2px       Empty states, feature highlights
icon/2xl        48px     2px       Onboarding illustrations, hero icons
```

### 9.3 Core Icon Mapping

```
NAVIGATION                          ACTION                              STATUS
──────────────────────────────────────────────────────────────────────────────────
home → Home                         plus → Create Post                  check-circle → Success
search → Search                     arrow-up → Upvote                   x-circle → Error
bell → Notifications                arrow-down → Downvote               alert-triangle → Warning
user → Profile                      message-circle → Comment            info → Info
settings → Settings                 bookmark → Save                     loader → Loading (spinning)
menu → Mobile Menu                  share-2 → Share                     clock → Timestamp
chevron-left → Back                 flag → Report                       eye → Views
chevron-right → Forward             trash-2 → Delete                    trending-up → Trending
chevron-down → Dropdown             edit-3 → Edit                       lock → Paywall/locked
log-out → Sign Out                  external-link → External            unlock → Unlocked
layout-grid → Grid View             copy → Copy Link                    shield → Moderation
list → List View                    at-sign → Mention                   zap → Electric/Power
compass → Explore                   reply → Reply                       

CATEGORY ICONS (Single Lucide icon per category)
──────────────────────────────────────────────────────────────────────────────────
NEWS            → newspaper
REVIEW          → star
COMPARE         → git-compare
LAUNCH PAD      → rocket
DEBATE          → swords (or message-square-dashed)
HELP            → help-circle
LIST            → layout-list
SHOWCASE        → sparkles
GIGS            → briefcase

GAMIFICATION
──────────────────────────────────────────────────────────────────────────────────
award           → Badge earned
trophy          → Leaderboard
flame           → Streak
diamond         → Premium/rare
crown           → #1 rank
medal           → Achievement
star            → Points/rating
target          → Level progress
gift            → Campaigns/rewards
```

### 9.4 Icon Usage Rules

1. Icons are **never used alone** for critical actions — always paired with text label (accessibility).
2. **Icon-only buttons** require `aria-label` and a tooltip on hover.
3. Navigation icons always use `icon/md` (20px).
4. Never mix Lucide with other icon libraries in the same interface.
5. Category icons are always displayed **inside their category pill** at `icon/xs` (14px).

---

## 10. LOGO SYSTEM

### 10.1 Logomark Anatomy

```
Three geometric elements with consistent white channel gaps:

  ┌──────────────────┬──────────────┐
  │                  │   QUARTER    │
  │   SEMICIRCLE     │   CIRCLE     │
  │     (Left)       │  (Top Right) │
  │                  ├──────────────┤
  │                  │   SQUARE     │
  │                  │ (Bottom Rt)  │
  └──────────────────┴──────────────┘

Element 1: SEMICIRCLE — Full half-circle, flat edge facing right
Element 2: QUARTER CIRCLE — Quarter arc, curves toward top-right corner
Element 3: SQUARE — Perfect square, anchors bottom-right

Gap width: ~4-5% of total mark width, consistent between all three shapes
The three shapes together form a stylized "C" for Createconomy
Metaphor: Circle = creation/completeness + Square = structure/economy
```

### 10.2 Logo Variants

```
VARIANT               USAGE                                     SPEC
──────────────────────────────────────────────────────────────────────────
Mark (dark bg)        Header nav, favicon, dark surfaces        White (#FAFAFA) on transparent
Mark (light bg)       Light surfaces, print                     Near-black (#09090B) on transparent
Mark (electric)       Hero sections, featured placement          White with glow/primary-lg
Mark (accent bg)      Favicon, app icon, social                 White mark on #0EA5E9 background
Full logo             Landing page, auth, about, email          Mark + "createconomy" wordmark
Wordmark only         Legal footers, very small spaces          "createconomy" text only
```

### 10.3 Wordmark Specifications

```
Font:           Geist Semibold (600)
Case:           All lowercase → "createconomy"
Tracking:       -0.5px (slightly tighter than body text)
Spacing:        The mark and wordmark are separated by space equal to 50% of mark height
Alignment:      Mark and wordmark vertically centered
```

### 10.4 Clear Space & Sizing

```
Minimum clear space:    50% of mark height on all sides
Minimum digital size:   24px height (mark only), 120px width (full logo)
Favicon sizes:          16px, 32px, 48px, 64px, 128px, 192px, 512px
App icon:               1024px master, white mark on brand/primary background
```

### 10.5 Logo Animation (Micro-interaction)

```
SEGMENT REVEAL (Recommended for page load / hover):
  1. Semicircle slides in from left + fades (0ms start, 200ms duration)
  2. Quarter circle fades in from right (100ms delay, 150ms duration)
  3. Square fades in from right (200ms delay, 150ms duration)
  Total: ~500ms, feels premium and architectural
  Easing: ease/out for all three
  
GLOW PULSE (For loading states):
  Mark renders statically, then glow/primary-md pulses around it
  Duration: 2000ms loop
  
ELECTRIC ARC (Reserved for hero / marketing):
  A light traces the outline of all three shapes sequentially
  Duration: 1200ms
  Only used on landing page hero
```

### 10.6 Logo Misuse Rules

- Never stretch, squash, or rotate the mark
- Never alter the gap widths between the three shapes
- Never recolor with unauthorized colors
- Never add drop shadows, gradients, or 3D effects to the mark itself
- Never place on busy/cluttered backgrounds without sufficient contrast
- Never recreate the mark — always use the master asset

---

## 11. COMPONENT LIBRARY

### 11.1 Buttons

```
VARIANTS
──────────────────────────────────────────────────────────────────────────

PRIMARY (Electric Blue — main CTAs):
  Default:    bg brand/primary (#0EA5E9) | text white | glow/primary-sm (dark mode)
  Hover:      bg brand/primary-hover (#38BDF8) | glow/primary-md | translateY(-1px)
  Active:     bg brand/primary-pressed (#0284C7) | glow/primary-sm | translateY(0)
  Focus:      Default + focus ring (2px offset, brand/primary-hover)
  Disabled:   bg brand/primary at 40% opacity | no glow | cursor not-allowed
  Loading:    bg brand/primary | spinner icon replacing text OR spinner beside text

SECONDARY (Outlined):
  Default:    bg transparent | border border/prominent | text text/primary
  Hover:      bg bg/overlay | border border/active (#0EA5E9)
  Active:     bg bg/surface-elevated
  Focus:      Default + focus ring
  Disabled:   All at 40% opacity
  Loading:    Same as default + spinner

GHOST (No border, minimal):
  Default:    bg transparent | text text/secondary
  Hover:      bg bg/overlay | text text/primary
  Active:     bg bg/surface-elevated
  Focus:      Default + focus ring
  Disabled:   text at 40% opacity

DESTRUCTIVE (Delete, ban, critical actions):
  Default:    bg feedback/error | text white
  Hover:      feedback/error at brightness-90 (perceived -10%)
  Active:     feedback/error at brightness-75 (perceived -25%)
  Focus:      Default + feedback/error focus ring
  Disabled:   40% opacity
  NOTE:       implemented as brightness modifiers on feedback/error rather than
              discrete #DC2626/#B91C1C literals — token-pure, same perceived ramp
              (Layer 2 reconciliation; see RECONCILIATION-NOTE #14)

SIZES
──────────────────────────────────────────────────────────────────────────
xs:   height 28px | padding 6px 10px  | label/sm (11px) | radius/md | icon/xs (14px)
sm:   height 32px | padding 6px 12px  | label/md (12px) | radius/md | icon/sm (16px)
md:   height 36px | padding 8px 16px  | body/sm (14px)  | radius/md | icon/md (20px) ← DEFAULT
lg:   height 40px | padding 10px 20px | body/md (16px)  | radius/md | icon/md (20px)
xl:   height 48px | padding 12px 24px | body/md (16px)  | radius/md | icon/lg (24px) ← CTA hero

ICON SUPPORT
  Left icon:    icon + space/1.5 (6px) + text
  Right icon:   text + space/1.5 (6px) + icon
  Icon only:    Square button (height = width), icon centered, requires aria-label + tooltip
```

### 11.2 Inputs

```
TEXT INPUT
──────────────────────────────────────────────────────────────────────────
  Base:       bg bg/surface | border border/default | text text/primary
              height 36px (md) or 40px (lg) | radius/md | padding 10px 12px
  Hover:      border border/prominent
  Focused:    border border/active + glow/primary-border
  Error:      border feedback/error (via aria-invalid) | error icon right | error message below (body/xs, feedback/error-text)
  Disabled:   bg bg/inset | text text/disabled | no interaction
  With icon:  16px icon inside left or right, padding adjusted
  NOTE:       focus state = border-active + glow/primary-border (no inner 1px white
              inset highlight — that was a pre-token legacy detail, dropped in Layer 2;
              see RECONCILIATION-NOTE #15)

  Label:      label/md (12px), text/secondary, positioned above input with space/1.5 gap
  Helper:     body/xs (12px), text/muted, below input with space/1 gap
  Required:   Red asterisk (*) after label text

TEXTAREA
  Same styling as text input
  min-height: 80px, resize: vertical only
  Character counter: bottom-right, caption (12px), text/muted

SELECT
  Same as text input + chevron-down icon right
  Dropdown: bg/surface-elevated, shadow/md, radius/md, max-height 300px, scrollable

SEARCH INPUT
  Same as text input + search icon left + X button right (when filled)
  On focus: expand width slightly (transition)

CHECKBOX
  16px box | radius/sm (4px)
  Unchecked: border border/prominent | bg transparent
  Checked:   bg brand/primary | check icon white (icon/xs)
  Indeterminate: bg brand/primary | minus icon white
  Disabled:  40% opacity

TOGGLE / SWITCH
  44px wide × 24px tall | radius/full
  Track off: bg zinc-700 (dark) / zinc-300 (light)
  Track on:  bg brand/primary
  Knob:      20px circle | bg white | shadow/sm
  Transition: duration/fast ease/snap

RADIO
  16px circle | radius/full
  Unselected: border border/prominent
  Selected:   border brand/primary | inner dot 8px brand/primary
  Disabled:   40% opacity

SLIDER
  Track: 4px height | radius/full | bg bg/overlay
  Filled: bg brand/primary
  Thumb:  20px circle | bg white | shadow/md
  Range label: code/sm above thumb
```

### 11.3 Cards

```
POST CARD (Feed, search results, category pages)
──────────────────────────────────────────────────────────────────────────
  Container:  bg/surface | border border/subtle (1px) | radius/lg (12px) | padding space/4
  Hover:      border border/prominent | shadow/sm | translateY(-1px) | duration/fast ease/out
  Active:     shadow/none | translateY(0)

  Structure:
  ┌──────────────────────────────────────────────────────────┐
  │ [Category Pill]  [Time Badge: 🔥Hot / ⏰2h / 💎Ever]  ···│  ← space/2 gap between pills
  │                                                          │
  │ Post Title Here (heading/md, text/primary, max 2 lines) │  ← space/2 below pills
  │ Preview of post body text truncated at two lines...      │  ← body/sm, text/secondary
  │                                                          │
  │ ┌──┐ Author Name  @handle  [Lv3 badge]                  │  ← space/3 below preview
  │ │av│ 2h ago                                              │  ← avatar sm (28px) + space/2 gap
  │ └──┘                                                     │
  │                                                          │
  │ ▲ 47    💬 12    🔖                     [View →]        │  ← space/3 below author row
  └──────────────────────────────────────────────────────────┘
  
  Upvote count: code/sm, text/secondary (becomes brand/primary when user has upvoted)
  Comment count: code/sm, text/muted
  View arrow: ghost button, appears on hover only (desktop)


USER CARD (Suggested creators, search results)
──────────────────────────────────────────────────────────────────────────
  ┌──────────────────────────────────────────────────────────┐
  │ ┌──┐  Display Name              [Follow]                │
  │ │av│  @handle · Level 3                                  │
  │ └──┘  Bio text truncated at one line...                  │
  └──────────────────────────────────────────────────────────┘
  Avatar: xl (48px) | Name: heading/sm | Handle: body/sm text/secondary | Follow: button/sm secondary


STATS CARD (Admin dashboard, profile insights)
──────────────────────────────────────────────────────────────────────────
  ┌──────────────────────────────────────────────────────────┐
  │ icon  Card Label                                         │  ← label/md, text/muted
  │                                                          │
  │ 1,247                                                    │  ← heading/xl, text/primary (or brand)
  │ ▲ +12.4% vs last week                                   │  ← body/xs, feedback/success-text
  └──────────────────────────────────────────────────────────┘


NOTIFICATION CARD
──────────────────────────────────────────────────────────────────────────
  ┌──────────────────────────────────────────────────────────┐
  │ [type-icon] [avatar-sm] @user upvoted your post          │  ← body/sm
  │                         "Post title here..."  · 2h ago   │  ← body/xs, text/muted
  │                                                     [•]  │  ← blue dot if unread
  └──────────────────────────────────────────────────────────┘
  Unread: bg brand/primary-abyss (subtle blue tint) | blue dot right side
  Read: bg transparent


WIDGET CARD (Sidebar widgets — leaderboard, campaigns, suggestions)
──────────────────────────────────────────────────────────────────────────
  Container: bg/surface | border border/subtle | radius/lg | padding space/4
  Header: heading/xs + "View All →" link right-aligned
  Content: varies per widget
  No hover effect (static container)
```

### 11.4 Navigation Components

```
TOP HEADER (Desktop)
──────────────────────────────────────────────────────────────────────────
  Height:       56px
  Background:   bg/canvas with backdrop-blur(12px) + bg/wash overlay (glassmorphism)
  Border:       border/subtle 1px bottom
  Position:     Fixed top, z/sticky
  
  Layout:
  ┌─[Mark 24px]──[Search Bar 480px max, centered]──[+ Create btn/md primary] [🔔 badge] [Avatar dropdown]─┐
  
  Search bar: bg/surface, border/subtle, radius/full, height 36px, search icon left, placeholder "Search posts, users, tags..."
  Notification bell: icon/md, relative badge (red dot or count)
  Avatar: 32px, radius/full, dropdown on click


LEFT SIDEBAR (Desktop)
──────────────────────────────────────────────────────────────────────────
  Width:        240px expanded / 64px collapsed
  Background:   bg/canvas
  Border:       border/subtle 1px right
  Position:     Fixed left, top 56px (below header), full remaining height
  Transition:   width duration/slow ease/snap

  Nav item structure:
  [icon/md 20px] [space/2] [label/lg 14px text]
  Height: 36px per item | padding: 8px horizontal, 4px vertical
  
  States:
    Default:    text/secondary
    Hover:      bg/overlay | text/primary
    Active:     bg/overlay | text/link | 2px left border brand/primary
    
  Sections separated by border/subtle divider with space/3 above/below
  
  Sections:
    — Navigation (Home, Explore, Following, Bookmarks, Leaderboard, My Drafts)
    — Categories (9 items with icon + name + count badge)
    — Quick Stats (Points, Level, Streak) — compact display
    — Actions (+ New Post button, full width, primary)


RIGHT SIDEBAR (Desktop)
──────────────────────────────────────────────────────────────────────────
  Width:        320px
  Background:   bg/canvas
  Border:       border/subtle 1px left
  Position:     Fixed right, top 56px, full remaining height, scrollable
  
  Widgets stacked: space/4 gap between each widget card
  Content: Pulse widget, Leaderboard widget, Native ad, Suggested creators


BOTTOM TAB BAR (Mobile)
──────────────────────────────────────────────────────────────────────────
  Height:       64px total (48px content + 16px safe area)
  Background:   bg/surface with backdrop-blur(12px)
  Border:       border/subtle 1px top
  Position:     Fixed bottom, z/sticky

  5 tabs:  Home | Search | [+ Create] | Notifications | Profile
  
  Standard tab:
    icon/md (20px) above label/sm (11px)
    Active:   brand/primary color + label
    Inactive: text/muted
    
  Center Create button:
    Larger hit area (48px circle)
    bg brand/primary | icon white (plus)
    glow/primary-sm on dark mode
    No label text (icon only)
```

### 11.5 Badges, Pills & Tags

*(Pill mechanism only — product-specific category names and paywall logic stripped.)*

```
PILL MECHANISM (general pill shape — applies to any pill-shaped label)
──────────────────────────────────────────────────────────────────────────
  Shape:        radius/full
  Padding:      4px 10px
  Font:         label/md (12px) medium
  Border:       None
  Background:   <color> at 10% opacity
  Text:         <matching -text color>
  Icon:         Optional, icon/xs (14px) before text
  Hover:        <color> at 20% opacity (when clickable)


TAG (User-created hashtags)
──────────────────────────────────────────────────────────────────────────
  Background:   bg/surface-elevated
  Text:         text/secondary
  Border:       border/default 1px
  Font:         label/md (12px)
  Padding:      2px 8px
  Radius:       radius/md (8px)
  Prefix:       # character (text/muted)
  Hover:        bg/overlay | text/primary | border/prominent


TIME BADGE
──────────────────────────────────────────────────────────────────────────
  Variants:
    🔥 Hot (trending):    bg feedback/error at 10% | text feedback/error-text
    ⏰ Recent (< 24h):   bg feedback/warning at 10% | text feedback/warning-text
    💎 Evergreen:         bg game/badge at 10% | text game/badge


STATUS DOT
──────────────────────────────────────────────────────────────────────────
  Size:     8px circle
  Online:   feedback/success (#22C55E) + optional pulse ring animation
  Away:     feedback/warning (#F59E0B)
  Offline:  text/muted (#71717A)
```

### 11.6 Avatar

```
SIZES
──────────────────────────────────────────────────────────────────────────
xs:     20px    Inline mentions, compact lists
sm:     28px    Comment list items, notification items
md:     32px    Post cards, header nav
lg:     40px    Comment authors, user cards
xl:     48px    Profile cards, user detail
2xl:    64px    Profile page header (other user)
3xl:    96px    Profile page hero (self)
4xl:    128px   Profile edit page

SHAPE:      Always radius/full (perfect circle)
BORDER:     2px solid bg/canvas (for overlap/stack scenarios)
FALLBACK:   2-letter initials on deterministic color background (hash username → color from category palette)

OPTIONAL DECORATORS:
  Level ring:     2px ring in level tier color, 2px gap from avatar edge
  Status dot:     Positioned bottom-right, overlapping avatar edge by 25%
  Badge overlay:  Small badge icon bottom-right for verified/admin
```

### 11.7 Modals, Sheets & Overlays

```
MODAL (Desktop)
──────────────────────────────────────────────────────────────────────────
  Backdrop:     bg black 60% opacity + backdrop-blur(4px)
  Container:    bg/surface-elevated | radius/xl (16px) | shadow/xl
  Widths:       sm: 420px | md: 560px | lg: 720px
  Padding:      space/6 (24px)
  Animation:    Backdrop fades in (duration/normal)
                Container: scale(0.95) → scale(1.0) + fade in (duration/slow, ease/out)
  
  Structure:
  ┌──────────────────────────────────────────────────────────┐
  │  Title (heading/lg)                          [X] │  ← Close: ghost button, icon/md
  │  ──────────────────────────────────────────────  │  ← border/subtle divider
  │                                                  │
  │  Content area (scrollable if > max-height)       │
  │                                                  │
  │  ──────────────────────────────────────────────  │
  │                     [Secondary btn]  [Primary]   │  ← Right-aligned actions
  └──────────────────────────────────────────────────────────┘


BOTTOM SHEET (Mobile)
──────────────────────────────────────────────────────────────────────────
  Backdrop:     Same as modal
  Container:    bg/surface-elevated | radius/xl top corners only
  Handle:       4px × 36px | bg text/disabled | radius/full | centered at top, space/2 from top
  Padding:      space/4 (16px)
  Animation:    Slide up from bottom (duration/slow, ease/out)
  Dismiss:      Swipe down gesture


TOAST NOTIFICATION
──────────────────────────────────────────────────────────────────────────
  Position:     Bottom-center (mobile) | Bottom-right (desktop)
  Container:    bg/surface-elevated | radius/lg | shadow/lg | border/subtle
  Padding:      10px 16px (space/2.5 vertical, space/4 horizontal)
  Width:        max 420px (desktop) | calc(100% - 32px) (mobile)
  Animation:    Slide up + fade (duration/normal, ease/out)
  Auto-dismiss: 4 seconds (configurable per toast type)
  Structure:    [semantic-icon] [message text body/sm] [X dismiss optional]
  Variants:
    Success:    Left border 3px feedback/success + check-circle icon
    Error:      Left border 3px feedback/error + x-circle icon
    Warning:    Left border 3px feedback/warning + alert-triangle icon
    Info:       Left border 3px feedback/info + info icon


TOOLTIP
──────────────────────────────────────────────────────────────────────────
  Background:   bg/surface-elevated (dark) | zinc-900 (light mode — inverted for contrast)
  Text:         text/primary (dark) | white (light — inverted)
  Radius:       radius/md (8px)
  Padding:      4px 8px
  Font:         caption (12px)
  Arrow:        6px triangle, same bg as tooltip
  Animation:    Fade in (duration/fast, 200ms delay before appearing)
  Max width:    240px
  Position:     Above element by default, auto-flip if near viewport edge


DROPDOWN / POPOVER
──────────────────────────────────────────────────────────────────────────
  Container:    bg/surface-elevated | radius/md | shadow/md | border/subtle
  Width:        min 180px, max 320px (or match trigger width)
  Padding:      space/1 (4px) internal
  Animation:    Fade + scale(0.98) → scale(1.0) | duration/fast | ease/out
  
  Menu item:
    Height:     36px
    Padding:    8px 12px
    Font:       body/sm (14px)
    States:     Default (text/primary) | Hover (bg/overlay) | Active (bg/overlay + text/link)
    Icon:       Optional icon/sm left, space/2 gap
    Separator:  border/subtle 1px, space/1 vertical margin
```

### 11.8 Form Components Summary

```
COMPONENT STATE MATRIX — All states must be designed for each component
──────────────────────────────────────────────────────────────────────────
                Default  Hover  Focus  Error  Disabled  Loading  Active
Button-Pri      ✓        ✓      ✓      —      ✓         ✓        ✓
Button-Sec      ✓        ✓      ✓      —      ✓         ✓        ✓
Button-Ghost    ✓        ✓      ✓      —      ✓         —        ✓
Button-Destr    ✓        ✓      ✓      —      ✓         ✓        ✓
Text Input      ✓        ✓      ✓      ✓      ✓         —        —
Textarea        ✓        ✓      ✓      ✓      ✓         —        —
Select          ✓        ✓      ✓      ✓      ✓         ✓        —
Search Input    ✓        ✓      ✓      —      ✓         ✓        —
Checkbox        ✓        ✓      ✓      ✓      ✓         —        ✓ (checked)
Toggle          ✓        ✓      —      —      ✓         —        ✓ (on)
Radio           ✓        ✓      ✓      ✓      ✓         —        ✓ (selected)
Slider          ✓        ✓      ✓      —      ✓         —        ✓ (dragging)
Card            ✓        ✓      ✓      —      —         ✓        ✓ (selected)
Nav Item        ✓        ✓      ✓      —      ✓         —        ✓
Tab             ✓        ✓      ✓      —      ✓         —        ✓
Data Table      ✓        ✓      ✓      ✓      —         ✓        ✓ (row selected)
Queue Board     ✓        ✓      ✓      —      —         ✓        ✓ (claimed)
Command Palette ✓        ✓      ✓      —      —         ✓        —
Banner          ✓        —      ✓      —      —         —        —
Datetime        ✓        ✓      ✓      ✓      ✓         ✓        ✓ (open)
Combobox        ✓        ✓      ✓      ✓      ✓         ✓        ✓ (open)
Auth/Form Card  ✓        —      ✓      ✓      —         ✓        —
Dropzone        ✓        ✓      ✓      ✓      ✓         ✓        ✓ (dragging)
PDF Viewer      ✓        —      ✓      ✓      —         ✓        —
Interstitial    ✓        —      ✓      —      —         ✓        —
Ticker          ✓        ✓      —      —      —         ✓        —
Evidence Panel  ✓        —      ✓      —      —         ✓        —
Verified Badge  ✓        —      —      —      —         —        —
Legal Prose     ✓        —      —      —      —         ✓        —
Empty State     ✓        —      —      ✓      —         ✓        —
Markdown Reader ✓        —      —      ✓      —         ✓        —
MAX Panel       ✓        ✓      ✓      —      —         ✓        —
```

### 11.9 Skeleton / Loading Components

```
SKELETON BASE
  Background:   bg/surface
  Shimmer:      Linear gradient sweep (left → right)
                bg/surface → bg/overlay → bg/surface
                Duration: 1500ms, infinite, linear
  Radius:       Match the element being loaded

SKELETON VARIANTS:
  Text line:    height 16px, width 60%-100% random, radius/sm
  Heading:      height 24px, width 40%-70%, radius/sm
  Avatar:       Circle, radius/full, width = height = avatar size
  Image:        16:9 rectangle, radius/md
  Button:       Match button size, radius/md
  Card:         Full card outline with internal skeleton elements
  
SPINNER (Inline loading):
  Size:         Matches icon size of context (xs through lg)
  Color:        brand/primary (or white on primary buttons)
  Style:        2px border, 270° arc, rotating animation 800ms infinite linear
```

### 11.10 Data Table (A1)

Dense sortable table. Highest-frequency F-24 gap (~13 admin screens). Composes §11.2 inputs, §11.5 pills, §11.1 ghost/icon buttons, §11.9 skeletons. **Admin console motion: fade only, `duration/fast`.**

```
CONTAINER
──────────────────────────────────────────────────────────────────────────
  Surface:      bg/surface | border border/subtle 1px | radius/lg (12px)
  Padding:      none on the table itself; toolbar padding space/3
  Overflow:     horizontal scroll inside container if columns exceed width
  Density:      compact (admin) — row height 40px; comfortable (member Journal) — 48px

TOOLBAR (optional, above header)
  Height:       40px | gap space/2 | padding space/3 horizontal
  Contents:     Search Input (sm) left | filter Select(s) | bulk-action slot right
  Border:       border/subtle 1px bottom

HEADER ROW
  Background:   bg/inset
  Height:       36px
  Font:         label/md (12px), text/secondary, overline tracking optional
  Border:       border/subtle 1px bottom
  Cell padding: 8px 12px (space/2 vertical, space/3 horizontal)
  Sort affordance: chevron-down icon/xs, text/muted; active sort = text/link + icon
  Sort motion:  duration/fast ease/snap (icon rotate only)

BODY ROW
  Background:   bg/surface | zebra optional: even rows bg/wash
  Height:       40px compact / 48px comfortable
  Font:         body/sm (14px), text/primary
  Cell padding: 8px 12px
  Border:       border/subtle 1px bottom (last row: none)
  Hover:        bg/overlay | duration/fast
  Selected:     bg brand/primary at 10% opacity | 2px left border brand/primary
  Focus-within: glow/primary-border on the row (keyboard)
  Disabled/masked: text/muted; masked values render as caption + lock icon/xs
                   (audit contract: masked-value hook — visual only)

BULK SELECT
  Leading column: Checkbox 16px (§11.2) | header checkbox = select page
  Indeterminate header when partial page selected

PAGINATION FOOTER
  Height:       40px | padding space/3 | border/subtle 1px top
  Font:         caption (12px), text/muted
  Controls:     Button/sm ghost « Prev | Next » — cursor pagination (no page numbers)
  Disabled:     40% opacity when no cursor

STATES
  Loading:      8 skeleton rows (§11.9 text-line + avatar if needed)
  Empty:        §11.23 empty-state inside the container (not a blank table)
  Error:        Banner/error (§11.13) above table; table unmounted or last-good + banner
  Mobile (<768px): collapse to stacked definition list —
                   each row → Card compact (padding space/3), label/md + body/sm pairs
                   (no independently invented mobile table)

A11Y
  Role:         table (or grid if cells are interactive)
  Sort buttons: aria-sort ascending|descending|none
  Row actions:  icon-only → aria-label + tooltip (§9.4)
```

### 11.11 Queue / Case Board (A12)

Composable from §11.10 Data Table **or** stacked §11.3 Notification Cards. Claim / lease / aging are **slots**, not a second table kit. One board, many `targetType`s — no per-queue visual fork.

```
LAYOUT
──────────────────────────────────────────────────────────────────────────
  Desktop:      single column of case rows (A1 compact) OR optional
                status-grouped stacks (s0 / legal / s1 / …) as Widget Cards
                with space/4 gap — grouping is data, not a new kanban skin
  Mobile:       same stacked cards as A1 mobile collapse

CASE ROW / CARD
  Container:    Notification Card structure (§11.3)
  Title:        heading/xs, text/primary, 1 line truncate
  Meta:         caption, text/muted — age · target type pill · severity pill
  Aging:        caption; ≥ threshold → text feedback/warning-text
                (numeric thresholds are product, not this spec)
  Claimed:      avatar-xs + handle caption | lease remaining as caption
  Unclaimed:    Button/sm secondary "Claim" in the action slot
  Selected/claimed-by-me: 2px left border brand/primary (same as table selected)

STATUS PILLS
  Use §11.5 pill mechanism. Color mapping is semantic only:
    Immediate / s0:     feedback/error at 10% | feedback/error-text
    Legal:              feedback/warning at 10% | feedback/warning-text
    Standard:           feedback/info at 10% | feedback/info-text
    Resolved/closed:    feedback/success at 10% | feedback/success-text
  Do not invent a per-status palette beyond feedback tokens.

LEASE / AGING AFFORDANCES (slots)
  Renew:        Button/xs ghost in the row action slot
  Expire visual: text/muted + clock icon/xs — no countdown theater
  Motion:       Admin = fade duration/fast only (no pulse on aging)

STATES
  Loading / empty / error: same as A1
  Claim conflict: Banner/warning (§11.13) + row returns to unclaimed
```

### 11.12 Command Palette (A11)

Admin Shell (CAP-390). Composes Modal sm + Search Input + Dropdown menu items. **Not a new overlay type.**

```
──────────────────────────────────────────────────────────────────────────
  Trigger:      documented in shell chrome (search / shortcut) — visual = Search Input
  Overlay:      Modal backdrop (black 60% + blur 4px) | z/modal
  Container:    Modal sm width 420px (§11.7) | bg/surface-elevated | radius/xl
                shadow/xl | padding 0 (list flush)
  Animation:    Admin = fade in duration/fast only (no scale reveal)
  Position:     centered, max-height 80vh

SEARCH
  Search Input lg, radius 0 on container top (inner radius/md on the field
  is skipped — nested rule: use padding space/3 around the input instead)
  Placeholder:  caption pattern of Search Input (§11.4 header search)

RESULTS
  Menu item spec from Dropdown (§11.7): height 36px, padding 8px 12px,
  body/sm, icon/sm left + space/2
  Section labels: overline, text/muted, padding 8px 12px
  Separator:    border/subtle 1px, space/1 vertical margin
  Active/kbd:   bg/overlay + text/link (same as dropdown Active)
  Empty query:  §11.23 empty-state compact (icon/lg not 2xl)
  No results:   body/sm text/muted, padding space/4

FOOTER HINT
  caption, text/muted, padding space/2 space/3, border/subtle top
  Keyboard: ↑↓ Enter Esc — already in §18.1

Motion / reduced-motion: duration/instant when prefers-reduced-motion
```

### 11.13 Banner Primitive

Full-width status strip. Composes Toast **variant borders** + Card surface. Consumers: CMP, admin-home, BetaBanner slot. **Not a toast** (no auto-dismiss, no bottom-right).

```
──────────────────────────────────────────────────────────────────────────
  Container:    width 100% | radius/md | padding 10px 16px
                bg/surface | border 1px border/subtle
  Left accent:  3px solid (same as Toast variants)
  Layout:       [semantic-icon icon/md] [space/2] [body/sm text/primary, wraps]
                [optional Button/sm] [optional X ghost icon-only]
  Gap:          space/2 between icon and text

VARIANTS (feedback tokens only — no new colors)
  Info:     accent feedback/info | icon info | bg feedback/info-bg
  Success:  accent feedback/success | icon check-circle | bg feedback/success-bg
  Warning:  accent feedback/warning | icon alert-triangle | bg feedback/warning-bg
  Error:    accent feedback/error | icon x-circle | bg feedback/error-bg
  Neutral:  accent border/prominent | no semantic icon required | bg/wash

STATES
  Default / Focus-within (if actions): focus ring on the action, not the strip
  Dismissible: X is ghost icon-only, aria-label "Dismiss"
  Sticky (admin-home critical): position sticky top under 48px admin header,
                z/sticky — same tokens, no extra shadow

Motion: fade in duration/normal ease/out; admin context duration/fast
Reduced motion: opacity only
```

### 11.14 Datetime / Scheduler Picker

Composes Text Input + Dropdown/Popover + existing calendar **grid of ghost buttons**. No new calendar skin.

```
──────────────────────────────────────────────────────────────────────────
TRIGGER
  Text Input md | trailing icon/sm (calendar Lucide) | radius/md
  Value:        body/sm, Geist Mono for the datetime string (code/sm)
  Placeholder:  text/muted
  Hover/Focus/Error/Disabled: identical to Text Input (§11.2)

POPOVER
  Dropdown container (§11.7) | width match trigger, min 280px
  z/dropdown | shadow/md | radius/md | padding space/3
  Animation:    Fade + scale(0.98)→1 | duration/fast | admin = fade only

CALENDAR GRID
  Header:       heading/xs + chevron-left/right ghost icon-only (aria-label)
  Weekday row:  overline, text/muted, 32px cells
  Day cells:    32px × 32px | Button ghost | radius/md | label/md
    Default:    text/primary
    Hover:      bg/overlay
    Today:      1px border border/active (not filled)
    Selected:   bg brand/primary | text white
    Outside month / disabled: text/disabled
  Time (optional): Select sm or two Selects (hour / minute) | field gap space/4
  Actions:      Button/sm ghost "Clear" left | Button/sm primary "Apply" right

STATES
  Open:         popover visible; trigger Focused
  Error:        input error border + helper body/xs feedback/error-text
  Loading:      spinner icon/sm in the popover (timezone fetch etc.)
```

### 11.15 Searchable Combobox

Select + Search Input fused. Dropdown already specifies max-height 300px.

```
──────────────────────────────────────────────────────────────────────────
TRIGGER
  Same as Select (§11.2): Text Input + chevron-down
  Open:         chevron rotates 180° | duration/fast ease/snap

PANEL
  Dropdown container | width = trigger | max-height 300px scrollable
  First row:    Search Input sm, padding space/2, border/subtle bottom
  Options:      Dropdown menu items (36px, icon optional)
  Active:       bg/overlay + text/link
  Selected:     check-circle icon/xs right, text/link
  Disabled option: 40% opacity, not hoverable
  Empty:        body/sm text/muted, padding space/4
  Create-new (optional slot): last item, plus icon/sm, text/link — product decides copy

Multi-select (filters): selected values as Tags (§11.5) inside the trigger,
  gap space/1, input grows; Tag dismiss = X icon/xs

A11Y: listbox / option roles; typeahead uses the Search Input
```

### 11.16 Auth / Form Card

Layout width already locked: §4.3 **Auth cards 420px max**. Composes Card + form field gaps. Sign-in, waitlist, welcome.

```
──────────────────────────────────────────────────────────────────────────
CONTAINER
  Width:        420px max (100% − page padding on mobile)
  Surface:      bg/surface | border border/subtle | radius/lg (12px) | shadow/sm
  Padding:      Generous card padding space/6 (24px)
  No hover lift (static, like Widget Card)

STRUCTURE
  Logo:         Full logo, §10.2 auth usage | centered | space/6 below
  Title:        heading/lg, text/primary, centered
  Description:  body/sm, text/secondary, centered, space/2 below title
  Fields:       field gap space/4 | label-to-input space/1.5 (§4.2)
  Primary action: Button/md primary, full width, space/6 above
  Secondary:    Button/md ghost or body/sm link, centered, space/3 above
  Footer legal: caption, text/muted, centered, space/4 above

STATES
  Loading:      primary button Loading; fields Disabled
  Error:        Banner/error inside the card above fields, or field Error
  Admission-mode variants (open / waitlist / closed): same card; copy +
                which fields show are product — do not restyle the card

Motion: fade in duration/normal; reduced-motion instant
```

### 11.17 File Dropzone (A4)

Contribute + media upload. Composes inset surface + dashed border + Banner for reject.

```
──────────────────────────────────────────────────────────────────────────
DEFAULT
  Background:   bg/inset
  Border:       1px dashed border/default | radius/lg
  Padding:      space/8 vertical, space/6 horizontal
  Align:        center
  Icon:         icon/xl (32px), text/muted
  Title:        heading/sm, text/primary, space/2 below icon
  Hint:         body/sm, text/muted, max 300px (same cap as empty-state)

HOVER / DRAG-OVER
  Border:       1px dashed border/active
  Background:   feedback/info-bg
  Motion:       duration/fast ease/out

FOCUS (keyboard file input)
  glow/primary-border

DISABLED / FLAG OFF
  40% opacity | cursor not-allowed | no drag

STATES (product names scanning / quarantine / reject — visuals only)
  Scanning:     Spinner icon/lg brand/primary + body/sm text/secondary
                Progress Fill track 4px, filled brand/primary, duration/slower
  Quarantine:   Banner/warning inside the zone (not a second surface)
  Reject:       Banner/error | border feedback/error-border dashed
  Success:      Banner/success | check-circle icon/lg feedback/success

File chip (after add): Tag mechanism + filename body/sm + X ghost
  MIME/size errors: field Error helper, not a new color
```

### 11.18 Sandboxed PDF Viewer (A5)

Chrome around a sandboxed iframe. **Not a designed PDF.js theme.** Delivery/CSP is product (CAP-211).

```
──────────────────────────────────────────────────────────────────────────
SHELL
  Container:    bg/canvas | full viewport minus app header
  Stage:        bg/inset | centered
  Frame:        Card surface | radius/lg | border border/subtle | shadow/sm
                max-width 720px (reading column) on desktop; 100%−space/4 mobile

TOOLBAR
  Height:       40px | bg/surface | border/subtle bottom | padding space/2
  Controls:     Button/sm ghost — zoom − / + , open-in-new (external-link)
  Title:        heading/xs truncate, text/secondary, flex-grow
  Close:        ghost icon-only X, aria-label

IFRAME
  Width 100% | min-height 70vh | radius 0 (nested inside card)
  Fallback (blocked / error): §11.23 empty-state + Banner/error

ANONYMOUS TEASER (product branch)
  Same shell; stage shows empty-state + Button/md primary
  Do not invent watermark/first-page chrome — content is fenced elsewhere

Motion: none on the iframe; toolbar fade duration/fast
```

### 11.19 Full-page Interstitial (A6)

`/go` disclosure. Distinct from Modal: **no auto-dismiss, no accidental click-through chrome.** Composes Modal content width + Auth/Form Card stacking.

```
──────────────────────────────────────────────────────────────────────────
PAGE
  Background:   bg/canvas | min-height 100vh
  Overlay:      none required (this IS the page)
  Content:      Auth/Form Card width 420px **or** Modal md 560px if copy is long
                — cap at 560px (§11.7 md). Centered, page padding §4.2

STRUCTURE (slots — copy is founder/legal, not this spec)
  Wordmark or Mark 24px | space/6 below
  Title:        heading/lg
  Body:         body/md, text/secondary, reading measure ≤ 560px
  Merchant line: body/sm, text/muted
  Affiliate disclosure: caption, text/muted (DEC-S21 honest labels)
  Actions:      Button/md primary full width ("Continue") |
                Button/md secondary full width, space/3 gap ("Cancel" → back)
  Off-platform: same layout; **no** auto-redirect spinner as a fake CTA
                (product: no auto-redirect). Loading state only after explicit Continue.

DEAD-LINK / GATE-FAIL (three distinct states — contracts)
  Use Banner/error or Banner/warning + heading/sm
  Do not reuse the Continue-primary styling for unavailable

Motion: fade in duration/slow ease/out; reduced-motion instant
```

### 11.20 Momentum Ticker (A7)

Vibing / Featured strip. **Default = labeled list.** Animation is optional decoration on overflow.

```
──────────────────────────────────────────────────────────────────────────
CONTAINER
  Widget Card | padding space/3 | overflow hidden
  Height:       40px compact (single row) or auto if stacked (reduced motion)

ITEM
  Pill mechanism + optional thumbnail 20px radius/sm
  Gap:          space/3 between items
  Font:         label/md
  Featured item: 1px border border/active (the "Featured frame")
  Hook text:    body/xs, text/secondary, one line truncate

MOTION (when overflow && !prefers-reduced-motion)
  TranslateX step | GLOW PULSE clock **2000ms linear infinite**
  (the kit's only named infinite duration — do not add a marquee token)
  Pause on hover / focus-within.

REDUCED MOTION / DEGRADE
  Static horizontal row, overflow-x auto, no loop
  (F-24: text/list fallback is acceptable)

Hover item: hover-lift is **not** used (admin-adjacent chrome + ticker = too busy)
  Use underline text/link on the active item instead
```

### 11.21 Evidence / Diff Review Panel (A10)

Editorial workspace: draft + evidence side-by-side. Composes two Widget Cards on the 12-col grid.

```
──────────────────────────────────────────────────────────────────────────
DESKTOP (≥1024px)
  Grid 12-col, gutter space/6 (24px)
  Pane A (draft):  7 cols | Pane B (evidence): 5 cols
  Gap:             space/4
MOBILE
  Stacked, space/4
  Tabs: Button/sm ghost; active = text/link + 2px bottom border brand/primary

PANE
  Widget Card | padding space/4 | min-height 240px
  Header: heading/xs + optional Pill (source / similarity)
  Body:   §11.24 Markdown Reader (draft) or body/sm (evidence quotes)
  Scroll: max-height 70vh, bg/inset for quote blocks

DIFF HIGHLIGHT (token-only)
  Added:   feedback/success-bg | text feedback/success-text
  Removed: feedback/error-bg | text feedback/error-text
  Unchanged: text/secondary
  Do not invent a third diff hue

SYNC SCROLL (behavior slot)
  Visual: none — no lock-icon theater; optional ghost "Sync" toggle using Toggle §11.2

STATES
  Loading: skeleton heading + 6 text lines per pane
  Missing evidence: empty-state compact in pane B
```

### 11.22 Verified vs Unverified Conversion Badge (A13)

`/sell` CAP-247 vs CAP-525. **Must remain visibly distinct.** Extends §11.5 pill only — no new badge geometry.

```
──────────────────────────────────────────────────────────────────────────
SHAPE:      Pill mechanism (radius/full, padding 4px 10px, label/md, icon/xs)

NETWORK-VERIFIED (CAP-247)
  Background:   feedback/success at 10%
  Text:         feedback/success-text
  Icon:         check-circle
  Copy key:     distinct — never share a string with unverified

INTERIM SELF-REPORTED (CAP-525 — type=self_report AND status=unverified)
  Background:   feedback/warning at 10%
  Text:         feedback/warning-text
  Icon:         alert-triangle
  Copy key:     distinct — never equal to verified; never use success tokens

UNVERIFIED OTHER (coupon/subid pending)
  Background:   bg/surface-elevated
  Text:         text/secondary
  Border:       border/default 1px (exception: pills are usually borderless;
                this row **adds** a 1px border so it cannot collapse into verified)
  Icon:         clock

RULES
  Never use the same pill variant for verified and interim
  Never invent a "self-reported-unverified" color
  Compact size: same as default pill (no xs token — use label/sm + padding 2px 8px
                only when space-constrained; still keep the three palettes)
```

### 11.23 Legal / Long-form Prose + Empty State

Reading column already locked: **body never exceeds 720px** (§3.3). Legal layout is Wordmark-only (product). Empty-state structure restored from `NOTES.md` §17 (stripped copy, kept structure).

```
LEGAL / LONG-FORM PROSE
──────────────────────────────────────────────────────────────────────────
  Column:       720px max, centered | page padding §4.2
  Title:        heading/xl (or heading/lg on nested)
  Body:         body/lg (18/28) for legal; body/md for help/trust
  Hierarchy:    sequential H1→H2→H3 (§3.3)
  Links:        text/link | hover text/link-hover
  Dividers:     border/subtle 1px, space/8 vertical margin
  Wordmark:     §10.3; no app sidebar (§12.3 landing-like)
  Pre-publish:  same column + Banner/neutral "Unavailable" + noindex is product
  Pending state: empty-state below title, no invented legal copy

EMPTY STATE (every list / feed / collection)
──────────────────────────────────────────────────────────────────────────
  Align:        center
  Icon:         icon/2xl (48px), text/muted
  Heading:      heading/md, text/primary, space/3 below icon
  Description:  body/sm, text/secondary, max-width 300px, space/2 below heading
  CTA:          Button/md primary or secondary, space/4 below description
  Compact (tables, palette): icon/lg + heading/sm + no CTA required

  Loading:      skeletons, never a blank panel
  Error:        same structure, icon x-circle, Banner/error optional above
  Offline:      Banner/warning + same structure
  Honest empty: no fabricated counts (product CAP-371) — this spec forbids
                placeholder numerals in the description slot
```

### 11.24 Sanitized Markdown Reader

Post body, editorial draft, legal markdown. Typography tokens only. **Sanitization is engineering, not a visual token.**

```
──────────────────────────────────────────────────────────────────────────
  Measure:      720px max (reading column)
  Paragraph:    body/md, text/primary, space/4 between paragraphs
  H2:           heading/md, space/6 above, space/3 below
  H3:           heading/sm, space/5 above, space/2 below
  Inline code:  code/sm | bg/inset | radius/sm | padding 2px 4px
  Code block:   bg/inset | radius/md | padding space/4 | code/md | overflow-x auto
  Blockquote:   border-left 3px border/active | padding space/3 | text/secondary
  List:         body/md | padding-left space/6 | item gap space/2
  Link:         text/link
  Image:        radius/md | max-width 100% | space/4 vertical
  HR:           border/subtle
  Table:        prefer A1 compact if the markdown table is data-dense;
                otherwise body/sm cells, border/subtle, padding space/2

UNSAFE / FAILED SANITIZE
  Do not render raw HTML. Show Banner/error + caption "Content unavailable"
  (same empty compact). No attempt at a "broken markdown" theme.
```

### 11.25 Discussion Intelligence Panel (A9)

Post Detail MAX panel (CAP-124/132): themes, positions, common-ground vs divergence. **Composed — not a graph library.** No force-layout, no node canvas, no invented cluster colors.

```
CONTAINER
──────────────────────────────────────────────────────────────────────────
  Widget Card | padding space/4 | reading column ≤ 720px
  Header: heading/xs + optional caption "Last refreshed · {relative}"
          (timestamp slot; copy is product)
  Empty / pending run: compact empty-state (§11.23) — never a blank map
  Loading: skeleton heading + 4 pills + 6 text lines
  Failed / discarded revision: Banner/warning + last-valid content
                               (product: last valid kept — visual = banner + stale panel)

THEMES
  Overline label | space/2 below
  Row of Pills (§11.5), gap space/2, wrap
  Theme pill: bg/surface-elevated | text/secondary | no category-color fork
  Selected theme: bg/overlay | text/link | 1px border/active

POSITIONS
  Two stacked sections, gap space/6
  Section label: overline, text/muted
    Common ground | Divergence  — labels only; do not color-code as teams
  Each position: Notification Card structure (§11.3)
    Title: body/sm, text/primary
    Support: caption, text/muted (count is data; omit if zero — no fabricated counts)
  No connecting lines / bezier / cluster hulls

QUESTIONS (optional slot)
  List: body/sm, padding-left space/4, item gap space/2
  Bullet: text/muted

MOBILE
  Same stack; no horizontal graph. Horizontal scroll only for the theme pill row
  (overflow-x auto, space/2 gap) — same as ticker reduced-motion row.

A11Y
  Region label on the panel
  Theme pills are buttons (or tabs if they filter positions)
  Do not convey meaning by color alone (common ground vs divergence = headings)
```

Founder wanting a true cluster/force-graph instead of this panel: see `DESIGN-SYSTEM-OPEN-ITEMS.md` (optional override). Figma may generate this composed panel without waiting.

### 11.26 Tiered Ladder / Level Visualization (A8) — RESERVED

Distribution ladder (CAP-313, Orbit → Multiverse, silhouette above current). **No layout is locked.** Progress Fill (§7.3) exists; a multi-rung cosmic ladder does **not**. Founder picks a direction in `DESIGN-SYSTEM-OPEN-ITEMS.md` before Figma.

```
CONSTRAINTS THAT APPLY TO ANY DIRECTION (do not invent around these)
──────────────────────────────────────────────────────────────────────────
  Rungs:        exactly the ten signal.level literals (product/bible) —
                do not add icons-as-names that contradict the enum
  Current:      brand/primary text or fill (one accent only)
  Achieved:     text/primary
  Silhouette / locked above: bg/inset | text/disabled | lock icon/xs
  Opt-out (CAP-312): unmount the entire visualization (honest absence)
  Public triad: this component does not display Signals/Might numbers
  Progress:     existing PROGRESS FILL (track bg/overlay 4px, fill brand/primary)
                for Reach% · Signal% · sustained-days if shown as bars
  Motion:       gamification may use SCALE REVEAL on level-up only;
                browsing the ladder = fade duration/normal
  Reduced motion: no silhouette shimmer, no orbit animation
  Light mode:   glow substitution table §2.4 (solid border, no glow)

UNTIL FOUNDER SIGN-OFF: do not generate Figma frames for A8.
```

---

## 12. LAYOUT SYSTEM

### 12.1 Desktop App Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ HEADER (56px, fixed top, full width, z/sticky)                          │
├──────────┬─────────────────────────────────────────────────┬────────────┤
│          │                                                 │            │
│  LEFT    │  MAIN CONTENT AREA                             │  RIGHT     │
│  SIDEBAR │  (scrollable, fluid width)                     │  SIDEBAR   │
│  240px   │                                                 │  320px     │
│  fixed   │  Content column: max 720px for reading         │  fixed     │
│          │  Grid: 12-col for feed layouts                  │  scrollable│
│          │                                                 │            │
│          │                                                 │            │
├──────────┴─────────────────────────────────────────────────┴────────────┤
│ (No footer in app — infinite scroll or pagination in content area)      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Mobile App Layout

```
┌──────────────────────────────────────┐
│ HEADER (48px, compact, fixed top)    │
│ [☰ menu] [Logo] [🔔] [Avatar]       │
├──────────────────────────────────────┤
│                                      │
│  MAIN CONTENT                        │
│  (full width, scrollable)            │
│  Padding: 16px horizontal            │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ BOTTOM TAB BAR (64px, fixed bottom)  │
│  🏠   🔍   [+]   🔔   👤          │
└──────────────────────────────────────┘
```

### 12.3 Landing Page Layout (No sidebars)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ HEADER (transparent → solid on scroll, 64px)                             │
│ [Full Logo left] ──────────────── [Sign In ghost] [Join Free primary]    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FULL-WIDTH SECTIONS (centered, max 1280px)                             │
│  Each section: space/20 to space/24 vertical gap                        │
│                                                                          │
│  Hero → Problem → Solution → Categories → Social Proof → Manifesto →   │
│  Trending → Final CTA                                                    │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ FOOTER (standard, bg/surface, border/subtle top)                         │
│ Links | Social | Legal | "Made with 🤖 by AI, for AI"                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 12.4 Admin Console Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ADMIN HEADER (48px, compact)                                             │
│ [Mark + "console"] ──────────────────────────── [Admin name] [Sign out]  │
├──────────┬───────────────────────────────────────────────────────────────┤
│          │                                                               │
│  ADMIN   │  CONTENT AREA                                                │
│  SIDEBAR │  (full width, dense information layout)                      │
│  220px   │                                                               │
│  fixed   │  Tables, charts, forms — bg/canvas                           │
│          │                                                               │
│  Nav:    │                                                               │
│  Dashboard│                                                              │
│  Users   │                                                               │
│  Posts   │                                                               │
│  Cats    │                                                               │
│  Reports │                                                               │
│  Analyti │                                                               │
│  Gamific │                                                               │
│  Ads     │                                                               │
│  Settings│                                                               │
└──────────┴───────────────────────────────────────────────────────────────┘
```

---

## 18. ACCESSIBILITY STANDARDS

### 18.1 Target: WCAG 2.1 AA Compliance

```
COLOR CONTRAST:
  Normal text (< 18px):    4.5:1 minimum
  Large text (≥ 18px bold): 3:1 minimum
  UI components/icons:     3:1 minimum
  
  Our tokens are pre-tested:
    text/primary on bg/canvas:   21:1 (dark), 18.4:1 (light) ✅
    text/secondary on bg/canvas: 5.9:1 (dark), 5.3:1 (light) ✅
    text/muted on bg/canvas:     3.9:1 (dark), 4.0:1 (light) ✅ (passes large text)
    brand/primary on bg/canvas:  4.6:1 (dark) ✅
    brand/primary on white:      3.4:1 (light → use sky-600 for small text) ⚠️

KEYBOARD NAVIGATION:
  All interactive elements reachable via Tab
  Focus indicators: 2px outline, brand/primary-hover color, 2px offset
  Skip-to-content link (hidden until focused)
  Arrow keys for menu navigation
  Escape closes modals/dropdowns
  Enter activates buttons/links

SCREEN READERS:
  Semantic HTML: nav, main, article, aside, header, footer, section
  ARIA labels on all icon-only buttons
  ARIA live regions for: toast notifications, point changes, real-time updates
  Alt text on all images (user-uploaded: require alt text in upload flow)
  Role attributes on custom components

MOTION:
  Respect prefers-reduced-motion: disable all animations, transitions instant
  No auto-playing video/animation without user control
  No flashing content (>3 flashes per second)

TOUCH TARGETS (Mobile):
  Minimum: 44px × 44px
  Minimum spacing between targets: 8px
```

---

## 19. RESPONSIVE STRATEGY

### 19.1 Breakpoints

```
TOKEN              VALUE    TAILWIND    USAGE
────────────────────────────────────────────────────────────────
mobile-sm          320px    —           Small phones (min-width support)
mobile             375px    —           iPhone standard
mobile-lg          428px    —           iPhone Pro Max
tablet             768px    md          iPad portrait, layout shift
desktop            1024px   lg          Small laptops, 3-col layout
desktop-lg         1280px   xl          Standard desktops
desktop-xl         1440px   2xl         Design target
desktop-2xl        1920px   —           Large monitors
```

### 19.2 Design Target Frames

```
DESKTOP PRIMARY:    1440 × [content height]   (design target, verify at 1280 and 1920)
MOBILE PRIMARY:     390 × 844                 (iPhone 15 Pro, verify at 375 and 428)
TABLET:             Not designed separately — CSS responsive handles 768px-1023px
```

### 19.3 Responsive Behavior Rules

```
≥1024px (Desktop):
  Three-column layout (sidebar + content + sidebar)
  Full navigation, all widgets visible
  Hover states active
  
768px-1023px (Tablet):
  Two-column layout (sidebar + content)
  Right sidebar → hidden (moved to separate pages or bottom)
  Hamburger menu for mobile nav
  
<768px (Mobile):
  Single column
  No sidebars — bottom tab bar + drawer menu
  Condensed post cards (no AI summary text, smaller images)
  Touch-optimized: larger tap targets, swipe gestures
  Sticky bottom tab bar
  Bottom sheets replace modals
  Categories → horizontal scrolling pills
```

---

## 20. DARK / LIGHT MODE BEHAVIOR

### 20.1 Default: Dark Mode

All designs are created dark-mode-first. Dark mode is the default experience.

### 20.2 Mode Toggle

Located in: Settings → Appearance → Theme (Dark / Light / System)

### 20.3 Mode-Switching Rules

```
WHAT CHANGES:
  ✓ All bg/ tokens swap values
  ✓ All border/ tokens swap values
  ✓ All text/ tokens swap values
  ✓ All shadow/ tokens swap values
  ✓ Glow effects disabled in light mode
  ✓ Skeleton shimmer adjusts to light colors
  ✓ Code block backgrounds adjust

WHAT STAYS THE SAME:
  ✓ brand/primary (#0EA5E9) — same in both modes
  ✓ Category colors (primary hex) — same in both modes
  ✓ Gamification colors — same in both modes
  ✓ Feedback colors (primary hex) — same in both modes
  ✓ All spacing, typography sizes, radius, z-index
  ✓ Component structure and layout
  ✓ Icon style and sizes
  ✓ Logo mark colors swap (white ↔ dark)
```

---

## APPENDIX A: QUICK REFERENCE CARD

```
BRAND COLOR:          #0EA5E9 (Electric Sky Blue)
FONT:                 Geist (Sans) + Geist Mono
ICON LIBRARY:         Lucide (stroke-only, 1.5px)
DEFAULT RADIUS:       8px (radius/md)
DEFAULT SPACING:      16px (space/4)
DEFAULT TRANSITION:   200ms ease/default
DEFAULT MODE:         Dark
CARD STYLE:           bg/surface + border/subtle + radius/lg + space/4 padding
BUTTON DEFAULT:       36px height + radius/md + brand/primary bg
INPUT DEFAULT:        36px height + radius/md + bg/surface + border/default
MOBILE BREAKPOINT:    <768px → single column + bottom tabs
DESIGN TARGET:        Desktop 1440px / Mobile 390px
WCAG TARGET:          AA compliance
```

---

*Style kit extracted from CREATECONOMY_DESIGN_SYSTEM.md v2.0.
Styling tokens and component mechanics only. Product/page/category/gamification
content was excluded — see `NOTES.md`. This file is a pure visual reference.*
