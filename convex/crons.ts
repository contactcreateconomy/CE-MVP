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
