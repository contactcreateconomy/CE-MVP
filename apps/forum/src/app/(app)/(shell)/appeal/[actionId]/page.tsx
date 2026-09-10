/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /appeal/[actionId] — SLICE-P7T-04 (CAP-340): the member submit
 * surface. (quoted): "This route submits the appeal; it does not decide
 * it." Server gates are authoritative (deadline, bounds, URLs, one per
 * action); UI-disable is additive only.
 */

import { use, useState } from "react";
import { useMutation } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/convex";

export default function AppealPage({ params }: { params: Promise<{ actionId: string }> }) {
  const { actionId } = use(params);
  const submit = useMutation(api.appeal.submit);
  const [statement, setStatement] = useState("");
  const [evidence, setEvidence] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const evidenceRefs = evidence.split(/[\s,]+/).filter(Boolean);

  if (done) {
    return (
      <Card>
        <CardContent className="space-y-2 py-10 text-center">
          <h1 className="text-lg font-semibold text-(--text-primary)">Appeal submitted</h1>
          <p className="text-sm text-(--text-muted)">
            A moderator reviews appeals within 7 business days. You&apos;ll be notified of the outcome.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-lg font-semibold text-(--text-primary)">Appeal a moderation action</h1>
        <p className="text-xs text-(--text-muted)">
          One appeal per action · 14-day window for content actions, 30 for termination · no URLs.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-(--text-muted)">
          Action: <span className="font-mono">{actionId}</span>
        </p>
        <div>
          <label className="text-xs font-medium text-(--text-secondary)">Your statement (≤2,000 chars)</label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={6}
            maxLength={2000}
            aria-label="Appeal statement"
            className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary"
          />
          <p className="mt-1 text-xs text-text-muted">{statement.length}/2,000</p>
        </div>
        <div>
          <label className="text-xs font-medium text-(--text-secondary)">Evidence references (≤3 — post/comment ids, no URLs)</label>
          <input
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="space-separated ids"
            aria-label="Evidence references"
            className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary"
          />
          {evidenceRefs.length > 3 ? <Badge tone="warning">Max 3 references</Badge> : null}
        </div>
        {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
        <Button
          disabled={statement.trim().length === 0 || evidenceRefs.length > 3}
          onClick={() => {
            void submit({ actionId: actionId as any, statement, evidenceRefs })
              .then(() => setDone(true))
              .catch((e) => setNote(String(e?.message ?? e)));
          }}
        >
          Submit appeal
        </Button>
      </CardContent>
    </Card>
  );
}
