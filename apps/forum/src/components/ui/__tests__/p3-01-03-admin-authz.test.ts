import { describe, it, expect } from "vitest";

/* SLICE-P3-01/02/03 acceptance tests — two-layer admin authz, widget-route
 * resolution, next-request revoke, widget catalog seeder.
 * Sources: CONTRACT-7-admin-shell §1-3; CAP-390/392/430/569 Notes;
 * bible l.255 (adminWidgets). */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";
import {
  assertAdminPermission,
  resolveWidgetRoute,
  assertWidgetAccess,
  getPermittedWidgetCatalog,
  AdminAuthzError,
  STAFF_ROLES,
} from "../../../../../../convex/lib/authz";
import { ADMIN_WIDGET_CATALOG } from "../../../../../../convex/admin/widgetsCatalog";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);

/* ── fake ctx ── */
function adminCtx(overrides: {
  roleAssignments?: any[];
  widgets?: any[];
  configRows?: any[];
  registryRows?: any[];
}) {
  const ra = overrides.roleAssignments ?? [];
  const widgets = overrides.widgets ?? [];
  const configRows = overrides.configRows ?? [];
  const registryRows = overrides.registryRows ?? [];
  function makeQuery(table: string) {
    return {
      withIndex: (_n: string, fn: (q: any) => any) => {
        let matchKey: string | undefined;
        const q = { eq: (_f: string, v: any) => { matchKey = v; return q; } };
        fn(q);
        const resolve = () => {
          if (table === "roleAssignments") return ra.find((r) => r.userId === matchKey) ?? ra[0] ?? null;
          if (table === "adminWidgets") return widgets.find((w) => w.routeKey === matchKey) ?? null;
          if (table === "systemConfig") return configRows.find((c) => c.key === matchKey) ?? null;
          if (table === "configKeyRegistry") return registryRows.find((c) => c.key === matchKey) ?? null;
          return null;
        };
        return { first: async () => resolve(), unique: async () => resolve(), collect: async () => {
          if (table === "roleAssignments") return ra;
          if (table === "adminWidgets") return widgets;
          return [];
        } };
      },
      collect: async () => {
        if (table === "roleAssignments") return ra;
        if (table === "adminWidgets") return widgets;
        return [];
      },
    };
  }
  return {
    auth: { userId: "u-admin" },
    db: { get: async (id: string) => null, query: makeQuery },
  };
}

const editorRole = { userId: "u-admin", role: "editor", status: "active" };
const adminRole = { userId: "u-admin", role: "administrator", status: "active" };
const revokedAdmin = { userId: "u-admin", role: "administrator", status: "revoked" };
const memberRole = { userId: "u-admin", role: "member", status: "active" };

const configWidget = {
  widgetKey: "admin-config", routeKey: "/admin/config", status: "active",
  requiredPermissionKeys: ["administrator"], featureFlagKey: undefined,
};
const rolesWidget = {
  widgetKey: "admin-roles", routeKey: "/admin/roles", status: "active",
  requiredPermissionKeys: ["administrator", "editor"], featureFlagKey: undefined,
};

describe("SLICE-P3-01 — two-layer admin authz", () => {
  it("STAFF_ROLES: 6 roles, no 'member'", () => {
    expect(STAFF_ROLES).toHaveLength(6);
    expect(STAFF_ROLES).not.toContain("member");
  });

  it("CAP-390 broad gate: any staff role enters the shell", async () => {
    const roles = await assertAdminPermission(adminCtx({ roleAssignments: [editorRole] }));
    expect(roles).toContain("editor");
    const roles2 = await assertAdminPermission(adminCtx({ roleAssignments: [adminRole] }));
    expect(roles2).toContain("administrator");
  });

  it("CAP-390: member role is NOT staff — shell entry denied", async () => {
    await expect(
      assertAdminPermission(adminCtx({ roleAssignments: [memberRole] })),
    ).rejects.toThrow("No active staff role");
  });

  it("CAP-390: no roleAssignments = NOT_STAFF", async () => {
    await expect(
      assertAdminPermission(adminCtx({ roleAssignments: [] })),
    ).rejects.toThrow("No active staff role");
  });

  it("CAP-430 next-request revoke: revoked role excluded (reads fresh every call)", async () => {
    await expect(
      assertAdminPermission(adminCtx({ roleAssignments: [revokedAdmin] })),
    ).rejects.toThrow("No active staff role");
  });

  it("CAP-392: registered + permitted → widget returned", async () => {
    const widget = await resolveWidgetRoute(
      adminCtx({ widgets: [configWidget] }),
      "/admin/config",
      ["administrator"],
    );
    expect(widget.widgetKey).toBe("admin-config");
  });

  it("CAP-392: unregistered route → WIDGET_NOT_FOUND", async () => {
    await expect(
      resolveWidgetRoute(adminCtx({ widgets: [] }), "/admin/nonexistent", ["administrator"]),
    ).rejects.toThrow(AdminAuthzError);
  });

  it("CAP-392: hidden widget → WIDGET_HIDDEN / FEATURE_DISABLED", async () => {
    await expect(
      resolveWidgetRoute(
        adminCtx({ widgets: [{ ...configWidget, status: "hidden" }] }),
        "/admin/config",
        ["administrator"],
      ),
    ).rejects.toThrow(AdminAuthzError);
  });

  it("CAP-392: insufficient role → NO_WIDGET_PERMISSION", async () => {
    await expect(
      resolveWidgetRoute(
        adminCtx({ widgets: [configWidget] }),
        "/admin/config",
        ["editor"], // config requires administrator
      ),
    ).rejects.toThrow("requires");
  });

  it("CAP-392: feature-flag false → FEATURE_DISABLED (fail-closed)", async () => {
    await expect(
      resolveWidgetRoute(
        adminCtx({
          widgets: [{ ...configWidget, featureFlagKey: "admin.config.enabled" }],
          configRows: [], // no live config → getFlag falls to registry default
          registryRows: [{ key: "admin.config.enabled", valueType: "boolean", default: false, sealed: false }],
        }),
        "/admin/config",
        ["administrator"],
      ),
    ).rejects.toThrow(AdminAuthzError);
  });

  it("State A: support_operator sees only support widgets in catalog", async () => {
    const supportWidgets = [
      { widgetKey: "support", routeKey: "/admin/support", status: "active", requiredPermissionKeys: ["supportOperator", "administrator"] },
      { ...configWidget },
    ];
    const visible = await getPermittedWidgetCatalog(
      adminCtx({
        roleAssignments: [{ userId: "u-admin", role: "supportOperator", status: "active" }],
        widgets: supportWidgets,
      }),
    );
    expect(visible).toHaveLength(1);
    expect(visible[0].widgetKey).toBe("support");
  });

  it("State A: editor sees editorial widgets but not admin-only", async () => {
    const visible = await getPermittedWidgetCatalog(
      adminCtx({
        roleAssignments: [editorRole],
        widgets: [configWidget, rolesWidget],
      }),
    );
    // config requires administrator only — editor excluded
    // roles requires administrator OR editor — editor included
    expect(visible).toHaveLength(1);
    expect(visible[0].widgetKey).toBe("admin-roles");
  });
});

describe("SLICE-P3-02 — admin shell chrome", () => {
  it("adminWidgets schema: bible l.255 (14 fields + 3 indexes)", () => {
    const t = schema.tables.adminWidgets;
    for (const f of [
      "widgetKey", "moduleId", "widgetType", "title", "routeKey",
      "requiredPermissionKeys", "featureFlagKey", "status", "homeEligible",
      "defaultOrder", "wikiSlug", "freshnessThresholdSeconds", "dataSourceKey", "updatedAt",
    ]) {
      expect(hasField(t, f), `adminWidgets.${f}`).toBe(true);
    }
    const names = (t.indexes ?? []).map((i: any) => i.indexDescriptor);
    expect(names).toEqual(expect.arrayContaining(["by_routeKey", "by_widgetKey", "by_status_defaultOrder"]));
  });
});

describe("SLICE-P3-03 — adminWidgets catalog + seeder", () => {
  it("source-controlled catalog: 3 Phase-3 consoles with correct permission keys", () => {
    expect(ADMIN_WIDGET_CATALOG).toHaveLength(3);
    const config = ADMIN_WIDGET_CATALOG.find((w) => w.routeKey === "/admin/config");
    expect(config?.requiredPermissionKeys).toEqual(["administrator"]);
    const roles = ADMIN_WIDGET_CATALOG.find((w) => w.routeKey === "/admin/roles");
    expect(roles?.requiredPermissionKeys).toEqual(["administrator", "editor"]);
    const audit = ADMIN_WIDGET_CATALOG.find((w) => w.routeKey === "/admin/audit");
    expect(audit?.requiredPermissionKeys).toEqual(["administrator"]);
  });

  it("genome back-door NEVER in the catalog (shell §1: must not appear as a palette result)", () => {
    const genomeRoute = ADMIN_WIDGET_CATALOG.find((w) => w.routeKey.includes("genome"));
    expect(genomeRoute).toBeUndefined();
  });

  it("every widget has a dataSourceKey (enum→code, no platform-wide enum invented)", () => {
    for (const w of ADMIN_WIDGET_CATALOG) {
      expect(w.dataSourceKey).toBeTruthy();
      expect(w.dataSourceKey).toMatch(/^[a-z]+\.[a-zA-Z]+$/); // module.function shape
    }
  });
});
