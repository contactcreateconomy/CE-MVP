import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * SLICE-P4-08 — CAP-035 ingest.inboundEmail (authenticated webhook).
 * Register Notes (quoted): "httpAction; SPF/DKIM/DMARC-verified +
 * allowlisted senders; strip tracking pixels; reject attachments."
 *
 * Provider seam (env-gated, fail-closed): SPF/DKIM/DMARC verification is
 * the EMAIL-INGRESS PROVIDER's job — the provider posts here only after
 * verification, authenticated by a shared secret. Without
 * INBOUND_EMAIL_SECRET configured the hook 503s (nothing accepts
 * unauthenticated inbound mail). Tracking pixels (<img> tags) are stripped;
 * multipart/attachment payloads are rejected.
 */
http.route({
  path: "/ingest/inboundEmail",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204 })),
});

http.route({
  path: "/ingest/inboundEmail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.INBOUND_EMAIL_SECRET;
    if (!secret) {
      return new Response("inbound email ingress not configured", { status: 503 });
    }
    const provided = request.headers.get("x-ingest-secret");
    if (provided !== secret) {
      return new Response("unauthorized", { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart")) {
      return new Response("attachments rejected (CAP-035)", { status: 415 });
    }

    let payload: { from?: string; to?: string; subject?: string; text?: string; receivedAt?: number };
    try {
      payload = await request.json();
    } catch {
      return new Response("invalid JSON", { status: 400 });
    }
    if (!payload.from || !payload.to || !payload.text) {
      return new Response("from/to/text required", { status: 400 });
    }

    const { internal } = await import("./_generated/api");
    const result = await ctx.runAction(internal.ingest.pollers.ingestInboundEmail, {
      from: payload.from,
      to: payload.to,
      subject: payload.subject ?? "(no subject)",
      text: payload.text,
      receivedAt: payload.receivedAt ?? Date.now(),
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
});

export default http;
