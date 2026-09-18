---
# Admin Wiki

**Route:** `/admin/wiki`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-wiki-FINAL.md
**Slice(s):** P7A-01 (widget-catalog row) · P7A-09 (get + missing + deploySync — E1 consumed)

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome — Wiki link lives in chrome) ─┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ admin nav       │ ┌─ sanitized-Markdown reader ──────────────┐ │
│ + article       │ │ source-controlled Markdown body          │ │
│   navigation    │ │ (never executable HTML/JS)               │ │
│                 │ │ version/source metadata                  │ │
│                 │ │ (version + updatedAt, deploy-synced only)│ │
│                 │ └──────────────────────────────────────────┘ │
│                 │ missing-article state: explicit "no article │
│                 │ yet" empty state — not a broken panel (AC-19)│
│                 │ load: Skeleton · error: §11.8                │
└─────────────────┴───────────────────────────────────────────────┘
```

## Components required

- Sanitized-Markdown reader — no §11 archetype → MISSING: Markdown reader does not exist in the library (nearest is a static reading column; no new kit name per P7A-09)
- article navigation → nearest: apps/forum/src/components/ui/tabs.tsx (no dedicated article-nav component — flag)
- missing-article empty state → apps/forum/src/components/ui/empty-state.tsx
- version/source metadata → compose from apps/forum/src/components/ui/card.tsx (no dedicated metadata component)
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- error → MISSING: error component (§11.8) does not exist in the library (nearest stand-in: banner.tsx)
- shell search → provided by the shell's A11 command palette (apps/forum/src/components/ui/command-palette.tsx)

## States required

*(Enum-backed set. GPT's ~20 transient states folded — the render/missing/sync branches are authoritative.)*

**A. Article render (CAP-418 `wiki.get`):** source-controlled **sanitized Markdown; never executable HTML/JS**.
**B. Missing article (CAP-420, gated CAP-418):** explicit **"no article yet"**, not a broken panel (AC-19).
**C. Deploy sync (CAP-419 `wiki.deploySync`, System):** repo → table; **Founder cannot inject scripts**; soft-beta ships **P0 widget articles** (linked via `adminWidgets.wikiSlug`).
**D. Versioning:** version + updatedAt per article — **deploy-synced only; no in-app editor CAP exists.**

## Component library maturity note

⚠️ tabs.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ empty-state.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ command-palette.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): card.tsx.
