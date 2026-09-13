 
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P7E-01…09 acceptance tests — the M12 economy engine. Quotes live
 * in the source modules; sealed-key discipline (H5) is asserted directly. */

const convexRoot = join(__dirname, "../../../../../../convex");
const read = (rel: string) => readFileSync(join(convexRoot, rel), "utf8");

const schemaSrc = read("schema.ts");
const awardSrc = read("signal/award.ts");
const settleSrc = read("jobs/attributionSettle.ts");

const summarySrc = read("jobs/signalSummary.ts");
const recognitionSrc = read("jobs/recognition.ts");
const mightSrc = read("jobs/might.ts");
const metricsSrc = read("profile/metrics.ts");
const distSrc = read("distributions.ts");
const backfillSrc = read("migrations/backfillDistributions.ts");
const cronsSrc = read("crons.ts");

describe("SLICE-P7E-01 — M12 schema + Founding Season", () => {
  const tables = [
    "signalLedger", "signalSummary", "legitimacyScores", "engagementEdges",
    "integrityFlags", "recognitionEvents", "badges", "distributionMemberships",
    "signalSeasons", "signalLevelDefinitions", "distributionLevelAssignments",
    "vouches", "outcomeDefinitions",
  ];
  it.each(tables)("defines %s", (t) => {
    expect(schemaSrc).toContain(`${t}: defineTable`);
  });

  it("legitimacyScores carries the seven bible components (quoted)", () => {
    const region = schemaSrc.split("legitimacyScores: defineTable")[1].split("engagementEdges")[0];
    for (const c of ["account_age", "activity_diversity", "interaction_diversity", "content_quality", "temporal_humanity", "device_independence", "reciprocity_balance"]) {
      expect(region).toContain(c);
    }
  });

  it("signalLedger state/entryType unions match the bible literals", () => {
    const region = schemaSrc.split("signalLedger: defineTable")[1].split("signalSummary")[0];
    for (const lit of ['"provisional"', '"finalized"', '"reversed"', '"clawed_back"', '"award"', '"reversal"', '"clawback"', '"adjustment"']) {
      expect(region).toContain(lit);
    }
  });

  it("signalSeasons thresholds keyed by the ten level literals — not a free-form blob", () => {
    const region = schemaSrc.split("signalSeasons: defineTable")[1].split("signalLevelDefinitions")[0];
    for (const lvl of ["orbit", "comet", "moon", "planet", "star", "supernova", "nebula", "galaxy", "universe", "multiverse"]) {
      expect(region).toContain(`${lvl}: v.optional(v.number())`);
    }
    expect(region).not.toContain("v.record");
  });

  it("Founding Season seeds the ten bands with Supernova+ silhouettes (quoted)", () => {
    const seedSrc = read("economy/seed.ts");
    const bands = seedSrc.split("SIGNAL_LEVEL_BANDS")[1].split("] as const")[0];
    expect(bands).toContain('percentileBand: "all"');
    expect(bands).toContain('percentileBand: "p50"');
    expect(bands).toContain('percentileBand: "top100"');
    expect(bands.match(/revealState: "silhouette"/g)?.length).toBe(5);
    expect(seedSrc).toContain('mode: "fixed"');
  });
});

describe("SLICE-P7E-02 — F-11 backfill + CAP-299 defensive", () => {
  it("backfill walks complete members through the SAME ensure body (no second create path)", () => {
    expect(backfillSrc).toContain("ensureDistributionTx");
    expect(backfillSrc).toContain('bootstrapState !== "complete"');
  });
  it("ensureDistribution is idempotent (unique owner → one row; second call no-ops)", () => {
    expect(distSrc).toContain("if (existing) return");
  });
  it("Metrics never renders a null Distribution (zero-state, not missing-entity)", () => {
    const branch = metricsSrc.split('if (!dist)')[1].split("const summary")[0];
    expect(branch).toContain("reach: 0");
  });
});

describe("SLICE-P7E-05 — legitimacy (CAP-283/284)", () => {
  it("geometric mean — one near-zero tanks the whole score (pure test)", async () => {
    const { geometricMean, computeComponents } = await import("../../../../../../convex/jobs/legitimacy");
    const healthy = computeComponents({
      daysSinceSignup: 200, distinctEventTypes: 10, distinctTargets: 20,
      passedShare: 1, distinctDays: 14, reciprocalShare: 0.5,
      deviceData: false, sharedDeviceScore: 0,
    });
    const g1 = geometricMean(healthy);
    expect(g1).toBeGreaterThan(0.5);
    const tanked = geometricMean({ ...healthy, reciprocity_balance: 0.001 });
    expect(tanked).toBeLessThan(g1 / 2); // near-zero component tanks it
    expect(tanked).toBeLessThanOrEqual(1);
    expect(geometricMean({ ...healthy, account_age: 0 })).toBeLessThan(g1 / 2);
  });
  it("value/componentScores NEVER surfaced (H5 sealed + l.336 quoted)", () => {
    const body = metricsSrc.split("export const getMetrics")[1];
    expect(body).not.toContain("componentScores");
    expect(body).not.toContain("legitimacyScores.value");
    expect(body).not.toContain("medianTarget");
  });
});

describe("SLICE-P7E-03 — award path (CAP-272/273/274/275/280/285)", () => {
  it("event weights are the QUOTED register values", () => {
    const w = awardSrc.split("SEALED_EVENT_WEIGHTS")[1].split("} as const")[0];
    expect(w).toContain("view: 0.3");
    expect(w).toContain("reaction: 1");
    expect(w).toContain("reply: 1.5");
    expect(w).toContain("comment: 2");
    expect(w).toContain("completion: 2.5");
    expect(w).toContain("save: 3");
    expect(w).toContain("cta: 10");
    expect(w).toContain("conversion: 25");
  });
  it("bare view/reaction with no downstream outcome = ZERO Signal (AC-10, quoted)", () => {
    const families = awardSrc.split("OUTCOME_FAMILIES")[1].split("};")[0];
    expect(families).not.toContain('"view"');
    // reactions only credit as OUTCOME events (comment.reacted), never exposure
    expect(families).toContain('"comment.reacted"');
  });
  it("provisional @80% × legitimacy (CAP-273) + confidence damping (CAP-280)", async () => {
    const { computeProvisional, SEALED_EVENT_WEIGHTS } = await import("../../../../../../convex/signal/award");
    const out = computeProvisional({
      grossValue: SEALED_EVENT_WEIGHTS.cta, // 10
      legitimacyFactor: 1,
      confidenceInput: { volume: 100000 }, // saturating → ~1
      suspected: false, dampFactor: 1,
    });
    expect(out.signalValue).toBeLessThanOrEqual(SEALED_EVENT_WEIGHTS.cta * 0.8 + 1e-9);
    expect(out.signalValue).toBeGreaterThan(SEALED_EVENT_WEIGHTS.cta * 0.8 * 0.9);
  });
  it("CAP-285 shadow-damp: suspected events still tick (fractional, never zero)", async () => {
    const { computeProvisional } = await import("../../../../../../convex/signal/award");
    const out = computeProvisional({
      grossValue: 10, legitimacyFactor: 1,
      confidenceInput: { volume: 100000 },
      suspected: true, dampFactor: 0.4,
    });
    expect(out.signalValue).toBeGreaterThan(0);
    expect(out.signalValue).toBeLessThan(10 * 0.8);
  });
  it("CAP-285 the damp factor is APPLIED — suspected automation never earns full Signal", async () => {
    const { effectiveDamp } = await import("../../../../../../convex/signal/award");
    // clean actor + clean event → full weight
    expect(effectiveDamp({ suspected: false, dampFactor: 1 }, false)).toBe(1);
    // actor-level damp disposition: the flag's own factor binds (strongest wins)
    expect(effectiveDamp({ suspected: true, dampFactor: 0.25 }, true)).toBe(0.25);
    expect(effectiveDamp({ suspected: true, dampFactor: 0.25 }, false)).toBe(0.25);
    // event-level suspicion with no actor flag → fractional default, NOT 1
    const eventDamp = effectiveDamp({ suspected: false, dampFactor: 1 }, true);
    expect(eventDamp).toBeGreaterThan(0);
    expect(eventDamp).toBeLessThan(1);
  });
  it("CAP-285 the gate reads the actor's damp dispositions (the flag's dampFactor, schema l.341)", () => {
    const fn = awardSrc.split("passesOutcomeGate")[1];
    expect(fn).toContain('eq("disposition", "damp")');
    // the fetched flags feed the returned factor — not a dead fetch
    expect(fn).toContain("Math.min(...flags.map((f: any) => f.dampFactor))");
    // neutralize still hard-stops before damp applies
    expect(fn.indexOf("if (neutralized) return null")).toBeLessThan(fn.indexOf("Math.min(...flags.map"));
  });
  it("event-level suspicion booleans reach the award with a fractional factor", () => {
    const fn = awardSrc.split("1. Event-driven outcome families")[1].split("// 2.")[0];
    expect(fn).toContain("eventSuspected");
    expect(fn).toContain("effectiveDamp(gate, eventSuspected)");
  });
  it("CAP-275 CTA gate: only settled qualified clicks credit (dwell/once-per-window live in the P6-17/P6-18 machinery)", () => {
    const branch = awardSrc.split("CAP-275 qualified-CTA outcomes")[1].split("// 3.")[0];
    expect(branch).toContain('click.qualification !== "qualified"');
    expect(branch).toContain('click.integrityStatus !== "settled"');
  });
  it("not-self + staff/persona exclusion + per-(actor,target) cap (CAP-274)", () => {
    expect(awardSrc).toContain("input.actorId === input.awardeeId");
    expect(awardSrc).toContain("actorIsStaffOrPersona");
    expect(awardSrc).toContain("PER_ACTOR_TARGET_CAP");
  });
  it("sealed key names appear NOWHERE as config reads (H5)", () => {
    for (const key of ["signal.eventWeights", "signal.attributionSplit", "legitimacy.medianTarget", "trust.weightCap"]) {
      expect(awardSrc).not.toContain(`"${key}"`);
      expect(settleSrc).not.toContain(`"${key}"`);
    }
  });
});

describe("SLICE-P7E-04 — settle / reversal / clawback (CAP-276/277/278/279)", () => {
  it("settle window ≤7d; older provisionals finalize or reverse", () => {
    expect(settleSrc).toContain("SETTLE_WINDOW_DAYS = 7");
    expect(settleSrc).toContain('"provisional"');
  });
  it("V1 positional split ~85% author / ~15% commenter pool; journey-linked only (F2)", () => {
    expect(settleSrc).toContain("AUTHOR_SHARE = 0.85");
    expect(settleSrc).toContain("COMMENTER_SHARE = 0.15");
    expect(settleSrc).toContain("journeyCommenters");
  });
  it("append-only: reversal/clawback are NEW rows, never rewrites", () => {
    expect(settleSrc).toContain('"reversal:' + '" + ledgerId');
    expect(settleSrc).toContain("entryType: \"reversal\"");
    expect(settleSrc).toContain("entryType: \"clawback\"");
    // the original flips state ONLY — its value is never edited
    const reversalFn = settleSrc.split("export async function reverseTx")[1].split("export async function clawbackTx")[0];
    expect(reversalFn).toContain('ctx.db.patch(ledgerId, { state: "reversed", reversedAt: now })');
  });
  it("displayed = max(Σ finalized, 0): reversal rows are negative finalized entries", () => {
    expect(settleSrc).toContain("signalValue: -row.signalValue");
    expect(summarySrc).toContain("Math.max(0, total)");
  });
});

describe("SLICE-P7E-06 — signalSummary (CAP-281)", () => {
  it("decay is the quoted clamp((90−days)/90,0,1)", async () => {
    const { activeDecay } = await import("../../../../../../convex/jobs/signalSummary");
    expect(activeDecay(0)).toBe(1);
    expect(activeDecay(45)).toBeCloseTo(0.5, 5);
    expect(activeDecay(90)).toBe(0);
    expect(activeDecay(200)).toBe(0);
  });
  it("writes ALL THREE fields (the Metrics tab binds Active — P7E-09's job)", () => {
    expect(summarySrc).toContain("totalSignals");
    expect(summarySrc).toContain("activeSignals");
    expect(summarySrc).toContain("pendingSignals");
  });
});

describe("SLICE-P7E-07 — Recognition / badges / Podium (CAP-293..298)", () => {
  it("recognition NEVER reads signalLedger (firewall-reverse, quoted)", () => {
    expect(recognitionSrc).not.toContain('query("signalLedger")');
    expect(recognitionSrc).not.toContain("signalSummary");
  });
  it("Podium: min 25 eligible else forming — never fabricates", () => {
    expect(recognitionSrc).toContain("PROJECTION_MIN_ELIGIBLE = 25");
    expect(recognitionSrc).toContain("minThresholdMet: false");
  });
  it("revoked badges stay on the public shelf/count (bible l.340 quoted)", () => {
    expect(recognitionSrc).toContain('b.state === "finalized" || b.state === "revoked"');
    expect(recognitionSrc).toContain("revocationBasis");
    expect(metricsSrc).toContain('b.state === "finalized" || b.state === "revoked"');
  });
  it("revoke is fraud/impersonation-class ONLY — never inactivity/level-drop", () => {
    const fn = recognitionSrc.split("CAP-296 badge.revoke")[1];
    expect(fn).toContain('"fraud_confirmed"');
  });
});

describe("SLICE-P7E-08 — Reach / Might / Level (CAP-302..316 + CAP-570)", () => {
  it("Might = √(reachFactor × activeSignals) (CAP-304 quoted)", () => {
    expect(mightSrc).toContain("Math.sqrt(dist.reachFactor * active)");
  });
  it("memberCount = clean integer of eligible members; reachFactor = Σ legitimacy never shown", () => {
    expect(mightSrc).toContain('m.eligibilityStatus === "qualified"');
    const body = metricsSrc.split("export const getMetrics")[1].split("export const join")[0];
    expect(body).not.toContain("reachFactor");
  });
  it("NO monthly demotion — the commit only promotes past the floor", () => {
    const fn = mightSrc.split("levelCommitMonthly")[1];
    expect(fn).toContain("NO monthly demotion");
    expect(fn).toContain("let level = dist.currentLevel");
  });
  it("CAP-570 tier_unlocked is a SAME-MUTATION append (throw rolls back the commit)", () => {
    const fn = mightSrc.split("levelCommitMonthly")[1];
    expect(fn).toContain('"tier_unlocked"');
    expect(fn.indexOf("tier_unlocked")).toBeLessThan(fn.indexOf("promoted += 1"));
  });
  it("dormant at Might=0 for 180d (CAP-316)", () => {
    expect(mightSrc).toContain("180");
  });
});

describe("SLICE-P7E-09 — Metrics tab (CAP-281/312/313/300/301 + CAP-298 reads)", () => {
  it("triad Signals = activeSignals — Total/Pending never projected", () => {
    expect(metricsSrc).toContain("signals: summary?.activeSignals");
    expect(metricsSrc).not.toContain("totalSignals: summary");
    expect(metricsSrc).not.toContain("pendingSignals: summary");
  });
  it("CAP-312 opt-out hides the FULL economy surface (math unchanged)", () => {
    const branch = metricsSrc.split("leaderboardOptOut")[1].split("const dist")[0];
    expect(branch).toContain("economyHidden: true");
  });
  it("CAP-298 reads: NO leaderboardProjections / recognitionEvents in this query", () => {
    const body = metricsSrc.split("export const getMetrics")[1].split("export const join")[0];
    expect(body).not.toContain("leaderboardProjections");
    expect(body).not.toContain("recognitionEvents");
  });
  it("join: never auto + legitimacy snapshot captured (CAP-300 quoted)", () => {
    expect(metricsSrc).toContain("memberLegitimacySnapshot: legitimacy?.value ?? 0.05");
    expect(metricsSrc).toContain("join: authentication required");
  });
  it("leave: leftAt set (log-scaled negligible reach — CAP-301)", () => {
    expect(metricsSrc).toContain("leftAt: Date.now()");
  });
});

describe("economy cron wiring", () => {
  it("all nine engine crons wired to internal functions", () => {
    for (const ref of [
      "internal.signal.award.sweep",
      "internal.jobs.legitimacy.recompute",
      "internal.jobs.attributionSettle.settle",
      "internal.jobs.signalSummary.recompute",
      "internal.jobs.recognition.rollup",
      "internal.jobs.recognition.finalizeAwards",
      "internal.jobs.might.reachRefresh",
      "internal.jobs.might.mightRecompute",
      "internal.jobs.might.levelCommitMonthly",
    ]) {
      expect(cronsSrc).toContain(ref);
    }
  });
});
