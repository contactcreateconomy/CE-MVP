/** demoWorld/importPosts — posts + per-type payload rows (incl. a DEDICATED
 * postNews insert — insertExtensionRow has no news case) + postRevisions +
 * postSeoMeta + postDistributionScores with COUNTERS AS EXACT TALLIES of the
 * driver's event rows (A5.1; scores stay 0 + dirtySince — the real
 * distributionRecompute computes topScore/hotScore/trendScore ONLY) +
 * activityLedger post_published (CR-011 §1). */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { guard, register, batchId, findUserByEmail } from "./lib";

const num = v.number();
const str = v.string();
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export const importPosts = internalMutation({
  args: {
    seq: v.number(),
    worldEnd: v.number(),
    rows: v.array(v.object({
      ref: str, // stable driver key (postI)
      authorEmail: str,
      type: v.union(
        v.literal("news"), v.literal("review"), v.literal("compare"), v.literal("help"),
        v.literal("spark"), v.literal("debate"), v.literal("list"), v.literal("showcase"),
      ),
      title: str,
      body: str,
      categoryId: str, // niche slug (categories use slug strings)
      toolIds: v.array(str), // tool slugs
      createdOffsetMs: num, // negative, from world end
      moderationStatus: v.optional(str),
      // counters (exact tallies of the driver's imported event rows)
      counters: v.object({
        valuableWeighted: num, distinctCommenters: num, replyCount: num,
        saveCount: num, qualifiedReads: num, returns7d: num,
        qualifiedExposureCount: num, lastEligibleInteractionOffsetMs: num,
      }),
      // per-type payloads
      review: v.optional(v.object({ toolId: str, verdictScore: num, verdictSummary: v.optional(str), pros: v.array(str), cons: v.array(str) })),
      compare: v.optional(v.object({ toolIds: v.array(str), qualitativeGrid: v.any() })),
      spark: v.optional(v.object({ statement: str })),
      debate: v.optional(v.object({ proposition: str, agreeCount: num, disagreeCount: num, abstainCount: num })),
      list: v.optional(v.object({ mode: str, intro: str, items: v.array(v.object({ content: str, createdByEmail: str, voteCount: num, sortOrder: num })) })),
      showcase: v.optional(v.object({ theThing: str, projectUrl: v.optional(str) })),
      help: v.optional(v.object({ problemStatement: str, resolvedStatus: str, acceptedCommentRef: v.optional(str), acceptedByEmail: v.optional(str), acceptedOffsetMs: v.optional(num) })),
      news: v.optional(v.object({ sourceOfTruthUrl: str, keyClaims: v.any(), publishedOffsetMs: v.optional(num) })),
    })),
  },
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const batch = batchId("posts", args.seq);
    let inserted = 0, skipped = 0;
    for (const p of args.rows) {
      const gt = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "post").eq("refKey", p.ref)).unique();
      if (gt) { skipped += 1; continue; } // idempotent re-import
      const authorId = await findUserByEmail(ctx, p.authorEmail);
      if (!authorId) { skipped += 1; continue; }
      const createdAt = args.worldEnd + p.createdOffsetMs;
      const postCounters = p.counters;

      const postId = await ctx.db.insert("posts", {
        authorType: "user",
        authorUserId: authorId,
        type: p.type,
        title: p.title,
        body: p.body,
        categoryId: p.categoryId,
        toolIds: p.toolIds,
        lifecycleStatus: "published",
        moderationStatus: (p.moderationStatus as any) ?? "passed",
        visibility: "public",
        publishedAt: createdAt,
        createdAt,
      });
      await register(ctx, "posts", postId, batch);

      // payload row (M4 INV-1: exactly one, same mutation). news = dedicated.
      switch (p.type) {
        case "review": {
          const r = p.review!;
          await ctx.db.insert("postReviews", { postId, toolId: r.toolId, verdictScore: r.verdictScore, ...(r.verdictSummary ? { verdictSummary: r.verdictSummary } : {}), pros: r.pros, cons: r.cons });
          break;
        }
        case "compare": await ctx.db.insert("postCompares", { postId, toolIds: p.compare!.toolIds, qualitativeGrid: p.compare!.qualitativeGrid }); break;
        case "spark": await ctx.db.insert("postSparks", { postId, statement: p.spark!.statement }); break;
        case "debate": {
          const d = p.debate!;
          // tallies = exact counts of imported debateVotes rows (INV-3-equivalent)
          await ctx.db.insert("postDebates", { postId, proposition: d.proposition, agreeCount: d.agreeCount, disagreeCount: d.disagreeCount, abstainCount: d.abstainCount });
          break;
        }
        case "list": {
          const l = p.list!;
          const listId = await ctx.db.insert("postLists", { postId, mode: l.mode as any, intro: l.intro });
          await register(ctx, "postLists", listId, batch);
          for (const item of l.items) {
            const creator = await findUserByEmail(ctx, item.createdByEmail);
            if (!creator) continue;
            const itemId = await ctx.db.insert("postListItems", { postListId: listId, content: item.content, createdByUserId: creator, voteCount: item.voteCount /* = imported listItemVotes count */, sortOrder: item.sortOrder, createdAt });
            await register(ctx, "postListItems", itemId, batch);
            const itemGtId = await ctx.db.insert("demoGroundTruth", { scope: "listItem", refKey: `${p.ref}:item:${item.sortOrder}`, batch, payload: { itemId, postRef: p.ref } });
            await register(ctx, "demoGroundTruth", itemGtId, batch);
          }
          break;
        }
        case "showcase": await ctx.db.insert("postShowcases", { postId, theThing: p.showcase!.theThing, ...(p.showcase!.projectUrl ? { projectUrl: p.showcase!.projectUrl } : {}), approvalStatus: "none" }); break;
        case "help": {
          await ctx.db.insert("postHelps", { postId, problemStatement: p.help!.problemStatement, resolvedStatus: "open" });
          break;
        }
        case "news": {
          const n = p.news!;
          await ctx.db.insert("postNews", { postId, sourceOfTruthUrl: n.sourceOfTruthUrl, keyClaims: n.keyClaims, ...(n.publishedOffsetMs !== undefined ? { publishedAt: args.worldEnd + n.publishedOffsetMs } : {}) });
          break;
        }
      }

      await ctx.db.insert("postRevisions", { postId, revisionNumber: 1, title: p.title, body: p.body, changeType: "create", changedByUserId: authorId, createdAt });
      const slug = slugify(p.title) + "-" + p.ref;
      await ctx.db.insert("postSeoMeta", {
        postId, seoTitle: p.title.slice(0, 70), seoDescription: p.body.slice(0, 155),
        slug, keywords: p.toolIds, canonicalUrl: `/discussions/${slug}`,
        structuredDataType: p.type === "review" ? "review" : "article", manuallyEdited: false,
        generatedAt: createdAt,
      });

      // counters = exact tallies (A5.1); scores 0 + dirtySince → the real job computes ONLY the three scores
      const lastEligible = args.worldEnd + postCounters.lastEligibleInteractionOffsetMs;
      const distId = await ctx.db.insert("postDistributionScores", {
        postId,
        distributionQualityVersion: 1,
        topScore: 0, hotScore: 0, trendScore: 0,
        integrityMultiplier: 1,
        valuableWeighted: postCounters.valuableWeighted,
        distinctCommenters: postCounters.distinctCommenters,
        replyCount: postCounters.replyCount,
        saveCount: postCounters.saveCount,
        qualifiedReads: postCounters.qualifiedReads,
        returns7d: postCounters.returns7d,
        qualifiedExposureCount: postCounters.qualifiedExposureCount,
        explorationDeficit: 0,
        lastEligibleInteractionAt: lastEligible,
        scoreVersion: 0,
        dirtySince: args.worldEnd, // claim for distributionRecompute
        computedAt: 0,
      });
      await register(ctx, "postDistributionScores", distId, batch);

      await ctx.db.insert("activityLedger", {
        userId: authorId, eventType: "post_published", targetType: "post", targetId: postId,
        summary: `Published ${p.type}: ${p.title.slice(0, 60)}`,
        meta: { demo: { value: true, privacy: "public" } },
        visibility: "public", createdAt,
      });

      // idempotency marker (also the post's ground-truth anchor)
      const gtId = await ctx.db.insert("demoGroundTruth", { scope: "post", refKey: p.ref, batch, payload: { postId, type: p.type } });
      await register(ctx, "demoGroundTruth", gtId, batch);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});
