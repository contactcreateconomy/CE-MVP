/**
 * adminWidgetsCatalog — SLICE-P3-03: source-controlled executable catalog
 * + deploy seeder (CAP-569, F-21 closure).
 *
 * "The source-controlled executable catalog is authoritative;
 *  `adminWidgets` holds DB metadata only (CAP-390/392);
 *  runs once at deploy/migration, not user-triggered."
 *
 * Seeds the three Phase-3 consoles only (per the slice scope): /admin/config,
 * /admin/roles, /admin/audit. Catalog grows per-phase as consoles land.
 */

import { internalMutation } from "../_generated/server";

/** dataSourceKey literals — derived ONLY from Phase 3's three consoles. */
const DATA_SOURCE_KEYS = [
  "config.getNamespace",    // /admin/config
  "roles.listAssignments",  // /admin/roles
  "audit.query",            // /admin/audit
] as const;

interface WidgetDef {
  widgetKey: string;
  moduleId: string;
  widgetType: string;
  title: string;
  routeKey: string;
  requiredPermissionKeys: string[];
  featureFlagKey?: string;
  status: string;
  homeEligible: boolean;
  defaultOrder: number;
  wikiSlug?: string;
  freshnessThresholdSeconds: number;
  dataSourceKey: string;
}

/** Source-controlled executable catalog — THE authoritative list. */
export const ADMIN_WIDGET_CATALOG: WidgetDef[] = [
  {
    widgetKey: "admin-config",
    moduleId: "m15",
    widgetType: "console",
    title: "Config Console",
    routeKey: "/admin/config",
    requiredPermissionKeys: ["administrator"],
    status: "active",
    homeEligible: false,
    defaultOrder: 10,
    wikiSlug: "admin-config",
    freshnessThresholdSeconds: 60,
    dataSourceKey: "config.getNamespace",
  },
  {
    widgetKey: "admin-roles",
    moduleId: "m15",
    widgetType: "console",
    title: "Roles & Ops Coverage",
    routeKey: "/admin/roles",
    requiredPermissionKeys: ["administrator", "editor"],
    status: "active",
    homeEligible: false,
    defaultOrder: 20,
    wikiSlug: "admin-roles",
    freshnessThresholdSeconds: 300,
    dataSourceKey: "roles.listAssignments",
  },
  {
    widgetKey: "admin-audit",
    moduleId: "m15",
    widgetType: "console",
    title: "Audit Log Viewer",
    routeKey: "/admin/audit",
    requiredPermissionKeys: ["administrator"],
    status: "active",
    homeEligible: false,
    defaultOrder: 30,
    wikiSlug: "admin-audit",
    freshnessThresholdSeconds: 0,
    dataSourceKey: "audit.query",
  },
];

/** CAP-569 — deploy seeder. Idempotent by widgetKey. */
export const deploySeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];
    for (const def of ADMIN_WIDGET_CATALOG) {
      const existing = await ctx.db
        .query("adminWidgets")
        .withIndex("by_widgetKey", (q: any) => q.eq("widgetKey", def.widgetKey))
        .unique();
      if (existing) {
        // Update metadata to match the source-controlled catalog (authoritative)
        await ctx.db.patch(existing._id, { ...def, updatedAt: Date.now() });
        results.push(`${def.widgetKey}: updated`);
      } else {
        await ctx.db.insert("adminWidgets", { ...def, updatedAt: Date.now() });
        results.push(`${def.widgetKey}: seeded`);
      }
    }
    return results;
  },
});
