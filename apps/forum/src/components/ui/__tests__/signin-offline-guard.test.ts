import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* /signin uses the shared AuthModal (same as admin). Offline/no-env
 * prerender must not crash: the page must not call useAuthActions()
 * (ConvexAuthProvider is omitted without a Convex URL). */

const forumRoot = join(__dirname, "../../../..");
const signinSrc = readFileSync(join(forumRoot, "src/app/(auth)/signin/page.tsx"), "utf8");
const providerSrc = readFileSync(join(forumRoot, "src/providers/convex-provider.tsx"), "utf8");

describe("signin no-env prerender guard (PASS-2)", () => {
  it("does not call useAuthActions (AuthModal owns Convex Auth)", () => {
    expect(signinSrc).not.toContain("useAuthActions");
    expect(signinSrc).toContain("openAuthModal");
  });

  it("root provider still omits ConvexAuthProvider offline (the contract this guard honors)", () => {
    expect(providerSrc).toContain("ConvexProviderBase client={client}");
    expect(providerSrc).toContain("<ConvexAuthProvider client={client}>");
  });

  it("already-authenticated visitors are routed off /signin", () => {
    expect(signinSrc).toContain('router.replace("/feed")');
    expect(signinSrc).toContain("authStatus");
  });
});
