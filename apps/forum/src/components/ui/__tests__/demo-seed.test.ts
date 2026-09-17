import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEMO_EMAIL_DOMAIN } from "../../../../../../convex/dev/demoSeed";

const convexRoot = join(__dirname, "../../../../../../convex");
const seedSrc = readFileSync(join(convexRoot, "seed.ts"), "utf8");
const demoSrc = readFileSync(join(convexRoot, "dev/demoSeed.ts"), "utf8");

describe("demoSeed module fences", () => {
  it("does not live in seed.bootstrap (R-FOUNDER)", () => {
    expect(seedSrc).not.toContain("demoSeed");
    expect(seedSrc).not.toContain(DEMO_EMAIL_DOMAIN);
  });

  it("creates no auth login rows (display authors only)", () => {
    expect(demoSrc).not.toContain('insert("authAccounts"');
    expect(demoSrc).not.toContain("createAccount");
  });

  it("never sets isStaff on demo members", () => {
    expect(demoSrc).not.toMatch(/isStaff:\s*true/);
  });

  it("does not seed locked launch_pad or gigs types", () => {
    expect(demoSrc).not.toContain('"launch_pad"');
    expect(demoSrc).not.toContain('"gigs"');
  });

  it("wires review/compare toolIds from tool document ids, not slugs", () => {
    expect(demoSrc).toContain("toolDocIds");
    expect(demoSrc).toContain("pickedToolIds");
    expect(demoSrc).not.toMatch(/toolIds:\s*pickedSlugs/);
  });
});
