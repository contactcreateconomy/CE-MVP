/**
 * seed — SLICE-P1-08: seed.bootstrap (internalMutation).
 *
 * CAP-022 Notes (quoted): "Categories/config only — NO Founder; idempotent;
 * seed internal-only." Seeds: DEC-C01 ×5 categories, systemConfig defaults,
 * configKeyRegistry rows (incl. permission keys). Sealed M12 keys absent.
 * R-FOUNDER: never in seed.bootstrap — no founder/admin user or role write
 * exists anywhere in this module. Idempotent: every insert checks existing
 * rows first; re-run = no-op.
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { TAXONOMY_REGISTRY_ROW } from "./tags";
import { AUTOFLAG_REGISTRY_ROWS } from "./toolRatings";
import { RULEBOOK_REGISTRY_ROWS } from "./rulebook";
import { SIGNUP_EVENT_CATALOG_ROW } from "./bootstrap";
import { WAITLIST_EVENT_CATALOG_ROW } from "./waitlist";
import { INTEREST_TILE_DEFS, INTEREST_TAXONOMY_VERSION } from "./setup";
import { COMMENT_EVENT_CATALOG_ROWS } from "./comments";
import { REACTION_EVENT_CATALOG_ROWS } from "./reactions";
import { seedPlatformStores, seedSubIdRegistry } from "./store/seed";
import { FEED_CARD_ACTION_EVENT_ROW } from "./feed";
import { SEARCH_EVENT_ROW } from "./search";
import { RESOURCE_VIEW_EVENT_ROW } from "./resources/view";

// Bible l.86 (quoted): "All 10 types admin-toggleable. 8 ship `active`;
// `launch_pad`,`gigs` ship `locked` (flip at ~1000 DAU = admin action, not
// deploy)." sortOrder/label values are derived from the type list (the
// registry is thin STATE, not type definitions — those live in code).
const POST_TYPE_CONFIG_ROWS = [
  { type: "review", state: "active" as const, sortOrder: 1, label: "Review" },
  { type: "compare", state: "active" as const, sortOrder: 2, label: "Compare" },
  { type: "help", state: "active" as const, sortOrder: 3, label: "Help" },
  { type: "spark", state: "active" as const, sortOrder: 4, label: "Spark" },
  { type: "debate", state: "active" as const, sortOrder: 5, label: "Debate" },
  { type: "list", state: "active" as const, sortOrder: 6, label: "List" },
  { type: "showcase", state: "active" as const, sortOrder: 7, label: "Showcase" },
  { type: "news", state: "active" as const, sortOrder: 8, label: "News (editorial)" },
  { type: "launch_pad", state: "locked" as const, sortOrder: 9, label: "Launch Pad", lockedMessage: "Launch Pad unlocks at ~1000 DAU (admin action, not deploy)" },
  { type: "gigs", state: "locked" as const, sortOrder: 10, label: "Gigs", lockedMessage: "Gigs unlocks at ~1000 DAU (admin action, not deploy)" },
];

// DEC-C01 (LOCKED, founder): the five editorial categories, constrained to
// AI, creators, small business, digital work.
const DEC_C01_CATEGORIES = [
  { slug: "ai-technology", name: "AI & Technology", description: "AI tools, models, and their impact on creative and technical work." },
  { slug: "creator-business", name: "Creator Business", description: "Building, distributing, and monetizing creator work." },
  { slug: "internet-culture", name: "Internet Culture", description: "How digital life, communities, and trends shape work and creation." },
  { slug: "digital-products", name: "Digital Products", description: "Creating, launching, and selling digital products and workflows." },
  { slug: "future-of-work", name: "Future of Work", description: "Digital-work transformation for creators and small businesses." },
] as const;

// Minimal registry seed: content categories (CAP-022), admission mode, and
// the two Phase-1-touched flags. Per-module rows grow as their slices land.
// The four SEALED_KEYS are absent by construction.
const REGISTRY_ROWS = [
  { key: "categories.content", module: "m1", valueType: "json" as const, default: DEC_C01_CATEGORIES.map((c) => c.slug), editTier: "tier1" as const, blastRadius: "Affects the category allowlist for all new posts.", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "signup.mode", module: "m1", valueType: "string" as const, default: "waitlist", enumValues: ["waitlist", "open", "closed"], editTier: "tier3" as const, blastRadius: "Controls whether new members can sign up.", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "constellation.ugc.enabled", module: "m10", valueType: "boolean" as const, default: false, editTier: "tier2" as const, blastRadius: "Enables/disables user-generated resource intake (/contribute).", failDirection: "closed" as const, effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "uploads.avatar.enabled", module: "m1", valueType: "boolean" as const, default: true, editTier: "tier1" as const, blastRadius: "Avatar upload surface availability.", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  // SLICE-P4-15 (CAP-100): the showcase projectUrl host allowlist — fail-closed
  // when missing; empty default rejects all hosts until an administrator
  // populates it (the correct pre-configuration posture).
  { key: "showcase.allowedDomains", module: "m4", valueType: "json" as const, default: [], editTier: "tier2" as const, blastRadius: "Which hosts a showcase projectUrl may point at.", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  // SLICE-P5-02 (CAP-152): posts/hour rolling-limit N — register-unnamed,
  // flagged default 10 (mirrors the literal in lib/rateLimit.ts).
  { key: "member.posts.perHour", module: "m7", valueType: "number" as const, default: 10, min: 1, max: 1000, editTier: "tier2" as const, blastRadius: "Composer rate window (CAP-152; tier-independent).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  // SLICE-P5-04 (DECISIONS-LOCKED #11): rank/score constants — versioned
  // config defaults tagged calibration_pending; real calibration post-beta
  // is Readiness Category 8. The jobs read these with safe fallbacks.
  { key: "rank.best.priorWeight", module: "m6", valueType: "number" as const, default: 5, min: 0.1, max: 100, editTier: "tier2" as const, blastRadius: "Best-sort Bayesian damping weight (calibration_pending.v1).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "rank.best.priorMean", module: "m6", valueType: "number" as const, default: 0.3, min: 0, max: 1, editTier: "tier2" as const, blastRadius: "Best-sort prior mean positive rate (calibration_pending.v1).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "rank.best.minCategorySamples", module: "m6", valueType: "number" as const, default: 10, min: 1, max: 1000, editTier: "tier2" as const, blastRadius: "Category-scoped prior minimum samples (calibration_pending.v1).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "rank.live.halfLifeHours", module: "m6", valueType: "number" as const, default: 6, min: 0.5, max: 168, editTier: "tier2" as const, blastRadius: "Live-sort time-decay gravity half-life (calibration_pending.v1).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  // SLICE-P5-08 (CAP-168): persona weekly comment budget — register-unnamed,
  // flagged default 10 (mirrors the literal in persona/generate.ts).
  { key: "persona.cadence.weeklyBudget", module: "m8", valueType: "number" as const, default: 10, min: 1, max: 100, editTier: "tier2" as const, blastRadius: "Per-persona weekly generation budget (selectivity lever).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  // SLICE-P5-10: lifecycle thresholds — all register-unnamed, flagged
  // defaults (mirrors persona/lifecycle.ts LIFECYCLE_DEFAULTS).
  { key: "persona.activation.trialDays", module: "m8", valueType: "number" as const, default: 7, min: 1, max: 90, editTier: "tier2" as const, blastRadius: "Nascent→active trial window (CAP-160).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "persona.wane.noSelectionDays", module: "m8", valueType: "number" as const, default: 14, min: 1, max: 365, editTier: "tier2" as const, blastRadius: "Waning trigger: days without selection (CAP-163 branch 4).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "persona.revival.threshold", module: "m8", valueType: "number" as const, default: 25, min: 1, max: 10000, editTier: "tier2" as const, blastRadius: "Community revival vote threshold (CAP-165 snapshots at approval).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  // SLICE-P6-02 (DECISIONS-LOCKED #11): M9 feed constants — versioned
  // calibration_pending defaults (jobs read live config with fallbacks).
  { key: "feed.top.priorWeight", module: "m9", valueType: "number" as const, default: 5, min: 0.1, max: 100, editTier: "tier2" as const, blastRadius: "Top-sort Bayesian damping weight (calibration_pending.v1).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "feed.top.priorMean", module: "m9", valueType: "number" as const, default: 0.3, min: 0, max: 1, editTier: "tier2" as const, blastRadius: "Top-sort prior mean (calibration_pending.v1).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "feed.hot.halfLifeHours", module: "m9", valueType: "number" as const, default: 12, min: 0.5, max: 168, editTier: "tier2" as const, blastRadius: "Hot-sort time-decay gravity half-life (calibration_pending.v1).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  // SLICE-P6-07/08: the M10 library/viewer flags (browse public-on; viewer
  // routes fail-closed when false).
  { key: "resources.library.enabled", module: "m10", valueType: "boolean" as const, default: true, editTier: "tier1" as const, blastRadius: "The /resources library browse surface.", failDirection: "closed" as const, effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "resources.view.enabled", module: "m10", valueType: "boolean" as const, default: true, editTier: "tier1" as const, blastRadius: "The sandboxed resource viewer route.", failDirection: "closed" as const, effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  // permission keys (M1 §6 "Seeds: … permission keys") — read by future authz
  { key: "media.upload.maxBytes", module: "m1", valueType: "number" as const, default: 5242880, min: 1024, max: 104857600, editTier: "tier1" as const, blastRadius: "Maximum upload size for avatars and media.", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  // SLICE-P4-03: CAP-534's Admin-Config flag (row owned by convex/tags.ts)
  TAXONOMY_REGISTRY_ROW,
  // SLICE-P4-05: CAP-533 auto-flag thresholds (rows owned by convex/toolRatings.ts)
  ...AUTOFLAG_REGISTRY_ROWS,
  // SLICE-P4-06: M3 rulebook bounds rows (E1 — owned by convex/rulebook.ts).
  // Bounds ONLY: no systemConfig live row is seeded for these (step 3 skips
  // rulebook.* — live values live in qualificationRules.thresholdConfig).
  ...RULEBOOK_REGISTRY_ROWS,
];

// P1-07 mechanism + P2 rows: CAP-437 rejects capture of any event whose
// catalog row is missing (fail-closed rolls back the domain mutation), so
// the rows must exist in the deployment before the surfaces run. Idempotent
// by eventName.
const EVENT_CATALOG_ROWS = [
  SIGNUP_EVENT_CATALOG_ROW,
  WAITLIST_EVENT_CATALOG_ROW,
  ...COMMENT_EVENT_CATALOG_ROWS,
  ...REACTION_EVENT_CATALOG_ROWS,
  FEED_CARD_ACTION_EVENT_ROW,
  SEARCH_EVENT_ROW,
  RESOURCE_VIEW_EVENT_ROW,
];

// SLICE-P5-04: the three M6 rank-engine jobs (CAP-129/130/145) registered
// in the P1-04 catalog (internalFunctionKey doubles as the execution
// allowlist). Cadence lives in crons.ts.
const JOB_CATALOG_ROWS = [
  {
    jobKey: "m6.rank.recompute",
    ownerModule: "m6",
    kind: "cron_mutation" as const,
    internalFunctionKey: "jobs/rank:recomputeDirtyBatch",
    executionAuthority: "system" as const,
    timeoutMs: 30_000,
    retryClass: "mutation_native" as const,
    maxAttempts: 3,
    backoffSeconds: [10, 60],
    idempotencyScope: "runKey",
    importance: "high",
    healthFreshnessSeconds: 300,
    deadLetterAfterSeconds: 3_600,
    status: "active" as const,
    catalogVersion: 1,
  },
  {
    jobKey: "m6.rank.decay",
    ownerModule: "m6",
    kind: "cron_mutation" as const,
    internalFunctionKey: "jobs/rank:decayLiveScores",
    executionAuthority: "system" as const,
    timeoutMs: 30_000,
    retryClass: "mutation_native" as const,
    maxAttempts: 3,
    backoffSeconds: [10, 60],
    idempotencyScope: "runKey",
    importance: "medium",
    healthFreshnessSeconds: 1_800,
    deadLetterAfterSeconds: 10_800,
    status: "active" as const,
    catalogVersion: 1,
  },
  {
    jobKey: "m6.infer.batch",
    ownerModule: "m6",
    kind: "cron_mutation" as const,
    internalFunctionKey: "jobs/infer:inferBatch",
    executionAuthority: "system" as const,
    timeoutMs: 60_000,
    retryClass: "mutation_native" as const,
    maxAttempts: 3,
    backoffSeconds: [60, 300],
    idempotencyScope: "runKey",
    importance: "low",
    healthFreshnessSeconds: 172_800,
    deadLetterAfterSeconds: 604_800,
    status: "active" as const,
    catalogVersion: 1,
  },
  // SLICE-P6-02: the M9 distribution-engine jobs
  {
    jobKey: "m9.rank.recompute",
    ownerModule: "m9",
    kind: "cron_mutation" as const,
    internalFunctionKey: "jobs/rank:distributionRecompute",
    executionAuthority: "system" as const,
    timeoutMs: 30_000,
    retryClass: "mutation_native" as const,
    maxAttempts: 3,
    backoffSeconds: [10, 60],
    idempotencyScope: "runKey",
    importance: "high",
    healthFreshnessSeconds: 300,
    deadLetterAfterSeconds: 3_600,
    status: "active" as const,
    catalogVersion: 1,
  },
  {
    jobKey: "m9.exploration.refresh",
    ownerModule: "m9",
    kind: "cron_mutation" as const,
    internalFunctionKey: "jobs/explore:explorationRefresh",
    executionAuthority: "system" as const,
    timeoutMs: 30_000,
    retryClass: "mutation_native" as const,
    maxAttempts: 3,
    backoffSeconds: [10, 60],
    idempotencyScope: "runKey",
    importance: "medium",
    healthFreshnessSeconds: 1_800,
    deadLetterAfterSeconds: 10_800,
    status: "active" as const,
    catalogVersion: 1,
  },
  {
    jobKey: "m9.vibing.compute",
    ownerModule: "m9",
    kind: "cron_mutation" as const,
    internalFunctionKey: "jobs/vibing:vibingCompute",
    executionAuthority: "system" as const,
    timeoutMs: 30_000,
    retryClass: "mutation_native" as const,
    maxAttempts: 3,
    backoffSeconds: [10, 60],
    idempotencyScope: "runKey",
    importance: "medium",
    healthFreshnessSeconds: 1_800,
    deadLetterAfterSeconds: 10_800,
    status: "active" as const,
    catalogVersion: 1,
  },
  {
    jobKey: "m9.cards.refresh",
    ownerModule: "m9",
    kind: "cron_mutation" as const,
    internalFunctionKey: "cards:refreshCards",
    executionAuthority: "system" as const,
    timeoutMs: 30_000,
    retryClass: "mutation_native" as const,
    maxAttempts: 3,
    backoffSeconds: [10, 60],
    idempotencyScope: "runKey",
    importance: "medium",
    healthFreshnessSeconds: 1_800,
    deadLetterAfterSeconds: 10_800,
    status: "active" as const,
    catalogVersion: 1,
  },
  {
    jobKey: "m9.hero.staleFill",
    ownerModule: "m9",
    kind: "cron_mutation" as const,
    internalFunctionKey: "cards:heroStaleFill",
    executionAuthority: "system" as const,
    timeoutMs: 30_000,
    retryClass: "mutation_native" as const,
    maxAttempts: 3,
    backoffSeconds: [60, 300],
    idempotencyScope: "runKey",
    importance: "low",
    healthFreshnessSeconds: 86_400,
    deadLetterAfterSeconds: 604_800,
    status: "active" as const,
    catalogVersion: 1,
  },
];

export const bootstrap = internalMutation({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const result: string[] = [];

    // 1. Categories (DEC-C01 ×5) — idempotent by slug
    for (const cat of DEC_C01_CATEGORIES) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q: any) => q.eq("slug", cat.slug))
        .unique();
      if (existing) {
        result.push(`categories:${cat.slug}: skipped`);
        continue;
      }
      await ctx.db.insert("categories", {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        seoTitle: cat.name,
        seoDescription: cat.description,
        sortOrder: DEC_C01_CATEGORIES.findIndex((c) => c.slug === cat.slug),
        status: "active",
      });
      result.push(`categories:${cat.slug}: seeded`);
    }

    // 2. configKeyRegistry — idempotent by key
    for (const row of REGISTRY_ROWS) {
      const existing = await ctx.db
        .query("configKeyRegistry")
        .withIndex("by_key", (q: any) => q.eq("key", row.key))
        .unique();
      if (existing) {
        result.push(`registry:${row.key}: skipped`);
        continue;
      }
      await ctx.db.insert("configKeyRegistry", { ...row });
      result.push(`registry:${row.key}: seeded`);
    }

    // 3. systemConfig defaults — only for keys that have a registry row and
    //    no live value. Sealed keys are never written (absent from REGISTRY).
    //    rulebook.* keys are EXCLUDED (SLICE-P4-06): Wave-3 E1 keeps their
    //    live values in qualificationRules.thresholdConfig — a systemConfig
    //    row would be a phantom second source.
    for (const row of REGISTRY_ROWS) {
      if (row.key.startsWith("rulebook.")) {
        result.push(`config:${row.key}: skipped (live values live in qualificationRules — E1)`);
        continue;
      }
      const existing = await ctx.db
        .query("systemConfig")
        .withIndex("by_key", (q: any) => q.eq("key", row.key))
        .first();
      if (existing) {
        result.push(`config:${row.key}: skipped`);
        continue;
      }
      await ctx.db.insert("systemConfig", {
        key: row.key,
        value: row.default,
        valueType: row.valueType,
        scope: "global",
        status: "active",
        version: 1,
        updatedAt: Date.now(),
      });
      result.push(`config:${row.key}: seeded`);
    }

    // 4. postTypeConfig — idempotent by type (P4-02's R-TYP gate reads this;
    //    without rows, createPost rejects every type and the composer's type
    //    list renders empty)
    for (const row of POST_TYPE_CONFIG_ROWS) {
      const existing = await ctx.db
        .query("postTypeConfig")
        .withIndex("by_type", (q: any) => q.eq("type", row.type))
        .unique();
      if (existing) {
        result.push(`postTypeConfig:${row.type}: skipped`);
        continue;
      }
      await ctx.db.insert("postTypeConfig", { ...row, updatedAt: Date.now() });
      result.push(`postTypeConfig:${row.type}: seeded`);
    }

    // 5. eventCatalog — idempotent by eventName (P1-07 gate rows; P2 events)
    for (const row of EVENT_CATALOG_ROWS) {
      const existing = await ctx.db
        .query("eventCatalog")
        .withIndex("by_eventName", (q: any) => q.eq("eventName", row.eventName))
        .unique();
      if (existing) {
        result.push(`eventCatalog:${row.eventName}: skipped`);
        continue;
      }
      await ctx.db.insert("eventCatalog", { ...row });
      result.push(`eventCatalog:${row.eventName}: seeded`);
    }

    // 6. interestTaxonomy (SLICE-P5-05) — tiles derive from the post-type /
    //    DEC-C01 registries (bible l.64 derivation note; contract OQ4: no
    //    CAP seeds these). Two idempotent steps: tags by slug (tagType
    //    "interest"), then interestTaxonomy by tagId. No new systemConfig
    //    key is invented — CAP-389 admin-disable flips isActive (Phase 7).
    for (const def of INTEREST_TILE_DEFS) {
      let tag = await ctx.db
        .query("tags")
        .withIndex("by_slug", (q: any) => q.eq("slug", def.slug))
        .unique();
      if (!tag) {
        const tagId = await ctx.db.insert("tags", {
          slug: def.slug,
          name: def.name,
          tagType: "interest",
          sortOrder: INTEREST_TILE_DEFS.findIndex((d) => d.slug === def.slug),
          status: "active",
        });
        tag = await ctx.db.get(tagId);
        result.push(`tags:${def.slug}: seeded`);
      } else {
        result.push(`tags:${def.slug}: skipped`);
      }
      const tile = await ctx.db
        .query("interestTaxonomy")
        .withIndex("by_tagId", (q: any) => q.eq("tagId", tag!._id))
        .unique();
      if (!tile) {
        await ctx.db.insert("interestTaxonomy", {
          tagId: tag!._id,
          label: def.name,
          category: def.category,
          taxonomyVersion: INTEREST_TAXONOMY_VERSION,
          isActive: true,
        });
        result.push(`interestTaxonomy:${def.slug}: seeded`);
      } else {
        result.push(`interestTaxonomy:${def.slug}: skipped`);
      }
    }

    // 7. jobCatalog (SLICE-P5-04) — the M6 rank-engine jobs, idempotent by jobKey
    for (const row of JOB_CATALOG_ROWS) {
      const existing = await ctx.db
        .query("jobCatalog")
        .withIndex("by_jobKey", (q: any) => q.eq("jobKey", row.jobKey))
        .unique();
      if (existing) {
        result.push(`jobCatalog:${row.jobKey}: skipped`);
        continue;
      }
      await ctx.db.insert("jobCatalog", { ...row, jitterPct: 20 });
      result.push(`jobCatalog:${row.jobKey}: seeded`);
    }

    // 8. Store seeders (SLICE-P6-12): CAP-571 platform-curated store
    //    (reserved isStaff identity + locked fixture links) + CAP-572
    //    subIdRegistry dictionary. Idempotent throughout.
    for (const line of await seedPlatformStores(ctx)) result.push(line);
    for (const line of await seedSubIdRegistry(ctx)) result.push(line);

    // R-FOUNDER boundary: no users, no roleAssignments, no founder grants —
    // verified by the module surface (this is the only export). The ONE
    // deliberate exception is CAP-571's reserved isStaff platform identity
    // (never Founder, never roleAssignments) — quoted in store/seed.ts.
    return result;
  },
});
