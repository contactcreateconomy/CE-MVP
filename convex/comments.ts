/**
 * comments — SLICE-P5-02: CAP-120/121/122 — comments.create (full gate
 * chain), comments.edit (ownership), comments.softDelete (tombstone +
 * postHelps same-tx clear).
 *
 * Gate chain per CAP-120 (quoted): "M7 R-ELIGIBILITY comment check
 *   passed; M13 auto-mod pass" + INV-1 one-reply-depth + INV-2 no user
 *   URLs. Same-mutation writes (quoted): "parent replyCount + threadStats
 *   + dirty-flag. atomic rawEvents append."
 *
 * CAP-141 (quoted): "Comment = email+mobile verified; no profile gate."
 * CAP-321 (quoted): "deterministic checks → pass/hold/hard reject
 *   (URL/dup)". The classifier seam (lib/classifier) is G4-deferred:
 *   unavailable ⇒ moderationStatus=pending (fail-closed hold, never
 *   pass-through) + a moderationCases row — flagged, correct posture.
 *   Unsafe ⇒ held + a case (M13 owns disposition; no auto-terminal reject
 *   from a flaky classifier — mapping flagged).
 *
 * CAP-155: the shared outbound-link helper is posts.ts's checkNoUrls —
 *   one implementation, two call sites (register row is CANDIDATE-status;
 *   INV-2 bans comment URLs outright).
 *
 * Personas never call this surface: CAP-173 (P5-11) publishes persona
 *   comments via the M6 rules with approvingUserId — authorType here is
 *   always "user" (persona path excluded by construction).
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability, assertAdminPermission } from "./lib/authz";
import { captureEvent } from "./lib/events";
import { classifySafety } from "./lib/classifier";
import { checkNoUrls } from "./posts";
import { checkCommentEligibility } from "./eligibility";
import { appendActivity } from "./activity";

/** Input bound only — comment body-length product rules are unspecified
 *  (contract OQ8); this is a server input ceiling, not a product rule. */
const COMMENT_BODY_MAX = 10_000;

/** CAP-437 catalog rows (names catalog-owned — none named in the register
 *  for these actions; flagged). Same-mutation captureMode per CAP-436. */
export const COMMENT_EVENT_CATALOG_ROWS = [
  {
    eventName: "comment.created",
    schemaVersion: 1,
    eventClass: "outcome" as const,
    ownerModule: "m6",
    description: "Member submits a comment (CAP-120)",
    captureMode: "same_mutation",
    piiClass: "none",
    consentGate: "strictly_necessary",
    signalEligible: false,
    s18Eligible: false,
    excludeStaff: true,
    excludePersonas: true,
    idempotencyScope: "none",
    retentionClass: "standard",
    posthogMirror: false,
    status: "active" as const,
    effectiveFrom: Date.now(),
    owner: "m6",
  },
  {
    eventName: "comment.edited",
    schemaVersion: 1,
    eventClass: "outcome" as const,
    ownerModule: "m6",
    description: "Member edits own comment (CAP-121)",
    captureMode: "same_mutation",
    piiClass: "none",
    consentGate: "strictly_necessary",
    signalEligible: false,
    s18Eligible: false,
    excludeStaff: true,
    excludePersonas: true,
    idempotencyScope: "none",
    retentionClass: "standard",
    posthogMirror: false,
    status: "active" as const,
    effectiveFrom: Date.now(),
    owner: "m6",
  },
  {
    eventName: "comment.deleted",
    schemaVersion: 1,
    eventClass: "outcome" as const,
    ownerModule: "m6",
    description: "Member/moderator soft-deletes a comment (CAP-122)",
    captureMode: "same_mutation",
    piiClass: "none",
    consentGate: "strictly_necessary",
    signalEligible: false,
    s18Eligible: false,
    excludeStaff: true,
    excludePersonas: true,
    idempotencyScope: "none",
    retentionClass: "standard",
    posthogMirror: false,
    status: "active" as const,
    effectiveFrom: Date.now(),
    owner: "m6",
  },
];

async function commentScoresRow(ctx: any, commentId: Id<"comments">): Promise<any | null> {
  return await ctx.db.query("commentScores").withIndex("by_comment", (q: any) => q.eq("commentId", commentId)).unique();
}

async function threadStatsRow(ctx: any, postId: Id<"posts">): Promise<any | null> {
  return await ctx.db.query("threadStats").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique();
}

/** CAP-321 deterministic duplicate check — exact same body by the same
 *  member on the same post within the recent window (bounded scan of the
 *  member's comments on this post). Dup → hold for review. */
async function isDuplicateComment(ctx: any, userId: Id<"users">, postId: Id<"posts">, body: string): Promise<boolean> {
  const rows = await ctx.db
    .query("comments")
    .withIndex("by_post_depth_created", (q: any) => q.eq("postId", postId))
    .filter((q: any) => q.eq(q.field("authorUserId"), userId))
    .take(20);
  return rows.some((r: any) => !r.deletedAt && r.body === body);
}

/** Open a moderationCase for the auto-gate's hold/review outcomes
 *  (CAP-321 Writes; target = the comment record — SETTLED). */
async function openModerationCase(ctx: any, commentId: Id<"comments">, reasonCode: string): Promise<void> {
  await ctx.db.insert("moderationCases", {
    caseType: "ugc_safety",
    targetType: "comment",
    targetId: commentId,
    policyFamily: "quality_guidelines",
    severity: "s3_low",
    priority: 3,
    status: "open",
    reasonCode,
    policyVersion: "m6.v1",
    reporterCountDistinct: 0,
    reporterClusterCount: 0,
    agingLevel: 0,
    createdAt: Date.now(),
  });
}

/** CAP-120 `comments.create`. */
export const create = mutation({
  args: {
    postId: v.id("posts"),
    parentCommentId: v.optional(v.id("comments")),
    replyToCommentId: v.optional(v.id("comments")),
    body: v.string(),
    authorIntent: v.optional(v.union(
      v.literal("question"), v.literal("answer"), v.literal("evidence"),
      v.literal("counterpoint"), v.literal("experience"),
    )),
    isQuestion: v.optional(v.boolean()),
  },
  returns: v.object({
    commentId: v.id("comments"),
    moderationStatus: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("comments.create: authentication required");

    // R-GATE (CAP-393 applies-to: "comment")
    await assertCustomerCapability(ctx, "comment");

    // Host post: published only (commenting on archived posts is
    // register-silent — blocked, flagged)
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("comments.create: post not found");
    if (post.lifecycleStatus !== "published") {
      throw new Error("comments.create: thread is not open on this post");
    }

    // INV-1: one reply depth — a reply's parent must be top-level
    const depth: 0 | 1 = args.parentCommentId ? 1 : 0;
    let threadRoot: Id<"comments"> | null = null;
    if (args.parentCommentId) {
      const parent = await ctx.db.get(args.parentCommentId);
      if (!parent || parent.postId !== args.postId) throw new Error("comments.create: parent comment not found on this post");
      if (parent.depth !== 0) throw new Error("comments.create: INV-1 — one reply depth only");
      if (parent.deletedAt) throw new Error("comments.create: parent is tombstoned (replies preserved, not extendable)");
      threadRoot = parent.threadRootCommentId;
    }

    // INV-2 / R-URL (CAP-155 shared helper — same implementation as the composer)
    checkNoUrls(args.body);
    if (args.body.trim().length === 0) throw new Error("comments.create: body required");
    if (args.body.length > COMMENT_BODY_MAX) throw new Error(`comments.create: body exceeds ${COMMENT_BODY_MAX} chars`);

    // CAP-141 — email+mobile verified + active + not-restricted; no profile gate
    await checkCommentEligibility(ctx, userId);

    // CAP-321 deterministic auto-mod: dup → hold; classifier → pass/hold
    let moderationStatus: "passed" | "pending" | "held" = "passed";
    let holdReason: string | null = null;
    if (await isDuplicateComment(ctx, userId, args.postId, args.body.trim())) {
      moderationStatus = "pending";
      holdReason = "duplicate_comment";
    } else {
      const safety = await classifySafety(args.body);
      if (!safety.available) {
        // G4-deferred: fail-closed hold — never pass-through unmoderated
        moderationStatus = "pending";
        holdReason = "classifier_unavailable";
      } else if (safety.unsafe) {
        moderationStatus = "held";
        holdReason = "classifier_unsafe";
      }
    }

    const now = Date.now();
    const isQuestion = args.isQuestion ?? args.authorIntent === "question";

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      parentCommentId: args.parentCommentId,
      threadRootCommentId: threadRoot ?? ("" as any), // patched to self-id below (depth 0)
      replyToCommentId: args.replyToCommentId,
      depth,
      authorType: "user",
      authorUserId: userId,
      body: args.body,
      authorIntent: args.authorIntent,
      isQuestion,
      moderationStatus,
      lastActivityAt: now,
      createdAt: now,
    });
    if (depth === 0) {
      await ctx.db.patch(commentId, { threadRootCommentId: commentId }); // self-id convention
      threadRoot = commentId;
    }

    // Same-mutation: commentScores projection row (dirty for P5-04 recompute)
    await ctx.db.insert("commentScores", {
      commentId,
      valuableCount: 0,
      replyCount: 0,
      distinctReplierCount: 0,
      saveCount: 0,
      contextSignalCount: 0,
      bestScore: 0,
      liveScore: 0,
      mostDiscussedScore: 0,
      rankVersion: 0,
      lastInteractionAt: now,
      lastRankedAt: 0,
      dirty: true,
    });

    // Same-mutation: parent replyCount patch + dirty-flag (CAP-120)
    if (args.parentCommentId) {
      const parentScores = await commentScoresRow(ctx, args.parentCommentId);
      if (parentScores) {
        await ctx.db.patch(parentScores._id, {
          replyCount: parentScores.replyCount + 1,
          dirty: true,
          lastInteractionAt: now,
        });
      }
    }

    // Same-mutation: threadStats deltas (rebuildable projection)
    const priorStats = await threadStatsRow(ctx, args.postId);
    const firstCommentOnPost = priorStats
      ? !(await ctx.db
          .query("comments")
          .withIndex("by_post_depth_created", (q: any) => q.eq("postId", args.postId))
          .filter((q: any) => q.eq(q.field("authorUserId"), userId))
          .first())
      : true;
    if (priorStats) {
      await ctx.db.patch(priorStats._id, {
        humanCommentCount: priorStats.humanCommentCount + 1,
        topLevelCount: priorStats.topLevelCount + (depth === 0 ? 1 : 0),
        replyCount: priorStats.replyCount + (depth === 1 ? 1 : 0),
        humanParticipantCount: priorStats.humanParticipantCount + (firstCommentOnPost ? 1 : 0),
        unresolvedQuestionCount: priorStats.unresolvedQuestionCount + (isQuestion && depth === 0 ? 1 : 0),
        latestHumanCommentId: commentId,
        latestActivityAt: now,
        threadRevision: priorStats.threadRevision + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("threadStats", {
        postId: args.postId,
        humanCommentCount: 1,
        personaCommentCount: 0,
        topLevelCount: depth === 0 ? 1 : 0,
        replyCount: depth === 1 ? 1 : 0,
        humanParticipantCount: 1,
        unresolvedQuestionCount: isQuestion && depth === 0 ? 1 : 0,
        latestHumanCommentId: commentId,
        latestActivityAt: now,
        threadRevision: 1,
        updatedAt: now,
      });
    }

    // CAP-321/CAP-154: the hold path opens a case (M13 owns disposition)
    if (holdReason) await openModerationCase(ctx, commentId, holdReason);

    // Same-mutation atomic rawEvents append (CAP-436/437/438)
    await captureEvent(ctx, {
      eventType: "comment.created",
      schemaVersion: 1,
      eventClass: "outcome",
      userId,
      targetType: "comment",
      targetId: commentId,
      authorUserId: userId,
      authorType: "user",
      source: "direct",
      isStaff: false,
      isPersona: false,
      isCountableAtWrite: moderationStatus === "passed",
      postId: args.postId,
      moderationStatus,
    } as any);

    // CAP-570 call-site: comment_created Journal append (meta tagged)
    await appendActivity(ctx, {
      userId,
      eventType: "comment_created",
      targetType: "comment",
      targetId: commentId,
      summary: "Commented on a discussion",
      meta: {
        postId: { value: args.postId, privacy: "safe_for_public" },
        moderationStatus: { value: moderationStatus, privacy: "safe_for_public" },
      },
    });

    return { commentId, moderationStatus };
  },
});

/** CAP-121 `comments.edit` — ownership + edited marker; re-runs the URL
 *  gate and re-moderates (fail-closed: an edit re-holds until reviewed). */
export const edit = mutation({
  args: { commentId: v.id("comments"), body: v.string() },
  returns: v.object({ edited: v.boolean(), moderationStatus: v.string() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("comments.edit: authentication required");
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("comments.edit: comment not found");
    if (comment.authorUserId !== userId) throw new Error("comments.edit: not your comment (CAP-121 ownership)");
    if (comment.deletedAt) throw new Error("comments.edit: tombstoned comments are immutable");
    checkNoUrls(args.body);
    if (args.body.trim().length === 0) throw new Error("comments.edit: body required");
    if (args.body.length > COMMENT_BODY_MAX) throw new Error(`comments.edit: body exceeds ${COMMENT_BODY_MAX} chars`);

    const safety = await classifySafety(args.body);
    const moderationStatus = !safety.available ? "pending" : safety.unsafe ? "held" : "passed";
    const now = Date.now();
    await ctx.db.patch(args.commentId, { body: args.body, editedAt: now, lastActivityAt: now, moderationStatus });
    if (moderationStatus !== "passed") await openModerationCase(ctx, args.commentId, `edit_${!safety.available ? "classifier_unavailable" : "classifier_unsafe"}`);

    const scores = await commentScoresRow(ctx, args.commentId);
    if (scores) await ctx.db.patch(scores._id, { dirty: true, lastInteractionAt: now });
    const stats = await threadStatsRow(ctx, comment.postId);
    if (stats) await ctx.db.patch(stats._id, { latestActivityAt: now, threadRevision: stats.threadRevision + 1, updatedAt: now });

    await captureEvent(ctx, {
      eventType: "comment.edited",
      schemaVersion: 1,
      eventClass: "outcome",
      userId,
      targetType: "comment",
      targetId: args.commentId,
      authorUserId: userId,
      authorType: "user",
      source: "direct",
      isStaff: false,
      isPersona: false,
      isCountableAtWrite: moderationStatus === "passed",
      postId: comment.postId,
    } as any);
    return { edited: true, moderationStatus };
  },
});

/** CAP-122 `comments.softDelete` — tombstone; replies preserved;
 *  postHelps.acceptedCommentId cleared in the SAME transaction
 *  (DEC-M4-HARDEN; resolvedStatus reverts to open per CAP-106 read
 *  tolerance). Member owns their comment; Moderator via RBAC §12. */
export const softDelete = mutation({
  args: { commentId: v.id("comments") },
  returns: v.object({ deleted: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("comments.softDelete: authentication required");
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("comments.softDelete: comment not found");
    if (comment.deletedAt) return { deleted: true }; // idempotent tombstone

    const isOwner = comment.authorUserId === userId;
    if (!isOwner) {
      const roles = await assertAdminPermission(ctx);
      if (!roles.some((r) => r === "moderator" || r === "administrator")) {
        throw new Error("comments.softDelete: owner or Moderator required (CAP-122)");
      }
    }

    const now = Date.now();
    await ctx.db.patch(args.commentId, { deletedAt: now });

    // Same-tx postHelps clear (CAP-122 / DEC-M4-HARDEN)
    const help = await ctx.db
      .query("postHelps")
      .withIndex("by_postId", (q: any) => q.eq("postId", comment.postId))
      .unique();
    if (help && help.acceptedCommentId === args.commentId) {
      await ctx.db.patch(help._id, { acceptedCommentId: undefined, resolvedStatus: "open" });
    }

    // Projection deltas (rebuildable): decrement what create incremented;
    // participantCount left as-is (distinct-set recompute is P5-04's)
    const stats = await threadStatsRow(ctx, comment.postId);
    if (stats) {
      await ctx.db.patch(stats._id, {
        humanCommentCount: Math.max(0, stats.humanCommentCount - 1),
        topLevelCount: Math.max(0, stats.topLevelCount - (comment.depth === 0 ? 1 : 0)),
        replyCount: Math.max(0, stats.replyCount - (comment.depth === 1 ? 1 : 0)),
        unresolvedQuestionCount: Math.max(0, stats.unresolvedQuestionCount - (comment.isQuestion && comment.depth === 0 ? 1 : 0)),
        latestActivityAt: now,
        threadRevision: stats.threadRevision + 1,
        updatedAt: now,
      });
    }
    const scores = await commentScoresRow(ctx, args.commentId);
    if (scores) await ctx.db.patch(scores._id, { dirty: true, lastInteractionAt: now });

    await captureEvent(ctx, {
      eventType: "comment.deleted",
      schemaVersion: 1,
      eventClass: "outcome",
      userId,
      targetType: "comment",
      targetId: args.commentId,
      authorUserId: comment.authorUserId ?? userId,
      authorType: comment.authorType,
      source: "direct",
      isStaff: !isOwner,
      isPersona: comment.authorType === "persona",
      isCountableAtWrite: false,
      postId: comment.postId,
    } as any);
    return { deleted: true };
  },
});
