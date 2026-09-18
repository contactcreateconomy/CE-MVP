/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /legal/intake — SLICE-P7T-05/06/07: the legal form-set shell
 * (legal-layout family: 720px reading column). DMCA anonymous branch
 * (CAP-217 statutory minimum) + authenticated branches (counter-notice,
 * grievance India, right of erasure, source takedown). India/DMCA clocks
 * DISPLAY the stored ackDueAt/actionDueAt instants (F-33: no invented
 * holiday countdown). Deliberately OUTSIDE the event stream (contract §5).
 */

import { useState } from "react";
import { useMutation } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { useAuth } from "@cemvp/auth-ui";

type Branch = "dmca" | "counter" | "grievance" | "erasure";

// CONTRACT-7-legal-intake §1/§4 (verbatim, addendum §5): only the DMCA
// notice branch is the CAP-217 anonymous statutory minimum — counter-
// notice, grievance, and erasure all call authenticated mutations
// (`requireUser` in convex/legal/intake.ts). Screen audit 2026-09-18: the
// UI previously rendered all four tabs' full forms with no sign-in gate,
// so an anonymous visitor could fill the form and only discover the
// auth requirement after submit failed.
const AUTH_REQUIRED_BRANCHES: ReadonlySet<Branch> = new Set(["counter", "grievance", "erasure"]);

export default function LegalIntakePage() {
  const { authStatus } = useAuth();
  const [branch, setBranch] = useState<Branch>("dmca");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // form state (shared fields by branch)
  const [targetId, setTargetId] = useState("");
  const [legalName, setLegalName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [attested, setAttested] = useState(false);
  const [statement, setStatement] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const dmca = useMutation(api.legal.intake.dmcaIntake);
  const counter = useMutation(api.legal.intake.counterNotice);
  const authenticated = useMutation(api.legal.intake.legalIntakeAuthenticated);
  const erasure = useMutation(api.legal.intake.erasureSubmit);

  const needsSignIn = AUTH_REQUIRED_BRANCHES.has(branch) && authStatus !== "authenticated";

  const run = (fn: Promise<any>, ok: (r: any) => string) => {
    setBusy(true);
    fn.then((r) => setNote(ok(r))).catch((e) => setNote(String(e?.message ?? e))).finally(() => setBusy(false));
  };

  return (
    <section className="mx-auto w-full max-w-(--container-reading) space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-(--text-primary)">Legal intake</h1>
      <p className="text-sm text-(--text-secondary)">
        Statutory filings land directly with our legal queue. Clocks below show the
        published response windows as stored deadlines.
      </p>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filing type">
        {([
          ["dmca", "DMCA notice"],
          ["counter", "Counter-notice"],
          ["grievance", "Grievance (India)"],
          ["erasure", "Right of erasure"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={branch === key}
            onClick={() => { setBranch(key); setNote(null); }}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              branch === key
                ? "bg-brand-primary/10 text-brand-primary"
                : "bg-bg-overlay text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {needsSignIn ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-(--text-muted)">
            <a href="/signin" className="underline">Sign in</a> to file this type of request.
          </CardContent>
        </Card>
      ) : null}

      {branch === "dmca" ? (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">DMCA notice</h2>
            <p className="text-xs text-(--text-muted)">
              Acknowledgement within 3 business days · action within 10 (17 U.S.C. §512).
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Legal name" value={legalName} onChange={setLegalName} />
            <Field label="Physical address" value={address} onChange={setAddress} />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Target (post/comment id)" value={targetId} onChange={setTargetId} />
            <div>
              <label className="text-xs font-medium text-(--text-secondary)">Description of the infringing material</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                aria-label="Complaint description"
                className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-(--text-secondary)">
              <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} />
              I attest this notice is signed under penalty of perjury as to the copyright claim.
            </label>
            <Button
              disabled={busy || !attested}
              onClick={() => run(
                dmca({ legalName, physicalAddress: address, email, signatureAttested: attested, targetType: "post", targetId, description }),
                () => "Notice received — the 3-business-day acknowledgement window has started.",
              )}
            >
              File DMCA notice
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {branch === "counter" && !needsSignIn ? (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">DMCA counter-notice</h2>
            <p className="text-xs text-(--text-muted)">
              A facially complete counter-notice is always accepted for review.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Contact" value={email} onChange={setEmail} type="email" />
            <Field label="Target (post/comment id)" value={targetId} onChange={setTargetId} />
            <div>
              <label className="text-xs font-medium text-(--text-secondary)">Statement</label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                rows={4}
                aria-label="Counter-notice statement"
                className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-(--text-secondary)">
              <input type="checkbox" checked={goodFaith} onChange={(e) => setGoodFaith(e.target.checked)} />
              Good-faith attestation: the material was removed or disabled by mistake or misidentification.
            </label>
            <Button
              disabled={busy}
              onClick={() => run(
                counter({ targetType: "post", targetId, contact: email, statement, goodFaithAttested: goodFaith }),
                (r) => r.status === "received"
                  ? "Counter-notice accepted for review."
                  : "Counter-notice incomplete — facial completeness is required for review.",
              )}
            >
              File counter-notice
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {branch === "grievance" && !needsSignIn ? (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Grievance (India)</h2>
            <p className="text-xs text-(--text-muted)">
              Acknowledgement within 24 hours · action within 15 days.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Target (post/comment id)" value={targetId} onChange={setTargetId} />
            <div>
              <label className="text-xs font-medium text-(--text-secondary)">Grievance details</label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                rows={4}
                aria-label="Grievance details"
                className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <Button
              disabled={busy}
              onClick={() => run(
                authenticated({ type: "grievance_india", subjectClass: "ugc", targetType: "post", targetId, details: statement }),
                () => "Grievance received — the 24-hour acknowledgement clock has started.",
              )}
            >
              File grievance
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {branch === "erasure" && !needsSignIn ? (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Right of erasure</h2>
            <p className="text-xs text-(--text-muted)">
              Personal data is anonymized and your profile tombstoned. Records we must
              keep for legal obligations (strikes, legal filings, audit) are retained.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label='Type "ERASE MY DATA" to confirm' value={confirmation} onChange={setConfirmation} />
            <Button
              disabled={busy || confirmation !== "ERASE MY DATA"}
              onClick={() => run(
                erasure({ confirmation }),
                (r) => r.outcome === "ERASE_PARTIAL"
                  ? "Erasure initiated — personal data will be anonymized."
                  : "Erasure refused: an active legal hold exists on your account.",
              )}
            >
              Submit erasure request
            </Button>
            {note?.includes("refused") ? <Badge tone="warning">Legal hold</Badge> : null}
          </CardContent>
        </Card>
      ) : null}

      {note ? <p className="text-sm text-(--text-secondary)">{note}</p> : null}
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-(--text-secondary)">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary"
      />
    </div>
  );
}
