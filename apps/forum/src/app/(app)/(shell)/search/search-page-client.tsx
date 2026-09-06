/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * SearchPageClient — SLICE-P6-05 (CAP-529): keyword search across posts,
 * tools, and people (username/displayName). Identical results for
 * anonymous and member; no personalization; never privateUserData.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";

export function SearchPageClient({ initialQuery }: { initialQuery?: string }) {
  const configured = isConvexConfigured();
  const [q, setQ] = useState(initialQuery ?? "");
  const [submitted, setSubmitted] = useState<string | null>(initialQuery ?? null);
  const log = useMutation(api.search.searchLog);
  const results = useQuery(
    api.search.searchQuery,
    configured && submitted ? { q: submitted } : "skip",
  );

  const submit = () => {
    const term = q.trim();
    if (term.length < 2) return;
    setSubmitted(term);
    void log({ q: term }).catch(() => {}); // telemetry never blocks results
  };

  if (!configured) return null;

  return (
    <section className="space-y-5" aria-label="Search">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Search</h1>
        <p className="text-sm text-(--text-muted)">Keyword match across posts, tools, and members — no personalization, same results for everyone.</p>
      </header>

      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Search posts, tools, members…"
          aria-label="Search query"
        />
        <Button onClick={submit} disabled={q.trim().length < 2}>Search</Button>
      </div>

      {submitted && results === undefined ? (
        <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" /></div>
      ) : null}

      {results ? (
        <div className="space-y-4">
          <ResultGroup title="Posts" empty="No matching posts." items={results.posts.map((p: any) => (
            <a key={p.postId} href={`/discussions/${p.postId}`} className="flex items-center gap-2 text-sm text-(--text-secondary) underline-offset-2 hover:underline">
              <Badge tone="neutral">{p.type}</Badge> {p.title}
            </a>
          ))} />
          <ResultGroup title="Tools" empty="No matching tools." items={results.tools.map((t: any) => (
            <a key={t.toolId} href={`/tools/${t.slug}`} className="text-sm text-(--text-secondary) underline-offset-2 hover:underline">{t.name}</a>
          ))} />
          <ResultGroup title="Members" empty="No matching members." items={results.people.map((u: any, i: number) => (
            <a key={i} href={`/users/${u.username ?? ""}`} className="text-sm text-(--text-secondary) underline-offset-2 hover:underline">
              {u.displayName}{u.username ? ` (@${u.username})` : ""}
            </a>
          ))} />
        </div>
      ) : null}
    </section>
  );
}

function ResultGroup({ title, empty, items }: { title: string; empty: string; items: any[] }) {
  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">{title} ({items.length})</h2>
        {items.length === 0 ? <p className="text-sm text-(--text-muted)">{empty}</p> : <ul className="space-y-1.5">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>}
      </CardContent>
    </Card>
  );
}
