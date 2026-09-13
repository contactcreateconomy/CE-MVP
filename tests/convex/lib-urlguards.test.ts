import { describe, it, expect } from "vitest";
import { isBlockedIp, validateUrlSyntax } from "../../convex/lib/urlGuards";

/* Convex unit tests — Testing-Strategy row 4.
 * urlGuards.ts pure layer of R-SSRF (CAP-061): IP-range classification +
 * URL syntax checks. (The R-URL body-pattern half is already parity-tested
 * in apps/forum composer-affordances.test.ts — not duplicated here.)
 */

describe("isBlockedIp (R-SSRF ranges)", () => {
  const blocked = [
    "127.0.0.1", "::1",                       // loopback
    "10.0.0.5", "10.255.255.255",             // private-a
    "172.16.0.1", "172.31.255.255",           // private-b
    "192.168.1.1",                            // private-c
    "169.254.1.1", "169.254.169.254",         // link-local + cloud metadata
    "fe80::1",                                // ipv6 link-local
    "fc00::1", "fd12:3456::1",                // ipv6 unique-local
  ];
  const allowed = [
    "8.8.8.8", "1.1.1.1", "172.32.0.1",      // public (172.32 is OUT of private-b)
    "172.15.0.1", "11.0.0.1", "203.0.113.7",
  ];

  it.each(blocked)("blocks %s", (ip) => {
    expect(isBlockedIp(ip)).toBe(true);
  });

  it.each(allowed)("allows %s", (ip) => {
    expect(isBlockedIp(ip)).toBe(false);
  });

  it("the private-b boundary is exact (16–31, not 15/32)", () => {
    expect(isBlockedIp("172.15.255.255")).toBe(false);
    expect(isBlockedIp("172.16.0.0")).toBe(true);
    expect(isBlockedIp("172.31.255.255")).toBe(true);
    expect(isBlockedIp("172.32.0.0")).toBe(false);
  });
});

describe("validateUrlSyntax (CAP-061 ingress checks)", () => {
  it("accepts a plain https URL and returns its hostname", () => {
    expect(validateUrlSyntax("https://example.com/path?q=1")).toEqual({
      ok: true,
      hostname: "example.com",
    });
  });

  it("accepts https on the implicit default port (no :443 in the string)", () => {
    expect(validateUrlSyntax("https://example.com:443/x")).toEqual({ ok: true, hostname: "example.com" });
  });

  it("rejects http (HTTPS-only)", () => {
    expect(validateUrlSyntax("http://example.com")).toEqual({
      ok: false,
      reason: expect.stringMatching(/HTTPS-only/),
    });
  });

  it("rejects other schemes outright", () => {
    for (const scheme of ["ftp://example.com", "file:///etc/passwd", "gopher://x"]) {
      expect(validateUrlSyntax(scheme).ok).toBe(false);
    }
  });

  it("rejects embedded credentials", () => {
    expect(validateUrlSyntax("https://user:pass@example.com")).toEqual({
      ok: false,
      reason: expect.stringMatching(/credentials/),
    });
  });

  it("rejects nonstandard ports", () => {
    expect(validateUrlSyntax("https://example.com:8443/x")).toEqual({
      ok: false,
      reason: expect.stringMatching(/nonstandard port 8443/),
    });
  });

  it("rejects garbage", () => {
    expect(validateUrlSyntax("not a url at all").ok).toBe(false);
    expect(validateUrlSyntax("").ok).toBe(false);
  });
});
