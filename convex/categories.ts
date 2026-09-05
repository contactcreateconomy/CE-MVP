/**
 * categories — canonical DEC-C01 read (P1-08 seed) for filter surfaces.
 * SLICE-P4-04 consumes it for CAP-111's category filter parameter; the
 * legacy forum categories (useSharedData) are the pre-Transition set and
 * are not the single source for canonical filters.
 */

import { query } from "./_generated/server";

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
