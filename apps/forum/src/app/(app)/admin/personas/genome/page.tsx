"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */

/**
 * Route: /admin/personas/genome — SLICE-P5-12: the genome config
 * BACK-DOOR (CAP-178/546/547/548). Deliberately NOT in any nav — the
 * narrowest surface (Administrator-only; enforced server-side too).
 * Preview compiles the DRAFT params deterministically before commit;
 * every edit/rollback invalidates the compiled prompt in the same
 * transaction (the silent-stale-prompt hazard can't occur).
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/convex";

const EDITABLE_FIELDS = [
  "analyticalLens", "disagreementStyle", "confidenceCalibration", "register",
  "verbosity", "evidencePosture", "blindSpot", "counterweight", "prohibitedOverreach",
];

export default function AdminGenomePage() {
  const [personaIdInput, setPersonaIdInput] = useState("");
  const [personaId, setPersonaId] = useState<string | null>(null);
  const state = useQuery(
    api.persona.genome.getGenomeState,
    personaId ? ({ personaId: personaId as any } as any) : {},
  );
  const [field, setField] = useState(EDITABLE_FIELDS[0]);
  const [newValue, setNewValue] = useState("");
  const [previewRef, setPreviewRef] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const edit = useMutation(api.persona.genome.edit);
  const rollback = useMutation(api.persona.genome.rollback);

  const runEdit = () => {
    setNote(null);
    edit({ personaId: personaId ? (personaId as any) : undefined, field, newValue, previewFixtureRef: previewRef ?? undefined })
      .then((r: any) => setNote(`Committed v${r.genomeVersion} — ${r.invalidatedPrompts} compiled prompt(s) invalidated (same transaction).`))
      .catch((e) => setNote(e instanceof Error ? e.message : "Edit failed"));
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Genome back-door <Badge tone="warning">Administrator only</Badge></h1>
        <p className="text-sm text-(--text-muted)">
          No nav item by design. Every edit versions forward, is audited, and invalidates the compiled
          prompt in the same transaction — generation can never silently use a stale prompt.
        </p>
      </header>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Target</h2></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={personaIdInput}
              onChange={(e) => setPersonaIdInput(e.target.value)}
              placeholder="persona id (leave empty = tune the TEMPLATE — invalidates every compiled prompt)"
              className="w-96"
            />
            <Button size="sm" onClick={() => setPersonaId(personaIdInput.trim() || null)}>Load</Button>
          </div>
          {state === null ? (
            <p className="text-sm text-(--text-muted)">Administrator access required.</p>
          ) : personaId && state?.persona ? (
            <p className="text-sm text-(--text-secondary)">
              {state.persona.displayName} — genome v{state.genome?.version ?? "?"} · prompt{" "}
              {state.persona.promptCompiled ? "compiled ✓" : "NOT compiled (will recompile at next use)"}
            </p>
          ) : !personaId && state?.templates ? (
            <p className="text-sm text-(--text-secondary)">{state.templates.length} template version(s) found.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Edit (CAP-178) — preview first (CAP-548)</h2></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <select value={field} onChange={(e) => setField(e.target.value)} className="rounded-md border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-sm">
              {EDITABLE_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="new value" className="w-72" />
            <Input value={previewRef ?? ""} onChange={(e) => setPreviewRef(e.target.value || null)} placeholder="preview fixture ref (optional)" className="w-52" />
            <Button size="sm" disabled={!newValue.trim()} onClick={runEdit}>Commit edit</Button>
          </div>
          <p className="text-xs text-(--text-muted)">
            The console previews the compiled prompt from draft params before you commit; the fixture ref rides the audit row.
          </p>
          {note ? <p className="text-xs text-(--feedback-success, #15803d)">{note}</p> : null}
        </CardContent>
      </Card>

      {personaId && state?.history ? (
        <Card>
          <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">History (append-only) + rollback (CAP-546)</h2></CardHeader>
          <CardContent className="space-y-2">
            {state.history.length === 0 ? (
              <p className="text-sm text-(--text-muted)">No edits yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {state.history.map((h: any, i: number) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="text-(--text-secondary)">
                      v{h.genomeVersion} · {h.field} · {h.scope}
                      {h.previewFixtureRef ? " · previewed" : ""}
                    </span>
                    {h.field !== "__rollback__" ? (
                      <Button variant="ghost" size="sm" onClick={() => {
                        setNote(null);
                        rollback({ personaId: personaId as any, toVersion: h.genomeVersion })
                          .then((r: any) => setNote(`Rolled forward to v${r.genomeVersion} (restores v${h.genomeVersion} values) — ${r.invalidatedPrompts} prompt(s) invalidated.`))
                          .catch((e) => setNote(e instanceof Error ? e.message : "Rollback failed"));
                      }}>
                        Roll back to v{h.genomeVersion}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
