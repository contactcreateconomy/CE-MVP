"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */

/**
 * Route: /admin/personas/queue — SLICE-P5-11 (CAP-172/173/174/175): the
 * persona comment review queue. Drafts by status with regen (capped,
 * chronic-fail → waning handoff), approve (fail-closed on auto-kill +
 * inactive personas), reject (terminal), and schedule (future fire time;
 * the sweeper re-validates persona state).
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/convex";

export default function AdminPersonaQueuePage() {
  const queue = useQuery(api.persona.queue.listQueue, {});
  if (queue === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
      </div>
    );
  }
  if (queue === null) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-(--text-muted)">
          Staff access required.
        </CardContent>
      </Card>
    );
  }

  const columns: [string, string][] = [
    ["generated", "Generated (awaiting review)"],
    ["scheduled", "Scheduled"],
    ["approved", "Approved"],
    ["rejected", "Rejected (terminal)"],
    ["published", "Published"],
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Persona comment queue</h1>
        <p className="text-sm text-(--text-muted)">
          Hard-kill precedes review (INV-5); approval publishes via the M6 rules, AI-badged and
          rank-excluded (INV-6). Scheduled fires re-validate persona state — held, never forced.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {columns.map(([status, label]) => (
          <QueueColumn key={status} status={status} label={label} drafts={(queue as any)[status] ?? []} />
        ))}
      </div>
    </section>
  );
}

function QueueColumn({ status, label, drafts }: { status: string; label: string; drafts: any[] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">
          {label} ({drafts.length})
        </h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {drafts.length === 0 ? (
          <p className="text-sm text-(--text-muted)">Empty.</p>
        ) : (
          drafts.map((d: any) => <DraftCard key={d.id} draft={d} status={status} />)
        )}
      </CardContent>
    </Card>
  );
}

function DraftCard({ draft, status }: { draft: any; status: string }) {
  const approve = useMutation(api.persona.queue.approve);
  const reject = useMutation(api.persona.queue.reject);
  const regen = useMutation(api.persona.queue.regen);
  const schedule = useMutation(api.persona.queue.schedule);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");

  const run = async (fn: () => Promise<unknown>, okNote: string) => {
    setBusy(true);
    setNote(null);
    try {
      await fn();
      setNote(okNote);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-(--border-default) p-3 text-sm">
      <div className="flex items-center gap-2 text-xs text-(--text-muted)">
        <Badge tone="info">AI draft</Badge>
        <span>persona {draft.personaId.slice(-6)}</span>
        {draft.scheduledFor ? <span>· fires {new Date(draft.scheduledFor).toLocaleString()}</span> : null}
        {draft.supersededByDraftId ? <span>· superseded</span> : null}
      </div>
      <p className="whitespace-pre-wrap text-(--text-secondary)">{draft.body}…</p>
      {["generated", "edited", "scheduled"].includes(status) ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="secondary" size="sm" disabled={busy}
            onClick={() => void run(() => approve({ draftId: draft.id }), "Published (AI-badged, rank-excluded).")}>
            Approve & publish
          </Button>
          <Button variant="secondary" size="sm" disabled={busy}
            onClick={() => void run(() => regen({ draftId: draft.id }), "Regen result noted.")}>
            Regen
          </Button>
          <Button variant="ghost" size="sm" disabled={busy}
            onClick={() => void run(() => reject({ draftId: draft.id, reason: "operator_rejected" }), "Rejected (terminal).")}>
            Reject
          </Button>
          {status !== "scheduled" ? (
            <span className="flex items-center gap-1">
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="rounded border border-(--border-default) bg-(--bg-surface) px-1.5 py-1 text-xs"
                aria-label="Schedule fire time"
              />
              <Button variant="ghost" size="sm" disabled={busy || !scheduleAt}
                onClick={() => void run(
                  () => schedule({ draftId: draft.id, scheduledFor: new Date(scheduleAt).getTime() }),
                  "Scheduled (sweeper re-validates persona state).",
                )}>
                Schedule
              </Button>
            </span>
          ) : null}
        </div>
      ) : null}
      {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
    </div>
  );
}
