/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * SellDashboardClient — SLICE-P6-16 / CONTRACT-6-sell: the member-side
 * seller dashboard over convex/store/sell.ts.
 *
 * Money-path invariant (contract §1): the platform never processes
 * merchant→seller commission — 100% to creator, 0% platform.
 * A13 FENCED: evidence tiers render with DISTINCT COPY KEYS (no
 * verified-vs-unverified badge token exists — flagged in the inventory,
 * not designed here); the interim tier must never read as network-verified.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

/** A13-fenced distinct copy keys — NEVER visually conflatable (contract §3.E/§6). */
const EVIDENCE_LABELS: Record<string, { label: string; tone: "warning" | "success" }> = {
  self_report: { label: "Self-reported — unverified", tone: "warning" },
  subid: { label: "SubID — pending network report", tone: "warning" },
  coupon: { label: "Coupon — pending merchant report", tone: "warning" },
  postback: { label: "Postback", tone: "warning" },
};
const verifiedLabel = { label: "Network-verified", tone: "success" } as const;

function evidencePillar(e: any) {
  // The two-field rule (CAP-525/contract §3.F): distinctness is carried by
  // type + status TOGETHER — only network_verified earns the verified label.
  if (e.status === "network_verified") return verifiedLabel;
  return EVIDENCE_LABELS[e.type] ?? { label: `${e.type} — ${e.status}`, tone: "warning" as const };
}

const PRODUCT_STATUSES = [
  "draft", "auto_screened", "under_review", "approved",
  "paused", "rejected", "withdrawn", "expired", "destination_unavailable",
] as const;

export function SellDashboardClient() {
  // Avoid `useQuery` when Convex is not configured (CI/Vercel build without
  // NEXT_PUBLIC_CONVEX_URL) — `useQuery` requires a provider even with "skip".
  if (!isConvexConfigured()) return null;
  return <SellDashboardClientWithConvex />;
}

function SellDashboardClientWithConvex() {
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const state = useQuery(api.store.sell.getSellState, configured && authStatus === "authenticated" ? {} : "skip");
  const analytics = useQuery(api.store.sell.getAnalytics, configured && authStatus === "authenticated" ? {} : "skip");
  const activate = useMutation(api.store.sell.activate);
  const pauseMyStore = useMutation(api.store.sell.pauseMyStore);
  const submitProduct = useMutation(api.store.sell.submitProduct);
  const requestEdit = useMutation(api.store.sell.requestEdit);
  const submitSelfReport = useMutation(api.store.sell.submitSelfReport);

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [editFor, setEditFor] = useState<any | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editClaims, setEditClaims] = useState("");
  const [evidenceFor, setEvidenceFor] = useState("");
  const [evidenceAmount, setEvidenceAmount] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");

  // Product submit form (multi-part; link enters the pipeline at pending)
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pUseCase, setPUseCase] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pClaims, setPClaims] = useState("");
  const [pUrl, setPUrl] = useState("");
  const [pNetwork, setPNetwork] = useState("");
  const [pProgram, setPProgram] = useState("");
  const [pRef, setPRef] = useState("");

  if (!configured) return null;
  if (authStatus !== "authenticated") {
    return (
      <Card><CardContent className="py-8 text-center text-sm text-(--text-muted)">
        <a href="/signin" className="underline">Sign in</a> to manage your storefront.
      </CardContent></Card>
    );
  }
  if (state === undefined) {
    return (
      <section className="space-y-4" aria-label="Rocketeer Dashboard">
        <Skeleton className="h-8 w-64" />
        <SkeletonText className="h-4 w-96" />
        <Skeleton className="h-48 w-full" />
      </section>
    );
  }
  if (state === null || !state.hasStore) {
    return (
      <Card><CardContent className="space-y-2 py-8 text-center text-sm text-(--text-muted)">
        <p>No storefront yet.</p>
        <a href="/sell/apply" className="underline">Apply to sell</a>
      </CardContent></Card>
    );
  }

  const store: any = state.store;
  const products: any[] = state.products ?? [];
  const evidence: any[] = state.evidence ?? [];
  const approvedCount = products.filter((p) => p.status === "approved").length;
  const statusTone =
    store.status === "active" ? "success" :
    store.status === "paused" ? "warning" :
    store.status === "suspended" || store.status === "closed" ? "error" : "info";

  async function run(fn: () => Promise<any>, done?: string) {
    setBusy(true); setNote(null);
    try {
      const r = await fn();
      if (done) setNote(r && typeof r === "object" && "reason" in r && r.reason ? String(r.reason) : done);
    } catch (e: any) {
      setNote(e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const canSubmitProduct =
    pName.trim() && pCategory.trim() && pUseCase.trim() && pDesc.trim() &&
    pClaims.trim() && pUrl.trim() && pNetwork.trim() && pProgram.trim() && pRef.trim() && !busy;

  return (
    <section className="space-y-5" aria-label="Rocketeer Dashboard">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Rocketeer Dashboard</h1>
        <Badge tone={statusTone}>{String(store.status).replace(/_/g, " ")}</Badge>
        {store.status === "setup" && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => run(() => activate(), "Store activated — your Rocketeer badge is now active and the store is public.")}
          >
            Activate storefront
          </Button>
        )}
        {store.status === "active" && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => setPauseOpen(true)}>
            Pause store
          </Button>
        )}
      </header>

      {store.status === "setup" && (
        <p className="text-sm text-(--text-muted)">
          Activation needs at least one approved product (CAP-233 gate, via CAP-237 product approval) — approved products: {approvedCount}.
        </p>
      )}
      {store.status === "paused" && (
        <p className="text-sm text-(--text-muted)">Your store is paused — it shows a temporarily-unavailable notice and BUY is disabled.</p>
      )}
      {(store.status === "suspended" || store.status === "closed") && (
        <p className="text-sm text-(--text-muted)">This store is {String(store.status)} by platform action — see the notice on your public storefront.</p>
      )}
      {note && <p className="text-sm text-(--text-secondary)" role="status">{note}</p>}

      {/* Analytics — three honest buckets (CAP-257/450): aggregate-only,
          k&lt;5 suppressed, ≥24h delay; intent renders suppressed as "—". */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Analytics</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {(analytics ?? []).length === 0 && (
              <p className="text-sm text-(--text-muted)">No analytics windows yet — aggregate rollups appear after qualified activity (delayed ≥24h).</p>
            )}
            {(analytics ?? []).slice(0, 3).map((w: any) => (
              <div key={String(w.window)} className="rounded-md border border-(--border-default) bg-(--bg-surface) p-3 space-y-1">
                <p className="text-xs uppercase tracking-wide text-(--text-muted)">{String(w.window).slice(0, 10)}</p>
                <p className="text-sm text-(--text-secondary)">Traffic: <span className="font-medium text-(--text-primary)">{w.traffic ?? "—"}</span></p>
                <p className="text-sm text-(--text-secondary)">Intent:{" "}
                  <span className="font-medium text-(--text-primary)">
                    {w.intent ? `${w.intent.views} views · ${w.intent.clicks} clicks` : "—"}
                  </span>
                </p>
                <p className="text-sm text-(--text-secondary)">Confirmed: <span className="font-medium text-(--text-primary)">{w.confirmed ?? "—"}</span></p>
              </div>
            ))}
          </div>
          <p className="text-xs text-(--text-muted)">Aggregate-only, small cells suppressed, ≥24h delay — no buyer identity is ever shown.</p>
        </CardContent>
      </Card>

      {/* Products — A1 data-table archetype; statuses are the enum-backed set */}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Products</h2></CardHeader>
        <CardContent className="space-y-3">
          {products.length === 0 ? (
            <p className="text-sm text-(--text-muted)">No products yet — submit your first below.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-(--text-muted)">
                  <th className="py-2 pr-2 font-medium">Name</th>
                  <th className="py-2 pr-2 font-medium">Category</th>
                  <th className="py-2 pr-2 font-medium">Status</th>
                  <th className="py-2 font-medium" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={String(p.productId)} className="border-t border-(--border-default)">
                    <td className="py-2 pr-2 text-(--text-primary)">{p.name}</td>
                    <td className="py-2 pr-2 text-(--text-secondary)">{p.category}</td>
                    <td className="py-2 pr-2">
                      <Badge tone={p.status === "approved" ? "success" : p.status === "rejected" ? "error" : "info"}>
                        {String(p.status).replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">
                      {p.status === "approved" && (
                        <Button
                          size="sm" variant="ghost" disabled={busy}
                          onClick={() => { setEditFor(p); setEditDesc(""); setEditClaims(""); }}
                        >
                          Request edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-(--text-muted)">
            Approved packages are locked — edits land as a new version for re-validation while the current one stays live.
          </p>
        </CardContent>
      </Card>

      {/* Product submit — multi-part form; the link enters validation at pending */}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Submit a product</h2></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="p-name" className="text-sm font-medium text-(--text-primary)">Name</label>
            <Input id="p-name" value={pName} onChange={(e) => setPName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-category" className="text-sm font-medium text-(--text-primary)">Category</label>
            <Input id="p-category" value={pCategory} onChange={(e) => setPCategory(e.target.value)} placeholder="e.g. ai-writing" />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-usecase" className="text-sm font-medium text-(--text-primary)">Use case</label>
            <Input id="p-usecase" value={pUseCase} onChange={(e) => setPUseCase(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-url" className="text-sm font-medium text-(--text-primary)">Destination URL</label>
            <Input id="p-url" value={pUrl} onChange={(e) => setPUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-network" className="text-sm font-medium text-(--text-primary)">Network</label>
            <Input id="p-network" value={pNetwork} onChange={(e) => setPNetwork(e.target.value)} placeholder="impact, awin, amazon…" />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-program" className="text-sm font-medium text-(--text-primary)">Program name</label>
            <Input id="p-program" value={pProgram} onChange={(e) => setPProgram(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-ref" className="text-sm font-medium text-(--text-primary)">Affiliate account ref (masked)</label>
            <Input id="p-ref" value={pRef} onChange={(e) => setPRef(e.target.value)} placeholder="e.g. ****-4821" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="p-desc" className="text-sm font-medium text-(--text-primary)">Description</label>
            <textarea id="p-desc" value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={3}
              className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) p-2 text-sm" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="p-claims" className="text-sm font-medium text-(--text-primary)">Claims</label>
            <textarea id="p-claims" value={pClaims} onChange={(e) => setPClaims(e.target.value)} rows={2}
              className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) p-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <Button
              disabled={!canSubmitProduct}
              onClick={() => run(async () => {
                await submitProduct({
                  name: pName.trim(), category: pCategory.trim(), useCase: pUseCase.trim(),
                  description: pDesc.trim(), claims: pClaims.trim(), submittedUrl: pUrl.trim(),
                  network: pNetwork.trim(), programName: pProgram.trim(), affiliateAccountRefMasked: pRef.trim(),
                });
                setPName(""); setPCategory(""); setPUseCase(""); setPDesc(""); setPClaims(""); setPUrl(""); setPNetwork(""); setPProgram(""); setPRef("");
              }, "Product submitted — the link enters validation (pending) and will be reviewed before it can go live.")}
            >
              Submit product
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales evidence — four tiers NEVER conflated; CAP-525 two-field write */}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Sales evidence</h2></CardHeader>
        <CardContent className="space-y-3">
          {evidence.length === 0 ? (
            <p className="text-sm text-(--text-muted)">No evidence submitted yet.</p>
          ) : (
            <ul className="space-y-2">
              {evidence.map((e) => {
                const pillar = evidencePillar(e);
                return (
                  <li key={String(e.evidenceId)} className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge tone={pillar.tone}>{pillar.label}</Badge>
                    <span className="text-(--text-secondary)">
                      {e.amount != null ? `${e.amount}` : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="ev-product" className="text-sm font-medium text-(--text-primary)">Product</label>
              <select
                id="ev-product" value={evidenceFor} onChange={(e) => setEvidenceFor(e.target.value)}
                className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) p-2 text-sm"
              >
                <option value="">Select…</option>
                {products.map((p) => <option key={String(p.productId)} value={String(p.productId)}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="ev-amount" className="text-sm font-medium text-(--text-primary)">Amount (optional)</label>
              <Input id="ev-amount" value={evidenceAmount} onChange={(e) => setEvidenceAmount(e.target.value)} placeholder="e.g. 24.99" />
            </div>
            <div className="space-y-1">
              <label htmlFor="ev-ref" className="text-sm font-medium text-(--text-primary)">Reference (optional)</label>
              <Input id="ev-ref" value={evidenceRef} onChange={(e) => setEvidenceRef(e.target.value)} placeholder="order/click ref" />
            </div>
          </div>
          <div>
            <Button
              disabled={!evidenceFor || busy}
              onClick={() => run(async () => {
                await submitSelfReport({
                  storefrontProductId: evidenceFor as any,
                  amount: evidenceAmount.trim() ? Number(evidenceAmount) : undefined,
                  conversionRef: evidenceRef.trim() || undefined,
                });
                setEvidenceFor(""); setEvidenceAmount(""); setEvidenceRef("");
              }, "Self-report recorded as type=self_report + status=unverified — it stays visibly distinct from network-verified sales and never reads as one.")}
            >
              Self-report a sale
            </Button>
          </div>
          <p className="text-xs text-(--text-muted)">
            Self-reports (incl. the Amazon interim tier) are flagged unverified, anomaly-checked, and carry less weight than
            network-verified conversions. SubID and coupon evidence is confirmed only by the later network/merchant report.
          </p>
        </CardContent>
      </Card>

      {/* Pause confirm — CAP-270: immediate, no review */}
      <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause your store?</DialogTitle>
            <DialogDescription>
              Pausing is immediate (no review). Your storefront shows a temporarily-unavailable notice and BUY is disabled until you resume via support.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPauseOpen(false)}>Cancel</Button>
            <Button
              disabled={busy}
              onClick={async () => {
                await run(() => pauseMyStore(), "Store paused — immediate, no review (CAP-270).");
                setPauseOpen(false);
              }}
            >
              Pause store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit request — CAP-239: new version for re-validation; current stays live */}
      <Dialog open={editFor !== null} onOpenChange={(o) => !o && setEditFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request an edit — {editFor?.name}</DialogTitle>
            <DialogDescription>
              The edit lands as a new version for re-validation. The current package stays live until the new one is approved and locked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="edit-desc" className="text-sm font-medium text-(--text-primary)">New description</label>
              <textarea id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3}
                className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) p-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-claims" className="text-sm font-medium text-(--text-primary)">New claims</label>
              <textarea id="edit-claims" value={editClaims} onChange={(e) => setEditClaims(e.target.value)} rows={2}
                className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) p-2 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditFor(null)}>Cancel</Button>
            <Button
              disabled={!editDesc.trim() || !editClaims.trim() || busy}
              onClick={async () => {
                await run(async () => {
                  await requestEdit({ storefrontProductId: editFor.productId, description: editDesc.trim(), claims: editClaims.trim() });
                }, "Edit requested — the current package stays live until the new version is validated.");
                setEditFor(null);
              }}
            >
              Submit edit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
