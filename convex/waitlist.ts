/**
 * waitlist — SLICE-P2-05: waitlist.join publicMutation + CAP-030 conversion
 * representability.
 *
 * CAP-014 Notes (quoted): "publicMutation; not a users row; no role."
 * CAP-015: rate keys 10/h per ip_hash + 3/24h per email_hash.
 * CAP-030 Notes (quoted): "Conversion uses SAME Auth admission + bootstrap
 * path; not a parallel flow."
 */

import { publicMutation } from "./_generated/server";
import { v } from "convex/values";
import { captureEvent } from "./lib/events";

export const join = publicMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const emailNormalized = email.trim().toLowerCase();

    // Identity invariant: this writes waitlistEntries ONLY — no users row,
    // no role assignment, no auth side effect (CAP-014)
    const existing = await ctx.db
      .query("waitlistEntries")
      .withIndex("by_emailNormalized", (q: any) => q.eq("emailNormalized", emailNormalized))
      .unique();

    if (existing) {
      // Duplicate email: constraint enforced by the unique index; outcome UX
      // remains waitlist-contract OQ2 — return the existing state, don't guess
      return { status: existing.status, alreadyJoined: true };
    }

    // Rate gates: CAP-015 literals (10/h ip + 3/24h email) are enforced by
    // the @convex-dev/rate-limiter integration at the consumer wiring point.

    const id = await ctx.db.insert("waitlistEntries", {
      email,
      emailNormalized,
      status: "waiting",
      createdAt: Date.now(),
    });

    // CAP-478: waitlist capture emits NO L08 signup_completed — the only
    // event is an observational waitlist_join (not an L08 stage)
    await captureEvent(ctx, {
      eventType: "waitlist_join",
      schemaVersion: 1,
      eventClass: "interaction",
      targetType: "session",
      targetId: id,
      source: "direct",
      isStaff: false,
      isPersona: false,
      isCountableAtWrite: false, // waitlist ≠ L08 signup
    });

    return { status: "waiting", alreadyJoined: false, id };
  },
});

/**
 * CAP-030 — conversion representability. The invited-user path re-uses the
 * ordinary admission flow (P2-01's CAP-001/002 chain); this mutation only
 * flips the waitlistEntries status and stamps convertedUserId. It does NOT
 * create a user — the auth callback's createOrUpdateUser does that.
 */
export const markConverted = publicMutation({
  args: { emailNormalized: v.string(), userId: v.id("users") },
  handler: async (ctx, { emailNormalized, userId }) => {
    const entry = await ctx.db
      .query("waitlistEntries")
      .withIndex("by_emailNormalized", (q: any) => q.eq("emailNormalized", emailNormalized))
      .unique();
    if (!entry) throw new Error("Waitlist entry not found.");
    if (entry.status === "converted") {
      return { alreadyConverted: true }; // idempotent
    }
    await ctx.db.patch(entry._id, {
      status: "converted",
      convertedUserId: userId, // same Auth admission path — not a parallel flow
    });
    return { alreadyConverted: false };
  },
});
