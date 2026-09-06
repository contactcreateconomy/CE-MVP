/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * ResourcesPageClient — SLICE-P6-07: the library browse + acquire +
 * download controls. Attribution line renders everywhere (CAP-229);
 * view costs nothing (INV-6); acquire is quota-gated server-side.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

export function ResourcesPageClient() {
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const member = authStatus === "authenticated";
  const library = useQuery(api.resources.listLibrary, configured ? {} : "skip");

  if (!configured) return null;
  if (library === undefined) {
    return <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" /></div>;
  }
  if (!library.enabled) {
    return <Card><CardContent className="py-10 text-center text-sm text-(--text-muted)">The resource library is currently disabled.</CardContent></Card>;
  }

  return (
    <section className="space-y-5" aria-label="Resource library">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Resources</h1>
        <p className="text-sm text-(--text-muted)">
          Free, platform-forged resources. Browsing is free; acquiring a resource adds it to your library (5/day · 20/week).
        </p>
      </header>

      {library.items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-(--text-muted)">No published resources yet — the first in-house batch lands soon.</CardContent></Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {library.items.map((item: any) => (
            <ResourceCard key={item.resourceId} item={item} member={member} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ResourceCard({ item, member }: { item: any; member: boolean }) {
  const state = useQuery(api.resources.getAcquisitionState, { resourceId: item.resourceId });
  const acquire = useMutation(api.resources.acquire);
  const download = useMutation(api.resources.download);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  return (
    <li>
      <Card>
        <CardContent className="space-y-2 py-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-(--text-primary)">{item.title}</h2>
            {item.pageCount ? <Badge tone="neutral">{item.pageCount}p</Badge> : null}
          </div>
          <p className="text-xs text-(--text-muted)">{item.attributionLine}</p>
          {item.forgeDisclosure ? <p className="text-xs text-(--text-muted)">{item.forgeDisclosure}</p> : null}

          {member ? (
            state?.acquired ? (
              <div className="space-y-1">
                <Badge tone="success">In your library</Badge>
                {downloadUrl ? (
                  <a href={downloadUrl} className="block text-sm text-brand-primary underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                    Open your download link
                  </a>
                ) : (
                  <Button variant="secondary" size="sm" disabled={busy}
                    onClick={() => {
                      setBusy(true); setNote(null);
                      download({ resourceId: item.resourceId })
                        .then((r: any) => setDownloadUrl(r.url))
                        .catch((e) => setNote(e instanceof Error ? e.message : "Download failed"))
                        .finally(() => setBusy(false));
                    }}>
                    {busy ? "Preparing…" : "Download"}
                  </Button>
                )}
              </div>
            ) : (
              <Button size="sm" disabled={busy}
                onClick={() => {
                  setBusy(true); setNote(null);
                  acquire({ resourceId: item.resourceId })
                    .then((r: any) => setNote(r?.alreadyAcquired ? "Already in your library." : "Acquired."))
                    .catch((e) => setNote(e instanceof Error ? e.message : "Acquire failed"))
                    .finally(() => setBusy(false));
                }}>
                {busy ? "Acquiring…" : "Acquire"}
              </Button>
            )
          ) : (
            <p className="text-xs text-(--text-muted)"><a href="/signin" className="underline">Sign in</a> to acquire.</p>
          )}
          {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
        </CardContent>
      </Card>
    </li>
  );
}
