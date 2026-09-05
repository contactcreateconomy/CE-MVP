/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection: Convex runtime validator objects are untyped at the edge */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* SLICE-P4-05 acceptance tests — R-AGG delta math (the precision item),
 * recompute exclusion rule (CAP-114 binding), auto-flag thresholds
 * (CAP-533), R-STAFF eligibility, args mirroring, and guard registration.
 * The mutation handlers themselves are Convex FunctionReferences — full
 * handler-path verification (R-ONE index hit, moderation case write,
 * archived-tool rejection) requires a deployment push (DEV-HANDOFF #4).
 *
 * Sources: CAP-112/113/115/116/117/533/535 Notes; CONTRACT-2-tool-profile
 * §1-4; bible l.144 (toolRatings), l.354 (dimension enum), l.263 (alerts). */

import * as toolRatingsModule from "../../../../../../convex/toolRatings";
import * as toolsModule from "../../../../../../convex/tools";
import * as authzModule from "../../../../../../convex/lib/authz";

const { aggDelta, recomputeFromRatings, shouldAutoFlag, ratingActorEligibility, isAggregateEligible } =
  toolRatingsModule;

const full = (overall: number, dims: Record<string, number | "not_applicable"> = {}) => ({
  overallScore: overall,
  dimensionScores: {
    ease_of_use: 5, output_quality: 4, reliability: 3, value_for_money: 2,
    ...dims,
  } as any,
});

function argsOf(fn: any): Record<string, { fieldType: any; optional: boolean }> {
  return JSON.parse(fn.exportArgs()).value;
}

describe("SLICE-P4-05 — R-AGG delta math (aggDelta — the precision item)", () => {
  it("submit (null→next): increments sum/count; N/A increments neither sum nor count", () => {
    const d = aggDelta(null, full(4, { value_for_money: "not_applicable" }));
    expect(d.ratingSum).toBe(4);
    expect(d.ratingCount).toBe(1);
    expect(d.dimensionSums).toEqual({ ease_of_use: 5, output_quality: 4, reliability: 3, value_for_money: 0 });
    expect(d.dimensionCounts).toEqual({ ease_of_use: 1, output_quality: 1, reliability: 1, value_for_money: 0 });
  });

  it("withdraw (prior→null): exact decrement", () => {
    const d = aggDelta(full(4), null);
    expect(d.ratingSum).toBe(-4);
    expect(d.ratingCount).toBe(-1);
    expect(d.dimensionSums.ease_of_use).toBe(-5);
    expect(d.dimensionCounts.value_for_money).toBe(-1);
  });

  it("update (prior→next): prior→new eligible delta applied atomically (CAP-113)", () => {
    const prior = full(3, { reliability: 2 });
    const next = full(5, { reliability: 4, value_for_money: "not_applicable" });
    const d = aggDelta(prior, next);
    expect(d.ratingSum).toBe(2); // 5 − 3
    expect(d.ratingCount).toBe(0); // still one rating
    expect(d.dimensionSums.reliability).toBe(2); // 4 − 2
    expect(d.dimensionCounts.value_for_money).toBe(-1); // numeric → N/A: count leaves
    expect(d.dimensionSums.value_for_money).toBe(-2); // …and its sum leaves
  });

  it("N/A → numeric transition brings the dimension back in", () => {
    const prior = full(3, { value_for_money: "not_applicable" });
    const next = full(3, { value_for_money: 4 });
    const d = aggDelta(prior, next);
    expect(d.dimensionSums.value_for_money).toBe(4);
    expect(d.dimensionCounts.value_for_money).toBe(1);
  });

  it("eligibility masking: ineligible sides contribute nothing (CAP-114 transitions)", () => {
    // held → passed (moderation restore): prior masked to null → only add
    const d = aggDelta(null, full(4));
    expect(d.ratingSum).toBe(4);
    // passed → held: next masked to null → only remove
    const d2 = aggDelta(full(4), null);
    expect(d2.ratingSum).toBe(-4);
  });

  it("round-trip identity: add then withdraw nets zero across every field", () => {
    const r = full(4, { output_quality: 2 });
    const add = aggDelta(null, r);
    const remove = aggDelta(r, null);
    for (const key of ["ratingSum", "ratingCount"] as const) {
      expect(add[key] + remove[key]).toBe(0);
    }
    for (const dim of ["ease_of_use", "output_quality", "reliability", "value_for_money"] as const) {
      expect(add.dimensionSums[dim] + remove.dimensionSums[dim]).toBe(0);
      expect(add.dimensionCounts[dim] + remove.dimensionCounts[dim]).toBe(0);
    }
  });
});

describe("SLICE-P4-05 — recompute (CAP-115) + exclusion rule (CAP-114 binding)", () => {
  const rating = (over: number, status = "active", mod = "passed") =>
    ({ ...full(over), status, moderationStatus: mod });

  it("held/removed/withdrawn excluded from aggregate regardless of score (quoted)", () => {
    const rebuilt = recomputeFromRatings([
      rating(5),
      rating(1, "active", "held"),
      rating(1, "active", "removed"),
      rating(1, "withdrawn", "passed"),
    ]);
    expect(rebuilt.ratingSum).toBe(5);
    expect(rebuilt.ratingCount).toBe(1);
  });

  it("isAggregateEligible = active AND passed exactly", () => {
    expect(isAggregateEligible({ status: "active", moderationStatus: "passed" })).toBe(true);
    expect(isAggregateEligible({ status: "active", moderationStatus: "held" })).toBe(false);
    expect(isAggregateEligible({ status: "withdrawn", moderationStatus: "passed" })).toBe(false);
  });

  it("recompute folds N/A dims into neither sum nor count (INV-3)", () => {
    const rebuilt = recomputeFromRatings([rating(3, "active", "passed")]);
    // full() defaults value_for_money: 2 — override to N/A
    const rebuiltNa = recomputeFromRatings([
      { ...full(3, { value_for_money: "not_applicable" }), status: "active", moderationStatus: "passed" },
    ]);
    expect(rebuilt.dimensionSums.value_for_money).toBe(2);
    expect(rebuiltNa.dimensionSums.value_for_money).toBe(0);
    expect(rebuiltNa.dimensionCounts.value_for_money).toBe(0);
  });
});

describe("SLICE-P4-05 — auto-flag (CAP-533: velocity + outlier, config-driven)", () => {
  const base = {
    overallScore: 3,
    currentRatingCount: 10,
    currentRatingSum: 40, // avg 4.0
    recentSubmissions: 1,
    velocityPerHour: 10,
    outlierAbsDeviation: 3.5,
  };

  it("velocity breach flags with the velocity reason code", () => {
    const r = shouldAutoFlag({ ...base, recentSubmissions: 10 });
    expect(r).toEqual({ flag: true, reasonCode: "auto_rating_velocity" });
  });

  it("outlier breach flags (|score − avg| ≥ threshold)", () => {
    const r = shouldAutoFlag({ ...base, overallScore: 1 }); // |1−4| = 3 < 3.5 → no
    expect(r.flag).toBe(false);
    const r2 = shouldAutoFlag({ ...base, overallScore: 1, outlierAbsDeviation: 3 }); // |1−4| = 3 ≥ 3
    expect(r2).toEqual({ flag: true, reasonCode: "auto_rating_outlier" });
  });

  it("outlier check requires an existing aggregate (ratingCount=0 → no deviation baseline)", () => {
    const r = shouldAutoFlag({ ...base, currentRatingCount: 0, currentRatingSum: 0, overallScore: 1 });
    expect(r.flag).toBe(false);
  });

  it("threshold rows seeded: both keys are tier2 m5 numbers with bounds", () => {
    const rows = toolRatingsModule.AUTOFLAG_REGISTRY_ROWS;
    expect(rows.map((r: any) => r.key).sort()).toEqual([
      "tools.ratings.autoflag.outlierAbsDeviation",
      "tools.ratings.autoflag.velocityPerHour",
    ]);
    for (const row of rows) {
      expect(row.module).toBe("m5");
      expect(row.editTier).toBe("tier2");
      expect(typeof row.default).toBe("number");
      expect(row.min).toBeLessThanOrEqual(row.default);
      expect(row.default).toBeLessThanOrEqual(row.max);
    }
  });
});

describe("SLICE-P4-05 — R-STAFF (server-side reject, not UI-hide)", () => {
  it("every privileged role is rejected with RATING_STAFF_FORBIDDEN", () => {
    for (const role of ["editor", "publisher", "moderator", "storeOperator", "supportOperator", "administrator"]) {
      const r = ratingActorEligibility([role]);
      expect(r.allowed, role).toBe(false);
      expect(r.reason).toContain("RATING_STAFF_FORBIDDEN");
    }
  });

  it("plain members (and no-role users) are allowed", () => {
    expect(ratingActorEligibility([]).allowed).toBe(true);
    expect(ratingActorEligibility(["member"]).allowed).toBe(true);
  });
});

describe("SLICE-P4-05 — args mirroring + module surface", () => {
  it("submit/update mirror the toolRatings score validators (1-5 enforced in-handler)", () => {
    for (const fn of [toolRatingsModule.submit, toolRatingsModule.update] as any[]) {
      const a = argsOf(fn);
      expect(a.overallScore.fieldType.type).toBe("number");
      const dims = JSON.parse(fn.exportArgs()).value.dimensionScores.fieldType.value;
      expect(Object.keys(dims).sort()).toEqual(
        ["ease_of_use", "output_quality", "reliability", "value_for_money"].sort(),
      );
      const vfm = dims.value_for_money.fieldType;
      expect(vfm.value.map((alt: any) => alt.type).sort()).toEqual(["literal", "number"]);
      expect(vfm.value.find((alt: any) => alt.type === "literal").value).toBe("not_applicable");
    }
  });

  it("submit/update/withdraw are public mutations; withdraw takes only ratingId (register-unnamed, flagged)", () => {
    for (const fn of [toolRatingsModule.submit, toolRatingsModule.update, toolRatingsModule.withdraw]) {
      expect((fn as any).isMutation).toBe(true);
      expect((fn as any).isPublic).toBe(true);
    }
    expect(Object.keys(argsOf(toolRatingsModule.withdraw))).toEqual(["ratingId"]);
    expect(argsOf(toolRatingsModule.withdraw).ratingId.fieldType.tableName).toBe("toolRatings");
  });

  it("CAP-535 setEditorialVerdict + CAP-115 recompute + CAP-116 driftCheck exported from tools", () => {
    expect((toolsModule.setEditorialVerdict as any).isMutation).toBe(true);
    expect((toolsModule.recomputeAggregate as any).isMutation).toBe(true);
    expect((toolsModule.recomputeAggregate as any).isInternal).toBe(true); // internal
    expect((toolsModule.driftCheck as any).isMutation).toBe(true);
    expect((toolsModule.driftCheck as any).isInternal).toBe(true); // internal
    const a = argsOf(toolsModule.setEditorialVerdict);
    expect(a.toolId.fieldType.tableName).toBe("tools");
    expect(a.score.fieldType.type).toBe("union"); // number | null (clear)
    // editorial verdict write NEVER accepts aggregate fields (DEC-M5-AGG)
    for (const forbidden of ["ratingSum", "ratingCount", "dimensionSums", "dimensionCounts"]) {
      expect(a[forbidden]).toBeUndefined();
    }
  });

  it("rate_tool is a protected capability (contract §1 gate; CAP-393 tension flagged)", () => {
    expect(authzModule.PROTECTED_CAPABILITIES).toContain("rate_tool");
  });

  it("api.d.ts maps the toolRatings module", () => {
    const apiDts = readFileSync(
      resolve(__dirname, "../../../../../../convex/_generated/api.d.ts"),
      "utf8",
    );
    expect(apiDts).toContain('import type * as toolRatings from "../toolRatings.js"');
    expect(apiDts).toContain("toolRatings: typeof toolRatings;");
  });
});
