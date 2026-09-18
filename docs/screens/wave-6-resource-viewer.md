---
# Resource Viewer

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** removed a contract-violating acquisition gate — CONTRACT-6-resource-viewer §3B / DEC-S15 / INV-6 are explicit that member viewing must **never** be gated behind a prior acquisition (acquire and view are deliberately separate surfaces); the viewer previously required one. Added a "Back to library" link.


**Route:** `/resources/[slug]/view`
**Status:** NOT STARTED
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-resource-viewer-FINAL.md
**Slice(s):** P6-08

## Layout
Derived from contract §6 (Components Used) + inventory Template archetype "Sandboxed PDF viewer":

```
┌────────────────────────────────────────────────────────────────────────┐
│ /resources/[slug]/view — minimal viewer shell                           │
│  [ close / back (§11.1 Button) ]   resource title / current version    │
│  [ optional "Get free download" CTA (§11.1) → routes to CAP-212 on     │
│    /resources ]                                                         │
├────────────────────────────────────────────────────────────────────────┤
│  SANDBOXED PDF VIEWER (A5)                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  sandboxed iframe + CSP · patched pdf.js                          │  │
│  │  short-TTL signed URL → platform-forged clean PDF ONLY            │  │
│  │  (never original user reference bytes)                            │  │
│  │  member → full view (no interstitial)                             │  │
│  │  anonymous → teaser branch (content = DEC-M10-VIEW-AUTH, fenced)  │  │
│  │  no app cookies on delivery origin                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  attribution line if hosted here — mirror of /resources OQ-1            │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- A5 sandboxed PDF viewer → apps/forum/src/components/ui/pdf-viewer.tsx (library component exists; contract flags the §11 archetype as a gap — "delivery is sandboxed iframe + CSP; no viewer-chrome pattern — do not invent". Verify pdf-viewer.tsx satisfies the delivery invariants (sandboxed iframe, CSP, patched pdf.js, no app cookies); P6-08 v1 = sandboxed iframe meeting the delivery invariants, not a designed PDF chrome kit)
- §11.9 Skeleton (signed-URL fetch) → apps/forum/src/components/ui/skeleton.tsx
- §11.8 Error (unsupported/corrupt) → apps/forum/src/components/ui/banner.tsx (nearest library pattern — no dedicated error component exists; report fit)
- §11.1 Button (close/back; optional "Get free download" CTA) → apps/forum/src/components/ui/button.tsx
- MISSING (named undefined in contract §6): viewer toolbar, page controls, signed-session-expiry, rendering-error patterns — none exist in the library

## States required
*(Status-enum + delivery set below. GPT's ~35 transient states — each version status as a viewer state, each signed-URL sub-step, each network interruption — folded, since the authoritative sets are `resources.status` / `resourceVersions.status` + the delivery-security invariants.)*

**A. View state (core invariant):** viewing records a rawEvents view event and **never creates an acquisition, never burns quota** (INV-6 / DEC-S15). Enumerated separately from any acquire path because they are physically separate (acquire lives on `/resources`).
**B. Actor branches (Group B E-viewer, 2026-08-25 — branch STRUCTURE defined; teaser CONTENT remains DEC-M10-VIEW-AUTH CONSTRAINED to FE+SEO, not invented here):** **member → full view** (complete forged PDF, no interstitial) · **anonymous → teaser branch** (gated by `resources.view.enabled` + SEO policy; renders the platform-controlled preview defined by DEC-M10-VIEW-AUTH — page-count/first-page/watermark specifics are that decision's to make, flagged, not guessed) · download stays member-gated on both branches (INV-6 unchanged: view never acquires, never burns quota, on either branch).
**C. Delivery states:** signed **short-TTL** access to the forged PDF only; sandboxed iframe + CSP; patched pdf.js; **no app cookies on delivery origin**. TTL length unnamed (download's is 60s; view's is not — Open Question).
**D. Format state:** `format=pdf` only (launch consumer; docx intake-only upstream).
**E. Flag-off state:** `resources.view.enabled=false` → gated; route-unreachable vs disabled-render unspecified (Open Question — not covered by E3).
**F. Mid-session removal:** resource → removed/under_legal_review while viewing — human-facing state unstated (M17's 404/410 contract is crawler-side, CAP-467) (Open Question).

## Component library maturity note
- ⚠️ pdf-viewer has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button.
---
