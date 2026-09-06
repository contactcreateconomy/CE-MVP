/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-13 acceptance tests — CAP-230/231/262 (quotes live in
 * convex/store/apply.ts). */

import * as applyModule from "../../../../../../convex/store/apply";

const convexRoot = join(__dirname, "../../../../../../convex");
const src = readFileSync(join(convexRoot, "store/apply.ts"), "utf8");

describe("SLICE-P6-13 — the quoted eligibility formula (CAP-230)", () => {
  it("profile complete + >=1 social + trust tier + no hold + NOT staff", () => {
    for (const reason of ["profile_incomplete", "no_social_handle", "trust_tier_required", "integrity_hold", "staff_excluded"]) {
      expect(src).toContain(reason);
    }
  });

  it("staff exclusion is an explicit server-reject class (quoted)", () => {
    expect(src).toContain("staff_excluded");
    expect(src).toContain("not staff, not persona");
  });

  it("trust-tier floor is config-keyed with a flagged default (apply OQ5 — no invented numeric tier)", () => {
    expect(src).toContain("store.apply.trustTierFloor");
    expect(src).toContain("flagged default t1");
  });
});

describe("SLICE-P6-13 — the application (CAP-231/262)", () => {
  it("all four attestations REQUIRED — any false rejects (quoted)", () => {
    const fn = src.split("export const submit")[1] ?? "";
    expect(fn).toContain("att.owns && att.programPermits && att.regionEligible && att.willDisclose");
    expect(fn).toContain("all four attestations are required");
  });

  it("data-honesty acceptance is explicit + stamped as dataUseVersion (CAP-262)", () => {
    const fn = src.split("export const submit")[1] ?? "";
    expect(fn).toContain("acceptDataHonesty");
    expect(fn).toContain("dataUseVersion: DATA_USE_VERSION");
    expect(src).toContain("trust-pages"); // page content NOT invented here (Wave 7)
  });

  it("one live request per member; the write is audited", () => {
    const fn = src.split("export const submit")[1] ?? "";
    expect(fn).toContain("pending request already exists");
    expect(fn).toContain("writeAudited");
  });

  it("module surface: getApplyState + submit", () => {
    expect(typeof applyModule.getApplyState).toBe("function");
    expect(typeof applyModule.submit).toBe("function");
  });
});
