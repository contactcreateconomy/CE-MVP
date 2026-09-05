/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as admission from "../admission.js";
import type * as admin_shell from "../admin/shell.js";
import type * as admin_widgetsCatalog from "../admin/widgetsCatalog.js";
import type * as admin_stop from "../admin/stop.js";
import type * as admin_roles from "../admin/roles.js";
import type * as admin_audit from "../admin/audit.js";
import type * as bootstrap from "../bootstrap.js";
import type * as config from "../config.js";
import type * as crons from "../crons.js";
import type * as dev_ensureTestUser from "../dev/ensureTestUser.js";
import type * as forum_constants from "../forum/constants.js";
import type * as forum_discussionRoute from "../forum/discussionRoute.js";
import type * as forum_discussionRouteHelpers from "../forum/discussionRouteHelpers.js";
import type * as forum_feedCache from "../forum/feedCache.js";
import type * as forum_feedQueries from "../forum/feedQueries.js";
import type * as forum_helpers from "../forum/helpers.js";
import type * as legalContent from "../legalContent.js";
import type * as legalContentSeed from "../legalContentSeed.js";
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
import type * as posts from "../posts.js";
import type * as profile from "../profile.js";
import type * as tags from "../tags.js";
import type * as tools from "../tools.js";
import type * as categories from "../categories.js";
import type * as toolRatings from "../toolRatings.js";
import type * as rulebook from "../rulebook.js";
import type * as qualify_orchestrator from "../qualify/orchestrator.js";
import type * as qualify_rules from "../qualify/rules.js";
import type * as qualify_similarity from "../qualify/similarity.js";
import type * as sources from "../sources.js";
import type * as ingest_pollers from "../ingest/pollers.js";
import type * as ingest_extract from "../ingest/extract.js";
import type * as forge from "../forge.js";
import type * as editorial_review from "../editorial/review.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  "dev/ensureTestUser": typeof dev_ensureTestUser;
  "forum/constants": typeof forum_constants;
  "forum/discussionRoute": typeof forum_discussionRoute;
  "forum/discussionRouteHelpers": typeof forum_discussionRouteHelpers;
  "forum/feedCache": typeof forum_feedCache;
  "forum/feedQueries": typeof forum_feedQueries;
  "forum/helpers": typeof forum_helpers;
  admission: typeof admission;
  "admin/shell": typeof admin_shell;
  "admin/widgetsCatalog": typeof admin_widgetsCatalog;
  "admin/stop": typeof admin_stop;
  "admin/roles": typeof admin_roles;
  "admin/audit": typeof admin_audit;
  bootstrap: typeof bootstrap;
  config: typeof config;
  legalContent: typeof legalContent;
  legalContentSeed: typeof legalContentSeed;
  legalContentSeed: typeof legalContentSeed;
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
  posts: typeof posts;
  profile: typeof profile;
  tags: typeof tags;
  tools: typeof tools;
  categories: typeof categories;
  toolRatings: typeof toolRatings;
  rulebook: typeof rulebook;
  "qualify/orchestrator": typeof qualify_orchestrator;
  "qualify/rules": typeof qualify_rules;
  "qualify/similarity": typeof qualify_similarity;
  sources: typeof sources;
  "ingest/pollers": typeof ingest_pollers;
  "ingest/extract": typeof ingest_extract;
  forge: typeof forge;
  "editorial/review": typeof editorial_review;
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

export declare const components: {};
