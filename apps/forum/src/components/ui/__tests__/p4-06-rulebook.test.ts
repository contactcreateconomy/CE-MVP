/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection: Convex runtime validator objects are untyped at the edge */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* SLICE-P4-06 acceptance tests — M3 schema fidelity (bible l.160-163), the
 * CAP-536 seed set, E1 bounds validation (validateThresholdConfig — the
 * out-of-bounds reject path), E2 structural H-TYPE validation, calibration
 * label shape, and module surface. Handler paths (administrator gate,
 * ruleVersion bump, audit fail-closed) need a deployment push (DEV-HANDOFF
 * #4) + seed runs (deploySeed, seed.bootstrap).
 *
 * Sources: CAP-084/085/536/537 Notes; CONTRACT-3-rulebook §1-§6 (E1-E5
 * resolutions); bible l.160-163; M3 sheet §8. */

import schemaDefault from "../../../../../../convex/schema";
import * as rulebookModule from "../../../../../../convex/rulebook";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const indexNames = (t: any) => (t.indexes ?? []).map((i: any) => i.indexDescriptor);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

function argsOf(fn: any): Record<string, { fieldType: any; optional: boolean }> {
  return JSON.parse(fn.exportArgs()).value;
}

describe("SLICE-P4-06 — M3 schema (bible l.160-163)", () => {
  it("qualificationRules: config row fields + ruleClass enum + by_ruleKey", () => {
    const t = schema.tables.qualificationRules;
    for (const f of [
      "ruleKey", "ruleVersion", "ruleClass", "severity", "enabled",
      "thresholdConfig", "applicablePostTypes", "updatedByUserId", "updatedAt",
    ]) {
      expect(hasField(t, f), `qualificationRules.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).ruleClass).sort()).toEqual(["hard", "soft"]);
    expect(fieldsOf(t).enabled.kind).toBe("boolean");
    expect(indexNames(t)).toContain("by_ruleKey");
  });

  it("qualificationRuns: immutable audit row (contentCandidateId, revisions, overallResult pass|fail)", () => {
    const t = schema.tables.qualificationRuns;
    for (const f of ["contentCandidateId", "candidateRevision", "rulebookVersion", "overallResult", "startedAt", "completedAt", "generationRunId"]) {
      expect(hasField(t, f), `qualificationRuns.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).overallResult).sort()).toEqual(["fail", "pass"]);
    expect(fieldsOf(t).generationRunId.isOptional).toBe("optional");
    expect(indexNames(t)).toContain("by_candidate");
    // tightened to v.id("contentCandidates") by SLICE-P4-07 (table now exists)
    expect(fieldsOf(t).contentCandidateId.kind).toBe("id");
    expect(fieldsOf(t).contentCandidateId.tableName).toBe("contentCandidates");
  });

  it("qualificationRuleResults: live/replay source discriminator (Wave-3 E4) + result enum", () => {
    const t = schema.tables.qualificationRuleResults;
    expect(literalValues(fieldsOf(t).source).sort()).toEqual(["live", "replay"]);
    expect(literalValues(fieldsOf(t).result).sort()).toEqual(["fail", "flag", "pass"]);
    expect(fieldsOf(t).qualificationRunId.tableName).toBe("qualificationRuns");
    expect(indexNames(t)).toContain("by_run");
    expect(indexNames(t)).toContain("by_source");
  });

  it("calibrationExamples: labeled set (snapshot + per-rule pass/fail labels)", () => {
    const t = schema.tables.calibrationExamples;
    for (const f of ["candidateSnapshot", "expectedOutcome", "addedByUserId", "addedAt"]) {
      expect(hasField(t, f), `calibrationExamples.${f}`).toBe(true);
    }
    expect(fieldsOf(t).addedByUserId.tableName).toBe("users");
    expect(indexNames(t)).toContain("by_addedAt");
  });
});

describe("SLICE-P4-06 — CAP-536 seed set", () => {
  it("seeds the five consolidated tunable rows (E1/E2-stamped set)", () => {
    expect(rulebookModule.SEED_RULES.map((r: any) => r.ruleKey).sort()).toEqual(
      ["H-CAT", "H-DUP", "H-SIM-semantic", "H-TYPE", "H-QUOTE"].sort(),
    );
    for (const rule of rulebookModule.SEED_RULES) {
      expect(rule.ruleClass).toBe("hard");
      expect(rule.enabled).toBe(true);
      expect((rule as any).ruleVersion).toBeUndefined(); // deploySeed sets v1 at insert
      expect(rule.applicablePostTypes).toHaveLength(8);
    }
  });

  it("every numeric seed value has a matching bounds row (E1: registry owns bounds)", () => {
    const boundsKeys = new Set(rulebookModule.RULEBOOK_REGISTRY_ROWS.map((r: any) => r.key));
    for (const rule of rulebookModule.SEED_RULES) {
      for (const key of Object.keys(rule.thresholdConfig as Record<string, unknown>)) {
        if (key === "requiredFieldsByType") continue; // E2 structural — no numeric bounds
        expect(boundsKeys.has(key), `${rule.ruleKey}: ${key} must have a registry bounds row`).toBe(true);
      }
    }
    // and every bounds row is used by some seed rule
    for (const row of rulebookModule.RULEBOOK_REGISTRY_ROWS) {
      const used = rulebookModule.SEED_RULES.some((r: any) => row.key in (r.thresholdConfig as object));
      expect(used, `bounds row ${row.key} unused by any seed rule`).toBe(true);
    }
  });

  it("H-TYPE default is the E2 structural mapping (8/8 types, verbatim fields)", () => {
    const def = rulebookModule.H_TYPE_DEFAULT;
    expect(Object.keys(def).sort()).toEqual(
      ["compare", "debate", "help", "list", "news", "review", "showcase", "spark"].sort(),
    );
    expect(def.review.sort()).toEqual(["tool", "verdict"]);
    expect(def.help).toEqual(["problemStatement"]);
    expect(def.spark).toEqual(["statement"]);
  });

  it("bounds rows are tier2 m3 numbers with min ≤ default ≤ max, none sealed", () => {
    for (const row of rulebookModule.RULEBOOK_REGISTRY_ROWS) {
      expect(row.module).toBe("m3");
      expect(row.valueType).toBe("number");
      expect(row.sealed).toBe(false);
      expect(row.min).toBeLessThanOrEqual(row.default as number);
      expect(row.default as number).toBeLessThanOrEqual(row.max);
    }
  });
});

describe("SLICE-P4-06 — validateThresholdConfig (CAP-084 E1, pure)", () => {
  const registry = Object.fromEntries(
    rulebookModule.RULEBOOK_REGISTRY_ROWS.map((r: any) => [r.key, r]),
  );

  it("accepts in-bounds values and returns them normalized", () => {
    const out = rulebookModule.validateThresholdConfig({ "rulebook.hcat.confidence": 0.7 }, registry);
    expect(out).toEqual({ "rulebook.hcat.confidence": 0.7 });
  });

  it("rejects out-of-bounds values (quoted: 'out-of-bounds → reject; audited')", () => {
    expect(() =>
      rulebookModule.validateThresholdConfig({ "rulebook.hcat.confidence": 1.5 }, registry),
    ).toThrow(/not in enumValues|max|< min|expected/i);
    expect(() =>
      rulebookModule.validateThresholdConfig({ "rulebook.hquote.maxQuoteWords": 5 }, registry), // 5 < min? min is 5 — ok
    ).not.toThrow();
    expect(() =>
      rulebookModule.validateThresholdConfig({ "rulebook.hquote.maxQuoteWords": 4 }, registry), // 4 < min 5
    ).toThrow();
  });

  it("rejects keys with no registry bounds row (E1: registry is the bounds owner)", () => {
    expect(() =>
      rulebookModule.validateThresholdConfig({ "rulebook.made.up.key": 1 }, registry),
    ).toThrow(/no configKeyRegistry bounds row/);
  });

  it("sealed economy keys can never pass (CAP-394 zero-intersection, belt-and-braces)", () => {
    for (const sealed of ["legitimacy.medianTarget", "signal.eventWeights", "signal.attributionSplit", "trust.weightCap"]) {
      expect(() => rulebookModule.validateThresholdConfig({ [sealed]: 1 }, registry)).toThrow(/sealed/);
    }
  });

  it("H-TYPE structural config passes via requiredFieldsByType; bad shapes reject (E2)", () => {
    expect(() =>
      rulebookModule.validateThresholdConfig(
        { requiredFieldsByType: rulebookModule.H_TYPE_DEFAULT },
        registry,
      ),
    ).not.toThrow();
    expect(() =>
      rulebookModule.validateThresholdConfig({ requiredFieldsByType: { roast: ["x"] } }, registry),
    ).toThrow(/unknown post type/);
    expect(() =>
      rulebookModule.validateThresholdConfig({ requiredFieldsByType: { news: [] } }, registry),
    ).toThrow(/non-empty string/);
  });
});

describe("SLICE-P4-06 — module surface + api registration", () => {
  it("public functions: listRules/setRuleConfig/add+editCalibrationExample/triggerCalibrate; internal: deploySeed/calibrate", () => {
    expect((rulebookModule.listRules as any).isQuery).toBe(true);
    expect((rulebookModule.setRuleConfig as any).isMutation).toBe(true);
    expect((rulebookModule.setRuleConfig as any).isPublic).toBe(true);
    expect((rulebookModule.addCalibrationExample as any).isMutation).toBe(true);
    expect((rulebookModule.editCalibrationExample as any).isMutation).toBe(true);
    // P4-07 rewired the calibrate pair to actions (vectorSearch/classifier
    // seams are action-only): trigger = public action, calibrate = internal.
    expect((rulebookModule.triggerCalibrate as any).isAction).toBe(true);
    expect((rulebookModule.triggerCalibrate as any).isPublic).toBe(true);
    expect((rulebookModule.deploySeed as any).isInternal).toBe(true);
    expect((rulebookModule.calibrate as any).isAction).toBe(true);
    expect((rulebookModule.calibrate as any).isInternal).toBe(true);
  });

  it("args mirroring: setRuleConfig takes ruleKey + live values; calibration labels are pass|fail records", () => {
    const a = argsOf(rulebookModule.setRuleConfig);
    expect(a.ruleKey.fieldType.type).toBe("string");
    expect(a.enabled.fieldType.type).toBe("boolean");
    const ex = argsOf(rulebookModule.addCalibrationExample);
    const labelValues = ex.expectedOutcome.fieldType.values.fieldType.value
      .map((alt: any) => alt.value)
      .sort();
    expect(labelValues).toEqual(["fail", "pass"]);
    const edit = argsOf(rulebookModule.editCalibrationExample);
    expect(edit.exampleId.fieldType.tableName).toBe("calibrationExamples");
  });

  it("api.d.ts maps the rulebook module", () => {
    const apiDts = readFileSync(
      resolve(__dirname, "../../../../../../convex/_generated/api.d.ts"),
      "utf8",
    );
    expect(apiDts).toContain('import type * as rulebook from "../rulebook.js"');
    expect(apiDts).toContain("rulebook: typeof rulebook;");
  });
});
