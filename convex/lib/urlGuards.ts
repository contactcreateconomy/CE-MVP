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

// SECURITY (scan 2026-09-13, finding 6): the range list was string-prefix
// based and missed several reserved ranges: 127.0.0.0/8 (only .1 was
// blocked), IPv4-mapped IPv6 (::ffff:10.0.0.1 etc.), 0.0.0.0/8, and the
// full current IPv6 reserved allocations. Normalized to a canonical IPv4
// or pure-IPv6 form, then classified numerically — no prefix matching.
function normalizeIp(ip: string): { v4: number[] | null; v6: string | null } {
  const raw = ip.trim().toLowerCase();
  // IPv4-mapped IPv6: ::ffff:a.b.c.d → classify as IPv4
  const mapped = raw.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return { v4: mapped[1].split(".").map(Number), v6: null };
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(raw)) return { v4: raw.split(".").map(Number), v6: null };
  if (raw.includes(":")) return { v4: null, v6: raw };
  return { v4: null, v6: null };
}

function isBlockedIpv4(o: number[]): boolean {
  const [a, b] = o;
  return (
    a === 0 ||                                  // 0.0.0.0/8 ("this host")
    a === 10 ||                                 // 10.0.0.0/8 private
    a === 127 ||                                // 127.0.0.0/8 loopback (FULL /8)
    (a === 100 && b >= 64 && b <= 127) ||       // 100.64.0.0/10 CGNAT
    (a === 169 && b === 254) ||                 // 169.254.0.0/16 link-local + metadata
    (a === 172 && b >= 16 && b <= 31) ||        // 172.16.0.0/12 private
    (a === 192 && b === 168) ||                 // 192.168.0.0/16 private
    (a === 192 && b === 0) ||                   // 192.0.0.0/24 + 192.0.2.0/24
    (a === 198 && (b === 18 || b === 19)) ||    // 198.18.0.0/15 benchmark
    (a === 198 && b === 51) ||                  // 198.51.100.0/24 doc
    (a === 203 && b === 0) ||                   // 203.0.113.0/24 doc
    (a >= 224)                                  // multicast + 240.0.0.0/4 reserved + broadcast
  );
}

function isBlockedIpv6(v6: string): boolean {
  // NAT64/IPv4-translated prefix first (64:ff9b::/96 etc. can END in an
  // embedded v4 tail — the tail check below would otherwise classify the
  // embedded PUBLIC v4 as allowed and mask the reserved prefix).
  const firstGroupNat = parseInt(v6.split(":")[0] || "0", 16) || 0;
  if (firstGroupNat === 0x64) return true; // 64:… NAT64 well-known prefix
  // Handle embedded IPv4 in IPv6 tails (::ffff:… handled above; also x:x:…:a.b.c.d)
  const tailV4 = v6.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (tailV4) return isBlockedIpv4(tailV4[1].split(".").map(Number));
  // Compare the FIRST GROUP (16-bit) — /N allocations are group-scoped:
  const firstGroup = firstGroupNat;
  return (
    v6 === "::" ||                              // unspecified
    v6 === "::1" ||                             // loopback
    firstGroup === 0x100 ||                     // 100::/64 discard-only
    (firstGroup === 0x2001 && v6.startsWith("2001:db8")) || // 2001:db8::/32 doc
    (firstGroup >= 0xfc00 && firstGroup <= 0xfdff) || // fc00::/7 unique-local
    (firstGroup >= 0xfe80 && firstGroup <= 0xfebf) || // fe80::/10 link-local
    firstGroup >= 0xff00                        // ff00::/8 multicast
  );
}

export function isBlockedIp(ip: string): boolean {
  const { v4, v6 } = normalizeIp(ip);
  if (v4) return isBlockedIpv4(v4);
  if (v6) return isBlockedIpv6(v6);
  return true; // unrecognized form → fail-closed block
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

// ── CAP-087 (R-URL) — the composer-body URL predicate ────────────────────
// This module is the one zero-dependency pure layer BOTH runtimes can
// import (server functions and the browser composer bundle), so the shared
// client affordance lives here. The list below mirrors posts.ts's
// URL_PATTERNS 1:1 (the gate createPost/updatePost run BEFORE persistence,
// rejecting with POST_URL_NOT_ALLOWED). posts.ts keeps its own list (that
// file is not editable in this pass); the parity test in
// apps/forum/src/components/new-post/__tests__/composer-affordances.test.ts
// runs both over a corpus and fails on any divergence, so the mirror
// cannot drift from the enforced rule. Server behavior is unchanged —
// nothing server-side calls these.
export const R_URL_BODY_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /www\./i,
  /\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/i, // bare domain.tld — alpha TLD ≥2 chars, so decimals ("4.5", "v1.2") don't match
  /\s*\(\s*(?:dot|\.)\s*\)\s*/i,   // obfuscation: "example (dot) com"
  /\s*\[\s*(?:dot|\.)\s*\]\s*/i,
];

/**
 * CAP-087 client mirror — true when the body string trips R-URL. The
 * server rejects such bodies with the verbatim
 * "POST_URL_NOT_ALLOWED: user posts cannot contain URLs (CAP-087)" — the
 * composer surfaces that same string so what it offers/validates is
 * exactly what the server accepts.
 */
export function bodyContainsDisallowedUrl(body: string): boolean {
  return R_URL_BODY_PATTERNS.some((pattern) => pattern.test(body));
}
