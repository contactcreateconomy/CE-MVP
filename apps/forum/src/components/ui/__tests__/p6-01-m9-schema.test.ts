/* eslint-disable @typescript-eslint/no-explicit-any -- schema introspection tests */
import { describe, it, expect } from "vitest";

/* SLICE-P6-01 acceptance tests — M9 distribution schema vs bible
 * l.129-139. Sources: feed + curation contracts §2; bible quotes in the
 * schema region comments. */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): any[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};
const indexNames = (t: any) => (t.indexes ?? []).map((i: any) => i.indexDescriptor);

describe("SLICE-P6-01 — M9 distribution schema (11 tables)", () => {
  const tables = [
    "postDistributionScores", "postDistributionBuckets", "feedExplorationState",
    "heroSlots", "heroAssignments", "vibingTrends", "vibingHooks", "vibingFeatured",
    "cardSummaries", "leaderboardProjections", "feedSessions",
  ];

  it("all 11 M9 tables exist", () => {
    for (const t of tables) expect(schema.tables[t], t).toBeDefined();
  });

  it("postDistributionScores: l.129 field list + Top/Hot/New scan indexes (never compute-at-read)", () => {
    const t = schema.tables.postDistributionScores;
    for (const f of [
      "postId", "distributionQualityVersion", "topScore", "hotScore", "trendScore",
      "integrityMultiplier", "valuableWeighted", "distinctCommenters", "replyCount",
      "saveCount", "qualifiedReads", "returns7d", "qualifiedExposureCount",
      "explorationDeficit", "lastEligibleInteractionAt", "scoreVersion", "dirtySince", "computedAt",
    ]) {
      expect(hasField(t, f), `postDistributionScores.${f}`).toBe(true);
    }
    for (const ix of ["by_topScore", "by_hotScore", "by_lastEligibleInteractionAt", "by_dirtySince"]) {
      expect(indexNames(t)).toContain(ix);
    }
  });

  it("feedExplorationState is a queue, never an operator surface (l.131)", () => {
    const t = schema.tables.feedExplorationState;
    for (const f of ["postId", "qualifiedExposureTarget", "qualifiedExposureCount", "insertionCount", "lastInsertedAt", "eligibilityStatus", "completedAt"]) {
      expect(hasField(t, f), `feedExplorationState.${f}`).toBe(true);
    }
  });

  it("heroSlots: 10-slot managed inventory with the 6-state lifecycle (l.132 + CAP-192)", () => {
    const t = schema.tables.heroSlots;
    expect(literalValues(fieldsOf(t).status).sort()).toEqual(
      ["active", "archived", "draft", "expired", "paused", "scheduled"].sort(),
    );
    expect(hasField(t, "slotOrder"));
    expect(hasField(t, "disclosureClass")); // values unnamed (OQ3) — string, flagged
  });

  it("vibingTrends: human-activity-only substrate — distinctHumanCount is the qualification key (l.134)", () => {
    const t = schema.tables.vibingTrends;
    expect(hasField(t, "distinctHumanCount"));
    expect(hasField(t, "integrityMultiplier"));
    expect(literalValues(fieldsOf(t).objectType).sort()).toEqual(["category", "post", "theme", "tool"].sort());
  });

  it("vibingHooks: valence + entailment + spans (l.135)", () => {
    const t = schema.tables.vibingHooks;
    expect(literalValues(fieldsOf(t).valence).sort()).toEqual(["curiosity", "informational", "positive", "tension"].sort());
    expect(literalValues(fieldsOf(t).entailment).sort()).toEqual(["contradicted", "insufficient", "supported"].sort());
    expect(hasField(t, "supportingSpans"));
    expect(hasField(t, "opposingSpans"));
  });

  it("vibingFeatured.status includes pulled (CAP-554) — the emergency-pull literal", () => {
    const t = schema.tables.vibingFeatured;
    expect(literalValues(fieldsOf(t).status)).toContain("pulled");
    // trendScore is NOT a field here — Featured NEVER mutates it (l.136)
    expect(hasField(t, "trendScore")).toBe(false);
  });

  it("cardSummaries: display projection — runningCommentRef frozen + avatars ≤3 + counts (l.137)", () => {
    const t = schema.tables.cardSummaries;
    expect(hasField(t, "runningCommentRef"));
    expect(hasField(t, "avatarUserIds"));
    expect(hasField(t, "discussingCount"));
    // MUST NOT carry any rank/score field (quoted l.137)
    for (const banned of ["topScore", "hotScore", "trendScore", "rank"]) {
      expect(hasField(t, banned), `cardSummaries.${banned} must not exist`).toBe(false);
    }
  });

  it("leaderboardProjections: read-only M12 projection with minThresholdMet (l.138)", () => {
    const t = schema.tables.leaderboardProjections;
    expect(hasField(t, "minThresholdMet"));
    expect(literalValues(fieldsOf(t).category).sort()).toEqual(
      ["commenter", "helper", "overall", "reviewer", "rising"].sort(),
    );
    expect(literalValues(fieldsOf(t).window).sort()).toEqual(["d7", "h24", "m1"].sort());
  });

  it("feedSessions: ordering continuity (l.139)", () => {
    const t = schema.tables.feedSessions;
    for (const f of ["sessionId", "userId", "sortMode", "rankingVersion", "createdAt", "expiresAt"]) {
      expect(hasField(t, f), `feedSessions.${f}`).toBe(true);
    }
  });
});
