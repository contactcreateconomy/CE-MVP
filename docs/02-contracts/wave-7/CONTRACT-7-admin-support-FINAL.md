# CONTRACT-7-admin-support-FINAL

**Screen:** Support Console — `/admin/support`
**Wave:** 7B (M15 Admin & Ops Console)
**Template archetype:** Masked-PII support tools
**Primary CAP-IDs:** CAP-402, CAP-403, CAP-404, CAP-405, CAP-406
**Actor:** support_operator
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~40 folded). One escalation (CAP-024/404 duplicate). See RECONCILIATION-7B §4.

---

## 1. Route & Access
- **Path:** `/admin/support`, no params. **Actor:** support_operator. Every action **gated by CAP-390** (shell, support-scoped). Rate limit: **support.action 30/1h per operator (CAP-020; staff NOT rate-exempt)**.
- Support cannot use this screen to assign roles, alter moderation outcomes, edit money-path evidence, or access unmasked PII.
- ⚠️ ~~**CAP-024 vs CAP-404 duplicate**~~ **E4 RESOLVED 2026-08-26 (investigated — kept both, NOT merged):** CAP-024 (M1, `timezone.correct`, Has-UI=NO) is the **backend contract row** — M1-platform-foundation §8/§14 establishes "timezone write-once; Admin+audit correction" as an M1 rule; CAP-404 (M15, `support.timezone.fix`, Has-UI=YES, calendar context) is the **UI action** that exercises it. Two layers of one correction, same actor/write expected — the CAP-535-precedent check found genuine canonical status for BOTH, in different registers. **Canonical mutation name = `support.timezone.fix` (CAP-404)** — M15 sheet §2 and MASTER-DRAFT's mutation list both cite only it; CAP-024's Notes now cross-link. No row deleted.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `users` | read + write (timezone, CAP-404) | timezone **write-once** (IANA); staff-side audited correction is the sanctioned override |
| `quotaGrants` | read + write | userId, extraAcquires, expiresAt, grantedByUserId, reason, incidentId?, neutralizedAt? — **no permanent opsExempt flag** |
| `operationalIncidents` | read (CAP-402) | unique incident per grant |
| `moderationCases` · `strikes` · `capabilityRestrictions` | read (CAP-406) | masked summary |
| `auditLog` | write | 402–405 |

## 3. States
*(Enum-backed set. GPT's ~40 transient states — each grant-bound sub-step — folded, since the quota-grant bounds + neutralize + timezone-calendar branches are authoritative.)*

**A. Quota grant (CAP-402 `quota.grant`):** **≤5 extra acquires · ≤7d · max 1 active/user · unique incidentId**; rolling **>3/90d → Admin intervention** (CAP-432, rendered on Home).
**B. Neutralize (CAP-403 `quota.neutralize`):** sets `neutralizedAt`.
**C. Timezone fix (CAP-404 `support.timezone.fix` — canonical mutation, E4):** **grievance_india = Asia/Kolkata + India holidays; DMCA = US business days.** (CAP-024 = the M1 backend-contract row for the same correction — retained, cross-linked; not a duplicate.)
**D. User note (CAP-405 `support.note.create`):** writes auditLog only.
**E. Masked summary (CAP-406 `support.userSummary`):** masked PII; read-only. ⚠️ masked-projection field allowlist not enumerated (Open Question).

## 4. Actions → API

| Action | CAP / mutation | Writes | Gates |
|---|---|---|---|
| Grant quota exception | CAP-402 `quota.grant` | quotaGrants, auditLog | CAP-390 |
| Neutralize grant | CAP-403 `quota.neutralize` | quotaGrants (neutralizedAt), auditLog | CAP-402 |
| Fix timezone | CAP-404 `support.timezone.fix` | users (timezone), auditLog | CAP-390 |
| Create note | CAP-405 `support.note.create` | auditLog | CAP-390 |
| User summary | CAP-406 `support.userSummary` | none (read) | CAP-390 |

## 5. Analytics Events
**None named** on any row. `quotaGrants` + `auditLog` are authoritative. ⚠️ CAP-406 exposes sensitive operational info but does not explicitly write an access-audit record (Open Question).

## 6. Components Used
- §11.2 inputs (masked fields; note) · §11.3 user card · §11.7 confirm modal + Toast · A1-lite table.
- **Archetype gap:** no masked-user-summary or bounded-quota-grant component.

## 7. Open Questions
1. ~~**CAP-024 vs CAP-404 duplication + mutation-name divergence.**~~ **→ RESOLVED (E4, 2026-08-26): two layers (M1 backend contract / M15 UI action), both retained; canonical mutation = `support.timezone.fix`.**
2. **CAP-406 masked-projection field allowlist** not enumerated (contrast CAP-029). (Opus.)
3. **CAP-406 does not explicitly write an access-audit** despite exposing sensitive info. (GPT.)
4. **Support-scoped intervention alerts** (CAP-408 note) — no surface row here. (GLM.)
5. **Incident-eligibility / unique-incident validation** unspecified. (GPT.)
6. **Timezone-correction notification to member + neutralized-grant effect on unused allowance** — unspecified. (GPT.)
