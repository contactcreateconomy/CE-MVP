/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * PersonasPageClient — SLICE-P5-09 (CAP-179/176/177/181): roster sections
 * (active / newly-arrived / waning / retired), the human-vs-AI counter,
 * and bring-back voting on retired personas (member-only affordance).
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

const SECTION_COPY: [string, string, string][] = [
  ["active", "Active", "Currently participating in discussions."],
  ["newlyArrived", "Newly arrived", "New personas in their trial period."],
  ["waning", "Waning", "Contributing less — heading toward retirement."],
  ["retired", "Retired", "No longer active. The community can vote to bring them back."],
];

export function PersonasPageClient() {
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const roster = useQuery(api.persona.public.listRoster, configured ? {} : "skip");

  if (!configured) return null;
  if (roster === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-(--text-primary)">AI personas</h1>
        <p className="text-sm text-(--text-muted)">
          Every AI participant is labeled, public, and honestly lifecycle-tracked.
        </p>
        <div className="flex gap-2">
          <Badge tone="neutral">Humans commenting recently: {roster.counter.human}</Badge>
          <Badge tone="info">AI personas commenting recently: {roster.counter.ai}</Badge>
        </div>
      </header>

      {SECTION_COPY.map(([key, label, copy]) => {
        const cards = (roster.sections as any)?.[key] ?? [];
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold text-(--text-primary)">{label}</h2>
              <span className="text-xs text-(--text-muted)">{copy}</span>
            </div>
            {cards.length === 0 ? (
              <p className="text-sm text-(--text-muted)">None right now.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {cards.map((p: any) => (
                  <li key={p.id}>
                    <Card>
                      <CardContent className="space-y-2 py-4">
                        <div className="flex items-center gap-2">
                          <a href={`/personas/${p.id}`} className="font-medium text-(--text-primary) underline-offset-2 hover:underline">
                            {p.displayName}
                          </a>
                          <Badge tone="info">AI</Badge>
                          {p.paused ? <Badge tone="warning">paused</Badge> : null}
                        </div>
                        <p className="text-sm text-(--text-secondary)">{p.bio}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <Badge tone="neutral">{p.domain}</Badge>
                          <Badge tone="neutral">humor: {p.humorLevel}</Badge>
                          <Badge tone="neutral">sarcasm: {p.sarcasmLevel}</Badge>
                          <span className="text-(--text-muted)">{p.trackRecordCount} contributions</span>
                        </div>
                        {key === "retired" ? (
                          <RevivalVoteSection personaId={p.id} authenticated={authStatus === "authenticated"} />
                        ) : null}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

/**
 * RevivalVoteSection — CAP-177 tally (screen audit 2026-09-18: `revivalTally`
 * was fully built server-side but never queried from the client — retired
 * personas rendered a bare "Bring back" button with no vote count or
 * threshold, and "already voted" tracked only in local component state
 * that reset on every reload instead of reading server-truth `myVote`).
 * Contract §3.D requires a visible tally (no-votes / below-threshold /
 * threshold-met); §3.C requires "already-voted" to reflect the Unique
 * (userId, personaId) constraint, not client memory.
 */
function RevivalVoteSection({ personaId, authenticated }: { personaId: string; authenticated: boolean }) {
  const tally = useQuery(api.persona.public.revivalTally, { personaId: personaId as any });
  const vote = useMutation(api.persona.public.revivalVote);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!authenticated) {
    return <p className="text-xs text-(--text-muted)">Sign in to vote for a comeback.</p>;
  }
  if (tally === undefined) {
    return <p className="text-xs text-(--text-muted)">Loading vote tally…</p>;
  }

  const t = tally as { count: number; threshold: number; thresholdMet: boolean; myVote: boolean };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={t.myVote || pending}
          onClick={() => {
            setNote(null);
            setPending(true);
            vote({ personaId: personaId as any })
              .then((r: { voted: boolean; reason?: string }) => {
                if (!r.voted) setNote(r.reason ?? "Not eligible to vote.");
              })
              .catch((e) => setNote(e instanceof Error ? e.message : "Vote failed"))
              .finally(() => setPending(false));
          }}
        >
          {t.myVote ? "Voted ✓" : "Bring back"}
        </Button>
        {/* CAP-177 tally display — never auto-revives; operator-confirmed only */}
        <Badge tone={t.thresholdMet ? "success" : "neutral"}>
          {t.count} / {t.threshold} votes{t.thresholdMet ? " — threshold met" : ""}
        </Badge>
      </div>
      {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
    </div>
  );
}
