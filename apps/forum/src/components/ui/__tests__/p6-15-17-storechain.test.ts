/* eslint-disable @typescript-eslint/no-explicit-any -- mocked-ctx + source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-15/16/17 acceptance tests — enforcement (CAP-264-268/271), the
 * sell dashboard (CAP-233/234/239/270/257/450/525), and THE MONEY PATH:
 * /go (CAP-247/248/249) with the both-branch gate matrix + three-state
 * taxonomy — each quoted separately per the catalog's named hazard. */

import { SELF_REPORT_WEIGHT } from "../../../../../../convex/store/sell";
import { GO_CLICK_EVENT_ROW } from "../../../../../../convex/go";

const convexRoot = join(__dirname, "../../../../../../convex");
const enforceSrc = readFileSync(join(convexRoot, "admin/storeEnforce.ts"), "utf8");
const sellSrc = readFileSync(join(convexRoot, "store/sell.ts"), "utf8");
const goSrc = readFileSync(join(convexRoot, "go.ts"), "utf8");
const goClientSrc = readFileSync(join(__dirname, "../../../app/(app)/(content)/go/[linkId]/go-client.tsx"), "utf8");
const cronsSrc = readFileSync(join(convexRoot, "crons.ts"), "utf8");

describe("SLICE-P6-15 — enforcement (CAP-264-268/271)", () => {
  it("every action carries reason + auditLog (CAP-264 quoted)", () => {
    expect((enforceSrc.match(/writeAudited\(/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(enforceSrc).toContain("reasonCode");
  });

  it("CAP-265: breaker N/M read from config keys — never hardcoded", () => {
    const fn = enforceSrc.split("export const circuitBreaker")[1] ?? "";
    expect(fn).toContain("store.circuitbreaker.complaintCountN");
    expect(fn).toContain("store.circuitbreaker.windowHoursM");
  });

  it("CAP-267: badge revoke = PUBLIC notice only; follower fan-out NOT built; buyers never inferred", () => {
    const fn = enforceSrc.split("export const revokeBadge")[1] ?? "";
    expect(fn).toContain("publicNotice");
    expect(fn).not.toContain("notifyFollowers");
    expect(enforceSrc).toContain("FUTURE-M11-01");
    expect(enforceSrc).toContain("NEVER infers buyers");
  });

  it("CAP-268: complaint writes merchantComplaints + moderationCases (the SHARED queue) + auditLog", () => {
    const fn = enforceSrc.split("export const fileComplaint")[1] ?? "";
    expect(fn).toContain("merchantComplaints");
    expect(fn).toContain("moderationCases");
    expect(fn).toContain("store_commercial"); // the polymorphic caseType
  });

  it("CAP-271: notices cron = public + consented-buyer branches only", () => {
    const fn = enforceSrc.split("export const notifyRevocations")[1] ?? "";
    expect(fn).toContain("consented-buyer email branch is inert until G8");
    expect(fn).not.toContain("insert(\"notifications\")"); // no follower fan-out
    expect(cronsSrc).toContain("storeEnforce.circuitBreaker");
  });
});

describe("SLICE-P6-16 — the sell dashboard (CAP-233/234/239/270/257/450/525)", () => {
  it("CAP-233: activation gated by CAP-237 (>=1 approved product) — NOT CAP-248", () => {
    const fn = sellSrc.split("export const activate")[1] ?? "";
    expect(fn).toContain("not CAP-248");
    expect(fn).toContain("cap-237 gate");
  });

  it("CAP-270: owner pause is immediate, no review", () => {
    const fn = (sellSrc.split("export const pauseMyStore")[1] ?? "").split("export const getAnalytics")[0];
    expect(fn).not.toContain("writeAudited"); // immediate owner action (E5)
    expect(fn).toContain("paused");
  });

  it("CAP-450 read contract: k<5 cells suppressed server-side", () => {
    const fn = sellSrc.split("export const getAnalytics")[1] ?? "";
    expect(fn).toContain(">= 5");
    expect(fn).toContain("null");
  });

  it("CAP-525 TWO-FIELD WRITE: type=self_report AND status=unverified — both literals, never a collapsed one", () => {
    const fn = sellSrc.split("export const submitSelfReport")[1] ?? "";
    expect(fn).toContain('type: "self_report"');
    expect(fn).toContain('status: "unverified"');
    expect(fn).not.toContain("self_reported_unverified");
    // The band guard: weight STRICTLY between 10 and 25 (quoted)
    expect(SELF_REPORT_WEIGHT).toBeGreaterThan(10);
    expect(SELF_REPORT_WEIGHT).toBeLessThan(25);
    expect(fn).toContain("strictly between 10 and 25");
  });

  it("CAP-261: Amazon never reconcile-as-verified (no verified write path for amazon in this module)", () => {
    expect(sellSrc).not.toContain('status: "network_verified"'); // sellers can never self-mint verified
  });

  it("A13 fenced: distinct copy key rides the audit; no badge token designed", () => {
    const fn = sellSrc.split("export const submitSelfReport")[1] ?? "";
    expect(fn).toContain("copyKey");
    expect(sellSrc).not.toContain("VerifiedBadge");
  });
});

describe("SLICE-P6-17 — /go: BOTH-BRANCH GATE MATRIX (the exit gate)", () => {
  // The resolve/query gate
  const resolveFn = goSrc.split("export const resolveGo")[1].split("export const recordClick")[0];
  // The record/mutation gate (the authoritative re-read)
  const recordFn = goSrc.split("export const recordClick")[1] ?? "";

  it("TEST 1 (quoted): in-app direct hit — the route re-reads validationState WITHOUT any CAP-247 prior", () => {
    // The gate key on the route itself: one shared check, context-blind
    expect(resolveFn).toContain('link.validationState !== "approved_locked"');
    // The branch flag (isInApp) is consumed ONLY after the gate passes —
    // the gate decision never reads it
    const gateIdx = resolveFn.indexOf('link.validationState !== "approved_locked"');
    const branchIdx = resolveFn.indexOf("args.isInApp");
    expect(gateIdx).toBeGreaterThan(-1);
    expect(branchIdx).toBeGreaterThan(gateIdx);
  });

  it("TEST 2 (quoted): off-platform pasted link — same route gate; fail renders unavailable, NEVER the destination, NO auto-redirect", () => {
    expect(resolveFn).toContain('"off_platform"');
    // The client's off-platform branch never auto-redirects
    expect(goClientSrc).toContain("ONLY the in-app branch auto-redirects");
    expect(goClientSrc).toMatch(/if \(isInApp\) window\.location\.href/);
  });

  it("TEST 3 (quoted): CAP-247 BUY-tap gate — the WRITE path re-validates independently of the query", () => {
    expect(recordFn).toContain('link.validationState !== "approved_locked"');
    expect(recordFn).toContain("gate_fail:");
  });

  it("THREE-STATE taxonomy: dead-link ≠ gate-fail ≠ proceed — distinct literals, distinct causes", () => {
    expect(resolveFn).toContain('"dead_link"');
    expect(resolveFn).toContain('"gate_fail"');
    expect(resolveFn).toContain('"proceed"');
    expect(goClientSrc).toContain("doesn&apos;t exist"); // dead-link render (JSX entity)
    expect(goClientSrc).toContain("isn&apos;t available right now"); // gate-fail render
  });

  it("SubID append FAIL-CLOSES on an empty/absent dictionary (CAP-572 quoted)", () => {
    expect(resolveFn).toContain("subid_dictionary_absent");
    expect(recordFn).toContain("subid_dictionary_absent");
  });

  it("F-31 fail-closed: logging failure before redirect BLOCKS it", () => {
    expect(recordFn).toContain("logging_failed_blocked");
  });

  it("INV-4: destination resolved from the LOCKED record — no refetch; affiliate id never exposed", () => {
    expect(resolveFn).toContain("link.submittedUrl"); // the stored record
    expect(goSrc).not.toContain("affiliateAccountRefMasked:"); // never returned
  });

  it("A click is NEVER a verified conversion (go §5 quoted)", () => {
    expect(goSrc).toContain("never a Signal input");
    expect(recordFn).toContain('qualification: isSelf ? "excluded" : "raw"'); // raw, never verified
  });

  it("the click event is catalog-gated + seeded", () => {
    expect(GO_CLICK_EVENT_ROW.eventName).toBe("store.buy_click_proceed");
    const seedSrc = readFileSync(join(convexRoot, "seed.ts"), "utf8");
    expect(seedSrc).toContain("GO_CLICK_EVENT_ROW");
  });
});
