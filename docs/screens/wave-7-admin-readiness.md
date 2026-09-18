---
# Launch Readiness

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** the CAP-435 `checklist` query previously accepted any administrator; the contract explicitly distinguishes "Query checklist | **Founder**" from "Evaluate | Founder/**Admin**" (its own reconciliation notes flag this exact nuance) — narrowed `checklist` to the derived Founder specifically.


**Route:** `/admin/readiness`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-readiness-FINAL.md
**Slice(s):** P7A-01 (widget-catalog row) · P7A-10 (readiness.evaluate + CAP-510 helper + platformHealth schema — backend rows this screen renders) · P7A-11 (checklist UI + Founder query)

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome) ────────────────────────────┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ admin nav       │ ┌─ checklist ─────────────────────────────┐  │
│                 │ │ [Button: evaluate / re-evaluate]        │  │
│                 │ │ checklist-version indicator             │  │
│                 │ │ 7 category pills: identity · safety/    │  │
│                 │ │ legal · data integrity · runtime        │  │
│                 │ │ recovery · consent · supply ·           │  │
│                 │ │ ops ownership  (pass/fail/unavailable)  │  │
│                 │ │ progress fill                           │  │
│                 │ │ blockers / warnings lists               │  │
│                 │ │ blocking-item deep links (registered    │  │
│                 │ │ routeKeys only — CAP-427)               │  │
│                 │ └─────────────────────────────────────────┘  │
│                 │ NO "force open" control here (CAP-510 is   │
│                 │ the server-side gate; setter is /admin/    │
│                 │ config)                                      │
│                 │ load state: Skeleton                         │
└─────────────────┴───────────────────────────────────────────────┘
```

## Components required

- Checklist cards → apps/forum/src/components/ui/card.tsx
- §11.5 pills (7 categories, pass/fail/unavailable) → apps/forum/src/components/ui/badge.tsx
- progress fill → MISSING: progress-fill component does not exist in the library (navigation-progress-bar.tsx is a scroll indicator, not a progress fill)
- blocking-item deep links / checklist-version indicator → deep links via button/link primitives (apps/forum/src/components/ui/button.tsx); version indicator → badge.tsx (nearest)
- §11.1 Button (evaluate/re-evaluate) → apps/forum/src/components/ui/button.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx

## States required

*(Enum-backed set. GPT's ~55 transient states — each category × pass/fail/unavailable — folded, since the 7-category enum + GATE-predicate + signup.mode enum are authoritative.)*

**A. Checklist query (CAP-435, Founder):** version recorded per query (R-OPS).
**B. Evaluate (CAP-509 `readiness.evaluate`, Founder/Admin):** **ALL GATE predicates must be true; unavailable probe = FAIL**; categories verbatim: **identity · safety/legal · data integrity · runtime recovery · consent · supply · ops ownership** (R-READINESS).
**C. open-block (CAP-510, System, gated CAP-509):** **server blocks signup.mode=open if any GATE false** — chains to FATAL-M1A-02 (`effectiveSignupMode = readiness ? signup.mode : closed`). **E5 CLOSED 2026-08-26:** this gate now also runs **synchronously inside CAP-395/480's setter** on /admin/config (fail-closed reject at set time — not a warning); the admission-time check here remains the second, independent belt. Setter and gate can no longer disagree — one transaction both directions (config→readiness: setter calls gate; readiness→config: a failing category surfaces on the checklist until resolved).
**D. Ops gate input:** opsAssignments green **OR** single-person ack (CAP-414/415).
**E. Auth probe nuance (CAP-023):** preview `founder_bootstrap_completed` does NOT satisfy the production probe.
**F. Failure posture:** open-beta blocked; CAP-480 rollback = emergency waitlist or sitewide noindex (Tier3).
**G. Adjacent:** CAP-431 (recoveryCheckKey) gates STOP resume (config flow); jobDeadLetters **redrive runbook "required before open beta"** (CAP-500) — runbook surface unlinked (likely a wiki article; Open Question).
**H. Category-aggregation dependency:** the 7 categories aggregate predicates owned by other screens/waves (consent → CMP CAP-504 W7A; ops-ownership → CAP-414/415); no CAP defines how `launchReadinessResults` collects each category's live state (Open Question).

## Component library maturity note

⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): card.tsx, button.tsx.
