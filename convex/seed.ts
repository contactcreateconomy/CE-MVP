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
import { TAXONOMY_REGISTRY_ROW } from "./tags";
import { AUTOFLAG_REGISTRY_ROWS } from "./toolRatings";
import { RULEBOOK_REGISTRY_ROWS } from "./rulebook";
import { SIGNUP_EVENT_CATALOG_ROW } from "./bootstrap";
import { WAITLIST_EVENT_CATALOG_ROW } from "./waitlist";

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
const EVENT_CATALOG_ROWS = [SIGNUP_EVENT_CATALOG_ROW, WAITLIST_EVENT_CATALOG_ROW];

export const bootstrap = internalMutation({
  args: {},
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

    // R-FOUNDER boundary: no users, no roleAssignments, no founder grants —
    // verified by the module surface (this is the only export).
    return result;
  },
});
