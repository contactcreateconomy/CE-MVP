# Design system — open items (Figma blockers)

> Companion to `STYLE-KIT.md` F-24 close (2026-08-29).
> Only items that need **founder sign-off before Figma generation**. Mechanical
> specs in §11.10–§11.25 may proceed. Do not treat this file as a token sheet.

---

## Must sign off — blocks Figma

### A8 — Tiered ladder / level visualization (`STYLE-KIT` §11.26)

Novel gamification centerpiece (CAP-313, Orbit → Multiverse, silhouette above current). Progress Fill exists; a multi-rung cosmic ladder does not. Token **constraints** are already locked in §11.26 (ten `signal.level` rungs, `brand/primary` for current, silhouette = `bg/inset` + lock `icon/xs` + `text/disabled`, CAP-312 unmounts the whole viz, no Signals/Might numbers on the public ladder, glow off in light / `prefers-reduced-motion`). **Pick a layout.** Do not invent per-level colors.

| ID | Direction | One line |
|---|---|---|
| **A8-A** | **Vertical rail** | Ten rungs stacked Orbit (bottom) → Multiverse (top), `space/4` between; current = `brand/primary` fill + `glow/primary-sm` (dark only); achieved = `text/primary`; silhouette above = `bg/inset` + lock. |
| **A8-B** | **Concentric rings** | Nested `radius/full` rings, innermost = Orbit; current ring uses existing Progress Fill (`duration/slower`, `ease/out`); locked outer rings = `border/subtle` only; `label/md` on the current ring. |
| **A8-C** | **Podium strip** | Widget Card row of ten `radius/md` cells; locked = `bg/inset`; current = `border/active`; silhouette = `border/subtle` + `text/disabled`; Peak badge uses the existing pill, not a new medal. |

Reply with `A8-A`, `A8-B`, or `A8-C` (or a hybrid named against these). Until then: **no A8 Figma frames.**

> **BUILD NOTE (2026-09-01, not founder sign-off):** the code component
> `apps/forum/src/components/ui/tiered-ladder.tsx` was built to **A8-A**
> per an explicit build instruction naming "the vertical rail direction."
> The instruction's Figma-frame placeholder ("[confirm/attach Figma frame
> here]") arrived **unfilled**, and no A8-A/B/C selection is recorded
> anywhere in this repo (OPEN-DECISIONS has no A8 entry). The component
> therefore implements ONLY the locked §11.26 constraints + the A8-A
> one-liner above (tokens-only, ten rungs, brand-fill current, inset+lock
> silhouettes, CAP-312 unmount, three-component Progress Fill, §7.3
> fade/scale-reveal motion) and must be **reconciled against the founder's
> Figma frame when it exists** — visual sign-off remains OPEN. The Figma
> gate above still stands.

---

## Optional override — Figma may proceed on the default

### A9 — Discussion map / MAX viz (`STYLE-KIT` §11.25)

Default is a **composed intelligence panel** (Widget Card + pills + Notification Card rows + overline headings). No graph library. Figma can generate §11.25 as written.

Sign off **only if** you want a true map instead of that default:

| ID | Direction | One line |
|---|---|---|
| **A9-KEEP** | **Composed panel** | Keep §11.25 (recommended default — mechanical, no new metaphor). |
| **A9-TREE** | **Indented tree** | Themes as parent rows, positions as nested `space/4` indent; still no canvas. |
| **A9-GRAPH** | **Force / cluster graph** | New visual (nodes + edges). Blocks Figma until a separate spec; do not start this without explicitly choosing it. |

---

## Not founder-visual — do not hold Figma for these

| Item | Status |
|---|---|
| **A2 Charts** | Still owning-slice (audit B3b). Not specified in this close. |
| **A3 Block / rich composer** | Still owning-slice. Not specified in this close. |
| **F-25 STATUS DOT / CHECKBOX** | Already in `STYLE-KIT` §11.2 / §11.5 — not gaps. |
| **A12 Queue / case board** | Specified mechanically as §11.11 (F-24 shared primitive; composes A1 + Notification Card). |

Copy on banners, `/go` interstitial, legal prose, and A13 pill **strings** remains founder/legal-owned. Chrome is specified; do not invent marketing copy in Figma.
