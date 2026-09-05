/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection + module-surface tests */
import { describe, it, expect } from "vitest";

/* SLICE-P4-13 acceptance tests. The full render path exercises live once
 * candidates publish (phase exit-gate E2E); here we pin the schema
 * substrate (bible l.93–99/166), the module surface, and the reading
 * posture invariants that are statically checkable.
 *
 * Sources: CAP-089/090/091/092/106/107 Notes; CONTRACT-2-post-detail. */

import schemaDefault from "../../../../../../convex/schema";
import * as detail from "../../../../../../convex/posts/detail";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};
const indexesOf = (t: any): string[] => (t.indexes ?? []).map((i: any) => i.indexDescriptor);

describe("SLICE-P4-13 — schema substrate (bible l.93-99, l.166)", () => {
  it("postSeoMeta: slug is the route key with its index; canonicalUrl self", () => {
    const t = schema.tables.postSeoMeta;
    for (const f of ["postId", "seoTitle", "seoDescription", "slug", "keywords", "canonicalUrl", "structuredDataType", "manuallyEdited", "generatedAt"]) {
      expect(hasField(t, f), `postSeoMeta.${f}`).toBe(true);
    }
    expect(indexesOf(t)).toContain("by_slug");
  });

  it("debateVotes: choice enum + (userId, postId) pair index", () => {
    const t = schema.tables.debateVotes;
    expect(literalValues(fieldsOf(t).choice).sort()).toEqual(["abstain", "agree", "disagree"].sort());
    expect(indexesOf(t)).toContain("by_user_post");
  });

  it("listItemVotes: (userId, postListItemId) pair index", () => {
    const t = schema.tables.listItemVotes;
    expect(indexesOf(t)).toContain("by_user_item");
  });
});

describe("SLICE-P4-13 — module surface + posture", () => {
  it("getDetail/listByType are public reads; softDelete is a public mutation", () => {
    expect((detail.getDetail as any).isQuery).toBe(true);
    expect((detail.getDetail as any).isPublic).toBe(true);
    expect((detail.listByType as any).isQuery).toBe(true);
    expect((detail.softDelete as any).isMutation).toBe(true);
    expect((detail.softDelete as any).isPublic).toBe(true);
  });

  it("listByType consumes the Convex pagination contract (cursor pages)", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("../../convex/posts/detail.ts", "utf8");
    expect(src).toMatch(/paginationOptsValidator/);
    expect(src).toMatch(/\.paginate\(args\.paginationOpts\)/);
  });

  it("route posture: the page declares Wave-2 noindex (FATAL-M17-01 — flip only pairs with P7G-01/P7T-11)", async () => {
    const fs = await import("node:fs");
    const page = fs.readFileSync("src/app/(app)/discussions/[slug]/page.tsx", "utf8");
    expect(page).toMatch(/index:\s*false/);
    expect(page).toMatch(/noindex in Wave 2/i);
  });
});
