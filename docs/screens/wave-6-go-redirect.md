---
# BUY Interstitial / Redirect

**Route:** `/go/[linkId]`
**Status:** NOT STARTED
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-go-redirect-FINAL.md
**Slice(s):** P6-17

## Layout
Derived from contract §6 (Components Used: "minimal chrome; no store chrome on this route") + inventory Template archetype "Interstitial (context-aware)". One route, three top-level states:

```
┌────────────────────────────────────────────────────────────────────────┐
│ /go/[linkId] — minimal chrome · NO store chrome · internal id only     │
│ (never a raw affiliate URL; affiliate id never exposed)                │
├────────────────────────────────────────────────────────────────────────┤
│ ROUTE-LEVEL GATE (server-side, BOTH branches, independent of CAP-247): │
│  validationState = approved_locked ?                                    │
│   ├─ no storefrontLinks row → DEAD-LINK render (§11.8 Error class;     │
│   │   no destination anywhere)                                          │
│   ├─ ≠ approved_locked (pending/under_review/rejected) → GATE-FAIL     │
│   │   "Purchase link temporarily unavailable" notice — never the       │
│   │   locked destination                                               │
│   └─ approved_locked → branch by context:                              │
│        IN-APP (valid session/Referer — CAP-248):                       │
│          interstitial → SubID append (subIdRegistry) → 302 to locked   │
│          destination (hot path never refetches destination, INV-4)     │
│        OFF-PLATFORM (no internal Referer — CAP-249):                   │
│          FULL-PAGE INTERSTITIAL (A6) — NO auto-redirect ·              │
│          merchant domain (from approved fingerprint) · disclosure      │
│          block · [ explicit-continue Button (§11.1) ]                  │
│          (copy = founder/legal-owned, go OQ3 — placeholder, not        │
│          invented)                                                     │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- A6 full-page interstitial → apps/forum/src/components/ui/interstitial.tsx (library component exists; contract/inventory §3 flag the context-aware no-auto-redirect disclosure interstitial as a distinct archetype — modal ≠ this; P6-17 builds the A6 shell in-slice, verify interstitial.tsx fits)
- §11.1 Button (explicit-continue for off-platform) → apps/forum/src/components/ui/button.tsx
- Merchant-domain display (from approved fingerprint) — no library component; plain display element
- Disclosure block — no dedicated library component; nearest pattern apps/forum/src/components/ui/banner.tsx (contract names no component; copy is founder/legal-owned, go OQ3 — placeholder only, not invented)
- §11.8 Error (dead link) → apps/forum/src/components/ui/banner.tsx (nearest library pattern — no dedicated error component; report fit)
- Spinner — MISSING: no spinner component exists in the library (skeleton.tsx is the only loading pattern present; report, don't silently patch)

## States required
*(Enum-backed set. GPT's ~90 transient states — each integrity sub-check, each SubID sub-branch — folded, since `validationState` (4), `storefrontClicks.qualification {raw·qualified·excluded}`, and the in-app/off-platform branch split are authoritative.)*

**A. In-app hit (valid session/Referer) — CAP-248:** verify **`validationState=approved_locked`** → **interstitial → append SubID → 302** to locked destination. **Hot path never refetches destination; merchant domain from fingerprint** (INV-4).
**B. Off-platform hit (no internal Referer) — CAP-249:** verify **`validationState=approved_locked`** (route-level, Finding 5 — this branch never had a CAP-247 entry-verify) → **interstitial with NO auto-redirect** — anti trusted-link-shortener/domain-hijack (GLM fatal fix F3, settled). Gate-fail renders the dead-link/unavailable state — **never the locked destination**. **Interstitial content (Group B, 2026-08-25): FLAGGED as founder/legal-owned content — disclosure-copy, merchant-identification wording, and manual-continue affordance are legal-adjacent and NOT invented here (same pattern as Wave 1's legal-pages content flags). Structure is fixed (state B); copy is not.**
**C. Link-not-resolvable states (three DISTINCT cases — Wave 6 cleanup Group B, 2026-08-25):**
1. **Dead-link:** `[linkId]` resolves to **no `storefrontLinks` row at all** — unknown/typo'd/deleted id. Render: dead-link state (§11.8 Error class); no destination anywhere.
2. **Gate-fail:** row found, but **`validationState ≠ approved_locked`** (`pending` / `under_review` / `rejected`) — a real link, failed or lost approval. Render: unavailable notice ("Purchase link temporarily unavailable" copy family, M11 §15); BUY was disabled upstream (product/store render degrade) per AC-2; storefront stays visible.
3. **Redirect proceeds:** row found AND `approved_locked` → branch A or B by context. **These three are distinct states, not variants of one error** — dead-link vs gate-fail have different causes, different renders, and different data writes.
**D. Amazon-destination (CAP-524, settled):** **standard /go flow — identical to all networks; traffic tracked normally.** Divergence is downstream only: no network-verified conversion Signal (CAP-261 excludes); interim tier via CAP-525. **The redirect layer must NOT treat Amazon clicks differently in UI or the click data written** — same `storefrontClicks` row shape; tier separation happens at settlement, never at /go.
**E. Click qualification (written at click, settled by cron off-screen):** raw → qualified/excluded (CAP-250 `click.settle` applies the M12 qualified-CTA gate: eligible human, once/user/target/window, dwell, not self, not datacenter; CTA-to-engagement ceiling; **total credit ≤ the outcome's versioned value; wishlist = ZERO Signal; self/associated excluded**).

## Component library maturity note
- ⚠️ interstitial has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button.
---
