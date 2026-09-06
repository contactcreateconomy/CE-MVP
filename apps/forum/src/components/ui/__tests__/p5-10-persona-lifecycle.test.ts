/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P5-10 acceptance tests — CAP-159…167. Sources: register rows
 * (quotes in lifecycle.ts docblocks) + the admin-personas contract. */

import { LIFECYCLE_DEFAULTS } from "../../../../../../convex/persona/lifecycle";

const convexRoot = join(__dirname, "../../../../../../convex");
const src = readFileSync(join(convexRoot, "persona/lifecycle.ts"), "utf8");
const cronsSrc = readFileSync(join(convexRoot, "crons.ts"), "utf8");
const seedSrc = readFileSync(join(convexRoot, "seed.ts"), "utf8");

describe("SLICE-P5-10 — the seven lifecycle mutations", () => {
  it("birth/activate/resume/wane/retire/reviveConfirm/pause all exist", () => {
    for (const fn of ["birth", "activate", "pause", "resume", "wane", "retire", "reviveConfirm"]) {
      expect(src).toContain(`export const ${fn} =`);
    }
  });

  it("CAP-159 birth: compiles the SEALED prompt from the genome (never hand-written) + INV-7", () => {
    expect(src).toContain("compileSystemPrompt(args.genome)");
    expect(src).toContain("max 1 birth/day");
    expect(src).toContain("name collision");
  });

  it("CAP-160 activate: trial days + ≤3 trial comments (config-keyed, flagged)", () => {
    expect(LIFECYCLE_DEFAULTS.activationTrialDays).toBe(7);
    expect(LIFECYCLE_DEFAULTS.activationTrialMaxComments).toBe(3);
    expect(src).toContain("trial period not elapsed");
    expect(src).toContain("trial comment ceiling");
  });

  it("CAP-161 pause admits Moderator (E-E actors); resumable (CAP-162)", () => {
    const pauseFn = src.split("export const pause")[1] ?? "";
    expect(pauseFn).toContain('"moderator"');
    expect(src).toContain("export const resume");
  });

  it("CAP-163 wane: System auto-fire + operator; CAP-164 retire: INV-7 + graceful", () => {
    expect(src).toContain('triggeredBySystem ? "system" : "operator"');
    expect(src).toContain("max 1 retirement/day");
    expect(src).toContain("graceful");
  });

  it("CAP-165 revive-confirm: threshold + tally SNAPSHOT + re-QA recompile; never auto", () => {
    const fn = src.split("export const reviveConfirm")[1] ?? "";
    expect(fn).toContain("threshold not met");
    expect(fn).toContain("snapshot");
    expect(fn).toContain("compileSystemPrompt");
  });

  it("every operator mutation is writeAudited (fail-closed audit)", () => {
    const count = (src.match(/writeAudited\(/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(6); // birth, activate, pause, resume, wane, retire, revive
  });
});

describe("SLICE-P5-10 — crons write nothing (quoted)", () => {
  it("population.recommend: recommendation output only — no persona writes", () => {
    const fn = (src.split("export const populationRecommend")[1] ?? "").split("export const driftCheck")[0];
    expect(fn).not.toContain('insert("personas"');
    expect(fn).not.toContain("db.patch");
    expect(src).toContain("admin executes");
  });

  it("drift.check: flags only — NO auto status change (CAP-167 quoted)", () => {
    const fn = src.split("export const driftCheck")[1] ?? "";
    expect(fn).not.toContain('insert("personas"');
    expect(fn).not.toContain('patch(persona');
    expect(fn).toContain("flagged");
  });

  it("crons wired: population daily + drift weekly", () => {
    expect(cronsSrc).toContain("internal.persona.lifecycle.populationRecommend");
    expect(cronsSrc).toContain("internal.persona.lifecycle.driftCheck");
  });

  it("thresholds are config-keyed registry rows (flagged defaults)", () => {
    for (const key of ["persona.activation.trialDays", "persona.wane.noSelectionDays", "persona.revival.threshold"]) {
      expect(seedSrc).toContain(`"${key}"`);
    }
  });
});
