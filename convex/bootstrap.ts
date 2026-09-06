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

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { captureEvent } from "./lib/events";
import { ensureDistributionTx } from "./distributions";

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

export const finalizeBootstrap = internalMutation({
  args: {
    userId: v.id("users"),
    timezone: v.string(), // IANA
    anonymousSessionId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, timezone, anonymousSessionId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found.");

    // CAP-003: verifies member/private — must have roleAssignments member row
    const role = await ctx.db
      .query("roleAssignments")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();
    if (!role || role.role !== "member" || role.status !== "active") {
      throw new Error("Guard failure: active member role required before finalize.");
    }

    // CAP-003: privateUserData must exist (from CAP-002 txn)
    const priv = await ctx.db
      .query("privateUserData")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();
    if (!priv) throw new Error("Guard failure: privateUserData row missing.");

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
  },
});
