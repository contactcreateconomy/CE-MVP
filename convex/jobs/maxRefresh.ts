/**
 * maxRefresh + threadGov — SLICE-P7E-17: CAP-132/136/137/138.
 *
 * CAP-132 (quoted): "Async, never blocks MIN. Persona-exclusion at
 *   input." First ~10–20 human comments; +20 or 6h refresh. The MAX
 *   model/vendor is unnamed in the corpus — the cron writes empty-success
 *   runs (the P6-02 "missing → neutral fallback" class) and flags; no
 *   model invented.
 * CAP-138: force-trigger (Moderator/administrator).
 * CAP-136 (quoted): "Predefined typed keys + bounded values only (no
 *   executable)" — pluginRegistry.setEnabled flips typed keys.
 * CAP-137 (quoted): "never lowers Best (INV-3)" — context-signal review
 *   resolves the P5-03 CAP-127 rows on the SAME A12 board (no second
 *   component; contract OQ6 unpinned → A12 cards).
 *
 * threadIntelligenceRuns/Themes/Positions/Questions: P5-01 omitted them
 * (the catalog flags this) — defined here per bible l.115-119.
 */

import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkRateLimit } from "../lib/rateLimit";

const FIRST_BATCH = 10; // first ~10–20 human comments (quoted band's floor)
const REFRESH_DELTA = 20;
const REFRESH_HOURS = 6;

/** CAP-132 — the MAX refresh cron. Persona-excluded at input; empty-
 *  success until a vendor is named (flagged, never a fake analysis). */
export const sweep = internalMutation({
  args: {},
  returns: v.object({ runs: v.number() }),
  handler: async (ctx) => {
    // Threads with enough human comments since the last run (or none yet)
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post_depth_created", (q: any) => q.eq("depth", 0))
      .order("desc")
      .take(200);
    const byPost = new Map<Id<"posts">, number>();
    for (const c of comments) {
      if (c.authorType === "persona") continue; // persona-exclusion at input (quoted)
      byPost.set(c.postId, (byPost.get(c.postId) ?? 0) + 1);
    }
    const now = Date.now();
    let runs = 0;
    for (const [postId, count] of byPost) {
      if (count < FIRST_BATCH) continue;
      const prior = await ctx.db
        .query("threadIntelligenceRuns")
        .withIndex("by_post", (q: any) => q.eq("postId", postId))
        .take(1)
        .then((rows: any[]) => rows[0] ?? null);
      if (prior && now - prior.completedAt < REFRESH_HOURS * 3_600_000 && count < prior.humanCommentCount + REFRESH_DELTA) {
        continue; // +20 or 6h — whichever first
      }
      await ctx.db.insert("threadIntelligenceRuns", {
        postId,
        fromThreadRevision: 0,
        toThreadRevision: 0,
        status: "empty_success", // vendor unnamed — no fabricated analysis (flagged)
        humanCommentCount: count,
        startedAt: now,
        completedAt: now,
      });
      runs += 1;
    }
    return { runs };
  },
});

/** CAP-138 — operator force-trigger (Moderator/administrator; E-mod-1). */
export const forceRun = mutation({
  args: { postId: v.id("posts") },
  returns: v.object({ queued: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("max.forceRun: authentication required");
    const roles = await assertAdminPermission(ctx);
    if (!roles.some((r) => r === "moderator" || r === "administrator")) {
      throw new Error("max.forceRun: Moderator/administrator required (CAP-138)");
    }
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const count = await ctx.db
      .query("comments")
      .withIndex("by_post_depth_created", (q: any) => q.eq("postId", args.postId).eq("depth", 0))
      .take(100);
    await ctx.db.insert("threadIntelligenceRuns", {
      postId: args.postId,
      fromThreadRevision: 0,
      toThreadRevision: 0,
      generationRunId: `forced:${userId}`,
      status: "empty_success",
      humanCommentCount: count.length,
      startedAt: Date.now(),
      completedAt: Date.now(),
    });
    return { queued: true };
  },
});

/** CAP-136 plugin.setEnabled — typed keys + bounded values only (quoted:
 *  "no executable"). The registry is threadPluginConfig (postType +
 *  featureKey — the M6 registry); this flips the enabled flag and nothing
 *  else. */
export const setPluginEnabled = mutation({
  args: { postType: v.string(), featureKey: v.string(), enabled: v.boolean() },
  returns: v.object({ featureKey: v.string(), enabled: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("plugin.setEnabled: authentication required");
    const roles = await assertAdminPermission(ctx);
    if (!roles.includes("administrator")) throw new Error("plugin.setEnabled: Administrator only (CAP-136)");
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const ALLOWED_FEATURES = ["context_signals", "max_refresh"]; // typed, code-owned
    if (!ALLOWED_FEATURES.includes(args.featureKey)) {
      throw new Error(`plugin.setEnabled: "${args.featureKey}" is not a registered feature key`);
    }
    await writeAudited(ctx, async (actx) => {
      const existing = await actx.db
        .query("threadPluginConfig")
        .withIndex("by_postType_featureKey", (q: any) => q.eq("postType", args.postType).eq("featureKey", args.featureKey))
        .unique();
      if (existing) {
        await actx.db.patch(existing._id, { enabled: args.enabled, updatedByUserId: userId, updatedAt: Date.now() });
      } else {
        await actx.db.insert("threadPluginConfig", {
          postType: args.postType,
          featureKey: args.featureKey,
          enabled: args.enabled,
          config: {}, // bounded values only — never executable
          updatedByUserId: userId,
          updatedAt: Date.now(),
        });
      }
      return {
        actorId: userId, action: "plugin.setEnabled",
        target: `plugin:${args.postType}/${args.featureKey}`, prev: { enabled: !args.enabled },
        next: { enabled: args.enabled },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { featureKey: args.featureKey, enabled: args.enabled };
  },
});

/** CAP-137 — context-signal review resolution (the P5-03 CAP-127 rows).
 *  (quoted): "never lowers Best (INV-3)" — resolving a signal never
 *  touches commentScores.bestScore; the mark is the disposition. */
export const resolveContextSignal = mutation({
  args: {
    signalId: v.id("commentContextSignals"),
    disposition: v.union(v.literal("confirmed"), v.literal("dismissed")),
  },
  returns: v.object({ resolved: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("contextSignal.resolve: authentication required");
    const roles = await assertAdminPermission(ctx);
    if (!roles.some((r) => r === "moderator" || r === "administrator")) {
      throw new Error("contextSignal.resolve: Moderator/administrator required (CAP-137)");
    }
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const signal = await ctx.db.get(args.signalId);
    if (!signal) throw new Error("contextSignal.resolve: signal not found");
    // The signal row's status carries the disposition; the comment's
    // bestScore is never touched (INV-3, quoted: "never lowers Best")
    await ctx.db.patch(args.signalId, { status: args.disposition } as any);
    // INV-3: no bestScore write anywhere in this path (test-enforced)
    return { resolved: true };
  },
});
