/**
 * reactions — SLICE-P5-03: CAP-125/126/127/128/131 — valuable/negative
 * reactions, saves, context signals, read-state + reading progress.
 *
 * CAP-125 R-ELIGIBILITY (quoted): "additionally excludes self/staff/
 *   persona/new-tier + M7 trust tier gate" — reactor-side exclusions
 *   enforced here. Trust-tier gate v1: a member must HOLD a tier (t1+);
 *   the finer new-tier rule is M12's (Phase 7) — flagged interpretation.
 *   weightAtCast = signalReputation + legitimacy, NEVER Recognition
 *   (quoted) — signalReputation arrives with M12; v1 casts weight 1
 *   (baseline, flagged) so the weighted sums stay correct by symmetry.
 * CAP-128: negative is a HIDDEN result — no public count, no author
 *   notification, NEVER lowers Best (it writes no bestScore input);
 *   `reason` is PRIVATE (stored, never returned by reads). Routing:
 *   needs_evidence → commentContextSignals; off_topic → moderationCases.
 *   `disagree` in a Debate thread is stance-only, permanently barred from
 *   any quality-derived term — it never reaches a score input here.
 * CAP-126: saves are orthogonal (no agreement semantics).
 * CAP-127: context signals are hidden until threshold (value unnamed —
 *   contract OQ5; write-only here, display + routing to CAP-137 Phase 7);
 *   never cuts rank (INV-3).
 * CAP-131: read-state + userReadingProgress writes; read paths write NO
 *   rawEvents (contract §5) — the state tables are the trail.
 *
 * rawEvents: comment.reacted / comment.saved / comment.signaled —
 *   catalog-owned names (none named in the register), seeded idempotently.
 * CAP-570 call-sites: upvote_given (on valuable ADD) + save_added (on
 *   save ADD) Journal appends in the same mutation.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "./lib/authz";
import { captureEvent } from "./lib/events";
import { checkCommentEligibility } from "./eligibility";
import { appendActivity } from "./activity";

export const REACTION_EVENT_CATALOG_ROWS = [
  { eventName: "comment.reacted", description: "Member toggles a valuable/negative reaction (CAP-125/128)" },
  { eventName: "comment.saved", description: "Member toggles a comment save (CAP-126)" },
  { eventName: "comment.signaled", description: "Member signals context_needed/outdated (CAP-127)" },
].map((r) => ({
  schemaVersion: 1,
  eventClass: "outcome" as const,
  ownerModule: "m6",
  description: r.description,
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
  eventName: r.eventName,
}));

async function loadComment(ctx: any, commentId: Id<"comments">): Promise<any> {
  const comment = await ctx.db.get(commentId);
  if (!comment) throw new Error("reactions: comment not found");
  if (comment.deletedAt) throw new Error("reactions: tombstoned comments take no new reactions");
  return comment;
}

/** CAP-125 reactor-side gate (quoted exclusions). */
async function assertReactorEligibility(ctx: any, userId: Id<"users">, comment: any): Promise<void> {
  await assertCustomerCapability(ctx, "react");
  await checkCommentEligibility(ctx, userId); // CAP-140/141 machine (verify+consent)
  const user = await ctx.db.get(userId);
  if (user?.isStaff) throw new Error("reactions: staff are excluded from reacting (CAP-125)");
  if (!user?.trustTier) throw new Error("reactions: trust tier required (CAP-125 M7 gate — v1: any tier, flagged)");
  if (comment.authorUserId === userId) throw new Error("reactions: self-reaction excluded (CAP-125)");
}

async function scoresRow(ctx: any, commentId: Id<"comments">): Promise<any | null> {
  return await ctx.db.query("commentScores").withIndex("by_comment", (q: any) => q.eq("commentId", commentId)).unique();
}

async function bumpThreadActivity(ctx: any, postId: Id<"posts">): Promise<void> {
  const stats = await ctx.db.query("threadStats").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique();
  if (stats) {
    await ctx.db.patch(stats._id, {
      latestActivityAt: Date.now(),
      threadRevision: stats.threadRevision + 1,
      updatedAt: Date.now(),
    });
  }
}

async function captureReactionEvent(ctx: any, userId: Id<"users">, comment: any, detail: Record<string, unknown>): Promise<void> {
  await captureEvent(ctx, {
    eventType: "comment.reacted",
    schemaVersion: 1,
    eventClass: "outcome",
    userId,
    targetType: "comment",
    targetId: comment._id,
    authorUserId: comment.authorUserId ?? undefined,
    authorType: comment.authorType,
    reactorAuthorType: "user",
    source: "direct",
    isStaff: false,
    isPersona: false,
    isCountableAtWrite: true,
    postId: comment.postId,
    ...detail,
  } as any);
}

/** CAP-125 `reactions.toggle (valuable)` — the single Best numerator. */
export const toggleValuable = mutation({
  args: { commentId: v.id("comments") },
  returns: v.object({ reacted: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("reactions.valuable: authentication required");
    const comment = await loadComment(ctx, args.commentId);
    await assertReactorEligibility(ctx, userId, comment);

    const existing = await ctx.db
      .query("commentReactions")
      .withIndex("by_user_comment", (q: any) => q.eq("userId", userId).eq("commentId", args.commentId))
      .unique();
    const now = Date.now();
    const scores = await scoresRow(ctx, args.commentId);

    // Toggle OFF (or switch away from negative → valuable)
    if (existing?.reactionType === "valuable") {
      await ctx.db.delete(existing._id);
      if (scores) {
        await ctx.db.patch(scores._id, {
          valuableCount: Math.max(0, scores.valuableCount - 1),
          dirty: true,
          lastInteractionAt: now,
        });
      }
      await captureReactionEvent(ctx, userId, comment, { reactionType: "valuable", removed: true });
      return { reacted: false };
    }

    const wasNegative = existing?.reactionType === "negative";
    if (existing) await ctx.db.delete(existing._id); // mutual exclusivity — one row per pair
    await ctx.db.insert("commentReactions", {
      userId,
      commentId: args.commentId,
      reactionType: "valuable",
      weightAtCast: 1, // baseline until M12's signalReputation (flagged)
      createdAt: now,
    });
    if (scores) {
      await ctx.db.patch(scores._id, {
        valuableCount: scores.valuableCount + 1,
        dirty: true, // P5-04 recompute picks up the trust-weighted sum
        lastInteractionAt: now,
      });
    }
    await bumpThreadActivity(ctx, comment.postId);
    await captureReactionEvent(ctx, userId, comment, { reactionType: "valuable", removed: false, switchedFromNegative: wasNegative });

    // CAP-570 upvote_given — fires on the ADD, never the remove
    await appendActivity(ctx, {
      userId,
      eventType: "upvote_given",
      targetType: "comment",
      targetId: args.commentId,
      summary: "Marked a comment as valuable",
      meta: { postId: { value: comment.postId, privacy: "safe_for_public" } },
    });
    return { reacted: true };
  },
});

/** CAP-128 `reactions.toggle (negative)` — hidden result; PRIVATE reason. */
export const toggleNegative = mutation({
  args: {
    commentId: v.id("comments"),
    reason: v.optional(v.union(
      v.literal("disagree"), v.literal("not_useful"),
      v.literal("needs_evidence"), v.literal("off_topic"),
    )),
  },
  returns: v.object({ reacted: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("reactions.negative: authentication required");
    const comment = await loadComment(ctx, args.commentId);
    await assertReactorEligibility(ctx, userId, comment);

    const existing = await ctx.db
      .query("commentReactions")
      .withIndex("by_user_comment", (q: any) => q.eq("userId", userId).eq("commentId", args.commentId))
      .unique();
    const now = Date.now();
    const scores = await scoresRow(ctx, args.commentId);

    if (existing?.reactionType === "negative") {
      await ctx.db.delete(existing._id);
      await captureReactionEvent(ctx, userId, comment, { reactionType: "negative", removed: true });
      return { reacted: false };
    }

    const wasValuable = existing?.reactionType === "valuable";
    if (existing) await ctx.db.delete(existing._id); // mutual exclusivity
    await ctx.db.insert("commentReactions", {
      userId,
      commentId: args.commentId,
      reactionType: "negative",
      reason: args.reason, // PRIVATE — reads never return others' reasons
      weightAtCast: 1,
      createdAt: now,
    });
    if (wasValuable && scores) {
      await ctx.db.patch(scores._id, {
        valuableCount: Math.max(0, scores.valuableCount - 1), // the pair switched — numerator follows
        dirty: true,
        lastInteractionAt: now,
      });
    }
    // Negative NEVER lowers Best: no score input written for it (INV-3)

    // Quoted routing: needs_evidence → context signal; off_topic → moderation
    if (args.reason === "needs_evidence") {
      await ctx.db.insert("commentContextSignals", {
        userId,
        commentId: args.commentId,
        signalType: "context_needed",
        status: "open",
        createdAt: now,
      });
      const s2 = await scoresRow(ctx, args.commentId);
      if (s2) {
        await ctx.db.patch(s2._id, { contextSignalCount: s2.contextSignalCount + 1, dirty: true, lastInteractionAt: now });
      }
    }
    if (args.reason === "off_topic") {
      await ctx.db.insert("moderationCases", {
        caseType: "ugc_conduct",
        targetType: "comment",
        targetId: args.commentId,
        policyFamily: "quality_guidelines",
        severity: "s3_low",
        priority: 3,
        status: "open",
        reasonCode: "off_topic_signal",
        policyVersion: "m6.v1",
        reporterCountDistinct: 1,
        reporterClusterCount: 1,
        agingLevel: 0,
        createdAt: now,
      });
    }
    await captureReactionEvent(ctx, userId, comment, {
      reactionType: "negative",
      removed: false,
      switchedFromValuable: wasValuable,
      hasReason: Boolean(args.reason),
    });
    return { reacted: true };
  },
});

/** CAP-126 `saves.toggle` — private, orthogonal, no rank semantics. */
export const toggleSave = mutation({
  args: { commentId: v.id("comments") },
  returns: v.object({ saved: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("saves.toggle: authentication required");
    const comment = await loadComment(ctx, args.commentId);
    await assertCustomerCapability(ctx, "comment"); // member capability; save has no tier gate (CAP-126 gates = CAP-120)

    const existing = await ctx.db
      .query("commentSaves")
      .withIndex("by_user_comment", (q: any) => q.eq("userId", userId).eq("commentId", args.commentId))
      .unique();
    const now = Date.now();
    const scores = await scoresRow(ctx, args.commentId);

    if (existing) {
      await ctx.db.delete(existing._id);
      if (scores) {
        await ctx.db.patch(scores._id, { saveCount: Math.max(0, scores.saveCount - 1), dirty: true, lastInteractionAt: now });
      }
      await captureEvent(ctx, {
        eventType: "comment.saved", schemaVersion: 1, eventClass: "outcome",
        userId, targetType: "comment", targetId: args.commentId,
        authorType: comment.authorType, source: "direct",
        isStaff: false, isPersona: false, isCountableAtWrite: true,
        postId: comment.postId, removed: true,
      } as any);
      return { saved: false };
    }

    await ctx.db.insert("commentSaves", { userId, commentId: args.commentId, createdAt: now });
    if (scores) {
      await ctx.db.patch(scores._id, { saveCount: scores.saveCount + 1, dirty: true, lastInteractionAt: now });
    }
    await captureEvent(ctx, {
      eventType: "comment.saved", schemaVersion: 1, eventClass: "outcome",
      userId, targetType: "comment", targetId: args.commentId,
      authorType: comment.authorType, source: "direct",
      isStaff: false, isPersona: false, isCountableAtWrite: true,
      postId: comment.postId, removed: false,
    } as any);

    // CAP-570 save_added — fires on the ADD
    await appendActivity(ctx, {
      userId,
      eventType: "save_added",
      targetType: "comment",
      targetId: args.commentId,
      summary: "Saved a comment",
      meta: { postId: { value: comment.postId, privacy: "safe_for_public" } },
    });
    return { saved: true };
  },
});

/** CAP-127 `context.signal` — hidden until threshold; never cuts rank. */
export const signalContext = mutation({
  args: {
    commentId: v.id("comments"),
    signalType: v.union(v.literal("context_needed"), v.literal("outdated")),
  },
  returns: v.object({ signaled: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("context.signal: authentication required");
    const comment = await loadComment(ctx, args.commentId);
    await assertCustomerCapability(ctx, "comment");

    const existing = await ctx.db
      .query("commentContextSignals")
      .withIndex("by_user_comment", (q: any) => q.eq("userId", userId).eq("commentId", args.commentId))
      .unique();
    if (existing) return { signaled: true }; // one signal per member per comment

    const now = Date.now();
    await ctx.db.insert("commentContextSignals", {
      userId,
      commentId: args.commentId,
      signalType: args.signalType,
      status: "open", // threshold + CAP-137 routing are Phase 7 (OQ5: value unnamed)
      createdAt: now,
    });
    const scores = await scoresRow(ctx, args.commentId);
    if (scores) {
      await ctx.db.patch(scores._id, { contextSignalCount: scores.contextSignalCount + 1, dirty: true, lastInteractionAt: now });
    }
    await captureEvent(ctx, {
      eventType: "comment.signaled", schemaVersion: 1, eventClass: "outcome",
      userId, targetType: "comment", targetId: args.commentId,
      authorType: comment.authorType, source: "direct",
      isStaff: false, isPersona: false, isCountableAtWrite: true,
      postId: comment.postId, signalType: args.signalType,
    } as any);
    return { signaled: true };
  },
});

/** CAP-131 `readState.mark` — jump-to-unread state + reading progress.
 *  No rawEvents (contract §5: read paths write none). */
export const markReadState = mutation({
  args: { postId: v.id("posts"), lastReadCommentId: v.optional(v.id("comments")) },
  returns: v.object({ marked: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("readState.mark: authentication required");

    const stats = await ctx.db.query("threadStats").withIndex("by_postId", (q: any) => q.eq("postId", args.postId)).unique();
    const now = Date.now();
    const existing = await ctx.db
      .query("threadReadStates")
      .withIndex("by_user_post", (q: any) => q.eq("userId", userId).eq("postId", args.postId))
      .unique();
    const firstReadOfPost = !existing;

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastReadCommentId: args.lastReadCommentId ?? existing.lastReadCommentId,
        lastReadAt: now,
        lastSeenHumanCommentCount: stats?.humanCommentCount ?? existing.lastSeenHumanCommentCount,
        lastSeenThreadRevision: stats?.threadRevision ?? existing.lastSeenThreadRevision,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("threadReadStates", {
        userId,
        postId: args.postId,
        lastReadCommentId: args.lastReadCommentId,
        lastReadAt: now,
        lastSeenHumanCommentCount: stats?.humanCommentCount ?? 0,
        lastSeenThreadRevision: stats?.threadRevision ?? 0,
        updatedAt: now,
      });
    }

    // Reading-based trust feed (bible l.115): postsReadCount counts DISTINCT
    // posts (first read-state of a post) — flagged interpretation
    if (firstReadOfPost) {
      const progress = await ctx.db
        .query("userReadingProgress")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .unique();
      if (progress) {
        await ctx.db.patch(progress._id, { postsReadCount: progress.postsReadCount + 1, updatedAt: now });
      } else {
        await ctx.db.insert("userReadingProgress", {
          userId,
          topicsViewedCount: 0,
          postsReadCount: 1,
          totalReadTimeSeconds: 0,
          updatedAt: now,
        });
      }
    }
    return { marked: true };
  },
});
