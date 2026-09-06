/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * GoClient — SLICE-P6-17: the A6 context-aware interstitial. In-app:
 * continue → record + redirect. Off-platform: the SAME interstitial with
 * NO auto-redirect (quoted anti-hijack). Three distinct state renders.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";

export function GoClient({ linkId }: { linkId: string }) {
  const configured = isConvexConfigured();
  // Context: in-app = same-origin navigation (session/Referer heuristic —
  // the BRANCH only; the gate never trusts this flag)
  const [isInApp, setIsInApp] = useState(true);
  const resolution = useQuery(
    api.go.resolveGo,
    configured ? ({ linkId: linkId as any, isInApp } as any) : "skip",
  );
  const recordClick = useMutation(api.go.recordClick);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [released, setReleased] = useState<string | null>(null);

  if (!configured || resolution === undefined) {
    return <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" /></div>;
  }

  // STATE 1 — dead-link (no row at all): a distinct render + cause
  if (resolution.state === "dead_link") {
    return (
      <Card><CardContent className="space-y-2 py-10 text-center">
        <h1 className="text-lg font-semibold text-(--text-primary)">This link doesn&apos;t exist</h1>
        <p className="text-sm text-(--text-muted)">The BUY link is unknown or was removed. If you followed it from a post, let the author know.</p>
      </CardContent></Card>
    );
  }

  // STATE 2 — gate-fail (row exists; not approved_locked): unavailable —
  // never the locked destination, no continue affordance
  if (resolution.state === "gate_fail") {
    return (
      <Card><CardContent className="space-y-2 py-10 text-center">
        <h1 className="text-lg font-semibold text-(--text-primary)">This link isn&apos;t available right now</h1>
        <p className="text-sm text-(--text-muted)">
          The product link is pending review or was pulled. The storefront stays available.
        </p>
        <Badge tone="warning">{resolution.reason ?? resolution.validationState}</Badge>
      </CardContent></Card>
    );
  }

  // STATE 3 — proceed (locked): interstitial; branch decides auto-redirect
  return (
    <Card><CardContent className="space-y-3 py-10 text-center">
      <Badge tone="brand">Sponsored</Badge>
      <h1 className="text-lg font-semibold text-(--text-primary)">You&apos;re leaving Createconomy</h1>
      <p className="text-sm text-(--text-muted)">
        This is an affiliate link{resolution.network ? ` via ${resolution.network}` : ""}. The creator may earn a commission. [Founder copy TBD — go OQ3]
      </p>
      <div className="flex items-center justify-center gap-2">
        <Button disabled={busy} onClick={() => {
          setBusy(true); setNote(null);
          recordClick({
            linkId: linkId as any,
            productId: (window.location.hash || "#").slice(1) as any, // productId rides the hash from the BUY anchor
            promoterUserId: (new URLSearchParams(window.location.search).get("p") || "") as any,
            isInApp,
          })
            .then((r: any) => {
              if (!r.proceed) { setNote(`Blocked: ${r.reason ?? "gate"}`); return; }
              setReleased(resolution.destinationUrl);
              if (isInApp) window.location.href = resolution.destinationUrl; // ONLY the in-app branch auto-redirects
            })
            .catch((e) => setNote(e instanceof Error ? e.message : "Failed"))
            .finally(() => setBusy(false));
        }}>
          {busy ? "Preparing…" : "Continue to merchant"}
        </Button>
        <a href="/feed" className="text-sm text-(--text-muted) underline-offset-2 hover:underline">Stay</a>
      </div>
      {!isInApp ? (
        <p className="text-xs text-(--text-muted)">Opened outside the app — continue is manual by design.</p>
      ) : null}
      {released && !isInApp ? <p className="text-xs text-(--text-muted)">Destination prepared — click Continue.</p> : null}
      {note ? <p className="text-xs text-(--feedback-error, #b91c1c)">{note}</p> : null}
    </CardContent></Card>
  );
}
