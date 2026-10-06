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

/** One PAGINATED table per call (Convex: a single paginated query per function). */
export const collectIds = internalMutation({
  args: { table: v.string(), cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ ids: v.array(v.string()), continueCursor: v.string(), isDone: v.boolean() }),
  handler: async (ctx, args) => {
    guard();
    const page = await ctx.db.query("demoRegistry").withIndex("by_table", (q: any) => q.eq("table", args.table))
      .paginate((args.cursor ? { numItems: 500, cursor: args.cursor } : { numItems: 500 }) as any);
    return { ids: (page.page as any[]).map((r) => r.docId), continueCursor: page.continueCursor, isDone: page.isDone };
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

/** Verification helper for the removal script: any demo rows left?
 * CR-015: exact count via the index count scan — the old take(1000) silently
 * capped the bulk estimate at 1,000 rows. */
export const removalStatus = internalMutation({
  args: {},
  returns: v.object({ registryRows: v.number() }),
  handler: async (ctx) => {
    guard();
    const registryRows: number = await (ctx.db.query("demoRegistry") as any).count();
    return { registryRows };
  },
});

/** Orphan sweep for typed-post extension rows that predate registration
 * (importPosts now registers them; this repairs worlds imported before that).
 * Deletes rows of `table` whose parent post no longer exists. One paginated
 * table per call. */
export const orphanSweep = internalMutation({
  args: { table: v.string(), cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ deleted: v.number(), continueCursor: v.string(), isDone: v.boolean() }),
  handler: async (ctx, args) => {
    guard();
    const page = await ctx.db.query(args.table as any)
      .paginate((args.cursor ? { numItems: 200, cursor: args.cursor } : { numItems: 200 }) as any);
    let deleted = 0;
    for (const row of page.page as any[]) {
      const parentOk = row.postId
        ? (await ctx.db.get(row.postId)) !== null
        : row.postListId
          ? (await ctx.db.get(row.postListId)) !== null
          : true;
      if (!parentOk) { await ctx.db.delete(row._id); deleted += 1; }
    }
    return { deleted, continueCursor: page.continueCursor, isDone: page.isDone };
  },
});

/** Replay hygiene for reset:local — storage rows not linked from any live
 * postSeoMeta.ogImageAssetId / users.avatarAssetId are leftovers of a wiped
 * world (the registry-based purge cannot see them). Deletes in batches. */
export const sweepOrphanStorage = internalMutation({
  args: { limit: v.optional(v.number()) },
  returns: v.object({ deleted: v.number(), scanned: v.number(), remaining: v.boolean() }),
  handler: async (ctx, args) => {
    guard();
    const limit = args.limit ?? 500;
    const linked = new Set<string>();
    for await (const seo of ctx.db.query("postSeoMeta")) if (seo.ogImageAssetId) linked.add(String(seo.ogImageAssetId));
    for await (const u of ctx.db.query("users")) if (u.avatarAssetId) linked.add(String(u.avatarAssetId));
    let deleted = 0, scanned = 0;
    let page: any;
    do {
      page = await ctx.db.query("_storage" as any).paginate({ numItems: 100 } as any);
      for (const doc of page.page as any[]) {
        scanned += 1;
        if (!linked.has(String(doc._id))) { await ctx.storage.delete(doc._id as any); deleted += 1; }
        if (deleted >= limit) break;
      }
    } while (!page.isDone && deleted < limit);
    // one more peek to report whether anything remains
    const peek = await ctx.db.query("_storage" as any).paginate({ numItems: 1 } as any);
    return { deleted, scanned, remaining: !peek.isDone || (peek.page as any[]).some((d: any) => !linked.has(String(d._id))) };
  },
});
