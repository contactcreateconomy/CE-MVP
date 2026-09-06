import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "recompute hot feed cache",
  { minutes: 5 },
  internal.forum.feedCache.recomputeHotFeed,
  {},
);

crons.interval(
  "reconcile upvote counters",
  { minutes: 10 },
  internal.forum.jobs.reconcileUpvoteCounts,
  {},
);

crons.cron(
  "aggregate daily analytics",
  "0 3 * * *",
  internal.forum.jobs.aggregateDailyAnalytics,
  {},
);

// SLICE-P4-05 (CAP-116): periodic aggregate drift monitoring — alert-only;
// repair (CAP-115 tools.recomputeAggregate) is run separately after the
// alert is triaged. Hourly cadence is an in-slice choice (the register says
// "periodic" without a period); activation requires a deployment push
// (DEV-HANDOFF #6).
crons.interval(
  "tool ratings aggregate drift check",
  { hours: 1 },
  internal.tools.driftCheck,
  {},
);

// SLICE-P4-08 (CAP-032/033/034/036/037): ingestion crons. Each poller
// selects its OWN due configs by nextPollAt ≤ now, so these cadences serve
// every per-source pollIntervalMinutes (the ~6h RSS / daily YouTube
// defaults live in the configs, not the crons). claims.extract +
// cluster.build sweep on short intervals. Activation requires a deployment
// push (DEV-HANDOFF #6).
crons.interval("ingest poll rss", { minutes: 15 }, internal.ingest.pollers.pollRss, {});
crons.interval("ingest poll youtube", { minutes: 60 }, internal.ingest.pollers.pollYouTube, {});
crons.interval("ingest poll raw fetch", { minutes: 30 }, internal.ingest.pollers.pollRawFetch, {});
crons.interval("ingest claims extract", { minutes: 10 }, internal.ingest.extract.extractClaims, {});
crons.interval("ingest cluster build", { minutes: 15 }, internal.ingest.extract.buildClusters, {});

export default crons;

// SLICE-P4-11: publish sweeper — fires due scheduled candidates (missed
// fire-times + rows scheduled before the scheduler-arming wiring landed).
crons.interval(
  "sweep due scheduled candidates",
  { minutes: 5 },
  internal.editorial.publish.sweepScheduled,
  {},
);

// SLICE-P5-04 (CAP-129/130/145): the M6 rank engine. The register's ~3s
// recompute cadence is unattainable on Convex crons (1/min floor) — every
// minute, flagged deviation; the clear-first lease keeps overlap-safe
// semantics regardless of cadence. Decay = liveScore only (CAP-130).
// Inference batch runs pre-dawn (CAP-145 "never blocks").
crons.interval(
  "rank recompute dirty batch",
  { minutes: 1 },
  internal.jobs.rank.recomputeDirtyBatch,
  {},
);
crons.interval(
  "rank decay live scores",
  { minutes: 5 },
  internal.jobs.rank.decayLiveScores,
  {},
);
crons.cron(
  "inference batch",
  "15 4 * * *",
  internal.jobs.infer.inferBatch,
  {},
);

// SLICE-P5-10 (CAP-166/167): persona population + drift crons. Both are
// OUTPUT-ONLY (recommendation queue / flags — no direct persona writes,
// quoted); the operator executes via /admin/personas.
crons.cron(
  "persona population recommend",
  "30 5 * * *",
  internal.persona.lifecycle.populationRecommend,
  {},
);
crons.cron(
  "persona drift check",
  "0 6 * * 1",
  internal.persona.lifecycle.driftCheck,
  {},
);

// SLICE-P5-11 (CAP-175): due scheduled persona comments publish ONLY if
// the persona is still active+unpaused — otherwise fail-closed hold +
// queue alert (never force-publish).
crons.interval(
  "sweep due scheduled persona comments",
  { minutes: 5 },
  internal.persona.queue.sweepScheduled,
  {},
);

// SLICE-P6-02 (CAP-187/188/189/193): the M9 distribution engine. All
// writes-only-to-projections (cards never touch rank); hero fill draws
// from TOP labeled "Community Top" (never Recognition).
crons.interval(
  "distribution rank recompute",
  { minutes: 1 },
  internal.jobs.rank.distributionRecompute,
  {},
);
crons.interval(
  "exploration refresh",
  { minutes: 5 },
  internal.jobs.explore.explorationRefresh,
  {},
);
crons.interval(
  "vibing compute",
  { minutes: 5 },
  internal.jobs.vibing.vibingCompute,
  {},
);
crons.interval(
  "card summaries refresh",
  { minutes: 5 },
  internal.cards.refreshCards,
  {},
);
crons.interval(
  "hero stale auto-fill",
  { hours: 1 },
  internal.cards.heroStaleFill,
  {},
);

// SLICE-P6-07 (CAP-216): qualified-download settlement scan. Promotes
// pending downloads to qualified_download markers; the signalLedger mint
// is M12's (Phase 7) — no Signal math here.
crons.interval(
  "settle qualified downloads",
  { hours: 1 },
  internal.jobs.settleDownload.settleQualifiedDownloads,
  {},
);

// SLICE-P6-11 (CAP-220): kill-gate evaluation — appends
// pilotKillGateEvaluations ONLY (never flips the UGC flag; CAP-221 is
// the Administrator-only switch).
crons.interval(
  "ugc pilot kill-gate evaluation",
  { hours: 24 },
  internal.admin.resourcesLifecycle.killGateEvaluate,
  {},
);
