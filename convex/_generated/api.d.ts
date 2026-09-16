/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as admin_analytics from "../admin/analytics.js";
import type * as admin_appeals from "../admin/appeals.js";
import type * as admin_audit from "../admin/audit.js";
import type * as admin_counters from "../admin/counters.js";
import type * as admin_curation from "../admin/curation.js";
import type * as admin_home from "../admin/home.js";
import type * as admin_homeAlertWriters from "../admin/homeAlertWriters.js";
import type * as admin_interventions from "../admin/interventions.js";
import type * as admin_moderationDomain from "../admin/moderationDomain.js";
import type * as admin_moderationQueue from "../admin/moderationQueue.js";
import type * as admin_readiness from "../admin/readiness.js";
import type * as admin_reliability from "../admin/reliability.js";
import type * as admin_resources from "../admin/resources.js";
import type * as admin_resourcesLifecycle from "../admin/resourcesLifecycle.js";
import type * as admin_roles from "../admin/roles.js";
import type * as admin_sanctions from "../admin/sanctions.js";
import type * as admin_shell from "../admin/shell.js";
import type * as admin_stop from "../admin/stop.js";
import type * as admin_store from "../admin/store.js";
import type * as admin_storeEnforce from "../admin/storeEnforce.js";
import type * as admin_storeValidate from "../admin/storeValidate.js";
import type * as admin_support from "../admin/support.js";
import type * as admin_utm from "../admin/utm.js";
import type * as admin_widgetsCatalog from "../admin/widgetsCatalog.js";
import type * as admin_wiki from "../admin/wiki.js";
import type * as admission from "../admission.js";
import type * as affiliateInventory from "../affiliateInventory.js";
import type * as analytics_projections from "../analytics/projections.js";
import type * as appeal from "../appeal.js";
import type * as auth from "../auth.js";
import type * as bootstrap from "../bootstrap.js";
import type * as cards from "../cards.js";
import type * as categories from "../categories.js";
import type * as comments from "../comments.js";
import type * as comments_reads from "../comments/reads.js";
import type * as config from "../config.js";
import type * as consent from "../consent.js";
import type * as contribute from "../contribute.js";
import type * as crons from "../crons.js";
import type * as dev_ensureTestUser from "../dev/ensureTestUser.js";
import type * as distributions from "../distributions.js";
import type * as economy_seed from "../economy/seed.js";
import type * as editorial_decisions from "../editorial/decisions.js";
import type * as editorial_inject from "../editorial/inject.js";
import type * as editorial_publish from "../editorial/publish.js";
import type * as editorial_review from "../editorial/review.js";
import type * as eligibility from "../eligibility.js";
import type * as feed from "../feed.js";
import type * as forge from "../forge.js";
import type * as go from "../go.js";
import type * as http from "../http.js";
import type * as ingest_extract from "../ingest/extract.js";
import type * as ingest_pollers from "../ingest/pollers.js";
import type * as ingest_pollersData from "../ingest/pollersData.js";
import type * as jobs_attributionSettle from "../jobs/attributionSettle.js";
import type * as jobs_dripRelease from "../jobs/dripRelease.js";
import type * as jobs_explore from "../jobs/explore.js";
import type * as jobs_infer from "../jobs/infer.js";
import type * as jobs_legitimacy from "../jobs/legitimacy.js";
import type * as jobs_maxRefresh from "../jobs/maxRefresh.js";
import type * as jobs_might from "../jobs/might.js";
import type * as jobs_rank from "../jobs/rank.js";
import type * as jobs_recognition from "../jobs/recognition.js";
import type * as jobs_repeatInfringer from "../jobs/repeatInfringer.js";
import type * as jobs_settleDownload from "../jobs/settleDownload.js";
import type * as jobs_signalSummary from "../jobs/signalSummary.js";
import type * as jobs_vibing from "../jobs/vibing.js";
import type * as legal_intake from "../legal/intake.js";
import type * as legalContent from "../legalContent.js";
import type * as legalContentSeed from "../legalContentSeed.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_classifier from "../lib/classifier.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_founder from "../lib/founder.js";
import type * as lib_glm from "../lib/glm.js";
import type * as lib_handle from "../lib/handle.js";
import type * as lib_hash from "../lib/hash.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_safeFetch from "../lib/safeFetch.js";
import type * as lib_urlGuards from "../lib/urlGuards.js";
import type * as media from "../media.js";
import type * as migrations_backfillDistributions from "../migrations/backfillDistributions.js";
import type * as moderation_autoGate from "../moderation/autoGate.js";
import type * as moderation_reasonCodes from "../moderation/reasonCodes.js";
import type * as moderation_reasonCodesSeed from "../moderation/reasonCodesSeed.js";
import type * as moderation_report from "../moderation/report.js";
import type * as newsletter from "../newsletter.js";
import type * as notifications_batch from "../notifications/batch.js";
import type * as notifications_quota from "../notifications/quota.js";
import type * as notifications_reads from "../notifications/reads.js";
import type * as persona_generate from "../persona/generate.js";
import type * as persona_genome from "../persona/genome.js";
import type * as persona_lifecycle from "../persona/lifecycle.js";
import type * as persona_public from "../persona/public.js";
import type * as persona_queue from "../persona/queue.js";
import type * as posts from "../posts.js";
import type * as posts_debate from "../posts/debate.js";
import type * as posts_detail from "../posts/detail.js";
import type * as posts_help from "../posts/help.js";
import type * as posts_listItems from "../posts/listItems.js";
import type * as posts_showcase from "../posts/showcase.js";
import type * as profile from "../profile.js";
import type * as profile_metrics from "../profile/metrics.js";
import type * as profile_page from "../profile/page.js";
import type * as profile_settings from "../profile/settings.js";
import type * as qualify_orchestrator from "../qualify/orchestrator.js";
import type * as qualify_rules from "../qualify/rules.js";
import type * as qualify_similarity from "../qualify/similarity.js";
import type * as reactions from "../reactions.js";
import type * as resources from "../resources.js";
import type * as resources_view from "../resources/view.js";
import type * as retention_visit from "../retention/visit.js";
import type * as rulebook from "../rulebook.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as seo_assertIndexable from "../seo/assertIndexable.js";
import type * as seo_jsonld from "../seo/jsonld.js";
import type * as setup from "../setup.js";
import type * as signal_award from "../signal/award.js";
import type * as signal_promoteDemote from "../signal/promoteDemote.js";
import type * as sources from "../sources.js";
import type * as sourcesValidate from "../sourcesValidate.js";
import type * as store_apply from "../store/apply.js";
import type * as store_public from "../store/public.js";
import type * as store_seed from "../store/seed.js";
import type * as store_sell from "../store/sell.js";
import type * as tags from "../tags.js";
import type * as toolRatings from "../toolRatings.js";
import type * as tools from "../tools.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  "admin/analytics": typeof admin_analytics;
  "admin/appeals": typeof admin_appeals;
  "admin/audit": typeof admin_audit;
  "admin/counters": typeof admin_counters;
  "admin/curation": typeof admin_curation;
  "admin/home": typeof admin_home;
  "admin/homeAlertWriters": typeof admin_homeAlertWriters;
  "admin/interventions": typeof admin_interventions;
  "admin/moderationDomain": typeof admin_moderationDomain;
  "admin/moderationQueue": typeof admin_moderationQueue;
  "admin/readiness": typeof admin_readiness;
  "admin/reliability": typeof admin_reliability;
  "admin/resources": typeof admin_resources;
  "admin/resourcesLifecycle": typeof admin_resourcesLifecycle;
  "admin/roles": typeof admin_roles;
  "admin/sanctions": typeof admin_sanctions;
  "admin/shell": typeof admin_shell;
  "admin/stop": typeof admin_stop;
  "admin/store": typeof admin_store;
  "admin/storeEnforce": typeof admin_storeEnforce;
  "admin/storeValidate": typeof admin_storeValidate;
  "admin/support": typeof admin_support;
  "admin/utm": typeof admin_utm;
  "admin/widgetsCatalog": typeof admin_widgetsCatalog;
  "admin/wiki": typeof admin_wiki;
  admission: typeof admission;
  affiliateInventory: typeof affiliateInventory;
  "analytics/projections": typeof analytics_projections;
  appeal: typeof appeal;
  auth: typeof auth;
  bootstrap: typeof bootstrap;
  cards: typeof cards;
  categories: typeof categories;
  comments: typeof comments;
  "comments/reads": typeof comments_reads;
  config: typeof config;
  consent: typeof consent;
  contribute: typeof contribute;
  crons: typeof crons;
  "dev/ensureTestUser": typeof dev_ensureTestUser;
  distributions: typeof distributions;
  "economy/seed": typeof economy_seed;
  "editorial/decisions": typeof editorial_decisions;
  "editorial/inject": typeof editorial_inject;
  "editorial/publish": typeof editorial_publish;
  "editorial/review": typeof editorial_review;
  eligibility: typeof eligibility;
  feed: typeof feed;
  forge: typeof forge;
  go: typeof go;
  http: typeof http;
  "ingest/extract": typeof ingest_extract;
  "ingest/pollers": typeof ingest_pollers;
  "ingest/pollersData": typeof ingest_pollersData;
  "jobs/attributionSettle": typeof jobs_attributionSettle;
  "jobs/dripRelease": typeof jobs_dripRelease;
  "jobs/explore": typeof jobs_explore;
  "jobs/infer": typeof jobs_infer;
  "jobs/legitimacy": typeof jobs_legitimacy;
  "jobs/maxRefresh": typeof jobs_maxRefresh;
  "jobs/might": typeof jobs_might;
  "jobs/rank": typeof jobs_rank;
  "jobs/recognition": typeof jobs_recognition;
  "jobs/repeatInfringer": typeof jobs_repeatInfringer;
  "jobs/settleDownload": typeof jobs_settleDownload;
  "jobs/signalSummary": typeof jobs_signalSummary;
  "jobs/vibing": typeof jobs_vibing;
  "legal/intake": typeof legal_intake;
  legalContent: typeof legalContent;
  legalContentSeed: typeof legalContentSeed;
  "lib/audit": typeof lib_audit;
  "lib/authz": typeof lib_authz;
  "lib/classifier": typeof lib_classifier;
  "lib/events": typeof lib_events;
  "lib/founder": typeof lib_founder;
  "lib/glm": typeof lib_glm;
  "lib/handle": typeof lib_handle;
  "lib/hash": typeof lib_hash;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/safeFetch": typeof lib_safeFetch;
  "lib/urlGuards": typeof lib_urlGuards;
  media: typeof media;
  "migrations/backfillDistributions": typeof migrations_backfillDistributions;
  "moderation/autoGate": typeof moderation_autoGate;
  "moderation/reasonCodes": typeof moderation_reasonCodes;
  "moderation/reasonCodesSeed": typeof moderation_reasonCodesSeed;
  "moderation/report": typeof moderation_report;
  newsletter: typeof newsletter;
  "notifications/batch": typeof notifications_batch;
  "notifications/quota": typeof notifications_quota;
  "notifications/reads": typeof notifications_reads;
  "persona/generate": typeof persona_generate;
  "persona/genome": typeof persona_genome;
  "persona/lifecycle": typeof persona_lifecycle;
  "persona/public": typeof persona_public;
  "persona/queue": typeof persona_queue;
  posts: typeof posts;
  "posts/debate": typeof posts_debate;
  "posts/detail": typeof posts_detail;
  "posts/help": typeof posts_help;
  "posts/listItems": typeof posts_listItems;
  "posts/showcase": typeof posts_showcase;
  profile: typeof profile;
  "profile/metrics": typeof profile_metrics;
  "profile/page": typeof profile_page;
  "profile/settings": typeof profile_settings;
  "qualify/orchestrator": typeof qualify_orchestrator;
  "qualify/rules": typeof qualify_rules;
  "qualify/similarity": typeof qualify_similarity;
  reactions: typeof reactions;
  resources: typeof resources;
  "resources/view": typeof resources_view;
  "retention/visit": typeof retention_visit;
  rulebook: typeof rulebook;
  search: typeof search;
  seed: typeof seed;
  "seo/assertIndexable": typeof seo_assertIndexable;
  "seo/jsonld": typeof seo_jsonld;
  setup: typeof setup;
  "signal/award": typeof signal_award;
  "signal/promoteDemote": typeof signal_promoteDemote;
  sources: typeof sources;
  sourcesValidate: typeof sourcesValidate;
  "store/apply": typeof store_apply;
  "store/public": typeof store_public;
  "store/seed": typeof store_seed;
  "store/sell": typeof store_sell;
  tags: typeof tags;
  toolRatings: typeof toolRatings;
  tools: typeof tools;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
};
