/** demoWorld/importTools — load the verified fact-sheet tools (CR-011 §1).
 * Slug-deduped against existing rows (base seed's demo-* tools kept, never
 * overwritten). Zero aggregates — ratings arrive later and the real
 * `tools.recomputeAggregate` computes them. */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { guard, register, batchId } from "./lib";

export const importTools = internalMutation({
  args: {
    seq: v.number(),
    rows: v.array(v.object({
      slug: v.string(),
      name: v.string(),
      categoryIds: v.array(v.string()),
      pricing: v.optional(v.any()),
      officialUrl: v.string(),
      status: v.optional(v.string()),
      verified: v.optional(v.string()),
    })),
  },
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const batch = batchId("tools", args.seq);
    let inserted = 0;
    let skipped = 0;
    for (const t of args.rows) {
      const existing = await ctx.db.query("tools").withIndex("by_slug", (q: any) => q.eq("slug", t.slug)).unique();
      if (existing) { skipped += 1; continue; }
      const id = await ctx.db.insert("tools", {
        name: t.name,
        slug: t.slug,
        categoryIds: t.categoryIds,
        ...(t.pricing !== undefined ? { pricing: t.pricing } : {}),
        officialUrl: t.officialUrl,
        status: (t.status as "active") ?? "active",
        ratingSum: 0,
        ratingCount: 0,
        dimensionSums: { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 },
        dimensionCounts: { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 },
        // provenance: fact-sheet verification level travels with the row
        ...(t.verified !== undefined ? { lastReviewedAt: undefined } : {}),
      });
      await register(ctx, "tools", id, batch);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});
