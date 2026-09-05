# CONTRACT-7-admin-readiness-FINAL

**Screen:** Launch Readiness — `/admin/readiness`
**Wave:** 7B (M15 Admin & Ops Console + M18 readiness gate)
**Template archetype:** Readiness checklist + open-beta gate
**Primary CAP-IDs:** CAP-435, CAP-509, CAP-510
**Actors:** Founder, administrator
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~55 folded). One shared escalation (signup.mode split, E5). See RECONCILIATION-7B §8.

---

## 1. Route & Access
- **Path:** `/admin/readiness`, no params. **Actors:** Founder, administrator (CAP-435 Founder; CAP-509 Founder/Admin). Gated by CAP-390. Fed by CAP-414/415 (roles) and M18 probes.
- This screen does **not** directly bypass readiness to open signup — CAP-510 is the server-side gate.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `launchReadinessResults` | read + write (435/509) | versioned evaluation result, category outcomes, predicate evidence, timestamps, evaluator; version recorded (CAP-435). Field-level schema thin in bible ("as before") |
| `platformHealth` | read (CAP-509) | unavailable probe = **fail** |
| `opsAssignments` · `operationalIncidents` | read (435/509) | ops-ownership gate input |
| `systemConfig` | read (CAP-510) | signup.mode interplay (CAP-510 owns the open-mode gate) |

## 3. States
*(Enum-backed set. GPT's ~55 transient states — each category × pass/fail/unavailable — folded, since the 7-category enum + GATE-predicate + signup.mode enum are authoritative.)*

**A. Checklist query (CAP-435, Founder):** version recorded per query (R-OPS).
**B. Evaluate (CAP-509 `readiness.evaluate`, Founder/Admin):** **ALL GATE predicates must be true; unavailable probe = FAIL**; categories verbatim: **identity · safety/legal · data integrity · runtime recovery · consent · supply · ops ownership** (R-READINESS).
**C. open-block (CAP-510, System, gated CAP-509):** **server blocks signup.mode=open if any GATE false** — chains to FATAL-M1A-02 (`effectiveSignupMode = readiness ? signup.mode : closed`). **E5 CLOSED 2026-08-26:** this gate now also runs **synchronously inside CAP-395/480's setter** on /admin/config (fail-closed reject at set time — not a warning); the admission-time check here remains the second, independent belt. Setter and gate can no longer disagree — one transaction both directions (config→readiness: setter calls gate; readiness→config: a failing category surfaces on the checklist until resolved).
**D. Ops gate input:** opsAssignments green **OR** single-person ack (CAP-414/415).
**E. Auth probe nuance (CAP-023):** preview `founder_bootstrap_completed` does NOT satisfy the production probe.
**F. Failure posture:** open-beta blocked; CAP-480 rollback = emergency waitlist or sitewide noindex (Tier3).
**G. Adjacent:** CAP-431 (recoveryCheckKey) gates STOP resume (config flow); jobDeadLetters **redrive runbook "required before open beta"** (CAP-500) — runbook surface unlinked (likely a wiki article; Open Question).
**H. Category-aggregation dependency:** the 7 categories aggregate predicates owned by other screens/waves (consent → CMP CAP-504 W7A; ops-ownership → CAP-414/415); no CAP defines how `launchReadinessResults` collects each category's live state (Open Question).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Evaluate readiness | Founder/Admin | CAP-509 `readiness.evaluate` (R-READINESS) | launchReadinessResults | none |
| Query checklist | Founder | CAP-435 (unnamed query) | launchReadinessResults (version recorded) | none |
| (System) open-mode gate | System | CAP-510 | none (block if any GATE false; no write on block) | CAP-509 |

- **Set signup.mode=open** — executed via /admin/config CAP-480; **CAP-510 now runs inside that setter (E5, 2026-08-26): the set itself rejects fail-closed while any GATE fails; this screen's admission-time check remains the independent second belt.** **Acknowledge single-person coverage** → /admin/roles CAP-415. **Resolve blocking incident** → owning operational screen.

## 5. Analytics Events
**None named.** `launchReadinessResults` is authoritative. ⚠️ CAP-509/510 do not explicitly list `auditLog` writes for this highest-impact release gate (Open Question).

## 6. Components Used
- Checklist cards · §11.5 pills (7 categories, pass/fail/unavailable) · progress fill · blocking-item deep links · checklist-version indicator · §11.1 Button (evaluate/re-evaluate) · §11.9 Skeleton.

## 7. Open Questions
1. ~~**CAP-480 (setter, /admin/config) vs CAP-510 (gate, here)**~~ **→ CLOSED (E5, 2026-08-26): setter calls the gate synchronously — atomic, version-bound via launchReadinessResults, fail-closed. See States C.**
2. **Per-category predicate list** lives in the M18 decisions doc, not the register — UI needs an enumerated probe source; no CAP defines the category-aggregation contract. (GLM + Opus.)
3. **CAP-509/510 do not explicitly write `auditLog`** for the release gate. (GPT.)
4. **`launchReadinessResults` schema thin** ("as before"). (GLM.)
5. **Redrive-runbook surface linkage** (CAP-500 ↔ wiki). (GLM.)
6. **CAP-435 query mutation unnamed** + Founder-vs-Administrator access difference. (GLM + GPT.)
7. **Evaluation freshness/expiry + no manual override** (consistent with fail-closed, must not be invented). (GPT.)

---

## ADDENDUM 2026-09-04 — DECISIONS-LOCKED #8 (+post-11 correction)

Readiness predicate catalog locked — **8 categories, not 7**: Legal pages
(Terms/Privacy/DMCA published & versioned) · Admission (magic-link + activation
checklist functional) · Moderation (policyFamily dedupe operational) · Legal
intake (forms + identity rules live) · Consent/privacy (CMP + vendor-deletion
outbox operational) · Reliability (manual_review actions live) · Content safety
(M2/M3 pipeline implemented) · **Ranking calibration reviewed** — the 8th gates
PUBLIC LAUNCH only, not build. Each predicate: boolean, module-owned, rechecked
every 5 min, unavailable = fail-closed; `overall=ready` requires all 8 true.
