# Affiliate Commercial Inventory

**Status (2026-09-18 screen audit correction):** LIVE. Audited against CONTRACT-4-affiliate-inventory-FINAL.md — compliant, no deviations found.

**Route:** `/admin/affiliate-inventory`
**Status:** NOT STARTED
**Contract:** PRD/02-contracts/wave-4/CONTRACT-4-affiliate-inventory-FINAL.md
**Slice(s):** P4-12

## Layout

From contract §6 Components Used: **§12.4 Admin Console Layout** (dense config-panel) + **§7.4 admin motion** (fade-in only, duration/fast). Inventory Template archetype: "Admin config panel". Contract §1/§2: one connected commercial inventory, not three independent screens — the console renders one FK-linked view `commercialEntity → affiliateRelationships → affiliateLink`; UI must disable each child create form while its parent set is empty; no normal nav constraint stated (unlike genome back-door).

```
+------------------+---------------------------------------------------+
| (admin sidebar,  |  DENSE CONTENT (§12.4) — ONE CONNECTED VIEW       |
|  §12.4)          |                                                   |
|                  |  MODE 1 — INVENTORY CONSOLE (default)             |
|                  |    commercialEntities (A1 table; entityType/      |
|                  |      network/status pills)                        |
|                  |      └─ affiliateRelationships (child rows;       |
|                  |           entity selector, relationshipStatus    |
|                  |           pill {active|paused|terminated})        |
|                  |           └─ affiliateLinks (grandchild rows;     |
|                  |                disclosureClass, status pill)      |
|                  |    [Create/edit commercialEntity]                 |
|                  |    [Create/edit affiliateRelationship]  (disabled |
|                  |      while zero commercialEntities)              |
|                  |    [Create/edit affiliateLink]        (disabled   |
|                  |      while zero relationships)                   |
|                  |    Deactivate (Toggle or Button-Destructive →     |
|                  |      CAP-545 soft-deactivate cascade; confirm     |
|                  |      Modal required; NEVER hard delete)           |
|                  |                                                   |
|                  |  MODES 2–7 — create/edit forms per entity         |
|                  |    §11.2 Text Inputs (name, programName,          |
|                  |      websiteUrl, url, commissionModel,            |
|                  |      cookieWindow) · Selects (entityType,         |
|                  |      network, parent selectors, optional toolId,  |
|                  |      status/relationshipStatus/disclosureClass)   |
|                  |    Logo upload via CAP-012 upload-URL flow        |
|                  |      (dropzone; logoAssetId stores the           |
|                  |      mediaAssets id)                              |
+------------------+---------------------------------------------------+
```

## Components required

- A1 data table → apps/forum/src/components/ui/data-table/index.tsx
- §11.2 Text Input (name, programName, websiteUrl, url, commissionModel, cookieWindow) → apps/forum/src/components/ui/input.tsx
- §11.2 Select (entityType, network, parent selectors, optional toolId, status / relationshipStatus / disclosureClass) → apps/forum/src/components/ui/select.tsx
- §11.7 Modal (create/edit/deactivate confirm) → apps/forum/src/components/ui/dialog.tsx
- §11.7 Toast (mutation feedback) → apps/forum/src/components/ui/toast.tsx
- §11.5 pills (entityType, network, status / relationshipStatus) → apps/forum/src/components/ui/badge.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- MISSING: Spinner — contract §6 lists "§11.9 Skeleton · Spinner"; no spinner component exists in the library
- §11.1 Button Primary / Secondary / Ghost → apps/forum/src/components/ui/button.tsx (Destructive variant acceptable only wired to CAP-545 soft-deactivate, never hard delete; confirm modal required)
- Deactivate control may be a Toggle → apps/forum/src/components/ui/toggle-switch.tsx
- Logo upload (A4 file-upload class; CAP-012 upload-URL flow, writer CAP-539) → apps/forum/src/components/ui/dropzone.tsx and apps/forum/src/components/ui/image-uploader.tsx (contract flags the A4 §11 gap; the library provides these two primitives)
- MISSING: Connected hierarchical inventory — no parent-child entity→relationship→link view exists in the library

## States required

*(Copied VERBATIM from CONTRACT-4-affiliate-inventory-FINAL §3.)*

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

## Component library maturity note

- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dropzone has zero production usage — expect possible integration friction, report don't silently patch.
- button, toast are production-proven (no warning).
- toggle-switch.tsx and image-uploader.tsx are on neither the provided zero-production nor production-proven list — maturity unknown, not invented here.
