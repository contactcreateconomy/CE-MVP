"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */

/**
 * Route: /admin/store — SLICE-P6-14/15: the validation queue (requests →
 * products → the LOCK) + enforcement actions. Distinct from
 * /admin/affiliate-inventory (P4-12 editorial links).
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/convex";
import { useAuth } from "@cemvp/auth-ui";

export default function AdminStorePage() {
  const { authStatus } = useAuth();
  const queue = useQuery(api.admin.store.getQueue, authStatus === "authenticated" ? {} : "skip");
  const decide = useMutation(api.admin.store.decideRequest);
  const approve = useMutation(api.admin.store.approveProduct);
  const rejectProduct = useMutation(api.admin.store.rejectProduct);
  const reportDrift = useMutation(api.admin.store.reportDrift);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [productId, setProductId] = useState("");
  const [linkId, setLinkId] = useState("");

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setNote(null);
    try { await fn(); setNote(ok); } catch (e) { setNote(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  };

  if (queue === undefined) {
    return <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" /></div>;
  }
  if (queue === null) {
    return <Card><CardContent className="py-8 text-center text-sm text-(--text-muted)">Staff access required.</CardContent></Card>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Store validation</h1>
        <p className="text-sm text-(--text-muted)">
          Requests → inspection → auto-screen → human approve = <strong>approved_locked</strong> (the BUY gate).
          Drifted links go under_review — BUY disabled, storefront visible.
        </p>
      </header>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Store requests ({queue.requests.length})</h2></CardHeader>
        <CardContent className="space-y-2">
          {queue.requests.length === 0 ? <p className="text-sm text-(--text-muted)">None pending.</p> : queue.requests.map((r: any) => (
            <div key={r.requestId} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-(--text-secondary)">{r.userId.slice(-8)}</span>
              <Badge tone="neutral">{(r.networks ?? []).join(", ") || "—"}</Badge>
              <span className="ml-auto flex gap-1">
                <Button size="sm" variant="secondary" disabled={busy}
                  onClick={() => void run(() => decide({ requestId: r.requestId, decision: "approved" }), "Approved — storefront in setup.")}>
                  Approve
                </Button>
                <Button size="sm" variant="ghost" disabled={busy}
                  onClick={() => void run(() => decide({ requestId: r.requestId, decision: "rejected", reasonCode: "ineligible" }), "Rejected.")}>
                  Reject
                </Button>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Product approval — THE LOCK (CAP-237)</h2></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="storefrontProductId" className="w-56" aria-label="Product id" />
            <Input value={linkId} onChange={(e) => setLinkId(e.target.value)} placeholder="storefrontLinkId (passing inspection)" className="w-56" aria-label="Link id" />
            <Button size="sm" variant="secondary" disabled={busy || !productId || !linkId}
              onClick={() => void run(() => approve({ storefrontProductId: productId as any, storefrontLinkId: linkId as any, packageHash: `pkg:${productId}:${Date.now()}` }), "LOCKED (approved_locked).")}>
              Approve &amp; lock
            </Button>
            <Button size="sm" variant="ghost" disabled={busy || !productId}
              onClick={() => void run(() => rejectProduct({ storefrontProductId: productId as any, reason: "off_topic" }), "Rejected (off_topic).")}>
              Reject off-topic
            </Button>
          </div>
          {queue.pendingLinks.length > 0 ? (
            <p className="text-xs text-(--text-muted)">Pending links: {queue.pendingLinks.map((l: any) => l.linkId.slice(-6)).join(", ")}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Drift (CAP-241/242) — {queue.driftedLinks.length} under review</h2></CardHeader>
        <CardContent className="space-y-2">
          {queue.driftedLinks.length === 0 ? <p className="text-sm text-(--text-muted)">No drifted links.</p> : queue.driftedLinks.map((l: any) => (
            <div key={l.linkId} className="flex items-center gap-2 text-sm">
              <Badge tone="warning">under_review</Badge>
              <span className="text-(--text-secondary)">{l.url}</span>
              <Button size="sm" variant="ghost" className="ml-auto" disabled={busy}
                onClick={() => void run(() => reportDrift({ storefrontLinkId: l.linkId, note: "operator recheck" }), "Recheck scheduled.")}>
                Recheck
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
    </section>
  );
}
