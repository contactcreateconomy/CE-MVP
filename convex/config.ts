/**
 * config — SLICE-P1-05: `config.getNamespace` + `config.casUpdate`
 * (admin-config contract §4). Validation core is the platform-wide single
 * mechanism (Wave-3 E1); the /admin/config UI, blast-radius console, and the
 * signup.mode readiness coupling are Phase 3.
 *
 * CAP-395 acceptance (schema/validator layer only here): CAS on version;
 * reason required tier2/3; blastRadius mandatory; sealed keys not editable.
 * Sealed keys are absent from the registry by construction (CAP-394) — a
 * casUpdate on any of them throws "unregistered".
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

import { SEALED_KEYS, _configRow, _registryRow, validateAgainstRegistry } from "./lib/authz";
import { writeAudited, newCorrelationId } from "./lib/audit";

export const getNamespace = query({
  args: { module: v.optional(v.string()) },
  handler: async (ctx, { module }) => {
    // CAP-394: sealed keys are ABSENT from the namespace read (registry
    // seed contains none; belt-and-braces filter too).
    const rows = await ctx.db.query("configKeyRegistry").collect();
    const out = [];
    for (const r of rows) {
      if (SEALED_KEYS.includes(r.key as any)) continue;
      if (module && r.module !== module) continue;
      const live = await _configRow(ctx, r.key);
      out.push({ ...r, liveValue: live?.value ?? null, liveVersion: live?.version ?? 0, liveStatus: live?.status ?? null });
    }
    return out;
  },
});

export const casUpdate = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    expectedVersion: v.number(),
    reason: v.optional(v.string()),
    blastRadius: v.string(),
    actorId: v.optional(v.id("users")),
    actorRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const registry = await _registryRow(ctx, args.key);
    if (!registry) {
      throw new Error(`casUpdate: unregistered key "${args.key}"${SEALED_KEYS.includes(args.key as any) ? " (sealed — not editable)" : ""}`);
    }
    if (registry.sealed) throw new Error(`casUpdate: "${args.key}" is sealed (CAP-394)`);

    // CAP-480/E5: signup.mode→open only through the readiness gate — the
    // same in-transaction rule as admin/stop.signupModeSet, so the generic
    // editor path cannot bypass it (fail-closed for opening up; waitlist/
    // closed remain always settable).
    if (args.key === "signup.mode" && args.value === "open") {
      const readiness = await ctx.db.query("launchReadinessResults").first();
      if (!readiness || readiness.overall !== "ready") {
        throw new Error(
          `casUpdate: cannot set signup.mode=open — readiness is ${readiness?.overall ?? "unevaluated"} (fail-closed per E5/DEC-M18-READINESS)`,
        );
      }
    }

    // CAP-395: reason required for tier2/3
    if ((registry.editTier === "tier2" || registry.editTier === "tier3") && !args.reason?.trim()) {
      throw new Error(`casUpdate: reason required for ${registry.editTier} keys`);
    }
    // CAP-395: blastRadius mandatory (≤140 chars, M15 §74)
    if (!args.blastRadius?.trim()) throw new Error("casUpdate: blastRadius is mandatory");
    if (args.blastRadius.length > 140) throw new Error("casUpdate: blastRadius ≤140 chars");

    const validated = validateAgainstRegistry(args.key, args.value, registry);

    const live = await _configRow(ctx, args.key);
    if (!live) throw new Error(`casUpdate: no systemConfig row for "${args.key}" (seed it first)`);
    if ((live.version ?? 0) !== args.expectedVersion) {
      throw new Error(`casUpdate: version conflict (expected ${args.expectedVersion}, current ${live.version ?? 0}) — re-read and retry`);
    }

    return await writeAudited(ctx, async (actx) => {
      await actx.db.patch(live._id, {
        value: validated,
        version: args.expectedVersion + 1,
        updatedAt: Date.now(),
        updatedByUserId: args.actorId ?? undefined,
        reason: args.reason,
      });
      return {
        actorId: args.actorId ?? undefined,
        role: args.actorRole,
        action: "config.casUpdate",
        target: `config:${args.key}`,
        prev: live.value,
        next: validated,
        reasonCode: args.reason,
        correlationId: newCorrelationId(),
        reversible: registry.reversible,
      };
    });
  },
});
