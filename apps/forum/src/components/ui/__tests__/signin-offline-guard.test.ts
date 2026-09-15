import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* CODE-REVIEW PASS-2 regression: /signin was the next CI no-env prerender
 * blocker after /content/spark (PASS-1). Root provider deliberately omits
 * ConvexAuthProvider (@convex-dev/auth) when no Convex URL is configured,
 * so useAuthActions() returns undefined during prerender — the page must
 * not destructure it unguarded. Verified by `NEXT_PUBLIC_CONVEX_URL=""
 * pnpm build` (the exact CI condition). */

const forumRoot = join(__dirname, "../../../..");
const signinSrc = readFileSync(join(forumRoot, "src/app/(auth)/signin/page.tsx"), "utf8");
const providerSrc = readFileSync(join(forumRoot, "src/providers/convex-provider.tsx"), "utf8");

describe("signin no-env prerender guard (PASS-2)", () => {
  it("does not destructure useAuthActions() unguarded", () => {
    expect(signinSrc).not.toContain("const { signIn } = useAuthActions()");
    expect(signinSrc).toContain("authActions?.signIn");
  });

  it("every signIn call site is behind a provider guard", () => {
    // both callbacks start with the offline bail-out before awaiting signIn
    const guards = signinSrc.match(/if \(!signIn\) return; \/\/ no @convex-dev\/auth provider mounted \(offline\)/g);
    expect(guards?.length).toBe(2);
  });

  it("root provider still omits ConvexAuthProvider offline (the contract this guard honors)", () => {
    expect(providerSrc).toContain("ConvexProviderBase client={client}");
    expect(providerSrc).toContain("<ConvexAuthProvider client={client}>");
  });

  it("already-authenticated visitors are routed off /signin (app-shell rule 3)", () => {
    expect(signinSrc).toContain("getRoutingRedirect");
    expect(signinSrc).toContain("authStatus");
  });
});
