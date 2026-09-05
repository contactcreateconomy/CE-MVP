/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection + module-surface tests */
import { describe, it, expect } from "vitest";

/* SLICE-P4-12 acceptance tests. Console CRUD + cascade run live
 * (administrator-gated); here we pin the schema substrate (bible l.206-208,
 * Wave-4B E1-E6) and the module surface incl. inject/remove.
 *
 * Sources: CAP-539/540/541/544/545 + CAP-049/050 Notes; CONTRACT-4-affiliate-inventory. */

import schemaDefault from "../../../../../../convex/schema";
import * as inventory from "../../../../../../convex/affiliateInventory";
import * as inject from "../../../../../../convex/editorial/inject";
import { ADMIN_WIDGET_CATALOG } from "../../../../../../convex/admin/widgetsCatalog";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

describe("SLICE-P4-12 — schema substrate (bible l.206-208)", () => {
  it("commercialEntities: E6 field set + entityType enum", () => {
    const t = schema.tables.commercialEntities;
    for (const f of ["name", "entityType", "websiteUrl", "logoAssetId", "status", "createdAt"]) {
      expect(hasField(t, f), `commercialEntities.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).entityType).sort()).toEqual(["brand", "internal", "publisher", "vendor"].sort());
    expect(literalValues(fieldsOf(t).status).sort()).toEqual(["active", "inactive"].sort());
  });

  it("affiliateRelationships: E2 founder enum + commission/cookie fields", () => {
    const t = schema.tables.affiliateRelationships;
    expect(literalValues(fieldsOf(t).relationshipStatus).sort()).toEqual(["active", "paused", "terminated"].sort());
    expect(literalValues(fieldsOf(t).commissionModel).sort()).toEqual(["cpa", "cpc", "cps", "flat", "other", "revshare"].sort());
    expect(hasField(t, "cookieWindow")).toBe(true);
    expect(fieldsOf(t).commercialEntityId.tableName).toBe("commercialEntities");
  });

  it("affiliateLinks: E1 status + disclosureClass; E3 url; parent FK", () => {
    const t = schema.tables.affiliateLinks;
    expect(literalValues(fieldsOf(t).status).sort()).toEqual(["active", "inactive"].sort());
    expect(literalValues(fieldsOf(t).disclosureClass).sort()).toEqual(["affiliate", "paid", "sponsored"].sort());
    expect(hasField(t, "url")).toBe(true);
  });

  it("postAffiliateLinks.affiliateLinkId is id-typed to affiliateLinks (the cap join)", () => {
    expect(fieldsOf(schema.tables.postAffiliateLinks).affiliateLinkId.tableName).toBe("affiliateLinks");
  });
});

describe("SLICE-P4-12 — module surface", () => {
  it("inventory: list + three upserts + deactivate are public; administrator-gated handlers", () => {
    expect((inventory.listInventory as any).isQuery).toBe(true);
    for (const fn of [inventory.entityUpsert, inventory.relationshipUpsert, inventory.linkUpsert, inventory.deactivate]) {
      expect((fn as any).isMutation).toBe(true);
      expect((fn as any).isPublic).toBe(true);
    }
  });

  it("inject/remove (CAP-049/050): public mutations on the editorial surface", () => {
    expect((inject.inject as any).isMutation).toBe(true);
    expect((inject.remove as any).isMutation).toBe(true);
    expect((inject.listInjectable as any).isQuery).toBe(true);
  });

  it("widget catalog grew with the affiliate-inventory console (administrator-only)", () => {
    const row = ADMIN_WIDGET_CATALOG.find((w) => w.routeKey === "/admin/affiliate-inventory");
    expect(row?.requiredPermissionKeys).toEqual(["administrator"]);
  });
});
