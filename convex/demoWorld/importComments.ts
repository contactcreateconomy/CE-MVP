/** demoWorld/importComments — one call per post's whole comment batch so the
 * same-mutation semantics of comments.create hold over the batch: comment
 * inserts (+ depth-0 self-patch threadRootCommentId, INV-1 depth ≤1),
 * commentScores zero-rows dirty:true, parent replyCount bumps, full
 * threadStats computed from the batch (equivalent to the same-tx deltas —
 * values derive purely from these rows), rawEvents comment.created
 * backdated (award family), activityLedger comment_created, isQuestion →
 * unresolvedQuestionCount (CR-011 §1; P0-REPORT §F step 5). */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { guard, register, batchId, findUserByEmail } from "./lib";

export const importComments = internalMutation({
  args: {
    seq: v.number(),
    worldEnd: v.number(),
    postRef: v.string(), // driver ref → demoGroundTruth post payload.postId
    rows: v.array(v.object({
      ref: v.string(),
      authorEmail: v.string(),
      body: v.string(),
      isQuestion: v.boolean(),
      parentRef: v.optional(v.union(v.string(), v.null())),
      createdOffsetMs: v.number(),
      moderationStatus: v.optional(v.string()),
      sentiment: v.optional(v.union(v.string(), v.null())),
      intent: v.optional(v.union(v.string(), v.null())),
      stance: v.optional(v.union(v.string(), v.null())),
      badActorRole: v.optional(v.union(v.string(), v.null())),
    })),
  },
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const batch = batchId("comments", args.seq);
    const gt = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "post").eq("refKey", args.postRef)).unique();
    const postId = gt?.payload?.postId as Id<"posts"> | undefined;
    if (!postId) return { inserted: 0, skipped: args.rows.length };

    const refToId = new Map<string, Id<"comments">>();
    let inserted = 0, skipped = 0;
    const participants = new Set<string>();
    let unresolvedQuestions = 0;
    let latestId: Id<"comments"> | undefined;
    let latestAt = 0;
    let topLevel = 0, replies = 0;

    for (const c of args.rows) {
      if (await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "comment").eq("refKey", c.ref)).unique()) { skipped += 1; continue; }
      const authorId = await findUserByEmail(ctx, c.authorEmail);
      if (!authorId) { skipped += 1; continue; }
      const createdAt = args.worldEnd + c.createdOffsetMs;
      // parents normally arrive in this call; split mega-thread calls may carry them
      // in an earlier call — resolve those through their registered ground-truth row
      const parentId = c.parentRef
        ? (refToId.get(c.parentRef) ?? ((await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "comment").eq("refKey", c.parentRef)).unique())?.payload?.commentId as Id<"comments"> | undefined))
        : undefined;
      const id = await ctx.db.insert("comments", {
        postId,
        ...(parentId ? { parentCommentId: parentId, replyToCommentId: parentId, depth: 1 as const } : { depth: 0 as const }),
        authorType: "user",
        authorUserId: authorId,
        body: c.body,
        isQuestion: c.isQuestion,
        moderationStatus: (c.moderationStatus as any) ?? "passed",
        lastActivityAt: createdAt,
        createdAt,
      });
      if (!parentId) await ctx.db.patch(id, { threadRootCommentId: id }); // self-id convention (depth 0)
      refToId.set(c.ref, id);
      await register(ctx, "comments", id, batch);

      // commentScores zero-row, dirty — rank.recomputeDirtyBatch computes all scores
      const scoreId = await ctx.db.insert("commentScores", {
        commentId: id, valuableCount: 0, replyCount: 0, distinctReplierCount: 0,
        saveCount: 0, contextSignalCount: 0, bestScore: 0, liveScore: 0, mostDiscussedScore: 0,
        rankVersion: 0, lastInteractionAt: createdAt, lastRankedAt: 0, dirty: true,
      });
      await register(ctx, "commentScores", scoreId, batch);

      if (parentId) {
        const parentScore = await ctx.db.query("commentScores").withIndex("by_comment", (q: any) => q.eq("commentId", parentId)).unique();
        if (parentScore) await ctx.db.patch(parentScore._id, { replyCount: parentScore.replyCount + 1, dirty: true, lastInteractionAt: createdAt });
        replies += 1;
      } else topLevel += 1;
      participants.add(authorId);
      if (c.isQuestion) unresolvedQuestions += 1;
      if (createdAt > latestAt) { latestAt = createdAt; latestId = id; }

      // rawEvents comment.created — backdated, direct insert (captureEvent cannot)
      const evId = await ctx.db.insert("rawEvents", {
        eventClass: "interaction", eventType: "comment.created",
        userId: authorId, sequenceInSession: 0,
        targetType: "post", targetId: postId,
        authorUserId: authorId, authorType: "user", postTypeId: gt!.payload.type,
        categoryId: gt!.payload.categoryId ?? undefined,
        source: "direct", schemaVersion: 1,
        isAiPersona: false, isStaff: false, isPersona: false, isCountableAtWrite: true,
        occurredAt: createdAt, receivedAt: createdAt,
      });
      await register(ctx, "rawEvents", evId, batch);

      await ctx.db.insert("activityLedger", {
        userId: authorId, eventType: "comment_created", targetType: "comment", targetId: id,
        summary: "Commented", meta: { demo: { value: true, privacy: "public" } },
        visibility: "public", createdAt,
      });

      const cGtId = await ctx.db.insert("demoGroundTruth", { scope: "comment", refKey: c.ref, batch, payload: { commentId: id, postId, sentiment: c.sentiment ?? null, intent: c.intent ?? null, stance: c.stance ?? null, badActorRole: c.badActorRole ?? null, authorEmail: c.authorEmail } });
      await register(ctx, "demoGroundTruth", cGtId, batch);
      inserted += 1;
    }

    // threadStats — computed from the batch (equivalent to same-tx deltas); split
    // mega-thread calls merge into existing stats instead of clobbering them
    const existing = await ctx.db.query("threadStats").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique();
    const allParticipants = new Set<string>(participants);
    if (existing) {
      const postComments = await ctx.db.query("comments").withIndex("by_post_depth_created", (q: any) => q.eq("postId", postId)).collect();
      for (const pc of postComments) if (pc.authorType === "user" && pc.authorUserId) allParticipants.add(pc.authorUserId);
    }
    const isLater = latestAt > (existing?.latestActivityAt ?? 0);
    const stats = {
      humanCommentCount: (existing?.humanCommentCount ?? 0) + inserted,
      personaCommentCount: existing?.personaCommentCount ?? 0,
      topLevelCount: (existing?.topLevelCount ?? 0) + topLevel,
      replyCount: (existing?.replyCount ?? 0) + replies,
      humanParticipantCount: allParticipants.size,
      unresolvedQuestionCount: (existing?.unresolvedQuestionCount ?? 0) + unresolvedQuestions,
      latestActivityAt: isLater ? latestAt : (existing?.latestActivityAt ?? latestAt ?? args.worldEnd),
      threadRevision: (existing?.threadRevision ?? 0) + 1,
      updatedAt: args.worldEnd,
    };
    if (existing) await ctx.db.patch(existing._id, { ...stats, ...(latestId && isLater ? { latestHumanCommentId: latestId } : {}) });
    else await ctx.db.insert("threadStats", { postId, ...stats, ...(latestId ? { latestHumanCommentId: latestId } : {}) });
    // threadStats rows for demo posts are job-maintained projections of registered
    // rows — they are NOT registered themselves; removal rebuilds them empty-safe.

    return { inserted, skipped };
  },
});
