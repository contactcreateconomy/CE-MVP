/**
 * cards — SLICE-P6-02: CAP-190/195/196/197 — the feed-card projection
 * writers (+ CAP-193 stale-hero auto-fill).
 *
 * bible l.137 (quoted): cardSummaries is a "Display projection only —
 *   MUST NOT write postDistributionScores or any rank/score field." —
 *   this module writes ONLY cardSummaries/heroSlots; structurally unable
 *   to touch rank (enforced by test).
 * CAP-190 (quoted): "Never attribute emotion to a named user. Neutral
 *   fallback." — the hook writer is GLM-gated; without MAX grounding
 *   (CAP-132 absent, feed OQ9) it writes the NEUTRAL fallback (title
 *   one-liner, groundingStatus=insufficient), never a manufactured
 *   emotional hook.
 * CAP-195 (quoted): "Member posts only — not persona" (running comment).
 * CAP-196 (quoted): "Freeze ≥15min anti-flicker. Personas excluded."
 * CAP-197: avatars ≤3 distinct human engagers + discussingCount.
 * CAP-193 (quoted): "Never Recognition-selected" — stale-hero auto-fill
 *   draws from TOP (topScore) labeled "Community Top".
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const FREEZE_MS = 15 * 60_000; // ≥15min anti-flicker (quoted)

/** CAP-190/196 — card.generateSummary + pickRunningComment + avatars in
 *  one bounded pass (the writers share the scan; each row's outputs stay
 *  separate fields on the one projection). */
export const refreshCards = internalMutation({
  args: {},
  returns: v.object({ updated: v.number(), neutralFallbacks: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const scored = await ctx.db
      .query("postDistributionScores")
      .withIndex("by_lastEligibleInteractionAt")
      .order("desc")
      .take(30); // freshest cohort
    let updated = 0;
    let neutralFallbacks = 0;

    for (const row of scored) {
      const post = await ctx.db.get(row.postId);
      if (!post || post.lifecycleStatus !== "published") continue;

      const existing = await ctx.db
        .query("cardSummaries")
        .withIndex("by_postId", (q: any) => q.eq("postId", row.postId))
        .unique();

      // oneLiner: M2-grounded (CAP-190/191-class). GLM/MAX absent (G3-
      // deferred + CAP-132 Phase 7) → NEUTRAL fallback = trimmed body
      // lead, groundingStatus=insufficient. Never manufactured emotion.
      const oneLiner = (post.body.replace(/\s+/g, " ").slice(0, 140) || post.title).trim();
      neutralFallbacks += 1;

      // CAP-195/196 — running comment: the trust-weighted M6 Best top
      // comment, member posts only... the comment itself must be a HUMAN
      // comment (personas excluded), frozen ≥15min once picked.
      let runningCommentRef = existing?.runningCommentRef ?? undefined;
      const frozenRecently = runningCommentRef ? now - runningCommentRef.frozenAt < FREEZE_MS : false;
      if (!frozenRecently) {
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_post_depth_created", (q: any) => q.eq("postId", row.postId).eq("depth", 0))
          .take(20);
        const humanPassed = comments.filter(
          (c: any) => c.authorType === "user" && c.moderationStatus === "passed" && !c.deletedAt,
        );
        if (humanPassed.length > 0) {
          // Best order via commentScores (the M6 projection — same score,
          // never recomputed here)
          let best: any = null;
          let bestScore = -1;
          for (const comment of humanPassed) {
            const score = await ctx.db
              .query("commentScores")
              .withIndex("by_comment", (q: any) => q.eq("commentId", comment._id))
              .unique();
            if (score && score.bestScore > bestScore) {
              bestScore = score.bestScore;
              best = comment;
            }
          }
          if (best) runningCommentRef = { commentId: best._id, frozenAt: now };
        }
      }

      // CAP-197 — avatars ≤3 distinct human engagers + discussingCount
      const recentComments = await ctx.db
        .query("comments")
        .withIndex("by_post_depth_created", (q: any) => q.eq("postId", row.postId))
        .take(30);
      const engagers: string[] = [];
      let discussing = 0;
      for (const c of recentComments) {
        if (c.authorType !== "user" || c.deletedAt) continue;
        discussing += 1;
        if (c.authorUserId && !engagers.includes(c.authorUserId) && engagers.length < 3) {
          engagers.push(c.authorUserId); // savers counted in discussingCount, NOT as avatars (l.140)
        }
      }

      const projection: any = {
        postId: row.postId,
        oneLiner,
        generationRunId: `cards:${now}`,
        supportingClaimIds: [],
        groundingStatus: "insufficient", // MAX absent — neutral fallback posture (feed OQ9)
        stale: false,
        runningCommentRef,
        avatarUserIds: engagers.length > 0 ? engagers : undefined,
        discussingCount: discussing,
        createdAt: existing?.createdAt ?? now,
      };
      if (existing) await ctx.db.patch(existing._id, projection);
      else await ctx.db.insert("cardSummaries", projection);
      updated += 1;
    }
    return { updated, neutralFallbacks };
  },
});

/** CAP-193 — stale-hero auto-fill: active slots past endAt with no live
 *  successor backfill from TOP (topScore order), labeled "Community Top"
 *  (quoted) — NEVER Recognition-selected, never leaderboard input. */
export const heroStaleFill = internalMutation({
  args: {},
  returns: v.object({ filled: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const slots = await ctx.db
      .query("heroSlots")
      .withIndex("by_status_start", (q: any) => q.eq("status", "active"))
      .take(10);
    let filled = 0;
    // System actor for auto-fill attribution (the reserved isStaff identity)
    const reserved = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", "platform@createconomy.internal"))
      .unique();
    for (const slot of slots) {
      if (slot.endAt > now) continue; // still live
      await ctx.db.patch(slot._id, { status: "expired" });

      // Fill from TOP — the organic top of postDistributionScores
      const top = await ctx.db
        .query("postDistributionScores")
        .withIndex("by_topScore")
        .order("desc")
        .take(5);
      let filledThis = false;
      for (const candidate of top) {
        const post = await ctx.db.get(candidate.postId);
        if (!post || post.lifecycleStatus !== "published" || post.authorType !== "user") continue;
        if (post._id === slot.postId) continue;
        await ctx.db.insert("heroSlots", {
          slotOrder: slot.slotOrder,
          postId: post._id,
          headlineOverride: "Community Top", // quoted label
          startAt: now,
          endAt: now + 24 * 3_600_000,
          desktopEnabled: true,
          mobileEnabled: true,
          status: "active",
          disclosureClass: "community_top",
          approvedByUserId: undefined, // System fill — no operator attribution
          createdAt: now,
        });
        if (reserved) {
          await ctx.db.insert("heroAssignments", {
            slotOrder: slot.slotOrder,
            postId: post._id,
            activatedAt: now,
            reason: "stale_auto_fill_community_top", // System fill — the reason carries it
            actorUserId: reserved._id,
          });
        }
        filled += 1;
        filledThis = true;
        break;
      }
      void filledThis;
    }
    return { filled };
  },
});
