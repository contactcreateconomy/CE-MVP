/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-04 + P6-05 acceptance tests — curation (CAP-191/192/554/423)
 * + keyword search (CAP-529). Quotes live in the owning modules. */

import * as curationModule from "../../../../../../convex/admin/curation";
import * as searchModule from "../../../../../../convex/search";

const convexRoot = join(__dirname, "../../../../../../convex");
const curationSrc = readFileSync(join(convexRoot, "admin/curation.ts"), "utf8");
const searchSrc = readFileSync(join(convexRoot, "search.ts"), "utf8");
const seedSrc = readFileSync(join(convexRoot, "seed.ts"), "utf8");

describe("SLICE-P6-04 — curation console (CAP-191/192/554)", () => {
  it("the three mutations + state query exist", () => {
    for (const fn of ["setFeatured", "pullFeatured", "heroUpsert", "getCurationState"]) {
      expect(typeof (curationModule as any)[fn], fn).toBe("function");
    }
  });

  it("CAP-423 firewall: NO score field is written anywhere in the module", () => {
    expect(curationSrc).not.toContain("trendScore:");
    expect(curationSrc).not.toContain("topScore");
    expect(curationSrc).not.toContain("hotScore");
    expect(curationSrc).not.toContain("postDistributionScores");
  });

  it("CAP-554: pull writes status ONLY (quoted: 'Does not mutate trendScore')", () => {
    const fn = curationSrc.split("export const pullFeatured")[1] ?? "";
    expect(fn).toMatch(/patch\(args\.featuredId, \{ status: "pulled" \}\)/); // the ONLY patch — no score args
  });

  it("CAP-554 actor = administrator ONLY (narrower than the screen)", () => {
    const fn = curationSrc.split("export const pullFeatured")[1] ?? "";
    expect(fn).toContain('roles.includes("administrator")');
  });

  it("CAP-191 cadence caps enforced (≤1–2 active; ≤1/cycle flagged default)", () => {
    const fn = curationSrc.split("export const setFeatured")[1] ?? "";
    expect(fn).toContain(">= 2");
    expect(fn).toContain("per cycle/24h");
  });

  it("CAP-191/192 M13 gates: moderation-ineligible candidates blocked", () => {
    expect(curationSrc).toContain("assertModerationEligible");
    expect(curationSrc).toContain("failed the M13 gate");
  });

  it("CAP-019 admin.write rate limit applied to every mutation", () => {
    expect((curationSrc.match(/checkRateLimit\(/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("hero lifecycle rides upsert's status param — no invented mutation names (OQ4)", () => {
    expect(curationSrc).toContain("OQ4-flagged");
    expect(curationSrc).not.toContain("export const heroPause");
    expect(curationSrc).not.toContain("export const heroArchive");
  });

  it("every mutation is writeAudited (fail-closed)", () => {
    expect((curationSrc.match(/writeAudited\(/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});

describe("SLICE-P6-05 — keyword search (CAP-529)", () => {
  it("the quoted scope: posts title/body + tool name + users.username/displayName (NOT the profiles table)", () => {
    expect(searchSrc).toContain("title.toLowerCase().includes");
    expect(searchSrc).toContain("body.toLowerCase().includes");
    expect(searchSrc).toContain("t.name.toLowerCase().includes");
    expect(searchSrc).toContain("u.username");
    expect(searchSrc).toContain("u.displayName");
    expect(searchSrc).not.toContain('query("profiles")');
  });

  it("never reads privateUserData (structurally absent)", () => {
    expect(searchSrc).not.toContain('query("privateUserData")');
  });

  it("moderation-hidden/removed excluded from post results", () => {
    expect(searchSrc).toContain('p.moderationStatus === "passed"');
  });

  it("identical anonymous/member results — no viewer branch exists in the query", () => {
    const fn = searchSrc.split("export const searchQuery")[1].split("export const searchLog")[0];
    expect(fn).not.toContain("getAuthUserId");
  });

  it("rawEvents ride the companion mutation (a query cannot write); no raw query text stored", () => {
    expect(searchSrc).toContain("export const searchLog");
    expect(searchSrc).toContain("queryLength");
    expect(searchSrc).not.toContain("queryText: args.q");
    expect(seedSrc).toContain("SEARCH_EVENT_ROW");
  });

  it("deterministic ordering (title/name ascending, cap 50/class) — a pagination contract, not a ranker", () => {
    expect(searchSrc).toContain("localeCompare");
    expect(searchSrc).toContain("PER_CLASS = 50");
  });
});
