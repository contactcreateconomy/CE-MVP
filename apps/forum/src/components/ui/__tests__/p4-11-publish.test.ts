/* eslint-disable @typescript-eslint/no-explicit-any -- pure-gate + schema introspection tests */
import { describe, it, expect } from "vitest";

/* SLICE-P4-11 acceptance tests. The publish transaction is exercised live
 * (deployment push + the phase exit-gate E2E); here we pin the pure gate
 * functions (CAP-046 staleness + CAP-057 cap) and the new schema substrate.
 *
 * Sources: CAP-046/052/053/056/057 Notes; CONTRACT-4-editorial States F/G;
 * _data-model l.166-168. */

import schemaDefault from "../../../../../../convex/schema";
import * as publish from "../../../../../../convex/editorial/publish";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

describe("SLICE-P4-11 — schema substrate (bible l.166-168)", () => {
  it("postSocialDerivatives: 5 derivative types + export-only status set", () => {
    const t = schema.tables.postSocialDerivatives;
    expect(literalValues(fieldsOf(t).derivativeType).sort()).toEqual(
      ["hook", "linkedin", "shorts_caption", "teaser", "twitter"].sort(),
    );
    expect(literalValues(fieldsOf(t).status).sort()).toEqual(["edited", "exported", "generated", "stale"].sort());
    expect(hasField(t, "exportedByUserId")).toBe(true);
  });

  it("postAffiliateLinks: banner.labelType literals + the cap join fields", () => {
    const t = schema.tables.postAffiliateLinks;
    expect(literalValues(fieldsOf(t).labelType).sort()).toEqual(
      ["affiliate_partner", "createconomy_pick", "featured_tool", "popular_platform"].sort(),
    );
    for (const f of ["postId", "affiliateLinkId", "position", "injectedAt"]) {
      expect(hasField(t, f), `postAffiliateLinks.${f}`).toBe(true);
    }
  });

  it("module surface: publish pipeline + export are live", () => {
    expect((publish.publishCandidate as any).isAction).toBe(true);
    expect((publish.publishCandidate as any).isInternal).toBe(true);
    expect((publish.sweepScheduled as any).isAction).toBe(true);
    expect((publish.socialExport as any).isMutation).toBe(true);
    expect((publish.socialExport as any).isPublic).toBe(true);
  });
});

describe("SLICE-P4-11 — CAP-057 affiliate cap (pure)", () => {
  it("≤2 per post", () => {
    expect(publish.affiliateCapViolation([{ toolId: "a" }, { toolId: "b" }])).toBeNull();
    expect(publish.affiliateCapViolation([{ toolId: "a" }, { toolId: "b" }, { toolId: "c" }])).toMatch(/≤2\/post/);
  });

  it("≤1 per tool", () => {
    expect(publish.affiliateCapViolation([{ toolId: "a" }, { toolId: "a" }])).toMatch(/≤1\/tool/);
    expect(publish.affiliateCapViolation([{ toolId: "a" }, {}])).toBeNull();
  });
});

describe("SLICE-P4-11 — CAP-046 publish gate (pure)", () => {
  const base = { status: "scheduled", draft: { candidateRevision: 2 }, operatorId: "u1" };
  const passRun = { overallResult: "pass", candidateRevision: 2 };

  it("scheduled + passing current-revision run + approver → no failure", () => {
    expect(publish.publishGateFailure({ candidate: base, latestRun: passRun })).toBeNull();
  });

  it("stale qualification (draft edited after the run) blocks — edits can reintroduce copy", () => {
    expect(
      publish.publishGateFailure({ candidate: base, latestRun: { overallResult: "pass", candidateRevision: 1 } }),
    ).toMatch(/stale qualification/);
  });

  it("failing or missing run blocks; non-scheduled blocks; missing approver blocks", () => {
    expect(publish.publishGateFailure({ candidate: base, latestRun: { overallResult: "fail", candidateRevision: 2 } })).toMatch(/CAP-046/);
    expect(publish.publishGateFailure({ candidate: base, latestRun: null })).toMatch(/no qualification run/);
    expect(publish.publishGateFailure({ candidate: { ...base, status: "approved" }, latestRun: passRun })).toMatch(/≠ scheduled/);
    expect(publish.publishGateFailure({ candidate: { ...base, operatorId: undefined }, latestRun: passRun })).toMatch(/approver/);
  });

  it("CAP-057 cap is enforced inside the publish gate (inject 3 → publish blocked)", () => {
    const withThree = { ...base, draft: { candidateRevision: 2, plannedAffiliateLinks: [{ toolId: "a" }, { toolId: "b" }, { toolId: "c" }] } };
    expect(publish.publishGateFailure({ candidate: withThree, latestRun: passRun })).toMatch(/CAP-057/);
  });
});
