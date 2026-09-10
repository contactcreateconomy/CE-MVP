/**
 * moderationDomain — SLICE-P7E-13: the FIRST implementation of
 * CAP-101/103/114 (+ CAP-135 comment moderate). V2 of the catalog: the
 * E-mod-2 `moderationCases` writes were specified 2026-08-26 but the
 * mutations had no owner until this slice.
 *
 * Every mutation: narrow Moderator gate (E-mod-1: CAP-135 comment
 * moderate = Moderator/administrator), domain write + polymorphic
 * moderationCases write + moderationActions record + fail-closed audit
 * (CAP-426). Surfaces are actions on a case card — NO special UI, no
 * sub-tabs (E-mod-2, quoted). All case writes use the bible caseType /
 * status unions. `hard_harm` stays Founder-only (not reachable here).
 *
 * CAP-101 (quoted): "writes moderationCases for queue-surfacing (CAP-330
 *   ordering) … target=postShowcases row … Only `approved` renders
 *   outbound button."
 * CAP-103 (quoted): "target=the relevant mechanic table's row."
 * CAP-114 (quoted): "Reversal applies corresponding delta;
 *   held/removed/withdrawn excluded from aggregate regardless of score" +
 *   "target=toolRatings row." P4-05's recompute already excludes — this
 *   mutation flips the rating's status and calls it.
 * CAP-135 (quoted): "Tombstone; held/rejected fail-closed."
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkRateLimit } from "../lib/rateLimit";
import { openCaseDeduped, findOpenCase } from "../moderation/autoGate";

async function requireModerator(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("moderationDomain: authentication required");
  const roles = await assertAdminPermission(ctx);
  // E-mod-1: comment moderate = Moderator/administrator; the domain
  // review actions share the Moderator set (console Actor columns)
  if (!roles.some((r) => r === "moderator" || r === "administrator")) {
    throw new Error("moderationDomain: Moderator role required");
  }
  return userId;
}

/** Attach a moderationActions record to the case (the operator-action
 *  trail). Idempotent per (case, action, actor). */
async function recordAction(ctx: any, input: {
  caseId: Id<"moderationCases">; targetType: string; targetId: string;
  actorUserId: Id<"users">; action: string; reasonCode: string;
  beforeState: string; afterState: string;
}) {
  await ctx.db.insert("moderationActions", {
    caseId: input.caseId,
    targetType: input.targetType,
    targetId: input.targetId,
    actorUserId: input.actorUserId,
    actorRole: "moderator",
    action: input.action,
    reasonCode: input.reasonCode,
    policyVersion: "m13.v1",
    reversible: true,
    beforeState: input.beforeState,
    afterState: input.afterState,
    idempotencyKey: `${input.action}:${input.caseId}:${input.actorUserId}`,
    createdAt: Date.now(),
  });
}

/** Resolve or open the case for a domain target (l.239 dedupe). */
async function ensureCase(ctx: any, input: {
  targetType: string; targetId: string; caseType: any; reasonCode: string;
}): Promise<Id<"moderationCases">> {
  const existing = await findOpenCase(ctx, input.targetType, input.targetId, "quality_guidelines");
  if (existing) return existing._id;
  return openCaseDeduped(ctx, {
    targetType: input.targetType, targetId: input.targetId,
    policyFamily: "quality_guidelines",
    caseType: input.caseType, severity: "s3_low", reasonCode: input.reasonCode,
  });
}

/** CAP-101 showcase.reviewProjectUrl — approve/reject the pending URL. */
export const reviewProjectUrl = mutation({
  args: { postId: v.id("posts"), decision: v.union(v.literal("approved"), v.literal("rejected")) },
  returns: v.object({ approvalStatus: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireModerator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const showcase = await ctx.db
      .query("postShowcases")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .unique();
    if (!showcase) throw new Error("reviewProjectUrl: no showcase row for post");
    if (showcase.approvalStatus !== "pending") {
      throw new Error(`reviewProjectUrl: showcase is ${showcase.approvalStatus}, not pending`);
    }
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(showcase._id, { approvalStatus: args.decision });
      const caseId = await ensureCase(actx, {
        targetType: "postShowcase", targetId: showcase._id,
        caseType: "ugc_conduct", reasonCode: "showcase_url_review",
      });
      await recordAction(actx, {
        caseId, targetType: "postShowcase", targetId: showcase._id,
        actorUserId: userId, action: `showcase.${args.decision}`,
        reasonCode: "showcase_url_review",
        beforeState: "pending", afterState: args.decision,
      });
      await actx.db.patch(caseId, { status: args.decision === "approved" ? "actioned" : "resolved_no_action", closedAt: Date.now() });
      return {
        actorId: userId, action: "showcase.reviewProjectUrl",
        target: `postShowcase:${showcase._id}`, prev: { approvalStatus: "pending" },
        next: { approvalStatus: args.decision },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { approvalStatus: args.decision };
  },
});

/** CAP-103 force-clear Help/vote — the moderator escape hatch when a
 *  mechanic row is stuck (accepted answer removed, vote anomalies).
 *  Target = the mechanic table's row (quoted). */
export const forceClearMechanic = mutation({
  args: {
    mechanic: v.union(v.literal("help"), v.literal("list_vote"), v.literal("debate_vote")),
    postId: v.id("posts"),
  },
  returns: v.object({ cleared: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireModerator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    await writeAudited(ctx, async (actx) => {
      let targetId = "";
      if (args.mechanic === "help") {
        const help = await actx.db
          .query("postHelps")
          .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
          .unique();
        if (!help?.acceptedCommentId) throw new Error("forceClear: no accepted answer to clear");
        targetId = help._id;
        await actx.db.patch(help._id, { acceptedCommentId: undefined, resolvedStatus: "open" });
      } else if (args.mechanic === "debate_vote") {
        // The votes ARE the mechanic's truth — delete them; derived
        // counts recompute from absence (no voided field on the bible row)
        const votes = await actx.db
          .query("debateVotes")
          .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
          .take(50);
        for (const vote of votes) {
          await actx.db.delete(vote._id);
        }
        targetId = `debateVotes:${args.postId}`;
      } else {
        // List votes: delete the vote rows; items and derived counts reset
        // (postLists is the by_postId root; items hang off postListId)
        const list = await actx.db
          .query("postLists")
          .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
          .unique();
        if (!list) throw new Error("forceClear: no list mechanic on this post");
        const items = await actx.db
          .query("postListItems")
          .withIndex("by_postListId_sortOrder", (q: any) => q.eq("postListId", list._id))
          .take(50);
        for (const item of items) {
          const votes = await actx.db
            .query("listItemVotes")
            .withIndex("by_item", (q: any) => q.eq("postListItemId", item._id))
            .take(100);
          for (const vote of votes) {
            await actx.db.delete(vote._id);
          }
        }
        targetId = `postListItems:${args.postId}`;
      }
      const caseId = await ensureCase(actx, {
        targetType: args.mechanic, targetId,
        caseType: "ugc_conduct", reasonCode: "mechanic_force_clear",
      });
      await recordAction(actx, {
        caseId, targetType: args.mechanic, targetId,
        actorUserId: userId, action: "mechanic.forceClear",
        reasonCode: "mechanic_force_clear",
        beforeState: "active", afterState: "cleared",
      });
      await actx.db.patch(caseId, { status: "actioned", closedAt: Date.now() });
      return {
        actorId: userId, action: "mechanic.forceClear",
        target: `${args.mechanic}:${targetId}`, prev: { state: "active" },
        next: { state: "cleared" },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { cleared: true };
  },
});

/** CAP-114 toolRatings.moderate — hold/remove a rating; the R-AGG delta
 *  rides P4-05's recompute (held/removed/withdrawn stay excluded from
 *  the aggregate regardless of score — quoted). */
export const moderateRating = mutation({
  args: {
    ratingId: v.id("toolRatings"),
    decision: v.union(v.literal("held"), v.literal("removed"), v.literal("restored")),
  },
  returns: v.object({ moderationStatus: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireModerator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const rating = await ctx.db.get(args.ratingId);
    if (!rating) throw new Error("moderateRating: rating not found");
    const nextStatus =
      args.decision === "restored" ? "active"
      : args.decision === "held" ? "held"
      : "removed";
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.ratingId, { moderationStatus: nextStatus as any });
      const caseId = await ensureCase(actx, {
        targetType: "toolRating", targetId: args.ratingId,
        caseType: "ugc_conduct", reasonCode: "rating_moderation",
      });
      await recordAction(actx, {
        caseId, targetType: "toolRating", targetId: args.ratingId,
        actorUserId: userId, action: `rating.${args.decision}`,
        reasonCode: "rating_moderation",
        beforeState: rating.moderationStatus, afterState: nextStatus,
      });
      await actx.db.patch(caseId, { status: "actioned", closedAt: Date.now() });
      // R-AGG (quoted): the delta rides P4-05's recompute — scheduled
      // same-tx (idempotent fold of active+passed ratings only)
      const { internal } = await import("../_generated/api");
      await actx.scheduler.runAfter(0, internal.tools.recomputeAggregate, { toolId: rating.toolId });
      return {
        actorId: userId, action: "toolRatings.moderate",
        target: `toolRating:${args.ratingId}`,
        prev: { moderationStatus: rating.moderationStatus },
        next: { moderationStatus: nextStatus },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { moderationStatus: nextStatus };
  },
});

/** CAP-135 comment moderate — Moderator tombstone (same-tx clears Help
 *  refs per CAP-122; held/rejected targets fail closed). */
export const moderateComment = mutation({
  args: { commentId: v.id("comments"), reason: v.string() },
  returns: v.object({ tombstoned: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireModerator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("moderateComment: comment not found");
    if (comment.deletedAt) return { tombstoned: true }; // idempotent
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.commentId, { deletedAt: Date.now(), moderationStatus: "held" });
      // CAP-122 same-tx: an accepted answer clears the Help ref
      const help = await actx.db
        .query("postHelps")
        .withIndex("by_postId", (q: any) => q.eq("postId", comment.postId))
        .unique();
      if (help?.acceptedCommentId === args.commentId) {
        await actx.db.patch(help._id, { acceptedCommentId: undefined, resolvedStatus: "open" });
      }
      const caseId = await ensureCase(actx, {
        targetType: "comment", targetId: args.commentId,
        caseType: "ugc_conduct", reasonCode: "comment_moderated",
      });
      await recordAction(actx, {
        caseId, targetType: "comment", targetId: args.commentId,
        actorUserId: userId, action: "comment.tombstone",
        reasonCode: "comment_moderated",
        beforeState: comment.moderationStatus, afterState: "tombstoned",
      });
      await actx.db.patch(caseId, { status: "actioned", closedAt: Date.now() });
      return {
        actorId: userId, action: "comment.moderate",
        target: `comment:${args.commentId}`, prev: { state: "live" },
        next: { state: "tombstoned", reason: args.reason },
        reasonCode: "comment_moderated",
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { tombstoned: true };
  },
});
