import { describe, it, expect } from "vitest";

/* SLICE-P2-06 routing convention + P2-04/05/08 acceptance spot-checks. */

import { getRoutingRedirect, isProtectedRoute } from "@/lib/routing";

describe("SLICE-P2-06 — Platform-Wide Routing Convention (F-15)", () => {
  it("Rule 1: anonymous on protected route → /signin", () => {
    expect(getRoutingRedirect("/profile", "anonymous", undefined)).toBe("/signin");
    expect(getRoutingRedirect("/settings", "anonymous", undefined)).toBe("/signin");
    expect(getRoutingRedirect("/new-post", "anonymous", undefined)).toBe("/signin");
  });

  it("Rule 1: anonymous on public route → stays", () => {
    expect(getRoutingRedirect("/", "anonymous", undefined)).toBeNull();
    expect(getRoutingRedirect("/signin", "anonymous", undefined)).toBeNull();
    expect(getRoutingRedirect("/waitlist", "anonymous", undefined)).toBeNull();
    expect(getRoutingRedirect("/feed", "anonymous", undefined)).toBeNull();
    expect(getRoutingRedirect("/privacy", "anonymous", undefined)).toBeNull();
  });

  it("Rule 2 retired: pending_context never redirects to /welcome", () => {
    expect(getRoutingRedirect("/feed", "authenticated", "pending_context")).toBeNull();
    expect(getRoutingRedirect("/profile", "authenticated", "pending_context")).toBeNull();
  });

  it("retired /welcome: authenticated visitors (any bootstrap) go to /feed", () => {
    expect(getRoutingRedirect("/welcome", "authenticated", "pending_context")).toBe("/feed");
    expect(getRoutingRedirect("/welcome", "authenticated", "complete")).toBe("/feed");
  });

  it("Rule 3: authenticated on /signin → /feed; on /waitlist → /feed", () => {
    expect(getRoutingRedirect("/signin", "authenticated", "complete")).toBe("/feed");
    expect(getRoutingRedirect("/signin", "authenticated", "pending_context")).toBe("/feed");
    expect(getRoutingRedirect("/waitlist", "authenticated", "complete")).toBe("/feed");
  });

  it("Rule 3: complete on non-pref route → stays", () => {
    expect(getRoutingRedirect("/feed", "authenticated", "complete")).toBeNull();
    expect(getRoutingRedirect("/profile", "authenticated", "complete")).toBeNull();
  });

  it("isProtectedRoute: public routes are not protected", () => {
    expect(isProtectedRoute("/")).toBe(false);
    expect(isProtectedRoute("/signin")).toBe(false);
    expect(isProtectedRoute("/privacy")).toBe(false);
    expect(isProtectedRoute("/profile")).toBe(true);
    expect(isProtectedRoute("/new-post")).toBe(true);
  });

  // Screen audit 2026-09-18 regression lock: RoutingGuard is mounted at
  // the true app root (apps/forum/src/app/layout.tsx), so `isProtectedRoute`
  // now gates EVERY route, not just /signin's own local check. A
  // PUBLIC_ROUTES allowlist model previously locked anonymous visitors
  // out of every contract-mandated anonymous surface below — these must
  // stay public (default-public, explicit protected-prefix list).
  it("default-public: every screen with a contract 'anonymous' actor branch is not protected", () => {
    for (const path of [
      "/tools", "/tools/some-slug",
      "/discussions/some-slug",
      "/personas", "/personas/abc123",
      "/search",
      "/resources", "/resources/some-slug/view",
      "/s/some-handle", "/s/some-handle/some-product",
      "/users/some-handle",
      "/go/some-link-id",
      "/legal/intake",
      "/about", "/help", "/how-we-review", "/editorial-policy",
      "/ai-disclosure", "/how-we-use-your-store-data",
      "/repeat-infringer", "/terms", "/dmca",
      "/discover", "/leaderboard",
    ]) {
      expect(isProtectedRoute(path)).toBe(false);
    }
  });

  it("protected prefixes cover dynamic sub-routes (e.g. /settings/profile, /sell/apply)", () => {
    expect(isProtectedRoute("/settings/profile")).toBe(true);
    expect(isProtectedRoute("/sell/apply")).toBe(true);
    expect(isProtectedRoute("/appeal/some-action-id")).toBe(true);
    expect(isProtectedRoute("/contribute")).toBe(true);
    expect(isProtectedRoute("/notifications")).toBe(true);
    expect(isProtectedRoute("/setup")).toBe(true);
    expect(isProtectedRoute("/drafts")).toBe(true);
  });
});
