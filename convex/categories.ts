/**
 * categories — canonical DEC-C01 read (P1-08 seed) for filter surfaces.
 * SLICE-P4-04 consumes it for CAP-111's category filter parameter; the
 * legacy forum categories (useSharedData) are the pre-Transition set and
 * are not the single source for canonical filters.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("categories")
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .collect();
    return rows
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((c: any) => ({ slug: c.slug, name: c.name, description: c.description }));
  },
});

/**
 * SLICE-P7-CLEANUP: the typed-post registry read (the shell's category
 * pills — the legacy forum categories table was this registry in legacy
 * form). Serves postTypeConfig (CAP-104); icon/color stay client display
 * concerns.
 */
const POST_TYPE_DESCRIPTIONS: Record<string, string> = {
  news: "Platform-injected industry news.",
  review: "Structured tool reviews with community verdicts.",
  compare: "Side-by-side tool comparisons.",
  help: "Questions with accepted answers.",
  spark: "Short ideas and provocations.",
  debate: "Position-based discussions.",
  list: "Ranked or curated lists.",
  showcase: "Project showcases with one outbound URL.",
};

export const listPostTypes = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const rows = await ctx.db.query("postTypeConfig").take(20);
    return rows
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((r: any) => ({
        key: r.type,
        name: r.label,
        description: POST_TYPE_DESCRIPTIONS[r.type] ?? "",
        lockedByDefault: r.state === "locked", // DAU-locked (CAP-104)
      }));
  },
});
