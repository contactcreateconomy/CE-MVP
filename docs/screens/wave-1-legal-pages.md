# Legal Pages

**Route:** `/privacy` · `/dmca` · `/terms` (one shared Legal Pages template)
**Status:** `/privacy` and `/terms` are LIVE placeholders at `PRD/app/apps/forum/src/app/(app)/(shell)/privacy/page.tsx` and `PRD/app/apps/forum/src/app/(app)/(shell)/terms/page.tsx`; `/dmca` NOT STARTED (no route exists). Note: the live placeholders sit inside the `(app)/(shell)` subtree, whereas the contract requires a legal layout WITHOUT ConsentProvider (CAP-027, FATAL-M1C-03) — SLICE-P2-06/P2-07 carve legal into its own route group outside that subtree.
**Contract:** PRD/02-contracts/wave-1/CONTRACT-1-legal-pages-FINAL.md
**Slice(s):** SLICE-P2-07 (three legal routes as one template; published-content render path is BLOCKED-pending-F-16)

## Layout

Derived from contract §6 (Components Used) + the inventory's "Static legal (no ConsentProvider)" archetype only:

```
┌─────────────────────────────────────┐
│ Wordmark only (§10.2 — "Legal       │
│   footers, very small spaces")      │
│ ┌─────────────────────────────────┐ │
│ │ Static legal content            │ │
│ │  Reading column 720px max (§4.3)│ │
│ │  §3.2 type scale under §3.3     │ │
│ │  rules (sequential heading      │ │
│ │  hierarchy; body line-length    │ │
│ │  ≤720px)                        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Wordmark placement (header vs footer), legal-page navigation, and the legal footer pattern are all **undefined** (contract Open Question 6); only the reading-column width and wordmark-only logo rule are specified. Shell inheritance (full app chrome vs standalone, beyond outside-ConsentProvider) is unspecified (contract Open Question 7).

## Components required

- Reading column (720px max, §4.3) — no dedicated component; page-level layout constraint. `PRD/app/apps/forum/src/components/ui/card.tsx` is available as the production-proven generic container if a card wrapper is wanted, but the contract does not name one.
- Wordmark (§10.2) → MISSING: Wordmark does not exist in the library — only `createconomy-logo-mark.tsx` (the Mark) exists; the contract mandates Wordmark only ("Legal footers, very small spaces"), a distinct §10.2 lockup.
- `unavailable_pending_legal` placeholder state → `PRD/app/apps/forum/src/components/ui/empty-state.tsx` (closest library component; contract flags §11 has no empty-state/placeholder pattern — §11.9 covers loading skeletons only)
  - ⚠️ empty-state has zero production usage — expect possible integration friction, report don't silently patch.
- Button Ghost (§11.1), available for any backed navigation action (CAP-027 specifies none) → `PRD/app/apps/forum/src/components/ui/button.tsx`
- MISSING: static legal-document / long-form prose component does not exist in the library (contract archetype gap — §11 provides buttons, inputs, cards, nav, badges, avatar, overlays, skeletons only)
- MISSING: legal-page navigation pattern and legal footer do not exist in the library (contract archetype gap)

## States required

(Copied verbatim from CONTRACT-1-legal-pages-FINAL.md §3)

1. **Published static content** — post-M18-publish render (per route: `/privacy`, `/dmca`; `/terms` via the shared template, its CAP-027 trigger coverage not explicit).
2. **`unavailable_pending_legal` + noindex** — pre-publish placeholder, served with noindex until M18 publish (CAP-027).
3. **Static fallback (P1)** — CAP-027 mandates a static fallback so the page can't hard-fail; the trigger, content source, and precedence vs. `unavailable_pending_legal` are **undefined** (Open Questions).
4. **CMP-crashed / degrade** — the legal page remains available while application analytics is denied (CAP-028).

*Not per-route missing-content behavior beyond `unavailable_pending_legal`; no async loading state (content is static).*

## Component library maturity note

- ⚠️ empty-state has zero production usage — expect possible integration friction, report don't silently patch.
- button, card are production-proven — no warning.
- createconomy-logo-mark.tsx is outside both lists — no warning supplied by the live-status map (but note the Wordmark gap above).
