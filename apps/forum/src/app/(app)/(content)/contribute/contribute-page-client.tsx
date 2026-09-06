/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * ContributePageClient — SLICE-P6-09 (CAP-202/203): the UGC reference
 * intake. E3: the route MOUNTS with a disabled render while the soft-beta
 * flag is false; mutations server-reject (never a silent 404). The gated
 * flow = contract ack → submit (quarantine, rights basis required).
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

const RIGHTS_BASES = ["own", "authorized", "compatible_licence", "public_domain"] as const;

export function ContributePageClient() {
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const member = authStatus === "authenticated";
  const state = useQuery(api.contribute.getContributeState, configured ? {} : "skip");
  const ack = useMutation(api.contribute.ackContract);
  const submit = useMutation(api.contribute.submitReference);
  const [acked, setAcked] = useState(false);
  const [fileHash, setFileHash] = useState("");
  const [rightsBasis, setRightsBasis] = useState<string>("own");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured || state === undefined) {
    return <div className="flex min-h-[30vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" /></div>;
  }

  // E3: the disabled render — reachable, honest, mutations server-reject
  if (!state.enabled) {
    return (
      <section className="space-y-4" aria-label="Contribute (closed)">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-(--text-primary)">Contribute a reference</h1>
        </header>
        <Card>
          <CardContent className="space-y-2 py-8 text-center">
            <p className="text-sm font-medium text-(--text-primary)">Community reference intake is closed during the soft beta.</p>
            <p className="text-sm text-(--text-muted)">
              We&apos;re currently publishing in-house and operator-curated resources. Community contributions open soon — the platform will announce it.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Contribute">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Contribute a reference</h1>
        <p className="text-sm text-(--text-muted)">
          Your reference goes into quarantine review first — original files are never served publicly; only platform-forged resources ship.
        </p>
      </header>

      {!member ? (
        <Card><CardContent className="py-8 text-center text-sm text-(--text-muted)"><a href="/signin" className="underline">Sign in</a> to contribute.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">1 · Contributor contract</h2></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-(--text-secondary)">
                You attest the references you submit respect the licence terms ({state.contractVersion}).
              </p>
              <Button size="sm" disabled={acked || busy} onClick={() => {
                setBusy(true);
                ack({ contractVersion: state.contractVersion })
                  .then((r: any) => {
                    if (r?.disabled) setNote("Intake is currently disabled server-side.");
                    else setAcked(true);
                  })
                  .catch((e) => setNote(e instanceof Error ? e.message : "Failed"))
                  .finally(() => setBusy(false));
              }}>
                {acked ? "Acknowledged ✓" : "Acknowledge contract"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">2 · Submit reference (quarantine)</h2></CardHeader>
            <CardContent className="space-y-2">
              <Input value={fileHash} onChange={(e) => setFileHash(e.target.value)} placeholder="file hash (SHA-256)" aria-label="File hash" />
              <select value={rightsBasis} onChange={(e) => setRightsBasis(e.target.value)}
                className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) px-2 py-1.5 text-sm" aria-label="Rights basis">
                {RIGHTS_BASES.map((b) => <option key={b} value={b}>{b.replace(/_/g, " ")}</option>)}
              </select>
              <Button size="sm" disabled={!acked || fileHash.trim().length < 8 || busy} onClick={() => {
                setBusy(true); setNote(null);
                submit({ fileHash: fileHash.trim(), sizeBytes: 0, mimeClaimed: "application/pdf", rightsBasis: rightsBasis as any, contractVersion: state.contractVersion })
                  .then(() => { setNote("Submitted to quarantine review."); setFileHash(""); })
                  .catch((e) => setNote(e instanceof Error ? e.message : "Submit failed"))
                  .finally(() => setBusy(false));
              }}>
                Submit for review
              </Button>
              {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
