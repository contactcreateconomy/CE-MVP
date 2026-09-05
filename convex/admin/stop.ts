/**
 * admin/stop — SLICE-P3-08: STOP surface, kill-switches, signup.mode setter,
 * PostHog mirror rollback.
 *
 * CAP-396 kill.flip (failDirection honored) · CAP-397 stop.activate (owned
 * incident, never auto-resume) · CAP-398 stop.resume (recoveryCheckKey must
 * pass) · CAP-431 (the gate-fail path of 398, not a second mutation) ·
 * CAP-480 config.signupMode.set (E5 readiness gate) · CAP-460 mirror disable.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { validateAgainstRegistry, _registryRow, _configRow } from "../lib/authz";

/** CAP-396 — kill-switch flip. failDirection honored: closed=open_forbidden
 *  blocks ALL writes (including this flip back); degrade allows manual
 *  recovery only; n_a has no enforcement. */
export const killFlip = mutation({
  args: {
    key: v.string(),
    value: v.boolean(),
    reason: v.string(),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await assertAdminPermission(ctx);
    const registry = await _registryRow(ctx, args.key);
    if (!registry) throw new Error(`killFlip: unregistered key "${args.key}"`);
    if (registry.sealed) throw new Error(`killFlip: "${args.key}" is sealed`);
    const failDirection = registry.failDirection;
    if (failDirection === "open_forbidden" && args.value === false) {
      throw new Error(`killFlip: ${args.key} failDirection=open_forbidden — cannot be re-enabled`);
    }
    const live = await _configRow(ctx, args.key);
    if (!live) throw new Error(`killFlip: no systemConfig row for "${args.key}"`);
    return await writeAudited(ctx, async (actx) => {
      await actx.db.patch(live._id, { value: args.value, version: (live.version ?? 0) + 1, updatedAt: Date.now(), reason: args.reason });
      return { actorId: args.actorId, action: "kill.flip", target: `config:${args.key}`, prev: live.value, next: args.value, reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true };
    });
  },
});

/** CAP-397 — STOP activate. Creates an owned incident. Never auto-resumes. */
export const stopActivate = mutation({
  args: {
    reason: v.string(),
    expectedDurationMin: v.number(),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await assertAdminPermission(ctx);
    if (args.expectedDurationMin < 1) throw new Error("stopActivate: expectedDurationMin required");
    return await writeAudited(ctx, async (actx) => {
      // Set the stop flag
      const stopRow = await _configRow(actx, "ops.stop.active");
      if (stopRow) {
        await actx.db.patch(stopRow._id, { value: true, version: (stopRow.version ?? 0) + 1, updatedAt: Date.now(), reason: args.reason });
      } else {
        await actx.db.insert("systemConfig", { key: "ops.stop.active", value: true, valueType: "boolean", scope: "global", status: "active", version: 1, updatedAt: Date.now(), reason: args.reason });
      }
      // Create the owned incident (handoffDueAt escalates backup/Founder)
      const handoffDueAt = Date.now() + args.expectedDurationMin * 60_000;
      const incidentId = await actx.db.insert("jobRuns", {
        jobKey: "ops.stop.incident", catalogVersion: 1, runKey: `stop-${Date.now()}`,
        scheduledFor: Date.now(), state: "running", attempt: 1, maxAttempts: 1,
        idempotencyKey: `stop-${Date.now()}`, executionAuthority: "system",
        correlationId: newCorrelationId(), createdAt: Date.now(), updatedAt: Date.now(),
      });
      return { actorId: args.actorId, action: "stop.activate", target: `incident:${incidentId}`, prev: null, next: { reason: args.reason, expectedDurationMin: args.expectedDurationMin, handoffDueAt }, reasonCode: args.reason, correlationId: newCorrelationId(), reversible: false };
    });
  },
});

/** CAP-398/431 — STOP resume. recoveryCheckKey must pass (431 = gate-fail path). */
export const stopResume = mutation({
  args: {
    recoveryCheckKey: v.string(),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await assertAdminPermission(ctx);
    // CAP-431: recoveryCheckKey must pass before resume
    const checkResult = await _configRow(ctx, args.recoveryCheckKey);
    if (!checkResult || checkResult.value !== true) {
      throw new Error(`stopResume: recoveryCheckKey "${args.recoveryCheckKey}" failed — STOP resume blocked (CAP-431)`);
    }
    return await writeAudited(ctx, async (actx) => {
      const stopRow = await _configRow(actx, "ops.stop.active");
      if (stopRow) {
        await actx.db.patch(stopRow._id, { value: false, version: (stopRow.version ?? 0) + 1, updatedAt: Date.now() });
      }
      return { actorId: args.actorId, action: "stop.resume", target: "config:ops.stop.active", prev: true, next: false, reasonCode: `recoveryCheckKey=${args.recoveryCheckKey}`, correlationId: newCorrelationId(), reversible: false };
    });
  },
});

/** CAP-480 — signup.mode setter with E5 readiness gate.
 *  "setting open requires CAP-510 readiness gate to pass SYNCHRONOUSLY
 *   inside this mutation — waitlist/closed are always settable."
 *  Pre-Phase-7: no readiness machine → open rejected fail-closed. */
export const signupModeSet = mutation({
  args: {
    mode: v.union(v.literal("open"), v.literal("waitlist"), v.literal("closed")),
    actorId: v.optional(v.id("users")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminPermission(ctx);
    if (args.mode === "open") {
      // E5 fail-closed readiness gate (synchronous, in-transaction)
      const readiness = await ctx.db.query("launchReadinessResults").first();
      if (!readiness || readiness.overall !== "ready") {
        throw new Error(
          `signupModeSet: cannot set mode=open — readiness is ${readiness?.overall ?? "unevaluated"} (fail-closed per E5/DEC-M18-READINESS)`,
        );
      }
    }
    return await writeAudited(ctx, async (actx) => {
      const live = await _configRow(actx, "signup.mode");
      if (!live) throw new Error("signupModeSet: no systemConfig row for signup.mode");
      await validateAgainstRegistry("signup.mode", args.mode, { valueType: "string", enumValues: ["open", "waitlist", "closed"] });
      await actx.db.patch(live._id, { value: args.mode, version: (live.version ?? 0) + 1, updatedAt: Date.now(), reason: args.reason });
      return { actorId: args.actorId, action: "config.signupMode.set", target: "config:signup.mode", prev: live.value, next: args.mode, reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true };
    });
  },
});

/** CAP-460 — PostHog mirror disable. "rawEvents keep capturing; hide dash." */
export const mirrorDisable = mutation({
  args: { actorId: v.optional(v.id("users")), reason: v.string() },
  handler: async (ctx, args) => {
    await assertAdminPermission(ctx);
    return await writeAudited(ctx, async (actx) => {
      const live = await _configRow(actx, "analytics.posthog.mirror.enabled");
      if (live) {
        await actx.db.patch(live._id, { value: false, version: (live.version ?? 0) + 1, updatedAt: Date.now(), reason: args.reason });
      } else {
        await actx.db.insert("systemConfig", { key: "analytics.posthog.mirror.enabled", value: false, valueType: "boolean", scope: "global", status: "active", version: 1, updatedAt: Date.now(), reason: args.reason });
      }
      return { actorId: args.actorId, action: "mirror.disable", target: "config:analytics.posthog.mirror.enabled", prev: true, next: false, reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true };
    });
  },
});
