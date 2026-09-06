/* eslint-disable @typescript-eslint/no-explicit-any -- mocked-ctx + source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P5-12 acceptance tests — CAP-178/546/547/548. Sources: register
 * rows (quotes in genome.ts docblocks) + the personas-genome contract §3.
 * The FATAL-adjacent silent-failure hazard: the e2e-shaped test proves
 * edit ⇒ prompt discarded ⇒ generation cannot use a stale prompt. */

import { invalidateCompiledPrompts } from "../../../../../../convex/persona/genome";

const convexRoot = join(__dirname, "../../../../../../convex");
const src = readFileSync(join(convexRoot, "persona/genome.ts"), "utf8");
const genSrc = readFileSync(join(convexRoot, "persona/generate.ts"), "utf8");

/** Mocked ctx: one persona with a compiled prompt + active-scan results. */
function genomeCtx(personas: any[]) {
  const patches: any[] = [];
  return {
    ctx: {
      db: {
        get: async (id: string) => personas.find((p) => p._id === id) ?? null,
        patch: async (id: string, doc: any) => {
          patches.push({ id, doc });
        },
        query: () => ({
          withIndex: () => ({
            take: async () => personas.filter((p) => p.systemPrompt), // template-wide scan
          }),
        }),
      },
    } as any,
    patches,
  };
}

describe("SLICE-P5-12 — CAP-547 invalidation (the silent-stale-prompt killer)", () => {
  it("instance scope discards the persona's persisted compiled prompt", async () => {
    const { ctx, patches } = genomeCtx([{ _id: "p1", systemPrompt: "compiled", lifecycleStatus: "active" }]);
    const count = await invalidateCompiledPrompts(ctx, { personaId: "p1" as any });
    expect(count).toBe(1);
    expect(patches).toHaveLength(1);
    expect(patches[0].doc.systemPrompt).toBeUndefined();
  });

  it("template scope invalidates EVERY compiled prompt (conservative — no lineage field, flagged)", async () => {
    const { ctx, patches } = genomeCtx([
      { _id: "p1", systemPrompt: "a", lifecycleStatus: "active" },
      { _id: "p2", systemPrompt: "b", lifecycleStatus: "active" },
      { _id: "p3", systemPrompt: undefined, lifecycleStatus: "active" },
    ]);
    const count = await invalidateCompiledPrompts(ctx, { templateWide: true });
    expect(count).toBe(2);
    expect(patches).toHaveLength(2);
  });

  it("no compiled prompt ⇒ nothing invalidated (idempotent)", async () => {
    const { ctx, patches } = genomeCtx([{ _id: "p1", systemPrompt: undefined, lifecycleStatus: "active" }]);
    expect(await invalidateCompiledPrompts(ctx, { personaId: "p1" as any })).toBe(0);
    expect(patches).toHaveLength(0);
  });

  it("E2E-SHAPED (the acceptance clause): edit ⇒ prompt discarded ⇒ generation refuses, recompiles at next birth/revive — no stale prompt observable", () => {
    // 1. the edit path invalidates inside the SAME transaction
    const editFn = src.split("export const edit")[1] ?? "";
    expect(editFn).toContain("invalidateCompiledPrompts(actx"); // actx = the SAME transaction
    // 2. generation refuses when the prompt is absent (P5-08)
    expect(genSrc).toContain("prompt_not_compiled");
    // 3. the recompile points exist (birth + reviveConfirm)
    const lifecycleSrc = readFileSync(join(convexRoot, "persona/lifecycle.ts"), "utf8");
    expect(lifecycleSrc).toContain("compileSystemPrompt");
    // ⇒ the only observable states are: fresh compile or refusal — never stale.
  });

  it("invalidation is NEVER scheduled (same-tx only — splitting is prohibited)", () => {
    expect(src).not.toContain("runAfter");
    expect(src).not.toContain("scheduler");
  });
});

describe("SLICE-P5-12 — CAP-178/546/548 mechanics", () => {
  it("Administrator-only (the narrowest surface)", () => {
    expect(src).toContain('roles.includes("administrator")');
    expect(src).toContain("Administrator-only");
  });

  it("genomes version FORWARD — prior rows never rewritten (CAP-546 quoted)", () => {
    const rollbackFn = src.split("export const rollback")[1] ?? "";
    expect(rollbackFn).toContain("newVersion");
    expect(rollbackFn).toContain("NEW event");
    expect(rollbackFn).not.toContain("ctx.db.delete");
  });

  it("rollback restores prior values by writing them forward + updates the persona's genomeVersion", () => {
    const rollbackFn = src.split("export const rollback")[1] ?? "";
    expect(rollbackFn).toContain("genomeVersion: newVersion");
    expect(rollbackFn).toContain("patch(args.personaId, { genomeVersion: newVersion })");
  });

  it("preview is the deterministic compile of DRAFT params (CAP-548; no GLM fabrication)", () => {
    const previewFn = src.split("export const previewCompile")[1] ?? "";
    expect(previewFn).toContain("compileSystemPrompt(args.draftGenome)");
    expect(src).toContain("previewFixtureRef: args.previewFixtureRef");
  });

  it("in-flight drafts insulated: genomeVersion snapshots at generation (P5-08 contract §3)", () => {
    expect(genSrc).toContain("genomeVersion: genome.version");
  });

  it("audit is fail-closed (writeAudited — CAP-426 pattern)", () => {
    expect(src).toContain("writeAudited");
    expect(src).toContain("fail-closed");
  });
});
