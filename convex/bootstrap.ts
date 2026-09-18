/**
 * bootstrap — SLICE-P2-02: finalizeBootstrap + /welcome machinery.
 *
 * CAP-003: "Timezone write-once; verifies member/private; skip chooser →
 * stay pending." DECISIONS-LOCKED #2: Skip path REMOVED — timezone
 * auto-detected from browser/IP at signup (silent), UTC fallback,
 * editable later in Settings. pending_context is no longer reachable via
 * skip (the E4 trap is closed).
 *
 * CAP-004: "finalizeBootstrap completes → rawEvents signup event;
 * same-mutation" — the captureEvent call inside this mutation means a
 * rawEvents insert failure rolls back the whole finalize (CAP-436).
 */

import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { captureEvent } from "./lib/events";
import { ensureDistributionTx } from "./distributions";
import { STAFF_ROLES, type StaffRole } from "./lib/authz";

// CAP-004: eventName "signup" per the welcome contract §5 — this seed row
// satisfies CAP-437's catalog gate so captureEvent doesn't reject.
// Full M16 property schema is Phase 7; this is the minimal P2-02 row.
export const SIGNUP_EVENT_CATALOG_ROW = {
  eventName: "signup",
  schemaVersion: 1,
  eventClass: "outcome" as const,
  ownerModule: "m1",
  description: "Member completes bootstrap (finalizeBootstrap transaction)",
  captureMode: "same_mutation",
  piiClass: "none",
  consentGate: "strictly_necessary",
  signalEligible: false,
  s18Eligible: false,
  excludeStaff: true,
  excludePersonas: true,
  idempotencyScope: "user_once",
  retentionClass: "standard",
  posthogMirror: false, // FATAL-M1C-01: no vendor call pre-CMP
  status: "active",
  effectiveFrom: Date.now(),
  owner: "m1",
};

/**
 * Shared core (function-organization rule: thin wrappers, logic in plain
 * functions) — called by both the internal mutation (auth-callback future
 * use) and the public `finalizeWelcome` wrapper the `/welcome` screen
 * actually invokes today.
 */
export async function finalizeBootstrapTx(
  ctx: MutationCtx,
  { userId, timezone, anonymousSessionId }: { userId: Id<"users">; timezone: string; anonymousSessionId?: string },
): Promise<{ userId: Id<"users">; timezone: string }> {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found.");

  // CAP-003: verifies member/private — must have an *active member* row.
  // Do not use `.first()` on `by_user`: founder/staff accounts have several
  // roleAssignments (administrator first after ensureFounderPrivileges), so
  // the oldest/first row is often not `member` even when a member row exists.
  const memberRole = await ctx.db
    .query("roleAssignments")
    .withIndex("by_user_role_status", (q) =>
      q.eq("userId", userId).eq("role", "member").eq("status", "active"),
    )
    .unique();
  if (!memberRole) {
    // Existing founder/staff users (Google sign-in after CLI grantFounder)
    // may have staff roles only and still be pending_context. Give them the
    // same default member row new signups get, then continue finalize.
    const assignments = await ctx.db
      .query("roleAssignments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const isStaff =
      user.isStaff === true ||
      assignments.some(
        (a) => a.status === "active" && STAFF_ROLES.includes(a.role as StaffRole),
      );
    if (!isStaff) {
      throw new Error("Guard failure: active member role required before finalize.");
    }
    await ctx.db.insert("roleAssignments", {
      userId,
      role: "member",
      scopeType: "global",
      status: "active",
      grantedAt: Date.now(),
    });
  }

  // CAP-003: privateUserData must exist (from CAP-002). Founder/staff
  // accounts created outside admission (CLI grantFounder, pre-canonical
  // OAuth) often never got the empty row — insert the same CAP-002 shape
  // instead of trapping them in pending_context.
  const priv = await ctx.db
    .query("privateUserData")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (!priv) {
    await ctx.db.insert("privateUserData", { userId });
  }

  // CAP-003: write-once — bootstrapState must be pending_context
  if (user.bootstrapState !== "pending_context") {
    throw new Error(`Write-once conflict: bootstrapState is ${user.bootstrapState}, not pending_context.`);
  }

  // Timezone validation: must be a valid IANA zone (Intl check)
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    throw new Error(`Invalid timezone: "${timezone}" is not a valid IANA zone.`);
  }

  // identityJoins: anonymousSessionId → userId (bible l.274)
  if (anonymousSessionId) {
    const existing = await ctx.db
      .query("identityJoins")
      .withIndex("by_anonymousSessionId", (q: any) => q.eq("anonymousSessionId", anonymousSessionId))
      .first();
    if (!existing) {
      await ctx.db.insert("identityJoins", {
        anonymousSessionId,
        userId,
        joinedAt: Date.now(),
      });
    }
  }

  // Flip to complete + write timezone
  await ctx.db.patch(userId, {
    bootstrapState: "complete",
    timezone,
    onboardingState: "basic_profile_complete",
  });

  // CAP-004: signup event — same-mutation (CAP-436: insert failure rolls
  // back the whole finalize)
  await captureEvent(ctx, {
    eventType: "signup",
    schemaVersion: 1,
    eventClass: "outcome",
    userId,
    anonymousSessionId,
    targetType: "session",
    targetId: userId,
    source: "direct",
    isStaff: false,
    isPersona: false,
    isCountableAtWrite: true,
    analyticsSubjectId: user.analyticsSubjectId ?? undefined,
  });

  // CAP-565 (SLICE-P6-12): ensure the 1:1 Distribution exists before the
  // member could reach /u/[handle] — follow-on (quoted: "NOT the same
  // atomic transaction"), invoked directly for the same-tx guarantees.
  await ensureDistributionTx(ctx, userId);

  return { userId, timezone };
}

/** Auth-callback-facing internal wrapper (kept for future System-actor use). */
export const finalizeBootstrap = internalMutation({
  args: {
    userId: v.id("users"),
    timezone: v.string(), // IANA
    anonymousSessionId: v.optional(v.string()),
  },
  returns: v.object({ userId: v.id("users"), timezone: v.string() }),
  handler: async (ctx, args) => finalizeBootstrapTx(ctx, args),
});

/**
 * Route: /welcome — SLICE-P2-02. The `/welcome` screen's own submit action
 * (CONTRACT-1-welcome §4.1 "finalizeBootstrap"). Public, auth-gated by
 * `getAuthUserId` (the screen has no other way to name "the current
 * pending_context user" — CAP-003's Reads list assumes an authenticated
 * caller).
 */
export const finalizeWelcome = mutation({
  args: {
    timezone: v.string(),
    anonymousSessionId: v.optional(v.string()),
  },
  returns: v.object({ userId: v.id("users"), timezone: v.string() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("finalizeWelcome: authentication required");
    return await finalizeBootstrapTx(ctx, { userId, ...args });
  },
});

/**
 * Client-facing state query for the Platform-Wide Routing Convention
 * (CONTRACT-1-app-shell §1, rules 2/3) — the smallest read that lets a
 * global route guard tell `pending_context` apart from `complete` without
 * pulling the whole profile.
 */
export const getMyBootstrapState = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      bootstrapState: v.union(v.literal("pending_context"), v.literal("complete")),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return { bootstrapState: user.bootstrapState };
  },
});
