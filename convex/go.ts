/**
 * go — SLICE-P6-17: CAP-247/248/249 — the /go/[linkId] BUY interstitial:
 * route-level gate on BOTH branches (the money-path slice).
 *
 * THE REGISTER QUOTES (each branch gated INDEPENDENTLY — a shared "the
 * gate is checked" test cannot pass this slice):
 *   CAP-247: "verifies storefrontLinks.validationState=approved_locked —
 *     the live-gate (data-model: storefrontLinks has no status field;
 *     approved_locked is the only BUY-passing value)."
 *   CAP-248 (in-app): "Verifies storefrontLinks.validationState=
 *     approved_locked server-side at this exact route/action,
 *     independent of whether CAP-247 fired first. … Route-level
 *     invariant; INV-4's no-refetch is destination-scoped (resolve from
 *     the locked stored record)."
 *   CAP-249 (off-platform): "…an off-platform pasted link NEVER fires
 *     CAP-247's entry-verify, so this route must gate itself. Gate-fail
 *     here renders the dead-link/unavailable state (no interstitial
 *     continue), never the locked destination."
 * THREE-STATE TAXONOMY (quoted): "These three are distinct states, not
 *   variants of one error": (1) dead-link — no row at all; (2) gate-fail
 *   — row exists, validationState ≠ approved_locked; (3) redirect
 *   proceeds — locked + branch by context. Off-platform: interstitial
 *   with NO auto-redirect (anti trusted-link-shortener/domain-hijack).
 * SubID append FAIL-CLOSES on an empty subIdRegistry (CAP-572 quoted) —
 *   unknown params are never invented.
 * F-31 fail-closed choices: logging failure before redirect BLOCKS the
 *   redirect (CAP-436 class — a click that cannot be logged cannot
 *   proceed); dwell/loop numerics unspecified — not invented.
 * INV-4: the hot path never refetches the destination; the merchant
 *   domain comes from the locked stored record. The affiliate id NEVER
 *   exposes (masked field only). Amazon rides the IDENTICAL flow (CAP-524).
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { captureEvent } from "./lib/events";

export const GO_CLICK_EVENT_ROW = {
  schemaVersion: 1,
  eventClass: "outcome" as const,
  ownerModule: "m11",
  description: "A BUY click proceeds through /go (CAP-248/249)",
  captureMode: "same_mutation",
  piiClass: "none",
  consentGate: "strictly_necessary",
  signalEligible: false,
  s18Eligible: false,
  excludeStaff: false,
  excludePersonas: false,
  idempotencyScope: "none",
  retentionClass: "standard",
  posthogMirror: false,
  status: "active" as const,
  effectiveFrom: Date.now(),
  owner: "m11",
  eventName: "store.buy_click_proceed",
};

/** The three states (quoted taxonomy — distinct, never error-variants). */
export type GoState =
  | { state: "dead_link" } // no row at all
  | { state: "gate_fail"; validationState: string } // row found, not locked
  | { state: "proceed"; destinationUrl: string; branch: "in_app" | "off_platform"; network: string }; // locked

/** The route gate — ONE server function, the branch decided by the
 *  presented context flag (the client passes isInApp from session/
 *  Referer; the GATE itself never trusts it — only the branch does). */
export const resolveGo = query({
  args: { linkId: v.id("storefrontLinks"), isInApp: v.optional(v.boolean()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    // State 1 — dead-link: no row AT ALL (distinct cause + render)
    if (!link) return { state: "dead_link" as const };

    // States 2/3 — the ROUTE-LEVEL gate (both CAP-248 and CAP-249 re-read
    // validationState HERE, independent of any CAP-247 entry-verify)
    if (link.validationState !== "approved_locked") {
      return { state: "gate_fail" as const, validationState: link.validationState };
    }

    // State 3 — proceed: resolve the destination from the LOCKED record
    // (INV-4 no-refetch; the masked ref builds the tagged URL server-side)
    const subIdRow = await ctx.db
      .query("subIdRegistry")
      .withIndex("by_network", (q: any) => q.eq("network", link.network))
      .first();
    // CAP-572 (quoted): empty/absent dictionary → FAIL-CLOSED (no unknown
    // params appended — and no proceed without attribution)
    if (!subIdRow || !subIdRow.permitted) {
      return { state: "gate_fail" as const, validationState: link.validationState, reason: "subid_dictionary_absent" };
    }
    const separator = link.submittedUrl.includes("?") ? "&" : "?";
    const destinationUrl = `${link.submittedUrl}${separator}${subIdRow.paramName}=cc_${Date.now().toString(36)}`;
    return {
      state: "proceed" as const,
      destinationUrl,
      branch: args.isInApp ? ("in_app" as const) : ("off_platform" as const),
      network: link.network,
    };
  },
});

/** CAP-247/248/249 — the BUY-tap record + the fail-closed redirect
 *  release. F-31: if the click row or the rawEvent cannot persist, the
 *  redirect is BLOCKED (logging-before-redirect, CAP-436 class). The
 *  off-platform branch NEVER auto-redirects (quoted). */
export const recordClick = mutation({
  args: {
    linkId: v.id("storefrontLinks"),
    productId: v.id("storefrontProducts"),
    promoterUserId: v.id("users"),
    isInApp: v.boolean(),
    anonymousSessionId: v.optional(v.string()),
    sourcePostId: v.optional(v.id("posts")),
  },
  returns: v.object({ clickId: v.string(), proceed: v.boolean(), reason: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    // The gate RE-READS at the mutation too (the query's decision is
    // advisory; the write path is authoritative — Finding 5 bounds
    // staleness to one request by re-validating here)
    const link = await ctx.db.get(args.linkId);
    if (!link) return { clickId: "", proceed: false, reason: "dead_link" };
    if (link.validationState !== "approved_locked") {
      return { clickId: "", proceed: false, reason: `gate_fail:${link.validationState}` };
    }
    const subIdRow = await ctx.db
      .query("subIdRegistry")
      .withIndex("by_network", (q: any) => q.eq("network", link.network))
      .first();
    if (!subIdRow || !subIdRow.permitted) {
      return { clickId: "", proceed: false, reason: "subid_dictionary_absent" };
    }

    const viewerId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    const clickId = `click:${Date.now().toString(36)}:${link._id.slice(-6)}`;

    // Self/associated clicks excluded (qualification=excluded — still
    // logged; never a Signal input — that's M12's gate, never here)
    const isSelf = viewerId === args.promoterUserId;
    try {
      await ctx.db.insert("storefrontClicks", {
        storefrontLinkId: args.linkId,
        storefrontProductId: args.productId,
        promoterUserId: args.promoterUserId,
        sourcePostId: args.sourcePostId,
        sourceSurface: args.sourcePostId ? "post" : "storefront",
        clickId,
        actorUserId: viewerId ?? undefined,
        anonymousSessionId: args.anonymousSessionId ?? "anonymous",
        qualification: isSelf ? "excluded" : "raw",
        integrityStatus: "pending",
        occurredAt: Date.now(),
      });
      await captureEvent(ctx, {
        eventType: "store.buy_click_proceed",
        schemaVersion: 1,
        eventClass: "outcome",
        userId: viewerId ?? undefined,
        anonymousSessionId: args.anonymousSessionId,
        targetType: "affiliate",
        targetId: args.linkId,
        source: "direct",
        isStaff: false,
        isPersona: false,
        isCountableAtWrite: !isSelf,
        branch: args.isInApp ? "in_app" : "off_platform",
        network: link.network,
      } as any);
    } catch {
      // FAIL-CLOSED (F-31): logging failure before redirect blocks it
      return { clickId: "", proceed: false, reason: "logging_failed_blocked" };
    }

    // A click is NEVER emitted as a verified conversion (go §5, quoted) —
    // settlement writes qualification only (P6-18 crons).
    return { clickId, proceed: true };
  },
});
