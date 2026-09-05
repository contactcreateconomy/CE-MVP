/**
 * showcase — SLICE-P4-15: the controlled outbound URL (CAP-100).
 *
 * CAP-100 Notes (quoted): "Server-side: normalized hostname, HTTPS required
 *   … NO preview fetch (SSRF). Fail-closed if allowlist missing." — the
 *   allowlist is systemConfig `showcase.allowedDomains` (exact host OR
 *   `.endsWith("."+domain)`); embedded credentials, IP literals,
 *   localhost/private/reserved ranges and unauthorized subdomains are all
 *   rejected. approvalStatus flips to pending; moderator approve/reject is
 *   P7E-13 CAP-101 — never invented here (and P7E-13 stops fixturing these
 *   writers now that they exist).
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "../lib/authz";

function isIpLiteral(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":"); // v4 or v6 literal
}

function isReservedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".internal") ||
    h.endsWith(".local" ) ||
    isIpLiteral(h)
  );
}

/** CAP-100 — the full server-side URL admission check. */
export function validateProjectUrl(
  url: string,
  allowlist: string[],
): { ok: true; hostname: string } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { ok: false, reason: "not a valid URL" };
  }
  if (parsed.protocol !== "https:") return { ok: false, reason: "HTTPS required (CAP-100)" };
  if (parsed.username || parsed.password) return { ok: false, reason: "embedded credentials rejected (CAP-100)" };
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, ""); // normalized: lowercase, strip FQDN dot
  if (isReservedHost(hostname)) return { ok: false, reason: `host "${hostname}" is an IP literal / localhost / reserved (CAP-100)` };
  const allowed = allowlist.some((domain) => {
    const d = domain.toLowerCase().replace(/\.$/, "");
    return hostname === d || hostname.endsWith("." + d); // exact host OR authorized subdomain
  });
  if (!allowed) return { ok: false, reason: `host "${hostname}" is not on showcase.allowedDomains (CAP-100)` };
  return { ok: true, hostname };
}

/** CAP-100 — submit the project URL for operator approval. */
export const submitProjectUrl = mutation({
  args: { postId: v.id("posts"), projectUrl: v.string() },
  handler: async (ctx, args) => {
    await assertCustomerCapability(ctx, "create_post");
    const userId = (await getAuthUserId(ctx)) as Id<"users">;
    if (!userId) throw new Error("showcase.submitProjectUrl: authentication required");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("showcase.submitProjectUrl: post not found");
    if (post.type !== "showcase") throw new Error("showcase.submitProjectUrl: not a showcase post");
    if (post.authorUserId !== userId) throw new Error("showcase.submitProjectUrl: not the author");

    // Fail-closed if the allowlist is missing (CAP-100 — quoted rule)
    const config = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", "showcase.allowedDomains"))
      .first();
    if (!config) {
      throw new Error("showcase.submitProjectUrl: showcase.allowedDomains is not configured — fail-closed (CAP-100)");
    }
    const allowlist = Array.isArray(config.value) ? (config.value as string[]) : [];
    const check = validateProjectUrl(args.projectUrl, allowlist);
    if (!check.ok) throw new Error(`showcase.submitProjectUrl: ${check.reason}`);

    const row = await ctx.db
      .query("postShowcases")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .unique();
    if (!row) throw new Error("showcase.submitProjectUrl: postShowcases row not found");

    await ctx.db.patch(row._id, { projectUrl: args.projectUrl, approvalStatus: "pending" });
    return { approvalStatus: "pending" };
  },
});
