# CONTRACT-7-admin-roles-FINAL

**Screen:** RBAC & Ops Assignments — `/admin/roles`
**Wave:** 7B (M15 Admin & Ops Console)
**Template archetype:** RBAC assignment + ops-coverage matrix
**Primary CAP-IDs:** CAP-008, CAP-413, CAP-414, CAP-415, CAP-416, CAP-417, **CAP-564**
**Actors:** Founder, administrator (role assignment is Founder-only; revoke is Founder/administrator — E3)
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~50 folded). ~~One escalation (UI-side revoke missing).~~ **E3 CLOSED 2026-08-26 — CAP-564 added.** See RECONCILIATION-7B §5.

---

## 1. Route & Access
- **Path:** `/admin/roles`, no params. **Actors:** Founder, administrator. **Role assignment itself is Founder-only** (CAP-413). Gated by CAP-390.
- **CAP-008 (Special Note 2 — settled, cited):** Second Founder grant, gated by CAP-007 (`grantFounder` CLI); requires **TESTED /admin + Tier-3 flip**; persisted **env-scoped `founder_bootstrap_completed` (preview ≠ production)**; CAP-023: preview completion does NOT satisfy the production probe. Phase-1.5: "YES — resolved via founder ethos (toggle > hardcode)." *This batch's shell is the "TESTED /admin" precondition.* Founder = Administrator + founder-only permission keys; "second Founder" is not a separate role enum.
- ~~⚠️ **UI-side role revocation is missing (verified):** CAP-413 grants via UI, but the only revoke path is **CAP-009 `revokeRole` (Founder CLI, Has-UI=NO)**; CAP-430 only *enforces* an already-happened revoke → **ESCALATION E3.**~~ **E3 CLOSED 2026-08-26: CAP-564 `roles.revoke` added** — Administrator/Founder UI revoke (Actor: administrator, Founder); inverse of CAP-413's grant, mirroring its UI pattern. CAP-009 stays as the emergency/scripted CLI path. Enforcement on next server request via CAP-430 (unchanged). Founder may revoke Administrator-assigned roles; Administrator revokes staff roles but never founder keys (CLI-only per CAP-007/009); last-active-Founder/Administrator revoke rejected (guardrail; exact rule remains OQ#3).

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `roleAssignments` | read + write (CAP-413) | userId, role, scopeType, scopeId, grantedByUserId, status, grantedAt, revokedAt |
| `users` · `systemConfig` | read + write (CAP-008) | env-scoped founder bootstrap key |
| `opsAssignments` | read + write (CAP-416) | 11 slots: editor_primary/backup · publisher_primary/backup · persona_publisher · moderator_primary/backup · after_hours_escalation · store_operator_primary · support_owner · support_channel; state {filled · single_person_acknowledged · vacant · inactive_assignee} |
| `opsCoverageAcknowledgements` | write (CAP-415) | single_person_coverage_acknowledged, acknowledgedByUserId, acknowledgedAt, expiresAt? |
| `adminInterventionAlerts` | write (System, CAP-414) | vacant-slot alert; readiness blocked |
| `operationalIncidents` | write (System, CAP-417) | after-hours escalation |
| `auditLog` | write | 413/415/416 (+ 414/417 System) |

## 3. States
*(Enum-backed set. GPT's ~50 transient states — each role assign, each slot combination — folded, since the role enum (6) + 11-slot enum + 4 slot-states + the Second-Founder gate are authoritative.)*

**A. Second Founder gate (CAP-008):** blocked → TESTED-admin-verified + Tier-3 typed flip → granted; env-scoped persistence (preview ≠ production).
**B. Role assign (CAP-413 `roles.assign`):** Founder-only; roles per enum. Adjacent (no UI): CAP-007 `grantFounder` / CAP-009 `revokeRole` CLI.
**C. Slot vacant (CAP-414):** → intervention + **launch readiness blocked** unless green OR single-person ack.
**D. Single-person ack (CAP-415 `opsCoverage.ack`):** required before beta when one human per critical slot.
**E. Ops upsert (CAP-416 `opsAssignments.upsert`, gated CAP-413):** per-slot assignment; four slot states.
**F. After-hours escalation (CAP-417):** → operationalIncidents + auditLog via after_hours_escalation slot.
**G. Revoke (CAP-564, E3 CLOSED 2026-08-26):** UI revoke via `roles.revoke` (administrator/Founder) — writes `roleAssignments (status=revoked, revokedAt)` + auditLog; enforcement on next request (CAP-430); CAP-009 CLI remains the emergency path.

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Assign operator role | Founder | CAP-413 `roles.assign` | roleAssignments, auditLog | CAP-390 |
| Single-person ack | administrator | CAP-415 `opsCoverage.ack` | opsCoverageAcknowledgements, auditLog | CAP-414 |
| Upsert ops assignment | administrator | CAP-416 `opsAssignments.upsert` | opsAssignments, auditLog | CAP-413 |
| Second Founder flip | Founder | CAP-008 (unnamed; CLI-adjacent) | systemConfig, auditLog | CAP-007; TESTED /admin; Tier-3 |
| Revoke role assignment | administrator/Founder | **CAP-564 `roles.revoke` (E3)** | roleAssignments (status=revoked, revokedAt), auditLog | not last active Founder/Administrator; founder keys CLI-only |
| (System) Vacant-slot alert | System | CAP-414 | adminInterventionAlerts | none |
| (System) After-hours escalation | System | CAP-417 | operationalIncidents, auditLog | CAP-416 |

- ~~**Revoke role** — no UI capability (CAP-009 CLI-only, CAP-430 enforces only) → E3.~~ **CAP-564 `roles.revoke` (E3 CLOSED 2026-08-26) — see Actions.**

## 5. Analytics Events
**None named.** Role assignments/revocations/coverage-acks/ops-assignments/second-Founder grants require `auditLog`; role state never relies on analytics.

## 6. Components Used
- §11.2 forms · A1 data table (assignments; ops-coverage matrix) · §11.5 pills (slot states green/vacant) · §11.7 confirm (Tier-3-class flip) · user lookup.
- **Archetype gaps:** no RBAC assignment matrix, ops-coverage matrix, or second-Founder Tier-3 component.

## 7. Open Questions
1. ~~**UI-side role revocation missing**~~ **→ CLOSED (E3, 2026-08-26): CAP-564 `roles.revoke` added (administrator/Founder, UI).**
2. **CAP-008 mutation unnamed** (persisted via systemConfig write; mechanism unspecified). (GLM + GPT.)
3. **Guardrails preventing revocation of the last Founder/Administrator** — not specified. (GPT.)
4. **Whether Administrator can revoke Founder-assigned roles** — unspecified. (GPT.)
5. **`support_channel` slot channel target** — undefined. (GLM.)
6. **Single-person ack expiry/reconfirmation** rules — unspecified. (GPT.)
7. **Founder/administrator split** on CAP-415/416 (administrator) vs CAP-413 (Founder-only) — confirm intended chain. (GLM.)
