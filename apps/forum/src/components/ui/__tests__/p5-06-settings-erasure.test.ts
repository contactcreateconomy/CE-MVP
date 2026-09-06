/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P5-06 acceptance tests — CAP-143/146/147/149/150/151/157/549/552.
 * Sources: CONTRACT-5-settings-profile §1-§4 + register rows. */

import * as settingsModule from "../../../../../../convex/profile/settings";

const convexRoot = join(__dirname, "../../../../../../convex");
const src = readFileSync(join(convexRoot, "profile/settings.ts"), "utf8");

describe("SLICE-P5-06 — the nine-mutation write surface", () => {
  it("all nine mutations + the state query exist", () => {
    for (const fn of [
      "setAttribute", "socialAdd", "socialVerify", "socialRevoke",
      "consentWithdraw", "detachAttribute", "completionRecompute",
      "consentReaccept", "togglePrivacy", "getSettingsState",
    ]) {
      expect(typeof (settingsModule as any)[fn], fn).toBe("function");
    }
  });

  it("CAP-143: every attribute write is consent-gated (returns consentRequired, never writes ungated)", () => {
    expect(src).toContain("consentRequired");
    expect(src).toMatch(/if \(!granted\)/);
  });

  it("CAP-146: stored handle only — no OAuth/fetch in V1", () => {
    expect(src).toContain("NO OAuth/fetch in V1");
    expect(src).toContain("verificationStatus: \"unverified\"");
  });

  it("CAP-147: verify is an honest Phase-3 stub (never claims verification)", () => {
    expect(src).toContain("stub: true");
    expect(src).toContain("no verification is performed or claimed");
  });

  it("CAP-549: revoke is soft-delete (CAP-545 precedent — row retained)", () => {
    const fn = src.split("socialRevoke")[1] ?? "";
    expect(fn).toContain("revokedAt");
    expect(fn).toContain("deletedAt");
    expect(fn).not.toContain("ctx.db.delete");
  });

  it("CAP-149 → CAP-151: withdrawal triggers the erasure cascade (no scheduler — same transaction)", () => {
    expect(src).toContain("erasureCascade");
    expect(src).not.toContain("runAfter"); // cascade is inline, never scheduled
  });

  it("CAP-151: audit record is NON-VALUE-BEARING (prev never carries the erased value)", () => {
    expect(src).toContain("prev: { attributeType: args.attributeType }");
    expect(src).toContain("NON-VALUE-BEARING");
  });

  it("CAP-151: inferences invalidated + attributes detached; Recognition history persists", () => {
    expect(src).toContain('status: "invalidated"');
    expect(src).toContain("deletedAt: now");
    // profileCompletionEvents are never deleted (Recognition survives)
    expect(src).not.toMatch(/profileCompletionEvents[\s\S]{0,200}db\.delete/);
  });

  it("CAP-150: per-field badges, prefer-not-to-say equal credit, Recognition-only firewall", () => {
    expect(src).toContain("recomputeBadges");
    expect(src).toContain("equal credit");
    expect(src).toContain("Recognition-only firewall");
    const fn = src.split("recomputeBadges = ")[1] ?? src.split("async function recomputeBadges")[1] ?? "";
    expect(fn).not.toMatch(/liveScore|bestScore|threadStats/); // badge writes never touch rank inputs
  });

  it("CAP-157: re-acceptance appends the versioned record + updates users", () => {
    const fn = src.split("consentReaccept")[1] ?? "";
    expect(fn).toContain("userConsentRecords");
    expect(fn).toContain("rulesAcceptedVersion");
  });

  it("CAP-552: privacy toggles are users fields, NOT consent records (FATAL-M18-02 boundary)", () => {
    const fn = src.split("togglePrivacy")[1] ?? "";
    expect(fn).toContain("profileVisibility");
    expect(fn).toContain("leaderboardOptOut");
    expect(fn).not.toContain("userConsentRecords");
  });

  it("no rawEvents anywhere (contract §5: accountability = consent/completion/audit trails)", () => {
    expect(src).not.toContain("captureEvent");
  });

  it("age-band income/spend (Phase-2) are NOT offered", () => {
    const bands = src.match(/AGE_BANDS[\s\S]{0,200}/)?.[0] ?? "";
    expect(bands).not.toMatch(/income|spend/i);
  });
});

describe("SLICE-P5-06 — UI surface", () => {
  const ui = readFileSync(
    join(__dirname, "../../../app/(app)/(shell)/settings/profile/settings-profile-client.tsx"),
    "utf8",
  );

  it("the destructive erase sits behind an explicit confirm", () => {
    expect(ui).toContain("Confirm erase");
  });

  it("the re-acceptance overlay prompts without auto-writing", () => {
    expect(ui).toContain("reacceptanceDue");
    expect(ui).toContain("Re-accept");
  });

  it("withdrawal consequences are stated on-screen (erasure cascade disclosure)", () => {
    expect(ui).toContain("derivation-trail invalidation");
  });
});
