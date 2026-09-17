/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /admin/analytics — SLICE-P7O-02 (CAP-463 etc.): the Founder
 * dashboard. Seven Convex-authoritative cards; n% (x/y) render with
 * sampleStatus=directional under 25 denominators; cohort-incomplete
 * labels; weekly decision recording is FOUNDER-only (administrators view).
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonText } from "@/components/ui/skeleton";
import { api } from "@/lib/convex";

export default function AdminAnalyticsPage() {
  const dash = useQuery(api.admin.analytics?.founderDashboard, {});
  const record = useMutation(api.admin.analytics?.recordWeeklyDecision);
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">Analytics</h1>
      <p className="text-xs text-text-muted">
        Convex-authoritative. P0 decisions never use PostHog counts (CAP-463); denominators under 25 are directional.
      </p>
      {dash === undefined ? (
        <Card>
          <CardContent className="space-y-2 py-8">
            <SkeletonText className="w-1/3" />
            <SkeletonText className="w-full" />
            <SkeletonText className="w-4/5" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dash.cards.map((c: any) => (
              <Card key={c.card}>
                <CardContent className="space-y-1 py-4">
                  <p className="text-xs uppercase tracking-wide text-(--text-muted)">{c.card}</p>
                  {c.state === "cohort_incomplete" ? (
                    <p className="text-sm text-(--text-secondary)">Cohort incomplete</p>
                  ) : (
                    <>
                      <p className="text-xl font-semibold text-(--text-primary)">
                        {c.card === "signal_card" ? c.metrics.totalActiveSignalsPlatform : JSON.stringify(c.metrics).slice(0, 40)}
                      </p>
                      <Badge tone={c.sampleStatus === "directional" ? "warning" : "neutral"}>{c.sampleStatus}</Badge>
                      <p className="text-xs text-(--text-muted)">freshness: {c.freshness} · v{c.definitionVersion}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {dash.instrumentationIncidents?.length ? (
            <Card>
              <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Instrumentation health (CAP-455 strip)</h2></CardHeader>
              <CardContent className="space-y-1">
                {dash.instrumentationIncidents.map((i: any, n: number) => (
                  <p key={n} className="text-xs text-(--text-secondary)">{i.type}: {i.detail}</p>
                ))}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Weekly decision (Founder only — CAP-452)</h2></CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => {
                void record({ decision: "reviewed", nextAction: "continue", reviewDate: Date.now() + 7 * 86_400_000 })
                  .then(() => setNote("Weekly decision recorded (append-only)."))
                  .catch((e) => setNote(String(e?.message ?? e)));
              }}>
                Record this week&apos;s decision
              </Button>
              {note ? <span className="text-xs text-(--text-muted)">{note}</span> : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
