import { describe, it, expect, afterEach } from "vitest";
import { assertLocalDeployment } from "../../convex/seed/devGuard";

/* Server-side allowlist for the dev seed surface (S00-PREP review fix).
 * The guard reads the deployment's own client URL (CONVEX_CLOUD_URL built-in)
 * and accepts loopback ONLY — a deployment-type check, not a name denylist,
 * so any cloud deployment is refused regardless of its name. */

const REAL_KEY = "CONVEX_CLOUD_URL";

function withUrl(url: string | undefined, fn: () => void) {
  const saved = process.env[REAL_KEY];
  if (url === undefined) delete process.env[REAL_KEY];
  else process.env[REAL_KEY] = url;
  try {
    fn();
  } finally {
    if (saved === undefined) delete process.env[REAL_KEY];
    else process.env[REAL_KEY] = saved;
  }
}

afterEach(() => {
  // belt-and-braces: never leak a stubbed URL into other tests
  delete process.env[REAL_KEY];
});

describe("seed/devGuard assertLocalDeployment (server-side allowlist)", () => {
  it("accepts the local backend loopback URL (with port)", () => {
    withUrl("http://127.0.0.1:3210", () => {
      expect(() => assertLocalDeployment()).not.toThrow();
    });
  });

  it("accepts localhost by name, with or without a port", () => {
    withUrl("http://localhost:3210", () => {
      expect(() => assertLocalDeployment()).not.toThrow();
    });
    withUrl("http://localhost", () => {
      expect(() => assertLocalDeployment()).not.toThrow();
    });
  });

  it("refuses the named production deployment", () => {
    withUrl("https://energetic-kangaroo-55.convex.cloud", () => {
      expect(() => assertLocalDeployment()).toThrow(/dev guard: refusing/);
    });
  });

  it("refuses ANY cloud URL — not just the named prod (type check, not name match)", () => {
    for (const url of [
      "https://some-other-deployment.convex.cloud",
      "https://watchful-chameleon-570.convex.cloud",
      "https://example.com",
      "http://example.com:3210",
    ]) {
      withUrl(url, () => {
        expect(() => assertLocalDeployment()).toThrow(/dev guard: refusing/);
      });
    }
  });

  it("refuses loopback-lookalike hostnames (suffix/prefix tricks)", () => {
    for (const url of [
      "https://127.0.0.1.evil.example",
      "http://localhost.evil.example",
      "http://evil.example/127.0.0.1",
    ]) {
      withUrl(url, () => {
        expect(() => assertLocalDeployment()).toThrow(/dev guard: refusing/);
      });
    }
  });

  it("refuses when CONVEX_CLOUD_URL is unset", () => {
    withUrl(undefined, () => {
      expect(() => assertLocalDeployment()).toThrow(/dev guard: refusing/);
    });
  });
});
