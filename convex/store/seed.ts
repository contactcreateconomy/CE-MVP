/**
 * store seed — SLICE-P6-12: CAP-571 (platform-curated seed stores) +
 * CAP-572 (subIdRegistry dictionary). Deploy/migration seeders, run by
 * seed.bootstrap (idempotent).
 *
 * CAP-571 Notes (quoted): "ownerUserId references a reserved
 *   platform/system identity (created once, inside this seeder — not
 *   CAP-022, which stays categories/config only and never creates
 *   users/Founder), preserving the field's uniqueness constraint
 *   uncompromised — no schema loosening." That identity is isStaff=true,
 *   NOT Founder; seed storefronts share that identity's single
 *   Distribution. Products + storefrontLinks seed at
 *   validationState=approved_locked. Uniqueness shape (quoted): "P6-12's
 *   index is partial: unique(ownerUserId) where isPlatformCurated=false"
 *   — enforced in the approve/storefront mutations (a second human-owner
 *   store for the same user is rejected there); this seeder only ever
 *   writes isPlatformCurated=true rows under the reserved identity.
 *
 * CAP-572 Notes (quoted): "Empty dictionary → CAP-248 fail-closes (does
 *   not append unknown params)." Rows are the per-network capability
 *   dictionary from the source-controlled catalog — Amazon flags
 *   consistent with CAP-261's "not Amazon" reconcile exclusion (no
 *   subid/return → permitted=false there), not invented.
 */

import type { Id } from "../_generated/dataModel";

/** The reserved platform identity — created once, isStaff, never Founder. */
export const RESERVED_PLATFORM_EMAIL = "platform@createconomy.internal";

export async function seedPlatformStores(ctx: any): Promise<string[]> {
  const result: string[] = [];

  // 0. Reserved identity (once) — NOT CAP-022 (that gate stays closed)
  let reserved = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", RESERVED_PLATFORM_EMAIL))
    .unique();
  if (!reserved) {
    const userId = await ctx.db.insert("users", {
      email: RESERVED_PLATFORM_EMAIL,
      emailVerified: true,
      accountStatus: "active",
      accountStanding: "good",
      isStaff: true,
      displayName: "Createconomy Platform",
      username: "createconomy-platform",
      usernameNormalized: "createconomy-platform",
      createdAt: Date.now(),
    });
    reserved = await ctx.db.get(userId);
    result.push("users:platform-reserved: seeded");
  } else {
    result.push("users:platform-reserved: skipped");
  }

  // 1. The identity's single Distribution (CAP-565 shape, seeded)
  let distribution = await ctx.db
    .query("distributions")
    .withIndex("by_owner", (q: any) => q.eq("ownerUserId", reserved!._id))
    .unique();
  if (!distribution) {
    const distributionId = await ctx.db.insert("distributions", {
      ownerUserId: reserved!._id,
      ownershipMode: "single",
      name: "Createconomy Platform Store",
      memberCount: 0,
      reachFactor: 0,
      activeSignalFactor: 0,
      might: 0,
      mightPercentile: 0,
      currentLevel: "orbit",
      highestLevelAchieved: "orbit",
      awardsCount: 0,
      dormant: false,
      createdAt: Date.now(),
    });
    distribution = await ctx.db.get(distributionId);
    result.push("distributions:platform: seeded");
  } else {
    result.push("distributions:platform: skipped");
  }

  // 2. The seed storefront (isPlatformCurated=true, active)
  let store = await ctx.db
    .query("storefronts")
    .withIndex("by_owner", (q: any) => q.eq("ownerUserId", reserved!._id))
    .unique();
  if (!store) {
    const storeId = await ctx.db.insert("storefronts", {
      ownerUserId: reserved!._id,
      distributionId: distribution!._id,
      status: "active",
      isPlatformCurated: true,
      disclosureVersion: "platform.v1",
      collections: [],
      activatedAt: Date.now(),
      createdAt: Date.now(),
    });
    store = await ctx.db.get(storeId);
    result.push("storefronts:platform-curated: seeded");
  } else {
    result.push("storefronts:platform-curated: skipped");
  }

  // 3. Seed products + links at approved_locked (fixtures for P6-17/18)
  for (const product of SEED_PRODUCTS) {
    const existing = await ctx.db
      .query("storefrontProducts")
      .withIndex("by_storefront", (q: any) => q.eq("storefrontId", store!._id))
      .filter((q: any) => q.eq(q.field("name"), product.name))
      .first();
    if (existing) {
      result.push(`storefrontProducts:${product.slug}: skipped`);
      continue;
    }
    const linkId = await ctx.db.insert("storefrontLinks", {
      submittedUrl: product.submittedUrl,
      finalRegistrableDomain: product.domain,
      redirectChainHash: `seed:${product.slug}`,
      network: product.network,
      programName: product.programName,
      affiliateAccountRefMasked: "seed-***",
      permittedChannels: ["storefront", "post"],
      geoEligibility: [],
      selfReferralPolicy: "excluded",
      subAffiliatePolicy: "excluded",
      validationState: "approved_locked", // seeded locked (CAP-571)
      fingerprintId: `seed-fp:${product.slug}`,
      lockedAt: Date.now(),
      createdAt: Date.now(),
    });
    const productId = await ctx.db.insert("storefrontProducts", {
      storefrontId: store!._id,
      toolId: product.toolId,
      name: product.name,
      category: product.category,
      useCase: product.useCase,
      description: product.description,
      claims: "Curated example promotion — fixture data.",
      status: "approved",
      sortOrder: product.sortOrder,
      createdAt: Date.now(),
    });
    const versionId = await ctx.db.insert("storefrontProductVersions", {
      storefrontProductId: productId,
      versionNo: 1,
      packageHash: `seed-pkg:${product.slug}`,
      name: product.name,
      merchant: product.domain,
      image: "",
      description: product.description,
      claims: "Curated example promotion — fixture data.",
      disclosureClass: "affiliate",
      ctaLabel: "Buy",
      regions: [],
      category: product.category,
      storefrontLinkId: linkId,
      approvedByUserId: reserved!._id,
      approvedAt: Date.now(),
      createdAt: Date.now(),
    });
    await ctx.db.patch(productId, { currentVersionId: versionId as Id<"storefrontProductVersions"> });
    result.push(`storefrontProducts:${product.slug}: seeded`);
  }
  return result;
}

/** CAP-572 — the SubID capability dictionary (source-controlled catalog). */
export const SUB_ID_REGISTRY_ROWS = [
  { network: "impact", paramName: "subId1", valueFormat: "alphanumeric", maxLength: 64, returnedInReport: true, permitted: true, ccGenerates: false, breaksSignature: false },
  { network: "shareasale", paramName: "afftrack", valueFormat: "alphanumeric", maxLength: 64, returnedInReport: true, permitted: true, ccGenerates: false, breaksSignature: false },
  { network: "awin", paramName: "zpar0", valueFormat: "alphanumeric", maxLength: 255, returnedInReport: true, permitted: true, ccGenerates: false, breaksSignature: false },
  { network: "cj", paramName: "SID", valueFormat: "alphanumeric", maxLength: 64, returnedInReport: true, permitted: true, ccGenerates: false, breaksSignature: false },
  // CAP-261: Amazon excluded from reconcile-as-verified — no usable subid
  // return path at launch → not permitted for append (dictionary row kept
  // explicit so /go treats amazon deterministically, never invents params).
  { network: "amazon", paramName: "", valueFormat: "none", maxLength: 0, returnedInReport: false, permitted: false, ccGenerates: false, breaksSignature: false },
];

export async function seedSubIdRegistry(ctx: any): Promise<string[]> {
  const result: string[] = [];
  for (const row of SUB_ID_REGISTRY_ROWS) {
    const existing = await ctx.db
      .query("subIdRegistry")
      .withIndex("by_network", (q: any) => q.eq("network", row.network))
      .first();
    if (existing) {
      result.push(`subIdRegistry:${row.network}: skipped`);
      continue;
    }
    await ctx.db.insert("subIdRegistry", { ...row });
    result.push(`subIdRegistry:${row.network}: seeded`);
  }
  return result;
}

/** Seed product fixtures (registry-derived tools where they exist). */
const SEED_PRODUCTS = [
  {
    slug: "notion",
    name: "Notion",
    toolId: "notion",
    category: "productivity",
    useCase: "All-in-one workspace for creators",
    description: "Docs, wikis, and project management in one workspace.",
    network: "impact",
    programName: "Notion Affiliate Program",
    domain: "notion.so",
    submittedUrl: "https://www.notion.so",
    sortOrder: 1,
  },
  {
    slug: "canva",
    name: "Canva",
    toolId: "canva",
    category: "design",
    useCase: "Design anything fast",
    description: "Templates and a drag-and-drop editor for non-designers.",
    network: "impact",
    programName: "Canva Affiliates",
    domain: "canva.com",
    submittedUrl: "https://www.canva.com",
    sortOrder: 2,
  },
  {
    slug: "convertkit",
    name: "ConvertKit",
    toolId: "convertkit",
    category: "email",
    useCase: "Email marketing for creators",
    description: "Creator-focused email marketing with automations.",
    network: "shareasale",
    programName: "ConvertKit Affiliate",
    domain: "convertkit.com",
    submittedUrl: "https://convertkit.com",
    sortOrder: 3,
  },
] as const;

export type SeedProduct = (typeof SEED_PRODUCTS)[number];
