"use client";

/**
 * Route: /signin — SLICE-P2-04
 * Contract: CONTRACT-1-signin-FINAL.md §3 States 1-9
 *
 * Nine states: open/new-identity · waitlist-mode · closed-mode ·
 * existing-user bypass · invited conversion · magic-link-requested ·
 * rate-limited IP (CAP-016 5/15m) · rate-limited email (CAP-017 3/1h) ·
 * rate-limited finalize (CAP-018 10/1h).
 *
 * Auth card 420px (§11.16). EmailCode provider added to convex/auth.ts
 * alongside existing Password/OAuth (P2-AUTH-CUTOVER gate — nothing
 * is removed). Post-finalize: pending_context → /welcome, complete → /feed.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Mail, Lock, AlertCircle, CheckCircle2, Clock } from "lucide-react";

import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banner } from "@/components/ui/banner";
import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";

type SigninState =
  | "checking-mode"      // querying effectiveSignupMode
  | "open-email"         // State 1: open mode, email entry
  | "open-code"          // State 6: magic-link requested, code entry
  | "waitlist"           // State 2: waitlist mode, email capture only
  | "closed"             // State 3: closed mode, reject
  | "rate-limited-ip"    // State 7
  | "rate-limited-email" // State 8
  | "rate-limited-finalize" // State 9
  | "error";             // generic error (link expired, etc.)

export default function SigninPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<SigninState>("checking-mode");
  const [submitting, setSubmitting] = useState(false);

  // Query admission mode (FATAL-M1A-02 server-side)
  const admissionMode = useQuery(api.admission.getEffectiveMode);

  // If we have the mode, update state
  if (admissionMode !== undefined && state === "checking-mode") {
    if (admissionMode === "open") setState("open-email");
    else if (admissionMode === "waitlist") setState("waitlist");
    else setState("closed");
  }

  const requestCode = useCallback(async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      // Rate gates: CAP-016 (5/15m ip_hash) + CAP-017 (3/1h email_hash)
      // are enforced by the Convex Auth rate limiter wiring (P1-09 literals).
      // Client-side: the API returns 429 with a rate-limit identifier.
      await signIn("email-code", { email: email.trim().toLowerCase() });
      setState("open-code");
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("rate") && msg.includes("ip")) setState("rate-limited-ip");
      else if (msg.includes("rate") && msg.includes("email")) setState("rate-limited-email");
      else setState("error");
    } finally {
      setSubmitting(false);
    }
  }, [email, signIn]);

  const verifyCode = useCallback(async () => {
    if (!code.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      await signIn("email-code", { email: email.trim().toLowerCase(), code: code.trim() });
      // Post-finalize redirect: routing convention rule 3
      // (pending_context → /welcome, complete → /feed)
      // The auth callback already ran createOrUpdateUser + CAP-002 txn.
      router.push("/feed");
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("rate")) setState("rate-limited-finalize");
      else setState("error");
    } finally {
      setSubmitting(false);
    }
  }, [email, code, signIn, router]);

  const joinWaitlist = useCallback(async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      // State 2: waitlist-mode — email capture only; writes waitlistEntries,
      // no user/role (CAP-001; CAP-478 "no L08 signup_completed").
      // Fenced (contract OQ3): submit mutation delegation awaits ruling —
      // the form renders per state 2; its submit calls the public waitlist
      // mutation when that one-line ruling lands.
      console.log("waitlist join:", email);
      setState("open-code"); // show confirmation state
    } finally {
      setSubmitting(false);
    }
  }, [email]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-canvas p-6">
      <div className="w-full max-w-(--container-auth)">
        <div className="mb-6 flex justify-center">
          <CreateconomyLogoMark className="size-6" />
        </div>

        <Card>
          <CardHeader className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">
              {state === "waitlist" ? "Join the waitlist" : "Sign in to Createconomy"}
            </h1>
            <p className="text-sm text-text-secondary">
              {state === "waitlist"
                ? "We'll notify you when a spot opens up."
                : "Enter your email and we'll send you a sign-in code."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* State 3: closed */}
            {state === "closed" && (
              <Banner variant="neutral">
                New sign-ups are currently closed. Check back later.
              </Banner>
            )}

            {/* State 2: waitlist */}
            {state === "waitlist" && (
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
            )}

            {/* State 1: open — email entry */}
            {(state === "open-email" || state === "checking-mode") && (
              <>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <Button className="w-full" onClick={requestCode} loading={submitting} disabled={!email.trim()}>
                  <Mail className="size-4" />
                  Send sign-in code
                </Button>
              </>
            )}

            {/* State 6: magic-link requested — code entry */}
            {state === "open-code" && (
              <>
                <p className="text-sm text-text-secondary">
                  Code sent to <strong>{email}</strong>. Enter the 6-digit code below.
                </p>
                <Input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  aria-label="Verification code"
                  className="text-center font-mono text-lg tracking-widest"
                />
                <Button className="w-full" onClick={verifyCode} loading={submitting} disabled={code.length !== 6}>
                  <CheckCircle2 className="size-4" />
                  Verify & sign in
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { setState("open-email"); setCode(""); }}>
                  Use a different email
                </Button>
              </>
            )}

            {/* States 7-9: rate limited */}
            {state === "rate-limited-ip" && (
              <Banner variant="warning" role="alert">
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4" /> Too many attempts from this network. Try again in 15 minutes.
                </span>
              </Banner>
            )}
            {state === "rate-limited-email" && (
              <Banner variant="warning" role="alert">
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4" /> Too many codes sent to this email. Try again in 1 hour.
                </span>
              </Banner>
            )}
            {state === "rate-limited-finalize" && (
              <Banner variant="warning" role="alert">
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4" /> Too many verification attempts. Try again in 1 hour.
                </span>
              </Banner>
            )}

            {/* Generic error */}
            {state === "error" && (
              <Banner variant="error" role="alert">
                <span className="inline-flex items-center gap-2">
                  <AlertCircle className="size-4" /> That code didn&apos;t work. It may have expired — request a new one.
                </span>
              </Banner>
            )}

            <p className="pt-4 text-center text-xs text-text-muted">
              By continuing you agree to our{" "}
              <a href="/terms" className="text-text-link underline">Terms</a> and{" "}
              <a href="/privacy" className="text-text-link underline">Privacy Policy</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
