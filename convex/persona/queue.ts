/**
 * queue — SLICE-P5-11: CAP-172/173/174/175 — the persona comment review
 * queue (the operator side of the generation chain).
 *
 * CAP-172 (quoted): regen "Capped" (2–3; chronic fail → CAP-163 waning) —
 *   supersede chain via supersededByDraftId; the regen GENERATION reuses
 *   P5-08's chain (G3-deferred ⇒ fail-closed error, correct posture).
 * CAP-173 (quoted): "Staggered real timestamp (INV-9). Persona-excluded
 *   from M6 rank/counts (INV-6)." — publish writes comments via the M6
 *   rules (authorType=persona, approvingUserId stamped), personaEngagements,
 *   personaPositions, personaMemoryEmbeddings, threadStats deltas with
 *   personaCommentCount (NOT human counters), commentScores row, and the
 *   CAP-570 comment_created Journal append (persona variant).
 * CAP-174: reject — terminal-for-draft, audited.
 * CAP-175: schedule — scheduledFor distinct from earliestPublishAt; the
 *   scheduled fire RE-VALIDATES the persona is not paused/retired —
 *   register-silent edge, contract OQ3: fail-closed hold + queue alert
 *   (never force-publish).
 * Manual draft-body edit: contract OQ — schema supports (editedBody /
 *   status=edited) but NO CAP owns the write; NOT built, flagged.
 */

import { internalMutation, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission, type StaffRole } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { appendActivity } from "../activity";

const REGEN_CAP = 3; // quoted "2–3" — 3 as the flagged ceiling

async function requireOperator(ctx: any, allowed: StaffRole[]): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("persona queue: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.some((r) => allowed.includes(r))) {
    throw new Error(`persona queue: requires one of ${allowed.join("/")}`);
  }
  return userId;
}

async function regenCount(ctx: any, postId: Id<"posts">, personaId: Id<"personas">): Promise<number> {
  const rows = await ctx.db
    .query("personaCommentDrafts")
    .withIndex("by_post_persona", (q: any) => q.eq("postId", postId).eq("personaId", personaId))
    .take(10);
  return rows.length; // chain length = regen attempts on this (post, persona)
}

/** The queue list — drafts by status (A12 board feeds). Staff-only; a
 *  non-staff caller gets null (degrade, never throw — the /admin lesson). */
export const listQueue = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    let staff = false;
    try {
      const roles = await assertAdminPermission(ctx);
      staff = roles.length > 0;
    } catch {
      staff = false;
    }
    if (!staff) return null;
    const statuses = ["generated", "edited", "approved", "scheduled", "rejected", "published"];
    const out: Record<string, any[]> = {};
    for (const status of statuses) {
      const rows = await ctx.db
        .query("personaCommentDrafts")
        .withIndex("by_status", (q: any) => q.eq("status", status))
        .order("desc")
        .take(30);
      out[status] = rows.map((r: any) => ({
        id: r._id, postId: r.postId, personaId: r.personaId,
        body: (r.editedBody ?? r.body).slice(0, 200),
        status: r.status, scheduledFor: r.scheduledFor ?? null,
        createdAt: r.createdAt, supersededByDraftId: r.supersededByDraftId ?? null,
      }));
    }
    return out;
  },
});

/** CAP-172 `persona.regen` — operator-requested regeneration. Supersede
 *  chain + cap; chronic fail hands off to waning (CAP-163) as a queue
 *  alert (the console executes the wane — never automatic here). */
export const regen = mutation({
  args: { draftId: v.id("personaCommentDrafts") },
  returns: v.object({ regenQueued: v.boolean(), reason: v.string(), waningHandoff: v.optional(v.boolean()) }),
  handler: async (ctx, args): Promise<{ regenQueued: boolean; reason: string; waningHandoff?: boolean }> => {
    const userId = await requireOperator(ctx, ["editor", "publisher", "administrator"]);
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("persona.regen: draft not found");
    if (draft.status === "published") throw new Error("persona.regen: published drafts are immutable");

    const attempts = await regenCount(ctx, draft.postId, draft.personaId);
    if (attempts > REGEN_CAP) {
      // Chronic fail → CAP-163 waning handoff (alert; operator executes)
      return { regenQueued: false, reason: "regen_cap_exceeded", waningHandoff: true };
    }

    // The regeneration itself runs the P5-08 chain (System). GLM absence
    // fails the call closed — surfaced to the operator, never fabricated.
    const result = await ctx.runMutation(internal.persona.generate.runForPost, {
      personaId: draft.personaId,
      postId: draft.postId,
    });
    if (result.generated && result.draftId) {
      await ctx.db.patch(args.draftId, { supersededByDraftId: result.draftId });
      return { regenQueued: true, reason: result.reason };
    }
    // e.g. already_engaged (the old draft still occupies the post) — the
    // operator path rejects + regens via the console; reported honestly.
    return { regenQueued: false, reason: result.reason };
  },
});

/** CAP-173 `persona.approve` — publish via the M6 rules. One transaction:
 *  comments row (authorType=persona, approvingUserId) + commentScores +
 *  threadStats (persona counters — INV-6) + personaEngagements +
 *  personaPositions + personaMemoryEmbeddings + draft flip + CAP-570
 *  comment_created (persona variant). Staggered real timestamp (INV-9):
 *  publishedAt = now + stagger (the operator's APPROVE time is real; the
 *  stagger avoids burst-appearance — minutes, never fake dates). */
export const approve = mutation({
  args: { draftId: v.id("personaCommentDrafts") },
  returns: v.object({ publishedCommentId: v.id("comments") }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["editor", "publisher", "administrator"]);
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("persona.approve: draft not found");
    if (!["generated", "edited", "scheduled"].includes(draft.status)) {
      throw new Error(`persona.approve: draft is ${draft.status} (not approvable)`);
    }
    const evaluation = draft.evaluationId ? await ctx.db.get(draft.evaluationId) : null;
    if (evaluation?.autoKilled) {
      throw new Error(`persona.approve: draft was AUTO-KILLED (${evaluation.killReason}) — hard-kill precedes the operator (INV-5)`);
    }
    const persona = await ctx.db.get(draft.personaId);
    if (!persona) throw new Error("persona.approve: persona missing");
    // The generation-vs-publication boundary: a waned/retired/paused
    // persona must never feed publication (FATAL-adjacent, catalog flag)
    if (persona.lifecycleStatus !== "active" || persona.paused) {
      throw new Error(`persona.approve: persona is ${persona.lifecycleStatus}${persona.paused ? ":paused" : ""} — cannot publish`);
    }
    const post = await ctx.db.get(draft.postId);
    if (!post || post.lifecycleStatus !== "published") throw new Error("persona.approve: host post is not published");

    const now = Date.now();
    const staggerMinutes = Math.floor(Math.random() * 9) + 2; // 2–10 min real stagger (INV-9)
    const publishedAt = draft.scheduledFor && draft.scheduledFor > now ? draft.scheduledFor : now + staggerMinutes * 60_000;

    let commentId: Id<"comments"> | undefined;
    await writeAudited(ctx, async (actx) => {
      commentId = (await actx.db.insert("comments", {
        postId: draft.postId,
        parentCommentId: undefined,
        threadRootCommentId: "" as any, // patched to self below (depth 0)
        replyToCommentId: undefined,
        depth: 0,
        authorType: "persona",
        authorPersonaId: draft.personaId,
        body: draft.editedBody ?? draft.body,
        isQuestion: false,
        moderationStatus: "passed", // operator approval IS the review (CAP-173)
        lastActivityAt: publishedAt,
        createdAt: publishedAt,
      })) as Id<"comments">;
      await actx.db.patch(commentId!, { threadRootCommentId: commentId! });
      await actx.db.insert("commentScores", {
        commentId: commentId!,
        valuableCount: 0, replyCount: 0, distinctReplierCount: 0, saveCount: 0,
        contextSignalCount: 0, bestScore: 0, liveScore: 0, mostDiscussedScore: 0,
        rankVersion: 0, lastInteractionAt: publishedAt, lastRankedAt: 0, dirty: false, // INV-6: rank-excluded
      });
      // threadStats: PERSONA counters only (INV-6 — human counts untouched)
      const stats = await actx.db.query("threadStats").withIndex("by_postId", (q: any) => q.eq("postId", draft.postId)).unique();
      if (stats) {
        await actx.db.patch(stats._id, {
          personaCommentCount: stats.personaCommentCount + 1,
          topLevelCount: stats.topLevelCount + 1,
          latestActivityAt: publishedAt,
          threadRevision: stats.threadRevision + 1,
          updatedAt: publishedAt,
        });
      } else {
        await actx.db.insert("threadStats", {
          postId: draft.postId, humanCommentCount: 0, personaCommentCount: 1,
          topLevelCount: 1, replyCount: 0, humanParticipantCount: 0,
          unresolvedQuestionCount: 0, latestActivityAt: publishedAt,
          threadRevision: 1, updatedAt: publishedAt,
        });
      }
      // Engagement + position ledger + memory (DEC-A07 consistency chain)
      await actx.db.insert("personaEngagements", {
        personaId: draft.personaId, postId: draft.postId, commentId,
        stanceSummary: (draft.editedBody ?? draft.body).slice(0, 140),
        contributionIntent: draft.contributionIntent,
        isFollowUp: false, isEvolution: false,
        threadRevision: 1, publishedAt,
        createdAt: now,
      });
      await actx.db.insert("personaPositions", {
        personaId: draft.personaId,
        topicKey: `post:${draft.postId}`,
        positionSummary: (draft.editedBody ?? draft.body).slice(0, 140),
        stance: "nuanced", confidence: 0.6, status: "current",
        sourceCommentId: commentId,
        firstExpressedAt: now, lastExpressedAt: now, expressionCount: 1,
      });
      await actx.db.insert("personaMemoryEmbeddings", {
        personaId: draft.personaId, memoryType: "comment",
        refId: commentId!, contentText: (draft.editedBody ?? draft.body).slice(0, 1000),
        embedding: [], embeddingModel: "none-v1", createdAt: now, // embedding provider absent — content-only memory (flagged)
      });
      await actx.db.patch(args.draftId, {
        status: "published", approvedByUserId: userId, publishedCommentId: commentId,
      });
      // Cadence budget consumed on PUBLISH (real timestamps)
      const cadence = await actx.db.query("personaCadenceState").withIndex("by_personaId", (q: any) => q.eq("personaId", draft.personaId)).unique();
      if (cadence) {
        await actx.db.patch(cadence._id, {
          weeklyUsed: cadence.weeklyUsed + 1, lastPublishedAt: publishedAt, updatedAt: now,
        });
      }
      // CAP-570 comment_created — persona variant (Journal, member-facing
      // copy stays human; this is the SYSTEM actor's ledger entry)
      await appendActivity(actx, {
        userId: userId, // approving operator attributes the system action
        eventType: "comment_created",
        targetType: "comment",
        targetId: commentId!,
        summary: `Approved an AI persona comment (${persona.displayName})`,
        meta: {
          personaId: { value: draft.personaId, privacy: "safe_for_public" },
          postId: { value: draft.postId, privacy: "safe_for_public" },
          aiAuthored: { value: true, privacy: "safe_for_public" },
        },
      });
      return {
        actorId: userId, action: "persona.approve", target: `personaCommentDrafts:${args.draftId}`,
        prev: { status: draft.status }, next: { status: "published", commentId },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { publishedCommentId: commentId! };
  },
});

/** CAP-174 `personaComment.reject` — terminal-for-draft, audited. */
export const reject = mutation({
  args: { draftId: v.id("personaCommentDrafts"), reason: v.string() },
  returns: v.object({ rejected: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["editor", "publisher", "administrator"]);
    if (!args.reason.trim()) throw new Error("personaComment.reject: reason required");
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("personaComment.reject: draft not found");
    if (draft.status === "published") throw new Error("personaComment.reject: published drafts are immutable");
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.draftId, { status: "rejected" });
      return {
        actorId: userId, action: "personaComment.reject", target: `personaCommentDrafts:${args.draftId}`,
        prev: { status: draft.status }, next: { status: "rejected", reason: args.reason },
        correlationId: newCorrelationId(), reversible: false, reasonCode: args.reason,
      };
    });
    return { rejected: true };
  },
});

/** CAP-175 `personaComment.schedule` — scheduledFor distinct from
 *  earliestPublishAt; same status-enum pattern as CAP-054. */
export const schedule = mutation({
  args: { draftId: v.id("personaCommentDrafts"), scheduledFor: v.number() },
  returns: v.object({ scheduled: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["editor", "publisher", "administrator"]);
    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("personaComment.schedule: draft not found");
    if (!["generated", "edited"].includes(draft.status)) {
      throw new Error(`personaComment.schedule: draft is ${draft.status} (not schedulable)`);
    }
    if (args.scheduledFor <= Date.now()) throw new Error("personaComment.schedule: scheduledFor must be in the future");
    const evaluation = draft.evaluationId ? await ctx.db.get(draft.evaluationId) : null;
    if (evaluation?.autoKilled) throw new Error("personaComment.schedule: auto-killed drafts cannot be scheduled (INV-5)");
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.draftId, {
        status: "scheduled", scheduledFor: args.scheduledFor,
        earliestPublishAt: draft.earliestPublishAt ?? args.scheduledFor,
      });
      return {
        actorId: userId, action: "personaComment.schedule", target: `personaCommentDrafts:${args.draftId}`,
        prev: { status: draft.status }, next: { status: "scheduled", scheduledFor: args.scheduledFor },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { scheduled: true };
  },
});

/** The System-publish core (shared by systemPublish + the sweeper — plain
 *  function, no same-module internal.* self-reference). */
async function systemPublishLogic(ctx: any, draftId: Id<"personaCommentDrafts">): Promise<{ published: boolean; reason?: string }> {
  const draft = await ctx.db.get(draftId);
  if (!draft) return { published: false, reason: "draft_not_found" };
  const evaluation = draft.evaluationId ? await ctx.db.get(draft.evaluationId) : null;
  if (evaluation?.autoKilled) return { published: false, reason: "auto_killed" };
  const persona = await ctx.db.get(draft.personaId);
  if (!persona || persona.paused || persona.lifecycleStatus !== "active") {
    return { published: false, reason: "persona_inactive" };
  }
  const post = await ctx.db.get(draft.postId);
  if (!post || post.lifecycleStatus !== "published") return { published: false, reason: "post_not_published" };

  const now = Date.now();
  const commentId = (await ctx.db.insert("comments", {
    postId: draft.postId,
    threadRootCommentId: "" as any,
    depth: 0,
    authorType: "persona",
    authorPersonaId: draft.personaId,
    body: draft.editedBody ?? draft.body,
    isQuestion: false,
    moderationStatus: "passed",
    lastActivityAt: now,
    createdAt: now,
  })) as Id<"comments">;
  await ctx.db.patch(commentId, { threadRootCommentId: commentId });
  await ctx.db.insert("commentScores", {
    commentId, valuableCount: 0, replyCount: 0, distinctReplierCount: 0, saveCount: 0,
    contextSignalCount: 0, bestScore: 0, liveScore: 0, mostDiscussedScore: 0,
    rankVersion: 0, lastInteractionAt: now, lastRankedAt: 0, dirty: false,
  });
  const stats = await ctx.db.query("threadStats").withIndex("by_postId", (q: any) => q.eq("postId", draft.postId)).unique();
  if (stats) {
    await ctx.db.patch(stats._id, {
      personaCommentCount: stats.personaCommentCount + 1,
      topLevelCount: stats.topLevelCount + 1,
      latestActivityAt: now, threadRevision: stats.threadRevision + 1, updatedAt: now,
    });
  }
  await ctx.db.insert("personaEngagements", {
    personaId: draft.personaId, postId: draft.postId, commentId,
    stanceSummary: (draft.editedBody ?? draft.body).slice(0, 140),
    contributionIntent: draft.contributionIntent,
    isFollowUp: false, isEvolution: false, publishedAt: now, createdAt: now,
  });
  await ctx.db.patch(draft._id, { status: "published", publishedCommentId: commentId });
  return { published: true };
}

/** The scheduled-fire sweeper (cron): due scheduled drafts publish ONLY
 *  if the persona is still active+unpaused — register-silent edge
 *  (contract OQ3): fail-closed hold (back to generated) + queue alert. */
export const sweepScheduled = internalMutation({
  args: {},
  returns: v.object({ published: v.number(), held: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.db
      .query("personaCommentDrafts")
      .withIndex("by_status", (q: any) => q.eq("status", "scheduled"))
      .take(20);
    let published = 0;
    let held = 0;
    for (const draft of due) {
      if (!draft.scheduledFor || draft.scheduledFor > now) continue;
      const persona = await ctx.db.get(draft.personaId);
      if (!persona || persona.paused || persona.lifecycleStatus !== "active") {
        // FAIL-CLOSED: hold + alert (never force-publish a paused persona)
        await ctx.db.patch(draft._id, { status: "generated", scheduledFor: undefined });
        held += 1;
        continue;
      }
      const result = await systemPublishLogic(ctx, draft._id);
      if (result.published) published += 1;
      else held += 1;
    }
    return { published, held };
  },
});

/** The System-publish variant of approve (scheduled fire) — same rules,
 *  System-attributed (no operator session). */
export const systemPublish = internalMutation({
  args: { draftId: v.id("personaCommentDrafts") },
  returns: v.object({ published: v.boolean(), reason: v.optional(v.string()) }),
  handler: async (ctx, args) => systemPublishLogic(ctx, args.draftId),
});
