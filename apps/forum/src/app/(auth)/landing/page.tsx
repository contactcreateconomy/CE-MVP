"use client";

/**
 * Route: / (anonymous landing) — SLICE-P2-08
 * CAP-464/465/478: §12.3 layout (no sidebar), three-mode CTA set,
 * Beta label, UTM capture (first-touch-once, dictionary validation).
 * Per 00-ROUTES.md: `/` currently redirects to /feed — this page is
 * the anon-landing template, mounted when the root redirect logic
 * distinguishes anon from authed visitors.
 */

import { useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { ArrowRight, BookOpen, MessageSquare } from "lucide-react";

import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Banner } from "@/components/ui/banner";
import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";

export default function LandingPage() {
  // Query effectiveSignupMode (FATAL-M1A-02)
  const admissionMode = useQuery(api.admission.getEffectiveMode);

  // CAP-465: UTM capture — first-touch-once, canonical URL strips UTMs
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    if (utmSource) {
      // First-touch-once: only the first set of UTMs are recorded
      // (implementation: localStorage guard until the convex mutation wires)
      const existing = localStorage.getItem("utm.captured");
      if (!existing) {
        localStorage.setItem("utm.captured", JSON.stringify({
          source: utmSource,
          medium: params.get("utm_medium"),
          campaign: params.get("utm_campaign"),
          content: params.get("utm_content"),
          term: params.get("utm_term"),
          capturedAt: Date.now(),
          url: window.location.pathname,
        }));
      }
      // Canonical URL strips UTMs (CAP-465)
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, []);

  const mode = admissionMode ?? "closed";

  const cta = useMemo(() => {
    switch (mode) {
      case "open":
        return { label: "Join public beta", href: "/signin" };
      case "waitlist":
        return { label: "Join the waitlist", href: "/waitlist" };
      case "closed":
        return { label: "Explore free resources", href: "/feed" };
      default:
        // fail-closed posture (mirrors effectiveSignupMode's falsy branch)
        return { label: "Explore free resources", href: "/feed" };
    }
  }, [mode]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-canvas p-6">
      <div className="mx-auto w-full max-w-(--container-reading) space-y-8 text-center">
        <CreateconomyLogoMark className="mx-auto size-12" />

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary">
            Createconomy
          </h1>
          <p className="text-lg text-text-secondary">
            A discussion and resource platform for creators and small
            businesses building with AI.
          </p>
          <Banner variant="neutral" className="mx-auto max-w-xs">
            <span className="text-xs font-semibold uppercase tracking-wider">Public beta</span>
          </Banner>
        </div>

        <div className="space-y-3">
          <Button size="lg" className="w-full max-w-xs" onClick={() => window.location.href = cta.href}>
            {cta.label}
            <ArrowRight className="size-4" />
          </Button>

          {mode !== "open" && (
            <Button size="lg" variant="secondary" className="w-full max-w-xs" onClick={() => window.location.href = "/feed"}>
              <BookOpen className="size-4" />
              Explore free resources
            </Button>
          )}

          <Button size="lg" variant="ghost" className="w-full max-w-xs" onClick={() => window.location.href = "/feed"}>
            <MessageSquare className="size-4" />
            Browse discussions
          </Button>
        </div>

        <Card className="mx-auto max-w-md">
          <CardContent className="space-y-2 p-4 text-left">
            <p className="text-sm font-semibold text-text-primary">What makes us different</p>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li>• AI-assisted editorial pipeline — every claim is sourced</li>
              <li>• Verified AI personas participate transparently in discussions</li>
              <li>• A resource library built for creators, not against them</li>
              <li>• No engagement-hacking — legitimacy-weighted ranking</li>
            </ul>
          </CardContent>
        </Card>

        <p className="text-xs text-text-muted">
          <a href="/privacy" className="text-text-link underline">Privacy</a>
          {" · "}
          <a href="/terms" className="text-text-link underline">Terms</a>
          {" · "}
          <a href="/dmca" className="text-text-link underline">DMCA</a>
        </p>
      </div>
    </main>
  );
}
