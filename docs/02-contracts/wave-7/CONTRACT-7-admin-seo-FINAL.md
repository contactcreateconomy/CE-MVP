# CONTRACT-7-admin-seo-FINAL

**Screen:** SEO Health — `/admin/seo`
**Wave:** 7D (M17 Growth, SEO & Distribution)
**Template archetype:** Health widget (render-only)
**Primary CAP-IDs:** CAP-483, CAP-484, **CAP-567**
**Actor:** administrator
**Register basis:** 567-row register (post Wave 7D fixes); rows verified from source.
**Reconciliation:** All-agree on render-only health widget. Two escalations (missing fields, no admin-read CAP) — **both CLOSED 2026-08-26**. States: enum-backed set adopted (GLM+Opus; GPT's ~70 folded). See RECONCILIATION-7D §4.

---

## 1. Route & Access
- **Path:** `/admin/seo`, no params. **Actor:** administrator. ~~**No per-CAP human actor exists** (CAP-483 = cron, CAP-484 = System) — screen access rests on the inventory Actor via CAP-390/392 + widget keys; the screen is **render-only**.~~ **E4 CLOSED 2026-08-26 (founder decision): CAP-567 (administrator) is now the governing read row** — Admin views the SEO health dashboard (Reads: seoHealth; Writes: none; Has-UI: YES). Screen is render-only by construction: the read row cannot mutate anything.
- Alert acknowledge/resolve/snooze lives on **/admin/home** (CAP-408/409/410), deep-linked via `deepLinkRouteKey` (source-controlled keys only, CAP-427) — not here.
- This screen **reports** health; it does **not** manually declare a page indexable or override `assertIndexable` (CAP-466 — server-authoritative). Non-indexable content stays excluded from sitemap + receives canonical noindex/HTTP treatment; this dashboard cannot override those protections.

## 2. Entities

| Entity | Direction | Detail (CAP) |
|---|---|---|
| `seoHealth` | read (CAP-567 render; written by CAP-483 cron) | **sitemapUrlCount · lastSitemapBuildAt · coverageErrorCount · thinIndexedCount · heldIndexedCount · lastGscPullAt? · status · lastCalculatedAt** *(field list verified data-model line 287; thin/held added 2026-08-26, E3)* |
| `adminInterventionAlerts` | written by CAP-484 (rendered off-screen on /admin/home) | alertKey · severity {critical·high·medium} · title · whatHappening · whatToDo · deepLinkRouteKey · status {open·acknowledged·resolved·snoozed} |

- ~~⚠️ **FIELD GAP (verified — drift-class):** CAP-484's monitored predicates — "**thin indexed = 0 · held indexed = 0**" — have **no corresponding fields on `seoHealth`** (which carries only `coverageErrorCount`). Either the pull derives them into `status`, or two fields are missing from the data-model → **ESCALATION E3.**~~ **E3 CLOSED 2026-08-26 (founder decision): `thinIndexedCount` + `heldIndexedCount` added to `seoHealth`** (`_data-model.md`) — backing fields for CAP-484's already-specified predicates. No predicate change; CAP-484's Notes confirm the fields now exist.
- ~~⚠️ **No admin-facing `seoHealth` read CAP (verified):** CAP-483 is cron (writes seoHealth), CAP-484 is System (writes an alert). **Neither is the administrator reading the widget** — the render surface has no governing capability → **ESCALATION E4** (same class as the /notifications list-read + /admin/support masked-read gaps).~~ **E4 CLOSED 2026-08-26 (founder decision): CAP-567 added** (Reads: seoHealth; Writes: none; Has-UI: YES; Gated by: shell-entry via CAP-390). **Generalization check (verified from source):** of the two surfaces Opus's report suggested might share the gap, `/notifications` ~~is REAL (CAP-386's trigger says "Member reads notifications" but its Writes column `notifications.readAt` is the mark-read mutation — the list-render has no governing read CAP)~~ **was REAL and is now CLOSED (2026-08-26, post-7D founder decision): CAP-568 `notifications.list` added**; `/admin/support` is NOT REAL (CAP-406 `support.userSummary` is a genuine read row: Reads listed, Writes: none).

## 3. States
*(Enum-backed set. GPT's ~70 transient states — each metric available/unavailable/zero/positive, each indexability-protection sub-state — folded, since the `seoHealth.status` + alert-severity + freshness enums are authoritative.)*

**A. Fresh pull (CAP-483, cron weekly):** GSC pull ("Optional API"); `lastGscPullAt` current; drives M15 health dot.
**B. Stale (CAP-484, System):** → `adminInterventionAlerts` write. Predicates: coverageErrorCount > 0 · **thinIndexedCount > 0** · **heldIndexedCount > 0** (fields exist as of E3).
**C. Never-pulled / GSC not connected** ("Optional API") — render state unspecified (Open Question); absence must **not** be represented as healthy zeroes.
**D. Alert-predicate states:** coverage errors > 0 · thin indexed > 0 · held indexed > 0 (last two now field-backed, E3 CLOSED).
**E. Sitemap render:** `sitemapUrlCount` + `lastSitemapBuildAt` (fed by CAP-473's ISR-3600s sitemap, off-screen); non-indexable/held/draft/private records excluded from sitemap (CAP-466/467).
**F. Unavailable metric** rendered as **"—"**, not zero.

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| View SEO health dashboard | administrator | **CAP-567 `seo.health.view` (NEW — E4; query)** | none | CAP-390 |
| (cron) GSC pull | cron | CAP-483 `seo.gsc.pull` | seoHealth | none |
| (System) Stale → intervention | System | CAP-484 | adminInterventionAlerts | CAP-483 |

**No admin mutation exists on this screen** — render-only by construction (CAP-567 Writes = none). Remediation flows through /admin/home interventions and content surfaces. **Manually set indexability** — no capability (correctly; CAP-466 is server-authoritative). **Regenerate sitemap** — not owned by CAP-483/484.

## 5. Analytics Events
**None.** SEO health writes `seoHealth`/`adminInterventionAlerts`, not rawEvents. No auditLog (cron writes `seoHealth`; the intervention alert is itself the record). Absence of GSC data must not become zero coverage errors / zero indexed pages / healthy status.

## 6. Components Used
- Health widget (Stats card §11.3 + §11.5 pill/badge health dot) · Stat cards (sitemap count / coverage errors / thin-indexed / held-indexed) · A2 data-viz soft flag (count/trend display; no chart primitive) · intervention deep link · §11.9 skeletons · §12.4 layout.

## 7. Open Questions
*(Escalated items in RECONCILIATION-7D. These are unspecified detail.)*
1. ~~**thin/held-indexed predicates with no `seoHealth` fields**~~ **→ CLOSED (E3, 2026-08-26): fields added to `_data-model.md`; CAP-484 Notes confirm.**
2. ~~**No admin-facing `seoHealth` read CAP**~~ **→ CLOSED (E4, 2026-08-26): CAP-567 added; generalization check logged — /notifications REAL (reported, unfixed), /admin/support NOT REAL (CAP-406 already a read row).**
3. **GSC-not-connected / never-pulled state** ownership + copy — unspecified. (GLM + GPT.)
4. **Zero on-screen actions** — confirm remediation is intentionally fully external (interventions + content surfaces). (GLM.)
5. **Weekly cadence + staleness thresholds** config surface — jobCatalog `scheduleKey`/`healthFreshnessSeconds`; §4's Platform/Jobs panel is the candidate home. (GLM + GPT.)
6. **Intervention severity for thin-indexed vs held-indexed** violations — unspecified. (GPT.)
