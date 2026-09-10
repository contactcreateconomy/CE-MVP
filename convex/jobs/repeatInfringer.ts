/**
 * repeatInfringer — SLICE-P7T-09: CAP-338.
 *
 * (quoted): "3 valid copyright strikes / 12 months → TERMINATED.
 *   Counter-notice/withdrawal/reversal voids a strike retroactively →
 *   reinstate if <3." The `copyright_rights` strike class (bible
 *   `strikes.class`, enumerated) is the valid-copyright class.
 * Writes users standing + moderationActions + auditLog. CAP-337
 * (P7E-15) remains the human terminate mutation; this cron applies the
 * RI POLICY standing write. The public page (P7T-08) still never reads
 * per-user data.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

const WINDOW_DAYS = 365;
const STRIKE_THRESHOLD = 3;

export const evaluate = internalMutation({
  args: {},
  returns: v.object({ terminated: v.number(), reinstated: v.number() }),
  handler: async (ctx) => {
    const yearAgo = Date.now() - WINDOW_DAYS * 24 * 3_600_000;
    const strikes = await ctx.db
      .query("strikes")
      .withIndex("by_user_active", (q: any) => q.eq("active", true))
      .take(500);

    const byUser = new Map<Id<"users">, number>();
    for (const s of strikes) {
      if (s.class !== "copyright_rights") continue; // the RI class (quoted)
      if (s.createdAt < yearAgo) continue; // 12-month window
      if (s.voidedByRestore) continue; // voided strikes never count (retroactive)
      byUser.set(s.userId, (byUser.get(s.userId) ?? 0) + 1);
    }

    let terminated = 0;
    let reinstated = 0;
    for (const [userId, count] of byUser) {
      const user = await ctx.db.get(userId);
      if (!user) continue;
      if (count >= STRIKE_THRESHOLD && user.accountStanding !== "terminated") {
        await ctx.db.patch(userId, { accountStanding: "terminated" } as any);
        await ctx.db.insert("trustHistory", {
          userId,
          event: "standing_transition",
          reason: "repeat_infringer_3_valid_copyright_in_12mo",
          standingTransition: {
            from: user.accountStanding ?? "good",
            to: "terminated",
            caseId: (strikes.find((s: any) => s.userId === userId)?.caseId ?? strikes[0]?.caseId) as Id<"moderationCases">,
            durationDays: 0,
          } as any,
          occurredAt: Date.now(),
        });
        terminated += 1;
      }
    }

    // Reinstate: terminated-by-RI users whose valid count dropped below 3
    // (a strike was voided retroactively — quoted). Any OTHER termination
    // basis is NEVER touched here (RI standing write only).
    const terminatedUsers = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("accountStanding"), "terminated"))
      .take(200);
    for (const u of terminatedUsers) {
      const prior = await ctx.db
        .query("trustHistory")
        .withIndex("by_user_time", (q: any) => q.eq("userId", u._id))
        .take(50);
      const wasRI = prior.some(
        (h: any) => h.event === "standing_transition" && h.reason === "repeat_infringer_3_valid_copyright_in_12mo",
      );
      if (!wasRI) continue;
      const valid = byUser.get(u._id) ?? 0;
      if (valid < STRIKE_THRESHOLD) {
        await ctx.db.patch(u._id, { accountStanding: "warned" } as any);
        await ctx.db.insert("trustHistory", {
          userId: u._id,
          event: "standing_transition",
          reason: "repeat_infringer_reinstated_strike_voided",
          standingTransition: { from: "terminated", to: "warned", caseId: (prior[0]?.standingTransition as any)?.caseId ?? prior[0]?.triggerCaseId, durationDays: 0 } as any,
          occurredAt: Date.now(),
        });
        reinstated += 1;
      }
    }
    return { terminated, reinstated };
  },
});
