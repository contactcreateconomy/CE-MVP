# CONTRACT-6-curation-FINAL

**Screen:** Hero & Featured Management — `/admin/curation`
**Wave:** 6A (M9 Feed & Discovery — admin scheduler)
**Template archetype:** Admin scheduler
**Primary CAP-IDs:** CAP-191, CAP-192, CAP-554
**Actors:** Editor, Publisher, store_operator; **administrator** (CAP-554 emergency-pull)
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed (hero.status six) adopted; GPT's ~80 per-override/per-field transient states folded. Standing-rule hide/mute reverse lives on `/feed` (CAP-553); Featured emergency-pull is **CAP-554** (this screen). See RECONCILIATION-6A §2.

---

## 1. Route & Access
- **Path:** `/admin/curation`. **Dynamic params:** none. **Actors:** Editor, Publisher, store_operator (CAP-191/192 list the identical actor set — no per-action split; store_operator access is register-backed, not a gap). **CAP-554** Actor = administrator (emergency-pull). No anonymous/member access.
- **Auth sequencing:** minimal basic role-check gate now; full M15 `/admin` shell (CAP-390 + CAP-392) wraps at Wave 7 (known Wave-3 E5 pattern). CAP-019 (`admin.write` 60/1m per operator; staff NOT rate-exempt) applies.
- **Shared-CAP division (mirrored in the `/feed` contract):** this screen is the **WRITE surface** — CAP-192 hero upsert/schedule + CAP-191 Featured booking + **CAP-554 Featured emergency-pull**. `/feed` renders the output (heroSlots/heroAssignments/vibingFeatured); CAP-193's stale auto-fill is System-side.
- **Curation is display-only:** Featured does not mutate `vibingTrends.trendScore`; Hero/Featured must not write organic ranking or exploration values. **CAP-423 (M15, INV-M15-4)** enforces Hero/Featured ≠ organic/exploration scores. CAP-554 pull likewise must not mutate `trendScore`.
- **Gates (pre-write):** CAP-191 — M13 **moderation passed** for the candidate post; CAP-192 — M13 **safety-removal** (safety-removed posts must not occupy slots). CAP-554 **Gated by: none**.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `heroSlots` | read + write | slotOrder (0–9), postId, headlineOverride?, textOverride?, mediaAssetId?, ctaLabel?, startAt, endAt, desktopEnabled, mobileEnabled, status (hero.status enum), disclosureClass, fallbackPostId?, approvedByUserId, createdAt |
| `heroAssignments` | read + write (append history) | slotOrder, postId, activatedAt, deactivatedAt, reason, actorUserId |
| `vibingFeatured` | read + write | postId, label, startAt, endAt, status (includes **`pulled`** via CAP-554 emergency removal; remaining literals still unspecified — Open Question), reason, approvedByUserId, createdAt |
| `posts` | read | candidate selection + moderation state (M13 gate) |
| `systemConfig` | read | cadence/config |
| `auditLog` | write | both booking/upsert actions audited (admin-write pattern); CAP-554 also writes auditLog |

## 3. States
*(Enum-backed lifecycle below. GPT's ~80 states — each override present/absent, each desktop/mobile combination, each mutation pending/success/fail — folded, since the authoritative state set is the `hero.status` enum + the cadence/slot-count invariants.)*

**A. Hero slot lifecycle (`hero.status` enum — six):** `draft` (composed, unscheduled) → `scheduled` (startAt/endAt set, not yet live) → `active` (rendering) → `expired` (window elapsed) · `paused` (reversible hold) · `archived` (retired). All six are admin-reachable states of the same slot.
**B. Slot inventory:** 10 managed (slotOrder 0–9); **4–6 rendered** concurrently; **≥2 rotate per 24h**; per-slot desktopEnabled/mobileEnabled; optional overrides (headline/text/media/CTA); fallbackPostId?; disclosureClass on the row.
**C. Hero staleness:** no fresh active slots >24h → CAP-193 auto-fills from TOP labeled "Community Top" (System; this screen surfaces the staleness that triggers it). Never Recognition-selected.
**D. Featured overlay:** time-bound window (startAt→endAt); labeled "Featured"; **≤1 booking/cycle**; **≤1–2 active concurrently**; empty slot → next algorithmic item (feed-side); **never mutates trendScore**. **Emergency-pull (`status=pulled`, CAP-554)** removes an item before natural expiry without waiting for `endAt`.
**E. Audit-fail:** privileged mutation must fail closed if `auditLog` cannot persist (CAP-426 pattern).
**F. Safety-removal:** an active Featured/Hero target that becomes moderation-ineligible must stop rendering (CAP-191/192 gates).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Book Featured internal-ad slot | Editor, Publisher, store_operator | CAP-191 `vibing.setFeatured` (R-FEATURED) | vibingFeatured (time-bound), auditLog | M13 moderation passed; cadence cap (≤1/cycle, ≤1–2 active) |
| Upsert / schedule hero slot | Editor, Publisher, store_operator | CAP-192 `hero.upsert/schedule` (R-HERO) | heroSlots, heroAssignments, auditLog | M13 safety-removal |
| Emergency-pull Featured item | administrator | CAP-554 `vibing.pullFeatured` | vibingFeatured (status=pulled), auditLog | none |

- **Pause / archive / remove from active rendering (Hero)** — supported by the canonical `hero.status` lifecycle, but **exact mutation names beyond `hero.upsert/schedule` are not identified** (Open Question).
- **Delete Featured/Hero record** — no hard-delete operation defined; time-bound expiry, pause, archive, and **CAP-554 pull** are the visible teardown mechanisms.
- **Load current inventory** — no exact list-query name specified.

## 5. Analytics Events
**None named.** Neither CAP-191/192 nor CAP-554 writes `rawEvents`. Accountability trail = **`auditLog`** on every mutation (admin-write pattern). Curation audit records must remain distinct from public impression/click analytics. The CAP-423 firewall (Hero/Featured ≠ organic/exploration) is a governance gate, not an analytics event.

## 6. Components Used
- Admin-scheduler archetype · §12.4 admin layout (motion §7.4 fade-in only) · **§11.2 Inputs** (date-range pickers, headline/text overrides, CTA label) · toggles (desktopEnabled/mobileEnabled) · post/slot pickers (§11.7 Dropdown) · **§11.1 Button** · **§11.7 Modal** (schedule/pause/emergency-pull confirm) + Toast · **§11.9 Skeleton** · media preview via §11.3 card family.
- **Archetype gaps:** **A1 Data table** (10 hero slots) · **no §11 datetime/scheduler component** (startAt/endAt) · no slot-order manager, hero-preview, rotation-compliance, or Featured-cadence-indicator component.

## 7. Open Questions
*(Escalated items in RECONCILIATION-6A are closed. These remaining items are unspecified detail.)*
1. **`vibingFeatured.status` values not fully enumerated** in the data model (fields exist; **`pulled` is now specified via CAP-554**; remaining literals still unspecified — unlike `hero.status`). (GLM + GPT.)
2. **"Cycle" definition** for the cadence cap — undefined; no config key named. (All three.)
3. **`heroSlots.disclosureClass` values** — field present, enum unspecified in the bible. (GLM.)
4. **Hero pause/archive/cancel mutation names** — the lifecycle has six statuses but only `hero.upsert/schedule` is named; pause/archive mutation names not supplied. Featured emergency-pull is CAP-554 (closed). (GPT + Opus.)
5. **Scheduling timezone** — not specified. (GPT.)
6. **Featured time-window overlap/conflict handling** — unspecified. (GPT.)
7. **Priority selection when >6 hero slots are active** — render-selection rule unspecified. (GPT.)
8. **Moderation-passed verification point** — booking-time vs render-time check unspecified. (GLM + GPT.)
9. **Post-picker candidate scope** — filter (published ∧ moderationStatus∈{not_required,passed}?) inferred from gates but not written on this screen. (GLM.)
10. **Lifecycle→assignment mapping** — which `hero.status` transitions append `heroAssignments` rows (pause? archive?) is unspecified. (GLM.)
