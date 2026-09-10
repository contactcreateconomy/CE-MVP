/**
 * economy seed — SLICE-P7E-01: Founding Season + ten signalLevelDefinitions
 * rows (bible l.344 bands, transcribed — not invented) + the DECISIONS-LOCKED
 * #11 calibration_pending config-key registry rows for the M12 constants.
 *
 * Bands (quoted): "Orbit=all · Comet 50% · Moon 20% · Planet 10% · Star 3% ·
 *   Supernova 1% · Nebula 0.3% · Galaxy 0.1% · Universe 0.03% · Multiverse
 *   abs-cap ~top100. Cold-start <1000 pool = fixed thresholds; Supernova+
 *   silhouettes until pool grows."
 * Fixed might THRESHOLD numbers are NOT in the bible — they are
 * calibration_pending config keys (DECISIONS-LOCKED #11), so the seed leaves
 * fixedMightThreshold unset and the season thresholds map empty until the
 * calibration pass owns them (Readiness Category 8).
 * identityText/milestoneCopyRef seed empty — copy is founder-owned; the A8
 * ladder v1 renders the level literal (flagged, not invented).
 */

export const SIGNAL_LEVEL_BANDS = [
  { level: "orbit", percentileBand: "all", revealState: "visible" },
  { level: "comet", percentileBand: "p50", revealState: "visible" },
  { level: "moon", percentileBand: "p20", revealState: "visible" },
  { level: "planet", percentileBand: "p10", revealState: "visible" },
  { level: "star", percentileBand: "p3", revealState: "visible" },
  { level: "supernova", percentileBand: "p1", revealState: "silhouette" },
  { level: "nebula", percentileBand: "p0.3", revealState: "silhouette" },
  { level: "galaxy", percentileBand: "p0.1", revealState: "silhouette" },
  { level: "universe", percentileBand: "p0.03", revealState: "silhouette" },
  { level: "multiverse", percentileBand: "top100", revealState: "silhouette" },
] as const;

export async function seedFoundingSeason(ctx: any): Promise<string[]> {
  const result: string[] = [];

  const now = Date.now();
  const yearMs = 365 * 24 * 3_600_000;

  // Founding Season = season 1, status active, mode fixed (cold-start)
  let season = await ctx.db
    .query("signalSeasons")
    .withIndex("by_seasonNumber", (q: any) => q.eq("seasonNumber", 1))
    .unique();
  if (!season) {
    const seasonId = await ctx.db.insert("signalSeasons", {
      seasonNumber: 1,
      startAt: now,
      endAt: now + yearMs,
      status: "active",
      mode: "fixed", // cold-start <1000 pool = fixed thresholds (quoted)
      thresholds: {}, // values await calibration_pending keys — not invented
      poolSize: 0,
      announcedAt: now,
    });
    season = { _id: seasonId };
    result.push("signalSeasons:founding: seeded");
  } else {
    result.push("signalSeasons:founding: skipped");
  }

  // Ten level definitions from the bible bands
  for (const band of SIGNAL_LEVEL_BANDS) {
    const existing = await ctx.db
      .query("signalLevelDefinitions")
      .withIndex("by_season_level", (q: any) =>
        q.eq("seasonId", season!._id).eq("level", band.level))
      .unique();
    if (existing) {
      result.push(`signalLevel:${band.level}: skipped`);
      continue;
    }
    await ctx.db.insert("signalLevelDefinitions", {
      seasonId: season!._id,
      level: band.level,
      percentileBand: band.percentileBand,
      sustainDays: 30, // CAP-306 "~30d" — config-keyed at the job, seeded default
      revealState: band.revealState, // Supernova+ silhouettes until pool grows (quoted)
      identityText: "", // founder-owned copy — UI renders the level literal
      milestoneCopyRef: "",
    });
    result.push(`signalLevel:${band.level}: seeded`);
  }
  return result;
}
