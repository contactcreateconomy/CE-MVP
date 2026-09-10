/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /admin/seo — SLICE-P7O-07 (CAP-567/483): render-only health view.
 * Unavailable metrics render "—", never zero; render-only — no
 * assertIndexable override exists (CAP-466); CAP-484 stays on Home.
 */

import { useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "../../../../../../../convex/_generated/api";

const dash = (v: number | null | undefined) => (v === null || v === undefined ? "—" : String(v));

export default function AdminSeoPage() {
  const view = useQuery(api.admin.utm?.seoHealthView, {});
  const m = view?.metrics as any;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">SEO Health</h1>
      <p className="text-xs text-text-muted">
        Render-only (CAP-567) — indexability has no override (CAP-466). &quot;—&quot; means unavailable, never zero.
      </p>
      {!view?.connected ? (
        <Card><CardContent className="py-8 text-sm text-(--text-muted)">{view?.note ?? "Loading…"}</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Sitemap URLs", dash(m.sitemapUrlCount)],
            ["Coverage errors", dash(m.coverageErrorCount)],
            ["Thin indexed (healthy = 0)", dash(m.thinIndexedCount)],
            ["Held indexed (healthy = 0)", dash(m.heldIndexedCount)],
            ["Last sitemap build", m.lastSitemapBuildAt ? new Date(m.lastSitemapBuildAt).toLocaleDateString() : "—"],
            ["Last GSC pull", m.lastGscPullAt ? new Date(m.lastGscPullAt).toLocaleDateString() : "—"],
          ].map(([label, value]) => (
            <Card key={String(label)}>
              <CardContent className="py-4 text-center">
                <p className="text-xl font-semibold text-(--text-primary)">{value}</p>
                <p className="text-xs text-(--text-muted)">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {m?.status ? <Badge tone={m.status === "ok" ? "success" : "warning"}>{m.status}</Badge> : null}
    </div>
  );
}
