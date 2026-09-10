/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * CmpOverlay — SLICE-P7T-13 (CAP-504–506): the CMP slot CAP-025 reserved
 * (order: ErrorBoundary → CMP slot → BetaBanner → children — mounted in
 * the (app) layout; legal routes sit outside). strictly_necessary is
 * always on and non-negotiable (quoted); analytics/PostHog is NOT
 * injected until grant (no PostHog loader exists pre-grant by
 * construction). Withdraw stops future capture; rawEvents continue.
 * Member path only — anonymous grant is fenced on CAP-387 (OQ#2).
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

const OPTIONAL_PURPOSES = [
  { key: "functional", label: "Functional", hint: "Remembers your preferences" },
  { key: "analytics", label: "Analytics", hint: "Helps us understand what works (PostHog, after grant)" },
  { key: "marketing", label: "Marketing", hint: "Occasional product updates" },
] as const;

export function CmpOverlay() {
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const consent = useQuery(api.consent.myConsent, configured && authStatus === "authenticated" ? {} : "skip");
  const record = useMutation(api.consent.record);
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ functional: true, analytics: false, marketing: false });
  const [note, setNote] = useState<string | null>(null);

  // Show the banner once per member session until a choice is recorded
  useEffect(() => {
    if (consent === undefined) return;
    const dismissed = typeof window !== "undefined" && sessionStorage.getItem("cmp.dismissed");
    if (consent === null && !dismissed) setOpen(true);
  }, [consent]);

  if (!configured || authStatus !== "authenticated") return null; // anonymous path fenced (CAP-387)

  const save = (grantedKeys: string[]) => {
    const granted = grantedKeys.filter((k) => k !== "strictly_necessary") as any;
    const denied = OPTIONAL_PURPOSES.map((p) => p.key).filter((k) => !granted.includes(k)) as any;
    void record({ granted, denied, jurisdictionClass: "default", collectionSurface: "web_app" })
      .then(() => {
        setOpen(false);
        sessionStorage.setItem("cmp.dismissed", "1");
        setNote(null);
      })
      .catch((e) => setNote(String(e?.message ?? e)));
  };

  if (!open) {
    return consent === null && note === null ? (
      <button
        type="button"
        className="fixed bottom-20 left-4 z-40 rounded-full border border-(--border-default) bg-(--bg-surface-elevated) px-3 py-1.5 text-xs text-(--text-secondary) shadow-(--shadow-md)"
        onClick={() => setOpen(true)}
      >
        Cookie preferences
      </button>
    ) : null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-(--border-default) bg-(--bg-surface-elevated)/95 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-(--container-reading) space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-(--text-primary)">Your privacy choices</h2>
            <p className="text-xs text-(--text-muted)">
              Strictly necessary cookies are always on (they keep the site working and
              include the server-side event record). Everything else is your call.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {OPTIONAL_PURPOSES.map((p) => (
            <label key={p.key} className="flex items-start gap-2 text-xs text-(--text-secondary)">
              <input
                type="checkbox"
                checked={prefs[p.key]}
                onChange={(e) => setPrefs((prev) => ({ ...prev, [p.key]: e.target.checked }))}
              />
              <span>
                <span className="font-medium">{p.label}</span>
                <span className="block text-(--text-muted)">{p.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
        <div className="flex gap-2">
          <Button size="sm" onClick={() => save(Object.keys(prefs).filter((k) => prefs[k]))}>
            Save choices
          </Button>
          <Button variant="secondary" size="sm" onClick={() => save(["functional"])}>
            Essentials only
          </Button>
        </div>
      </div>
    </div>
  );
}
