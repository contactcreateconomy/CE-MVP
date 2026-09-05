/**
 * urlGuards — the PURE layer of R-SSRF ingress validation (CAP-061):
 * IP-range classification + URL syntax checks, with no Node APIs so both
 * the default Convex runtime (queries/mutations) and "use node" modules
 * (safeFetch) can import them. The DNS-resolving half lives in
 * safeFetch.ts ("use node"). SLICE-P1-10 / SLICE-P4-08.
 */

export type SafeFetchMode = "trusted_source_fetch" | "external_destination_probe";

export interface SafeFetchOptions {
  mode: SafeFetchMode;
  /** Required for external_destination_probe — the pinned IP. */
  pinnedIp?: string;
  maxRedirects?: number; // default 3, max 3 (CAP-010)
  maxBytes?: number; // default 10MB
  timeoutMs?: number; // default 10s
}

export interface SafeFetchResult {
  status: "ok" | "blocked" | "disabled" | "error";
  reason?: string;
  response?: unknown;
  finalUrl?: string;
}

const BLOCKED_RANGES = [
  { name: "loopback", test: (ip: string) => ip === "127.0.0.1" || ip === "::1" },
  { name: "private-a", test: (ip: string) => ip.startsWith("10.") },
  { name: "private-b", test: (ip: string) => { const p = ip.split("."); return p[0] === "172" && Number(p[1]) >= 16 && Number(p[1]) <= 31; } },
  { name: "private-c", test: (ip: string) => ip.startsWith("192.168.") },
  { name: "link-local", test: (ip: string) => ip.startsWith("169.254.") || ip.startsWith("fe80") },
  { name: "metadata", test: (ip: string) => ip === "169.254.169.254" },
  { name: "unique-local", test: (ip: string) => ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd") },
];

export function isBlockedIp(ip: string): boolean {
  return BLOCKED_RANGES.some((r) => r.test(ip));
}

/**
 * SLICE-P4-08 — syntactic R-SSRF ingress checks (pure, unit-tested):
 * HTTPS-only, credentials in the URL rejected, nonstandard ports rejected
 * (CAP-061 verbatim: "HTTPS-only; … block creds + nonstandard ports").
 * Used at registration (CAP-031) AND as the pre-flight of every fetch.
 */
export function validateUrlSyntax(url: string): { ok: true; hostname: string } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "not a valid URL" };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, reason: `HTTPS-only (R-SSRF): ${parsed.protocol}` };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "credentials in URL rejected (R-SSRF)" };
  }
  if (parsed.port && parsed.port !== "443") {
    return { ok: false, reason: `nonstandard port ${parsed.port} rejected (R-SSRF; https implies 443)` };
  }
  return { ok: true, hostname: parsed.hostname };
}
