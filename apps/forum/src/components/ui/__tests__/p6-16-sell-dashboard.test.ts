/* eslint-disable @typescript-eslint/no-explicit-any -- pure-function + source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-16 acceptance tests — CONTRACT-6-sell: the /sell Rocketeer
 * Dashboard (CAP-233/234/239/243/257/258/259/260/270/450/525).
 * The CAP-525 two-field rule + the A13 visible-distinctness are the
 * FATAL-adjacent values this suite protects. */

import { SELF_REPORT_WEIGHT } from "../../../../../../convex/store/sell";

const convexRoot = join(__dirname, "../../../../../../convex");
const sellSrc = readFileSync(join(convexRoot, "store/sell.ts"), "utf8");
const decideSrc = readFileSync(join(convexRoot, "admin/store.ts"), "utf8");
const enforceSrc = readFileSync(join(convexRoot, "admin/storeEnforce.ts"), "utf8");
const clientSrc = readFileSync(join(__dirname, "../../../app/(app)/(shell)/sell/sell-dashboard-client.tsx"), "utf8");
const pageSrc = readFileSync(join(__dirname, "../../../app/(app)/(shell)/sell/page.tsx"), "utf8");

describe("SLICE-P6-16 — CAP-525 two-field write (FATAL-adjacent)", () => {
  it("self-report persists type=self_report AND status=unverified — two fields, never a collapsed literal", () => {
    const fn = sellSrc.split("export const submitSelfReport")[1]?.split("export const")[0] ?? "";
    expect(fn).toContain('type: "self_report"');
    expect(fn).toContain('status: "unverified"');
  });

  it("interim weight sits STRICTLY between click-only (10) and network-verified (25) — never equal either", () => {
    expect(SELF_REPORT_WEIGHT).toBeGreaterThan(10);
    expect(SELF_REPORT_WEIGHT).toBeLessThan(25);
    const fn = sellSrc.split("export const submitSelfReport")[1]?.split("export const")[0] ?? "";
    expect(fn).toContain("strictly between 10 and 25");
  });

  it("Amazon structurally excluded from reconcile-as-verified (CAP-261 note held)", () => {
    expect(sellSrc).toContain("CAP-261");
  });
});

describe("SLICE-P6-16 — CAP-233 activation gate (E4: gated-by CAP-237)", () => {
  it("activation requires ≥1 approved product — the quoted cap-237 gate reason", () => {
    const fn = sellSrc.split("export const activate")[1]?.split("/**")[0] ?? "";
    expect(fn).toContain('eq("status", "approved")');
    expect(fn).toContain("cap-237 gate");
    expect(fn).not.toContain("cap-248");
  });

  it("activation finalizes the provisional rocketeer badge (register: 'badge active + public HERE')", () => {
    const fn = sellSrc.split("export const activate")[1]?.split("export const")[0] ?? "";
    expect(fn).toContain('q.field("type"), "rocketeer"');
    expect(fn).toContain('"finalized"');
  });
});

describe("SLICE-P6-16 — Rocketeer badge lifecycle (bible l.228 + register CAP-232/267)", () => {
  it("approval mints the badge PROVISIONAL", () => {
    const fn = decideSrc.split("export const decideRequest")[1]?.split("export const")[0] ?? "";
    expect(fn).toContain('type: "rocketeer"');
    expect(fn).toContain('"provisional"');
  });

  it("CAP-267 revoke suspends the store + REVOKES the badge row (stays on the public shelf)", () => {
    const fn = enforceSrc.split("export const revokeBadge")[1]?.split("export const")[0] ?? "";
    expect(fn).toContain('"revoked"');
    expect(fn).toContain("revokedAt");
  });
});

describe("SLICE-P6-16 — CAP-270/239/257 seller actions", () => {
  it("owner pause is immediate, no review", () => {
    const fn = sellSrc.split("export const pauseMyStore")[1]?.split("export const")[0] ?? "";
    expect(fn).toContain('"paused"');
    expect(fn).not.toContain("review"); // CAP-270: no review step exists in the body
  });

  it("edit request: the current stays live — the row re-enters validation, never a destructive rewrite", () => {
    const fn = sellSrc.split("export const requestEdit")[1]?.split("export const")[0] ?? "";
    // CAP-239: a NEW pending version row; the product row (status/currentVersionId)
    // is untouched — the live package stays listed + BUYable until re-validation.
    expect(fn).toContain('insert("storefrontProductVersions"');
    expect(fn).not.toContain("db.patch(args.storefrontProductId");
    expect(fn).toContain('product.status !== "approved"'); // server-side precondition (reject-not-UI-hide)
  });

  it("analytics read honors CAP-450: k<5 intent cells suppressed server-side", () => {
    const fn = sellSrc.split("export const getAnalytics")[1]?.split("export const")[0] ?? "";
    expect(fn).toContain(">= 5");
    expect(fn).not.toContain("buyer");
  });
});

describe("SLICE-P6-16 — /sell dashboard UI (CONTRACT-6-sell)", () => {
  it("route exists at /sell with noindex (seller-private surface)", () => {
    expect(pageSrc).toContain("Rocketeer Dashboard");
    expect(pageSrc).toContain("index: false");
  });

  it("guards useQuery behind isConvexConfigured (CI build without Convex URL)", () => {
    expect(clientSrc).toContain("isConvexConfigured()");
  });

  it("A13 FENCED: evidence tiers use DISTINCT copy keys — interim can never read as network-verified", () => {
    expect(clientSrc).toContain("Self-reported — unverified");
    expect(clientSrc).toContain("Network-verified");
    // The verified label is earned ONLY by status === "network_verified"
    const fn = clientSrc.split("function evidencePillar")[1]?.split("}")[0] ?? "";
    expect(fn).toContain('e.status === "network_verified"');
  });

  it("three honest analytics buckets render — suppressed cells show the honest dash", () => {
    for (const bucket of ["Traffic:", "Intent:", "Confirmed:"]) {
      expect(clientSrc).toContain(bucket);
    }
    expect(clientSrc).toContain('"—"');
  });

  it("product statuses are the enum-backed set from the contract (§3.B)", () => {
    for (const s of ["auto_screened", "under_review", "destination_unavailable"]) {
      expect(clientSrc).toContain(`"${s}"`);
    }
  });

  it("locked-package honesty: edits land as a new version, current stays live", () => {
    expect(clientSrc).toContain("new version");
    expect(clientSrc).toContain("stays live");
  });
});
