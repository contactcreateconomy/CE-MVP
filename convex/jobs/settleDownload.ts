/**
 * settleDownload — SLICE-P6-07: CAP-216 — the qualified-download
 * settlement cron.
 *
 * Contract: qualified downloads mint provisional Signal via the M12 gate;
 * the legitimacy damper consumes in Phase 7. This job OWNS the scheduled
 * settlement scan (download rows reaching their settle window get their
 * integrityClass promoted to `qualified_download`); the signalLedger
 * write itself is M12's (Phase 7) — this module writes NO Signal math
 * (quoted discipline). Re-download = 0 Signal: only the FIRST download
 * per acquisition is settle-eligible.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

const SETTLE_DELAY_MS = 24 * 3_600_000; // ≥24h before settlement eligibility (abuse window)

export const settleQualifiedDownloads = internalMutation({
  args: {},
  returns: v.object({ candidates: v.number(), promoted: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("downloads")
      .withIndex("by_user_resource")
      .order("desc")
      .take(100); // bounded scan — the freshest download cohort
    let candidates = 0;
    let promoted = 0;
    for (const row of rows) {
      if (row.integrityClass !== "pending_settlement") continue;
      if (now - row.downloadedAt < SETTLE_DELAY_MS) continue;
      candidates += 1;
      // First download per acquisition only (re-download = 0 Signal)
      const siblings = await ctx.db
        .query("downloads")
        .withIndex("by_user_resource", (q: any) => q.eq("userId", row.userId).eq("resourceId", row.resourceId))
        .take(5);
      const isFirst = siblings.every((s: any) => s.downloadedAt >= row.downloadedAt);
      await ctx.db.patch(row._id, {
        integrityClass: isFirst ? "qualified_download" : "redownload_no_signal",
      });
      if (isFirst) promoted += 1;
      // The signalLedger provisional mint is M12's (Phase 7) — the
      // qualified_download marker IS this slice's scheduled settlement.
    }
    return { candidates, promoted };
  },
});
