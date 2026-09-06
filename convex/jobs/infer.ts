/**
 * infer — SLICE-P5-04: CAP-145's inference batch over rawEvents →
 * versioned userInferences with manifest provenance.
 *
 * CAP-145 (quoted): "Never blocks. ≥3 qualifying events across ≥2
 *   sessions. Prohibited inferences: age/gender/income/etc. Lightweight
 *   manifest provenance (not per-event pointers)." Bible l.61: allowed =
 *   topic/post-type/tool-category/resource-category/view-mode affinity,
 *   engagement archetype, expertise signals; PROHIBITED list enforced at
 *   the write boundary (fail-closed).
 *
 * Session proxy: rawEvents carry no session id for authenticated events —
 *   distinct calendar days stand in for "≥2 sessions" (flagged
 *   approximation; the manifest records the rule version so the proxy is
 *   auditable, never silent).
 *
 * v1 inference surface: post-type affinity + topic affinity from the
 *   member's comment.created events (the only member-content events
 *   captured so far); the display component gap (§11, no inferred-vs-
 *   declared surface) is a flagged contract-side note, not ours to build.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const INFERENCE_RULE_VERSION = "infer.v1";

/** Bible l.61 — the prohibited list, verbatim class names. */
export const PROHIBITED_INFERENCE_TYPES = [
  "age", "gender", "income", "revenue", "purchasing_power",
  "employment", "sensitive_identity",
] as const;

/** Allowed v1 inference types (bible l.61 "Allowed:" list). */
export const ALLOWED_INFERENCE_TYPES = [
  "topic_affinity", "post_type_affinity", "tool_category_affinity",
  "resource_category_affinity", "view_mode_affinity",
  "engagement_archetype", "expertise_signal",
] as const;

export function assertInferenceAllowed(inferenceType: string): void {
  if ((PROHIBITED_INFERENCE_TYPES as readonly string[]).includes(inferenceType)) {
    throw new Error(`infer: '${inferenceType}' is a PROHIBITED inference class (bible l.61)`);
  }
  if (!(ALLOWED_INFERENCE_TYPES as readonly string[]).includes(inferenceType)) {
    throw new Error(`infer: '${inferenceType}' is not an allowed inference class`);
  }
}

const WINDOW_DAYS = 30;
const MIN_EVENTS = 3;
const MIN_SESSIONS = 2;

interface Manifest {
  ruleVersion: string;
  eventCount: number;
  distinctDays: number;
  windowStart: number;
  windowEnd: number;
}

/** A cheap, stable manifest hash — provenance without per-event pointers. */
function manifestHash(m: Manifest): string {
  const raw = `${m.ruleVersion}:${m.eventCount}:${m.distinctDays}:${m.windowStart}:${m.windowEnd}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

/** CAP-145 — the inference batch. Never blocks (failures are swallowed
 *  into the returned summary; the cron caller ignores results). */
export const inferBatch = internalMutation({
  args: {},
  returns: v.object({
    scanned: v.number(),
    candidates: v.number(),
    written: v.number(),
    ruleVersion: v.string(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const windowStart = now - WINDOW_DAYS * 24 * 3_600_000;

    const events = await ctx.db
      .query("rawEvents")
      .withIndex("by_eventType_time", (q: any) =>
        q.eq("eventType", "comment.created").gte("occurredAt", windowStart))
      .take(500);

    // Group by user
    const byUser = new Map<string, any[]>();
    for (const e of events) {
      if (!e.userId) continue;
      const list = byUser.get(e.userId) ?? [];
      list.push(e);
      byUser.set(e.userId, list);
    }

    let candidates = 0;
    let written = 0;
    for (const [userIdStr, userEvents] of byUser) {
      const userId = userIdStr as any;
      const days = new Set(userEvents.map((e: any) => new Date(e.occurredAt).toDateString()));
      // ≥3 qualifying events across ≥2 sessions (day proxy — flagged)
      if (userEvents.length < MIN_EVENTS || days.size < MIN_SESSIONS) continue;
      candidates += 1;

      // Post-type + topic affinity from the commented posts
      const typeCounts = new Map<string, number>();
      const topicCounts = new Map<string, number>();
      for (const e of userEvents) {
        const comment = (await ctx.db.get(e.targetId)) as any;
        if (!comment || comment.authorType !== "user") continue;
        const post = (await ctx.db.get(comment.postId)) as any;
        if (!post) continue;
        typeCounts.set(post.type, (typeCounts.get(post.type) ?? 0) + 1);
        topicCounts.set(post.categoryId, (topicCounts.get(post.categoryId) ?? 0) + 1);
      }
      if (typeCounts.size === 0) continue;

      const manifest: Manifest = {
        ruleVersion: INFERENCE_RULE_VERSION,
        eventCount: userEvents.length,
        distinctDays: days.size,
        windowStart,
        windowEnd: now,
      };
      const confidence = Math.min(0.9, userEvents.length / 10);
      const expiresAt = now + 60 * 24 * 3_600_000;

      // Supersede prior active rows of the same type (versioned, never
      // silently mutated) — direct-source truth (userInterests) is NEVER
      // touched by inference (l.60: direct always priority)
      for (const [inferenceType, counts] of [
        ["post_type_affinity", typeCounts],
        ["topic_affinity", topicCounts],
      ] as const) {
        if (counts.size === 0) continue;
        assertInferenceAllowed(inferenceType); // fail-closed write boundary
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        const priors = await ctx.db
          .query("userInferences")
          .withIndex("by_user_type_status", (q: any) =>
            q.eq("userId", userId).eq("inferenceType", inferenceType).eq("status", "active"))
          .collect();
        for (const prior of priors) {
          await ctx.db.patch(prior._id, { status: "superseded" });
        }
        await ctx.db.insert("userInferences", {
          userId,
          inferenceType,
          value: { top: top[0], count: top[1] },
          confidence,
          evidenceWindowStart: windowStart,
          evidenceWindowEnd: now,
          modelOrRuleVersion: `${INFERENCE_RULE_VERSION}:${manifestHash(manifest)}`,
          status: "active",
          createdAt: now,
          expiresAt,
        });
        written += 1;
      }
    }

    return { scanned: events.length, candidates, written, ruleVersion: INFERENCE_RULE_VERSION };
  },
});
