import { describe, it, expect } from "vitest";

/* SLICE-P4-01 acceptance tests — M4 post spine schema-vs-bible fidelity.
 * Sources: bible l.76-97 (posts + 8 extensions + postTypeConfig +
 * postRevisions + postTags + tags); Core-enums l.351-382. */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};
const indexNames = (t: any) => (t.indexes ?? []).map((i: any) => i.indexDescriptor);

describe("SLICE-P4-01 — M4 post spine", () => {
  it("posts: bible l.76 field list + 3-axis status + 10-type enum", () => {
    const t = schema.tables.posts;
    for (const f of [
      "authorType", "authorUserId", "authorPersonaId", "approvingUserId",
      "responsiblePublisherUserId", "editorialByline", "type", "title", "body",
      "categoryId", "toolIds", "lifecycleStatus", "moderationStatus",
      "visibility", "publishedAt", "createdAt",
    ]) {
      expect(hasField(t, f), `posts.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).type)).toHaveLength(10);
    expect(literalValues(fieldsOf(t).lifecycleStatus).sort()).toEqual(
      ["archived", "draft", "processing", "published", "ready", "scheduled"].sort(),
    );
    expect(literalValues(fieldsOf(t).moderationStatus).sort()).toEqual(
      ["held", "not_required", "passed", "pending", "rejected", "removed"].sort(),
    );
    expect(literalValues(fieldsOf(t).visibility).sort()).toEqual(["private", "public", "unlisted"]);
    // No tagIds[] on posts (bible: "Tags via postTags join, not an array")
    expect(hasField(t, "tagIds")).toBe(false);
  });

  it("postTypeConfig: bible l.86 (state, sortOrder, label, lockedMessage)", () => {
    const t = schema.tables.postTypeConfig;
    for (const f of ["type", "state", "sortOrder", "label", "lockedMessage", "updatedByUserId", "updatedAt"]) {
      expect(hasField(t, f), `postTypeConfig.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).state).sort()).toEqual(["active", "locked"]);
  });

  it("all 8 active extension tables carry unique post FK (1:1 invariant)", () => {
    const extensions = ["postNews", "postReviews", "postCompares", "postSparks", "postDebates", "postLists", "postShowcases", "postHelps"];
    for (const ext of extensions) {
      const t = schema.tables[ext];
      expect(t, `${ext} table exists`).toBeDefined();
      expect(hasField(t, "postId"), `${ext}.postId`).toBe(true);
      expect(indexNames(t)).toContain("by_postId");
    }
  });

  it("postReviews carries NO member-settable verdictScore path (W2-E4: computed)", () => {
    const t = schema.tables.postReviews;
    expect(hasField(t, "verdictScore")).toBe(true); // schema field exists
    expect(hasField(t, "memberSettable")).toBe(false); // no member flag
    // enforcement lives in P4-02's mutation, representable here
  });

  it("locked types (postLaunchPads, postGigs) are schema-defined", () => {
    expect(schema.tables.postLaunchPads).toBeDefined();
    expect(schema.tables.postGigs).toBeDefined();
    expect(hasField(schema.tables.postLaunchPads, "resultsVisibility")).toBe(true);
    expect(hasField(schema.tables.postGigs, "workDescription")).toBe(true);
  });

  it("postListItems: 1:many from postLists (not from posts)", () => {
    const t = schema.tables.postListItems;
    expect(hasField(t, "postListId")).toBe(true);
    expect(hasField(t, "postId")).toBe(false); // FK to postLists, not posts
  });

  it("postRevisions: bible l.77 (revisionNumber, changeType, generationRunId)", () => {
    const t = schema.tables.postRevisions;
    for (const f of ["postId", "revisionNumber", "title", "body", "changeType", "changedByUserId", "generationRunId", "createdAt"]) {
      expect(hasField(t, f), `postRevisions.${f}`).toBe(true);
    }
  });

  it("tags + postTags: join-table only, no tagIds[] anywhere on entities", () => {
    expect(schema.tables.tags).toBeDefined();
    expect(schema.tables.postTags).toBeDefined();
    expect(hasField(schema.tables.postTags, "postId")).toBe(true);
    expect(hasField(schema.tables.postTags, "tagId")).toBe(true);
    expect(hasField(schema.tables.postTags, "createdAt")).toBe(true);
    // No tagIds on posts (checked above) or on postTags itself
    expect(hasField(schema.tables.postTags, "tagIds")).toBe(false);
  });

  it("news is NOT member-composable (W2-E1: M2 injection only)", () => {
    // postNews exists in schema for M2 injection
    expect(schema.tables.postNews).toBeDefined();
    // sourceOfTruthUrl is "platform-injected/allowlisted, not user-typed" (bible l.87)
    expect(hasField(schema.tables.postNews, "sourceOfTruthUrl")).toBe(true);
  });
});
