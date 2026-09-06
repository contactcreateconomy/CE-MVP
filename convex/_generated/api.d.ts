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
import type * as admin_audit from "../admin/audit.js";
import type * as admin_roles from "../admin/roles.js";
import type * as admin_shell from "../admin/shell.js";
import type * as admin_stop from "../admin/stop.js";
import type * as admin_widgetsCatalog from "../admin/widgetsCatalog.js";
import type * as admission from "../admission.js";
import type * as affiliateInventory from "../affiliateInventory.js";
import type * as auth from "../auth.js";
import type * as bootstrap from "../bootstrap.js";
import type * as categories from "../categories.js";
import type * as comments from "../comments.js";
import type * as comments_reads from "../comments/reads.js";
import type * as config from "../config.js";
import type * as crons from "../crons.js";
import type * as dev_ensureTestUser from "../dev/ensureTestUser.js";
import type * as editorial_decisions from "../editorial/decisions.js";
import type * as editorial_inject from "../editorial/inject.js";
import type * as editorial_publish from "../editorial/publish.js";
import type * as editorial_review from "../editorial/review.js";
import type * as eligibility from "../eligibility.js";
import type * as forge from "../forge.js";
import type * as forum_constants from "../forum/constants.js";
import type * as forum_discussionRoute from "../forum/discussionRoute.js";
import type * as forum_discussionRouteHelpers from "../forum/discussionRouteHelpers.js";
import type * as forum_feedCache from "../forum/feedCache.js";
import type * as forum_feedQueries from "../forum/feedQueries.js";
import type * as forum_helpers from "../forum/helpers.js";
import type * as forum_jobs from "../forum/jobs.js";
import type * as forum_limits from "../forum/limits.js";
import type * as forum_mutations from "../forum/mutations.js";
import type * as forum_queries from "../forum/queries.js";
import type * as forum_rateLimit from "../forum/rateLimit.js";
import type * as forum_seed from "../forum/seed.js";
import type * as forum_seed_catalog from "../forum/seed/catalog.js";
import type * as forum_seed_discussionThreads from "../forum/seed/discussionThreads.js";
import type * as forum_seed_ensureCategoryRows from "../forum/seed/ensureCategoryRows.js";
import type * as forum_seed_generatePosts from "../forum/seed/generatePosts.js";
import type * as forum_validators from "../forum/validators.js";
import type * as http from "../http.js";
import type * as ingest_extract from "../ingest/extract.js";
import type * as ingest_pollers from "../ingest/pollers.js";
import type * as ingest_pollersData from "../ingest/pollersData.js";
import type * as jobs_infer from "../jobs/infer.js";
import type * as jobs_rank from "../jobs/rank.js";
import type * as legalContent from "../legalContent.js";
import type * as legalContentSeed from "../legalContentSeed.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_classifier from "../lib/classifier.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_glm from "../lib/glm.js";
import type * as lib_hash from "../lib/hash.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_safeFetch from "../lib/safeFetch.js";
import type * as lib_urlGuards from "../lib/urlGuards.js";
import type * as persona_generate from "../persona/generate.js";
import type * as persona_lifecycle from "../persona/lifecycle.js";
import type * as persona_public from "../persona/public.js";
import type * as posts from "../posts.js";
import type * as posts_debate from "../posts/debate.js";
import type * as posts_detail from "../posts/detail.js";
import type * as posts_help from "../posts/help.js";
import type * as posts_listItems from "../posts/listItems.js";
import type * as posts_showcase from "../posts/showcase.js";
import type * as profile from "../profile.js";
import type * as profile_page from "../profile/page.js";
import type * as profile_settings from "../profile/settings.js";
import type * as qualify_orchestrator from "../qualify/orchestrator.js";
import type * as qualify_rules from "../qualify/rules.js";
import type * as qualify_similarity from "../qualify/similarity.js";
import type * as reactions from "../reactions.js";
import type * as rulebook from "../rulebook.js";
import type * as seed from "../seed.js";
import type * as setup from "../setup.js";
import type * as sources from "../sources.js";
import type * as sourcesValidate from "../sourcesValidate.js";
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
  "admin/audit": typeof admin_audit;
  "admin/roles": typeof admin_roles;
  "admin/shell": typeof admin_shell;
  "admin/stop": typeof admin_stop;
  "admin/widgetsCatalog": typeof admin_widgetsCatalog;
  admission: typeof admission;
  affiliateInventory: typeof affiliateInventory;
  auth: typeof auth;
  bootstrap: typeof bootstrap;
  categories: typeof categories;
  comments: typeof comments;
  "comments/reads": typeof comments_reads;
  config: typeof config;
  crons: typeof crons;
  "dev/ensureTestUser": typeof dev_ensureTestUser;
  "editorial/decisions": typeof editorial_decisions;
  "editorial/inject": typeof editorial_inject;
  "editorial/publish": typeof editorial_publish;
  "editorial/review": typeof editorial_review;
  eligibility: typeof eligibility;
  forge: typeof forge;
  "forum/constants": typeof forum_constants;
  "forum/discussionRoute": typeof forum_discussionRoute;
  "forum/discussionRouteHelpers": typeof forum_discussionRouteHelpers;
  "forum/feedCache": typeof forum_feedCache;
  "forum/feedQueries": typeof forum_feedQueries;
  "forum/helpers": typeof forum_helpers;
  "forum/jobs": typeof forum_jobs;
  "forum/limits": typeof forum_limits;
  "forum/mutations": typeof forum_mutations;
  "forum/queries": typeof forum_queries;
  "forum/rateLimit": typeof forum_rateLimit;
  "forum/seed": typeof forum_seed;
  "forum/seed/catalog": typeof forum_seed_catalog;
  "forum/seed/discussionThreads": typeof forum_seed_discussionThreads;
  "forum/seed/ensureCategoryRows": typeof forum_seed_ensureCategoryRows;
  "forum/seed/generatePosts": typeof forum_seed_generatePosts;
  "forum/validators": typeof forum_validators;
  http: typeof http;
  "ingest/extract": typeof ingest_extract;
  "ingest/pollers": typeof ingest_pollers;
  "ingest/pollersData": typeof ingest_pollersData;
  "jobs/infer": typeof jobs_infer;
  "jobs/rank": typeof jobs_rank;
  legalContent: typeof legalContent;
  legalContentSeed: typeof legalContentSeed;
  "lib/audit": typeof lib_audit;
  "lib/authz": typeof lib_authz;
  "lib/classifier": typeof lib_classifier;
  "lib/events": typeof lib_events;
  "lib/glm": typeof lib_glm;
  "lib/hash": typeof lib_hash;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/safeFetch": typeof lib_safeFetch;
  "lib/urlGuards": typeof lib_urlGuards;
  "persona/generate": typeof persona_generate;
  "persona/lifecycle": typeof persona_lifecycle;
  "persona/public": typeof persona_public;
  posts: typeof posts;
  "posts/debate": typeof posts_debate;
  "posts/detail": typeof posts_detail;
  "posts/help": typeof posts_help;
  "posts/listItems": typeof posts_listItems;
  "posts/showcase": typeof posts_showcase;
  profile: typeof profile;
  "profile/page": typeof profile_page;
  "profile/settings": typeof profile_settings;
  "qualify/orchestrator": typeof qualify_orchestrator;
  "qualify/rules": typeof qualify_rules;
  "qualify/similarity": typeof qualify_similarity;
  reactions: typeof reactions;
  rulebook: typeof rulebook;
  seed: typeof seed;
  setup: typeof setup;
  sources: typeof sources;
  sourcesValidate: typeof sourcesValidate;
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
