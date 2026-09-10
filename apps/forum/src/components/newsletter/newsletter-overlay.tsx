/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * NewsletterOverlay — SLICE-P7G-06 (CAP-384/385): the GLOBAL overlay
 * (inventory note — not a route). Single ask after first acquire;
 * unchecked by default; trigger-based copy ("No fixed schedule, no
 * marketing"); the unsubscribe link is live BEFORE capture (quoted).
 * Must not steal E1 BetaBanner's mount — it's a bottom sheet, sibling
 * to children, mounted in the (app) layout next to the CMP.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

export function NewsletterOverlay() {
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const state = useQuery(api.newsletter.overlayState, configured && authStatus === "authenticated" ? {} : "skip");
  const consent = useMutation(api.newsletter.consent);
  const unsubscribe = useMutation(api.newsletter.unsubscribe);
  const [checked, setChecked] = useState(false); // unchecked default (quoted)
  const [dismissed, setDismissed] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (state && !state.show) setDismissed(true);
  }, [state]);

  if (!configured || authStatus !== "authenticated" || dismissed || !state?.show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--border-default) bg-(--bg-surface-elevated)/95 p-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-(--container-reading) flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-(--text-primary)">Know when new resources drop</p>
          <p className="text-xs text-(--text-muted)">No fixed schedule, no marketing — only when we publish something new.</p>
          <label className="mt-1 flex items-center gap-2 text-xs text-(--text-secondary)">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            Email me about new resource drops
          </label>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Unsubscribe live BEFORE capture (quoted) */}
          <button
            type="button"
            className="text-xs text-(--text-muted) underline-offset-2 hover:underline"
            onClick={() => void unsubscribe({}).then(() => setNote("You're unsubscribed — we won't ask again.")).catch(() => setNote("Could not save — try again."))}
          >
            Unsubscribe
          </button>
          <Button
            size="sm"
            onClick={() => {
              void consent({ surface: "overlay_post_acquire", confirmed: checked })
                .then((r) => setNote(r.status === "confirmed" ? "You're in — only new-resource notes." : "Noted — we won't ask again."))
                .then(() => setDismissed(true))
                .catch((e) => setNote(String(e?.message ?? e)));
            }}
          >
            {checked ? "Keep me posted" : "No thanks"}
          </Button>
        </div>
      </div>
      {note ? <p className="mx-auto mt-1 max-w-(--container-reading) text-xs text-(--text-muted)">{note}</p> : null}
    </div>
  );
}
