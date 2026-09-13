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
 *
 * SECURITY (scan 2026-09-13, findings 28/29): the webhook previously had
 * NO size/content-type/field bounds and compared the shared secret with a
 * plain !== (timing leak). Order is now: secret FIRST (constant-time,
 * after SHA-256 both sides — digesting makes the compare length-uniform),
 * then size/content-type/shape/field caps, then the internal action.
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
    // 1. Auth FIRST — no parse work, no validation detail for callers
    //    without the secret.
    const secret = process.env.INBOUND_EMAIL_SECRET;
    if (!secret) {
      return new Response("inbound email ingress not configured", { status: 503 });
    }
    // SECURITY (finding 29): constant-time compare. SHA-256 both sides so
    // the byte-by-byte loop runs over equal-length digests (a direct
    // timingSafeEqual over attacker-controlled length leaks length).
    const provided = request.headers.get("x-ingest-secret") ?? "";
    const enc = new TextEncoder();
    const [a, b] = await Promise.all([
      globalThis.crypto.subtle.digest("SHA-256", enc.encode(provided)),
      globalThis.crypto.subtle.digest("SHA-256", enc.encode(secret)),
    ]);
    const aBytes = new Uint8Array(a);
    const bBytes = new Uint8Array(b);
    let secretOk = aBytes.length === bBytes.length;
    if (secretOk) {
      for (let i = 0; i < aBytes.length; i++) secretOk = secretOk && aBytes[i] === bBytes[i];
    }
    if (!secretOk) {
      return new Response("unauthorized", { status: 401 });
    }

    // 2. Transport/shape gates (finding 28) — bounded parse surface only.
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart")) {
      return new Response("attachments rejected (CAP-035)", { status: 415 });
    }
    if (!contentType.includes("application/json")) {
      return new Response("content-type must be application/json", { status: 415 });
    }
    // Request-size cap before the JSON parse — an unbounded payload could
    // memory-pressure the isolate.
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 256 * 1024) {
      return new Response("payload too large", { status: 413 });
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
    // Field bounds — cap every string field (the downstream slice(0,100_000)
    // capped only the extracted text).
    if (
      payload.from.length > 320 ||
      payload.to.length > 320 ||
      (payload.subject ?? "").length > 998 ||
      payload.text.length > 200_000
    ) {
      return new Response("field length exceeded", { status: 413 });
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
