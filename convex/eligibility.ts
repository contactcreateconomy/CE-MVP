/**
 * eligibility — SLICE-P5-02: the M7 R-ELIGIBILITY machine (CAP-140 post
 * path + CAP-141 comment path) with append-only postingEligibilityEvents.
 *
 * CAP-141 (quoted): "Comment = email+mobile verified; no profile gate."
 * CAP-140 (quoted): "On incomplete → preserve draft, return missing basic
 *   decisions. State machine persisted append-only." Post path = the
 *   comment requirements + the completed basic profile (CONTRACT-5-setup
 *   §1: "/setup gates the post path (CAP-140) only").
 *
 * Initial-state writer (contract OQ2, unpinned): the first check writes
 * the computed state — flagged, not invented elsewhere.
 *
 * CAP-551 note: mobileVerified is written by Twilio Verify
 * (DECISIONS-LOCKED #1) via setup.mobile.verify — buildable when
 * TWILIO_* env lands (gate G6). Until then the comment path fails closed
 * with reasonCode mobile_unverified: correct posture, not a bug.
 */

import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export type EligibilityState =
  | "not_verified"
  | "basic_incomplete"
  | "eligible"
  | "temporarily_restricted"
  | "suspended";

export interface EligibilityResult {
  eligible: boolean;
  /** CAP-140's "missing basic decisions" — empty when eligible. */
  missing: string[];
  state: EligibilityState;
}

/** Typed rejection — callers surface reasonCodes, never raw strings. */
export class EligibilityError extends Error {
  constructor(
    public readonly path: "comment" | "post",
    public readonly reasonCode: string,
    public readonly missing: string[],
  ) {
    super(`eligibility.${path}: ${reasonCode}`);
    this.name = "EligibilityError";
  }
}

interface UserRow {
  emailVerified?: boolean;
  mobileVerified?: boolean;
  accountStatus?: string;
  accountStanding?: string;
  basicProfileComplete?: boolean;
  postingEligibilityState?: string;
}

function verificationMissing(user: UserRow): string[] {
  const missing: string[] = [];
  if (!user.emailVerified) missing.push("email_verified");
  if (!user.mobileVerified) missing.push("mobile_verified");
  return missing;
}

function standingState(user: UserRow): EligibilityState | null {
  if (user.accountStanding === "restricted") return "temporarily_restricted";
  if (user.accountStanding === "suspended" || user.accountStanding === "terminated" || user.accountStatus === "deleted") {
    return "suspended";
  }
  return null;
}

async function computeState(ctx: MutationCtx, userId: Id<"users">, path: "comment" | "post"): Promise<{ user: UserRow; result: EligibilityResult }> {
  const user = (await ctx.db.get(userId)) as UserRow | null;
  if (!user) throw new EligibilityError(path, "user_not_found", []);

  const standing = standingState(user);
  if (standing) {
    return { user, result: { eligible: false, missing: ["account_state"], state: standing } };
  }

  const verification = verificationMissing(user);
  if (verification.length > 0) {
    return { user, result: { eligible: false, missing: verification, state: "not_verified" } };
  }

  if (path === "post" && !user.basicProfileComplete) {
    return { user, result: { eligible: false, missing: ["basic_profile"], state: "basic_incomplete" } };
  }

  return { user, result: { eligible: true, missing: [], state: "eligible" } };
}

/**
 * CAP-141 — the comment path. Email+mobile verified + active +
 * not-restricted; NO profile gate. Throws the typed error on failure.
 */
export async function checkCommentEligibility(ctx: MutationCtx, userId: Id<"users">): Promise<void> {
  const { result } = await computeState(ctx, userId, "comment");
  if (!result.eligible) {
    await persistTransition(ctx, userId, result);
    throw new EligibilityError("comment", result.missing[0] ?? result.state, result.missing);
  }
  await persistTransition(ctx, userId, result);
}

/**
 * CAP-140 — the post path. Returns the result so the composer can
 * preserve the draft + hand back the missing decisions (CAP-140's
 * quoted outcome); does NOT throw on incompleteness.
 */
export async function checkPostEligibility(ctx: MutationCtx, userId: Id<"users">): Promise<EligibilityResult> {
  const { result } = await computeState(ctx, userId, "post");
  await persistTransition(ctx, userId, result);
  return result;
}

/**
 * Append-only state machine (CAP-140 Writes: postingEligibilityEvents).
 * A transition is recorded only when the state actually changes; the
 * standing states (restricted/suspended) are owned by M13/CAP-154 —
 * this machine never writes them onto users, only reflects them.
 */
async function persistTransition(ctx: MutationCtx, userId: Id<"users">, result: EligibilityResult): Promise<void> {
  const user = (await ctx.db.get(userId)) as UserRow | null;
  const previous = user?.postingEligibilityState ?? null;
  if (previous === result.state) return;
  await ctx.db.insert("postingEligibilityEvents", {
    userId,
    previousState: previous ?? "not_verified",
    nextState: result.state,
    reasonCode: result.eligible ? "eligibility_confirmed" : `missing:${result.missing.join("+")}`,
    triggerType: "system",
    occurredAt: Date.now(),
  });
  if (result.state === "eligible" || result.state === "basic_incomplete" || result.state === "not_verified") {
    await ctx.db.patch(userId, { postingEligibilityState: result.state });
  }
}
