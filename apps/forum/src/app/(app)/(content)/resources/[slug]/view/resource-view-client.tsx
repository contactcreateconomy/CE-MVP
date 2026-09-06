/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * ResourceViewClient — SLICE-P6-08 (CAP-211): the sandboxed viewer shell.
 * The PDF renders in a sandboxed iframe (no allow-scripts, no same-origin)
 * framed around the clean-bucket signed URL. Anonymous = fenced teaser
 * branch (sign-in prompt — DEC-M10-VIEW-AUTH content is not invented).
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";

export function ResourceViewClient({ slug }: { slug: string }) {
  const configured = isConvexConfigured();
  const state: any = useQuery(api.resources.view.getViewerState, configured ? { slug } : "skip");
  const getUrl = useMutation(api.resources.view.getViewUrl);
  const [url, setUrl] = useState<string | null>(null);

  const ready = state && !state.teaser && !state.requiresAcquisition && !state.notFound && state.enabled !== false;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getUrl({ slug }).then((r: any) => {
      if (!cancelled && r?.url) setUrl(r.url);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!configured || state === undefined) {
    return <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" /></div>;
  }

  if (state.enabled === false) {
    return <Card><CardContent className="py-10 text-center text-sm text-(--text-muted)">The viewer is currently disabled.</CardContent></Card>; // fail-closed (OQ5)
  }
  if (state.notFound) {
    return <Card><CardContent className="py-10 text-center text-sm text-(--text-muted)">Resource not found.</CardContent></Card>;
  }

  return (
    <section className="space-y-3" aria-label="Resource viewer">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">{state.title}</h1>
        <p className="text-xs text-(--text-muted)">{state.attributionLine}</p>
        {state.forgeDisclosure ? <p className="text-xs text-(--text-muted)">{state.forgeDisclosure}</p> : null}
      </header>

      {state.teaser ? (
        <Card>
          <CardContent className="space-y-2 py-10 text-center">
            <p className="text-sm text-(--text-secondary)">Sign in to read this resource in the secure viewer.</p>
            <a href="/signin" className="text-sm text-brand-primary underline-offset-2 hover:underline">Sign in</a>
          </CardContent>
        </Card>
      ) : state.requiresAcquisition ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-(--text-muted)">
            Acquire this resource from the <a href="/resources" className="underline">library</a> first.
          </CardContent>
        </Card>
      ) : url ? (
        <div className="overflow-hidden rounded-xl border border-(--border-default)">
          {/* Sandbox: no scripts, no same-origin, no popups — the delivery
              origin carries no app cookies (clean bucket). */}
          <iframe
            src={url}
            title={state.title}
            sandbox=""
            className="h-[75vh] w-full bg-(--bg-surface)"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" /></div>
      )}
    </section>
  );
}
