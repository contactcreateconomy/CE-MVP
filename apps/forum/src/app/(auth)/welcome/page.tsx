"use client";

/**
 * Route: /welcome — SLICE-P2-02 (screen half)
 * CAP-003: timezone chooser (auto-detected per DECISIONS-LOCKED #2 — no Skip
 * button, pending_context not reachable via skip). IANA zone confirmation.
 * Auth card 420px. Completion routes to /feed.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Globe, CheckCircle2 } from "lucide-react";

import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banner } from "@/components/ui/banner";
import { CreateconomyLogoFull } from "@/components/ui/createconomy-logo-full";

// Common IANA zones for the confirmation dropdown (the auto-detected zone is
// pre-selected; user confirms or changes). Full list would use the
// searchable combobox archetype when it gains production usage.
const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Sao_Paulo", "Europe/London", "Europe/Berlin", "Europe/Paris",
  "Europe/Moscow", "Asia/Dubai", "Asia/Kolkata", "Asia/Shanghai", "Asia/Tokyo",
  "Asia/Singapore", "Australia/Sydney", "Pacific/Auckland",
];

export default function WelcomePage() {
  const router = useRouter();
  const finalizeWelcome = useMutation(api.bootstrap.finalizeWelcome);
  const [timezone, setTimezone] = useState("UTC");
  const [detected, setDetected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DECISIONS-LOCKED #2: auto-detect from browser, silent, no user action
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      setDetected(tz);
      setTimezone(tz);
    }
  }, []);

  const finalize = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      // finalizeBootstrap (CAP-003) — writes timezone once, flips
      // bootstrapState to complete, fires the CAP-004 signup event
      // (same-mutation, CAP-436). Routing-convention rule 3: a now-complete
      // user leaving /welcome goes to /feed.
      await finalizeWelcome({ timezone });
      router.push("/feed");
    } catch (err) {
      const msg = (err as Error).message || "";
      // Contract states 4-6: invalid timezone / guard failure / write-once
      // conflict — each rejects without side effects (CAP-003).
      if (msg.includes("Invalid timezone")) {
        setError("That timezone isn't recognized. Pick another from the list.");
      } else if (msg.includes("Guard failure")) {
        setError("Your account isn't ready to finish setup yet. Please contact support.");
      } else if (msg.includes("Write-once conflict")) {
        // Already complete — routing convention rule 3 owns this; the
        // component just gets the user off this now-stale screen.
        router.replace("/feed");
        return;
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [finalizeWelcome, timezone, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-canvas p-6">
      <div className="w-full max-w-(--container-auth)">
        <div className="mb-6 flex justify-center">
          <CreateconomyLogoFull />
        </div>

        <Card>
          <CardHeader className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">Welcome to Createconomy</h1>
            <p className="text-sm text-text-secondary">
              {detected
                ? `We detected your timezone as ${detected.replace(/_/g, " ")}. Confirm or change it below.`
                : "Confirm your timezone to get started."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Banner variant="error">{error}</Banner>}

            <div className="flex items-center gap-2">
              <Globe className="size-4 shrink-0 text-text-muted" aria-hidden />
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger aria-label="Timezone" className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={finalize} loading={submitting}>
              <CheckCircle2 className="size-4" />
              Confirm timezone & continue
            </Button>

            <p className="text-center text-xs text-text-muted">
              Timezone is write-once (Admin correction with audit only). You can
              change it later in Settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
