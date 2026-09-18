"use client";

/**
 * Route: /signin — forum auth entry.
 *
 * Founder override 2026-09-18: the dedicated magic-link/email-code card is
 * retired. Forum uses the same `@cemvp/auth-ui` AuthModal as the admin
 * app (email/password + Google/GitHub). Waitlist/closed admission modes
 * still render here (CAP-001); existing members can always open the
 * modal (existing-user bypass). Authenticated visitors go to `/feed`.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@cemvp/auth-ui";
import { isConvexConfigured } from "@cemvp/convex-client";
import { AlertCircle, Clock } from "lucide-react";

import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banner } from "@/components/ui/banner";
import { CreateconomyLogoFull } from "@/components/ui/createconomy-logo-full";

type GateState =
  | "checking"
  | "open"
  | "waitlist"
  | "waitlist-joined"
  | "waitlist-already"
  | "waitlist-rate-ip"
  | "waitlist-rate-email"
  | "waitlist-error"
  | "closed";

export default function SigninPage() {
  const router = useRouter();
  const configured = isConvexConfigured();
  const { authStatus, openAuthModal } = useAuth();

  const admissionMode = useQuery(
    api.admission.getEffectiveMode,
    configured ? {} : "skip",
  );
  const joinWaitlistMutation = useMutation(api.waitlist.join);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gate, setGate] = useState<GateState>("checking");

  if (admissionMode !== undefined && gate === "checking") {
    if (admissionMode === "open") setGate("open");
    else if (admissionMode === "waitlist") setGate("waitlist");
    else setGate("closed");
  }

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/feed");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "anonymous") return;
    if (gate !== "open") return;
    openAuthModal("login");
  }, [authStatus, gate, openAuthModal]);

  const joinWaitlist = useCallback(async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await joinWaitlistMutation({ email: email.trim().toLowerCase() });
      setGate(res.alreadyJoined ? "waitlist-already" : "waitlist-joined");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("waitlist.join.ip")) setGate("waitlist-rate-ip");
      else if (msg.includes("waitlist.join.email")) setGate("waitlist-rate-email");
      else setGate("waitlist-error");
    } finally {
      setSubmitting(false);
    }
  }, [email, joinWaitlistMutation]);

  if (authStatus === "authenticated" || authStatus === "loading") {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-bg-canvas p-6">
        <div className="canvas-dot-grid pointer-events-none absolute inset-0" aria-hidden />
        <p className="relative text-sm text-text-muted">Loading…</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-bg-canvas p-6">
      <div className="canvas-dot-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-(--container-auth)">
        <div className="mb-6 flex justify-center">
          <CreateconomyLogoFull />
        </div>

        {gate === "closed" ? (
          <Card>
            <CardHeader className="text-center">
              <h1 className="text-lg font-semibold text-text-primary">Sign in to Createconomy</h1>
            </CardHeader>
            <CardContent className="space-y-4">
              <Banner variant="neutral">
                New sign-ups are currently closed. Check back later.
              </Banner>
              <Button className="w-full" onClick={() => openAuthModal("login")}>
                Already a member? Sign in
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {gate.startsWith("waitlist") ? (
          <Card>
            <CardHeader className="text-center">
              <h1 className="text-lg font-semibold text-text-primary">Join the waitlist</h1>
              <p className="text-sm text-text-secondary">
                We&apos;ll notify you when a spot opens up.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {gate === "waitlist" ? (
                <>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email address"
                  />
                  <Button className="w-full" onClick={joinWaitlist} loading={submitting} disabled={!email.trim()}>
                    Join waitlist
                  </Button>
                </>
              ) : null}
              {gate === "waitlist-joined" ? (
                <Banner variant="success">
                  You&apos;re on the list. We&apos;ll be in touch when a spot opens.
                </Banner>
              ) : null}
              {gate === "waitlist-already" ? (
                <Banner variant="info">This email is already on the waitlist.</Banner>
              ) : null}
              {gate === "waitlist-rate-ip" ? (
                <Banner variant="warning" role="alert">
                  <span className="inline-flex items-center gap-2">
                    <Clock className="size-4" /> Too many sign-ups from this network. Try again later.
                  </span>
                </Banner>
              ) : null}
              {gate === "waitlist-rate-email" ? (
                <Banner variant="warning" role="alert">
                  <span className="inline-flex items-center gap-2">
                    <Clock className="size-4" /> This email has already joined recently.
                  </span>
                </Banner>
              ) : null}
              {gate === "waitlist-error" ? (
                <Banner variant="error" role="alert">
                  <span className="inline-flex items-center gap-2">
                    <AlertCircle className="size-4" /> Could not join the waitlist. Please try again.
                  </span>
                </Banner>
              ) : null}
              <Button variant="secondary" className="w-full" onClick={() => openAuthModal("login")}>
                Already a member? Sign in
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {gate === "open" || gate === "checking" ? (
          <Card>
            <CardHeader className="text-center">
              <h1 className="text-lg font-semibold text-text-primary">Sign in to Createconomy</h1>
              <p className="text-sm text-text-secondary">
                Use email and password, or continue with Google — same sign-in as the admin console.
              </p>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => openAuthModal("login")}>
                Sign in
              </Button>
              <p className="pt-4 text-center text-xs text-text-muted">
                By continuing you agree to our{" "}
                <a href="/terms" className="text-text-link underline">Terms</a> and{" "}
                <a href="/privacy" className="text-text-link underline">Privacy Policy</a>.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
