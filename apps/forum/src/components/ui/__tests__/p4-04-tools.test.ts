/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection: Convex runtime validator objects are untyped at the edge */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* SLICE-P4-04 acceptance tests — M5 registry schema-vs-bible fidelity,
 * args-validator mirroring, R-VERDICT segment projections, and module
 * surface. The Editor-gated mutations and paginated queries are Convex
 * FunctionReferences (not invokable in vitest); handler-path verification
 * (Editor gate, slug uniqueness, taxonomy constraint, archive freeze
 * guards) requires a deployment push (Bucket-1, DEV-HANDOFF #4).
 *
 * Sources: CAP-108/109/110/111/118/119 Notes; CONTRACT-2-tool-directory §1-4;
 * CONTRACT-2-tool-profile §1-4; bible l.143-144 (tools/toolRatings), l.72
 * (toolTags join), l.354 (toolRating.dimension enum). */

import schemaDefault from "../../../../../../convex/schema";
import * as toolsModule from "../../../../../../convex/tools";
import * as categoriesModule from "../../../../../../convex/categories";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const indexNames = (t: any) => (t.indexes ?? []).map((i: any) => i.indexDescriptor);
const searchIndexNames = (t: any) => (t.searchIndexes ?? []).map((i: any) => i.indexDescriptor);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

function argsOf(fn: any): Record<string, { fieldType: any; optional: boolean }> {
  return JSON.parse(fn.exportArgs()).value;
}

describe("SLICE-P4-04 — tools schema (bible l.143)", () => {
  it("field list: name, slug, logoAssetId, categoryIds, pricing, officialUrl, status, aggregates, editorialVerdict*", () => {
    const t = schema.tables.tools;
    for (const f of [
      "name", "slug", "logoAssetId", "categoryIds", "pricing", "officialUrl",
      "status", "ratingSum", "ratingCount", "dimensionSums", "dimensionCounts",
      "editorialVerdictScore", "editorialVerdictSummary",
      "editorialVerdictAssignedByUserId", "editorialVerdictUpdatedAt",
    ]) {
      expect(hasField(t, f), `tools.${f}`).toBe(true);
    }
  });

  it("CAP-118 status literals: active · draft · archived", () => {
    expect(literalValues(fieldsOf(schema.tables.tools).status).sort()).toEqual(
      ["active", "archived", "draft"].sort(),
    );
  });

  it("dimensionSums/dimensionCounts carry exactly the 4-dim enum (bible l.354)", () => {
    const t = schema.tables.tools;
    for (const f of ["dimensionSums", "dimensionCounts"]) {
      const dims = Object.keys(fieldsOf(t)[f].fields);
      expect(dims.sort()).toEqual(
        ["ease_of_use", "output_quality", "reliability", "value_for_money"].sort(),
      );
    }
  });

  it("editorialVerdict* are optional (nullable = no curated verdict, CAP-535)", () => {
    const t = fieldsOf(schema.tables.tools);
    for (const f of [
      "editorialVerdictScore", "editorialVerdictSummary",
      "editorialVerdictAssignedByUserId", "editorialVerdictUpdatedAt",
    ]) {
      expect(t[f].isOptional, `tools.${f} optional`).toBe("optional");
    }
    expect(t.name.isOptional).not.toBe("optional"); // catalog core is required
  });

  it("indexes: by_slug (unique lookup), by_status (directory), search on name (CAP-111 search filter)", () => {
    const t = schema.tables.tools;
    expect(indexNames(t)).toContain("by_slug");
    expect(indexNames(t)).toContain("by_status");
    expect(searchIndexNames(t)).toContain("search_name");
  });
});

describe("SLICE-P4-04 — toolRatings + toolTags schema (bible l.144, l.72)", () => {
  it("toolRatings: user-only rating row with 4 dims; N/A ONLY on value_for_money (E6)", () => {
    const t = schema.tables.toolRatings;
    for (const f of ["toolId", "userId", "overallScore", "dimensionScores", "reviewText", "status", "moderationStatus"]) {
      expect(hasField(t, f), `toolRatings.${f}`).toBe(true);
    }
    expect(fieldsOf(t).toolId.tableName).toBe("tools");
    expect(fieldsOf(t).userId.tableName).toBe("users");
    const dims = fieldsOf(t).dimensionScores.fields;
    // E6: value_for_money = number | not_applicable; the other three are
    // always-ratable numbers with NO not_applicable literal
    const vfm = dims.value_for_money;
    expect(vfm.kind).toBe("union");
    expect(vfm.members.map((m: any) => m.kind).sort()).toEqual(["float64", "literal"]);
    expect(vfm.members.find((m: any) => m.kind === "literal").value).toBe("not_applicable");
    for (const dim of ["ease_of_use", "output_quality", "reliability"]) {
      expect(dims[dim].kind).toBe("float64");
    }
    expect(indexNames(t)).toContain("by_toolId_userId"); // R-ONE guard
  });

  it("toolTags: join-only canonical relation, no tagIds[] on tools", () => {
    const t = schema.tables.toolTags;
    expect(fieldsOf(t).toolId.tableName).toBe("tools");
    expect(fieldsOf(t).tagId.tableName).toBe("tags");
    expect(fieldsOf(t).createdAt.kind).toBe("float64");
    expect(indexNames(t)).toContain("by_toolId_tagId");
    expect(indexNames(t)).toContain("by_tagId"); // directory tag filter direction
    expect(hasField(schema.tables.tools, "tagIds")).toBe(false);
  });
});

describe("SLICE-P4-04 — args mirror the schema validators (standing instruction)", () => {
  it("create: catalog fields mirror tools schema; tagIds is v.array(v.id('tags')) for the join writes", () => {
    const a = argsOf(toolsModule.create);
    expect(a.name.fieldType.type).toBe("string");
    expect(a.slug.fieldType.type).toBe("string");
    expect(a.officialUrl.fieldType.type).toBe("string");
    expect(a.categoryIds.fieldType.type).toBe("array");
    expect(a.categoryIds.fieldType.value.type).toBe("string");
    expect(a.tagIds.fieldType.value.type).toBe("id");
    expect(a.tagIds.fieldType.value.tableName).toBe("tags");
    // aggregate fields are NOT args — INV-1: only toolRatings feed them
    for (const forbidden of ["ratingSum", "ratingCount", "dimensionSums", "dimensionCounts"]) {
      expect(a[forbidden], `create args must not accept ${forbidden}`).toBeUndefined();
    }
  });

  it("update: toolId is v.id('tools'); slug is IMMUTABLE (absent from args)", () => {
    const a = argsOf(toolsModule.update);
    expect(a.toolId.fieldType.type).toBe("id");
    expect(a.toolId.fieldType.tableName).toBe("tools");
    expect(a.slug).toBeUndefined();
    expect(a.tagIds.fieldType.value.tableName).toBe("tags");
  });

  it("list: category/tag/search/pagination parameters (CAP-111 one-query contract)", () => {
    const a = argsOf(toolsModule.list);
    expect(a.category.fieldType.type).toBe("string");
    expect(a.tag.fieldType.type).toBe("id");
    expect(a.tag.fieldType.tableName).toBe("tags");
    expect(a.search.fieldType.type).toBe("string");
    expect(a.cursor.fieldType.type).toBe("string");
    expect(a.numItems.fieldType.type).toBe("number"); // wire-format name for v.number()
  });

  it("getProfile: lookup key is slug (unique)", () => {
    const a = argsOf(toolsModule.getProfile);
    expect(Object.keys(a)).toEqual(["slug"]);
    expect(a.slug.fieldType.type).toBe("string");
  });
});

describe("SLICE-P4-04 — aggregateView (R-VERDICT segment 1, CAP-110)", () => {
  const zeroTool = {
    ratingSum: 0,
    ratingCount: 0,
    dimensionSums: { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 },
    dimensionCounts: { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 },
  };

  it("honest zero-state: overall null (never 0), every dimension avg null", () => {
    const view = toolsModule.aggregateView(zeroTool);
    expect(view.overall).toBeNull();
    expect(view.ratingCount).toBe(0);
    for (const dim of Object.values(view.dimensions)) {
      expect(dim.avg).toBeNull();
      expect(dim.count).toBe(0);
    }
  });

  it("overall = ratingSum/ratingCount rounded to 1 decimal; per-dim averages from sums/counts", () => {
    const view = toolsModule.aggregateView({
      ratingSum: 14,
      ratingCount: 3, // 4.666… → 4.7
      dimensionSums: { ease_of_use: 13, output_quality: 10, reliability: 7, value_for_money: 0 },
      // value_for_money N/A-only: count 0 (INV-3) → avg null, not 0
      dimensionCounts: { ease_of_use: 3, output_quality: 2, reliability: 2, value_for_money: 0 },
    });
    expect(view.overall).toBe(4.7);
    expect(view.dimensions.ease_of_use).toEqual({ avg: 4.3, count: 3 });
    expect(view.dimensions.output_quality).toEqual({ avg: 5, count: 2 });
    expect(view.dimensions.value_for_money).toEqual({ avg: null, count: 0 });
  });
});

describe("SLICE-P4-04 — editorialVerdictView (R-VERDICT segment 2, CAP-535 fields)", () => {
  it("null when no curated verdict exists (segment renders its empty state)", () => {
    expect(toolsModule.editorialVerdictView({})).toBeNull();
    expect(
      toolsModule.editorialVerdictView({
        editorialVerdictScore: undefined,
        editorialVerdictSummary: undefined,
      }),
    ).toBeNull();
  });

  it("populated shape when curated (score/summary/by/updatedAt)", () => {
    const view = toolsModule.editorialVerdictView({
      editorialVerdictScore: 4,
      editorialVerdictSummary: "Best-in-class output quality.",
      editorialVerdictAssignedByUserId: "u123" as any,
      editorialVerdictUpdatedAt: 1725148800000,
    });
    expect(view).toEqual({
      score: 4,
      summary: "Best-in-class output quality.",
      assignedByUserId: "u123",
      updatedAt: 1725148800000,
    });
  });
});

describe("SLICE-P4-04 — module surface + api registration", () => {
  it("create/update are public mutations; list/getProfile are public queries", () => {
    expect((toolsModule.create as any).isMutation).toBe(true);
    expect((toolsModule.create as any).isPublic).toBe(true);
    expect((toolsModule.update as any).isMutation).toBe(true);
    expect((toolsModule.list as any).isQuery).toBe(true);
    expect((toolsModule.getProfile as any).isQuery).toBe(true);
  });

  it("categories.listActive is a public query (CAP-111 category filter source)", () => {
    expect((categoriesModule.listActive as any).isQuery).toBe(true);
  });

  it("api.d.ts maps the tools + categories modules", () => {
    const apiDts = readFileSync(
      resolve(__dirname, "../../../../../../convex/_generated/api.d.ts"),
      "utf8",
    );
    expect(apiDts).toContain('import type * as tools from "../tools.js"');
    expect(apiDts).toContain("tools: typeof tools;");
    expect(apiDts).toContain('import type * as categories from "../categories.js"');
    expect(apiDts).toContain("categories: typeof categories;");
  });
});
