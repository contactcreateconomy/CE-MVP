/**
 * reliability — SLICE-P7O-04/05: CAP-499/501/503 (+ CAP-500 redrive).
 *
 * CAP-499 (quoted): "Never silent drop" — exhausted retries insert
 *   jobDeadLetters.
 * CAP-501 (quoted): "Liveness not lastStatus; if now > lastSuccessAt +
 *   interval×1.5 → stale; ×3 → dead + alert; never ran → never_ran."
 *   The 7.5m system threshold is NOT the 15m UI TTL (contract §3 E —
 *   never collapsed).
 * CAP-503 (quoted): "M15 shows '—'" — heartbeat >15m → "—", never 0.
 * CAP-500 redrive (quoted): revalidates current actor authz + STOP +
 *   target state; stamps redrivenAt/redrivenByUserId; CAP-019 60/1m.
 *   **F-22 fence (fail-closed):** retryClass=manual_only OR
 *   jobRunState=manual_review → REJECT (no reset, no silent retry, no
 *   approve-control).
 * DECISIONS-LOCKED #5: manual_review rows get Approve&Retry + Cancel as
 *   the P7O-04 disposition actions (idempotent, logged, admin-auth).
 * CAP-518 (quoted): STOP wins — a redrive under an active STOP for the
 *   capability rejects.
 */

import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { checkRateLimit } from "../lib/rateLimit";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { interventionCreateTx } from "./interventions";

const PROBE_INTERVAL_MS = 5 * 60_000; // 5m (quoted)
const STALE_FACTOR = 1.5; // ×1.5 → 7.5m (system health — NOT the 15m UI TTL)
const DEAD_FACTOR = 3; // ×3 → 15m + alert

async function requireAdmin(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("reliability: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("administrator")) throw new Error("reliability: Administrator required");
  return userId;
}

/** The dead-letter list (paginated take) + job-run statuses incl.
 *  manual_review as DISPLAY (no action — F-22). */
export const listDeadLetters = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const dead = await ctx.db.query("jobDeadLetters").take(50);
    const runs = await ctx.db.query("jobRuns").order("desc").take(50);
    return {
      deadLetters: dead.map((d: any) => ({
        id: d._id, jobKey: d.jobKey, reason: d.reason, createdAt: d.createdAt,
        redrivenAt: d.redrivenAt ?? null,
        redrivable: !d.redrivenAt, // one redrive per letter
      })),
      jobRuns: runs.map((r: any) => ({
        id: r._id, jobKey: r.jobKey, state: (r.state ?? r.status), attemptNumber: (r.attempt ?? 0),
        manualReview: (r.state ?? (r as any).status) === "manual_review", // visible, never actionable here (F-22)
      })),
    };
  },
});

/** CAP-501 — the 5m health.probe: liveness from lastSuccessAt (never
 *  lastStatus); stale = interval×1.5; dead = ×3 + alert; never_ran. */
export const healthProbe = internalMutation({
  args: {},
  returns: v.object({ probed: v.number() }),
  handler: async (ctx) => {
    const catalog = await ctx.db.query("jobCatalog").take(50);
    const now = Date.now();
    let probed = 0;
    for (const job of catalog) {
      // Liveness source: the latest successful run per jobKey (bounded)
      const successes = await ctx.db
        .query("jobRuns")
        .filter((q: any) => q.eq(q.field("jobKey"), job.jobKey))
        .take(20);
      const lastSuccess = successes
        .filter((r: any) => (r.state ?? r.status) === "succeeded")
        .sort((a: any, b: any) => b.completedAt - a.completedAt)[0];

      let state: "healthy" | "stale" | "dead" | "never_ran";
      if (!lastSuccess) {
        state = "never_ran";
      } else {
        const age = now - (lastSuccess.completedAt ?? lastSuccess.startedAt ?? now);
        state = age > PROBE_INTERVAL_MS * DEAD_FACTOR ? "dead"
          : age > PROBE_INTERVAL_MS * STALE_FACTOR ? "stale"
          : "healthy";
      }

      const existing = await ctx.db
        .query("platformHealth")
        .withIndex("by_probeKey", (q: any) => q.eq("probeKey", job.jobKey))
        .unique();
      const row = {
        probeKey: job.jobKey,
        state: state as any,
        severity: state === "dead" ? "critical" : state === "stale" ? "warning" : "info",
        checkedAt: now,
        lastSuccessAt: lastSuccess?.completedAt ?? lastSuccess?.startedAt,
        freshUntil: now + PROBE_INTERVAL_MS * STALE_FACTOR,
        affectedCapabilities: [],
        deepLinkKey: "/admin/reliability",
      };
      if (existing) await ctx.db.patch(existing._id, row);
      else await ctx.db.insert("platformHealth", row);

      if (state === "dead") {
        await interventionCreateTx(ctx, {
          alertKey: `probe_dead:${job.jobKey}`,
          severity: "critical",
          title: `Job dead: ${job.jobKey}`,
          whatHappening: `No successful run for over ${PROBE_INTERVAL_MS * DEAD_FACTOR / 60000} minutes.`,
          whatToDo: "Inspect the job's dead letters and recent runs (CAP-501 liveness).",
          deepLinkRouteKey: "/admin/reliability",
        });
      }
      probed += 1;
    }
    return { probed };
  },
});

/** CAP-500 — jobs.redriveDeadLetter (ORDINARY letters only). The F-22
 *  fence: manual_only / manual_review REJECT fail-closed. Revalidates
 *  authz + STOP + target at action time. */
export const redriveDeadLetter = mutation({
  args: { deadLetterId: v.id("jobDeadLetters") },
  returns: v.object({ requeued: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId }); // CAP-019 60/1m
    const letter = await ctx.db.get(args.deadLetterId);
    if (!letter) throw new Error("redrive: dead letter not found");
    if (letter.redrivenAt) throw new Error("redrive: already redriven (one per letter)");

    const parentJob = await ctx.db
      .query("jobCatalog")
      .filter((q: any) => q.eq(q.field("jobKey"), letter.jobKey))
      .first();
    // F-22 fence (quoted): manual_only retryClass → REJECT fail-closed
    if (parentJob && (parentJob as any).retryClass === "manual_only") {
      throw new Error(`redrive: jobKey "${letter.jobKey}" is retryClass=manual_only — F-22 open; use the P7O-04 disposition actions`);
    }
    const run = await ctx.db.get(letter.jobRunId);
    if ((run?.state ?? (run as any)?.status) === "manual_review") {
      throw new Error("redrive: source run is manual_review — F-22 open; use Approve&Retry (DECISIONS-LOCKED #5)");
    }
    // CAP-518: STOP wins — an active stop on the capability rejects
    const activeStop = await ctx.db
      .query("operationalIncidents")
      .withIndex("by_state_type", (q: any) => q.eq("state", "active").eq("type", "stop"))
      .take(5);
    const stoppedCapability = activeStop.find(
      (s: any) => s.capabilityKey && String(letter.jobKey).includes(s.capabilityKey),
    );
    if (stoppedCapability) throw new Error("redrive: an active STOP covers this job (CAP-518 — STOP wins)");
    // Target revalidation at action time (quoted): the referenced row exists
    if (run && (run as any).targetId) {
      const target = await ctx.db.get((run as any).targetId as any).catch(() => null);
      if (!target) throw new Error("redrive: target no longer exists (revalidated at action time)");
    }

    return writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.deadLetterId, {
        redrivenAt: Date.now(),
        redrivenByUserId: userId, // the two bible fields (quoted)
      });
      await actx.db.insert("jobRuns", {
        jobKey: letter.jobKey,
        catalogVersion: 1,
        runKey: `redrive:${args.deadLetterId}`,
        scheduledFor: Date.now(),
        state: "scheduled" as any, // re-queued (internal.* scheduling rides the jobs spine)
        attempt: 1, // a NEW run — the letter keeps its history
        startedAt: Date.now(),
        completedAt: 0,
      } as any);
      return {
        actorId: userId, action: "jobs.redriveDeadLetter",
        target: `jobDeadLetter:${args.deadLetterId}`, prev: { redrivenAt: null },
        next: { redrivenAt: Date.now() },
        correlationId: newCorrelationId(), reversible: false,
      };
    }).then(() => ({ requeued: true }));
  },
});

/** DECISIONS-LOCKED #5 — the manual_review disposition actions (the F-22
 *  sanctioned path): Approve&Retry (single idempotent re-run) and Cancel
 *  (permanent fail + logged). Admin-auth + auditLog; no auto-escalation. */
export const disposeManualReview = mutation({
  args: {
    jobRunId: v.id("jobRuns"),
    action: v.union(v.literal("approve_retry"), v.literal("cancel")),
  },
  returns: v.object({ disposed: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const run = await ctx.db.get(args.jobRunId);
    if (!run) throw new Error("dispose: run not found");
    if ((run.state ?? (run as any).status) !== "manual_review") throw new Error("dispose: run is not manual_review");

    return writeAudited(ctx, async (actx) => {
      if (args.action === "approve_retry") {
        await actx.db.patch(args.jobRunId, { state: "superseded" } as any);
        await actx.db.insert("jobRuns", {
          jobKey: run.jobKey,
          catalogVersion: (run as any).catalogVersion ?? 1,
          runKey: `manual_retry:${args.jobRunId}`,
          scheduledFor: Date.now(),
          state: "scheduled" as any,
          attempt: ((run as any).attempt ?? 1) + 1,
          startedAt: Date.now(),
          completedAt: 0,
        } as any);
      } else {
        await actx.db.patch(args.jobRunId, { state: "cancelled" } as any); // permanent fail (DECISIONS-LOCKED #5)
      }
      return {
        actorId: userId, action: `jobs.manualReview.${args.action}`,
        target: `jobRun:${args.jobRunId}`, prev: { status: "manual_review" },
        next: { action: args.action },
        correlationId: newCorrelationId(), reversible: args.action === "approve_retry",
      };
    }).then(() => ({ disposed: true }));
  },
});
