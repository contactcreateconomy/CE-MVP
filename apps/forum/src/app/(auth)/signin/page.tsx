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

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuth } from "@cemvp/auth-ui";
import { getRoutingRedirect } from "@/lib/routing";
import { Mail, AlertCircle, CheckCircle2, Clock } from "lucide-react";

import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banner } from "@/components/ui/banner";
import { CreateconomyLogoFull } from "@/components/ui/createconomy-logo-full";

type SigninState =
  | "checking-mode"      // querying effectiveSignupMode
  | "open-email"         // State 1: open mode, email entry
  | "open-code"          // State 6: magic-link requested, code entry
  | "waitlist"           // State 2: waitlist mode, email capture only
  | "waitlist-joined"    // State 2: waitlist join succeeded
  | "waitlist-already"   // waitlist.join idempotent duplicate
  | "closed"             // State 3: closed mode, reject
  | "rate-limited-ip"    // State 7
  | "rate-limited-email" // State 8
  | "rate-limited-finalize" // State 9
  | "waitlist-rate-ip"   // CAP-015: 10/h per IP (waitlist branch)
  | "waitlist-rate-email" // CAP-015: 3/24h per email (waitlist branch)
  | "waitlist-error"     // waitlist.join failed for a non-rate-limit reason
  | "error";             // generic error (link expired, etc.)

export default function SigninPage() {
  const router = useRouter();
  const { authStatus } = useAuth();
  // Offline/no-env guard: without a configured Convex URL the root provider
  // deliberately omits ConvexAuthProvider (@convex-dev/auth) — useAuthActions
  // returns undefined during CI prerender, so the destructure must not throw
  // (same guard class as the layout overlays). Offline the page stays in its
  // checking state; the actions below can never fire without a provider.
  const authActions = useAuthActions() as ReturnType<typeof useAuthActions> | undefined;
  const signIn = authActions?.signIn;

  // CONTRACT-1-app-shell rule 3: already-complete users on /signin → /feed.
  // Google sessions from the feed modal are the same Convex Auth session.
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const dest = getRoutingRedirect("/signin", "authenticated", "complete");
    if (dest) router.replace(dest);
  }, [authStatus, router]);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<SigninState>("checking-mode");
  const [submitting, setSubmitting] = useState(false);

  // Query admission mode (FATAL-M1A-02 server-side)
  const admissionMode = useQuery(api.admission.getEffectiveMode);
  // CAP-001 waitlist branch: writes waitlistEntries only (no users row, no
  // role) — the SAME publicMutation the dedicated /waitlist screen uses.
  const joinWaitlistMutation = useMutation(api.waitlist.join);

  // If we have the mode, update state
  if (admissionMode !== undefined && state === "checking-mode") {
    if (admissionMode === "open") setState("open-email");
    else if (admissionMode === "waitlist") setState("waitlist");
    else setState("closed");
  }

  const requestCode = useCallback(async () => {
    if (!email.trim()) return;
    if (!signIn) return; // no @convex-dev/auth provider mounted (offline)
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
    if (!signIn) return; // no @convex-dev/auth provider mounted (offline)
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
      // no user/role (CAP-001; CAP-478 "no L08 signup_completed"). Same
      // publicMutation the dedicated /waitlist screen calls (contract OQ3
      // resolved by evidence: CAP-014 names one write target and one
      // registered mutation — no second one exists to delegate to).
      const res = await joinWaitlistMutation({ email: email.trim().toLowerCase() });
      setState(res.alreadyJoined ? "waitlist-already" : "waitlist-joined");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("waitlist.join.ip")) setState("waitlist-rate-ip");
      else if (msg.includes("waitlist.join.email")) setState("waitlist-rate-email");
      else setState("waitlist-error");
    } finally {
      setSubmitting(false);
    }
  }, [email, joinWaitlistMutation]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-canvas p-6">
      <div className="w-full max-w-(--container-auth)">
        <div className="mb-6 flex justify-center">
          <CreateconomyLogoFull />
        </div>

        <Card>
          <CardHeader className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">
              {state.startsWith("waitlist") ? "Join the waitlist" : "Sign in to Createconomy"}
            </h1>
            <p className="text-sm text-text-secondary">
              {state.startsWith("waitlist")
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

            {/* State 2 (success): joined / already joined */}
            {state === "waitlist-joined" && (
              <Banner variant="success">
                You&apos;re on the list. We&apos;ll be in touch when a spot opens.
              </Banner>
            )}
            {state === "waitlist-already" && (
              <Banner variant="info">This email is already on the waitlist.</Banner>
            )}
            {/* CAP-015: 10/h per IP, 3/24h per email — waitlist branch */}
            {state === "waitlist-rate-ip" && (
              <Banner variant="warning" role="alert">
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4" /> Too many sign-ups from this network. Try again later.
                </span>
              </Banner>
            )}
            {state === "waitlist-rate-email" && (
              <Banner variant="warning" role="alert">
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4" /> This email has already joined recently.
                </span>
              </Banner>
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
            {state === "waitlist-error" && (
              <Banner variant="error" role="alert">
                <span className="inline-flex items-center gap-2">
                  <AlertCircle className="size-4" /> Could not join the waitlist. Please try again.
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
