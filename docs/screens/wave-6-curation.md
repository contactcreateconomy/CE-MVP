---
# Hero & Featured Management

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** the Administrator-only "Emergency pull" (CAP-… pullFeatured) button was visible to any staff role; now gated on a new `isAdministrator` flag returned by `getCurationState`.


**Route:** `/admin/curation`
**Status:** NOT STARTED
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-curation-FINAL.md
**Slice(s):** P6-04

## Layout
Derived from contract §6 (Components Used: admin-scheduler archetype · §12.4 admin layout) + inventory Template archetype "Admin scheduler":

```
┌────────────────────────────────────────────────────────────────────────┐
│ Admin layout §12.4 (motion §7.4 fade-in only; minimal role-gate now,   │
│  full M15 /admin shell wraps at Wave 7)                                 │
├────────────────────────────────────────────────────────────────────────┤
│ HERO SLOTS — A1 data table (10 rows, slotOrder 0–9; 4–6 rendered;      │
│  ≥2 rotate per 24h)                                                     │
│  slot · post (post/slot picker, §11.7 Dropdown) · startAt/endAt         │
│  (date-range pickers) · overrides: headline / text / media / CTA label  │
│  (§11.2 Inputs) · desktopEnabled / mobileEnabled (toggles) ·            │
│  fallbackPostId · disclosureClass · hero.status pill                    │
│  {draft·scheduled·active·expired·paused·archived}                       │
│  actions: upsert/schedule · pause · archive … → §11.7 Modal confirm     │
├────────────────────────────────────────────────────────────────────────┤
│ FEATURED OVERLAY (CAP-191 booking): post picker · time-bound window    │
│  (startAt→endAt) · cadence caps (≤1 booking/cycle · ≤1–2 active)        │
│  [ EMERGENCY-PULL (CAP-554, administrator) → modal confirm ]            │
├────────────────────────────────────────────────────────────────────────┤
│ Media preview of slot overrides (§11.3 card family)                     │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- A1 data table (10 hero slots) → apps/forum/src/components/ui/data-table/index.tsx
- §12.4 admin layout — layout pattern; no library file (Wave 7 admin shell)
- §11.2 Inputs (headline/text overrides, CTA label) → apps/forum/src/components/ui/input.tsx
- Date-range pickers (startAt/endAt) → apps/forum/src/components/ui/datetime-picker/index.tsx (note: contract says "no §11 datetime/scheduler component" — that is a STYLE-KIT §11 gap; the app library does have a datetime-picker — verify fit for range scheduling)
- Toggles (desktopEnabled/mobileEnabled) → apps/forum/src/components/ui/toggle-switch.tsx
- Post/slot pickers (§11.7 Dropdown) → apps/forum/src/components/ui/dropdown-menu.tsx
- §11.1 Button → apps/forum/src/components/ui/button.tsx
- §11.7 Modal (schedule/pause/emergency-pull confirm) → apps/forum/src/components/ui/dialog.tsx
- Toast → apps/forum/src/components/ui/toast.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- Media preview (§11.3 card family) → apps/forum/src/components/ui/card.tsx
- Status pills (hero.status) → apps/forum/src/components/ui/badge.tsx
- MISSING: Hero-preview does not exist in the library (contract §6 names it undefined)
- MISSING: Slot-order manager does not exist in the library (contract §6 names it undefined)
- MISSING: Rotation-compliance indicator does not exist in the library (contract §6 names it undefined)
- MISSING: Featured-cadence indicator does not exist in the library (contract §6 names it undefined)

## States required
*(Enum-backed lifecycle below. GPT's ~80 states — each override present/absent, each desktop/mobile combination, each mutation pending/success/fail — folded, since the authoritative state set is the `hero.status` enum + the cadence/slot-count invariants.)*

**A. Hero slot lifecycle (`hero.status` enum — six):** `draft` (composed, unscheduled) → `scheduled` (startAt/endAt set, not yet live) → `active` (rendering) → `expired` (window elapsed) · `paused` (reversible hold) · `archived` (retired). All six are admin-reachable states of the same slot.
**B. Slot inventory:** 10 managed (slotOrder 0–9); **4–6 rendered** concurrently; **≥2 rotate per 24h**; per-slot desktopEnabled/mobileEnabled; optional overrides (headline/text/media/CTA); fallbackPostId?; disclosureClass on the row.
**C. Hero staleness:** no fresh active slots >24h → CAP-193 auto-fills from TOP labeled "Community Top" (System; this screen surfaces the staleness that triggers it). Never Recognition-selected.
**D. Featured overlay:** time-bound window (startAt→endAt); labeled "Featured"; **≤1 booking/cycle**; **≤1–2 active concurrently**; empty slot → next algorithmic item (feed-side); **never mutates trendScore**. **Emergency-pull (`status=pulled`, CAP-554)** removes an item before natural expiry without waiting for `endAt`.
**E. Audit-fail:** privileged mutation must fail closed if `auditLog` cannot persist (CAP-426 pattern).
**F. Safety-removal:** an active Featured/Hero target that becomes moderation-ineligible must stop rendering (CAP-191/192 gates).

## Component library maturity note
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ datetime-picker has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dropdown-menu has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button, card, toast.
---
