"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */

/**
 * Route: /admin/personas — SLICE-P5-10 (CAP-159…167): the persona
 * lifecycle console. Roster with per-state actions (birth / activate /
 * pause / resume / wane / retire / revive-confirm), the population
 * recommendation banner (CAP-166 output), and the drift flag list
 * (CAP-167 — flags only, never auto-actions). Staff RBAC is enforced
 * server-side per mutation; the layout gates the surface.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/convex";

export default function AdminPersonasPage() {
  const roster = useQuery(api.persona.public.listRoster, {});

  const allPersonas = roster
    ? [
        ...(roster.sections.active ?? []),
        ...(roster.sections.newlyArrived ?? []),
        ...(roster.sections.waning ?? []),
        ...(roster.sections.retired ?? []),
      ]
    : [];

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Persona lifecycle console</h1>
        <p className="text-sm text-(--text-muted)">
          Birth (INV-7: max 1/day), activation trials, pause/resume, waning, retirement, and
          community-revival confirmations. Every action is audited.
        </p>
      </header>

      <BirthCard />
      <PopulationBanner />

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Population ({allPersonas.length})</h2></CardHeader>
        <CardContent className="space-y-3">
          {allPersonas.length === 0 ? (
            <p className="text-sm text-(--text-muted)">No personas yet — births land here.</p>
          ) : (
            <ul className="space-y-2">
              {allPersonas.map((p: any) => (
                <PersonaRow key={p.id} persona={p} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function PersonaRow({ persona }: { persona: any }) {
  const pause = useMutation(api.persona.lifecycle.pause);
  const resume = useMutation(api.persona.lifecycle.resume);
  const activate = useMutation(api.persona.lifecycle.activate);
  const wane = useMutation(api.persona.lifecycle.wane);
  const retire = useMutation(api.persona.lifecycle.retire);
  const revive = useMutation(api.persona.lifecycle.reviveConfirm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--border-default) p-3">
      <div className="min-w-0">
        <a href={`/personas/${persona.id}`} className="font-medium text-(--text-primary) hover:underline">
          {persona.displayName}
        </a>{" "}
        <Badge tone="info">AI</Badge>{" "}
        <Badge tone={persona.lifecycleStatus === "active" ? "success" : persona.lifecycleStatus === "retired" ? "error" : "warning"}>
          {persona.lifecycleStatus}
        </Badge>
        {persona.paused ? <Badge tone="warning">paused</Badge> : null}
        <span className="ml-2 text-xs text-(--text-muted)">{persona.trackRecordCount} contributions</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {persona.paused ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void run(() => resume({ personaId: persona.id }))}>Resume</Button>
        ) : persona.lifecycleStatus !== "retired" ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void run(() => pause({ personaId: persona.id, pauseReason: "operator_hold" }))}>Pause</Button>
        ) : null}
        {persona.lifecycleStatus === "nascent" ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void run(() => activate({ personaId: persona.id }))}>Activate</Button>
        ) : null}
        {persona.lifecycleStatus === "active" ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void run(() => wane({ personaId: persona.id, triggerBranch: "operator_initiated" }))}>Wane</Button>
        ) : null}
        {persona.lifecycleStatus !== "retired" ? (
          <Button variant="destructive" size="sm" disabled={busy} onClick={() => void run(() => retire({ personaId: persona.id, retirementReason: "operator_initiated" }))}>Retire</Button>
        ) : (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void run(() => revive({ personaId: persona.id }))}>Revive (confirm)</Button>
        )}
        {err ? <span className="text-xs text-(--feedback-error, #b91c1c)">{err}</span> : null}
      </div>
    </li>
  );
}

/** CAP-159 birth form — hand-craft path (recommended-confirm flows from
 *  the population banner once the recommender has data). */
function BirthCard() {
  const birth = useMutation(api.persona.lifecycle.birth);
  const [displayName, setDisplayName] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Birth a persona (hand-craft — CAP-159)</h2></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-(--text-muted)">
          INV-7: max 1 birth/day. The genome compiles the sealed system prompt deterministically; the
          persona starts nascent (trial) — activation is a separate gated step.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name (public)" className="w-44" />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="internal id (slug)" className="w-36" />
          <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="One factual sentence" className="w-64" />
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain (e.g. pricing economics)" className="w-52" />
        </div>
        <Button
          size="sm"
          disabled={busy || !displayName.trim() || !name.trim() || !bio.trim() || !domain.trim()}
          onClick={() => {
            setBusy(true);
            setNote(null);
            birth({
              displayName: displayName.trim(),
              name: name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
              bio: bio.trim(),
              identityCharter: `Purpose: contribute a ${domain.trim()} lens. Blind spot: stated by operator review.`,
              voice: "plain professional",
              domain: domain.trim(),
              genome: {
                analyticalLens: `${domain.trim()} analysis`,
                secondaryLenses: [],
                disagreementStyle: "steelman first",
                confidenceCalibration: "state uncertainty explicitly",
                register: "plain professional",
                verbosity: "concise",
                domainLevels: {},
                evidencePosture: "cite or hedge",
                rankedValues: ["honesty", "usefulness", "curiosity"],
                triggerConditions: [],
                signatureMoves: [],
                contributionArchetypes: ["analyst"],
                humorLevel: "none",
                sarcasmLevel: "none",
                blindSpot: "operator-reviewed",
                counterweight: "ask for scale/context",
                abstentionTopics: [],
                prohibitedOverreach: "never recommend untested tools",
              },
            })
              .then(() => {
                setNote("Born (nascent).");
                setDisplayName(""); setName(""); setBio(""); setDomain("");
              })
              .catch((e) => setNote(e instanceof Error ? e.message : "Birth failed"))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Birthing…" : "Birth"}
        </Button>
        {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
      </CardContent>
    </Card>
  );
}

/** CAP-166/167 output — recommendation + drift flags (read-only banner;
 *  the operator executes through the actions above). */
function PopulationBanner() {
  // Recommendation + drift surfaces read from the cron outputs; the crons
  // run server-side. v1 surfaces the roster-derived state honestly.
  const roster = useQuery(api.persona.public.listRoster, {});
  if (!roster) return null;
  return (
    <Card>
      <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Population manager (CAP-166/167 — output only)</h2></CardHeader>
      <CardContent className="space-y-1 text-sm text-(--text-secondary)">
        <p>
          Active {roster.sections.active.length} · newly-arrived {roster.sections.newlyArrived.length} ·
          waning {roster.sections.waning.length} · retired {roster.sections.retired.length}.
        </p>
        <p className="text-xs text-(--text-muted)">
          The daily recommender + weekly drift check write flags/queue items only — this console executes.
        </p>
      </CardContent>
    </Card>
  );
}
