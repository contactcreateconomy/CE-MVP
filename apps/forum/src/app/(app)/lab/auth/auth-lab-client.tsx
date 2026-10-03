"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import type { AuthMode, EmailVerifyState } from "@/components/auth/auth-display-types";
import { AuthModalView } from "@/components/auth/auth-modal-view";
import { FeedPageView } from "@/components/feed/feed-page-view";

import { cards, heroSlides, navItems, podiumByWindow, vibing } from "../feed/fixtures";
import { LAB_CODE, labErrors, labPrefill } from "./fixtures";

interface LabAuthClientProps {
  initialMode: AuthMode;
  forcedTheme?: "dark" | "light";
  state: "ready" | "error" | "loading";
  withVerification: boolean;
  showToolbar: boolean;
}

/** Local-state stand-in for the wiring GLM builds (no auth calls). */
export function LabAuthClient({ initialMode, forcedTheme, state, withVerification, showToolbar }: LabAuthClientProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [submitting, setSubmitting] = useState(state === "loading");
  const [error, setError] = useState<string | null>(state === "error" ? labErrors[initialMode] : null);
  const [verify, setVerify] = useState<EmailVerifyState>(state === "ready" ? "idle" : "verified");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (forcedTheme) setTheme(forcedTheme);
  }, [forcedTheme, setTheme]);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const later = (fn: () => void, ms: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  };

  // Simulated round-trip: spinner, then the fixture error (no real auth here).
  const fakeSubmit = (m: AuthMode) => {
    setError(null);
    setSubmitting(true);
    later(() => {
      setSubmitting(false);
      setError(labErrors[m]);
    }, 1200);
  };

  const prefill = state === "ready" ? undefined : labPrefill;

  return (
    <>
      <div aria-hidden className="pointer-events-none">
        <FeedPageView
          heroSlides={heroSlides}
          nav={{ items: navItems, activeKey: "home", onStartDiscussion: () => {} }}
          sort="top"
          onSortChange={() => {}}
          listState="ready"
          cards={cards}
          vibing={vibing}
          podium={{ window: "d7", onWindowChange: () => {}, entries: podiumByWindow.d7, leaderboardHref: "/lab/auth" }}
        />
      </div>

      <AuthModalView
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        onModeChange={(m) => {
          setError(null);
          setMode(m);
        }}
        submitting={submitting}
        error={error}
        onLogin={() => fakeSubmit("login")}
        onSignup={() => fakeSubmit("signup")}
        socialProviders={["google", "github", "facebook"]}
        onSocial={() => fakeSubmit(mode)}
        showRememberMe
        onForgotPassword={() => {}}
        termsHref="/terms"
        privacyHref="/privacy"
        defaultLoginValues={prefill?.login}
        defaultSignupValues={prefill?.signup}
        emailVerification={
          withVerification
            ? {
                state: verify,
                error: verifyError,
                onRequest: () => {
                  setVerify("sending");
                  later(() => setVerify("code"), 600);
                },
                onSubmitCode: (code) => {
                  setVerify("checking");
                  later(() => {
                    if (code === LAB_CODE) {
                      setVerify("verified");
                      setVerifyError(null);
                    } else {
                      setVerify("error");
                      setVerifyError("Invalid code. Please try again.");
                    }
                  }, 500);
                },
                onResend: () => {
                  setVerifyError(null);
                  setVerify("sending");
                  later(() => setVerify("code"), 600);
                },
                onChangeEmail: () => {
                  setVerifyError(null);
                  setVerify("idle");
                },
              }
            : undefined
        }
      />

      {showToolbar ? (
        <div className="glass-chrome fixed bottom-2 left-2 z-max flex gap-1 rounded-full border border-border-default p-1 text-caption">
          <button
            type="button"
            className="rounded-full px-2 py-1 text-text-secondary hover:text-text-primary"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? "Dark" : "Light"}
          </button>
          {!open ? (
            <button type="button" className="rounded-full px-2 py-1 text-text-primary" onClick={() => setOpen(true)}>
              Open modal
            </button>
          ) : null}
          <span className="px-2 py-1 text-text-muted">code {LAB_CODE}</span>
        </div>
      ) : null}
    </>
  );
}
