 
"use client";

/**
 * Route: /admin/readiness — SLICE-P7A-11 (CAP-435): the 8-category
 * checklist (DECISIONS-LOCKED #8 correction — the 8th gates public
 * launch). Evaluate button (CAP-509); latest + prior rows; deep links to
 * registered routeKeys only. NO force-open control here (contract §1,
 * quoted: "This screen does not directly bypass readiness to open signup
 * — CAP-510 is the server-side gate").
 */

import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonText } from "@/components/ui/skeleton";
import { api } from "@/lib/convex";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  legal_pages: "Legal pages",
  admission: "Admission",
  moderation: "Moderation",
  legal_intake: "Legal intake",
  consent_privacy: "Consent/privacy",
  reliability: "Reliability",
  content_safety: "Content safety",
  ranking_calibration_reviewed: "Ranking calibration reviewed",
};

export default function AdminReadinessPage() {
  const data = useQuery(api.admin.readiness?.checklist, {});
  const evaluate = useMutation(api.admin.readiness?.evaluate);
  const latest = data?.latest ?? null;
  const evidence = (latest?.evidence ?? {}) as Record<string, { status: string; detail: string }>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Launch Readiness</h1>
        <Button size="sm" onClick={() => void evaluate({})}>Evaluate (CAP-509)</Button>
      </div>
      <p className="text-xs text-(--text-muted)">
        8 categories — all must pass for <span className="font-mono">overall=ready</span>. The 8th (ranking
        calibration) gates public launch. signup.mode=open stays server-gated (CAP-510) — never from this screen.
      </p>

      {data === undefined ? (
        <Card><CardContent className="py-4"><SkeletonText className="w-full" /></CardContent></Card>
      ) : latest === null ? (
        <Card><CardContent className="py-8 text-center text-sm text-(--text-muted)">
          No evaluation on record — run Evaluate. Until a row exists, signup.mode=open is rejected (fail-closed).
        </CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <h2 className="text-sm font-semibold text-(--text-primary)">
                Latest — {new Date(latest.evaluatedAt).toLocaleString()}
              </h2>
              <Badge tone={latest.overall === "ready" ? "success" : "error"}>{latest.overall}</Badge>
            </CardHeader>
            <CardContent className="space-y-1">
              {(data.categories as readonly string[] | undefined ?? []).map((cat: string) => {
                const ev = evidence[cat];
                return (
                  <div key={cat} className="flex items-center justify-between rounded-md border border-border-subtle px-3 py-2">
                    <span className="text-sm text-(--text-primary)">{CATEGORY_LABELS[cat] ?? cat}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-(--text-muted)">{ev?.detail ?? "not evaluated"}</span>
                      <Badge tone={ev?.status === "pass" ? "success" : "error"}>{ev?.status ?? "unavailable"}</Badge>
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {latest.blockers.length > 0 ? (
            <Card>
              <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Blockers</h2></CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-4 text-sm text-(--text-secondary)">
                  {latest.blockers.map((b: string) => <li key={b}>{b}</li>)}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex gap-2 text-sm">
            <Link href="/admin/config" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>signup.mode → /admin/config</Link>
            <Link href="/admin/roles" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>ops coverage → /admin/roles</Link>
          </div>
        </>
      )}
    </div>
  );
}
