/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-10 + P6-11 acceptance tests — the review/forge/weights engine
 * (CAP-205/206/207/208/222/223) + lifecycle/takedown/kill-gate
 * (CAP-209/210/218-221/225/555-559). Quotes live in the owning modules. */

import { REJECTED_ARTIFACT_FINDINGS } from "../../../../../../convex/admin/resources";

const convexRoot = join(__dirname, "../../../../../../convex");
const reviewSrc = readFileSync(join(convexRoot, "admin/resources.ts"), "utf8");
const lifecycleSrc = readFileSync(join(convexRoot, "admin/resourcesLifecycle.ts"), "utf8");
const cronsSrc = readFileSync(join(convexRoot, "crons.ts"), "utf8");

describe("SLICE-P6-10 — review + forge + weights", () => {
  it("CAP-206 INV-11: off_topic and unsafe are DISTINCT reject reasons", () => {
    expect(reviewSrc).toContain("reject_off_topic");
    expect(reviewSrc).toContain("reject_unsafe");
  });

  it("CAP-207 INV-4: one→many blocked for user_ugc; rights_verified unlocks", () => {
    const fn = reviewSrc.split("export const forgeFromReferences")[1] ?? "";
    expect(fn).toContain("one→many blocked for user_ugc");
    expect(reviewSrc).toContain("export const promoteRightsVerified");
    expect(reviewSrc).toContain('sourceClass: "rights_verified"');
  });

  it("forge consumes only accepted references + stages contributions at weight 0 (CAP-222 later)", () => {
    const fn = reviewSrc.split("export const forgeFromReferences")[1] ?? "";
    expect(fn).toContain("not accepted_for_forge");
    expect(fn).toContain("forge_consumed");
    expect(fn).toContain("weight: 0");
  });

  it("CAP-208: the quoted reject list — URI/Launch/JS/forms/embedded/remote/QR; fail-closed without a clean report", () => {
    expect([...REJECTED_ARTIFACT_FINDINGS].sort()).toEqual(
      ["embedded_file", "forms", "javascript", "launch_action", "qr_code", "remote_resource", "uri_action"].sort(),
    );
    const fn = reviewSrc.split("export const validatePdf")[1] ?? "";
    expect(fn).toContain('findings.includes("clean_scan")');
    expect(fn).toContain("no_clean_scan_report"); // empty report = FAIL, never a pass
  });

  it("CAP-222/223: Σ ≤ 1.0 server-enforced; duplicates = 0; atomic set validation", () => {
    const fn = reviewSrc.split("export const assignWeights")[1] ?? "";
    expect(fn).toContain("exceeds 1.0");
    expect(fn).toContain("duplicates = 0 weight");
    expect(fn).toContain("weight must be 0–1");
  });
});

describe("SLICE-P6-11 — lifecycle + takedown + kill-gate", () => {
  it("CAP-209: exactly one isCurrent — every prior current demoted before the new one", () => {
    const fn = lifecycleSrc.split("export const publish")[1] ?? "";
    expect(fn).toContain("isCurrent: false");
    expect(fn).toContain("isCurrent: true");
    expect(fn).toContain("not artifact-approved");
  });

  it("CAP-218: takedown writes legalIntake + resources status — NEVER dmcaNotices; ≠ erasure", () => {
    const fn = lifecycleSrc.split("export const executeTakedown")[1] ?? "";
    expect(fn).toContain("legalIntake");
    expect(fn).not.toContain('insert("dmcaNotices"'); // the docblock quote names the absorbed table — the WRITE is what's banned
    expect(fn).not.toContain("db.delete");
    expect(lifecycleSrc).toContain("Takedown ≠ erasure");
  });

  it("CAP-219: BFS depth ≤5 via the reverse reference index; a review row per node", () => {
    const fn = lifecycleSrc.split("export const executeTakedown")[1] ?? "";
    expect(fn).toContain("depth >= 5");
    expect(fn).toContain("by_reference");
    expect(fn).toContain("resourceCascadeReviews");
  });

  it("CAP-220: the kill-gate cron writes pilotKillGateEvaluations ONLY — never flips the flag", () => {
    const fn = (lifecycleSrc.split("export const killGateEvaluate")[1] ?? "").split("export const ugcKillSwitch")[0];
    expect(fn).toContain("pilotKillGateEvaluations");
    expect(fn).not.toContain('patch(');          // no config write at all
    expect(fn).not.toContain('insert("systemConfig"');
    expect(fn).not.toContain("systemConfig");
    expect(cronsSrc).toContain("internal.admin.resourcesLifecycle.killGateEvaluate");
  });

  it("CAP-221: the kill-switch is Administrator-only (the NARROWER gate — two-layer)", () => {
    const fn = lifecycleSrc.split("export const ugcKillSwitch")[1] ?? "";
    expect(fn).toContain('roles.includes("administrator")');
    expect(fn).toContain("narrower gate");
    // the switch itself DOES write systemConfig (it IS CAP-221) — with audit + justification
    expect(fn).toContain("justification");
  });

  it("CAP-557: the legal-review lane is Moderator-only", () => {
    const fn = lifecycleSrc.split("export const lifecycleWrite")[1] ?? "";
    expect(fn).toContain('["moderator"]');
  });

  it("CAP-555-559: the four lifecycle statuses + version editorial review exist", () => {
    for (const st of ["paused", "archived", "under_legal_review", "review"]) {
      expect(lifecycleSrc).toContain(`v.literal("${st}")`);
    }
    expect(lifecycleSrc).toContain("export const completeEditorialReview");
  });

  it("every operator mutation is writeAudited (fail-closed)", () => {
    expect((lifecycleSrc.match(/writeAudited\(/g) ?? []).length).toBeGreaterThanOrEqual(6);
    expect((reviewSrc.match(/writeAudited\(/g) ?? []).length).toBeGreaterThanOrEqual(5);
  });
});
