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

  it("Rule 2: pending_context on ≠ /welcome → /welcome", () => {
    expect(getRoutingRedirect("/feed", "authenticated", "pending_context")).toBe("/welcome");
    expect(getRoutingRedirect("/profile", "authenticated", "pending_context")).toBe("/welcome");
  });

  it("Rule 2: pending_context on /welcome → stays", () => {
    expect(getRoutingRedirect("/welcome", "authenticated", "pending_context")).toBeNull();
  });

  it("Rule 3: complete on /signin → /feed; on /waitlist → /feed; on /welcome → /feed", () => {
    expect(getRoutingRedirect("/signin", "authenticated", "complete")).toBe("/feed");
    expect(getRoutingRedirect("/waitlist", "authenticated", "complete")).toBe("/feed");
    expect(getRoutingRedirect("/welcome", "authenticated", "complete")).toBe("/feed");
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
});
