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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

      {tab === "metrics" ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-(--text-muted)">
            Reach · Signals · ladder metrics arrive with the Wave-7 reputation enrichment — this tab is reserved, not forgotten.
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
