/* eslint-disable @typescript-eslint/no-explicit-any -- Convex api Id boundary casts */
"use client";

/**
 * SettingsProfileClient — SLICE-P5-06: CAP-143/146/549/149/151/157/552
 * write surface. Tap-only progressive attributes (consent-gated), socials
 * (stored handle only), consent withdrawal (with the erasure cascade),
 * destructive erase behind a confirm (§11.7 analog), privacy toggles,
 * and the CAP-157 re-acceptance overlay when a version bump is detected.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

const ROLE_ARCHETYPES = ["solo_creator", "small_team", "agency", "exploring", "prefer_not_to_say"];
const AGE_BANDS = ["under_18", "18_24", "25_34", "35_44", "45_54", "55_plus", "prefer_not_to_say"];
const SOCIAL_PLATFORMS = ["x", "linkedin", "youtube", "instagram", "github", "website"];

const PURPOSE_LABELS: Record<string, string> = {
  interestsPersonalization: "Interests personalization",
  demographicsPersonalization: "Demographics personalization",
  behavioralInference: "Behavioral inference",
  publicProfileVisibility: "Public profile visibility",
};

export function SettingsProfileClient() {
  const { authStatus } = useAuth();
  const configured = isConvexConfigured();
  const state = useQuery(
    api.profile.settings.getSettingsState,
    configured && authStatus === "authenticated" ? {} : "skip",
  );

  if (!configured) return null;
  if (authStatus !== "authenticated") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-(--text-muted)">
          Sign in to manage your profile settings.
        </CardContent>
      </Card>
    );
  }
  if (state === undefined || state === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {state.reacceptanceDue ? <ReacceptanceOverlay currentVersion={state.currentRulesVersion} /> : null}

      <AttributesCard state={state} />
      <SocialsCard socials={state.socials} />
      <ConsentCard flags={state.consentFlags} />
      <PrivacyCard profileVisibility={state.profileVisibility} leaderboardOptOut={state.leaderboardOptOut} />
      <ErasureCard badges={state.completionBadges} />
    </div>
  );
}

/** CAP-157 — global overlay analog: prompt, no write until the member acts. */
function ReacceptanceOverlay({ currentVersion }: { currentVersion: string }) {
  const reaccept = useMutation(api.profile.settings.consentReaccept);
  const [busy, setBusy] = useState(false);
  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <p className="text-sm font-medium text-(--text-primary)">
          Rules updated (version {currentVersion})
        </p>
        <p className="text-sm text-(--text-muted)">
          Our community rules have changed since you last accepted. Review the{" "}
          <a href="/terms" target="_blank" rel="noreferrer" className="underline">current rules</a> and
          re-accept to keep your settings current.
        </p>
        <Button size="sm" disabled={busy} onClick={() => { setBusy(true); void reaccept({ policyVersion: currentVersion }).finally(() => setBusy(false)); }}>
          {busy ? "Saving…" : `Re-accept (${currentVersion})`}
        </Button>
      </CardContent>
    </Card>
  );
}

/** CAP-143 — tap-only progressive attributes, consent-gated per field. */
function AttributesCard({ state }: { state: any }) {
  const setAttribute = useMutation(api.profile.settings.setAttribute);
  const [role, setRole] = useState<string>(state.roleArchetype ?? "");
  const [ageBand, setAgeBand] = useState<string>(state.ageBand ?? "");
  const [bio, setBio] = useState<string>(state.bio ?? "");
  const [note, setNote] = useState<string | null>(null);

  const save = async (field: string, value: unknown) => {
    setNote(null);
    const result: any = await setAttribute({ field, value } as any);
    if (result?.consentRequired) {
      setNote(`Grant "${PURPOSE_LABELS[result.consentRequired] ?? result.consentRequired}" consent below first, then retry.`);
    }
  };

  return (
    <Card>
      <CardHeader><h2 className="text-lg font-semibold text-(--text-primary)">Optional profile fields</h2></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="role" className="text-sm font-medium text-(--text-primary)">Role archetype</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-sm">
            <option value="">Not set</option>
            {ROLE_ARCHETYPES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
          </select>
          <Button variant="secondary" size="sm" className="mt-1" onClick={() => void save("roleArchetype", role || undefined)}>Save role</Button>
        </div>
        <div className="space-y-1">
          <label htmlFor="age" className="text-sm font-medium text-(--text-primary)">Age band (banded, optional)</label>
          <select id="age" value={ageBand} onChange={(e) => setAgeBand(e.target.value)} className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-sm">
            <option value="">Not set</option>
            {AGE_BANDS.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
          </select>
          <Button variant="secondary" size="sm" className="mt-1" onClick={() => void save("ageBand", ageBand || undefined)}>Save age band</Button>
        </div>
        <div className="space-y-1">
          <label htmlFor="bio" className="text-sm font-medium text-(--text-primary)">Bio (≤500 chars)</label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500}
            className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) p-2 text-sm" />
          <Button variant="secondary" size="sm" className="mt-1" onClick={() => void save("bio", bio)}>Save bio</Button>
        </div>
        {note ? <p className="text-xs text-(--feedback-warning, #b45309)">{note}</p> : null}
        <p className="text-xs text-(--text-muted)">&quot;Prefer not to say&quot; counts as a completed decision, equal credit.</p>
      </CardContent>
    </Card>
  );
}

/** CAP-146/147/549 — socials: stored handle only, verify is a Phase-3 stub. */
function SocialsCard({ socials }: { socials: any[] }) {
  const add = useMutation(api.profile.settings.socialAdd);
  const revoke = useMutation(api.profile.settings.socialRevoke);
  const [platform, setPlatform] = useState(SOCIAL_PLATFORMS[0]);
  const [handle, setHandle] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader><h2 className="text-lg font-semibold text-(--text-primary)">Social handles</h2></CardHeader>
      <CardContent className="space-y-3">
        {socials.length === 0 ? (
          <p className="text-sm text-(--text-muted)">No linked handles.</p>
        ) : (
          <ul className="space-y-2">
            {socials.map((s: any) => (
              <li key={s._id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  <Badge tone="neutral">{s.platform}</Badge>{" "}
                  <span className="text-(--text-secondary)">{s.handle}</span>{" "}
                  <span className="text-xs text-(--text-muted)">{s.visibility} · unverified (verification is a Phase-3 feature)</span>
                </span>
                <Button variant="destructive" size="sm" onClick={() => void revoke({ socialAccountId: s._id })}>Revoke</Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-md border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-sm">
            {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" className="w-44" />
          <Button size="sm" disabled={handle.trim().length === 0} onClick={() => {
            setErr(null);
            void add({ platform, handle: handle.trim(), visibility: "public" }).then(() => setHandle("")).catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
          }}>Add</Button>
        </div>
        <p className="text-xs text-(--text-muted)">We store the handle only — no OAuth or profile fetch in v1.</p>
        {err ? <p className="text-xs text-(--feedback-error, #b91c1c)">{err}</p> : null}
      </CardContent>
    </Card>
  );
}

/** CAP-148/149 — withdrawal triggers the CAP-151 cascade (stated on-screen). */
function ConsentCard({ flags }: { flags: Record<string, boolean> | null }) {
  const withdraw = useMutation(api.profile.settings.consentWithdraw);
  return (
    <Card>
      <CardHeader><h2 className="text-lg font-semibold text-(--text-primary)">Consent</h2></CardHeader>
      <CardContent className="space-y-2">
        {flags === null ? (
          <p className="text-sm text-(--text-muted)">Complete /setup to record consent preferences.</p>
        ) : (
          Object.entries(PURPOSE_LABELS).map(([purpose, label]) => (
            <div key={purpose} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-(--text-secondary)">{label}</span>
              {flags[purpose] ? (
                <Button variant="ghost" size="sm" onClick={() => void withdraw({ purpose: purpose as any })}>Withdraw</Button>
              ) : (
                <Badge tone="neutral">withdrawn</Badge>
              )}
            </div>
          ))
        )}
        <p className="text-xs text-(--text-muted)">
          Withdrawing personalization consent erases the dependent inferred interests and banded attributes (derivation-trail invalidation).
        </p>
      </CardContent>
    </Card>
  );
}

/** CAP-552 — simple toggles on users (not consent records). */
function PrivacyCard({ profileVisibility, leaderboardOptOut }: { profileVisibility: string; leaderboardOptOut: boolean }) {
  const toggle = useMutation(api.profile.settings.togglePrivacy);
  return (
    <Card>
      <CardHeader><h2 className="text-lg font-semibold text-(--text-primary)">Privacy</h2></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-(--text-secondary)">Profile visibility</span>
          <Button variant="secondary" size="sm" onClick={() => void toggle({ profileVisibility: profileVisibility === "public" ? "private" : "public" })}>
            {profileVisibility === "public" ? "Public — make private" : "Private — make public"}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-(--text-secondary)">Leaderboard opt-out</span>
          <Checkbox
            aria-label="Leaderboard opt-out"
            checked={leaderboardOptOut}
            onCheckedChange={(v: boolean) => void toggle({ leaderboardOptOut: v })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/** CAP-151 — destructive erase behind an explicit confirm. */
function ErasureCard({ badges }: { badges: string[] }) {
  const detach = useMutation(api.profile.settings.detachAttribute);
  const [confirmField, setConfirmField] = useState<string | null>(null);
  const erasable = ["roleArchetype", "ageBand", "toolsUsed", "bio"];
  return (
    <Card>
      <CardHeader><h2 className="text-lg font-semibold text-(--text-primary)">Erase data (destructive)</h2></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-(--text-muted)">
          Erasing a field invalidates its dependent inferences and detaches the declaration. Your recognition history
          survives as &quot;completed&quot; without the answers.
        </p>
        {erasable.map((field) => (
          <div key={field} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-(--text-secondary)">{field.replace(/_/g, " ")}{badges.includes(field) ? " ✓" : ""}</span>
            {confirmField === field ? (
              <span className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={() => { void detach({ attributeType: field }); setConfirmField(null); }}>Confirm erase</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmField(null)}>Cancel</Button>
              </span>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setConfirmField(field)}>Erase</Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
