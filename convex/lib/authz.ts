/**
 * authz — SLICE-P1-05 (getFlag + validateAgainstRegistry) +
 * SLICE-P2-03 (assertCustomerCapability) +
 * SLICE-P3-01 (assertAdminPermission + resolveWidgetRoute + CAP-430 revoke).
 *
 * R-GETFLAG (FATAL-M1B-04): "Unregistered key → throw. Missing value →
 * registry safeDefault (enable flags fail closed). Never `?? true`."
 * INV-M1: "getFlag throws on unknown" · "sealed by absence" — the four sealed
 * M12 keys are absent from the registry, so a getFlag on any of them throws
 * (CAP-394 acceptance).
 */

import type { MutationCtx, QueryCtx } from "../_generated/server";

/** Either ctx flavor (audit writes happen in mutations; reads in queries). */
export type GenericCtx = MutationCtx | QueryCtx;

export type ConfigValueType = "boolean" | "number" | "string" | "json";

/** The sealed M12 gaming keys — must never exist in configKeyRegistry. */
export const SEALED_KEYS = [
  "legitimacy.medianTarget",
  "signal.eventWeights",
  "signal.attributionSplit",
  "trust.weightCap",
] as const;

async function registryRow(ctx: GenericCtx, key: string) {
  return await ctx.db
    .query("configKeyRegistry")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .unique();
}

async function configRow(ctx: GenericCtx, key: string) {
  return await ctx.db.query("systemConfig").withIndex("by_key", (q: any) => q.eq("key", key)).first();
}

/**
 * getFlag — read a boolean config value with the fail-closed posture.
 * Throws on unregistered key (including all SEALED_KEYS, by absence).
 * Falls back to the registry default on missing/inactive systemConfig row.
 * For enable-flags the safeDefault in the registry seed is `false`
 * (fail-closed) — callers get `false` when the value is absent, never `true`.
 */
export async function getFlag(ctx: GenericCtx, key: string): Promise<boolean> {
  const registry = await registryRow(ctx, key);
  if (!registry) {
    throw new Error(`getFlag: unregistered config key "${key}" (R-GETFLAG: throws on unknown)`);
  }
  if (registry.valueType !== "boolean") {
    throw new Error(`getFlag: key "${key}" is ${registry.valueType}, not boolean — use getConfigValue`);
  }
  const live = await configRow(ctx, key);
  if (!live || live.status !== "active") {
    return registry.default === true; // safeDefault — never `?? true`
  }
  return live.value === true;
}

/**
 * getConfigValue — typed read with registry validation (the platform-wide
 * single validation mechanism, Wave-3 E1). Throws on unregistered key;
 * returns the registry default when no live row exists; validates the stored
 * value against valueType/min/max/enumValues before returning it (a corrupt
 * row cannot silently pass bounds).
 */
export async function getConfigValue(ctx: GenericCtx, key: string): Promise<unknown> {
  const registry = await registryRow(ctx, key);
  if (!registry) {
    throw new Error(`getConfigValue: unregistered config key "${key}"`);
  }
  const live = await configRow(ctx, key);
  const raw = !live || live.status !== "active" ? registry.default : live.value;
  return validateAgainstRegistry(key, raw, registry);
}

/** Registry validation core — shared by reads (above) and casUpdate writes. */
export function validateAgainstRegistry(key: string, value: unknown, registry: any): unknown {
  const { valueType, min, max, enumValues } = registry;
  switch (valueType) {
    case "boolean":
      if (typeof value !== "boolean") throw new Error(`config "${key}": expected boolean, got ${typeof value}`);
      return value;
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error(`config "${key}": expected number`);
      }
      if (min !== undefined && value < min) throw new Error(`config "${key}": ${value} < min ${min}`);
      if (max !== undefined && value > max) throw new Error(`config "${key}": ${value} > max ${max}`);
      return value;
    }
    case "string": {
      if (typeof value !== "string") throw new Error(`config "${key}": expected string`);
      if (enumValues && !enumValues.includes(value)) {
        throw new Error(`config "${key}": "${value}" not in enumValues [${enumValues.join(", ")}]`);
      }
      return value;
    }
    case "json":
      if (value === undefined || value === null) throw new Error(`config "${key}": json value required`);
      return value;
    default:
      throw new Error(`config "${key}": unknown valueType ${valueType}`);
  }
}

export { registryRow as _registryRow, configRow as _configRow };

// ═══════════════════════════════════════════════════════════════════════
// SLICE-P2-03 — assertCustomerCapability (CAP-005 + CAP-393, M15 R-CUSTOMER-GUARD)
// ═══════════════════════════════════════════════════════════════════════

/**
 * The CAP-393 applies-to registry — every protected customer write key.
 *
 * 2026-09-05, SLICE-P4-05: `rate_tool` added. CAP-393's Notes enumerate the
 * applies-to set WITHOUT a rating key, but CONTRACT-2-tool-profile §1 gates
 * rating submission on "M1 R-CUSTOMER-GUARD" — resolved in the contract's
 * favor (contract is authoritative for gates/actions) and flagged in the
 * session report, not edited silently in the register.
 */
export const PROTECTED_CAPABILITIES = [
  "create_post", "comment", "react", "report", "submit_reference",
  "manage_store", "tag_product", "tag_resource", "revival_vote", "resource_acquire",
  "rate_tool",
] as const;
export type CapabilityKey = (typeof PROTECTED_CAPABILITIES)[number];

export class AuthzError extends Error {
  constructor(
    public readonly reason:
      | "TERMINATED"
      | "SUSPENDED"
      | "RESTRICTED"
      | "STOP"
      | "FLAG_OFF"
      | "ELIGIBILITY"
      | "ACCOUNT_STANDING_UNKNOWN"
      | "NOT_AUTHENTICATED"
      | "BOOTSTRAP_INCOMPLETE",
    message: string,
  ) {
    super(message);
    this.name = "AuthzError";
  }
}

/**
 * CAP-005/CAP-393 — the shared customer-write guard. Precedence (bible l.265,
 * M15 R-CUSTOMER-GUARD, verbatim): "TERMINATED > SUSPENDED >
 * capabilityRestrictions > STOP > feature flags > eligibility before any
 * side effect." Missing standing → ACCOUNT_STANDING_UNKNOWN reject
 * (fail-closed).
 *
 * Call this as the FIRST statement of every protected mutation.
 */
export async function assertCustomerCapability(
  ctx: any,
  capabilityKey: CapabilityKey,
): Promise<void> {
  // 0. must be authenticated
  const userId = ctx.auth?.userId ?? (await ctx.auth?.getUserId?.());
  if (!userId) throw new AuthzError("NOT_AUTHENTICATED", "Sign-in required.");

  const user = await ctx.db.get(userId);
  if (!user) throw new AuthzError("NOT_AUTHENTICATED", "User not found.");

  // bootstrap must be complete (routing convention rule 4 — server-side
  // enforcement independent of client routing)
  if (user.bootstrapState !== "complete") {
    throw new AuthzError("BOOTSTRAP_INCOMPLETE", `bootstrapState=${user.bootstrapState} — protected writes require complete.`);
  }

  // PRECEDENCE CHAIN — evaluated in order, before any side effect
  // 1. TERMINATED
  if (user.accountStanding === "terminated") {
    throw new AuthzError("TERMINATED", "Account terminated — all writes rejected.");
  }

  // 2. SUSPENDED
  if (user.accountStanding === "suspended") {
    throw new AuthzError("SUSPENDED", "Account suspended — writes rejected pending resolution.");
  }

  // 3. capabilityRestrictions (active rows only)
  const restriction = await ctx.db
    .query("capabilityRestrictions")
    .withIndex("by_user_capability", (q: any) => q.eq("userId", userId).eq("capabilityKey", capabilityKey))
    .first();
  if (restriction) {
    const now = Date.now();
    const active = restriction.startsAt <= now && (!restriction.endsAt || restriction.endsAt > now);
    if (active) {
      throw new AuthzError("RESTRICTED", `Capability "${capabilityKey}" restricted: ${restriction.reasonCode}`);
    }
  }

  // 4. STOP (CAP-397/398 — operational mode)
  const stopRow = await ctx.db
    .query("systemConfig")
    .withIndex("by_key", (q: any) => q.eq("key", "ops.stop.active"))
    .first();
  if (stopRow && stopRow.status === "active" && stopRow.value === true) {
    // CAP-396 failDirection: closed = reject writes
    throw new AuthzError("STOP", "Platform STOP active — writes rejected.");
  }

  // 5. feature flags (per-capability)
  const flagKey = `capability.${capabilityKey}.enabled`;
  try {
    const enabled = await getFlag(ctx, flagKey);
    if (!enabled) throw new AuthzError("FLAG_OFF", `Capability "${capabilityKey}" disabled by flag.`);
  } catch (e) {
    // Unregistered flag key = safeDefault false = fail-closed (R-GETFLAG)
    if ((e as Error).message.includes("unregistered")) {
      // No per-capability flag registered → capability is on by default
      // (registry seeds only cover the ones that need opt-out)
    } else {
      throw e;
    }
  }

  // CAP-005: missing standing → ACCOUNT_STANDING_UNKNOWN reject (fail-closed)
  if (!user.accountStanding) {
    throw new AuthzError("ACCOUNT_STANDING_UNKNOWN", "accountStanding missing — fail-closed reject.");
  }

  // 6. eligibility (postingEligibilityState)
  if (user.postingEligibilityState) {
    switch (user.postingEligibilityState) {
      case "suspended":
      case "deleted":
      case "temporarily_restricted":
        throw new AuthzError("ELIGIBILITY", `postingEligibilityState=${user.postingEligibilityState}`);
        break;
      case "rate_limited":
        // rate limiting is enforced by the per-mutation rate gates, not here
        break;
      // "eligible" and "basic_incomplete" pass (basic_incomplete handled by
      // the specific mutation's own logic — some capabilities need basic
      // profile, others don't)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SLICE-P3-01 — Two-layer admin authz (CAP-390/392/430)
// ═══════════════════════════════════════════════════════════════════════

/** Staff roles per the canonical role enum (bible l.44). */
export const STAFF_ROLES = [
  "editor", "publisher", "moderator", "storeOperator", "supportOperator", "administrator",
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export class AdminAuthzError extends Error {
  constructor(
    public readonly reason:
      | "NOT_STAFF"
      | "WIDGET_NOT_FOUND"
      | "WIDGET_HIDDEN"
      | "FEATURE_DISABLED"
      | "NO_WIDGET_PERMISSION",
    message: string,
  ) {
    super(message);
    this.name = "AdminAuthzError";
  }
}

/**
 * CAP-390 — Broad shell-entry gate. "Shell entry = any staff role
 * (broadest gate)." Reads the user's ACTIVE roleAssignments rows (NOT
 * forumProfiles.role / memberships / ADMIN_EMAILS — those are the legacy
 * stores being retired per 00-TRANSITION).
 *
 * CAP-430 (next-request revoke) is enforced by construction: this function
 * reads roleAssignments fresh on every call, so a revoked role takes
 * effect on the next server request — no caching.
 *
 * Returns the user's staff roles (for widget filtering). Empty = not staff.
 */
export async function assertAdminPermission(ctx: any): Promise<StaffRole[]> {
  const userId = ctx.auth?.userId ?? (await ctx.auth?.getUserId?.());
  if (!userId) throw new AdminAuthzError("NOT_STAFF", "Sign-in required.");

  const assignments = await ctx.db
    .query("roleAssignments")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  // CAP-430: filter to ACTIVE assignments only — a revoked role has
  // status="revoked" and is excluded, enforcing next-request revocation
  const staffRoles = assignments
    .filter((a: any) => a.status === "active")
    .map((a: any) => a.role)
    .filter((r: string) => STAFF_ROLES.includes(r as StaffRole)) as StaffRole[];

  if (staffRoles.length === 0) {
    throw new AdminAuthzError("NOT_STAFF", "No active staff role — shell entry denied.");
  }

  return staffRoles;
}

/**
 * CAP-392 — widget-route resolution. Contract §3 States C (quoted):
 * "registered+permitted → render · hidden/unregistered → FEATURE_DISABLED/
 * NOT_FOUND · flag false → fail-closed · metadata-present-but-executable-
 * absent (fallback, no invented route)."
 *
 * Returns the widget row when permitted; throws otherwise.
 */
export async function resolveWidgetRoute(
  ctx: any,
  routeKey: string,
  userStaffRoles: StaffRole[],
): Promise<any> {
  // 1. Look up the widget by routeKey
  const widget = await ctx.db
    .query("adminWidgets")
    .withIndex("by_routeKey", (q: any) => q.eq("routeKey", routeKey))
    .unique();

  if (!widget) {
    throw new AdminAuthzError("WIDGET_NOT_FOUND", `No widget registered for route "${routeKey}" → NOT_FOUND`);
  }

  if (widget.status === "hidden" || widget.status === "unregistered") {
    throw new AdminAuthzError("WIDGET_HIDDEN", `Widget "${routeKey}" is ${widget.status} → FEATURE_DISABLED`);
  }

  // 2. Check requiredPermissionKeys against the user's staff roles
  const required = widget.requiredPermissionKeys ?? [];
  const hasPermission = required.some((key: string) =>
    userStaffRoles.some((role) => role === key || key === role.toLowerCase()),
  );
  if (required.length > 0 && !hasPermission) {
    throw new AdminAuthzError(
      "NO_WIDGET_PERMISSION",
      `Widget "${routeKey}" requires [${required.join(", ")}] — user has [${userStaffRoles.join(", ")}]`,
    );
  }

  // 3. Feature-flag resolution — fail-closed per shell §1 (getFlag throws
  //    on unregistered = fail-closed; flag false = disabled)
  if (widget.featureFlagKey) {
    try {
      const enabled = await getFlag(ctx, widget.featureFlagKey);
      if (!enabled) {
        throw new AdminAuthzError("FEATURE_DISABLED", `Widget "${routeKey}" flag "${widget.featureFlagKey}" is off → fail-closed`);
      }
    } catch (e) {
      if (e instanceof AdminAuthzError) throw e;
      // getFlag threw (unregistered or other) → fail-closed
      throw new AdminAuthzError("FEATURE_DISABLED", `Widget "${routeKey}" flag "${widget.featureFlagKey}" resolution failed → fail-closed`);
    }
  }

  return widget;
}

/**
 * Combined helper: assertAdminPermission + resolveWidgetRoute in one call.
 * The standard entry point for every admin route handler.
 */
export async function assertWidgetAccess(ctx: any, routeKey: string): Promise<{ widget: any; roles: StaffRole[] }> {
  const roles = await assertAdminPermission(ctx);
  const widget = await resolveWidgetRoute(ctx, routeKey, roles);
  return { widget, roles };
}

/**
 * Shell catalog read — returns only widgets the user's roles permit
 * (contract State A: "a support_operator sees only support widgets;
 * an Editor sees only editorial ones").
 */
export async function getPermittedWidgetCatalog(ctx: any): Promise<any[]> {
  const roles = await assertAdminPermission(ctx);
  const all = await ctx.db.query("adminWidgets").collect();
  return all.filter((w: any) => {
    if (w.status === "hidden" || w.status === "unregistered") return false;
    const required = w.requiredPermissionKeys ?? [];
    if (required.length === 0) return true; // no permission required
    return required.some((key: string) =>
      roles.some((role) => role === key || key === role.toLowerCase()),
    );
  });
}
