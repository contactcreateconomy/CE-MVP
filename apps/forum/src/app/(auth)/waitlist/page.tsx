"use client";

/**
 * Route: /waitlist — SLICE-P2-05
 * CAP-014/015: publicMutation, not a users row, no role; 10/h ip + 3/24h email.
 * Auth card 420px. Renders unavailable_pending_legal-style pending state
 * pre-launch. Outside the ConsentProvider subtree (P2-06 carve-out).
 */

import { useState } from "react";
import { useMutation } from "convex/react";
import { Clock } from "lucide-react";

import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banner } from "@/components/ui/banner";
import { CreateconomyLogoFull } from "@/components/ui/createconomy-logo-full";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"idle" | "joined" | "already" | "rate-ip" | "rate-email">("idle");
  // Reject-not-UI-hide: any server rejection the page cannot map to a
  // contract state (3/4) is surfaced verbatim here — never a fake success.
  const [serverError, setServerError] = useState<string | null>(null);
  // waitlist.join is a publicMutation (CAP-014) — rate-limited + validated
  // server-side (CAP-015 literals live in the mutation, not the client).
  const joinWaitlist = useMutation(api.waitlist.join);

  const join = async () => {
    if (!email.trim()) return;
    if (!isConvexConfigured()) {
      setServerError("Convex is not configured.");
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await joinWaitlist({ email: email.trim().toLowerCase() });
      setResult(res.alreadyJoined ? "already" : "joined");
    } catch (err) {
      // CAP-015 rejections carry the limit name in the thrown message
      // ("rate_limit: waitlist.join.email exceeded (…)") — map those to the
      // contract's States 3/4; everything else surfaces verbatim.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("waitlist.join.ip")) setResult("rate-ip");
      else if (msg.includes("waitlist.join.email")) setResult("rate-email");
      else setServerError(msg || "Could not join the waitlist.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-canvas p-6">
      <div className="w-full max-w-(--container-auth)">
        <div className="mb-6 flex justify-center">
          <CreateconomyLogoFull />
        </div>

        <Card>
          <CardHeader className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">Join the waitlist</h1>
            <p className="text-sm text-text-secondary">
              We&apos;ll notify you when a spot opens up. No account needed.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {result === "idle" || result === "rate-ip" || result === "rate-email" ? (
              <>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <Button className="w-full" onClick={join} loading={submitting} disabled={!email.trim()}>
                  Join waitlist
                </Button>
              </>
            ) : null}

            {result === "joined" && (
              <Banner variant="success">
                You&apos;re on the list. We&apos;ll be in touch when a spot opens.
              </Banner>
            )}
            {result === "already" && (
              <Banner variant="info">This email is already on the waitlist.</Banner>
            )}
            {result === "rate-ip" && (
              <Banner variant="warning" role="alert">
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4" /> Too many sign-ups from this network. Try again later.
                </span>
              </Banner>
            )}
            {result === "rate-email" && (
              <Banner variant="warning" role="alert">
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4" /> This email has already joined recently.
                </span>
              </Banner>
            )}
            {serverError && (
              <Banner variant="warning" role="alert">
                {serverError}
              </Banner>
            )}

            <p className="pt-4 text-center text-xs text-text-muted">
              <a href="/signin" className="text-text-link underline">Already have an account? Sign in</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
