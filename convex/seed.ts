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

    // R-FOUNDER boundary: no users, no roleAssignments, no founder grants —
    // verified by the module surface (this is the only export).
    return result;
  },
});
