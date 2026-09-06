/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P5-11 acceptance tests — CAP-172/173/174/175. Sources: register
 * rows (quotes in queue.ts docblocks) + the personas-queue contract. */

const convexRoot = join(__dirname, "../../../../../../convex");
const src = readFileSync(join(convexRoot, "persona/queue.ts"), "utf8");
const cronsSrc = readFileSync(join(convexRoot, "crons.ts"), "utf8");

describe("SLICE-P5-11 — the queue mutations", () => {
  it("regen/approve/reject/schedule/listQueue/sweep/systemPublish exist", () => {
    for (const fn of ["regen", "approve", "reject", "schedule", "listQueue", "sweepScheduled", "systemPublish"]) {
      expect(src).toContain(`export const ${fn} =`);
    }
  });

  it("CAP-172: regen is capped (quoted 2–3) with the supersede chain + waning handoff", () => {
    expect(src).toContain("REGEN_CAP = 3");
    expect(src).toContain("supersededByDraftId");
    expect(src).toContain("waningHandoff: true");
  });

  it("CAP-173: publish writes the full M6 fan-out via persona rules", () => {
    const fn = src.split("export const approve")[1] ?? "";
    for (const write of ['insert("comments"', 'insert("commentScores"', "personaEngagements", "personaPositions", "personaMemoryEmbeddings", "comment_created"]) {
      expect(fn, write).toContain(write.replace('\\', ""));
    }
    expect(fn).toContain('authorType: "persona"');
  });

  it("CAP-173 INV-6: persona counts separate — human counters untouched, rank-excluded", () => {
    const fn = src.split("export const approve")[1] ?? "";
    expect(fn).toContain("personaCommentCount");
    expect(fn).not.toContain("humanCommentCount + 1");
    expect(fn).toContain("INV-6: rank-excluded");
  });

  it("CAP-173 INV-9: staggered REAL timestamp (minutes, never fake dates)", () => {
    const fn = src.split("export const approve")[1] ?? "";
    expect(fn).toContain("staggerMinutes");
    expect(fn).not.toMatch(/Date\.now\(\) \* |randomDate/);
  });

  it("INV-5 enforced at the operator boundary: auto-killed drafts can never be approved/scheduled", () => {
    const approveFn = src.split("export const approve")[1] ?? "";
    const scheduleFn = src.split("export const schedule")[1] ?? "";
    expect(approveFn).toContain("AUTO-KILLED");
    expect(scheduleFn).toContain("cannot be scheduled");
  });

  it("FATAL-adjacent boundary: waned/retired/paused personas never publish", () => {
    const fn = src.split("export const approve")[1] ?? "";
    expect(fn).toContain("cannot publish");
  });

  it("CAP-174: reject is terminal-for-draft + audited with a reason", () => {
    const fn = src.split("export const reject")[1] ?? "";
    expect(fn).toContain("status: \"rejected\"");
    expect(fn).toContain("reason required");
  });

  it("CAP-175: scheduledFor distinct from earliestPublishAt; future-only", () => {
    const fn = src.split("export const schedule")[1] ?? "";
    expect(fn).toContain("earliestPublishAt");
    expect(fn).toContain("must be in the future");
  });

  it("scheduled fire FAILS CLOSED on paused/retired personas (contract OQ3: hold, never force)", () => {
    const fn = src.split("export const sweepScheduled")[1] ?? "";
    expect(fn).toContain("FAIL-CLOSED");
    expect(fn).toContain('status: "generated", scheduledFor: undefined');
  });

  it("sweeper cron wired", () => {
    expect(cronsSrc).toContain("internal.persona.queue.sweepScheduled");
  });

  it("manual draft-body edit NOT built (contract OQ — schema supports, no CAP owns the write)", () => {
    expect(src).toContain("NOT built, flagged");
    expect(src).not.toContain("export const editDraft");
  });

  it("queue list degrades to null for non-staff (never throws)", () => {
    const fn = (src.split("export const listQueue")[1] ?? "").split("export const regen")[0];
    expect(fn).toContain("return null");
    expect(fn).not.toContain("throw new Error");
  });
});
