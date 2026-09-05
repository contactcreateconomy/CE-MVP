# CONTRACT-7-admin-analytics-FINAL

**Screen:** Analytics Dashboard (Founder) — `/admin/analytics`
**Wave:** 7D (M16 Analytics & Instrumentation)
**Template archetype:** Founder analytics dashboard (7 cards)
**Primary CAP-IDs:** CAP-463, CAP-445, CAP-446, CAP-447, CAP-448, CAP-449, CAP-451, CAP-452, CAP-458, CAP-459
**Actors:** Founder, administrator (weekly-decision record is Founder-only)
**Register basis:** 567-row register (post Wave 7D fixes); rows verified from source.
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (resolved on register evidence — GPT's ~110 per-value states folded). See RECONCILIATION-7D §1.

---

## 1. Route & Access
- **Path:** `/admin/analytics`, no params. **Actors:** Founder, administrator. Shell entry CAP-390 → route CAP-392 → widget keys → per-CAP narrow gates. Admin URLs noindex (CAP-486).
- **CAP-463 Actor = Founder/Admin** (dashboard open, gated CAP-390). **CAP-452 Actor = Founder ONLY (verified)** — the weekly-decision record is an **intra-screen narrow gate** (7B-E2/E6 pattern: administrator can view, cannot record). CAP-445/446/447/448 are **cron** producers; CAP-449/451/458/459 are System renders.
- **Governing constraint:** **P0 decisions must not use PostHog counts** (CAP-463) — authority: domain table > rawEvents > M16 projections > PostHog. The dash is Convex-rawEvents-authoritative.
- **Fold-ins (M16 Has-UI rows whose Notes name Founder-dash UI, absent from the inventory CAP list):** CAP-439 ("recalculating"), CAP-440 ("L08/S18 cards depend"), CAP-443 ("reconcile status visible"), CAP-455 (instrumentation health "UI: alert"), CAP-461 ("inline catalog annotation on every Activation card"). Render inside this host; flagged for inventory sync.
- **Must not expose:** sealed Signal weights, hidden legitimacy factors, raw user journeys, or seller/buyer identities.

## 2. Entities

| Entity | Direction | Detail (CAP) |
|---|---|---|
| `analyticsProjections` | read (all renders; written off-screen by crons 445–448) | projectionKey · windowStart/End · dimensions{} · metrics{} · **sampleStatus** · definitionVersion · computedAt · **freshness {complete·partial·stale·recalculating}** · lastCalculatedAt |
| `eventCatalog` | read (452, 463) | eventName · schemaVersion · piiClass (mandatory) · l08Stage? · commerceFunnel? · signalEligible · s18Eligible · excludeStaff · posthogMirror · status |
| `analyticsWeeklyDecisions` | read (463) + write (452) | periodStart/End · decision · evidence · **metricSnapshots** · **projectionDefinitionVersion** · **catalogVersion** · ownerUserId · nextAction · reviewDate |
| `signalLedger` | read (451 only) | R-SIGNAL-CARD firewall: totals/trends/broad category only |
| `rawEvents` · `analyticsEligibilityAdjustments` · `resources` · `users`(isStaff) | read (crons 445–448, off-screen) | projection inputs |

## 3. States
*(Enum-backed set. GPT's ~110 transient states — each L08 window complete/incomplete, each funnel available/unavailable, each denominator boundary — folded, since the `freshness` (4), `sampleStatus`, and card enums are authoritative. Resolved on register evidence, not vote — RECONCILIATION-7D §1.)*

**A. Card freshness (CAP-458, INV-M16-13):** complete · partial · stale · **recalculating** — "recalculating shown on Founder dash"; never a fake-stable render.
**B. L08 cohort incomplete (CAP-459, INV-M16-11):** labeled **"cohort incomplete"** — not zero-catastrophe / fake zero cliff.
**C. Sample confidence (CAP-449, R-CONFIDENCE):** rate **always `n% (x/y)`**; denom **< 25 → sampleStatus=directional**; **trend arrows + drop alerts suppressed**.
**D. L08 windows (CAP-445):** core 7 ordered stages; affiliate optional/branch; windows verbatim — impression→signup **7d** · signup→first_action **7d** · signup→acquire **14d** · acquire→day7 **30d**.
**E. S18 (CAP-446):** staff-excluded projection (`users.isStaff` / CAP-434).
**F. Activation (CAP-447 + fold-in CAP-461):** inlines published **catalog size, median age, adds-in-period, category coverage**; `catalogSizeAtTime` + `resourceAgeDays` stamped at write (CAP-462 — cannot backfill).
**G. Commerce (CAP-448):** Library / Affiliate / Store — **three funnels never merge**; every conversion labeled `conversionType`. Amazon click = Affiliate traffic; Amazon interim self-report stays unverified, never rendered as network-verified.
**H. Signal card (CAP-451):** totals/trends/broad-category **only — never event-weight-resolvable breakdown**; Recognition/Awards excluded from Signal derivation.
**I. Weekly decision recorded (CAP-452, Founder only):** ≤3 highlighted actions; persists metricSnapshots + projectionDefinitionVersion + catalogVersion; historical decision stays bound to captured versions.
**J. Version visibility (CAP-463):** **lastCalculatedAt + definitionVersion + freshness visible** on cards.

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Open dashboard | Founder/Admin | CAP-463 `analytics.founderDashboard` (query) | none | CAP-390 |
| Record weekly decision | **Founder only** | CAP-452 `analytics.weeklyDecision.record` | analyticsWeeklyDecisions | CAP-463 |

- All card data is cron-produced (445–448); every other row is read-only render. No dashboard action mutates underlying events or domain records.

## 5. Analytics Events
**None.** No primary row writes rawEvents; the dashboard **consumes** the stream (crons write `analyticsProjections` from rawEvents), it does not emit. Staff excluded from product counters (CAP-434). No auditLog — CAP-452 is self-recording (ownerUserId + versioned snapshots are the evidence trail). ⚠️ PostHog-trust controls (CAP-460 mirror-disable "hide dash"; CAP-443 "PostHog viz untrusted" when diff > max(5,2%)) govern what this dash shows but aren't on the screen row (Open Question).

## 6. Components Used
- Stats cards (§11.3) · **A2 Charts/data-viz — ARCHETYPE GAP** (inventory §3 names this screen's L08 funnel/S18/commerce as the data-viz gap; only Stats Card + Progress Fill exist) · §11.9 skeletons · freshness + sampleStatus-directional display tokens (no §11 pattern — soft flag) · §11.5 Badge (freshness/directional) · §12.4 admin layout via shell.

## 7. Open Questions
*(Escalated items in RECONCILIATION-7D. These are unspecified detail.)*
1. **PostHog-trust controls (CAP-460/443) govern this dash but aren't on its CAP list** — mirror-disabled + PostHog-untrusted states register-backed but unwired to the screen. (Opus + GLM.)
2. **"7 cards" (CAP-463) not enumerated** — arithmetic fit: L08 + S18 + Activation + 3 commerce funnels + Signal = 7 (inference, flagged). (All three.)
3. **CAP-452 Founder-only vs administrator screen access** — confirm intended narrow gate. (GLM.)
4. **Five fold-in rows (439/440/443/455/461)** absent from inventory CAP list; **CAP-455's `instrumentationIncidents` "UI: alert" surface is unowned** (here vs /admin/home). (GLM.)
5. **Freshness/sampleStatus tokens undefined** in STYLE-KIT. (GLM.)
6. **CAP-449 "suppress drop alerts"** — no M16 metric-drop-alert CAP exists to suppress; mechanism unnamed. (GLM.)
7. **Weekly-decision editing/supersession/deletion + commerce-funnel stage definitions + Signal broad-category allowlist** — unspecified. (GPT.)
