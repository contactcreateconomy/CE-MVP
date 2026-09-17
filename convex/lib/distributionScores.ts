/**
 * Feed ranking + SEO rows that must land in the same transaction as publish.
 *
 * `/feed` organic sorts are index scans over `postDistributionScores`
 * (never `posts`). A published post with no score row is invisible.
 * Member `postSeoMeta` used to exist only on editorial persistPublish.
 */
import type { Id } from "../_generated/dataModel";

type DbCtx = { db: any };

export function slugFromTitle(title: string, postId: string): string {
  const baseSlug =
    (title || "post")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "post";
  return `${baseSlug}-${postId.slice(-6)}`;
}

/** Idempotent on `by_postId`. Fresh rows start dirty so rank.recompute can fill Top/Hot. */
export async function ensurePostDistributionScoreTx(
  ctx: DbCtx,
  postId: Id<"posts">,
  now: number,
): Promise<void> {
  const existing = await ctx.db
    .query("postDistributionScores")
    .withIndex("by_postId", (q: any) => q.eq("postId", postId))
    .unique();
  if (existing) {
    if (existing.dirtySince === undefined) {
      await ctx.db.patch(existing._id, { dirtySince: now });
    }
    return;
  }
  await ctx.db.insert("postDistributionScores", {
    postId,
    distributionQualityVersion: 1,
    topScore: 0,
    hotScore: 0,
    trendScore: 0,
    integrityMultiplier: 1,
    valuableWeighted: 0,
    distinctCommenters: 0,
    replyCount: 0,
    saveCount: 0,
    qualifiedReads: 0,
    returns7d: 0,
    qualifiedExposureCount: 0,
    explorationDeficit: 0,
    lastEligibleInteractionAt: now,
    scoreVersion: 1,
    dirtySince: now,
    computedAt: now,
  });
}

/** Idempotent on `by_postId`. Slug is title + last 6 of the post id (editorial CAP-051 shape). */
export async function ensurePostSeoMetaTx(
  ctx: DbCtx,
  args: {
    postId: Id<"posts">;
    title: string;
    body: string;
    type: string;
    now: number;
  },
): Promise<void> {
  const existing = await ctx.db
    .query("postSeoMeta")
    .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
    .unique();
  if (existing) return;
  const slug = slugFromTitle(args.title, args.postId);
  await ctx.db.insert("postSeoMeta", {
    postId: args.postId,
    seoTitle: (args.title || "Untitled").slice(0, 120),
    seoDescription: (args.body || "").replace(/[#*>`]/g, "").trim().slice(0, 160),
    slug,
    keywords: [],
    canonicalUrl: `/discussions/${slug}`,
    structuredDataType: args.type === "review" ? "review" : "article",
    manuallyEdited: false,
    generatedAt: args.now,
  });
}
