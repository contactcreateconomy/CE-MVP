/* eslint-disable @typescript-eslint/no-explicit-any -- pure-evaluator fixtures + source-level guards */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* SLICE-P4-09 acceptance tests. THE ENTAILMENT LOOP (543→045→542→043) is
 * the FATAL-adjacent integrity spine — every link is quoted acceptance and
 * each is tested here at the pure-function/source-guard level. GLM paths
 * need a deployment push + GLM_API_KEY (DEV-HANDOFF #4/#8).
 *
 * Sources: CAP-038/039/040/041/045/542/543 Notes; CONTRACT-4-editorial
 * §1-§4 + the 2026-09-04 A10 addendum (DECISIONS-LOCKED #10). */

import * as forgeModule from "../../../../../../convex/forge";
import * as reviewModule from "../../../../../../convex/editorial/review";

const goodForge = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    draft: {
      title: "The story in new words",
      body: "A fresh synthesis of the sourced material with original phrasing and structure.",
      postType: "news",
    },
    assertions: [
      {
        assertionText: "The release shipped in June.",
        sourceClaimIds: ["k1", "k2"],
        exactValidation: { numbers: "pass", dates: "pass", quotes: "pass", entities: "pass" },
      },
    ],
    ...overrides,
  });

describe("SLICE-P4-09 — CAP-038/039 parseForgeResponse (pure)", () => {
  it("accepts a grounded draft: title/body/postType + cited assertions", () => {
    const out = forgeModule.parseForgeResponse(goodForge());
    expect(out.postType).toBe("news");
    expect(out.assertions[0].sourceClaimIds).toEqual(["k1", "k2"]);
  });

  it("NEVER emits URLs: a URL-bearing body is rejected, not stripped (CAP-038)", () => {
    const withUrl = goodForge({
      draft: { title: "t", body: "read more at https://example.com", postType: "news" },
    });
    expect(() => forgeModule.parseForgeResponse(withUrl)).toThrow(/never emits URLs/);
    const bareDomain = goodForge({
      draft: { title: "t", body: "see example.com for details", postType: "news" },
    });
    expect(() => forgeModule.parseForgeResponse(bareDomain)).toThrow(/never emits URLs/);
  });

  it("every factual assertion must cite claims (CAP-039) — uncited/empty rejects", () => {
    const uncited = goodForge({ assertions: [{ assertionText: "Uncited.", sourceClaimIds: [] }] });
    expect(() => forgeModule.parseForgeResponse(uncited)).toThrow(/sourceClaimIds/);
    expect(() => forgeModule.parseForgeResponse(goodForge({ assertions: [] }))).toThrow(/no assertions/);
  });

  it("missing draft fields reject (strict JSON shape)", () => {
    expect(() => forgeModule.parseForgeResponse("{}")).toThrow(/title/);
    expect(() => forgeModule.parseForgeResponse("not json")).toThrow();
  });
});

describe("SLICE-P4-09 — the entailment loop (FATAL-adjacent integrity spine)", () => {
  it("CAP-043 gate (quoted): approve impossible while ANY ref is false or unset", () => {
    const { canApprove } = reviewModule;
    expect(canApprove([{ operatorConfirmed: true }, { operatorConfirmed: true }])).toBe(true);
    expect(canApprove([{ operatorConfirmed: true }, { operatorConfirmed: false }])).toBe(false);
    // "unset" — CAP-043 treats unset as blocking; the loader returns the
    // stored boolean (false at birth), and absence blocks via length:
    expect(canApprove([])).toBe(false); // no refs confirmed nothing — nothing to approve
  });

  it("CAP-543 reset (quoted): ALL operatorConfirmed flip to false — prior confirmations do not survive", () => {
    const refs = [
      { id: "a", operatorConfirmed: true },
      { id: "b", operatorConfirmed: true },
      { id: "c", operatorConfirmed: false },
    ];
    const reset = reviewModule.resetAllConfirmations(refs);
    expect(reset.every((r) => r.operatorConfirmed === false)).toBe(true); // FULL reset, never surgical
    expect(reset).toHaveLength(3);
  });

  it("loop integrity at the source level: editDraft resets ALL refs + schedules CAP-045 re-qualify", () => {
    const src = readFileSync(resolve(__dirname, "../../../../../../convex/editorial/review.ts"), "utf8");
    // FULL reset inside the edit transaction
    expect(src).toContain('await ctx.db.patch(ref._id, { operatorConfirmed: false, candidateRevision: nextRevision });');
    // CAP-045 re-qualify wired (scheduler bridge; only CAP-040 says "synchronously" — flagged reading)
    expect(src).toContain("scheduler.runAfter(0, internal.qualify.orchestrator.run");
  });

  it("CAP-040 wired at the source level: forge calls qualify in the same execution", () => {
    const src = readFileSync(resolve(__dirname, "../../../../../../convex/forge.ts"), "utf8");
    expect(src).toContain('await ctx.runAction(internal.qualify.orchestrator.run');
    // CAP-038 provenance: generationRuns.inputClaims recorded (INV-1)
    expect(src).toContain("inputClaims: args.inputClaimIds");
  });

  it("loop sequence sanity: reset → re-confirm is the only path back to canApprove", () => {
    const confirmed = [{ operatorConfirmed: true }, { operatorConfirmed: true }];
    expect(reviewModule.canApprove(confirmed)).toBe(true);
    const afterEdit = reviewModule.resetAllConfirmations(confirmed);
    expect(reviewModule.canApprove(afterEdit)).toBe(false); // edit kills the gate
    const reconfirmed = afterEdit.map((r) => ({ ...r, operatorConfirmed: true })); // CAP-542, claim by claim
    expect(reviewModule.canApprove(reconfirmed)).toBe(true);
  });
});

describe("SLICE-P4-09 — module surface + registration", () => {
  it("forge.draft is an internal action (System; cron/queue-triggered, not user-fired)", () => {
    expect((forgeModule.draft as any).isAction).toBe(true);
    expect((forgeModule.draft as any).isInternal).toBe(true);
    expect((forgeModule.persistForgedCandidate as any).isMutation).toBe(true);
    expect((forgeModule.markReviewable as any).isMutation).toBe(true);
  });

  it("review surface: candidateReview + queueList queries; confirmClaimRef + editDraft mutations (Editor-gated)", () => {
    expect((reviewModule.candidateReview as any).isQuery).toBe(true);
    expect((reviewModule.queueList as any).isQuery).toBe(true);
    expect((reviewModule.confirmClaimRef as any).isMutation).toBe(true);
    expect((reviewModule.confirmClaimRef as any).isPublic).toBe(true);
    expect((reviewModule.editDraft as any).isMutation).toBe(true);
    expect((reviewModule.editDraft as any).isPublic).toBe(true);
  });

  it("confirmClaimRef args mirror draftClaimRefs (refId → draftClaimRefs, boolean flag)", () => {
    const args = JSON.parse((reviewModule.confirmClaimRef as any).exportArgs()).value;
    expect(args.refId.fieldType.tableName).toBe("draftClaimRefs");
    expect(args.operatorConfirmed.fieldType.type).toBe("boolean");
  });

  it("editDraft is review-state-gated and takes title+body (manual edit, NOT regen)", () => {
    const src = readFileSync(resolve(__dirname, "../../../../../../convex/editorial/review.ts"), "utf8");
    expect(src).toContain("≠ review");
    // no GLM call, no generationRuns row (CAP-543 distinct from CAP-042)
    expect(src).not.toContain("glmForge");
    expect(src).not.toMatch(/insert\("generationRuns"\)/);
  });

  it("api.d.ts maps forge + editorial modules", () => {
    const apiDts = readFileSync(resolve(__dirname, "../../../../../../convex/_generated/api.d.ts"), "utf8");
    expect(apiDts).toContain("forge: typeof forge;");
    expect(apiDts).toContain('"editorial/review": typeof editorial_review;');
  });
});
