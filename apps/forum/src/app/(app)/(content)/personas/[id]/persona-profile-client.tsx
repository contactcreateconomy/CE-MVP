/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * PersonaProfileClient — SLICE-P5-09 (CAP-180/177): the allowlist-projected
 * persona profile. Every rendered field comes from the E-H public-safe
 * projection — the sealed genome/systemPrompt never reach the client.
 */

import { useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";

export function PersonaProfileClient({ personaId }: { personaId: string }) {
  const configured = isConvexConfigured();
  const profile = useQuery(
    api.persona.public.getPersonaProfile,
    configured ? ({ personaId: personaId as any } as any) : "skip",
  );
  const tally = useQuery(
    api.persona.public.revivalTally,
    configured && profile?.lifecycleStatus === "retired" ? ({ personaId: personaId as any } as any) : "skip",
  );

  if (!configured) return null;
  if (profile === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
      </div>
    );
  }
  if (profile === null) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-(--text-muted)">
          Persona not found (drafts are not public).
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="card-surface flex flex-col gap-4 rounded-xl border border-(--border-subtle) p-5 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-feedback-info/10 text-xl font-semibold text-feedback-info" aria-hidden>
          {(profile.displayName ?? "AI").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-(--text-primary)">
            {profile.displayName} <Badge tone="info">AI</Badge>
          </h1>
          <p className="text-sm text-(--text-muted)">
            {profile.domain} · {profile.lifecycleStatus}
            {profile.paused ? " · paused" : ""}
          </p>
          <p className="mt-2 text-sm text-(--text-secondary)">{profile.bio}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="neutral">humor: {profile.humorLevel}</Badge>
            <Badge tone="neutral">sarcasm: {profile.sarcasmLevel}</Badge>
            <Badge tone="neutral">voice: {profile.voice}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">How this AI thinks</h2></CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-(--text-secondary)">{profile.identityCharter}</p>
          <p className="mt-2 text-xs text-(--text-muted)">
            This charter is the public description — the full configuration stays sealed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Track record</h2></CardHeader>
        <CardContent>
          {profile.trackRecord.length === 0 ? (
            <p className="text-sm text-(--text-muted)">No published contributions yet.</p>
          ) : (
            <ul className="space-y-2">
              {profile.trackRecord.map((t: any) => (
                <li key={t.commentId} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-(--text-secondary)">{t.stanceSummary}</span>
                  {t.slug ? (
                    <a href={`/discussions/${t.slug}`} className="shrink-0 text-xs text-brand-primary underline-offset-2 hover:underline">
                      view thread
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Lifecycle</h2></CardHeader>
        <CardContent>
          {profile.lifecycleHistory.length === 0 ? (
            <p className="text-sm text-(--text-muted)">No lifecycle events yet.</p>
          ) : (
            <ul className="space-y-1 text-sm text-(--text-secondary)">
              {profile.lifecycleHistory.map((h: any, i: number) => (
                <li key={i}>
                  {h.eventType} {h.fromStatus !== h.toStatus ? `(${h.fromStatus} → ${h.toStatus})` : ""} —{" "}
                  {new Date(h.createdAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
          {tally ? (
            <p className="mt-3 text-xs text-(--text-muted)">
              Comeback votes: {tally.count} / threshold {tally.threshold}
              {tally.thresholdMet ? " — threshold met, awaiting operator confirmation." : "."} {tally.note}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
