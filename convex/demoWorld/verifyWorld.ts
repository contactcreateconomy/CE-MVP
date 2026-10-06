/** demoWorld/verifyWorld — final-run step-4 guarantee counts, read from the real
 * tables through full scans (internal tooling; split into two queries so each
 * stays under the 32k-doc / 16.7MB transaction caps on the full corpus). */
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

const DAY = 86_400_000;

export const verifyWorld = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const now = Date.now();
    const posts = await ctx.db.query("posts").collect();

    const byType: Record<string, number> = {};
    const windows = { last24h: 0, last7d: 0, last30d: 0, older: 0 };
    const titleEdge = { long: 0, short: 0 };
    for (const p of posts as any[]) {
      byType[p.type] = (byType[p.type] ?? 0) + 1;
      const age = now - (p.publishedAt ?? p.createdAt);
      if (age <= 1 * DAY) windows.last24h += 1;
      else if (age <= 7 * DAY) windows.last7d += 1;
      else if (age <= 30 * DAY) windows.last30d += 1;
      else windows.older += 1;
      if (p.title.length >= 90) titleEdge.long += 1;
      if (p.title.length <= 25) titleEdge.short += 1;
    }

    // covers
    const seo = await ctx.db.query("postSeoMeta").collect();
    const covers = (seo as any[]).filter((s) => s.ogImageAssetId).length;

    // helps, debates, lists
    const helps = await ctx.db.query("postHelps").collect();
    const helpStates = { resolved: 0, open: 0 };
    for (const h of helps as any[]) helpStates[h.resolvedStatus === "resolved" ? "resolved" : "open"] += 1;

    const debates = await ctx.db.query("postDebates").collect();
    let lopsided = 0, close = 0;
    for (const d of debates as any[]) {
      const total = d.agreeCount + d.disagreeCount + d.abstainCount;
      if (!total) continue;
      const top = Math.max(d.agreeCount, d.disagreeCount);
      if (top / total >= 0.75) lopsided += 1;
      if (Math.abs(d.agreeCount - d.disagreeCount) / total <= 0.1) close += 1;
    }

    const lists = await ctx.db.query("postLists").collect();
    const listModes = { community_ranked: 0, static_creator: 0 };
    for (const l of lists as any[]) listModes[l.mode as "community_ranked"] += 1;

    return {
      posts: posts.length,
      byType, windows, titleEdge, covers,
      help: helpStates,
      debates: { total: (debates as any[]).length, lopsided, close },
      lists: listModes,
    };
  },
});

export const verifyThreads = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const comments = await ctx.db.query("comments").collect();
    const perPost = new Map<string, number>();
    let oneLine = 0, long = 0;
    for (const c of comments as any[]) {
      perPost.set(String(c.postId), (perPost.get(String(c.postId)) ?? 0) + 1);
      if (c.body.length < 80) oneLine += 1;
      if (c.body.length >= 400) long += 1;
    }
    const sizes = [...perPost.values()];
    const posts = await ctx.db.query("posts").collect();
    const helpIds = new Set((posts as any[]).filter((p) => p.type === "help").map((p) => String(p._id)));
    const unanswered = [...helpIds].filter((id) => !perPost.has(id)).length;
    return {
      comments: comments.length,
      threadsWithComments: perPost.size,
      zeroCommentPosts: posts.length - perPost.size,
      sixtyPlus: sizes.filter((n) => n >= 60).length,
      largest: sizes.length ? Math.max(...sizes) : 0,
      commentEdges: { oneLine, long },
      unansweredHelpPosts: unanswered,
    };
  },
});

export const verifyPodium = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const now = Date.now();
    const posts = await ctx.db.query("posts").collect();
    const catById = new Map((posts as any[]).map((p) => [String(p._id), p.categoryId]));
    const contributors = new Map<string, Set<string>>();
    const comments = await ctx.db.query("comments").collect();
    for (const c of comments as any[]) {
      if (now - c.createdAt > 30 * DAY || !c.authorUserId) continue;
      const cat = catById.get(String(c.postId));
      if (!cat) continue;
      const set = contributors.get(cat) ?? new Set<string>();
      set.add(String(c.authorUserId));
      contributors.set(cat, set);
    }
    return [...contributors.entries()]
      .map(([category, set]) => ({ category, distinctContributors30d: set.size }))
      .sort((a, b) => b.distinctContributors30d - a.distinctContributors30d);
  },
});

export const verifyTools = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const ratings = await ctx.db.query("toolRatings").collect();
    const perTool: Record<string, number> = {};
    for (const r of ratings as any[]) perTool[r.toolId] = (perTool[r.toolId] ?? 0) + 1;
    const counts = Object.entries(perTool).map(([tool, n]) => ({ tool, ratings: n })).sort((a, b) => b.ratings - a.ratings);
    return { toolsWithRatings: counts.length, top10: counts.slice(0, 10), tailWithRatings: counts.slice(10).filter((t) => t.ratings >= 1).length };
  },
});

export const verifyPeople = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const devtest = (users as any[]).find((u) => u.email === "devtest@example.com");
    const nonLatinNames = (users as any[]).filter((u) => /[^\u0000-\u024F\u1E00-\u1EFF\u2070-\u209F\u20A0-\u20BF]/.test(u.name ?? "")).length;
    const noAvatar = (users as any[]).filter((u) => !u.avatarAssetId).length;

    let devtestNotifications = 0;
    if (devtest) {
      const rows = await ctx.db.query("notifications").withIndex("by_user_unread", (q: any) => q.eq("recipientUserId", devtest._id)).collect();
      devtestNotifications = rows.length;
    }

    return {
      members: users.length, nonLatinNames, membersWithoutAvatar: noAvatar,
      devtest: { found: !!devtest, notifications: devtestNotifications },
    };
  },
});

/** bad-actor spot check: one gt row per bad actor's comment ref (args from the
 * artifact — bounded point lookups instead of a 17k-row gt scan) */
export const verifyBadActors = internalQuery({
  args: { refs: v.array(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const out = [];
    for (const ref of args.refs) {
      const g = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "comment").eq("refKey", ref)).unique();
      out.push({ ref, inDb: !!g, role: g?.payload?.badActorRole ?? null, author: g?.payload?.authorEmail ?? null });
    }
    return out;
  },
});

/** diagnostics: gt + postSeoMeta state for one post ref */
export const probePost = internalQuery({
  args: { ref: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const gt = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "post").eq("refKey", args.ref)).unique();
    const postId = gt?.payload?.postId ?? null;
    const seo = postId ? await ctx.db.query("postSeoMeta").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique() : null;
    return { gtFound: !!gt, postId: String(postId), seoFound: !!seo, ogImageAssetId: seo?.ogImageAssetId ?? null, slug: seo?.slug ?? null };
  },
});

/** post-chain confirmation: legitimacy coverage over the loaded world */
export const legitimacyCount = internalQuery({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db.query("legitimacyScores").collect();
    const hour = Date.now() - 3_600_000;
    return { total: rows.length, scoredLastHour: rows.filter((r: any) => (r.computedAt ?? 0) > hour).length };
  },
});
