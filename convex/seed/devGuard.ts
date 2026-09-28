/**
 * devGuard — server-side allowlist for dev-only seed tooling (R3 review
 * fix). Functions can observe their deployment's real client URL through
 * the CONVEX_CLOUD_URL built-in: a loopback URL is the only shape the
 * dev-seed surface may ever run against. This is a deployment-type check,
 * not a prod-name denylist — any cloud deployment (named or not) is
 * refused.
 */
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export function assertLocalDeployment(): void {
  const url = process.env.CONVEX_CLOUD_URL ?? "";
  if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
    throw new Error(
      `dev guard: refusing to run — this deployment's CONVEX_CLOUD_URL is ${url || "unset"}, ` +
        `expected a loopback URL (http://127.0.0.1:<port> or http://localhost:<port>). ` +
        `Dev seed tooling must never execute against a cloud deployment.`,
    );
  }
}

/** CLI preflight target: `convex run seed/devGuard:assertLocal --watch`
 * returns a positive confirmation the scripts parse strictly —
 * `{ ok: true, url }` with a loopback url. Refusal still throws. */
export const assertLocal = internalQuery({
  args: {},
  returns: v.object({ ok: v.boolean(), url: v.string() }),
  handler: async () => {
    assertLocalDeployment();
    return { ok: true, url: process.env.CONVEX_CLOUD_URL ?? "" };
  },
});
