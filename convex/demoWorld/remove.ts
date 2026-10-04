/** demoWorld/remove — one-script removal (CR-011 §2). Convex actions have no
 * ctx.db, so removal is ITERATIVE BATCH MUTATIONS driven by
 * scripts/demo-world/remove.mjs: (1) collectIds, (2) removeBatch per table in
 * reverse dependency order until empty, (3) sweepBatch for job outputs that
 * reference demo ids (created by settle jobs AFTER import → not registered),
 * (4) removalStatus verifies zero. Base seed untouched (its rows are not
 * registered). Projection repair = the driver re-runs settle jobs afterwards. */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { guard } from "./lib";

export const REGISTRY_ORDER = [
  "rawEvents", "postDistributionBuckets",
  "commentReactions", "commentSaves", "commentContextSignals", "saves",
  "debateVotes", "listItemVotes", "toolRatings", "notifications",
  "commentScores", "comments",
  "postDistributionScores", "postRevisions", "postSeoMeta",
  "postReviews", "postCompares", "postSparks", "postDebates", "postLists",
  "postListItems", "postShowcases", "postHelps", "postNews",
  "posts",
  "tools",
  "users",
  "demoGroundTruth",
] as const;

export const collectIds = internalMutation({
  args: {},
  returns: v.object({ users: v.array(v.string()), posts: v.array(v.string()) }),
  handler: async (ctx) => {
    guard();
    const users: string[] = [], posts: string[] = [];
    let rows;
    do {
      rows = await ctx.db.query("demoRegistry").withIndex("by_table", (q: any) => q.eq("table", "users")).take(500);
      for (const r of rows) users.push(r.docId);
    } while (rows.length === 500);
    do {
      rows = await ctx.db.query("demoRegistry").withIndex("by_table", (q: any) => q.eq("table", "posts")).take(500);
      for (const r of rows) posts.push(r.docId);
    } while (rows.length === 500);
    return { users, posts };
  },
});

/** Delete up to `limit` registered docs of one table (+ their registry rows). */
export const removeBatch = internalMutation({
  args: { table: v.string(), limit: v.number() },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const rows = await ctx.db.query("demoRegistry").withIndex("by_table", (q: any) => q.eq("table", args.table)).take(Math.min(args.limit, 500));
    let deleted = 0;
    for (const r of rows) {
      try { await ctx.db.delete(r.docId as any); } catch { /* already gone */ }
      await ctx.db.delete(r._id);
      deleted += 1;
    }
    return { deleted };
  },
});

/** Sweep job outputs referencing demo ids (threadStats/activityLedger/…). */
export const sweepBatch = internalMutation({
  args: { kind: v.string(), userIds: v.array(v.string()), postIds: v.array(v.string()) },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const postSet = new Set(args.postIds);
    const userSet = new Set(args.userIds);
    let deleted = 0;
    const drop = async (id: any) => { await ctx.db.delete(id); deleted += 1; };
    switch (args.kind) {
      case "threadStats":
        for await (const ts of ctx.db.query("threadStats")) if (postSet.has(ts.postId)) await drop(ts._id);
        break;
      case "activityLedger":
        for (const u of args.userIds.slice(0, 50)) {
          let page;
          do {
            page = await ctx.db.query("activityLedger").withIndex("by_user_created", (q: any) => q.eq("userId", u)).take(200);
            for (const al of page) await drop(al._id);
          } while (page.length === 200);
        }
        break;
      case "vibingTrends":
        for await (const vt of ctx.db.query("vibingTrends")) if (vt.objectType === "post" && postSet.has(vt.objectId)) await drop(vt._id);
        break;
      case "feedExplorationState":
        for await (const fe of ctx.db.query("feedExplorationState")) if (postSet.has(fe.postId)) await drop(fe._id);
        break;
      case "legitimacyScores":
        for await (const ls of ctx.db.query("legitimacyScores")) if (userSet.has(ls.actorUserId)) await drop(ls._id);
        break;
      case "signalSummary":
        for await (const ss of ctx.db.query("signalSummary")) if (ss.subjectType === "user" && userSet.has(ss.subjectId)) await drop(ss._id);
        break;
      case "recognitionEvents":
        for await (const re of ctx.db.query("recognitionEvents")) if (userSet.has(re.userId)) await drop(re._id);
        break;
      case "signalLedger":
        for await (const sl of ctx.db.query("signalLedger"))
          if (userSet.has(sl.authorUserId) || (sl.contributionType === "post" && postSet.has(sl.contributionId))) await drop(sl._id);
        break;
    }
    return { deleted };
  },
});

/** Verification helper for the removal script: any demo rows left? */
export const removalStatus = internalMutation({
  args: {},
  returns: v.object({ registryRows: v.number() }),
  handler: async (ctx) => {
    guard();
    const rows = await ctx.db.query("demoRegistry").take(1000);
    return { registryRows: rows.length };
  },
});
