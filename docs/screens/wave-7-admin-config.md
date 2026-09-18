---
# Config Console (+ STOP + kill-switches)

**Status (2026-09-18 screen audit correction):** LIVE (namespace/CAS editor + legal reason-code editor). **Fixed (this pass):** `kill.flip`, `stop.activate`, `stop.resume`, `signup.mode.set`, and `mirror.disable` previously accepted **any** staff role (only the broad CAP-390 shell gate) — narrowed to `administrator`, matching the contract's "Actors: administrator, Founder" line. **Open, not fixed this pass:** no dedicated STOP/kill-switch/signup-mode UI panel exists (only the generic namespace table editor) — flagged in CHANGELOG.


**Route:** `/admin/config`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-config-FINAL.md
**Slice(s):** P3-07 (typed namespace forms + CAS update — Phase 3) · P3-08 (STOP surface, kill-switches, signup.mode setter, mirror rollback — Phase 3)

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome; operational-mode reflects STOP) ─┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────────┤
│ admin nav       │ ┌─ namespace listing (A1 data table) ──────────┐│
│                 │ │ key · valueType · pills: editTier / sealed / ││
│                 │ │ failDirection   (sealed M12 keys ABSENT)     ││
│                 │ └──────────────────────────────────────────────┘│
│                 │ ┌─ registry-driven typed forms (§11.2) ───────┐ │
│                 │ │ bounds/min/max/enumValues from registry      │ │
│                 │ │ CAS conflict → inline Error (§11.8)          │ │
│                 │ │ Tier-3 → Modal typed-confirm (§11.7)         │ │
│                 │ └──────────────────────────────────────────────┘ │
│                 │ ┌─ emergency controls ────────────────────────┐  │
│                 │ │ kill-switches (failDirection honored)       │  │
│                 │ │ STOP activate / resume (Modal, Tier-3-class)│  │
│                 │ │ signup.mode setter · PostHog mirror flip    │  │
│                 │ └──────────────────────────────────────────────┘  │
│                 │ ┌─ panels (States J): Store · Feature Flags ·   │ │
│                 │ │ Content-Pipeline · Persona-Tuning ·          │ │
│                 │ │ Trust & Signals (non-sealed) ·               │ │
│                 │ │ Trust-&-Safety Timers · Platform/Jobs        │ │
│                 │ │ + operational-incident panel                 │ │
│                 │ └──────────────────────────────────────────────┘  │
└─────────────────┴────────────────────────────────────────────────────┘
```

## Components required

- §11.2 typed inputs (registry-driven bounds/enums) → apps/forum/src/components/ui/input.tsx; enum values → apps/forum/src/components/ui/select.tsx (nearest select primitive)
- A1 data table (namespace listing — contract names the gap) → apps/forum/src/components/ui/data-table/index.tsx
- §11.7 modal (Tier-3 typed confirm; STOP activate/resume) → apps/forum/src/components/ui/dialog.tsx
- §11.8 inline error (CAS conflict, bounds reject) → MISSING: error component (§11.8) does not exist in the library (nearest stand-in: banner.tsx)
- §11.5 pills (editTier/sealed/failDirection) → apps/forum/src/components/ui/badge.tsx
- kill-switch controls → apps/forum/src/components/ui/toggle-switch.tsx (nearest toggle; no dedicated kill-switch component)
- operational-incident panel / Store-configuration panel → MISSING: dedicated panel components do not exist in the library (compose from card.tsx)

Contract archetype gaps: no typed config-registry, CAS-conflict, blast-radius, STOP, recovery-check, or fail-direction component in §11.

## States required

*(Enum-backed set. GPT's ~90 transient states — each valueType, each tier, each failDirection, each STOP sub-step — folded, since the tier/valueType/failDirection enums + CAS + STOP lifecycle are authoritative.)*

**A. Namespace read (CAP-394 `config.getNamespace`):** **sealed keys ABSENT from editor** — `legitimacy.medianTarget` · `signal.eventWeights` · `signal.attributionSplit` · `trust.weightCap`.
**B. CAS update (CAP-395 `config.casUpdate`):** CAS on version (conflict state); **reason required tier2/3; blastRadius mandatory; Tier3 typed confirm; sealed keys not editable.**
**C. Blast-radius pre-gate (CAP-425 / INV-M15-8, register-backed, not on screen row):** computed before tier2/3 effect → Open Question.
**D. Kill-switch (CAP-396 `kill.flip`, gated CAP-395):** **failDirection honored: closed | open_forbidden | degrade | n_a.**
**E. STOP active (CAP-397 `stop.activate`, Founder/Admin, gated CAP-395):** writes stop flag + owned incident + auditLog; **expectedDurationMin REQUIRED; never auto-resumes; handoffDueAt escalates backup/Founder.**
**F. STOP resume (CAP-398 `stop.resume`):** separate mutation; **recoveryCheckKey must pass**; CAP-431 blocks on failure (register-backed, not on screen row).
**G. PostHog mirror rollback (CAP-460):** flip; **rawEvents keep capturing; analytics dash hidden.**
**H. signup.mode (CAP-480 `config.signupMode.set`, Founder/Admin, gated CAP-395):** open|waitlist|closed; Tier2/3; rollback = emergency waitlist or sitewide noindex (Tier3). **E5 CLOSED 2026-08-26 — the gate is now IN the setter (fail-closed):** setting `open` requires the CAP-435/509/510 readiness checklist to pass **synchronously inside CAP-395/480's write path**; readiness incomplete → mutation **rejects** (not a warning). `waitlist`/`closed` remain always settable (closing down must never be blocked). CAP-510's independent admission-time check (FATAL-M1A-02 `effectiveSignupMode`) remains as the second belt. Setter (/admin/config) and gate (CAP-510, /admin/readiness) are one transaction — the cross-screen split is closed.
**I. Audit fail-closed (CAP-426 / INV-M15-6):** privileged write fails if auditLog cannot persist.
**J. Panels (inventory §4 + register Notes, three-source concordance):** **Store panel** = CAP-524 Amazon toggle (default ON) · CAP-525 interim weight (10<w<25, 12–18 default range founder-set; disable-self-report toggle) · **`store.circuitbreaker.complaintCountN` (default 3)** · **`store.circuitbreaker.windowHoursM`** · CAP-240 cadence (candidate). Feature Flags · Content-Pipeline · Persona-Tuning · **Trust & Signals (non-sealed only — §4 firewall guard via CAP-394)** · Trust-&-Safety Timers · Platform/Jobs.

## Component library maturity note

⚠️ input.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ select.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ data-table/index.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ dialog.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): card.tsx (used for composed panels). (toggle-switch.tsx is in neither the zero-production nor production-proven list — no warning attached.)
