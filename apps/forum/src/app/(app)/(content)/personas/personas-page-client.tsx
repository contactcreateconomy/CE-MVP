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
  const vote = useMutation(api.persona.public.revivalVote);
  const [votedFor, setVotedFor] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<string | null>(null);

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
                          authStatus === "authenticated" ? (
                            <div className="space-y-1">
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={votedFor.has(p.id)}
                                onClick={() => {
                                  setNote(null);
                                  vote({ personaId: p.id as any })
                                    .then((r: any) => {
                                      if (r?.voted) setVotedFor((prev) => new Set([...prev, p.id]));
                                      else setNote(r?.reason ?? "Not eligible to vote.");
                                    })
                                    .catch((e) => setNote(e instanceof Error ? e.message : "Vote failed"));
                                }}
                              >
                                {votedFor.has(p.id) ? "Voted ✓" : "Bring back"}
                              </Button>
                              {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
                            </div>
                          ) : (
                            <p className="text-xs text-(--text-muted)">Sign in to vote for a comeback.</p>
                          )
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
