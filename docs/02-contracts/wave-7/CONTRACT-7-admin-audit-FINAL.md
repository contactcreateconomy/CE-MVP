# CONTRACT-7-admin-audit-FINAL

**Screen:** Audit Log Viewer — `/admin/audit`
**Wave:** 7B (M15 Admin & Ops Console)
**Template archetype:** Dense data table (append-only audit)
**Primary CAP-IDs:** CAP-421, CAP-422, CAP-357
**Actors:** administrator, Founder
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~40 folded). See RECONCILIATION-7B §7.

---

## 1. Route & Access
- **Path:** `/admin/audit`, no params. **Actors:** administrator, Founder. **Gated by CAP-390.** CAP-421 (query) · CAP-422 (export) · CAP-357 (Founder monthly spot-check).
- Audit records are **never deleted — including by erasure** (bible M13); **cold archive OK** (CAP-421).

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `auditLog` | read (421/422/357) + write (422 export-record; 357 spot-check record) | actorId, role?, action, target, prev, next, reasonCode?, correlationId, reversible?, justification?, createdAt. **Never deletable; cold archive OK.** Erased values never retained in `auditLog.prev` (M7 derivation-trail rule) |

## 3. States
*(Enum-backed set. GPT's ~40 transient states — each filter dimension, each export sub-step — folded, since the query/export/spot-check + never-delete invariant are authoritative.)*

**A. Query (CAP-421 `audit.query`):** filtered read (actor/action/target/time/env/correlation); never-delete invariant; INV-M15-6 makes this table the fail-closed spine for all privileged writes.
**B. Export (CAP-422 `audit.export` — action):** **the export itself is audited** (Writes: "auditLog (read), auditLog"); **export must fail-closed if the export-audit write fails.**
**C. Founder spot-check (CAP-357 / R-INSIDER):** monthly; **"no dual-control theatre"**; ⚠️ register Writes column literally says **`auditLog`** for this read-oriented check — either the spot-check is itself logged (likely) or a column error (Open Question, verbatim).
**D. Erasure interplay:** erased values never retained in `auditLog.prev` — invariant, no display action.
**E. Cold-archive:** hot/current records vs cold-archived retrieval.

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Query audit log | administrator/Founder | CAP-421 `audit.query` | none | CAP-390 |
| Export audit log | administrator/Founder | CAP-422 `audit.export` (action) | auditLog | CAP-390 |
| Record monthly Founder spot-check | Founder | CAP-357 (R-INSIDER; unnamed) | auditLog | none |

- **Delete audit record** — prohibited.

## 5. Analytics Events
**None** — this surface IS the accountability record, distinct from rawEvents. Audit-export content must not be sent to PostHog / ordinary telemetry.

## 6. Components Used
- **A1 Data table** (explicitly listed in inventory §3 Needed-by — archetype gap) · filter Select · audit-detail panel · masked-value rendering · §11.7 export confirm · §11.9 Skeleton · cold-archive state.

## 7. Open Questions
1. **CAP-357 Writes-column oddity** — `auditLog` write on a read-oriented spot-check. (GLM, verbatim.)
2. **Export format / destination / row-limit / encryption / expiry / download-auth** — unspecified. (GLM + GPT.)
3. **Export fail-closed behavior** when the export-audit write fails — must be explicit. (GPT.)
4. **Cold-archive mechanism** unowned (permitted, not specified). (GLM.)
5. **Query pagination / max date range / cold-archive latency** — unspecified. (GPT.)
6. **CAP-357 sampling rules + finding workflow** — unspecified. (GPT.)
7. **Audit-detail field-level masking rules** — not fully enumerated. (GPT.)
