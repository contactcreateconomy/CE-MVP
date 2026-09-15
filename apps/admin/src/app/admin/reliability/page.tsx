/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /admin/reliability — SLICE-P7O-04/05 (CAP-499/500/501/503):
 * dead-letters + job states (manual_review VISIBLE, dispositioned via
 * the DECISIONS-LOCKED #5 actions); liveness dots; ordinary-letter
 * redrive with the F-22 fail-closed rejects.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "../../../../../../../convex/_generated/api";

export default function AdminReliabilityPage() {
  const data = useQuery(api.admin.reliability?.listDeadLetters, {});
  const redrive = useMutation(api.admin.reliability?.redriveDeadLetter);
  const dispose = useMutation(api.admin.reliability?.disposeManualReview);
  const [note, setNote] = useState<string | null>(null);

  const run = (fn: Promise<any>, ok: string) =>
    fn.then(() => setNote(ok)).catch((e) => setNote(String(e?.message ?? e)));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">Reliability</h1>
      <p className="text-xs text-text-muted">
        Liveness from lastSuccessAt (never lastStatus). manual_review rows carry Approve&amp;Retry / Cancel — redrive itself rejects them (F-22).
      </p>
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Dead letters (CAP-499 — never silent drop)</h2></CardHeader>
        <CardContent className="space-y-1">
          {(data?.deadLetters ?? []).length === 0 ? (
            <p className="text-sm text-(--text-muted)">No dead letters.</p>
          ) : (data?.deadLetters ?? []).map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border border-border-subtle px-3 py-2">
              <span className="text-sm text-(--text-primary)">{d.jobKey} — {d.reason}</span>
              {d.redrivenAt ? (
                <Badge tone="success">redriven</Badge>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => run(redrive({ deadLetterId: d.id }), "Re-queued.")}>
                  Redrive (CAP-500)
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Job runs</h2></CardHeader>
        <CardContent className="space-y-1">
          {(data?.jobRuns ?? []).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border border-border-subtle px-3 py-2">
              <span className="text-sm text-(--text-primary)">{r.jobKey} · attempt {r.attemptNumber}</span>
              <span className="flex items-center gap-2">
                <Badge tone={r.state === "succeeded" ? "success" : r.state === "manual_review" ? "warning" : "neutral"}>{r.state}</Badge>
                {r.manualReview ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => run(dispose({ jobRunId: r.id, action: "approve_retry" }), "Approved & retry queued.")}>Approve &amp; Retry</Button>
                    <Button variant="ghost" size="sm" onClick={() => run(dispose({ jobRunId: r.id, action: "cancel" }), "Cancelled (permanent fail).")}>Cancel</Button>
                  </>
                ) : null}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
    </div>
  );
}
