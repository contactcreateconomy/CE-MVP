/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection + module-surface tests */
import { describe, it, expect } from "vitest";

/* SLICE-P4-10 acceptance tests. The decision gates themselves are
 * server-enforced and exercised live (fail-closed probes); here we pin the
 * module surface, the CAP-042 literal, and the schema substrate the
 * decisions write.
 *
 * Sources: CAP-042/043/044/054 Notes; CONTRACT-4-editorial §4 rows 1/5/6/7;
 * _data-model l.149 (contentCandidates). */

import schemaDefault from "../../../../../../convex/schema";
import * as decisions from "../../../../../../convex/editorial/decisions";
import { canApprove } from "../../../../../../convex/editorial/review";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

describe("SLICE-P4-10 — contentCandidates substrate (bible l.149)", () => {
  it("status enum carries the 8 lifecycle literals incl. the decision targets", () => {
    expect(literalValues(fieldsOf(schema.tables.contentCandidates).status).sort()).toEqual(
      ["approved", "drafting", "extracting", "published", "rejected", "review", "scheduled", "submitted"].sort(),
    );
  });

  it("rejectionReason exists (CAP-044: required when status=rejected)", () => {
    expect(hasField(schema.tables.contentCandidates, "rejectionReason")).toBe(true);
  });

  it("claimClusterId is id-typed to claimClusters (post-P4-08 tightening)", () => {
    expect(fieldsOf(schema.tables.contentCandidates).claimClusterId.tableName).toBe("claimClusters");
  });
});

describe("SLICE-P4-10 — module surface + CAP literals", () => {
  it("decisions: approve/reject/schedule/regen are public mutations", () => {
    expect((decisions.candidateApprove as any).isMutation).toBe(true);
    expect((decisions.candidateApprove as any).isPublic).toBe(true);
    expect((decisions.candidateReject as any).isMutation).toBe(true);
    expect((decisions.candidateSchedule as any).isMutation).toBe(true);
    expect((decisions.candidateRegen as any).isMutation).toBe(true);
  });

  it("CAP-042 literal: GLM regen attempts ≤ 3 per candidate lineage", () => {
    expect(decisions.REGEN_ATTEMPTS_MAX).toBe(3);
  });

  it("CAP-043 invariant (shared with P4-09): unconfirmed or zero refs block approval", () => {
    expect(canApprove([{ operatorConfirmed: true }, { operatorConfirmed: true }])).toBe(true);
    expect(canApprove([{ operatorConfirmed: true }, { operatorConfirmed: false }])).toBe(false);
    expect(canApprove([{ operatorConfirmed: true }, ({} as any)])).toBe(false); // unset blocks
    expect(canApprove([])).toBe(false);
  });
});
