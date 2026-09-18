---
# Notifications

**Route:** `/notifications`
**Status:** LIVE (PRD/app/apps/forum/src/app/(app)/(shell)/notifications/page.tsx — route matches spec; `notifications-page-client.tsx` + `loading.tsx` also present)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-notifications-FINAL.md
**Slice(s):** P7T-01 (list + mark-read). Adjacent off-screen writers: P7T-02 (quota notification emitters), P7T-03 (dedupe/batch CAP-382 + brigade hook CAP-383) — backend slices, no screen files.

## Layout

```
┌─ §12.1 app-shell chrome (member-authed surface) ─────────────┐
│ top header / member nav                                       │
│ ┌─ notification list (main column) ────────────────────────┐ │
│ │ [Pill: unread count]            [Button: mark read]      │ │
│ │ ┌─ Notification Card ─────────────────────────────────┐  │ │
│ │ │  kind Pill (quota_exhausted / reply / saved / …)    │  │ │
│ │ │  unread-first emphasis · read/unread state          │  │ │
│ │ └─────────────────────────────────────────────────────┘  │ │
│ │ ┌─ Notification Card … (cards ordered newest-first) ──┐  │ │
│ │ └─────────────────────────────────────────────────────┘  │ │
│ │ list-load states: Skeleton → populated | empty | error   │ │
│ └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

## Components required

- §11.3 Notification Card → apps/forum/src/components/ui/card.tsx (generic card; no dedicated notification-card variant in the library)
- §11.5 Pill (kind / read state; unread count) → apps/forum/src/components/ui/badge.tsx
- §11.1 Button (mark-read) → apps/forum/src/components/ui/button.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- §11.8 Error (with retry affordance) → MISSING: error component (§11.8) does not exist in the library (nearest stand-in: banner.tsx)
- §11.7 Toast → apps/forum/src/components/ui/toast.tsx
- §12.1 app-shell chrome → provided by the existing (app)/(shell) layout (live)

Contract archetype-gap note: §11 has a Notification Card but no cross-type batching, quota-restoration, legal/mod mute-immunity, or stale-target pattern.

## States required

*(Enum-backed set. GPT's ~40 transient states — each batch-window, each mark-read sub-step — folded, since the notification-kind set + read/unread + mute are authoritative.)*

**A. Notification kinds (each a render state):** quota_exhausted (CAP-378; **no "almost gone" nag** — copy constraint) · quota_restored (CAP-379; lazy on session, once per period, marker cleared) · reply (batched 15m, CAP-382) · saved (batched 24h) · distribution-join (batched 6h) · drip_batch (one per batch) · mod transactional (bible P0). **No Might-shame copy** (DEC-P13 — governs every kind).
**B. Read state:** unread → read (`readAt` via `notifications.markRead`).
**C. Mute state:** muted suppresses **social kinds only — never legal/mod** (CAP-382). No CAP owns a mute-toggle UI (Open Question).
**D. Reply-flood branch:** flood detected → **M13 R-BRIGADE hook** via CAP-383 (off-screen; never drops a real reply).
**E. Empty state:** governed by CAP-371 honest-empty rules.
**F. List-load states (CAP-568):** **loading** (§11.9 skeleton) → **populated** (cards ordered newest-first, kind-labeled per A, unread-first emphasis via §11.5 Pill) → **empty** ("No notifications yet" per E's honest-empty rules — never fabricated placeholders) → **error** (§11.8; retry affordance). Recipient-private: the query returns only the authenticated member's own rows; pagination/ordering/page-size spec remains OQ#6 (contract detail, not a register gap).

## Component library maturity note

⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): button.tsx, card.tsx, toast.tsx.
