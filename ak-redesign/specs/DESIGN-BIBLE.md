---
id: DESIGN-BIBLE
type: FOUNDATION (design principles — the "why" and "how it should feel")
author: Founder (taste) + Claude (PM/design council), 2026-10-12
status: ACTIVE — v1
precedence: CEY-VISION.md > DESIGN-BIBLE.md > screen specs (FEED-DESIGN, S0x-SPEC) > STYLE-KIT.md (tokens)
sources: Apple Human Interface Guidelines (iOS, macOS, visionOS; Materials, Motion, Typography, Layout, Color, Accessibility, Eyes, Windows) · Emil Kowalski "apple-design" skill · research cited inline
---

# Createconomy Design Bible

> **One line:** visionOS thinking on a flat screen. Floating, clean, elegant, future, simple — and every action an experience.

We do not copy Apple. We take the **foundations** (physics, legibility, hierarchy, comfort) from the best-documented design system in the world, add **human psychology**, and keep the **taste** ours. STYLE-KIT holds the values (tokens). This bible holds the reasons and the rules. A screen spec decides *what* goes on a screen; this decides *how it must feel*.

**How to use it.** Every spec, prompt and review cites the section it follows ("Bible §4.3"). When a spec and the bible disagree, the bible wins unless the founder records an exception. When the bible is silent, ask: *what would Apple do on visionOS, and what would make a creator feel valued?*

---

## 1. Our stance: visionOS on a flat screen

visionOS has no real "page". It has **windows that float in your space**, made of glass, with your world visible around them. We bring that feeling to a browser:

| visionOS idea | What it means for Createconomy (web, iOS-feel on phones, macOS-feel on desktop) |
|---|---|
| Windows float in space | Our chrome (menu bar, tab bar, rails, sheets) are **floating islands**, never edge-to-edge strips. Content scrolls *beneath* them |
| Glass keeps you connected to your surroundings | Frost lets the content behind show through softly, so you never feel boxed in. **Neutral glass — it takes colour from what's behind, adds none** |
| Two layers: controls float above content | **Functional layer** (navigation, controls) = real frost. **Content layer** (cards, posts) = solid-ish surfaces, no live blur. Never mix them (Apple: "Don't use Liquid Glass in the content layer") |
| Eyes highlight what you look at | **Hover confirms the target, never acts.** Every hover depth has a tap twin on phones |
| Comfort first: nothing moves in your periphery | Motion only where you're looking. Nothing animates outside the user's focus |
| Minimum immersion for each moment | Each screen uses the **least** spectacle that serves the moment. The big moments earn the big motion |
| Rounded shapes are easier to target | Everything interactive is rounded; corners are concentric |

**Platform translation.** Phones feel like **iOS** (one-thumb, bottom tab bar, sheets from the bottom, large type). Desktop feels like **macOS** (pointer precision, hover, rails, keyboard). Both share one material, one motion system, one vocabulary. We do not design for watchOS or tvOS.

**What we refuse.** Website feel (edge-to-edge headers, link underlines everywhere, page reloads), decoration without meaning, glow at rest, motion for its own sake, dark patterns.

---

## 2. Principles

Apple's eight principles, each with what it means **here**:

| Principle | Means for us | Test |
|---|---|---|
| **Purpose** | Every pixel expresses data or produces a signal (FEED principle 6) | What breaks if we remove it? |
| **Agency** | The user is in control: undo over confirm, explain on demand, dials they own (StellarMap, see-less) | Can they reverse it in one tap? |
| **Responsibility** | Honest numbers, labelled AI, no manufactured urgency or social proof | Would we show this screen to a regulator? |
| **Familiarity** | Use known patterns (tab bar, sheets, pull to refresh). Invent only where we beat them | Would a Threads user know what to do in 2 seconds? |
| **Flexibility** | Dark + light, reduced motion, larger text, keyboard, screen reader — all first class | Does it work at 200% text and with motion off? |
| **Simplicity** | One primary action per surface. Progressive disclosure for the rest | Can you name the one thing this screen wants? |
| **Craft** | Details: optical alignment, concentric radii, no layout shift, 60fps | Does it survive a frame-by-frame review? |
| **Delight** | Earned, rare, meaningful. The three moments (publish, comment, recognised) get it | Is the delight tied to a real achievement? |

**Ours, on top:**
9. **Make people feel valued** (CEY-VISION §5). Every screen answers: *where does the creator feel appreciated here?*
10. **Trust at first glance.** Solid, calm, evolving. Nothing flimsy, nothing shouting.
11. **Feeds end.** Respect attention; no infinite slot machines.

---

## 3. Spatial model: layers and depth

### 3.1 The layers (back to front)
| Layer | What lives here | Material | Shadow |
|---|---|---|---|
| **L0 Canvas** | page background, dot grid | `bg/canvas` | none |
| **L1 Content** | cards, posts, threads, lists | `frost-look` (translucent ~85%, 1px top highlight, **no live blur**) or `bg/surface` | `shadow/xs` |
| **L2 Functional** | menu island, tab bar, rails, sorter, hero chrome | `frost-strong` / `frost-subtle` (real blur, neutral) | `shadow/md` |
| **L3 Transient** | sheets, popovers, menus, toasts | `frost-strong` + scrim when blocking | `shadow/lg` |
| **L4 Critical** | blocking dialogs, auth | solid `bg/surface-elevated` | `shadow/xl` |

### 3.2 Rules
1. **Glass is functional, not decorative.** Real frost only on L2–L3. Cards never get live blur (performance on mid-range Android + Apple's layer rule).
2. **Use glass sparingly** — "limit these effects to the most important functional elements" (Apple). If everything floats, nothing does.
3. **Never stack two light translucent surfaces.** Max 2 glass layers; a sheet over glass makes the glass behind solid (D-007).
4. **Content scrolls under glass.** Separate chrome from content with a **scroll-edge fade**, not a hard line or a solid bar.
5. **Over photos / media:** use a clearer frost; if the media is bright, add a **35% dark dim** behind text (Apple, clear variant).
6. **Scrim only when blocking.** Non-blocking panels (peeks, popovers) have no scrim.
7. **Depth is shown by blur + shadow + scale together**, never by shadow alone. Elements entering from depth animate blur and scale together.
8. **Fallbacks:** `prefers-reduced-transparency` or no `backdrop-filter` → solid surface; `prefers-contrast: more` → solid + defined 1px border.

---

## 4. Materials (frost)

| Token | Use | Apple analogue |
|---|---|---|
| `frost-strong` | menu island, sheets, hero panel | Liquid Glass regular |
| `frost-subtle` | rail widgets, sorter, tab bar | thin material |
| `frost-look` | feed cards and content surfaces | standard material in the content layer |
| solid `bg/surface-elevated` | dialogs, anything text-heavy over busy content | thick material |

**Rules (from Apple Materials, adapted):**
1. **Neutral glass.** No `saturate()`, no colour bleed from content (L-40, L-68). Glass takes light from behind, never tint.
2. **Text on glass uses our hierarchy colours** (`text/primary`, `secondary`, `muted`) like Apple's vibrant label levels. **Never put `text/muted` on `frost-subtle` over busy content** (Apple: avoid quaternary on thin materials — contrast too low).
3. **Thicker for text, thinner for context.** Long text → thicker/solid. A floating control over a feed → thinner, so you keep your place.
4. **Colour on glass sparingly.** Only primary actions and status get colour, and **colour goes on the background of the control, not on its text or icon** (Apple). Never colour the backgrounds of several controls side by side.

---

## 5. Shape

1. **Rounded = targetable.** Every interactive element has rounded corners; pills for chips and tabs.
2. **Concentric corners.** Inner radius = outer radius − padding (STYLE-KIT §6 nested rule). A 16px card with 12px padding holds 4px-radius inner elements, never 16px.
3. **One container per compound control.** A card, a row with avatar + name + action: the *whole* shape highlights on hover, not each child separately (Apple Eyes).
4. **Radius scale is fixed** (STYLE-KIT §6). No raw `rounded-[Npx]`.
5. **Stability on interaction.** When something reacts (hover, press), at least one primary part stays unchanged — never morph everything at once.

---

## 6. Typography

**Geist is our SF.** Same philosophy: one family, hierarchy from weight + size + leading together, a mono (Geist Mono) for numbers.

### 6.1 Sizes (Apple minimums, mapped to our tokens)
| | Phone (iOS-feel) | Desktop (macOS-feel) |
|---|---|---|
| Body default | 16–17px (`body/md`) | 14–15px (`body/sm`/`md`) |
| Minimum anywhere | **11px** (`label/sm`), never for sentences | **10–11px**, never for sentences |
| Minimum for a readable sentence | 13px | 12px |
| Large title | 28–34px | 26–30px |

### 6.2 Rules
1. **Weights: Regular, Medium, Semibold, Bold only.** No Thin/Light/Ultralight (illegible at small sizes; Apple). Max 3 weights per screen (STYLE-KIT §3.3).
2. **Tracking by size:** tighten large text (≈ −0.02em for headings ≥24px), body ≈ 0, tiny labels slightly positive.
3. **Leading inverse to size:** headings tight, body loose. **Any text of 3+ lines gets loose leading**, even in tight spaces.
4. **Hierarchy survives zoom:** use `rem`; the layout must hold at **200% text** (Apple). At large sizes, stack instead of inline; never truncate inside scrollable areas.
5. **Text stays flat.** No text shadows, no glowing text (Apple visionOS: depth and shadows hurt legibility).
6. **Numbers in Geist Mono** (Gravity, counts, prices, times) so they read as measurements: "18G".
7. **Tab titles don't grow** with body text (Apple): chrome stays stable when content scales.

---

## 7. Colour

1. **One accent, one meaning.** Electric blue = *interactive or selected*. Never use it for plain text decoration. "Avoid using the same color to mean different things" (Apple).
2. **Monochrome by default, colour as signal.** Our canvas is near-black/white; colour appears only for brand action, status, data, and the user's own state (G-switch on).
3. **Semantic tokens only** (`text/*`, `bg/*`, `feedback/*`). Never hard-code values; never reuse a token for another meaning (no separator colour as text).
4. **Three variants for every custom colour:** light, dark, and **increased contrast**.
5. **Never colour alone.** Every state also has a shape, icon or label (red/green and blue/orange are hard for colour-blind users).
6. **Bold text and large areas carry colour better** than thin text or small dots (Apple visionOS).
7. **Brightness balance:** no bright flashing element on a black field (comfort). Glow is a brief blink with a reason (D-007), never a resting state (L-38).
8. **Contrast:** 4.5:1 for text ≤17px, 3:1 for ≥18px or bold, checked in **both** themes.

---

## 8. Layout and spacing

1. **Importance runs top-leading.** The most important thing sits top-left (desktop) / top (phone). On phones, the **primary action sits in the thumb zone** (bottom third).
2. **Group with space, not lines.** Negative space and containers first; separators last (Apple). Proximity = relationship.
3. **Progressive disclosure.** Show the essence; reveal depth on hover/tap (FEED §7 morph grammar).
4. **Targets:** phone **44×44px** (min 28 only for dense secondary icons with 12px padding); desktop **28×28px** min (32 preferred). Keep **12px** around bezelled controls, **24px** around unbezelled ones.
5. **Spacing between targets:** never so tight that the eye jumps between them (visionOS: centres ≥60pt apart for comfortable aiming — on desktop we apply the spirit: primary actions never cluster).
6. **Desktop windows:** never put critical actions at the bottom of a scrolling region (macOS). Phones: sticky actions sit above the tab bar, inside the safe area.
7. **Safe areas are sacred** (notch, home indicator): `env(safe-area-inset-*)`.
8. **Adapt, don't change function.** A wider screen shows more (rails), never different features. Test smallest and largest first.
9. **Size the window to its content.** No big empty frames; panels shrink to fit (visionOS window sizing).

---

## 9. Motion

### 9.1 Philosophy
Motion is **physics, not decoration**. An interface feels alive when motion **starts from where things are now, carries the user's momentum, and can be interrupted at any moment**. Apple: "Add motion purposefully… don't add motion for the sake of adding motion."

### 9.2 The rules
1. **Respond on press, not on release.** Pointer-down → immediate feedback (scale ≈0.97, ~100ms). Commit on release; dragging away cancels.
2. **Never block input during animation.** Every animation is interruptible and reversible from its *current* value.
3. **Springs, not durations,** for anything spatial. Default **critically damped (no overshoot)**; allow slight bounce (damping ≈0.8) **only** when the user's gesture carried momentum (flick, swipe, throw).
4. **Same path in and out.** A sheet that rises from the bottom leaves downward. Transform-origin anchored to the trigger (a menu grows from its button; Start Discussion grows into the publisher).
5. **Animate transform and opacity only** (+ blur where depth changes, together with scale). No layout-property animation.
6. **Brief and precise for feedback; generous only for rare moments.** Frequent interactions (scrolling, tab switching) get almost no motion. The celebratory budget is spent on the three moments.
7. **Directional hinting.** In-between frames already show where things are going.
8. **Nothing moves in the periphery.** Only the user's point of focus animates (FEED rule 6).
9. **No sustained oscillation**, especially around **0.2 Hz** (slow pulsing) — it causes discomfort (Apple). Pulses are short and end (CTA arrow: 3 pulses, then rest).
10. **Rubber-band at edges** (progressive resistance), never hard stops on drags.
11. **Reduced motion:** springs → crossfades; no scale, no blur transitions, no parallax, no z-depth animation (Apple Accessibility).

### 9.3 Our three springs (mapped)
| Our token | Use | Feel target (Apple vocabulary) |
|---|---|---|
| `feedback` | press, toggle, G-switch | very fast, **critically damped** (damping ratio ≈1.0, response ≈0.2s) |
| `settle` | user-caused state change, tab pill, expand | damping ≈1.0, response ≈0.35s |
| `glide` | large surfaces, sheets, hero, reveals | damping ≈0.9–1.0, response ≈0.5s; 0.8 if thrown |

> **Audit note (B1):** our current `feedback` spring (stiffness 520, damping 34) has a damping ratio ≈0.75, so it overshoots on every tap. Rule 3 says taps are critically damped. Fix: damping ≈46 at stiffness 520 (or express springs as `{ type: "spring", bounce: 0, duration }`). Recorded as L-72.

### 9.4 Signature moves (ours)
- **Focus pull** — entering content arrives from soft blur + slight depth to sharp. Used for first load, reveals and lens changes. Never on scroll.
- **Iris** — theme change opens as a circle from the toggle (L-67).
- **G-switch slide** — the capsule slides into the G on the user's first positive interaction (L-63).
- **Grow from the trigger** — buttons expand into their sheet (Start Discussion → publisher).

---

## 10. Hover, focus and press

From visionOS "eyes" to web hover:
1. **Hover confirms, never acts.** It says "this is interactive and you're on it". Nothing is committed by hover (no favouriting on hover).
2. **Three hover delays:** none for subtle affordances (highlight); short (~150ms) for expansions (labels revealing); long (~500ms) for extra information (tooltips, the why-line detail).
3. **Hover adds depth, never layout** (FEED rule 4). No height change, no reflow.
4. **Don't reveal new content next to where the user is looking** — it pulls the eye away involuntarily (Apple Eyes). Reveal *in place*.
5. **Every hover has a tap twin** on phones (tap the indicator).
6. **Focus is separate from hover:** keyboard focus = visible solid ring (both themes), always.
7. **Press state** on everything tappable (scale ≈0.97 + slight dim), within 100ms.

---

## 11. Feedback and states: every action is an experience

### 11.1 The anatomy of one action
Every action has four beats. Design all four, every time:
| Beat | Time | What happens | Example (tap G) |
|---|---|---|---|
| **1. Acknowledge** | <100ms | the control reacts to the touch | G presses in |
| **2. Commit** | on release | optimistic update, no spinner | capsule slides into the G |
| **3. Confirm** | 100–600ms | the meaning lands, once | count ticks 17→18G, one soft glow (dark) |
| **4. Settle** | after | calm resting state that remembers | G stays "on" next time you see the post |

### 11.2 Rules
1. **Optimistic by default.** Show the result immediately; reconcile with the server silently; only failures speak.
2. **Undo beats "Are you sure?"** Confirm dialogs only for irreversible, high-cost actions (delete account). Everything else: act + undo toast.
3. **Four kinds of feedback** (Apple): status (where am I), completion (it worked), warning (careful), error (it didn't — and here's the fix). Each has one visual form; never mix.
4. **Errors are calm and specific.** Say what happened and the next step, in plain words. No red walls, no codes.
5. **Loading = skeletons shaped like the content**, never spinners in content areas. Spinners only inside buttons.
6. **Empty states teach and invite.** "No strings attached · start one." Never a blank box, never a fake number.
7. **Multimodal, same frame, sparingly.** If we use sound or haptics (mobile web vibration where supported), they fire on the same frame as the visual — and only for meaningful moments.

---

## 12. The psychology layer

Design is how we transfer appreciation, respect and trust (CEY-VISION §5). These are the mechanisms we use — and the ones we refuse.

### 12.1 What we use
| Mechanism | Evidence | How we use it |
|---|---|---|
| **Self-Determination Theory** — autonomy, competence, relatedness drive lasting motivation | Deci & Ryan; established | Autonomy: StellarMap, dials, undo. Competence: Levels, Earned topics, author flux coaching. Relatedness: Strings, faces, being answered |
| **Peak–end rule** — experiences are remembered by their peak and their end | Kahneman et al.; established | Design the **peaks** (publish, first String received, first G, Level up) and the **ends** ("You're caught up", a warm sign-off after publishing) |
| **Goal gradient + endowed progress** — people speed up near a goal and finish what's already started | Kivetz et al. 2006; Nunes & Drèze 2006; established | Completion meter that starts partly filled from real sign-up data, each gap naming its payoff (L-22) |
| **Effort justification / IKEA effect** — people value what they helped build | Norton et al. 2012; established | Let creators shape their space (StellarMap, pinned dimensions); show their contribution in the thread |
| **Reciprocity** — receiving value invites giving back | established | Tell people when their String or post received G, and by whom (humans only) |
| **Honest social proof** | Salganik et al. 2006 (MusicLab) | Show real faces and counts, never inflate; protect new creators from early-popularity snowballs (exploration) |
| **Choice architecture** — defaults and prominence steer choices | Thaler & Sunstein; established | Equal weight for binary choices (L-37); defaults that serve the user (visitors land on Hot) |
| **Information foraging** — people follow "scent" | Pirolli & Card; established | Every card shows its scent (facet, why-care line) so opening it is a confident choice |
| **Recognition over recall** | Nielsen heuristics | Show options, don't make people remember; keep context visible (frost over content) |

### 12.2 What we refuse (dark patterns)
- **No streaks or loss-framed pressure** ("don't lose your streak") — CR-007 rejected.
- **No fake urgency or scarcity**, no fake counters, no fabricated activity (D-012).
- **No confirm-shaming** ("No thanks, I don't want to grow").
- **No unbounded variable rewards.** Discovery is bounded; feeds end.
- **No hidden costs or sneaky opt-ins.** Consent is explicit and reversible (M7).
- **No metric a creator can see but can't influence honestly** (Goodhart: mass stays hidden, L-61).

### 12.3 The three moments (where delight is spent)
| Moment | Feeling we want | Experience |
|---|---|---|
| **You published** | "I made something and it's out there" | publisher collapses back into the feed, your post focus-pulls in at the top with a "First look" ring; a short warm line ("Your post is live · it gets a fair first look") |
| **Someone engaged** | "I was seen" | first String / first G arrives as a single calm notification with the person's face; the Fav glow lights |
| **You were recognised** | "I'm valued here" | Level up / Earned star / Podium entry: the one place we allow a richer reveal (scale + glow, once), with the reason in words |

Everything else stays quiet so these three are felt.

---

## 13. Desktop (macOS-feel) vs phone (iOS-feel)

| | Phone (390) | Desktop (≥1024) |
|---|---|---|
| Navigation | bottom tab bar (frost island), one thumb | top menu island + left rail |
| Primary action | centre Create in tab bar | Start Discussion in rail |
| Secondary surfaces | bottom sheets (grow from bottom, swipe down to close) | popovers and side sheets anchored to the trigger |
| Depth reveals | tap | hover (+ tap twin) |
| Density | one column, larger type, 44px targets | three columns, denser, 28–32px targets |
| Gestures | swipe, pull to refresh, long-press for menus | hover, keyboard shortcuts, right-click menus |
| Hero | lens header only (D-017) | full trailer |
| Back | edge swipe + top-left back | browser back + breadcrumb in rail |

---

## 14. Accessibility baseline (non-negotiable)

- Contrast AA in both themes (§7.8); increased-contrast variants.
- Text scales to 200% without loss; never truncate inside scrolling regions.
- `prefers-reduced-motion` → crossfades; `prefers-reduced-transparency` → solid; `prefers-contrast: more` → solid + borders.
- Every icon-only control has a label + tooltip; every state has a non-colour cue.
- Keyboard: everything reachable, visible focus ring, Esc closes, arrow keys in menus.
- Screen reader: meaningful names for states ("Fav, new activity"; "Gravity, on: you appreciated and saved this").
- Auto-moving content (Vibing) pauses on hover/focus and has a pause control (WCAG 2.2.2).
- No flashing more than 3 times per second; no slow sustained pulsing.

---

## 15. Review checklist (every screen, every PR)

1. **Purpose:** can each element name its job? What breaks if removed?
2. **Layers:** is glass only on functional chrome? No stacked translucency? Content scrolls under chrome with an edge fade?
3. **Feel valued:** where does the creator feel appreciated on this screen?
4. **One thumb:** can the core action be done one-handed at 390px?
5. **Four beats:** does every action acknowledge, commit, confirm, settle?
6. **Motion:** pointer-down response, interruptible, same path in/out, nothing in the periphery, reduced-motion path?
7. **Type & colour:** allowed weights only, minimum sizes, one accent meaning, contrast in both themes?
8. **Honesty:** every number real, AI labelled, no dark pattern?
9. **States:** loading (skeleton), empty (teaches), error (calm + fix), offline?
10. **Benchmark:** which app does this beat (Threads / X / Reddit), and on what?

---

## 16. Sources
- Apple Human Interface Guidelines: Materials, Motion, Typography, Layout, Color, Accessibility, Eyes, Windows, Designing for visionOS — developer.apple.com/design/human-interface-guidelines
- Emil Kowalski, "apple-design" skill — github.com/emilkowalski/skills
- Deci & Ryan, Self-Determination Theory · Kahneman, peak–end rule · Kivetz, Urminsky & Zheng (2006) goal gradient · Nunes & Drèze (2006) endowed progress · Norton, Mochon & Ariely (2012) IKEA effect · Salganik, Dodds & Watts (2006) MusicLab · Thaler & Sunstein, Nudge · Pirolli & Card, information foraging · Nielsen heuristics · WCAG 2.2

## 17. Change log
- 2026-10-12 — v1. Foundations from Apple HIG (iOS, macOS, visionOS) + Emil Kowalski's apple-design notes + psychology layer, tailored to Createconomy. Flags L-72 (feedback spring overshoots).
