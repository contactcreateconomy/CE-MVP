"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results are untyped at the client edge until codegen push */

/**
 * Route: /admin/sources — SLICE-P4-08 (CAP-538 + CAP-031).
 * CONTRACT-4-sources States 1-3: sources table (health from latest config),
 * register (blank form), edit (prefilled). Method-dependent fields per
 * contract §3. R-SSRF ingress rejection surfaces from the server. Minimal
 * block/unblock (Wave-4 E2) — no deletion, no takedown, no manual poll
 * (contract §4's explicit NOT-actions).
 */

import { useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Globe, Plus, Save, ShieldOff, ShieldCheck } from "lucide-react";

import { api } from "../../../../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, DataTableToolbar, type DataTableColumn } from "@/components/ui/data-table";
import { SkeletonText } from "@/components/ui/skeleton";

interface SourceRow {
  _id: string;
  url: string;
  domain: string;
  trustLevel: string;
  createdAt: number;
  config: {
    method: string;
    feedUrl?: string;
    youtubeChannelId?: string;
    newsletterInbox?: string;
    pollIntervalMinutes: number;
    lastPolledAt?: number;
    lastSuccessAt?: number;
    nextPollAt?: number;
    consecutiveFailures: number;
    maxRequestsPerDay: number;
    robotsStatus: string;
    rightsBasis: string;
    termsReviewStatus: string;
  } | null;
}

const METHODS = ["rss", "youtube_api", "newsletter", "raw_scrape", "operator_paste"] as const;
type Method = (typeof METHODS)[number];

export default function AdminSourcesPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<SourceRow | "new" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    url: "",
    trustLevel: "approved",
    method: "rss" as Method,
    feedUrl: "",
    youtubeChannelId: "",
    newsletterInbox: "",
    pollIntervalMinutes: "360",
    maxRequestsPerDay: "50",
    robotsStatus: "unknown",
    rightsBasis: "unset",
    termsReviewStatus: "pending",
  });

  const sources = useQuery(api.sources.listSources);
  const upsert = useMutation(api.sources.sourceUpsert);
  const validateUrl = useAction(api.sources.validateSourceUrl);
  const setTrustLevel = useMutation(api.sources.setTrustLevel);

  const rows: SourceRow[] = useMemo(() => (sources as any[]) ?? [], [sources]);
  const filtered = useMemo(
    () => (search ? rows.filter((r) => r.domain.toLowerCase().includes(search.toLowerCase())) : rows),
    [rows, search],
  );

  const openRegister = () => {
    setEditing("new");
    setFormError(null);
    setForm((f) => ({ ...f, url: "", trustLevel: "approved" }));
  };

  const openEdit = (row: SourceRow) => {
    setEditing(row);
    setFormError(null);
    setForm((f) => ({
      ...f,
      url: row.url,
      trustLevel: row.trustLevel,
      method: (row.config?.method ?? "rss") as Method,
      feedUrl: row.config?.feedUrl ?? "",
      youtubeChannelId: row.config?.youtubeChannelId ?? "",
      newsletterInbox: row.config?.newsletterInbox ?? "",
      pollIntervalMinutes: String(row.config?.pollIntervalMinutes ?? 360),
      maxRequestsPerDay: String(row.config?.maxRequestsPerDay ?? 50),
      robotsStatus: row.config?.robotsStatus ?? "unknown",
      rightsBasis: row.config?.rightsBasis ?? "unset",
      termsReviewStatus: row.config?.termsReviewStatus ?? "pending",
    }));
  };

  const save = async () => {
    if (!editing) return;
    setFormError(null);
    setSaving(true);
    try {
      // R-SSRF ingress: full validation (DNS+IP) runs in the action first;
      // the mutation independently enforces the syntactic layer.
      const validation = await validateUrl({ url: form.url });
      if (!validation.ok) {
        setFormError(`R-SSRF ingress rejected: ${validation.reason}`);
        return;
      }
      await upsert({
        sourceId: editing === "new" ? undefined : (editing._id as any),
        url: form.url,
        trustLevel: form.trustLevel as any,
        config: {
          method: form.method,
          feedUrl: form.method === "rss" ? form.feedUrl : undefined,
          youtubeChannelId: form.method === "youtube_api" ? form.youtubeChannelId : undefined,
          newsletterInbox: form.method === "newsletter" ? form.newsletterInbox : undefined,
          pollIntervalMinutes: Number(form.pollIntervalMinutes) || 360,
          maxRequestsPerDay: Number(form.maxRequestsPerDay) || 50,
          robotsStatus: form.robotsStatus,
          rightsBasis: form.rightsBasis,
          termsReviewStatus: form.termsReviewStatus,
        },
      });
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (row: SourceRow) => {
    await setTrustLevel({
      sourceId: row._id as any,
      trustLevel: row.trustLevel === "blocked" ? "approved" : "blocked",
    });
  };

  const health = (row: SourceRow) => {
    if (!row.config) return { label: "no config", tone: "neutral" as const };
    if (!row.config.lastPolledAt) return { label: "never polled", tone: "neutral" as const };
    if (row.config.consecutiveFailures >= 1) return { label: `failing ×${row.config.consecutiveFailures}`, tone: "error" as const };
    return { label: "succeeding", tone: "success" as const };
  };

  const columns: DataTableColumn<SourceRow>[] = [
    { key: "domain", header: "Source", cell: (r) => <span className="font-mono text-sm">{r.domain}</span> },
    {
      key: "trustLevel",
      header: "Trust",
      cell: (r) => (
        <Badge tone={r.trustLevel === "approved" ? "success" : r.trustLevel === "blocked" ? "error" : "warning"}>
          {r.trustLevel}
        </Badge>
      ),
    },
    { key: "method", header: "Method", cell: (r) => <span className="text-sm text-text-secondary">{r.config?.method ?? "—"}</span> },
    { key: "health", header: "Health", cell: (r) => <Badge tone={health(r).tone}>{health(r).label}</Badge> },
    { key: "cadence", header: "Cadence", cell: (r) => <span className="text-xs text-text-muted">{r.config ? `${r.config.pollIntervalMinutes}m` : "—"}</span> },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(r)} aria-label={`Edit ${r.domain}`}>
            <Globe className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void toggleBlock(r)}
            aria-label={r.trustLevel === "blocked" ? `Unblock ${r.domain}` : `Block ${r.domain}`}
          >
            {r.trustLevel === "blocked" ? <ShieldCheck className="size-4" /> : <ShieldOff className="size-4" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[980px] space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-(--text-primary)">Sources</h1>
        <p className="text-sm text-(--text-secondary)">
          Operator-curated ingestion registry — register sources, set method + cadence, block/unblock. Polls run on
          cron; there is no manual poll (contract §4).
        </p>
      </header>

      {sources === undefined ? (
        <SkeletonText className="w-full" />
      ) : (
        <section aria-label="Sources table" className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Filter by domain…" />
              <Button variant="primary" size="sm" onClick={openRegister}>
                <Plus className="size-4" />
                Register source
              </Button>
            </div>
            <DataTable columns={columns} data={filtered} getRowId={(r) => r._id} density="compact" />
        </section>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Register source" : `Edit ${(editing as SourceRow)?.domain ?? ""}`}</DialogTitle>
            <DialogDescription>
              Ingress is R-SSRF validated at registration and every fetch: HTTPS-only, no credentials, no private IPs,
              no nonstandard ports.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="src-url" className="text-xs text-(--text-secondary)">Source URL</label>
              <Input id="src-url" value={form.url} placeholder="https://example.com" onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-(--text-secondary)">Trust level</label>
                <Select value={form.trustLevel} onValueChange={(v) => setForm((f) => ({ ...f, trustLevel: v }))}>
                  <SelectTrigger aria-label="Trust level"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">approved</SelectItem>
                    <SelectItem value="conditional">conditional</SelectItem>
                    <SelectItem value="blocked">blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-(--text-secondary)">Method</label>
                <Select value={form.method} onValueChange={(v) => setForm((f) => ({ ...f, method: v as Method }))}>
                  <SelectTrigger aria-label="Ingestion method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.method === "rss" ? (
              <div className="space-y-1">
                <label htmlFor="src-feed" className="text-xs text-(--text-secondary)">Feed URL</label>
                <Input id="src-feed" value={form.feedUrl} placeholder="https://example.com/feed.xml" onChange={(e) => setForm((f) => ({ ...f, feedUrl: e.target.value }))} />
              </div>
            ) : null}
            {form.method === "youtube_api" ? (
              <div className="space-y-1">
                <label htmlFor="src-yt" className="text-xs text-(--text-secondary)">YouTube channel ID</label>
                <Input id="src-yt" value={form.youtubeChannelId} placeholder="UC…" onChange={(e) => setForm((f) => ({ ...f, youtubeChannelId: e.target.value }))} />
              </div>
            ) : null}
            {form.method === "newsletter" ? (
              <div className="space-y-1">
                <label htmlFor="src-inbox" className="text-xs text-(--text-secondary)">Newsletter inbox</label>
                <Input id="src-inbox" value={form.newsletterInbox} placeholder="briefs@createconomy.internal" onChange={(e) => setForm((f) => ({ ...f, newsletterInbox: e.target.value }))} />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="src-interval" className="text-xs text-(--text-secondary)">Poll interval (minutes)</label>
                <Input id="src-interval" inputMode="numeric" value={form.pollIntervalMinutes} onChange={(e) => setForm((f) => ({ ...f, pollIntervalMinutes: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label htmlFor="src-budget" className="text-xs text-(--text-secondary)">Max requests / day</label>
                <Input id="src-budget" inputMode="numeric" value={form.maxRequestsPerDay} onChange={(e) => setForm((f) => ({ ...f, maxRequestsPerDay: e.target.value }))} />
              </div>
            </div>

            {formError ? <Banner variant="error">{formError}</Banner> : null}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={() => void save()}>
              <Save className="size-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
