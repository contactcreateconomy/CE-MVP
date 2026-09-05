/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection: Convex runtime validator objects are untyped at the edge */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* SLICE-P4-03 acceptance tests — tags taxonomy exposure (CAP-534) + member
 * tag set/edit (CAP-530). The mutation/query handlers are Convex
 * FunctionReferences (not directly invokable in vitest); the schema, the
 * args validators (mirroring discipline), the pure diff-sync logic, and the
 * registry seed are tested here. Handler-path verification (active-status
 * filter, author gate, audit write) requires a deployment push (Bucket-1,
 * DEV-HANDOFF #4).
 *
 * Sources: CAP-530/534 Notes; CONTRACT-2-compose §2 Tags + §4 Action 7;
 * bible l.72 (tags controlled taxonomy, join tables only). */


import schemaDefault from "../../../../../../convex/schema";
import * as tagsModule from "../../../../../../convex/tags";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const indexNames = (t: any) => (t.indexes ?? []).map((i: any) => i.indexDescriptor);

/** Parse a Convex function's exported args validator (JSON descriptor). */
function argsOf(fn: any): Record<string, { fieldType: any; optional: boolean }> {
  return JSON.parse(fn.exportArgs()).value;
}

describe("SLICE-P4-03 — tags schema (bible l.72)", () => {
  it("tags: controlled taxonomy field list (slug, name, tagType, color, sortOrder, status)", () => {
    const t = schema.tables.tags;
    for (const f of ["slug", "name", "tagType", "color", "sortOrder", "status"]) {
      expect(hasField(t, f), `tags.${f}`).toBe(true);
    }
    expect(indexNames(t)).toContain("by_slug");
  });

  it("postTags: join row is (postId → posts, tagId → tags, createdAt) with by_postId_tagId", () => {
    const t = schema.tables.postTags;
    expect(fieldsOf(t).postId.kind).toBe("id");
    expect(fieldsOf(t).postId.tableName).toBe("posts");
    expect(fieldsOf(t).tagId.kind).toBe("id");
    expect(fieldsOf(t).tagId.tableName).toBe("tags");
    expect(fieldsOf(t).createdAt.kind).toBe("float64"); // v.number() runtime kind
    expect(indexNames(t)).toContain("by_postId_tagId");
  });

  it("no tagIds[] anywhere (bible: join tables are the ONLY canonical tag relationship)", () => {
    expect(hasField(schema.tables.posts, "tagIds")).toBe(false);
    expect(hasField(schema.tables.postTags, "tagIds")).toBe(false);
  });
});

describe("SLICE-P4-03 — args mirror the postTags schema validators (standing instruction)", () => {
  it("setPostTags: postId is v.id('posts'), tagIds is v.array(v.id('tags'))", () => {
    const args = argsOf(tagsModule.setPostTags);
    expect(args.postId.fieldType.type).toBe("id");
    expect(args.postId.fieldType.tableName).toBe("posts");
    expect(args.tagIds.fieldType.type).toBe("array");
    expect(args.tagIds.fieldType.value.type).toBe("id");
    expect(args.tagIds.fieldType.value.tableName).toBe("tags");
  });

  it("getPostTags: postId is v.id('posts')", () => {
    const args = argsOf(tagsModule.getPostTags);
    expect(args.postId.fieldType.type).toBe("id");
    expect(args.postId.fieldType.tableName).toBe("posts");
  });

  it("CAP-530 free-text rejection: no string-typed tag input exists in any args", () => {
    // The taxonomy constraint is server-enforced at the boundary: the only
    // accepted tag input is tags-table ids. A free-text value ("tag names",
    // slugs, labels) fails Convex validation before the handler runs.
    for (const fn of [tagsModule.setPostTags, tagsModule.getPostTags]) {
      for (const field of Object.values(argsOf(fn))) {
        expect(field.fieldType.type, "no free-text tag input").not.toBe("string");
      }
    }
    // And the module exposes no taxonomy write path for members
    for (const forbidden of ["createTag", "updateTag", "deleteTag", "submitTag", "addTag"]) {
      expect(Object.keys(tagsModule)).not.toContain(forbidden);
    }
  });
});

describe("SLICE-P4-03 — module surface", () => {
  it("exports listTaxonomy (query), getPostTags (query), setPostTags (mutation)", () => {
    expect((tagsModule.listTaxonomy as any).isQuery).toBe(true);
    expect((tagsModule.getPostTags as any).isQuery).toBe(true);
    expect((tagsModule.setPostTags as any).isMutation).toBe(true);
    expect((tagsModule.setPostTags as any).isPublic).toBe(true);
  });
});

describe("SLICE-P4-03 — diffTagSets (CAP-530 join-row sync logic)", () => {
  const { diffTagSets } = tagsModule;

  it("no-op when sets are equal", () => {
    expect(diffTagSets(["a", "b"], ["b", "a"])).toEqual({ added: [], removed: [] });
  });

  it("adds new ids and removes dropped ids", () => {
    expect(diffTagSets(["a", "b"], ["b", "c"])).toEqual({ added: ["c"], removed: ["a"] });
  });

  it("full replace on first set (existing empty)", () => {
    expect(diffTagSets([], ["x", "y"])).toEqual({ added: ["x", "y"], removed: [] });
  });

  it("full clear (submitted empty)", () => {
    expect(diffTagSets(["x", "y"], [])).toEqual({ added: [], removed: ["x", "y"] });
  });

  it("treats the selection as a set (duplicate submissions collapse)", () => {
    expect(diffTagSets([], ["x", "x", "y"])).toEqual({ added: ["x", "y"], removed: [] });
  });
});

describe("SLICE-P4-03 — CAP-534 admin flag rides the config registry", () => {
  it("TAXONOMY_REGISTRY_ROW: tags.taxonomy.editable (boolean, default true, tier2, m4, unsealed)", () => {
    const row = tagsModule.TAXONOMY_REGISTRY_ROW;
    expect(row.key).toBe("tags.taxonomy.editable");
    expect(row.valueType).toBe("boolean");
    expect(row.default).toBe(true);
    expect(row.editTier).toBe("tier2");
    expect(row.module).toBe("m4");
    expect(row.sealed).toBe(false);
    expect(row.blastRadius.length).toBeGreaterThan(0);
  });
});

describe("SLICE-P4-03 — generated api registration (hand-extended until codegen push)", () => {
  it("api.d.ts maps the tags module (picker consumes api.tags.listTaxonomy)", () => {
    const apiDts = readFileSync(
      resolve(__dirname, "../../../../../../convex/_generated/api.d.ts"),
      "utf8",
    );
    expect(apiDts).toContain('import type * as tags from "../tags.js"');
    expect(apiDts).toContain("tags: typeof tags;");
  });

  it("api.d.ts maps the posts module (P4-02's registration, restored alongside)", () => {
    const apiDts = readFileSync(
      resolve(__dirname, "../../../../../../convex/_generated/api.d.ts"),
      "utf8",
    );
    expect(apiDts).toContain('import type * as posts from "../posts.js"');
    expect(apiDts).toContain("posts: typeof posts;");
  });
});
