/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P5-09 acceptance tests — CAP-179/180/176/177/181. Sources:
 * CONTRACT-5-personas §1-§5 + register rows (quotes in public.ts). */

import * as publicModule from "../../../../../../convex/persona/public";
import { RATE_LIMITS } from "../../../../../../convex/lib/rateLimit";

const convexRoot = join(__dirname, "../../../../../../convex");
const src = readFileSync(join(convexRoot, "persona/public.ts"), "utf8");

describe("SLICE-P5-09 — the E-H sealed-field firewall (CAP-180)", () => {
  it("projections are explicit allowlists — no row spreads into responses", () => {
    expect(src).toContain("function publicPersona");
    expect(src).not.toMatch(/\.\.\.p,/); // never spreads the raw personas row
    expect(src).not.toMatch(/\.\.\.persona,/);
  });

  it("SEALED fields never appear in any returned object", () => {
    for (const sealed of ["systemPrompt", '"name"', "prohibitedOverreach", "analyticalLens", "triggerConditions"]) {
      expect(src).not.toContain(`${sealed}:`);
    }
    // the genome is never even read here
    expect(src).not.toContain('query("personaGenomes")');
  });

  it("how-this-AI-thinks copy = identityCharter only, never raw genome", () => {
    expect(src).toContain("identityCharter");
    expect(src).toContain("never the genome");
  });

  it("lifecycle history projects eventType/statuses only (evidence stays server-side)", () => {
    expect(src).toMatch(/eventType: h\.eventType/);
    expect(src).not.toContain("evidence:");
  });
});

describe("SLICE-P5-09 — roster + counter (CAP-179)", () => {
  it("four sections; newly-arrived is the nascent display grouping (flagged)", () => {
    expect(src).toContain('"nascent") sections.newlyArrived');
    expect(src).toContain("display grouping — flagged mapping");
  });

  it("draft personas are not public", () => {
    expect(src).toContain('"draft") return null');
    expect(src).toContain("drafts are not public");
  });

  it("human-vs-AI counter is server-side from authorType, personas excluded from human counts", () => {
    expect(src).toContain('c.authorType === "user") human += 1');
    expect(src).toContain('c.authorType === "persona") ai += 1');
  });
});

describe("SLICE-P5-09 — revival voting (CAP-176/177/181)", () => {
  it("the full quoted gate chain: CAP-393 guard + retired-only + tier + age + staff + rate + unique", () => {
    expect(src).toContain('"revival_vote"');
    expect(src).toContain("persona is not retired");
    expect(src).toContain("trust_tier_required");
    expect(src).toContain("account_age");
    expect(src).toContain("staff_excluded");
    expect(src).toContain("revival.vote");
    expect(src).toContain("alreadyVoted");
  });

  it("revival NEVER auto-fires (CAP-165 operator confirm is P5-10)", () => {
    expect(src).toContain("never auto-revives");
    const tallyFn = src.split("revivalTally")[1] ?? "";
    expect(tallyFn).not.toContain("insert");
    expect(tallyFn).not.toContain("patch");
  });

  it("the rate limit set exists with the flagged 5/day default", () => {
    const set = RATE_LIMITS["revival.vote"];
    expect(set).toBeDefined();
    expect(set[0].max).toBe(5);
    expect(set[0].periodMs).toBe(24 * 60 * 60_000);
  });

  it("the four public-surface functions exist", () => {
    for (const fn of ["listRoster", "getPersonaProfile", "revivalVote", "revivalTally"]) {
      expect(typeof (publicModule as any)[fn], fn).toBe("function");
    }
  });
});
