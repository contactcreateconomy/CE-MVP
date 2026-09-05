# CONTRACT-7-notifications-FINAL

**Screen:** Notifications — `/notifications`
**Wave:** 7A (M14 Onboarding & Retention — notification center)
**Template archetype:** Notification list
**Primary CAP-IDs:** CAP-378, CAP-379, CAP-382, CAP-386, **CAP-568**
**Actor:** member
**Register basis:** 568-row register (post Wave 7 final fix — CAP-568 added); rows verified from source.
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~40 transient states folded). See RECONCILIATION-7A §1.

---

## 1. Route & Access
- **Path:** `/notifications`, no params. **Actor:** member. No anonymous access; notifications are recipient-private (a member must never read/mutate another member's records). Profiles/feed noindex family (CAP-486).
- **Source-of-truth nuance:** CAP-378/379/382 are **System-side writers** whose output renders here; **CAP-386 is the mark-read mutation and CAP-568 is the list-read query** — together they are the two member-facing capabilities on this surface. CAP-379 is **in-app only** (explicitly "no per-timezone midnight cron").

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `notifications` | read (CAP-568 list) + write (378/379/382 emit, 386 mark-read) | field-level schema is the M14 "deepened…" placeholder — **unspecified** (Open Question). Known: `readAt` (CAP-386); kind discriminators quota_exhausted / quota_restored / reply / saved / distribution-join / drip_batch / mod-transactional |
| `users` | write (System, CAP-378/379) | `lastQuotaExhaustedPeriodKey` (set on block; cleared on restored-emit) |
| `resourceQuotaLedgers` | read (CAP-378) | blocked-attempt context |
| `rawEvents` | write | CAP-378 (blocked attempt), CAP-379 (emit-once), CAP-386 (mark-read). **CAP-382 names no rawEvents** — dedupe/batch is invisible to the event stream (Open Question) |

- **Teardown:** read state via CAP-386. **No delete-notification / clear-all capability defined** — notifications are historical records; unbounded accumulation with no clear path (Open Question).

## 3. States
*(Enum-backed set. GPT's ~40 transient states — each batch-window, each mark-read sub-step — folded, since the notification-kind set + read/unread + mute are authoritative.)*

**A. Notification kinds (each a render state):** quota_exhausted (CAP-378; **no "almost gone" nag** — copy constraint) · quota_restored (CAP-379; lazy on session, once per period, marker cleared) · reply (batched 15m, CAP-382) · saved (batched 24h) · distribution-join (batched 6h) · drip_batch (one per batch) · mod transactional (bible P0). **No Might-shame copy** (DEC-P13 — governs every kind).
**B. Read state:** unread → read (`readAt` via `notifications.markRead`).
**C. Mute state:** muted suppresses **social kinds only — never legal/mod** (CAP-382). No CAP owns a mute-toggle UI (Open Question).
**D. Reply-flood branch:** flood detected → **M13 R-BRIGADE hook** via CAP-383 (off-screen; never drops a real reply).
**E. Empty state:** governed by CAP-371 honest-empty rules.
**F. List-load states (CAP-568):** **loading** (§11.9 skeleton) → **populated** (cards ordered newest-first, kind-labeled per A, unread-first emphasis via §11.5 Pill) → **empty** ("No notifications yet" per E's honest-empty rules — never fabricated placeholders) → **error** (§11.8; retry affordance). Recipient-private: the query returns only the authenticated member's own rows; pagination/ordering/page-size spec remains OQ#6 (contract detail, not a register gap).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Load notification list | member | **CAP-568 `notifications.list` (NEW — list-read gap closed)** | none (read) | none |
| Mark notification(s) read | member | CAP-386 `notifications.markRead` (R-NOTIFY) | notifications (readAt), rawEvents | none |
| (System) Blocked-acquire notification | System | CAP-378 (R-QUOTA; unnamed) | notifications, users.lastQuotaExhaustedPeriodKey, rawEvents | CAP-377 (quota exhausted) |
| (System) Quota-restored emit | System | CAP-379 (R-QUOTA-RESTORED; unnamed) | notifications, users.lastQuotaExhaustedPeriodKey, rawEvents | marker set ∧ ≠ current periodKey ∧ no unread quota_restored |
| (System) Dedupe/batch | System | CAP-382 (R-NOTIFY; unnamed) | notifications | batching windows per kind |

- ~~**List/paginate notifications** — **no CAP defines the read/list query** that populates this screen (analogous to `posts.listByType` CAP-091) → Open Question.~~ **CLOSED 2026-08-26 — CAP-568 `notifications.list`.** **Delete notification** — no capability. **Mute-set** — no capability.

## 5. Analytics Events
rawEvents on CAP-378/379/386 (same-mutation capture, CAP-436). CAP-382 dedupe/batch writes no rawEvents (Open Question). No eventType literals named — catalog-owned. Batching must not inflate one recipient-facing batch into multiple displayed-delivery events.

## 6. Components Used
- **§11.3 Notification Card** (the card type STYLE-KIT names for this) · §11.5 Pill (kind/read state; unread count) · §11.1 Button (mark-read) · §11.9 Skeleton · §11.8 Error / §11.7 Toast · §12.1 app-shell chrome (member-authed surface).
- **Archetype gap:** §11 has a Notification Card but no cross-type batching, quota-restoration, legal/mod mute-immunity, or stale-target pattern.

## 7. Open Questions
1. ~~**No notification-list/read query CAP** — the screen's primary render has no governing read capability (only mutation + emit rows). (Opus.)~~ **→ CLOSED 2026-08-26: CAP-568 `notifications.list` added (founder decision, closing the gap confirmed real in 7D's E-seo-admin-read generalization check). See Actions + States F.**
2. **`notifications` field-level schema** — bible placeholder only. (GLM + GPT.)
3. **No mute-toggle CAP** (referenced by CAP-382, unowned) + no mute-management surface. (All three.)
4. **No teardown/clear/bulk-read CAP** — notifications cannot be deleted or cleared. (GLM + GPT.)
5. **No rawEvents on CAP-382 dedupe.** (GLM.)
6. **Pagination / ordering / page size** — unspecified. (GLM + GPT.)
7. **Mark-one vs mark-all-read** — CAP-386 scope unclear. (GPT.)
8. **Inaccessible/removed notification targets** — handling unspecified. (GPT.)
