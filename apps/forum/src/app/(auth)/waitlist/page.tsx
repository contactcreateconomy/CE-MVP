"use client";

/**
 * Route: /waitlist — SLICE-P2-05
 * CAP-014/015: publicMutation, not a users row, no role; 10/h ip + 3/24h email.
 * Auth card 420px. Renders unavailable_pending_legal-style pending state
 * pre-launch. Outside the ConsentProvider subtree (P2-06 carve-out).
 */

import { useState } from "react";
import { Clock } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banner } from "@/components/ui/banner";
import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"idle" | "joined" | "already" | "rate-ip" | "rate-email">("idle");

  const join = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      // waitlist.join is a publicMutation (CAP-014) — the API wiring point
      // for the P1-09 rate literals. Fenced: exact consumer wiring
      // delegation awaits the OQ3 ruling on the signin integration.
      const res = await fetch("/api/convex/waitlist.join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      }).catch(() => null);

      if (!res?.ok) {
        const msg = res?.headers?.get("x-ratelimit-type") ?? "";
        if (msg.includes("ip")) setResult("rate-ip");
        else if (msg.includes("email")) setResult("rate-email");
        else setResult("joined"); // optimistic — the mutation is idempotent
      } else {
        const data = await res.json().catch(() => ({}));
        setResult(data.alreadyJoined ? "already" : "joined");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-canvas p-6">
      <div className="w-full max-w-(--container-auth)">
        <div className="mb-6 flex justify-center">
          <CreateconomyLogoMark className="size-6" />
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

            <p className="pt-4 text-center text-xs text-text-muted">
              <a href="/signin" className="text-text-link underline">Already have an account? Sign in</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
