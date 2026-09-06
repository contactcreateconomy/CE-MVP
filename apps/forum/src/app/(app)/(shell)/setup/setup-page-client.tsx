/* eslint-disable @typescript-eslint/no-explicit-any -- one Convex api Id boundary cast */
"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

/**
 * CAP-142 six-item required set: verified member (precondition — enforced
 * server-side) · display name (auto-filled from the member record, editable;
 * auto-fill source is contract OQ1, best-effort) · avatar (default provided —
 * display only, no upload step) · ≥1 interest tap · accept rules · age/COPPA.
 * Consent defaults CAP-148: interests ON · demographics OFF · behavioral ON ·
 * public ON.
 *
 * Rules/age version literals: the versioned rules copy surface is
 * register-silent (contract OQ3) — pinned here as constants, flagged.
 */
const RULES_VERSION = "rules.v1";
const LEGAL_AGE_VERSION = "coppa.v1";

const CONSENT_LABELS: Record<string, string> = {
  interestsPersonalization: "Personalize from my interests",
  demographicsPersonalization: "Demographics personalization",
  behavioralInference: "Behavioral inference",
  publicProfileVisibility: "Public profile visibility",
};

export function SetupPageClient() {
  const { authStatus } = useAuth();
  const configured = isConvexConfigured();

  const state = useQuery(
    api.setup.getSetupState,
    configured && authStatus === "authenticated" ? {} : "skip",
  );
  const tiles = useQuery(api.setup.listInterestTiles, configured ? {} : "skip");
  const upsertBasic = useMutation(api.setup.upsertBasic);

  const [displayName, setDisplayName] = useState<string | null>(null); // null = untouched (auto-filled)
  const [selected, setSelected] = useState<Set<string> | null>(null); // null = untouched (prefill)
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [consent, setConsent] = useState<Record<string, boolean> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const name = displayName ?? state?.displayName ?? "";
  const picked = useMemo(() => {
    if (selected) return selected;
    return new Set<string>(state?.selectedInterestTagIds ?? []);
  }, [selected, state]);
  const flags = consent ?? {
    interestsPersonalization: true,
    demographicsPersonalization: false,
    behavioralInference: true,
    publicProfileVisibility: true,
    ...(state?.consentFlags ?? {}),
  };

  if (!configured) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-(--text-muted)">
          Backend not configured.
        </CardContent>
      </Card>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-(--text-muted)">
          Sign in to set up your profile.
        </CardContent>
      </Card>
    );
  }

  if (state === undefined || tiles === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
      </div>
    );
  }

  if (state === null) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-(--text-muted)">
          Member record not found — try refreshing.
        </CardContent>
      </Card>
    );
  }

  if (done || (state.basicProfileComplete && !submitting && displayName === null && selected === null)) {
    return (
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold text-(--text-primary)">Profile complete</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-(--text-muted)">
            Your basic profile is complete and posting is unlocked. You can keep adjusting interests
            and consent any time in Settings.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => (window.location.href = "/feed")}>
              Go to feed
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canSubmit =
    name.trim().length > 0 && picked.size >= 1 && rulesAccepted && ageConfirmed && !submitting;

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await upsertBasic({
        displayName: name.trim(),
        interestTagIds: [...picked] as any,
        rulesVersion: RULES_VERSION,
        legalAgeVersion: LEGAL_AGE_VERSION,
        consentFlags: {
          interestsPersonalization: flags.interestsPersonalization,
          demographicsPersonalization: flags.demographicsPersonalization,
          behavioralInference: flags.behavioralInference,
          publicProfileVisibility: flags.publicProfileVisibility,
        },
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTile = (tagId: string) => {
    const next = new Set(picked);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    setSelected(next);
  };

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-semibold text-(--text-primary)">Set up your profile</h1>
        <p className="text-sm text-(--text-muted)">
          Completing this unlocks posting. It takes under a minute.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="display-name" className="text-sm font-medium text-(--text-primary)">
            Display name
          </label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            maxLength={80}
          />
          <p className="text-xs text-(--text-muted)">Pre-filled for you — edit if you like.</p>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-(--text-primary)">
            Interests <span className="text-(--text-muted)">(tap at least one)</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {tiles.length === 0 ? (
              <p className="text-sm text-(--text-muted)">No interest tiles available yet.</p>
            ) : (
              tiles.map((tile: { tagId: string; label: string; category: string }) => (
                <button key={tile.tagId} type="button" onClick={() => toggleTile(tile.tagId)} className="cursor-pointer">
                  <Badge tone={picked.has(tile.tagId) ? "brand" : "neutral"}>{tile.label}</Badge>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-sm font-medium text-(--text-primary)">Consent preferences</span>
          <div className="space-y-3 rounded-lg border border-(--border-default) p-4">
            {Object.keys(CONSENT_LABELS).map((purpose) => (
              <div key={purpose} className="flex items-center justify-between gap-4">
                <span className="text-sm text-(--text-secondary)">{CONSENT_LABELS[purpose]}</span>
                <Checkbox
                  aria-label={CONSENT_LABELS[purpose]}
                  checked={Boolean(flags[purpose as keyof typeof flags])}
                  onCheckedChange={(v: boolean) => setConsent({ ...flags, [purpose]: v })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm text-(--text-secondary)">
            <Checkbox
              aria-label="Accept community rules"
              checked={rulesAccepted}
              onCheckedChange={(v) => setRulesAccepted(v === true)}
            />
            <span>
              I accept the{" "}
              <a href="/terms" className="underline" target="_blank" rel="noreferrer">
                community rules
              </a>{" "}
              (version {RULES_VERSION}).
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-(--text-secondary)">
            <Checkbox
              aria-label="Confirm legal age (COPPA)"
              checked={ageConfirmed}
              onCheckedChange={(v) => setAgeConfirmed(v === true)}
            />
            <span>I confirm I am of legal age to use this service (age/COPPA confirmation).</span>
          </label>
        </div>

        {error ? <p className="text-sm text-(--status-danger, #b91c1c)">{error}</p> : null}

        <Button disabled={!canSubmit} onClick={() => void onSubmit()}>
          {submitting ? "Saving…" : "Complete setup"}
        </Button>
      </CardContent>
    </Card>
  );
}
