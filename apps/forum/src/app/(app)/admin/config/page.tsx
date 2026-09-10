"use client";

/**
 * Route: /admin/config — SLICE-P3-07 + P3-08
 * CONTRACT-7-admin-config States A (namespace read) + B (CAS update) + D-H
 * (STOP/kill/signup/mirror).
 *
 * A1 DataTable for namespace listing, registry-driven typed forms,
 * CAS version-conflict inline error, sealed keys absent by construction.
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { AlertTriangle, Save, ShieldAlert, Power, RotateCcw } from "lucide-react";

import { api } from "../../../../../../../convex/_generated/api";
import { DataTable, DataTableToolbar, type DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { SkeletonText } from "@/components/ui/skeleton";

interface ConfigRow {
  _id: string;
  key: string;
  module: string;
  valueType: string;
  default: unknown;
  min?: number;
  max?: number;
  enumValues?: string[];
  editTier: string;
  blastRadius: string;
  failDirection?: string;
  sealed: boolean;
  reversible: boolean;
  liveValue: unknown;
  liveVersion: number;
  liveStatus: string | null;
}

export default function AdminConfigPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ConfigRow | null>(null);
  const [editValue, setEditValue] = useState("");
  const [reason, setReason] = useState("");
  const [casError, setCasError] = useState<string | null>(null);
  const [tier3Confirm, setTier3Confirm] = useState(false);
  const [tier3Text, setTier3Text] = useState("");

  const namespace = useQuery(api.config.getNamespace, {});
  const casUpdate = useMutation(api.config.casUpdate);

  const rows: ConfigRow[] = useMemo(() => {
    const ns = (namespace as ConfigRow[] | undefined) ?? [];
    return ns.map((r) => ({
      _id: r._id,
      key: r.key,
      module: r.module,
      valueType: r.valueType,
      default: r.default,
      min: r.min,
      max: r.max,
      enumValues: r.enumValues,
      editTier: r.editTier,
      blastRadius: r.blastRadius,
      failDirection: r.failDirection,
      sealed: r.sealed,
      reversible: r.reversible,
      liveValue: r.liveValue,
      liveVersion: r.liveVersion,
      liveStatus: r.liveStatus,
    }));
  }, [namespace]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    return rows.filter((r) => r.key.toLowerCase().includes(search.toLowerCase()));
  }, [rows, search]);

  const columns: DataTableColumn<ConfigRow>[] = [
    { key: "key", header: "Key", sortValue: (r) => r.key },
    { key: "module", header: "Module", sortValue: (r) => r.module },
    {
      key: "value",
      header: "Value",
      cell: (r) => (
        <span className="font-mono text-xs">
          {r.liveStatus === "active" ? String(r.liveValue) : `${String(r.default)} (default)`}
        </span>
      ),
    },
    {
      key: "version",
      header: "Version",
      cell: (r) => <span className="text-xs text-text-muted">v{r.liveVersion}</span>,
    },
    {
      key: "tier",
      header: "Edit tier",
      cell: (r) => (
        <Badge tone={r.editTier === "tier3" ? "warning" : r.editTier === "tier2" ? "info" : "neutral"}>
          {r.editTier}
        </Badge>
      ),
    },
  ];

  const openEdit = (row: ConfigRow) => {
    setEditing(row);
    setEditValue(String(row.liveStatus === "active" ? row.liveValue : row.default));
    setReason("");
    setCasError(null);
    setTier3Confirm(false);
    setTier3Text("");
  };

  const save = useCallback(async () => {
    if (!editing) return;
    setCasError(null);
    try {
      await casUpdate({
        key: editing.key,
        value: editing.valueType === "number" ? Number(editValue) : editing.valueType === "boolean" ? editValue === "true" : editValue,
        expectedVersion: editing.liveVersion,
        reason: reason || undefined,
        blastRadius: editing.blastRadius,
        actorRole: "administrator",
      });
      setEditing(null);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("version conflict")) {
        setCasError("Version conflict — another admin updated this key. Re-read and retry.");
      } else {
        setCasError(msg);
      }
    }
  }, [editing, editValue, reason, casUpdate]);

  // SLICE-P7E-10 (CAP-358/429): the Legal namespace — policy reason-code
  // copy. Version-forward only: edits insert a NEW version row; decided
  // cases keep code+version and never see copy changes.
  const reasonCodes = useQuery(api.moderation.reasonCodes.listLatest, {});
  const editCodeCopy = useMutation(api.moderation.reasonCodes.editCopy);
  const founderBump = useMutation(api.moderation.reasonCodes.founderBumpAll);
  const [legalCode, setLegalCode] = useState<ConfigRow | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [legalTitle, setLegalTitle] = useState("");
  const [legalBody, setLegalBody] = useState("");
  const [legalNote, setLegalNote] = useState<string | null>(null);
  const [bumpLabel, setBumpLabel] = useState("");

  const needsReason: boolean = Boolean(editing && (editing.editTier === "tier2" || editing.editTier === "tier3"));
  const needsTier3Confirm = editing?.editTier === "tier3";
  const tier3Confirmed: boolean = !needsTier3Confirm || (tier3Confirm === true && tier3Text === editing?.key);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Config Console</h1>
        <Badge tone="neutral">{rows.length} keys</Badge>
      </div>

      {/* Sealed keys are absent from getNamespace by construction (CAP-394) */}
      {namespace === undefined ? (
        <div className="card-surface p-4"><SkeletonText className="w-full" /> <SkeletonText className="w-4/5" /></div>
      ) : (
        <div className="card-surface">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search config keys…"
          />
          <DataTable
            columns={columns}
            data={filtered}
            getRowId={(r) => r._id}
            onRowClick={openEdit}
          />
        </div>
      )}

      {/* Edit dialog (CAS update) */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{editing?.key}</DialogTitle>
            <DialogDescription>
              {editing?.valueType} · {editing?.editTier} · blast radius: {editing?.blastRadius}
            </DialogDescription>
          </DialogHeader>

          {casError && <Banner variant="error">{casError}</Banner>}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-secondary">Value</label>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="mt-1 font-mono"
                aria-label="Config value"
              />
              {editing?.min !== undefined && (
                <p className="mt-1 text-xs text-text-muted">min: {editing.min} · max: {editing.max}</p>
              )}
              {editing?.enumValues && (
                <p className="mt-1 text-xs text-text-muted">enum: {editing.enumValues.join(" | ")}</p>
              )}
            </div>

            {needsReason && (
              <div>
                <label className="text-xs text-text-secondary">Reason (required for {editing?.editTier})</label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this change being made?"
                  className="mt-1"
                  aria-label="Change reason"
                />
              </div>
            )}

            {needsTier3Confirm && (
              <div className="rounded-md border border-border-warning bg-feedback-warning/10 p-3">
                <p className="text-xs font-semibold text-feedback-warning">
                  <ShieldAlert className="mr-1 inline size-3" />
                  Tier-3 typed confirmation required
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Type <code className="rounded bg-bg-inset px-1 font-mono">{editing?.key}</code> to confirm.
                </p>
                <Input
                  value={tier3Text}
                  onChange={(e) => setTier3Text(e.target.value)}
                  className="mt-2 font-mono text-xs"
                  placeholder={editing?.key}
                  aria-label="Type the config key to confirm"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={save}
              disabled={!tier3Confirmed || (needsReason && !reason.trim())}
            >
              <Save className="size-4" />
              Save (CAS v{editing?.liveVersion} → v{(editing?.liveVersion ?? 0) + 1})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SLICE-P7E-10 — Legal namespace: policy reason codes (CAP-358/429) */}
      <div className="card-surface space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Legal — policy reason codes</h2>
            <p className="text-xs text-text-muted">
              Copy edits create a new version — decided cases keep their recorded code+version forever.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={bumpLabel}
              onChange={(e) => setBumpLabel(e.target.value)}
              placeholder="Release label (CAP-429)"
              className="w-56"
              aria-label="Policy release label"
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={!bumpLabel.trim()}
              onClick={() => {
                void founderBump({ releaseLabel: bumpLabel.trim() })
                  .then((r) => setLegalNote(`Policy copy bumped to ${r.releaseLabel} (${r.bumped} codes).`))
                  .catch((e) => setLegalNote(String(e?.message ?? e)));
              }}
            >
              Founder bump-all
            </Button>
          </div>
        </div>
        {reasonCodes === undefined ? (
          <SkeletonText className="w-full" />
        ) : (
          <div className="space-y-1">
            {(reasonCodes.codes as any[]).map((c) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <button
                key={c._id}
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-border-subtle px-3 py-2 text-left text-sm hover:bg-bg-overlay/50"
                onClick={() => {
                  setLegalCode(c);
                  setLegalTitle(c.userFacingTitle);
                  setLegalBody(c.userFacingBody);
                  setLegalNote(null);
                }}
              >
                <span className="font-mono text-xs text-text-primary">{c.code}</span>
                <span className="flex items-center gap-2">
                  <Badge tone={c.autoReleaseEligible ? "success" : "neutral"}>
                    {c.autoReleaseEligible ? "auto-release" : c.severity}
                  </Badge>
                  <Badge tone="neutral">v{c.version}</Badge>
                </span>
              </button>
            ))}
          </div>
        )}
        {legalNote ? <p className="text-xs text-text-muted">{legalNote}</p> : null}
      </div>

      {/* Reason-code copy edit dialog (CAP-358 — new version on save) */}
      <Dialog open={legalCode !== null} onOpenChange={(o) => !o && setLegalCode(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Edit copy — {legalCode?.key ?? legalCode?._id}</DialogTitle>
            <DialogDescription>
              Saves as a new version. Historical rows are never overwritten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-secondary">User-facing title</label>
              <Input value={legalTitle} onChange={(e) => setLegalTitle(e.target.value)} aria-label="User-facing title" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">User-facing body</label>
              <textarea
                value={legalBody}
                onChange={(e) => setLegalBody(e.target.value)}
                rows={4}
                aria-label="User-facing body"
                className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setLegalCode(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!legalCode) return;
                void editCodeCopy({
                  code: (legalCode as any).code, // eslint-disable-line @typescript-eslint/no-explicit-any
                  userFacingTitle: legalTitle,
                  userFacingBody: legalBody,
                })
                  .then((r) => setLegalNote(`${r.code} → v${r.version} (new version).`))
                  .then(() => setLegalCode(null))
                  .catch((e) => setLegalNote(String(e?.message ?? e)));
              }}
            >
              <Save className="size-4" />
              Save new version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
