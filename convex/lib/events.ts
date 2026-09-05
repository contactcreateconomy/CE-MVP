/**
 * events — SLICE-P1-07: minimal same-mutation capture pair.
 *
 * CAP-436: "mutation fails if authoritative rawEvents cannot persist" —
 * the capture helper is called INSIDE the domain mutation (same transaction,
 * never fire-and-forget). CAP-437: "Unknown event → reject/quarantine +
 * instrumentation_error". isCountableAtWrite is stamped once at write
 * (initial only — never silently rewritten). Write-time stamping per the
 * orphan-CAP disposition: isStaff / isPersona / isCountableAtWrite
 * (CAP-438), signup/identify (CAP-441), posthogMirror commit (CAP-442).
 */

import type { MutationCtx, QueryCtx } from "../_generated/server";

export type EitherCtx = MutationCtx | QueryCtx;

export interface RawEventInput {
  eventType: string;
  schemaVersion: number;
  eventClass: "interaction" | "exposure" | "outcome" | "distribution";
  userId?: import("../_generated/dataModel").Id<"users">;
  anonymousSessionId?: string;
  sequenceInSession?: number;
  targetType: "post" | "comment" | "tool" | "affiliate" | "user_profile" | "session";
  targetId: string;
  authorUserId?: string;
  authorType?: string;
  reactorAuthorType?: string;
  source: "direct" | "internal_nav" | "search" | "social" | "email" | "distribution";
  referrer?: string;
  isStaff: boolean;
  isPersona: boolean;
  isCountableAtWrite: boolean;
  analyticsSubjectId?: string;
  posthogMirror?: boolean;
  [key: string]: unknown; // surface/placement/rankPosition/dwellMs/reaction*/outcome* per envelope
}

/** CAP-437 — assert the event is catalog-registered before capture. */
export async function assertCatalogEvent(ctx: EitherCtx, eventType: string): Promise<any> {
  const row = await ctx.db
    .query("eventCatalog")
    .withIndex("by_eventName", (q: any) => q.eq("eventName", eventType))
    .unique();
  if (!row || row.status === "deprecated") {
    throw new Error(
      `instrumentation_error: event "${eventType}" is not registered in eventCatalog (CAP-437: unknown event → reject)`,
    );
  }
  return row;
}

/**
 * CAP-436 — same-mutation capture. Call from INSIDE the domain mutation.
 * Throws if the catalog check or the insert fails → the whole mutation rolls
 * back (display-state and record never diverge).
 */
export async function captureEvent(ctx: MutationCtx, input: RawEventInput): Promise<void> {
  const catalog = await assertCatalogEvent(ctx, input.eventType);
  // Type the insert through the schema's own inference — the envelope is
  // schema-shaped by RawEventInput's field names.
  await ctx.db.insert("rawEvents", {
    ...(input as unknown as Record<string, unknown>),
    eventClass: catalog.eventClass ?? input.eventClass,
    sequenceInSession: input.sequenceInSession ?? 0,
    // CAP-438: stamped once at write — callers never rewrite this
    isCountableAtWrite: input.isCountableAtWrite,
    // Bible unions two names for the same stamp: M12 envelope "isAiPersona"
    // (l.121, required) + M16 deepen "isPersona" (l.271, CAP-438). Both are
    // written from the single caller-provided truth.
    isAiPersona: input.isPersona,
    // CAP-442: posthogMirror committed with the event when consent-gated
    posthogMirror: input.posthogMirror ?? false,
    occurredAt: Date.now(),
    receivedAt: Date.now(),
  } as Parameters<typeof ctx.db.insert<"rawEvents">>[1]);
}
