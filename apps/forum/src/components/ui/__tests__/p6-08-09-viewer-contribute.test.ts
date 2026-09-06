/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-08 + P6-09 acceptance tests — the sandboxed viewer (CAP-211,
 * INV-6 cross-slice) + the dormant /contribute surface (CAP-202/203/204/
 * 227/228). Quotes live in the owning modules. */

import * as viewModel from "../../../../../../convex/resources/view";
import * as contributeModule from "../../../../../../convex/contribute";

const convexRoot = join(__dirname, "../../../../../../convex");
const viewSrc = readFileSync(join(convexRoot, "resources/view.ts"), "utf8");
const viewClientSrc = readFileSync(
  join(__dirname, "../../../app/(app)/(content)/resources/[slug]/view/resource-view-client.tsx"),
  "utf8",
);
const contributeSrc = readFileSync(join(convexRoot, "contribute.ts"), "utf8");
const contributeClientSrc = readFileSync(
  join(__dirname, "../../../app/(app)/(content)/contribute/contribute-page-client.tsx"),
  "utf8",
);
const seedSrc = readFileSync(join(convexRoot, "seed.ts"), "utf8");

describe("SLICE-P6-08 — the sandboxed viewer (CAP-211, INV-6)", () => {
  it("serves ONLY the clean-bucket current version — quarantine keys unreachable", () => {
    expect(viewSrc).toContain("currentVersionId");
    expect(viewSrc).toContain("fileAssetId");
    expect(viewSrc).not.toContain("storageKeyQuarantine");
  });

  it("view writes NO acquisition and NO ledger row (the INV-6 cross-slice clause)", () => {
    const fn = viewSrc.split("export const getViewUrl")[1] ?? "";
    expect(fn).not.toContain('insert("acquisitions"');
    expect(fn).not.toContain("resourceQuotaLedgers");
    expect(fn).not.toContain("appendActivity"); // no Journal side-effect either
  });

  it("view event ONLY (quoted) — catalog-gated, never an acquisition event", () => {
    expect(viewModel.RESOURCE_VIEW_EVENT_ROW.eventName).toBe("resources.viewed");
    expect(viewSrc).toContain("captureEvent");
    expect(seedSrc).toContain("RESOURCE_VIEW_EVENT_ROW");
  });

  it("anonymous = fenced teaser branch (DEC-M10-VIEW-AUTH — nothing invented)", () => {
    expect(viewSrc).toContain("teaser: true");
    // the teaser response carries NO content-mechanic fields (page count,
    // first-page, watermark are all fenced — the branch is a sign-in prompt)
    const teaserFn = viewSrc.split("if (!userId)")[1].split("const version")[0];
    expect(teaserFn).not.toContain("pageCount");
    expect(teaserFn).not.toContain("previewAssetId");
  });

  it("flag-off renders disabled — fail-closed, never the PDF (OQ5)", () => {
    expect(viewSrc).toContain("enabled: false");
    expect(viewClientSrc).toContain("viewer is currently disabled");
  });

  it("the iframe is fully sandboxed (no scripts, no same-origin, no referrer)", () => {
    expect(viewClientSrc).toContain('sandbox=""');
    expect(viewClientSrc).toContain('referrerPolicy="no-referrer"');
  });
});

describe("SLICE-P6-09 — the dormant /contribute (CAP-202/203/204/227)", () => {
  it("E3 quoted: reachable disabled render — the route MOUNTS (not 404) with server-rejecting mutations", () => {
    expect(contributeClientSrc).toContain("closed during the soft beta");
    expect(contributeSrc).toContain("server-reject (E3)");
    expect(contributeSrc).toContain("disabled: true");
  });

  it("sequential flow (Finding 3): ackContract precedes submit; submit quarantines", () => {
    expect(contributeSrc.indexOf("export const ackContract")).toBeLessThan(
      contributeSrc.indexOf("export const submitReference"),
    );
    const fn = contributeSrc.split("export const submitReference")[1] ?? "";
    expect(fn).toContain('status: "quarantined"');
    expect(fn).toContain("storageKeyQuarantine");
  });

  it("rightsBasis REQUIRED before forge (quoted: none → reject)", () => {
    expect(contributeSrc).toContain("rights_basis_required");
    expect(contributeSrc).toContain("rightsBasis"); // required arg (non-optional union)
  });

  it("original bytes never on the public CDN — only the quarantine key exists", () => {
    expect(contributeSrc).not.toMatch(/publicCd|cdn/);
    expect(contributeSrc).toContain("never public CDN");
  });

  it("CAP-204 scan coordinator: fail-closed hold — no auto-pass", () => {
    const fn = contributeSrc.split("export const intakeScan")[1] ?? "";
    expect(fn).toContain('"scanning"');
    expect(fn).toContain('"rights_review"');
    expect(fn).toContain("fail-closed");
    expect(fn).not.toContain("auto-pass");
  });

  it("CAP-227 erasure is non-value-bearing (never the identity in auditLog.prev)", () => {
    const fn = contributeSrc.split("export const eraseAttribution")[1] ?? "";
    expect(fn).toContain("uploaderUserId: undefined");
    expect(fn).toContain("NON-VALUE-BEARING");
    expect(fn).not.toContain("prev: { userId");
  });

  it("the flag default is false (soft beta — DEC-M10-UGC-PILOT)", () => {
    expect(contributeSrc).toContain("default false");
  });
});
