"use node";

/**
 * sourcesValidate — registration-time full R-SSRF validation (DNS + IP),
 * CAP-031/CAP-061. Split from sources.ts because node:dns requires the
 * "use node" runtime, while sources' queries/mutations stay on the default
 * runtime. The console calls this before upsert; the mutation independently
 * enforces the syntactic layer (lib/urlGuards) so no path skips it.
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { validateUrlSyntax } from "./lib/urlGuards";
import { safeFetch } from "./lib/safeFetch";

export const validateSourceUrl = action({
  args: { url: v.string() },
  handler: async (_ctx, { url }): Promise<{ ok: boolean; reason?: string; domain?: string }> => {
    const syntax = validateUrlSyntax(url);
    if (!syntax.ok) return { ok: false, reason: syntax.reason };
    const probe = await safeFetch(url, { mode: "trusted_source_fetch", maxBytes: 64 * 1024 });
    if (probe.status === "blocked" || probe.status === "error") {
      return { ok: false, reason: probe.reason ?? `${probe.status} (R-SSRF ingress)` };
    }
    return { ok: true, domain: new URL(url).hostname };
  },
});
