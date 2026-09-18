"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */

/**
 * Route: /admin/resources — SLICE-P6-10/11: the resources review pipeline
 * (rights/content lanes, forge, weights, artifact validation) + lifecycle
 * (publish/schedule/status) + takedown + kill-gate/kill-switch.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/skeleton";
import { api } from "@/lib/convex";
import { useAuth } from "@cemvp/auth-ui";

export default function AdminResourcesPage() {
  const { authStatus } = useAuth();
  const queue = useQuery(api.admin.resources.getReviewQueue, authStatus === "authenticated" ? {} : "skip");
  const [note, setNote] = useState<string | null>(null);

  if (queue === undefined) {
    return <div className="flex min-h-[30vh] items-center justify-center"><Spinner className="size-8" label="Loading" /></div>;
  }
  if (queue === null) {
    return <Card><CardContent className="py-8 text-center text-sm text-(--text-muted)">Staff access required.</CardContent></Card>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Resources — review &amp; lifecycle</h1>
        <p className="text-sm text-(--text-muted)">
          Rights → content → forge → weights → artifact validation → publish. UGC-disabled does not close this console.
        </p>
      </header>

      {(Object.entries(queue.lanes) as [string, any[]][]).map(([lane, rows]) => (
        <Card key={lane}>
          <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">{lane} ({rows.length})</h2></CardHeader>
          <CardContent className="space-y-2">
            {rows.length === 0 ? <p className="text-sm text-(--text-muted)">Empty.</p> : rows.map((r: any) => (
              <div key={r.referenceId} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge tone="neutral">{r.sourceClass}</Badge>
                <span className="text-(--text-secondary)">{r.rightsBasis ?? "—"}</span>
                <span className="text-xs text-(--text-muted)">{r.referenceId.slice(-8)}</span>
                {lane === "rights_review" ? (
                  <span className="ml-auto">
                    <RightsActions referenceId={r.referenceId} onNote={setNote} />
                  </span>
                ) : lane === "content_review" ? (
                  <span className="ml-auto">
                    <ContentActions referenceId={r.referenceId} onNote={setNote} />
                  </span>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
      <LifecyclePanel canPublish={Boolean(queue.canPublish)} canLegalHold={Boolean(queue.canLegalHold)} />
      {queue.isAdministrator ? <KillSwitchPanel /> : null}
    </section>
  );
}

/** rights_review lane — CAP-205 only (accept hands off to content_review). */
function RightsActions({ referenceId, onNote }: { referenceId: string; onNote: (s: string) => void }) {
  const rightsReview = useMutation(api.admin.resources.rightsReview);
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); onNote(ok); } catch (e) { onNote(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  };
  return (
    <span className="flex gap-1">
      <Button size="sm" variant="secondary" disabled={busy}
        onClick={() => void act(() => rightsReview({ referenceId: referenceId as any, accept: true }), "Rights accepted → content review.")}>
        Accept rights
      </Button>
      <Button size="sm" variant="ghost" disabled={busy}
        onClick={() => void act(() => rightsReview({ referenceId: referenceId as any, accept: false }), "Rejected.")}>
        Reject
      </Button>
    </span>
  );
}

/** content_review lane — CAP-206 (accept → accepted_for_forge; off-topic
 *  and unsafe are DISTINCT reject reasons, INV-11 — never collapsed). */
function ContentActions({ referenceId, onNote }: { referenceId: string; onNote: (s: string) => void }) {
  const contentReview = useMutation(api.admin.resources.contentReview);
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); onNote(ok); } catch (e) { onNote(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  };
  return (
    <span className="flex gap-1">
      <Button size="sm" variant="secondary" disabled={busy}
        onClick={() => void act(() => contentReview({ referenceId: referenceId as any, decision: "accept" }), "Content accepted → accepted_for_forge.")}>
        Accept content
      </Button>
      <Button size="sm" variant="ghost" disabled={busy}
        onClick={() => void act(() => contentReview({ referenceId: referenceId as any, decision: "reject_off_topic" }), "Rejected — off-topic.")}>
        Off-topic
      </Button>
      <Button size="sm" variant="ghost" disabled={busy}
        onClick={() => void act(() => contentReview({ referenceId: referenceId as any, decision: "reject_unsafe" }), "Rejected — unsafe.")}>
        Unsafe
      </Button>
    </span>
  );
}

function LifecyclePanel({ canPublish, canLegalHold }: { canPublish: boolean; canLegalHold: boolean }) {
  const publish = useMutation(api.admin.resourcesLifecycle.publish);
  const lifecycleWrite = useMutation(api.admin.resourcesLifecycle.lifecycleWrite);
  const [resourceId, setResourceId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setNote(null);
    try { await fn(); setNote(ok); } catch (e) { setNote(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  };
  // CAP-209/210: Publisher/store_operator only — Editor excluded.
  // CAP-557: under_legal_review is Moderator-only (narrower still).
  const statusButtons: Array<"paused" | "archived" | "review" | "under_legal_review"> = [
    "paused", "archived", "review", ...(canLegalHold ? (["under_legal_review"] as const) : []),
  ];
  return (
    <Card>
      <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Lifecycle (CAP-209/555–559)</h2></CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Input value={resourceId} onChange={(e) => setResourceId(e.target.value)} placeholder="resourceId" className="w-52" aria-label="Resource id" />
        {canPublish ? (
          <>
            <Input value={versionId} onChange={(e) => setVersionId(e.target.value)} placeholder="approved versionId" className="w-52" aria-label="Version id" />
            <Button size="sm" disabled={busy || !resourceId || !versionId}
              onClick={() => void act(() => publish({ resourceId: resourceId as any, versionId: versionId as any }), "Published (exactly one isCurrent).")}>
              Publish
            </Button>
          </>
        ) : (
          <span className="text-xs text-(--text-muted)">Publish requires Publisher/store_operator (CAP-209/210 — Editor excluded)</span>
        )}
        {statusButtons.map((next) => (
          <Button key={next} size="sm" variant="secondary" disabled={busy || !resourceId}
            onClick={() => void act(() => lifecycleWrite({ resourceId: resourceId as any, next }), `Status → ${next}.`)}>
            {next.replace(/_/g, " ")}
          </Button>
        ))}
        {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
      </CardContent>
    </Card>
  );
}

function KillSwitchPanel() {
  const killSwitch = useMutation(api.admin.resourcesLifecycle.ugcKillSwitch);
  const [justification, setJustification] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">UGC pilot kill-switch (CAP-221 — Administrator only)</h2></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-(--text-muted)">
          The kill-gate cron only RECOMMENDS (it never flips the flag). Flipping is this Administrator-only switch.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="justification (audited)" className="w-72" aria-label="Justification" />
          <Button size="sm" variant="destructive" disabled={busy || !justification.trim()}
            onClick={() => {
              setBusy(true); setNote(null);
              killSwitch({ enabled: false, justification: justification.trim() })
                .then(() => setNote("UGC disabled (audited)."))
                .catch((e) => setNote(e instanceof Error ? e.message : "Failed"))
                .finally(() => setBusy(false));
            }}>
            Disable UGC
          </Button>
          {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
