/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * SellApplyClient — SLICE-P6-13: the tap-first store application. The
 * server evaluates the quoted eligibility formula; the four attestations
 * and data-honesty acceptance are explicit required taps.
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

const ATTESTATION_COPY: [keyof Att, string][] = [
  ["owns", "I own the content/products I plan to promote"],
  ["programPermits", "The affiliate programs I join permit this promotion style"],
  ["regionEligible", "I am eligible to participate in my region"],
  ["willDisclose", "I will disclose affiliate relationships clearly"],
];
type Att = { owns: boolean; programPermits: boolean; regionEligible: boolean; willDisclose: boolean };

export function SellApplyClient() {
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const state = useQuery(api.store.apply.getApplyState, configured && authStatus === "authenticated" ? {} : "skip");
  const submit = useMutation(api.store.apply.submit);

  const [networks, setNetworks] = useState("");
  const [experience, setExperience] = useState("");
  const [att, setAtt] = useState<Att>({ owns: false, programPermits: false, regionEligible: false, willDisclose: false });
  const [dataHonesty, setDataHonesty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (!configured) return null;
  if (authStatus !== "authenticated") {
    return <Card><CardContent className="py-8 text-center text-sm text-(--text-muted)"><a href="/signin" className="underline">Sign in</a> to apply.</CardContent></Card>;
  }
  if (state === undefined || state === null) {
    return <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" /></div>;
  }

  const allTapped = ATTESTATION_COPY.every(([k]) => att[k]);
  const canSubmit = state.eligibility.eligible && allTapped && dataHonesty && networks.trim().length > 0 && !busy;

  return (
    <section className="space-y-5" aria-label="Store application">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Apply for your storefront</h1>
        <p className="text-sm text-(--text-muted)">
          Promote your own affiliate links through a validated storefront on your Distribution. You keep 100% of commissions.
        </p>
      </header>

      {state.existingRequest ? (
        <Card>
          <CardContent className="space-y-1 py-6 text-center">
            <Badge tone={state.existingRequest.status === "approved" ? "success" : "info"}>
              {state.existingRequest.status}
            </Badge>
            <p className="text-sm text-(--text-muted)">
              Your application is {state.existingRequest.status}. {state.existingRequest.reasonCode ? `Reason: ${state.existingRequest.reasonCode}.` : ""}
            </p>
          </CardContent>
        </Card>
      ) : !state.eligibility.eligible ? (
        <Card>
          <CardContent className="space-y-2 py-6">
            <p className="text-sm font-medium text-(--text-primary)">Not eligible yet:</p>
            <ul className="list-inside list-disc text-sm text-(--text-muted)">
              {state.eligibility.reasons.map((r: string) => <li key={r}>{r.replace(/_/g, " ")}</li>)}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Your application</h2></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="networks" className="text-sm font-medium text-(--text-primary)">Affiliate networks (comma-separated)</label>
                <Input id="networks" value={networks} onChange={(e) => setNetworks(e.target.value)} placeholder="impact, shareasale" />
              </div>
              <div className="space-y-1">
                <label htmlFor="experience" className="text-sm font-medium text-(--text-primary)">Experience note</label>
                <textarea id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} rows={3}
                  className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) p-2 text-sm" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Attestations (all four required)</h2></CardHeader>
            <CardContent className="space-y-3">
              {ATTESTATION_COPY.map(([key, copy]) => (
                <label key={key} className="flex items-start gap-3 text-sm text-(--text-secondary)">
                  <Checkbox aria-label={copy} checked={att[key]} onCheckedChange={(v: boolean) => setAtt({ ...att, [key]: v })} />
                  <span>{copy}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Data honesty (CAP-262)</h2></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-(--text-secondary)">
                Store analytics are aggregate-only: Traffic / Intent / Confirmed — never buyer identities. Version {state.dataUseVersion}.
              </p>
              <label className="flex items-start gap-3 text-sm text-(--text-secondary)">
                <Checkbox aria-label="Accept data-honesty terms" checked={dataHonesty} onCheckedChange={(v: boolean) => setDataHonesty(v)} />
                <span>I understand and accept how store data is used and displayed.</span>
              </label>
            </CardContent>
          </Card>

          <Button disabled={!canSubmit} onClick={() => {
            setBusy(true); setNote(null);
            submit({
              categories: [], networks: networks.split(",").map((n) => n.trim()).filter(Boolean),
              expectedProductCount: 1, experienceNote: experience.trim(),
              attestations: att, termsVersion: "store-terms.v1", acceptDataHonesty: true,
            })
              .then(() => setNote("Application submitted — the review team will respond."))
              .catch((e) => setNote(e instanceof Error ? e.message : "Submit failed"))
              .finally(() => setBusy(false));
          }}>
            {busy ? "Submitting…" : "Submit application"}
          </Button>
          {note ? <p className="text-sm text-(--text-muted)">{note}</p> : null}
        </>
      )}
    </section>
  );
}
