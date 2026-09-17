import { describe, it, expect } from "vitest";
import {
  demoEmail,
  demoSeedBlockedReason,
  DEMO_EMAIL_DOMAIN,
  PROD_DEPLOYMENT_SLUG,
} from "../../convex/dev/demoSeed";

describe("demoSeed gates (dest-only)", () => {
  it("blocks when DEMO_SEED_ENABLED is unset", () => {
    expect(demoSeedBlockedReason({})).toMatch(/DEMO_SEED_ENABLED/);
  });

  it("blocks the production Convex slug even when the flag is on", () => {
    expect(
      demoSeedBlockedReason({
        DEMO_SEED_ENABLED: "true",
        CONVEX_CLOUD_URL: `https://${PROD_DEPLOYMENT_SLUG}.convex.cloud`,
      }),
    ).toMatch(/production/);
  });

  it("blocks the production forum host", () => {
    expect(
      demoSeedBlockedReason({
        DEMO_SEED_ENABLED: "true",
        SITE_URL: "https://discuss.createconomy.com",
      }),
    ).toMatch(/production/);
  });

  it("allows dest when the flag is on and the URL is the chameleon deployment", () => {
    expect(
      demoSeedBlockedReason({
        DEMO_SEED_ENABLED: "true",
        CONVEX_CLOUD_URL: "https://watchful-chameleon-570.convex.cloud",
        SITE_URL: "http://localhost:3000",
      }),
    ).toBeNull();
  });

  it("demo emails use the reserved invalid domain", () => {
    expect(demoEmail("maya")).toBe(`maya@${DEMO_EMAIL_DOMAIN}`);
  });
});
