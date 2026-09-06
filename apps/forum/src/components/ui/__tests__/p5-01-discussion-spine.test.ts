/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection tests */
import { describe, it, expect } from "vitest";

/* SLICE-P5-01 acceptance tests — M6 discussion spine schema-vs-bible
 * fidelity. Sources: bible l.79-115 (comments, commentReactions,
 * commentSaves, commentContextSignals, commentScores, threadStats,
 * threadReadStates, userReadingProgress, threadPluginConfig);
 * CONTRACT-5-discussion-thread §2/§3 (INV-1 depth, INV-3 never-lowers,
 * mutual exclusivity, tombstone semantics). */

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

describe("SLICE-P5-01 — M6 discussion spine", () => {
  it("comments: bible l.79 field list, INV-1 depth {0|1}, self-id threadRoot convention", () => {
    const t = schema.tables.comments;
    for (const f of [
      "postId", "parentCommentId", "threadRootCommentId", "replyToCommentId",
      "depth", "authorType", "authorUserId", "authorPersonaId", "body",
      "authorIntent", "isQuestion", "moderationStatus", "editedAt",
      "deletedAt", "lastActivityAt", "createdAt",
    ]) {
      expect(hasField(t, f), `comments.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).depth).sort()).toEqual([0, 1]);
    expect(literalValues(fieldsOf(t).authorIntent).sort()).toEqual(
      ["answer", "counterpoint", "evidence", "experience", "question"].sort(),
    );
    expect(literalValues(fieldsOf(t).moderationStatus).sort()).toEqual(
      ["held", "not_required", "passed", "pending", "rejected", "removed"].sort(),
    );
    // Sort-mode + cursor-freeze scaffold: post/parent/root scans are indexed
    for (const ix of ["by_post_depth_created", "by_parent_created", "by_thread_root_created"]) {
      expect(indexNames(t)).toContain(ix);
    }
  });

  it("commentReactions: bible l.81 — valuable/negative only, private reason enum, weightAtCast", () => {
    const t = schema.tables.commentReactions;
    for (const f of ["userId", "commentId", "reactionType", "reason", "weightAtCast", "createdAt"]) {
      expect(hasField(t, f), `commentReactions.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).reactionType).sort()).toEqual(["negative", "valuable"]);
    expect(literalValues(fieldsOf(t).reason).sort()).toEqual(
      ["disagree", "needs_evidence", "not_useful", "off_topic"].sort(),
    );
    // Mutual exclusivity lookup path exists (one row per user+comment)
    expect(indexNames(t)).toContain("by_user_comment");
    // 'like'/'downvote' vocabulary must NOT exist (DEC-M6-REACTIONS)
    expect(literalValues(fieldsOf(t).reactionType)).not.toContain("like");
  });

  it("commentScores: bible l.103 projection + indexed dirty-score queue", () => {
    const t = schema.tables.commentScores;
    for (const f of [
      "commentId", "valuableCount", "replyCount", "distinctReplierCount",
      "saveCount", "contextSignalCount", "bestScore", "liveScore",
      "mostDiscussedScore", "rankVersion", "lastInteractionAt", "lastRankedAt",
      "dirty",
    ]) {
      expect(hasField(t, f), `commentScores.${f}`).toBe(true);
    }
    expect(indexNames(t)).toContain("by_comment");
    expect(indexNames(t)).toContain("by_dirty_lastInteraction");
  });

  it("commentSaves + commentContextSignals: bible l.104/105", () => {
    const saves = schema.tables.commentSaves;
    for (const f of ["userId", "commentId", "createdAt"]) {
      expect(hasField(saves, f), `commentSaves.${f}`).toBe(true);
    }
    expect(indexNames(saves)).toContain("by_user_comment");

    const signals = schema.tables.commentContextSignals;
    for (const f of ["userId", "commentId", "signalType", "status", "createdAt"]) {
      expect(hasField(signals, f), `commentContextSignals.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(signals).signalType).sort()).toEqual(["context_needed", "outdated"]);
  });

  it("threadStats: bible l.107 — persona counts separate (INV-6), threadRevision for read-state", () => {
    const t = schema.tables.threadStats;
    for (const f of [
      "postId", "humanCommentCount", "personaCommentCount", "topLevelCount",
      "replyCount", "humanParticipantCount", "unresolvedQuestionCount",
      "latestHumanCommentId", "latestActivityAt", "threadRevision", "updatedAt",
    ]) {
      expect(hasField(t, f), `threadStats.${f}`).toBe(true);
    }
    expect(indexNames(t)).toContain("by_postId");
  });

  it("threadReadStates + userReadingProgress: bible l.106/115 — unique (userId, postId) lookup path", () => {
    const read = schema.tables.threadReadStates;
    for (const f of [
      "userId", "postId", "lastReadCommentId", "lastReadAt",
      "lastSeenHumanCommentCount", "lastSeenThreadRevision", "updatedAt",
    ]) {
      expect(hasField(read, f), `threadReadStates.${f}`).toBe(true);
    }
    expect(indexNames(read)).toContain("by_user_post");

    const prog = schema.tables.userReadingProgress;
    for (const f of ["userId", "topicsViewedCount", "postsReadCount", "totalReadTimeSeconds", "updatedAt"]) {
      expect(hasField(prog, f), `userReadingProgress.${f}`).toBe(true);
    }
  });

  it("threadPluginConfig: bible l.109 — typed-keys registry, never redefines depth/moderation", () => {
    const t = schema.tables.threadPluginConfig;
    for (const f of ["postType", "featureKey", "enabled", "config", "updatedByUserId", "updatedAt"]) {
      expect(hasField(t, f), `threadPluginConfig.${f}`).toBe(true);
    }
    expect(indexNames(t)).toContain("by_postType_featureKey");
  });

  it("CAP-122 representable: postHelps.acceptedCommentId is a comments FK", () => {
    const t = schema.tables.postHelps;
    expect(hasField(t, "acceptedCommentId")).toBe(true);
    const f: any = fieldsOf(t).acceptedCommentId;
    expect(f.kind === "optional" ? f.value.kind : f.kind).toBe("id");
  });

  it("deferred-with-flag: MAX tables + rank snapshots are NOT defined here (Phase-7 owners)", () => {
    for (const absent of [
      "threadIntelligenceRuns", "threadThemes", "threadPositions",
      "threadQuestions", "commentRankSnapshots",
    ]) {
      expect(schema.tables[absent], `${absent} must not be defined in P5-01`).toBeUndefined();
    }
  });
});
