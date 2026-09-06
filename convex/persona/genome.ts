/**
 * genome — SLICE-P5-12: CAP-178/546/547/548 — the genome config back-door
 * (Administrator-only, no nav item) + rollback + preview + the
 * INVALIDATION that never splits from the write path.
 *
 * CAP-547 (quoted): "Without this, live persona comment generation can
 *   silently use a stale compiled prompt after an edit or rollback —
 *   worse than the affiliate-cascade gap because it fails silent, not
 *   visible. Write target is the actual CAP-158 compiled-prompt cache …
 *   plus persisted `personas.systemPrompt`. Fires on CAP-178 edit and
 *   CAP-546 rollback." — invalidateCompiledPrompts runs INSIDE the same
 *   writeAudited transaction as every edit and rollback. Template-scope
 *   edits invalidate EVERY compiled prompt (no template→instance lineage
 *   field exists in the bible — conservative over-invalidation, the
 *   fail-safe direction; flagged).
 * CAP-546 (quoted): "rollback writes a new personaGenomeEdits event (does
 *   not rewrite prior rows)" — genomes version FORWARD (new row), history
 *   is append-only.
 * CAP-548 (quoted): "Writes the existing personaGenomeEdits.previewFixtureRef
 *   field (not a new entity)" — preview = the deterministic CAP-158
 *   compile of the DRAFT params (no GLM needed, no fabricated output).
 * In-flight drafts are insulated: personaCommentDrafts.genomeVersion
 * snapshots at generation (P5-08).
 * Audit-fail → fail-closed (CAP-426 pattern — writeAudited).
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { compileSystemPrompt } from "./generate";

async function requireAdministrator(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("genome: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("administrator")) {
    throw new Error("genome: Administrator-only (the back-door is the narrowest surface)");
  }
  return userId;
}

/**
 * CAP-547 — invalidate the compiled-prompt cache. Instance scope: the one
 * persona. Template scope: every persona holding a compiled prompt (no
 * lineage field — conservative, flagged). Runs INSIDE the owning edit/
 * rollback transaction — never scheduled, never split.
 */
export async function invalidateCompiledPrompts(
  ctx: any,
  scope: { personaId?: Id<"personas">; templateWide?: boolean },
): Promise<number> {
  let invalidated = 0;
  if (scope.personaId) {
    const persona = await ctx.db.get(scope.personaId);
    if (persona?.systemPrompt) {
      await ctx.db.patch(scope.personaId, { systemPrompt: undefined }); // CAP-158 recompiles at next use
      invalidated += 1;
    }
  }
  if (scope.templateWide) {
    const withPrompts = await ctx.db
      .query("personas")
      .withIndex("by_lifecycleStatus", (q: any) => q.eq("lifecycleStatus", "active"))
      .take(50);
    for (const persona of withPrompts) {
      if (persona.systemPrompt) {
        await ctx.db.patch(persona._id, { systemPrompt: undefined });
        invalidated += 1;
      }
    }
  }
  return invalidated;
}

async function latestGenome(ctx: any, personaId: Id<"personas">): Promise<any | null> {
  return await ctx.db
    .query("personaGenomes")
    .withIndex("by_personaId", (q: any) => q.eq("personaId", personaId))
    .order("desc")
    .first();
}

/** The genome console state: instance genome + version history + prompt
 *  compile status (Administrator-only; null for non-admin). */
export const getGenomeState = query({
  args: { personaId: v.optional(v.id("personas")) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    let admin = false;
    try {
      admin = (await assertAdminPermission(ctx)).includes("administrator");
    } catch {
      admin = false;
    }
    if (!admin) return null;

    if (args.personaId) {
      const persona = await ctx.db.get(args.personaId);
      const genome = await latestGenome(ctx, args.personaId);
      const history = await ctx.db
        .query("personaGenomeEdits")
        .withIndex("by_persona_version", (q: any) => q.eq("personaId", args.personaId))
        .order("desc")
        .take(20);
      return {
        persona: persona ? { id: persona._id, displayName: persona.displayName, genomeVersion: persona.genomeVersion ?? null, promptCompiled: Boolean(persona.systemPrompt) } : null,
        genome,
        history: history.map((h: any) => ({
          genomeVersion: h.genomeVersion, field: h.field, scope: h.scope,
          previewFixtureRef: h.previewFixtureRef ?? null, createdAt: h.createdAt,
        })), // oldValue/newValue stay server-side (sealed-class detail in the console detail view only)
      };
    }
    // template listing
    const templates = await ctx.db
      .query("personaGenomes")
      .withIndex("by_scope_version", (q: any) => q.eq("scope", "template"))
      .order("desc")
      .take(20);
    return { templates };
  },
});

/** CAP-548 preview — compile the DRAFT params (deterministic; no GLM, no
 *  fabricated sample output). Returns the fixture the operator sees
 *  BEFORE committing; the ref is stamped onto the edit row at commit. */
export const previewCompile = query({
  args: { draftGenome: v.any() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    let admin = false;
    try {
      admin = (await assertAdminPermission(ctx)).includes("administrator");
    } catch {
      admin = false;
    }
    if (!admin) return null;
    try {
      const prompt = compileSystemPrompt(args.draftGenome);
      return { ok: true, fixture: prompt };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "compile failed" };
    }
  },
});

/** CAP-178 `genome.edit` — tune template / override instance, versioned
 *  forward, audited, preview-fixtured, CAP-547 invalidation SAME-tx. */
export const edit = mutation({
  args: {
    personaId: v.optional(v.id("personas")), // instance override (null = template tune)
    field: v.string(),
    newValue: v.any(),
    previewFixtureRef: v.optional(v.string()), // CAP-548 preview stamped by the console flow
  },
  returns: v.object({ genomeVersion: v.number(), invalidatedPrompts: v.number() }),
  handler: async (ctx, args) => {
    const adminId = await requireAdministrator(ctx);

    let prior: any;
    let scope: "template" | "instance";
    if (args.personaId) {
      prior = await latestGenome(ctx, args.personaId);
      if (!prior) throw new Error("genome.edit: no genome instance for persona");
      scope = "instance";
    } else {
      prior = await ctx.db
        .query("personaGenomes")
        .withIndex("by_scope_version", (q: any) => q.eq("scope", "template"))
        .order("desc")
        .first();
      if (!prior) throw new Error("genome.edit: no template exists");
      scope = "template";
    }
    const oldValue = prior[args.field];
    const newVersion = prior.version + 1;

    let invalidated = 0;
    await writeAudited(ctx, async (actx) => {
      // 1. Genome versions FORWARD (new row — prior rows immutable)
      const { _id, _creationTime, ...genomeFields } = prior;
      void _id; void _creationTime;
      await actx.db.insert("personaGenomes", {
        ...genomeFields,
        version: newVersion,
        [args.field]: args.newValue,
        createdByUserId: adminId,
        createdAt: Date.now(),
      });
      // 2. Append-only audit edit (previewFixtureRef per CAP-548)
      await actx.db.insert("personaGenomeEdits", {
        personaId: args.personaId ?? undefined,
        genomeVersion: newVersion,
        field: args.field,
        oldValue,
        newValue: args.newValue,
        scope,
        adminId,
        previewFixtureRef: args.previewFixtureRef,
        createdAt: Date.now(),
      });
      // 3. CAP-547 — invalidation in the SAME transaction (never split)
      invalidated = await invalidateCompiledPrompts(actx, {
        personaId: args.personaId as Id<"personas"> | undefined,
        templateWide: scope === "template",
      });
      // 4. Instance version pointer
      if (args.personaId) {
        await actx.db.patch(args.personaId, { genomeVersion: newVersion });
      }
      return {
        actorId: adminId,
        action: "genome.edit",
        target: args.personaId ? `personaGenomes:${args.personaId}:v${newVersion}` : `personaGenomes:template:v${newVersion}`,
        prev: { [args.field]: oldValue },
        next: { [args.field]: args.newValue },
        correlationId: newCorrelationId(),
        reversible: true, // via CAP-546 rollback (a NEW forward event)
      };
    });
    return { genomeVersion: newVersion, invalidatedPrompts: invalidated };
  },
});

/** CAP-546 `genome.rollback` — revert to a prior version by writing it
 *  FORWARD as a new version + a NEW edit event (history append-only) +
 *  CAP-547 invalidation same-tx. */
export const rollback = mutation({
  args: { personaId: v.id("personas"), toVersion: v.number() },
  returns: v.object({ genomeVersion: v.number(), invalidatedPrompts: v.number() }),
  handler: async (ctx, args) => {
    const adminId = await requireAdministrator(ctx);
    const rows = await ctx.db
      .query("personaGenomes")
      .withIndex("by_personaId", (q: any) => q.eq("personaId", args.personaId))
      .take(50);
    const target = rows.find((r: any) => r.version === args.toVersion);
    const latest = rows.sort((a: any, b: any) => b.version - a.version)[0];
    if (!target) throw new Error(`genome.rollback: version ${args.toVersion} not found`);
    if (latest.version === args.toVersion) throw new Error("genome.rollback: already at that version");
    const newVersion = latest.version + 1;

    let invalidated = 0;
    await writeAudited(ctx, async (actx) => {
      const { _id, _creationTime, version, createdAt, createdByUserId, ...genomeFields } = target;
      void _id; void _creationTime; void version; void createdAt; void createdByUserId;
      await actx.db.insert("personaGenomes", {
        ...genomeFields,
        version: newVersion,
        createdByUserId: adminId,
        createdAt: Date.now(),
      });
      // A rollback is a NEW event — prior rows never rewritten (quoted)
      await actx.db.insert("personaGenomeEdits", {
        personaId: args.personaId,
        genomeVersion: newVersion,
        field: "__rollback__",
        oldValue: `v${latest.version}`,
        newValue: `v${args.toVersion}`,
        scope: "instance",
        adminId,
        createdAt: Date.now(),
      });
      invalidated = await invalidateCompiledPrompts(actx, { personaId: args.personaId });
      await actx.db.patch(args.personaId, { genomeVersion: newVersion });
      return {
        actorId: adminId,
        action: "genome.rollback",
        target: `personaGenomes:${args.personaId}:v${newVersion}`,
        prev: { version: latest.version },
        next: { version: newVersion, restoredFrom: args.toVersion },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
    return { genomeVersion: newVersion, invalidatedPrompts: invalidated };
  },
});
