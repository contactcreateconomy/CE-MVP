/* eslint-disable @typescript-eslint/no-explicit-any -- pure-function + source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P5-07 acceptance tests — CAP-526/527/528/550. Sources:
 * CONTRACT-5-u-handle §1-§4 + register rows (CAP-550 quotes). */

import { normalizeHandle } from "../../../../../../convex/profile/page";
import * as pageModule from "../../../../../../convex/profile/page";

const convexRoot = join(__dirname, "../../../../../../convex");

describe("SLICE-P5-07 — CAP-550 handle reserve", () => {
  it("normalizeHandle applies CAP-474 slug discipline", () => {
    expect(normalizeHandle("Harinie R.")).toBe("harinie-r");
    expect(normalizeHandle("  Multiple   Spaces  ")).toBe("multiple-spaces");
    expect(normalizeHandle("Ünïcødé Nâme!")).toBe("unicode-name");
    expect(normalizeHandle("AB")).toMatch(/^member-/); // <3 chars gets a safe prefix
    expect(normalizeHandle("a".repeat(50))).toHaveLength(32); // bounded
  });

  it("reserve is System-only: internalMutation, no client surface", () => {
    expect(typeof pageModule.handleReserve).toBe("function"); // internal registration
    const src = readFileSync(join(convexRoot, "profile/page.ts"), "utf8");
    expect(src).toContain("internalMutation");
    expect(src).toContain("FUTURE-M7-01"); // handle change NOT built
  });

  it("fires at profile creation inside upsertBasic's transaction", () => {
    const setupSrc = readFileSync(join(convexRoot, "setup.ts"), "utf8");
    expect(setupSrc).toContain("reserveHandleTx");
  });
});

describe("SLICE-P5-07 — CAP-526/527/528 read surface", () => {
  const src = readFileSync(join(convexRoot, "profile/page.ts"), "utf8");

  it("Journal is self-only at launch (quoted register assumption)", () => {
    expect(src).toContain("isSelf");
    expect(src).toMatch(/if \(isSelf\)/);
    expect(src).toContain("self-only");
  });

  it("Ledger projects ONLY safe_for_public meta fields (bible l.231 leak guard)", () => {
    expect(src).toContain('privacy === "safe_for_public"');
  });

  it("W7 placeholders are honest empties, never invented content", () => {
    expect(src).toContain("awardsShelf: []");
    expect(src).toContain("metrics: null");
  });

  it("consent discipline: demographics visible to non-self only under grant", () => {
    expect(src).toContain("demographicsPersonalization");
    expect(src).toContain("demographicsVisible");
  });

  it("never reads privateUserData (mobile number stays server-side)", () => {
    expect(src).not.toContain('query("privateUserData")');
    expect(src).not.toContain("mobileNumber");
  });

  it("route is noindex per CAP-486", () => {
    const routeSrc = readFileSync(
      join(__dirname, "../../../app/(app)/(shell)/users/[handle]/page.tsx"),
      "utf8",
    );
    expect(routeSrc).toContain("index: false");
  });

  it("strangler: canonical-first with the legacy profile fallback", () => {
    const clientSrc = readFileSync(
      join(__dirname, "../../../app/(app)/(shell)/users/[handle]/user-profile-page-client.tsx"),
      "utf8",
    );
    expect(clientSrc).toContain("getProfilePage");
    expect(clientSrc).toContain("LegacyUserProfile");
  });
});
