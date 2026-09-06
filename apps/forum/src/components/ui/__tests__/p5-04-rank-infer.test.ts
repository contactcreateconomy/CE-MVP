/* eslint-disable @typescript-eslint/no-explicit-any -- pure-function + source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P5-04 acceptance tests — CAP-129/130/145 (rank recompute, decay,
 * inference batch). Sources: register rows CAP-129/130/145; bible l.103
 * (bestScore contract), l.61 (prohibited inferences); DECISIONS-LOCKED
 * #11 (calibration_pending config defaults). */

import { decayFactor, RANK_CONFIG_VERSION } from "../../../../../../convex/jobs/rank";
import {
  assertInferenceAllowed,
  PROHIBITED_INFERENCE_TYPES,
  ALLOWED_INFERENCE_TYPES,
  INFERENCE_RULE_VERSION,
} from "../../../../../../convex/jobs/infer";

const convexRoot = join(__dirname, "../../../../../../convex");

describe("SLICE-P5-04 — rank engine (CAP-129/130)", () => {
  it("decayFactor: exponential time-decay gravity — half-life honored (CAP-130 'live sort only')", () => {
    const now = 1_000_000_000_000;
    const halfLifeHours = 6;
    // at t=0 → 1
    expect(decayFactor(now, halfLifeHours, now)).toBeCloseTo(1);
    // one half-life (6h) → 0.5
    expect(decayFactor(now - 6 * 3_600_000, halfLifeHours, now)).toBeCloseTo(0.5);
    // two half-lives → 0.25; future interaction clamps to 1
    expect(decayFactor(now - 12 * 3_600_000, halfLifeHours, now)).toBeCloseTo(0.25);
    expect(decayFactor(now + 3_600_000, halfLifeHours, now)).toBeCloseTo(1);
  });

  it("DECISIONS-LOCKED #11: config version tagged calibration_pending (no silent hardcoded posture)", () => {
    expect(RANK_CONFIG_VERSION).toContain("calibration_pending");
  });

  it("CAP-129 lease semantics: clear-first patch present in the source (quoted: 'clears flag before read')", () => {
    const source = readFileSync(join(convexRoot, "jobs/rank.ts"), "utf8");
    expect(source).toContain("patch(row._id, { dirty: false })");
    expect(source).toMatch(/take\(50\)/); // bounded batch
  });

  it("bestScore: ONE numerator (valuable), NEVER negative/context inputs", () => {
    const source = readFileSync(join(convexRoot, "jobs/rank.ts"), "utf8");
    expect(source).toContain("reactionType",);
    expect(source).toMatch(/valuable/);
    expect(source).not.toMatch(/negative.*bestScore|bestScore.*negative/);
  });
});

describe("SLICE-P5-04 — inference batch (CAP-145)", () => {
  it("the prohibited list is fail-closed at the write boundary (bible l.61)", () => {
    for (const banned of ["age", "gender", "income", "revenue", "purchasing_power", "employment", "sensitive_identity"]) {
      expect(() => assertInferenceAllowed(banned)).toThrow(/PROHIBITED/);
    }
  });

  it("unknown inference classes are rejected too (closed allowlist)", () => {
    expect(() => assertInferenceAllowed("political_leaning")).toThrow(/not an allowed/);
  });

  it("the seven allowed classes pass", () => {
    for (const allowed of ALLOWED_INFERENCE_TYPES) {
      expect(() => assertInferenceAllowed(allowed)).not.toThrow();
    }
    expect(ALLOWED_INFERENCE_TYPES).toHaveLength(7);
    expect(PROHIBITED_INFERENCE_TYPES).toHaveLength(7);
  });

  it("manifest provenance rides the rule version (lightweight, not per-event)", () => {
    expect(INFERENCE_RULE_VERSION).toBe("infer.v1");
    const source = readFileSync(join(convexRoot, "jobs/infer.ts"), "utf8");
    expect(source).toContain("manifestHash");
    expect(source).toContain("≥3 qualifying events");
  });
});

describe("SLICE-P5-04 — wiring (crons + registry + jobCatalog)", () => {
  it("crons.ts registers all three jobs (rank 1m — 3s register cadence unattainable on Convex, flagged)", () => {
    const source = readFileSync(join(convexRoot, "crons.ts"), "utf8");
    expect(source).toContain("internal.jobs.rank.recomputeDirtyBatch");
    expect(source).toContain("internal.jobs.rank.decayLiveScores");
    expect(source).toContain("internal.jobs.infer.inferBatch");
  });

  it("rank.* config rows + jobCatalog rows are seeded (DECISIONS-LOCKED #11 + P1-04 catalog)", () => {
    const source = readFileSync(join(convexRoot, "seed.ts"), "utf8");
    for (const key of ["rank.best.priorWeight", "rank.best.priorMean", "rank.best.minCategorySamples", "rank.live.halfLifeHours"]) {
      expect(source).toContain(`"${key}"`);
    }
    for (const job of ["m6.rank.recompute", "m6.rank.decay", "m6.infer.batch"]) {
      expect(source).toContain(`"${job}"`);
    }
  });
});
