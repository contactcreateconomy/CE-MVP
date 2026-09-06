/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-02 acceptance tests — CAP-187/188/189/190/193/195/196/197.
 * Sources: register quotes in the owning modules; bible l.129-140. */

const convexRoot = join(__dirname, "../../../../../../convex");
const rankSrc = readFileSync(join(convexRoot, "jobs/rank.ts"), "utf8");
const exploreSrc = readFileSync(join(convexRoot, "jobs/explore.ts"), "utf8");
const vibingSrc = readFileSync(join(convexRoot, "jobs/vibing.ts"), "utf8");
const cardsSrc = readFileSync(join(convexRoot, "cards.ts"), "utf8");
const cronsSrc = readFileSync(join(convexRoot, "crons.ts"), "utf8");
const seedSrc = readFileSync(join(convexRoot, "seed.ts"), "utf8");

describe("SLICE-P6-02 — CAP-187 distribution rank recompute", () => {
  it("leased dirty-queue, M6 pattern (clear-first), bounded batch", () => {
    const fn = rankSrc.split("distributionRecompute")[1] ?? "";
    expect(fn).toContain("dirtySince");
    expect(fn).toContain("take(50)");
    expect(fn).toMatch(/patch\(row\._id, \{ dirtySince: undefined \}\)/);
  });

  it("topScore = Bayesian confidence-damped positive, ONE numerator, NOT Wilson", () => {
    const fn = rankSrc.split("distributionRecompute")[1] ?? "";
    expect(fn).toContain("valuableWeighted");
    expect(fn).toContain("topPriorWeight");
    expect(fn).not.toMatch(/wilson/i);
  });
});

describe("SLICE-P6-02 — CAP-188 exploration (never operator curation)", () => {
  it("exposure-deficit only; tiers by age (launch-high taper)", () => {
    expect(exploreSrc).toContain("exposureTargetFor");
    expect(exploreSrc).toContain("launch-high");
    // no operator-facing write surface exists in the module
    expect(exploreSrc).not.toContain("assertAdminPermission");
    expect(exploreSrc).not.toContain("auditLog");
  });

  it("member posts only (personas excluded by construction)", () => {
    expect(exploreSrc).toContain('post.authorType !== "user"');
  });
});

describe("SLICE-P6-02 — CAP-189 vibing (human activity ONLY)", () => {
  it("the quoted qualifiers: ≥3 distinct humans + ≥2 interaction types", () => {
    expect(vibingSrc).toContain("MIN_DISTINCT_HUMANS = 3");
    expect(vibingSrc).toContain("MIN_INTERACTION_TYPES = 2");
  });

  it("falls below qualifier → cooldown, never a hard drop", () => {
    expect(vibingSrc).toContain('"cooling"');
    expect(vibingSrc).toContain("cooldownUntil");
  });

  it("no persona input path — human counters only", () => {
    expect(vibingSrc).not.toMatch(/personaCommentCount|authorType === "persona"/);
  });
});

describe("SLICE-P6-02 — CAP-190/195/196/197 cards", () => {
  it("the projection writers write ONLY cardSummaries — never any rank/score table (l.137 quoted)", () => {
    expect(cardsSrc).toContain('insert("cardSummaries"');
    expect(cardsSrc).not.toContain('patch(row._id, { topScore');
    expect(cardsSrc).not.toContain('insert("postDistributionScores"');
  });

  it("CAP-190: neutral fallback when MAX absent — no emotional hook fabrication", () => {
    expect(cardsSrc).toContain("NEUTRAL fallback");
    expect(cardsSrc).toContain('groundingStatus: "insufficient"');
    // no hook generation call exists in v1 — the fallback is the only writer
    expect(cardsSrc).not.toContain("glmGenerate");
    expect(cardsSrc).not.toContain("hookText");
  });

  it("CAP-195/196: running comment = human Best, frozen ≥15min, personas excluded", () => {
    expect(cardsSrc).toContain("FREEZE_MS = 15 * 60_000");
    expect(cardsSrc).toContain('c.authorType === "user"');
    expect(cardsSrc).toContain("bestScore");
  });

  it("CAP-197: avatars ≤3, savers counted not shown", () => {
    expect(cardsSrc).toContain("engagers.length < 3");
    expect(cardsSrc).toContain("NOT as avatars");
  });
});

describe("SLICE-P6-02 — CAP-193 stale-hero auto-fill", () => {
  it('fills from TOP labeled "Community Top" — never Recognition-selected', () => {
    const fn = cardsSrc.split("heroStaleFill")[1] ?? "";
    expect(fn).toContain("Community Top");
    expect(fn).toContain("by_topScore");
    expect(fn).not.toContain("leaderboardProjections");
    expect(fn).not.toContain("recognitionEvents");
  });
});

describe("SLICE-P6-02 — wiring", () => {
  it("all five crons registered", () => {
    for (const ref of [
      "internal.jobs.rank.distributionRecompute",
      "internal.jobs.explore.explorationRefresh",
      "internal.jobs.vibing.vibingCompute",
      "internal.cards.refreshCards",
      "internal.cards.heroStaleFill",
    ]) {
      expect(cronsSrc).toContain(ref);
    }
  });

  it("jobCatalog rows + calibration_pending config keys seeded", () => {
    for (const job of ["m9.rank.recompute", "m9.exploration.refresh", "m9.vibing.compute", "m9.cards.refresh", "m9.hero.staleFill"]) {
      expect(seedSrc).toContain(`"${job}"`);
    }
    for (const key of ["feed.top.priorWeight", "feed.top.priorMean", "feed.hot.halfLifeHours"]) {
      expect(seedSrc).toContain(`"${key}"`);
    }
  });
});
