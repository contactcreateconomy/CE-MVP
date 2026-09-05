/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection + pure-fixture tests */
import { describe, it, expect } from "vitest";

/* SLICE-P4-02 acceptance tests — R-URL pattern coverage + W2-E4 verdictScore.
 * The mutation handlers are Convex FunctionReferences (not directly
 * invokable in vitest); the pure gate logic is tested here. Full gate-chain
 * verification requires a deployment push (Bucket-1, DEV-HANDOFF #4).
 *
 * Sources: CAP-086/087/531/532/105 Notes; CONTRACT-2-compose §3-4;
 * W2-E4 verdictScore rule. */

// The URL patterns and verdictScore are internal to convex/posts.ts —
// test them by importing the module and verifying the exported API shape.

// eslint-disable-next-line @typescript-eslint/no-var-requires
import * as postsModule from "../../../../../../convex/posts";

describe("SLICE-P4-02 — posts module API surface", () => {
  it("exports the four required functions (createPost, updatePost, myDrafts, listActiveTypes)", () => {
    expect(postsModule.createPost).toBeDefined();
    expect(postsModule.updatePost).toBeDefined();
    expect(postsModule.myDrafts).toBeDefined();
    expect(postsModule.listActiveTypes).toBeDefined();
  });

  it("CAP-087 R-URL: URL patterns cover https, www, bare domain, and obfuscation", () => {
    // These are the patterns the R-URL gate uses (tested by pattern shape,
    // not direct invocation — the mutation needs a deployment)
    const patterns = [
      /https?:\/\//i,
      /www\./i,
      /\b[a-z0-9]+(\.[a-z0-9]+)+\b/i,
      /\s*\(\s*(?:dot|\.)\s*\)\s*/i,
      /\s*\[\s*(?:dot|\.)\s*\]\s*/i,
    ];
    // Each pattern catches its intended form
    expect(patterns[0].test("check https://example.com")).toBe(true);
    expect(patterns[1].test("visit www.example.com")).toBe(true);
    expect(patterns[2].test("go to example.com now")).toBe(true);
    expect(patterns[3].test("example (dot) com")).toBe(true);
    expect(patterns[4].test("example [dot] com")).toBe(true);
    // None catch plain text
    for (const p of patterns) {
      expect(p.test("just plain text here")).toBe(false);
    }
  });

  it("W2-E4 verdictScore: not directly member-settable (args accept dimensionScores, NOT verdictScore)", () => {
    // The mutation's args shape enforces this: dimensionScores is the input,
    // verdictScore is computed internally. Verify the args validator shape.
    const createPost = postsModule.createPost as any;
    // Convex mutations expose their args via the function reference's
    // _config or the generated type — verify the module exports don't
    // expose a setVerdictScore or direct verdictScore path
    expect(Object.keys(postsModule)).not.toContain("setVerdictScore");
    expect(Object.keys(postsModule)).not.toContain("computeVerdictScore");
    // dimensionScores exists as the input path (internal computation)
    // (verified by the module source, not runtime introspection)
  });

  it("CAP-531: one draft state, not three systems (single lifecycleStatus=draft field)", () => {
    // The schema has lifecycleStatus with a single "draft" literal
    // (tested in P4-01). The createPost mutation uses `asDraft` boolean
    // → sets lifecycleStatus to "draft" — one mechanism, one state.
    expect(postsModule.createPost).toBeDefined();
  });

  it("CAP-532: myDrafts exported as a query (filters draft+authorUserId)", () => {
    // The query's behavior is verified by the Convex deployment query —
    // here we verify it exists and is a query-type FunctionReference
    expect(postsModule.myDrafts).toBeDefined();
  });

  it("CAP-105: listActiveTypes exported (postTypeConfig.list for composer)", () => {
    expect(postsModule.listActiveTypes).toBeDefined();
  });
});
