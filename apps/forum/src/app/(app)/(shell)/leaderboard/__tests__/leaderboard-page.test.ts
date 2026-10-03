import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* S00-T04 acceptance (S00-SPEC §11, D-012): the leaderboard renders real
 * data only. Overall = the server Podium projection; the four category
 * boards show a designed Empty until a real projection exists (CR-006) —
 * ranks are never derived client-side. */

const src = readFileSync(join(__dirname, "../leaderboard-page-client.tsx"), "utf8").replace(/\r\n/g, "\n");

describe("S00-T04 — leaderboard de-fabrication", () => {
  it("no client-side rank/score derivation (charCodeAt multipliers + invented windows gone)", () => {
    expect(src).not.toContain("charCodeAt");
    expect(src).not.toContain("categoryMultiplier");
    expect(src).not.toContain("windowScore");
    expect(src).not.toContain("24H");
  });

  it("category boards show the designed Empty until a real projection (CR-006)", () => {
    expect(src).toContain("EmptyState");
    expect(src).toContain("Not enough activity yet");
  });

  it("Overall stays the real Podium projection (feed.getChrome, min-25 forming)", () => {
    expect(src).toContain("api.feed.getChrome");
    expect(src).toContain("MIN_CONTRIBUTORS");
    expect(src).toContain("Podium is forming");
  });

  it("the interim footnote is gone; the exclusions note stays", () => {
    expect(src).not.toContain("interim");
    expect(src).toContain("Personas and staff are excluded from all Podium cells.");
  });
});
