/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /appeal/[actionId] — SLICE-P7T-04 (CAP-340): the member submit
 * surface. (quoted): "This route submits the appeal; it does not decide
 * it." Server gates are authoritative (deadline, bounds, URLs, one per
 * action); UI-disable is additive only.
 */

import { use, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

export default function AppealPage({ params }: { params: Promise<{ actionId: string }> }) {
  const { actionId } = use(params);
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const submit = useMutation(api.appeal.submit);
  // CONTRACT-7-appeal §1: "no anonymous access" + §4 "load appealable
  // action" — screen audit 2026-09-18: the route previously had no auth
  // gate and never loaded the action/deadline/prior-appeal state, so an
  // already-appealed or deadline-closed case only failed after submit.
  const myActions = useQuery(
    api.appeal.myActions,
    configured && authStatus === "authenticated" ? {} : "skip",
  );
  const current = (myActions?.actions as any[] | undefined)?.find((a) => a.actionId === actionId) ?? null;
  const [statement, setStatement] = useState("");
  const [evidence, setEvidence] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const evidenceRefs = evidence.split(/[\s,]+/).filter(Boolean);

  if (!configured || authStatus === "loading") {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-(--text-muted)">
          <a href="/signin" className="underline">Sign in</a> to appeal a moderation action.
        </CardContent>
      </Card>
    );
  }

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
        {current ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-(--border-default) p-3">
            <Badge tone={current.windowOpen ? "info" : "warning"}>{current.caseStatus}</Badge>
            <span className="text-xs text-(--text-muted)">
              {current.windowOpen
                ? `Appeal window open until ${new Date(current.deadlineAt).toLocaleDateString()}.`
                : current.caseStatus === "appealed"
                  ? "This action has already been appealed."
                  : "The appeal window for this action has closed."}
            </span>
          </div>
        ) : myActions !== undefined ? (
          <p className="text-xs text-(--text-muted)">
            No appealable action found for this id — it may not belong to you, or is not an appealable action type.
          </p>
        ) : null}
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
          disabled={statement.trim().length === 0 || evidenceRefs.length > 3 || (current ? !current.windowOpen : false)}
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
