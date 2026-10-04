/** demoWorld/importEngagement — reactions (valuable + hidden negative w/
 * isCountableAtWrite:false), comment+post saves, debate votes (+ tallies),
 * list-item votes, context signals, help accepts (acceptedByUserId recorded),
 * tool ratings (no aggregate write — real tools.recomputeAggregate computes
 * them at settle) — each with the real mutations' side effects: commentScores
 * bumps dirty, bumpThreadActivity, rawEvents comment.reacted/saved backdated,
 * activityLedger rows (CR-011 §1; P0-REPORT §F steps 6-7). */
import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { guard, register, batchId, findUserByEmail, findToolBySlug } from "./lib";

export const importEngagement = internalMutation({
  args: {
    seq: v.number(),
    worldEnd: v.number(),
    reactions: v.array(v.object({
      userEmail: v.string(), commentRef: v.string(),
      type: v.union(v.literal("valuable"), v.literal("negative")),
      reason: v.optional(v.string()), offsetMs: v.number(),
    })),
    commentSaves: v.array(v.object({ userEmail: v.string(), commentRef: v.string(), offsetMs: v.number() })),
    postSaves: v.array(v.object({ userEmail: v.string(), postRef: v.string(), offsetMs: v.number() })),
    debateVotes: v.array(v.object({ userEmail: v.string(), postRef: v.string(), choice: v.string(), offsetMs: v.number() })),
    listItemVotes: v.array(v.object({ userEmail: v.string(), itemRef: v.string(), offsetMs: v.number() })),
    contextSignals: v.array(v.object({ userEmail: v.string(), commentRef: v.string(), signalType: v.string(), status: v.string(), offsetMs: v.number() })),
    accepts: v.array(v.object({ postRef: v.string(), commentRef: v.string(), acceptedByEmail: v.string(), offsetMs: v.number() })),
    toolRatings: v.array(v.object({
      userEmail: v.string(), toolSlug: v.string(), overallScore: v.number(),
      dims: v.object({ ease_of_use: v.number(), output_quality: v.number(), reliability: v.number(), value_for_money: v.union(v.number(), v.literal("not_applicable")) }),
      reviewText: v.optional(v.string()), offsetMs: v.number(),
    })),
  },
  returns: v.object({ done: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const batch = batchId("engagement", args.seq);
    let done = 0, skipped = 0;
    const gtBy = async (scope: string, refKey: string) =>
      (await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", scope).eq("refKey", refKey)).unique())?.payload ?? null;
    const bumpThread = async (postId: Id<"posts">, at: number) => {
      const ts = await ctx.db.query("threadStats").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique();
      if (ts) await ctx.db.patch(ts._id, { latestActivityAt: Math.max(ts.latestActivityAt, at), threadRevision: ts.threadRevision + 1, updatedAt: args.worldEnd });
    };
    const bumpCommentScore = async (commentId: Id<"comments">, patch: (s: any) => any, at: number) => {
      const s = await ctx.db.query("commentScores").withIndex("by_comment", (q: any) => q.eq("commentId", commentId)).unique();
      if (s) await ctx.db.patch(s._id, { ...patch(s), dirty: true, lastInteractionAt: Math.max(s.lastInteractionAt, at) });
    };
    const userBy = new Map<string, Id<"users">>();
    const uid = async (email: string) => { if (!userBy.has(email)) userBy.set(email, (await findUserByEmail(ctx, email))!); return userBy.get(email); };

    for (const r of args.reactions) {
      const userId = await uid(r.userEmail);
      const p = await gtBy("comment", r.commentRef);
      if (!userId || !p?.commentId) { skipped += 1; continue; }
      const at = args.worldEnd + r.offsetMs;
      const id = await ctx.db.insert("commentReactions", {
        userId, commentId: p.commentId, reactionType: r.type,
        ...(r.reason ? { reason: r.reason as any } : {}), weightAtCast: 1, createdAt: at,
      });
      await register(ctx, "commentReactions", id, batch);
      if (r.type === "valuable") await bumpCommentScore(p.commentId, (s: any) => ({ valuableCount: s.valuableCount + 1 }), at);
      else {
        if (r.reason === "needs_evidence") {
          const csId = await ctx.db.insert("commentContextSignals", { userId, commentId: p.commentId, signalType: "context_needed", status: "active", createdAt: at });
          await register(ctx, "commentContextSignals", csId, batch);
          await bumpCommentScore(p.commentId, (s: any) => ({ contextSignalCount: s.contextSignalCount + 1 }), at);
        }
      }
      await bumpThread(p.postId, at);
      // rawEvents comment.reacted — negatives non-countable (award sweep skips them)
      const evId = await ctx.db.insert("rawEvents", {
        eventClass: "interaction", eventType: "comment.reacted",
        userId, sequenceInSession: 0, targetType: "comment", targetId: p.commentId,
        authorUserId: p.authorId ?? undefined, authorType: "user",
        reactionType: r.type, reactionValence: r.type === "valuable" ? "positive" : "negative",
        ...(r.reason ? { reactionReason: r.reason } : {}),
        source: "direct", schemaVersion: 1,
        isAiPersona: false, isStaff: false, isPersona: false,
        isCountableAtWrite: r.type === "valuable",
        occurredAt: at, receivedAt: at,
      });
      await register(ctx, "rawEvents", evId, batch);
      if (r.type === "valuable") await ctx.db.insert("activityLedger", { userId, eventType: "upvote_given", targetType: "comment", targetId: p.commentId, summary: "Marked a comment valuable", meta: { demo: { value: true, privacy: "public" } }, visibility: "public", createdAt: at });
      done += 1;
    }

    for (const s of args.commentSaves) {
      const userId = await uid(s.userEmail);
      const p = await gtBy("comment", s.commentRef);
      if (!userId || !p?.commentId) { skipped += 1; continue; }
      const at = args.worldEnd + s.offsetMs;
      const id = await ctx.db.insert("commentSaves", { userId, commentId: p.commentId, createdAt: at });
      await register(ctx, "commentSaves", id, batch);
      await bumpCommentScore(p.commentId, (sc: any) => ({ saveCount: sc.saveCount + 1 }), at);
      await ctx.db.insert("activityLedger", { userId, eventType: "save_added", targetType: "comment", targetId: p.commentId, summary: "Saved a comment", meta: { demo: { value: true, privacy: "public" } }, visibility: "private", createdAt: at });
      done += 1;
    }

    for (const s of args.postSaves) {
      const userId = await uid(s.userEmail);
      const p = await gtBy("post", s.postRef);
      if (!userId || !p?.postId) { skipped += 1; continue; }
      const at = args.worldEnd + s.offsetMs;
      const id = await ctx.db.insert("saves", { userId, postId: p.postId, createdAt: at });
      await register(ctx, "saves", id, batch);
      done += 1;
    }

    const debateTally = new Map<string, { postId: Id<"posts">; agree: number; disagree: number; abstain: number }>();
    for (const d of args.debateVotes) {
      const userId = await uid(d.userEmail);
      const p = await gtBy("post", d.postRef);
      if (!userId || !p?.postId) { skipped += 1; continue; }
      const at = args.worldEnd + d.offsetMs;
      const id = await ctx.db.insert("debateVotes", { postId: p.postId, userId, choice: d.choice as any, createdAt: at });
      await register(ctx, "debateVotes", id, batch);
      const t = debateTally.get(d.postRef) ?? { postId: p.postId, agree: 0, disagree: 0, abstain: 0 };
      if (d.choice === "agree") t.agree += 1; else if (d.choice === "disagree") t.disagree += 1; else t.abstain += 1;
      debateTally.set(d.postRef, t);
      done += 1;
    }
    // Grok fix (final run): tallies are NEVER patched per chunk — the driver
    // calls setDebateTallies ONCE after all vote rows are in, deriving exact
    // counts from the debateVotes table (per-chunk patches overwrote them).

    for (const lv of args.listItemVotes) {
      const userId = await uid(lv.userEmail);
      const item = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "listItem").eq("refKey", lv.itemRef)).unique();
      if (!userId || !item?.payload?.itemId) { skipped += 1; continue; }
      const at = args.worldEnd + lv.offsetMs;
      const id = await ctx.db.insert("listItemVotes", { postListItemId: item.payload.itemId, userId, createdAt: at });
      await register(ctx, "listItemVotes", id, batch);
      done += 1;
    }

    for (const a of args.accepts) {
      const post = await gtBy("post", a.postRef);
      const comment = await gtBy("comment", a.commentRef);
      const by = await uid(a.acceptedByEmail);
      if (!post?.postId || !comment?.commentId || !by) { skipped += 1; continue; }
      const at = args.worldEnd + a.offsetMs;
      const ph = await ctx.db.query("postHelps").withIndex("by_postId", (q: any) => q.eq("postId", post.postId)).unique();
      if (ph) await ctx.db.patch(ph._id, { resolvedStatus: "resolved", acceptedCommentId: comment.commentId, acceptedByUserId: by, acceptedAt: at });
      done += 1;
    }

    for (const t of args.toolRatings) {
      const userId = await uid(t.userEmail);
      const toolId = await findToolBySlug(ctx, t.toolSlug);
      if (!userId || !toolId) { skipped += 1; continue; }
      const at = args.worldEnd + t.offsetMs;
      const id = await ctx.db.insert("toolRatings", {
        toolId, userId, overallScore: t.overallScore, dimensionScores: t.dims as any,
        ...(t.reviewText ? { reviewText: t.reviewText } : {}),
        status: "active", moderationStatus: "passed", createdAt: at,
      });
      await register(ctx, "toolRatings", id, batch);
      done += 1; // tools aggregates recomputed by the real tools.recomputeAggregate at settle
    }

    return { done, skipped };
  },
});

/** Final-run fix: set EVERY debate's agree/disagree/abstain exactly once,
 * derived from its debateVotes rows (call after all engagement chunks).
 * Idempotent — re-running recomputes from the rows. */
export const setDebateTallies = internalMutation({
  args: { seq: v.optional(v.number()) },
  returns: v.object({ patched: v.number() }),
  handler: async (ctx) => {
    guard();
    const anchors = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "post")).collect();
    let patched = 0;
    for (const a of anchors) {
      if (a.payload?.type !== "debate" || !a.payload?.postId) continue;
      const votes = await ctx.db.query("debateVotes").withIndex("by_postId", (q: any) => q.eq("postId", a.payload.postId)).collect();
      const pd = await ctx.db.query("postDebates").withIndex("by_postId", (q: any) => q.eq("postId", a.payload.postId)).unique();
      if (!pd) continue;
      const agree = votes.filter((x: any) => x.choice === "agree").length;
      const disagree = votes.filter((x: any) => x.choice === "disagree").length;
      const abstain = votes.filter((x: any) => x.choice === "abstain").length;
      await ctx.db.patch(pd._id, { agreeCount: agree, disagreeCount: disagree, abstainCount: abstain });
      patched += 1;
    }
    return { patched };
  },
});

/** Same discipline for list items: voteCount derived from listItemVotes rows. */
export const setListItemVoteCounts = internalMutation({
  args: { seq: v.optional(v.number()) },
  returns: v.object({ patched: v.number() }),
  handler: async (ctx) => {
    guard();
    const anchors = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "listItem")).collect();
    let patched = 0;
    for (const a of anchors) {
      const itemId = a.payload?.itemId as Id<"postListItems"> | undefined;
      if (!itemId) continue;
      const votes = await ctx.db.query("listItemVotes").withIndex("by_item", (q: any) => q.eq("postListItemId", itemId)).collect();
      const item = await ctx.db.get(itemId);
      if (!item) continue;
      await ctx.db.patch(itemId, { voteCount: votes.length });
      patched += 1;
    }
    return { patched };
  },
});

/** Final-run verification: stored tallies/accepts match their source rows. */
export const verifyTallies = internalQuery({
  args: {},
  returns: v.object({
    debates: v.number(), debateMismatches: v.number(),
    listItems: v.number(), listMismatches: v.number(),
    helpsResolved: v.number(), helpsOpen: v.number(), acceptMismatches: v.number(),
    samples: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const samples: string[] = [];
    const postAnchors = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "post")).collect();
    let debates = 0, debateMismatches = 0, helpsResolved = 0, helpsOpen = 0, acceptMismatches = 0;
    for (const a of postAnchors) {
      const postId = a.payload?.postId;
      if (!postId) continue;
      if (a.payload?.type === "debate") {
        debates += 1;
        const votes = await ctx.db.query("debateVotes").withIndex("by_postId", (q: any) => q.eq("postId", postId)).collect();
        const pd = await ctx.db.query("postDebates").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique();
        if (!pd) { debateMismatches += 1; samples.push(`debate ${a.refKey}: no postDebates row`); continue; }
        const want = { agree: votes.filter((x: any) => x.choice === "agree").length, disagree: votes.filter((x: any) => x.choice === "disagree").length, abstain: votes.filter((x: any) => x.choice === "abstain").length };
        if (pd.agreeCount !== want.agree || pd.disagreeCount !== want.disagree || pd.abstainCount !== want.abstain) {
          debateMismatches += 1;
          samples.push(`debate ${a.refKey}: stored ${pd.agreeCount}/${pd.disagreeCount}/${pd.abstainCount} vs rows ${want.agree}/${want.disagree}/${want.abstain}`);
        }
      }
      if (a.payload?.type === "help") {
        const ph = await ctx.db.query("postHelps").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique();
        if (!ph) continue;
        if (ph.resolvedStatus === "resolved") {
          helpsResolved += 1;
          const c = ph.acceptedCommentId ? await ctx.db.get(ph.acceptedCommentId as Id<"comments">) : null;
          if (!c || c.postId !== postId || !ph.acceptedByUserId || !ph.acceptedAt) {
            acceptMismatches += 1;
            samples.push(`help ${a.refKey}: accept fields inconsistent`);
          }
        } else helpsOpen += 1;
      }
    }
    const itemAnchors = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "listItem")).collect();
    let listItems = 0, listMismatches = 0;
    for (const a of itemAnchors) {
      const itemId = a.payload?.itemId as Id<"postListItems"> | undefined;
      if (!itemId) continue;
      listItems += 1;
      const votes = await ctx.db.query("listItemVotes").withIndex("by_item", (q: any) => q.eq("postListItemId", itemId)).collect();
      const item = await ctx.db.get(itemId);
      if (!item || item.voteCount !== votes.length) {
        listMismatches += 1;
        if (samples.length < 10) samples.push(`listItem ${a.refKey}: stored ${item?.voteCount} vs rows ${votes.length}`);
      }
    }
    return { debates, debateMismatches, listItems, listMismatches, helpsResolved, helpsOpen, acceptMismatches, samples: samples.slice(0, 10) };
  },
});
