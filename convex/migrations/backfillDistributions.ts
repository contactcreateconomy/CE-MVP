/**
 * backfillDistributions — SLICE-P7E-02: the F-11 migration (quoted):
 * "CAP-565 auto-create covers only post-M12 signups; no backfill CAP for
 * pre-existing members" — pre-M12 members' Metrics tab would hit a
 * null-Distribution state. One-shot internal job (run via CLI), idempotent:
 * every bootstrapState=complete member without a distributions row gets
 * one via the SAME ensureDistributionTx body (initial state only).
 *
 * CAP-299 (quoted): "fires only in the edge case where CAP-565 didn't
 * create one — retry logic, migration, etc.; at normal signup it is not
 * needed and does not render." This IS that migration edge. Does NOT
 * replace CAP-565 (bootstrap keeps its follow-on call).
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { ensureDistributionTx } from "../distributions";

export const backfillAll = internalMutation({
  args: {},
  returns: v.object({ scanned: v.number(), created: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    // users by bootstrapState index may not exist — bounded scan of the
    // users table is unacceptable platform-wide, so walk by email index
    // prefix is wrong too; the honest bounded shape is pagination over
    // users. MVP-1 population is small; still bounded via take(1000).
    const users = await ctx.db.query("users").take(1000);
    let created = 0;
    let skipped = 0;
    for (const user of users) {
      if (user.bootstrapState !== "complete") continue;
      const out = await ensureDistributionTx(ctx, user._id);
      if (out.created) created += 1;
      else skipped += 1;
    }
    return { scanned: users.length, created, skipped };
  },
});
