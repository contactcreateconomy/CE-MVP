/**
 * activity — SLICE-P5-05: the CAP-570 `activity.append` helper.
 *
 * Register Notes (quoted): "System appends an activityLedger row in the
 *   same mutation whenever one of the six v1 event types fires."
 * Bible l.231 (quoted): "each meta field MUST be tagged safe-for-public
 *   vs always-private" so the future public-Journey toggle can never leak
 *   PII / IP / email. Visibility default = private for all users now
 *   (public-optional later).
 *
 * The helper + activityLedger schema land HERE; member-facing call-sites
 * wire in their OWNING slices (P5-02 comment_created, P5-03 upvote_given
 * / save_added, P5-11 persona comment_created; Phase 6 resource_acquired,
 * Phase 7 tier_unlocked + post_published wiring at CAP-055/086). Mirrors
 * CAP-436's rawEvents same-mutation discipline: fire inline in the owning
 * mutation's transaction — never via scheduler (that would break the
 * atomic append contract).
 */

import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/** The six v1 event names, verbatim (bible l.232). */
export const ACTIVITY_EVENT_TYPES = [
  "post_published",
  "comment_created",
  "upvote_given",
  "save_added",
  "resource_acquired",
  "tier_unlocked",
] as const;
export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

/** A meta field's privacy tag — the public-Journey leak guard (bible l.231). */
export type ActivityMetaEntry = {
  value: unknown;
  privacy: "safe_for_public" | "always_private";
};
export type ActivityMeta = Record<string, ActivityMetaEntry>;

export interface AppendActivityArgs {
  userId: Id<"users">;
  eventType: ActivityEventType;
  targetType: string;
  targetId: string;
  summary: string; // human text
  meta: ActivityMeta;
}

/**
 * CAP-570 — append one Journal row. Fail-closed on the two contracts the
 * bible makes non-negotiable: (1) eventType ∈ the six v1 names; (2) EVERY
 * meta field is an explicitly tagged {value, privacy} entry. An untagged
 * field is a potential PII leak into the future public Journey — reject,
 * do not default.
 */
export async function appendActivity(ctx: MutationCtx, args: AppendActivityArgs): Promise<void> {
  if (!ACTIVITY_EVENT_TYPES.includes(args.eventType)) {
    throw new Error(`activity.append: eventType '${args.eventType}' is not a v1 event type`);
  }
  if (!args.meta || typeof args.meta !== "object") {
    throw new Error("activity.append: meta is required (may be {})");
  }
  for (const [field, entry] of Object.entries(args.meta)) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !("value" in entry) ||
      (entry.privacy !== "safe_for_public" && entry.privacy !== "always_private")
    ) {
      throw new Error(
        `activity.append: meta.${field} must be {value, privacy: safe_for_public|always_private} — untagged fields can leak PII into the public Journey`,
      );
    }
  }
  if (typeof args.summary !== "string" || args.summary.length === 0) {
    throw new Error("activity.append: summary (human text) is required");
  }
  await ctx.db.insert("activityLedger", {
    userId: args.userId,
    eventType: args.eventType,
    targetType: args.targetType,
    targetId: args.targetId,
    summary: args.summary,
    meta: args.meta,
    visibility: "private", // bible l.231 default — public is a later opt-in
    createdAt: Date.now(),
  });
}
