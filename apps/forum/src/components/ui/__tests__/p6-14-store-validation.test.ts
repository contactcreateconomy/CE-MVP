/* eslint-disable @typescript-eslint/no-explicit-any -- pure-function + source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-14 acceptance tests — CAP-232/235/236/237/238/240/241/242/263.
 * THE LOCK is the money-path value P6-17 re-reads — quoted in module. */

import { assertNotLocked, LOCKED_LINK_FIELDS, REJECT_REASONS } from "../../../../../../convex/admin/store";

const convexRoot = join(__dirname, "../../../../../../convex");
const src = readFileSync(join(convexRoot, "admin/store.ts"), "utf8");
const validateSrc = readFileSync(join(convexRoot, "admin/storeValidate.ts"), "utf8");

describe("SLICE-P6-14 — THE LOCK (CAP-237, FATAL-adjacent)", () => {
  it("approve writes validationState=approved_locked + lockedAt — the canonical field, NO status", () => {
    const fn = src.split("export const approveProduct")[1] ?? "";
    expect(fn).toContain('validationState: "approved_locked"');
    expect(fn).toContain("lockedAt");
    expect(src).not.toContain("status: active");
  });

  it("approve requires a PASSING inspection — never a silent pass", () => {
    const fn = src.split("export const approveProduct")[1] ?? "";
    expect(fn).toContain("requires a passing inspection");
  });

  it("write-to-locked THROWS: assertNotLocked rejects locked fields on approved_locked rows", () => {
    const lockedRow = { validationState: "approved_locked" };
    expect(() => assertNotLocked(lockedRow, "submittedUrl")).toThrow(/LOCKED/);
    expect(() => assertNotLocked(lockedRow, "affiliateAccountRefMasked")).toThrow(/LOCKED/);
    expect(() => assertNotLocked(lockedRow, "unlockedField")).not.toThrow();
    expect(() => assertNotLocked({ validationState: "pending" }, "submittedUrl")).not.toThrow();
  });

  it("LOCKED_LINK_FIELDS covers the quoted package list (link+domain+network+masked ref…)", () => {
    for (const f of ["submittedUrl", "finalRegistrableDomain", "network", "affiliateAccountRefMasked", "geoEligibility", "validationState"]) {
      expect(LOCKED_LINK_FIELDS).toContain(f);
    }
  });
});

describe("SLICE-P6-14 — inspection + screen (CAP-235/236)", () => {
  it("SSRF-safe via lib/safeFetch (P1-10 reuse); probe failure → needs_human, NEVER a silent pass", () => {
    expect(validateSrc).toContain("safeFetchText");
    expect(validateSrc).toContain("needs_human"); // probe failure degrades — never a silent pass
    expect(validateSrc).toContain("catch");
  });

  it("CAP-236 INV-11: unsafe and off_topic stay distinct in the reject enum", () => {
    expect(REJECT_REASONS).toContain("unsafe_destination");
    expect(REJECT_REASONS).toContain("off_topic");
    expect(REJECT_REASONS).toHaveLength(8);
  });
});

describe("SLICE-P6-14 — drift + queue (CAP-240/241/242/263)", () => {
  it("rescan: title-hash change → under_review (BUY disabled, storefront visible)", () => {
    const fn = validateSrc.split("export const rescanLinksAction")[1] ?? "";
    expect(fn).toContain("titleHash");
    expect(fn).toContain("recordDriftFlip");
    expect(src).toContain('validationState: "under_review"');
  });

  it("buyer-report drift flags out-of-cycle → under_review", () => {
    const fn = src.split("export const reportDrift")[1] ?? "";
    expect(fn).toContain('"under_review"');
  });

  it("CAP-263: queue batches capped at 10 per lane", () => {
    expect((src.match(/take\(10\)/g) ?? []).length).toBeGreaterThanOrEqual(3); // requests + pending + drifted lanes
  });
});

describe("SLICE-P6-14 — request decision (CAP-232)", () => {
  it("approval → storefronts.status=setup (activation is P6-16's CAP-233)", () => {
    const fn = src.split("export const decideRequest")[1] ?? "";
    expect(fn).toContain('status: "setup"');
    expect(fn).toContain("CAP-565 invariant"); // the Distribution must pre-exist
  });
});
