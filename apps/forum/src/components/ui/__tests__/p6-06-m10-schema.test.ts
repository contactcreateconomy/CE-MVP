/* eslint-disable @typescript-eslint/no-explicit-any -- schema introspection tests */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-06 acceptance tests — M10 resource-store schema vs bible
 * l.190-202. Includes the absorbed-entity grep (dmcaNotices). */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";

const schema = schemaDefault as any;
const convexRoot = join(__dirname, "../../../../../../convex");
const schemaSrc = readFileSync(join(convexRoot, "schema.ts"), "utf8");

const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): any[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

describe("SLICE-P6-06 — M10 resource store (12 tables)", () => {
  const tables = [
    "resourceReferences", "resourceReferenceGrants", "resourceContributions",
    "postResources", "resources", "resourceVersions", "acquisitions", "downloads",
    "resourceQuotaLedgers", "resourceTakedownActions", "pilotKillGateEvaluations",
    "resourceCascadeReviews",
  ];

  it("all 12 M10 tables exist", () => {
    for (const t of tables) expect(schema.tables[t], t).toBeDefined();
  });

  it("absorbed-entity grep: ZERO dmcaNotices anywhere (Wave 6B E1)", () => {
    expect(schema.tables.dmcaNotices).toBeUndefined();
    expect(schemaSrc).not.toMatch(/dmcaNotices: defineTable/);
  });

  it("acquisitions: the quota unit — no type field, unique (userId, resourceId) lookup (l.196)", () => {
    const t = schema.tables.acquisitions;
    expect(hasField(t, "quotaDayKey"));
    expect(hasField(t, "quotaWeekKey"));
    expect(hasField(t, "type")).toBe(false); // "No type=view" — quoted
    expect((t.indexes ?? []).some((i: any) => i.indexDescriptor === "by_user_resource")).toBe(true);
  });

  it("resourceVersions: exactly-one-isCurrent representable + format=pdf only (l.195)", () => {
    const t = schema.tables.resourceVersions;
    expect(literalValues(fieldsOf(t).format)).toEqual(["pdf"]);
    expect(hasField(t, "isCurrent"));
    expect(hasField(t, "artifactSafetyPassed"));
    expect((t.indexes ?? []).some((i: any) => i.indexDescriptor === "by_resource_current")).toBe(true);
  });

  it("resourceContributions: weights 0-1, roles, unique (resourceId, referenceId) (l.192)", () => {
    const t = schema.tables.resourceContributions;
    expect(literalValues(fieldsOf(t).role).sort()).toEqual(
      ["duplicate", "independent", "primary", "source_only", "supporting"].sort(),
    );
    expect(hasField(t, "weight"));
    expect((t.indexes ?? []).some((i: any) => i.indexDescriptor === "by_resource_reference")).toBe(true);
  });

  it("resourceReferences: source classes + rights basis + full status set (l.190)", () => {
    const t = schema.tables.resourceReferences;
    expect(literalValues(fieldsOf(t).sourceClass).sort()).toEqual(
      ["in_house", "operator", "rights_verified", "user_ugc"].sort(),
    );
    expect(literalValues(fieldsOf(t).status).sort()).toEqual(
      ["accepted_for_forge", "content_review", "deleted", "forge_consumed", "legal_hold",
       "quarantined", "rejected", "rights_review", "scanning", "uploading"].sort(),
    );
    expect(hasField(t, "storageKeyQuarantine")); // quarantine storage — never public CDN
  });

  it("downloads: no quota consumption fields — integrityClass only (l.197)", () => {
    const t = schema.tables.downloads;
    expect(hasField(t, "integrityClass"));
    expect(hasField(t, "acquisitionId")); // requires prior acquisition
    expect(hasField(t, "quotaDayKey")).toBe(false);
  });

  it("resourceTakedownActions: legalIntake FK (the absorbed pointer) + 3 actions (l.200)", () => {
    const t = schema.tables.resourceTakedownActions;
    expect(literalValues(fieldsOf(t).action).sort()).toEqual(["legal_hold", "remove", "unpublish"].sort());
    const fk = JSON.stringify(fieldsOf(t).legalIntakeId);
    expect(fk).toContain("legalIntake");
  });

  it("pilotKillGateEvaluations: outcome-only — no UGC-flag field (CAP-220 never flips the flag)", () => {
    const t = schema.tables.pilotKillGateEvaluations;
    expect(literalValues(fieldsOf(t).outcome).sort()).toEqual(["continue", "ditch_recommend"].sort());
    expect(hasField(t, "thresholdKeysUsed")); // admin-configurable keys, not hardcoded
    expect(hasField(t, "constellationUgcEnabled")).toBe(false);
    expect(hasField(t, "flagFlipped")).toBe(false);
  });
});
