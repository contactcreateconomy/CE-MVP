"use node";

/**
 * safeFetch — SLICE-P1-10: SSRF-safe fetch helper (CAP-010/011, R-SSRF).
 *
 * bible l.15 (quoted): "resolve + validate every fetch IP (block
 * private/link-local/loopback/metadata), HTTPS-only, revalidate redirects,
 * cap size/hops, isolated egress." Two modes: trusted_source_fetch (M2
 * ingestion) + external_destination_probe (M11 link validation).
 *
 * CAP-010: "Pin IP; max 3 redirects revalidated; no pin ⇒ disable arbitrary
 * probe (M11 → manual review degrade)." — an unpinned probe returns
 * `{ status: "disabled" }`, never a best-effort fetch.
 */

import * as dnsPromises from "node:dns/promises";
import { isBlockedIp, validateUrlSyntax, type SafeFetchMode, type SafeFetchOptions, type SafeFetchResult } from "./urlGuards";

// Pure helpers re-exported for existing "use node" importers (ingest/pollers)
// and tests; default-runtime importers must import from ./urlGuards directly.
export { isBlockedIp, validateUrlSyntax } from "./urlGuards";
export type { SafeFetchMode, SafeFetchOptions, SafeFetchResult } from "./urlGuards";

async function resolveAndValidate(hostname: string): Promise<string[]> {
  const records = await dnsPromises.lookup(hostname, { all: true });
  const ips = records.map((r: { address: string }) => r.address);
  for (const ip of ips) {
    if (isBlockedIp(ip)) {
      throw new Error(`SSRF blocked: ${hostname} resolves to ${ip} (private/loopback/metadata range)`);
    }
  }
  return ips;
}

export async function safeFetch(url: string, options: SafeFetchOptions): Promise<SafeFetchResult> {
  const maxRedirects = Math.min(options.maxRedirects ?? 3, 3); // CAP-010: max 3
  const maxBytes = options.maxBytes ?? 10 * 1024 * 1024;
  const timeoutMs = options.timeoutMs ?? 10_000;

  // CAP-011: "probe disabled if no IP pin"
  if (options.mode === "external_destination_probe" && !options.pinnedIp) {
    return { status: "disabled", reason: "CAP-010: no pinned IP ⇒ arbitrary probe disabled (M11 → manual review degrade)" };
  }

  let currentUrl = url;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const syntax = validateUrlSyntax(currentUrl);
    if (!syntax.ok) {
      return { status: "blocked", reason: syntax.reason };
    }
    const parsed = new URL(currentUrl);

    let ips: string[];
    try {
      ips = await resolveAndValidate(parsed.hostname);
    } catch (e) {
      return { status: "blocked", reason: (e as Error).message };
    }

    // For probes: the resolved IP must match the pin
    if (options.mode === "external_destination_probe" && options.pinnedIp) {
      if (!ips.includes(options.pinnedIp)) {
        return { status: "blocked", reason: `IP drift: pinned ${options.pinnedIp}, resolved [${ips.join(", ")}]` };
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(currentUrl, {
        redirect: "manual", // revalidate each hop ourselves
        signal: controller.signal,
        headers: { "user-agent": "Createconomy-SafeFetch/1.0" },
      });
      clearTimeout(timer);

      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        currentUrl = new URL(res.headers.get("location")!, currentUrl).href;
        continue; // each hop re-validated through the loop
      }

      const contentLength = Number(res.headers.get("content-length") ?? 0);
      if (contentLength > maxBytes) {
        return { status: "blocked", reason: `size cap: ${contentLength} > ${maxBytes}` };
      }
      return { status: "ok", response: res.status, finalUrl: currentUrl };
    } catch (e) {
      clearTimeout(timer);
      return { status: "error", reason: (e as Error).message };
    }
  }
  return { status: "blocked", reason: `redirect cap exceeded (>${maxRedirects} hops)` };
}

/**
 * SLICE-P4-08 — body-returning variant for the ingestion pollers: same
 * R-SSRF discipline (per-hop validation, redirects, caps), reads the body
 * with the byte cap enforced while streaming (never buffers past maxBytes).
 */
export async function safeFetchText(
  url: string,
  options: SafeFetchOptions,
): Promise<SafeFetchResult & { text?: string }> {
  const maxBytes = options.maxBytes ?? 10 * 1024 * 1024;
  const result = await safeFetchTextInner(url, options, maxBytes);
  return result;
}

async function safeFetchTextInner(
  url: string,
  options: SafeFetchOptions,
  maxBytes: number,
): Promise<SafeFetchResult & { text?: string }> {
  const maxRedirects = Math.min(options.maxRedirects ?? 3, 3);
  const timeoutMs = options.timeoutMs ?? 10_000;

  let currentUrl = url;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const syntax = validateUrlSyntax(currentUrl);
    if (!syntax.ok) return { status: "blocked", reason: syntax.reason };
    let ips: string[];
    try {
      ips = await resolveAndValidate(new URL(currentUrl).hostname);
    } catch (e) {
      return { status: "blocked", reason: (e as Error).message };
    }
    if (options.mode === "external_destination_probe" && options.pinnedIp && !ips.includes(options.pinnedIp)) {
      return { status: "blocked", reason: `IP drift: pinned ${options.pinnedIp}` };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "Createconomy-SafeFetch/1.0" },
      });
      clearTimeout(timer);
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        currentUrl = new URL(res.headers.get("location")!, currentUrl).href;
        continue;
      }
      if (!res.ok && res.status !== 200) {
        return { status: "error", reason: `HTTP ${res.status}` };
      }
      const reader = res.body?.getReader();
      if (!reader) return { status: "error", reason: "no response body" };
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          return { status: "blocked", reason: `size cap: body exceeded ${maxBytes} bytes` };
        }
        chunks.push(value);
      }
      const text = new TextDecoder().decode(concat(chunks));
      return { status: "ok", response: res.status, finalUrl: currentUrl, text };
    } catch (e) {
      clearTimeout(timer);
      return { status: "error", reason: (e as Error).message };
    }
  }
  return { status: "blocked", reason: `redirect cap exceeded (>${maxRedirects} hops)` };
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}
