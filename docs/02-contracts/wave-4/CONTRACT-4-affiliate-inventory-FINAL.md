# CONTRACT-4-affiliate-inventory-FINAL

**Screen:** Affiliate Commercial Inventory — `/admin/affiliate-inventory`
**Wave:** 4B (M2 Content Engine — mid-wave addition; resolves Wave-4 E3 deferred contract)
**Template archetype:** Admin config panel (single connected commercial inventory)
**Primary CAP-IDs:** CAP-539, CAP-540, CAP-541, CAP-544, CAP-545
**Actor:** administrator (register CAP-539/540/541/544/545 — all administrator-actor; inventory Actor column corrected Wave 4B E4 — Publisher removed)
**Register basis:** 545-row register (Wave 4B closeout, through CAP-545).
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: GPT's ~100 sub-states folded to the compact GLM+Opus set on register evidence. **W4B-E1–E6 closed (founder 2026-08-24).** See RECONCILIATION-4B.

---

## 1. Route & Access
- **Path:** `/admin/affiliate-inventory`. **Dynamic params:** none. **Archetype:** Admin config panel — **one connected commercial inventory, not three independent screens** (CAP-544 reads all three entities in a single capability).
- **Actor:** **administrator only.** All five register rows (CAP-539/540/541/544/545) are administrator-actor. **E4 RESOLVED 2026-08-24:** inventory Actor(s) corrected; Publisher is not granted read or write here. Downstream consumer CAP-049 `affiliate.inject` remains Editor-actor on `/admin/editorial`.
- **Auth sequencing:** CAP-539 Notes — Wave-3 E5 pattern (minimal role check now; M15 shell at Wave 7). Minimal basic role-check gate at Wave 4; full M15 `/admin` shell (CAP-390 `assertAdminPermission` + CAP-392 route authz) wraps at Wave 7. Known pattern, not a gap.
- **Systemic limit:** CAP-019 (`admin.write`: 60/1m per operator; staff NOT rate-exempt) applies to every mutation here.
- **Dependency order (register `Gated by`):** `commercialEntities` (CAP-539, Gated by none) → `affiliateRelationships` (CAP-540, Gated by CAP-539) → `affiliateLinks` (CAP-541, Gated by CAP-540). UI must disable each child create form while its parent set is empty.
- **Reverse direction (E1 RESOLVED):** **CAP-545** is the required soft-deactivate action. Cascading downward: deactivating a `commercialEntity` sets its `affiliateRelationships.relationshipStatus=terminated`, which cascades to their `affiliateLinks.status=inactive`. Soft-deactivate (status flip), not hard delete — never-hard-delete pattern (CAP-044 terminal-not-deleted precedent).
- **CAP-049 consumer contract:** this inventory is the read source for M2 `affiliate.inject`. **Wave 4B E1/E2:** at **injection time** (not merely at initial name-match) CAP-049 verifies `affiliateRelationships.relationshipStatus=active` **AND** the specific `affiliateLinks` row `status=active`. A relationship or link deactivated after a prior injection does **not** retroactively affect already-published posts — that remediation is **FUTURE-M2-01** (named, not built). See CAP-545.
- **Boundary (anti-conflation):** this is the **M2 operator/editorial affiliate system** (`commercialEntities` / `affiliateRelationships` / `affiliateLinks` / `postAffiliateLinks`), distinct from the M11 member-facing storefront system. No storefront capability fires here.
- **SEO:** admin route, noindex (CAP-486). **Redirect rules:** none specified.

---

## 2. Entities

| Entity | Direction | Fields in play | Grounding |
|---|---|---|---|
| `commercialEntities` | read (CAP-544) + write (CAP-539 create/edit; CAP-545 status) | `name`, `entityType {vendor\|brand\|publisher\|internal}`, `websiteUrl`, `logoAssetId` *(via CAP-012 — E5)*, `status {active\|inactive}` *(E6 reasonable default)* | CAP-544 Reads; CAP-539 Writes; CAP-545 Writes `status` |
| `affiliateRelationships` | read (CAP-544; CAP-540 parent selector) + write | `commercialEntityId` (required FK), `toolId?`, `network`, `programName`, `relationshipStatus {active\|paused\|terminated}` **(E2 founder)**, `commissionModel {cpa\|cps\|cpc\|revshare\|flat\|other}` *(E6 reasonable default)*, `cookieWindow` *(integer, days — E6 reasonable default)*, `approvedAt` | CAP-544/540 Reads; CAP-540 Writes; CAP-545 Writes `relationshipStatus` |
| `affiliateLinks` | read (CAP-544; CAP-541 selector) + write | `affiliateRelationshipId?`, `toolId?`, `url` *(validation CAP-100 + CAP-235 — E3)*, `disclosureClass {sponsored\|affiliate\|paid}` *(E6 reasonable default)*, `status {active\|inactive}` *(E1 — CAP-545)* | CAP-544/541 Reads; CAP-541 Writes; CAP-545 Writes `status` |
| `auditLog` | write | one row per create/edit/deactivate | CAP-539/540/541/545 Writes |
| `mediaAssets` | write via CAP-012 only | `logoAssetId` target | CAP-012 (existing M1 upload-URL); not a new CAP |
| `tools` | read-only | optional tool binding on the relationship form | CAP-540 Reads |

- **Relationship graph:** `commercialEntity` → 0+ `affiliateRelationships` → 0+ `affiliateLinks`; relationship and link each optionally reference a `tool`. Console renders one connected view (entity → relationships → links).
- **Not touched here:** `postAffiliateLinks` (CAP-049/050 write target). CAP-049 writes a separate join; it must never mutate or duplicate an inventory link. CAP-545 does **not** rewrite published `postAffiliateLinks` (FUTURE-M2-01).
- **Sealed-keys check (CAP-394):** none of these five rows touches `systemConfig` / `configKeyRegistry` or sealed keys (`legitimacy.medianTarget`, `signal.eventWeights`, `signal.attributionSplit`, `trust.weightCap`).

---

## 3. States

**A. Screen modes:**
1. **Inventory console (default)** — CAP-544: all three entity types in one FK-linked view.
2. **Create / 3. Edit commercialEntity** — CAP-539.
4. **Create / 5. Edit affiliateRelationship** — CAP-540; entity selector required.
6. **Create / 7. Edit affiliateLink** — CAP-541; relationship selector required.

**B. Dependency-chain gating (forward, register `Gated by`):**
1. **Empty inventory** — zero `commercialEntities` → relationship + link creation unavailable.
2. **Entities-only** — no relationships → link creation unavailable.
3. **Chain complete** — all three creation flows enabled.

**C. Record display states (E2/E6 resolved):**
- `commercialEntities.status` ∈ {active, inactive}.
- `affiliateRelationships.relationshipStatus` ∈ {active, paused, terminated}. Functional split: `active` ⇒ CAP-049-inject-eligible; `paused` / `terminated` ⇒ ineligible.
- `affiliateLinks.status` ∈ {active, inactive}. CAP-049 requires `active` at injection time.
- Per-network relationship display.

**D. Deactivate states (CAP-545 — E1 RESOLVED):**
- Entity deactivate → cascade `relationshipStatus=terminated` on children → cascade `affiliateLinks.status=inactive`.
- Relationship deactivate → `relationshipStatus=terminated` (or `paused` if operator hold) + child links `status=inactive`.
- Link deactivate → that row `status=inactive` only.
- Already-published `postAffiliateLinks` **unchanged** (FUTURE-M2-01).

**E. Mutation feedback:** submitting · succeeded/failed · rate-limited (CAP-019). URL-validation failure (CAP-100 / CAP-235 rules — E3).

**Auth/shell:** administrator-authorized · unauthorized · Wave-4-minimal-shell vs Wave-7-M15-shell.

---

## 4. Actions → API

| Action | Actor | Capability | Reads | Writes | Gates |
|---|---|---|---|---|---|
| List inventory | administrator | CAP-544 (query) | commercialEntities, affiliateRelationships, affiliateLinks | none | none |
| Create / edit commercialEntity | administrator | CAP-539 | none *(edit prefill via CAP-544)* | commercialEntities, auditLog | none. `logoAssetId` via CAP-012 upload-URL (E5). |
| Create / edit affiliateRelationship | administrator | CAP-540 | commercialEntities, tools | affiliateRelationships, auditLog | **CAP-539**. `relationshipStatus` ∈ {active, paused, terminated} (E2). |
| Create / edit affiliateLink | administrator | CAP-541 | affiliateRelationships | affiliateLinks, auditLog | **CAP-540**. `url` validated per CAP-100 + CAP-235 (E3). |
| Soft-deactivate entity / relationship / link | administrator | CAP-545 | commercialEntities, affiliateRelationships, affiliateLinks | commercialEntities (status), affiliateRelationships (relationshipStatus), affiliateLinks (status), auditLog | none. Soft status flip, not delete. Downward cascade. Does not rewrite published `postAffiliateLinks`. **E1 RESOLVED.** |

- **Mutation names:** unnamed in the register (Open Question).
- **Create-child-without-parent:** blocked in UI and rejected server-side (CAP-540 Gated by CAP-539; CAP-541 Gated by CAP-540).
- **Explicitly NOT actions:**
  - Hard delete of any of the three entities (CAP-545 is soft-deactivate only).
  - Anything touching `postAffiliateLinks`, banners, or M11 storefront entities.
  - **Inject affiliate link** — downstream CAP-049 on `/admin/editorial`, not this screen. Injection-time active checks are CAP-049's (Wave 4B E1).

**Draft-body / inject interaction (CAP-049 re-check):** editing inventory via CAP-545 makes subsequent CAP-049 injects fail-closed on inactive rows. Prior injections on published posts are out of scope (FUTURE-M2-01).

---

## 5. Analytics Events
**None identified.** No `eventCatalog` row (CAP-436–463) covers affiliate-inventory writes. Accountability is **`auditLog`** (CAP-539/540/541/545). CAP-436 same-mutation `rawEvents` capture does not attach. Whether operator writes should also emit cataloged `rawEvents` (isStaff-stamped, product-counter-excluded) is unspecified (Open Questions).

---

## 6. Components Used
- **§12.4 Admin Console Layout** (dense config-panel) + **§7.4 admin motion** (fade-in only, duration/fast).
- **§11.2** Text Input (name, programName, websiteUrl, url, commissionModel, cookieWindow) · Select (entityType, network, parent selectors, optional toolId, status / relationshipStatus / disclosureClass).
- **§11.7** Modal (create/edit/deactivate confirm) · Toast (mutation feedback).
- **§11.5** Pill (entityType, network, status / relationshipStatus).
- **§11.9** Skeleton · Spinner. **§11.1** Button Primary / Secondary / Ghost.
- **Deactivate control:** may use Toggle or Button-Destructive **only** wired to CAP-545 soft-deactivate (status flip + cascade), never to a hard delete. Confirm modal required.
- **Logo upload:** reuses CAP-012 upload-URL flow (no new §11 dropzone invention required beyond flagging the A4 gap). `logoAssetId` stores the resulting `mediaAssets` id.
- **Archetype gaps — flag, not invent:**
  - **A1 Data table** — §11 defines no table component.
  - **Connected hierarchical inventory** — no §11 parent-child entity→relationship→link view.
  - **A4 File upload / dropzone** for `logoAssetId` — no §11 pattern; writer is CAP-012 + CAP-539, not a missing CAP.

---

## 7. Open Questions
*(W4B-E1–E6 closed 2026-08-24. Remaining items are unspecified detail.)*
1. **Mutation names** unspecified for CAP-539/540/541/544/545.
2. **`affiliateLinks.affiliateRelationshipId` schema-vs-gate tension** — nullable in the data model, but CAP-541 requires a relationship. UI enforces selection; whether edit may re-point a link to null is unspecified.
3. **FUTURE-M2-01** — remediation sweep for already-published posts using a since-deactivated affiliate link. Named, not built. Not a Wave-4 blocker.
4. **CAP-541's Reads omit `tools`** though `affiliateLinks.toolId?` exists — link-level tool binding is unowned.
5. **CAP-049 name-matching** — normalization, aliases, multiple matched tools, conflict resolution unspecified.
6. **Uniqueness constraints** — none specified for commercial entities, entity/network/program relationships, or affiliate-link URLs.
7. **CAP-544 hierarchy payload** — pagination, filtering, sorting, grouping undefined.
8. **Analytics cataloging** — auditLog-only vs additional isStaff-stamped `rawEvents`.
