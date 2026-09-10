/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * CanonicalProfile — SLICE-P5-07 (CAP-526/527/528): the merged Profile
 * read surface. Overview (identity + per-field badge pills + Awards shelf
 * + Metrics RESERVED for W7 — honest placeholders), Journal Summary +
 * Ledger (self-only — hidden for others/anonymous per the register's
 * quoted launch assumption). No mutations here — edits deep-link to
 * /settings/profile.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { A8Ladder } from "@/components/ladder/a8-ladder";

const FIELD_LABELS: Record<string, string> = {
  roleArchetype: "Role", ageBand: "Age band", toolsUsed: "Tools",
  bio: "Bio", interests: "Interests", socials: "Socials",
  basic_profile: "Basic profile",
};

const EVENT_LABELS: Record<string, string> = {
  post_published: "Posts published", comment_created: "Comments written",
  upvote_given: "Valuable given", save_added: "Saves",
  resource_acquired: "Resources acquired", tier_unlocked: "Tiers unlocked",
};

export function CanonicalProfile({ data }: { data: any }) {
  const [tab, setTab] = useState<"overview" | "journal" | "metrics">("overview");
  const identity = data.identity;

  return (
    <section className="animate-route-emerge space-y-6">
      {/* Identity card (§11.3 + §11.6 analog — default avatar renders the initial) */}
      <div className="card-surface flex flex-col gap-4 rounded-xl border border-(--border-subtle) p-5 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xl font-semibold text-brand-primary" aria-hidden>
          {(identity.displayName ?? "M").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-(--text-primary)">{identity.displayName}</h1>
          <p className="text-sm text-(--text-muted)">@{identity.username}</p>
          {identity.roleArchetype ? (
            <p className="mt-1 text-xs text-(--text-muted)">{identity.roleArchetype.replace(/_/g, " ")}</p>
          ) : null}
          {identity.bio ? <p className="mt-2 text-sm text-(--text-secondary)">{identity.bio}</p> : null}
          {data.interests?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {data.interests.map((label: string) => <Badge key={label} tone="brand">{label}</Badge>)}
            </div>
          ) : null}
        </div>
        {data.isSelf ? (
          <Button variant="secondary" size="sm" onClick={() => (window.location.href = "/settings/profile")}>
            Edit profile
          </Button>
        ) : null}
      </div>

      {/* Tabs: Overview · Journal (self-only) · Metrics (W7-reserved) */}
      <div className="flex gap-1" role="tablist" aria-label="Profile sections">
        {([
          ["overview", "Overview"],
          ...(data.isSelf ? ([["journal", "Journal"]] as const) : []),
          ["metrics", "Metrics"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key as typeof tab)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-brand-primary/10 text-brand-primary"
                : "bg-bg-overlay text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Profile completion</h2></CardHeader>
            <CardContent>
              {data.badges.length === 0 ? (
                <p className="text-sm text-(--text-muted)">No completed fields yet — per-field badges appear as fields complete (never a progress bar).</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.badges.map((field: string) => (
                    <Badge key={field} tone="success">{FIELD_LABELS[field] ?? field} ✓</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Awards</h2></CardHeader>
            <CardContent className="py-6 text-center text-sm text-(--text-muted)">
              Awards shelf arrives with the Wave-7 reputation enrichment (CAP-297) — honest empty for now.
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "journal" && data.journal ? (
        <div className="space-y-4">
          <Card>
            <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Journal — Summary</h2></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.journal.summary).length === 0 ? (
                  <p className="text-sm text-(--text-muted)">Your activity summary builds as you participate.</p>
                ) : (
                  Object.entries(data.journal.summary).map(([eventType, count]) => (
                    <Badge key={eventType} tone="neutral">{EVENT_LABELS[eventType] ?? eventType}: {count as number}</Badge>
                  ))
                )}
              </div>
              {data.journal.milestones.length > 0 ? (
                <ul className="space-y-1 text-sm text-(--text-secondary)">
                  {data.journal.milestones.map((m: any) => (
                    <li key={m.eventType}>First {EVENT_LABELS[m.eventType]?.toLowerCase() ?? m.eventType} — {new Date(m.createdAt).toLocaleDateString()}</li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Journal — Ledger</h2></CardHeader>
            <CardContent>
              {data.journal.ledger.entries.length === 0 ? (
                <p className="text-sm text-(--text-muted)">No entries yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.journal.ledger.entries.map((e: any) => (
                    <li key={e.id} className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="text-(--text-secondary)">{e.summary}</span>
                      <span className="shrink-0 text-xs text-(--text-muted)">{new Date(e.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-(--text-muted)">Private — your Journal is visible only to you at launch.</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "metrics" ? <MetricsTab handle={identity.username} /> : null}
    </section>
  );
}

/**
 * MetricsTab — SLICE-P7E-09: the public triad Reach·Signals·Awards
 * (Signals = activeSignals, CAP-281), the A8 ladder v1, join/leave
 * (CAP-300/301), and the CAP-312 opt-out FULL hide. One query, one
 * render for anonymous and member (CAP-313) — the viewer branch is
 * join-state only, never content.
 */
function MetricsTab({ handle }: { handle: string }) {
  const configured = isConvexConfigured();
  const metrics = useQuery(
    api.profile.metrics.getMetrics,
    configured ? ({ handle } as any) : "skip",
  );
  const joinDist = useMutation(api.profile.metrics.join);
  const leaveDist = useMutation(api.profile.metrics.leave);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (!configured || metrics === undefined) {
    return (
      <Card><CardContent className="py-8 text-center text-sm text-(--text-muted)">Loading metrics…</CardContent></Card>
    );
  }
  if (metrics.state === "not_found") {
    return (
      <Card><CardContent className="py-8 text-center text-sm text-(--text-muted)">No metrics found.</CardContent></Card>
    );
  }
  // CAP-312 (quoted): "the opted-out profile shows none of the public
  // triad + ladder + badges" — math unchanged, surface hidden
  if (metrics.economyHidden) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-(--text-muted)">
          This member doesn&apos;t publicly share economy metrics.
        </CardContent>
      </Card>
    );
  }

  const triad = metrics.triad ?? { reach: 0, signals: 0, awards: 0 };
  const awardsShelf = metrics.awardsShelf ?? [];
  const ladder = metrics.ladder ?? null;
  const membership = metrics.membership ?? null;
  return (
    <div className="space-y-4">
      {/* The public triad — Signals is the ACTIVE count (CAP-281) */}
      <div className="grid grid-cols-3 gap-3">
        {([
          ["Reach", triad.reach, "verified members"],
          ["Signals", triad.signals, "active (90d)"],
          ["Awards", triad.awards, "earned badges"],
        ] as const).map(([label, value, hint]) => (
          <Card key={label}>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-semibold text-(--text-primary)">{Number(value ?? 0).toLocaleString()}</p>
              <p className="text-sm font-medium text-(--text-secondary)">{label}</p>
              <p className="text-xs text-(--text-muted)">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {awardsShelf?.length ? (
        <Card>
          <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Awards shelf</h2></CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {awardsShelf.map((b: any, i: number) => (
              <Badge key={i} tone={b.revoked ? "neutral" : "success"}>
                {b.label}{b.revoked ? " (revoked)" : ""}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Ladder</h2></CardHeader>
        <CardContent>
          <A8Ladder ladder={ladder} />
        </CardContent>
      </Card>

      {membership ? (
        <div className="flex items-center gap-2">
          {membership.joined ? (
            <Button
              variant="secondary" size="sm" disabled={busy}
              onClick={() => {
                setBusy(true);
                void leaveDist({ handle }).then(() => setNote("You left this distribution."))
                  .catch((e) => setNote(String(e?.message ?? e)))
                  .finally(() => setBusy(false));
              }}
            >
              Leave distribution
            </Button>
          ) : (
            // Join is deliberate, never auto (CAP-300, quoted)
            <Button
              size="sm" disabled={busy}
              onClick={() => {
                setBusy(true);
                void joinDist({ handle }).then(() => setNote("You joined this distribution."))
                  .catch((e) => setNote(String(e?.message ?? e)))
                  .finally(() => setBusy(false));
              }}
            >
              Join distribution
            </Button>
          )}
          {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
