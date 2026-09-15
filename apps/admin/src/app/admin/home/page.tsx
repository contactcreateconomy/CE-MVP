/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /admin/home — SLICE-P7A-02/03 (CAP-391/408/409/410/411/428):
 * the composed Home. R-HOME strip order is server-side (admin.home.compose);
 * counters render stale → "—" not 0 (CAP-428, quoted); interventions
 * ack/resolve/snooze (critical never snoozes). Empty = honest empty.
 */

import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonText } from "@/components/ui/skeleton";
import { api } from "../../../../../../../convex/_generated/api";

export default function AdminHomePage() {
  const home = useQuery(api.admin.home?.compose, {});
  const ack = useMutation(api.admin.interventions?.ack);
  const resolve = useMutation(api.admin.interventions?.resolve);
  const snooze = useMutation(api.admin.interventions?.snooze);

  if (home === undefined) {
    return <div className="card-surface p-4"><SkeletonText className="w-full" /><SkeletonText className="w-2/3" /></div>;
  }
  if (home.state !== "ok") {
    return (
      <Card><CardContent className="py-8 text-center text-sm text-(--text-muted)">
        {home.state === "forbidden" ? "Administrator role required (CAP-391 compose)." : "Sign in required."}
      </CardContent></Card>
    );
  }

  const strip = home.strip ?? [];
  const counters = home.counters ?? [];
  const interventions = home.interventions ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">Admin Home</h1>

      {/* The critical strip (R-HOME order, ≤8 next actions) */}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Next actions ({strip.length}/8)</h2></CardHeader>
        <CardContent className="space-y-1">
          {strip.length === 0 ? (
            <p className="text-sm text-(--text-muted)">Nothing critical — the queue is clear.</p>
          ) : (
            strip.map((item: any) => (
              <div key={item.key} className="flex items-center justify-between rounded-md border border-border-subtle px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-(--text-primary)">
                  <Badge tone={item.severity === "critical" ? "error" : item.severity === "high" ? "warning" : "info"}>
                    {item.severity}
                  </Badge>
                  {item.label}
                </span>
                <Button variant="ghost" size="sm" onClick={() => (window.location.href = item.deepLinkRouteKey)}>
                  Open
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Counters — stale → "—" not 0 (CAP-428, quoted) */}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Counters</h2></CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {counters.map((c: any) => (
            <div key={c.counterKey} className="rounded-md border border-border-subtle p-3 text-center">
              <p className="text-xl font-semibold text-(--text-primary)">
                {c.value === null || c.stale ? "—" : c.value}
              </p>
              <p className="text-xs text-(--text-muted)">{c.counterKey.split(".").pop()}</p>
              {c.heartbeatStale ? <Badge tone="warning">heartbeat &gt;15m</Badge> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Interventions (banner archetype via P3-06's shared primitive shape) */}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Interventions</h2></CardHeader>
        <CardContent className="space-y-2">
          {interventions.length === 0 ? (
            <p className="text-sm text-(--text-muted)">No open interventions.</p>
          ) : (
            interventions.map((a: any) => (
              <div key={a.id} className="rounded-lg border border-(--border-default) bg-(--bg-overlay)/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-(--text-primary)">
                      <Badge tone={a.severity === "critical" ? "error" : "warning"}>{a.severity}</Badge>
                      {a.title}
                    </p>
                    <p className="mt-1 text-xs text-(--text-secondary)">{a.whatHappening}</p>
                    <p className="text-xs text-(--text-muted)">→ {a.whatToDo}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => void ack({ alertId: a.id })}>Ack</Button>
                  <Button variant="ghost" size="sm" onClick={() => void resolve({ alertId: a.id })}>Resolve</Button>
                  {a.severity !== "critical" ? (
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => void snooze({ alertId: a.id, until: Date.now() + 60 * 60_000 })}
                    >
                      Snooze 1h
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
