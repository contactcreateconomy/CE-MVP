"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */

/**
 * Route: /admin/curation — SLICE-P6-04 (CAP-191/192/554): hero upsert/
 * schedule, Featured booking (cadence-capped), emergency-pull
 * (Administrator-only). Curation is display-only — no score writes.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/convex";
import { useAuth } from "@cemvp/auth-ui";

export default function AdminCurationPage() {
  const { authStatus } = useAuth();
  const state = useQuery(api.admin.curation.getCurationState, authStatus === "authenticated" ? {} : "skip");
  const heroUpsert = useMutation(api.admin.curation.heroUpsert);
  const setFeatured = useMutation(api.admin.curation.setFeatured);
  const pullFeatured = useMutation(api.admin.curation.pullFeatured);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (state === undefined) {
    return <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" /></div>;
  }
  if (state === null) {
    return <Card><CardContent className="py-8 text-center text-sm text-(--text-muted)">Staff access required.</CardContent></Card>;
  }

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setNote(null);
    try { await fn(); setNote(ok); } catch (e) { setNote(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Hero &amp; Featured curation</h1>
        <p className="text-sm text-(--text-muted)">
          Display-only scheduling — never organic ranking. 10 hero slots (4–6 render, ≥2 rotate/24h); Featured ≤1–2 active; emergency-pull is Administrator-only.
        </p>
      </header>

      <HeroForm onSubmit={(args) => run(() => heroUpsert(args as any), "Hero slot saved.")} busy={busy} />
      <FeaturedForm onSubmit={(args) => run(() => setFeatured(args as any), "Featured booked.")} busy={busy} />

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Hero slots ({state.heroSlots.length})</h2></CardHeader>
        <CardContent className="space-y-2">
          {state.heroSlots.length === 0 ? <p className="text-sm text-(--text-muted)">No slots yet — stale-active slots auto-fill from TOP as “Community Top”.</p> : (
            <ul className="space-y-1 text-sm">
              {state.heroSlots.map((s: any) => (
                <li key={s.slotId} className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">slot {s.slotOrder}</Badge>
                  <Badge tone={s.status === "active" ? "success" : s.status === "scheduled" ? "info" : "warning"}>{s.status}</Badge>
                  <span className="text-(--text-secondary)">{s.headlineOverride ?? s.postId}</span>
                  <span className="text-xs text-(--text-muted)">{new Date(s.startAt).toLocaleDateString()} → {new Date(s.endAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Featured ({state.featured.length} active)</h2></CardHeader>
        <CardContent className="space-y-2">
          {state.featured.length === 0 ? <p className="text-sm text-(--text-muted)">No active Featured slots.</p> : (
            <ul className="space-y-1 text-sm">
              {state.featured.map((f: any) => (
                <li key={f.featuredId} className="flex items-center justify-between gap-2">
                  <span className="text-(--text-secondary)">{f.label}</span>
                  <Button variant="destructive" size="sm" disabled={busy}
                    onClick={() => run(() => pullFeatured({ featuredId: f.featuredId }), "Pulled (trendScore untouched).")}>
                    Emergency pull
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
        </CardContent>
      </Card>
    </section>
  );
}

function HeroForm({ onSubmit, busy }: { onSubmit: (args: Record<string, unknown>) => void; busy: boolean }) {
  const [slotOrder, setSlotOrder] = useState("0");
  const [postId, setPostId] = useState("");
  const [headline, setHeadline] = useState("");
  const [days, setDays] = useState("2");
  const start = Date.now();
  const end = start + Number(days || 2) * 24 * 3_600_000;
  return (
    <Card>
      <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Schedule hero slot (CAP-192)</h2></CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Input value={slotOrder} onChange={(e) => setSlotOrder(e.target.value)} placeholder="slot 0–9" className="w-20" aria-label="Slot order" />
        <Input value={postId} onChange={(e) => setPostId(e.target.value)} placeholder="postId" className="w-64" aria-label="Post id" />
        <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="headline override (optional)" className="w-56" aria-label="Headline override" />
        <Input value={days} onChange={(e) => setDays(e.target.value)} placeholder="days live" className="w-20" aria-label="Days live" />
        <Button size="sm" disabled={busy || !postId.trim()}
          onClick={() => onSubmit({
            slotOrder: Number(slotOrder), postId: postId.trim(),
            headlineOverride: headline.trim() || undefined,
            startAt: start, endAt: end,
            desktopEnabled: true, mobileEnabled: true, status: "active",
          })}>
          Schedule
        </Button>
      </CardContent>
    </Card>
  );
}

function FeaturedForm({ onSubmit, busy }: { onSubmit: (args: Record<string, unknown>) => void; busy: boolean }) {
  const [postId, setPostId] = useState("");
  const [label, setLabel] = useState("");
  const [days, setDays] = useState("1");
  const start = Date.now();
  const end = start + Number(days || 1) * 24 * 3_600_000;
  return (
    <Card>
      <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Book Featured (CAP-191 — ≤1/cycle, ≤1–2 active)</h2></CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Input value={postId} onChange={(e) => setPostId(e.target.value)} placeholder="postId" className="w-64" aria-label="Post id" />
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label (renders as ‘Featured’)" className="w-56" aria-label="Label" />
        <Input value={days} onChange={(e) => setDays(e.target.value)} placeholder="days live" className="w-20" aria-label="Days live" />
        <Button size="sm" disabled={busy || !postId.trim() || !label.trim()}
          onClick={() => onSubmit({ postId: postId.trim(), label: label.trim(), startAt: start, endAt: end })}>
          Book
        </Button>
      </CardContent>
    </Card>
  );
}
