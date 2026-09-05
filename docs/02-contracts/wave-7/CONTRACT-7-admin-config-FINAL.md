# CONTRACT-7-admin-config-FINAL

**Screen:** Config Console (+ STOP + kill-switches) — `/admin/config`
**Wave:** 7B (M15 Admin & Ops Console) — **highest-authority surface**
**Template archetype:** Typed config console + emergency controls
**Primary CAP-IDs:** CAP-394, CAP-395, CAP-396, CAP-397, CAP-398, CAP-460, CAP-480
**Actors:** administrator, Founder
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. Store-panel landing confirmed (three-source concordance). States: enum-backed set adopted (GLM+Opus; GPT's ~90 folded). See RECONCILIATION-7B §3.

---

## 1. Route & Access
- **Path:** `/admin/config`, no params. **Actors:** administrator, Founder (Founder-only keys; sealed keys nobody). **Gated by CAP-390.** STOP activate/resume is Founder/Admin (CAP-397/398).
- Typed forms derive from **`configKeyRegistry`** (valueType, min/max, enumValues[], editTier, blastRadius, failDirection, effectiveTiming, reversible, sealed) — the **platform-wide single validation mechanism** (Wave-3 E1).
- **STOP precedence (verbatim, Special-Note scrutiny):** R-CUSTOMER-GUARD (CAP-005/393): **TERMINATED > SUSPENDED > capabilityRestrictions > STOP > feature flags > eligibility**; STOP also wins over scheduled execution (CAP-518). ⚠️ **CAP-397 (`stop.activate`) is Gated-by CAP-395** — the highest-authority emergency action routes through the same CAS-versioned config mutation as ordinary edits → Open Question (confirm deliberate).

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `systemConfig` | read + write | key, value, valueType, scope, status, version?, updatedByUserId, updatedAt, reason? — **sealed M12 gaming keys NOT stored here** |
| `configKeyRegistry` | read + (seed-only) | authoritative bounds owner; also holds M3 thresholds + M11 `store.circuitbreaker.*` |
| `operationalIncidents` | write (CAP-397/398) | type=stop; state active→recovering→closed; expectedDurationMin, handoffDueAt, recoveryCheckKey |
| `launchReadinessResults` | read (CAP-510 interplay) | blocks signup.mode=open |
| `auditLog` | write | all mutations (fail-closed, CAP-426) |

## 3. States
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

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Read namespace | administrator | CAP-394 `config.getNamespace` | none | CAP-390 |
| CAS update | administrator/Founder | CAP-395 `config.casUpdate` | systemConfig, auditLog | CAP-394; CAP-425 blast-radius; CAP-426 audit |
| Kill-switch flip | administrator | CAP-396 `kill.flip` | systemConfig, auditLog | CAP-395 |
| STOP activate | Founder/Admin | CAP-397 `stop.activate` | systemConfig (stop flag), operationalIncidents, auditLog | CAP-395 |
| STOP resume | Founder/Admin | CAP-398 `stop.resume` | operationalIncidents, systemConfig, auditLog | CAP-397; CAP-431 recoveryCheckKey |
| Disable PostHog mirror | administrator | CAP-460 (unnamed) | systemConfig, auditLog | none |
| Set signup.mode | Founder/Admin | CAP-480 `config.signupMode.set` | systemConfig, auditLog | CAP-395; **CAP-510 readiness gate IN the setter (E5) — open rejected (fail-closed) while any GATE false; waitlist/closed always settable** |

- **Sealed keys have no editor mutation.**

## 5. Analytics Events
**None** — internal; `auditLog` is the accountability record for every config/kill-switch/STOP/resume/mirror/signup-mode mutation. Disabling PostHog does not disable canonical rawEvents.

## 6. Components Used
- §11.2 typed inputs (registry-driven bounds/enums) · A1 data table (namespace listing — gap) · §11.7 modal (Tier-3 typed confirm; STOP activate/resume) · §11.8 inline error (CAS conflict, bounds reject) · §11.5 pills (editTier/sealed/failDirection) · operational-incident panel · Store-configuration panel.
- **Archetype gaps:** no typed config-registry, CAS-conflict, blast-radius, STOP, recovery-check, or fail-direction component in §11.

## 7. Open Questions
1. **`stop.activate` Gated-by CAP-395** — emergency action sharing the CAS version-conflict surface: deliberate? (GLM scrutiny finding.)
2. ~~**CAP-480 (setter here) vs CAP-510 (gate on /admin/readiness)**~~ **→ CLOSED (E5, 2026-08-26): the gate runs synchronously inside the setter (CAP-395/480) — one transaction, fail-closed on incomplete readiness. See States H.**
3. **CAP-425 blast-radius + CAP-431 recovery-key** govern this screen but aren't on its row nor explicit Gated-by on 395/398. (Opus + GLM.)
4. **CAP-460 mutation unnamed.** (GLM + GPT.)
5. **Tier-3 "typed confirm" interaction** undefined. (GLM.)
6. **STOP scope by subsystem** + permitted read/write during STOP + recoveryCheckKey registry/evaluator ownership — unspecified. (GPT.)
7. **Store circuit-breaker window default** not given in source. (GPT.)
