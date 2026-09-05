"use client";

/**
 * Route: /admin/audit — SLICE-P3-11
 * A1 DataTable with filtered query, masked-value rendering, export button.
 * "Never delete auditLog" — no delete path exists in the UI.
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { Download, Lock, Eye } from "lucide-react";

import { api } from "../../../../../../../convex/_generated/api";
import { DataTable, DataTableToolbar, type DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonText } from "@/components/ui/skeleton";

interface AuditRow {
  _id: string; actorId?: string; role?: string; action: string;
  target: string; reasonCode?: string; correlationId: string;
  reversible?: boolean; createdAt: number;
}

export default function AdminAuditPage() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const result = useQuery(api.admin.audit?.auditQuery, {
    action: filterAction || undefined,
    limit: 50,
  });
  const rows: AuditRow[] = useMemo(() => (result as any)?.rows ?? [], [result]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    return rows.filter((r) =>
      r.action.toLowerCase().includes(search.toLowerCase()) ||
      r.target.toLowerCase().includes(search.toLowerCase()) ||
      r.correlationId.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  const columns: DataTableColumn<AuditRow>[] = [
    {
      key: "createdAt", header: "Time", sortValue: (r) => r.createdAt,
      cell: (r) => <span className="text-xs text-text-muted">{new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 19)}</span>,
    },
    { key: "action", header: "Action", sortValue: (r) => r.action },
    { key: "target", header: "Target" },
    {
      key: "actor", header: "Actor",
      cell: (r) => <span className="font-mono text-xs">{r.actorId ? r.actorId.slice(0, 12) + "…" : "System"}</span>,
    },
    {
      key: "correlation", header: "Correlation",
      cell: (r) => <span className="font-mono text-xs text-text-muted">{r.correlationId.slice(0, 8)}…</span>,
    },
    {
      key: "reversible", header: "Rev.",
      cell: (r) => <Badge tone={r.reversible ? "info" : "neutral"}>{r.reversible ? "yes" : "no"}</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Audit Log Viewer</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary"><Eye className="size-4" /> Spot-check</Button>
          <Button size="sm"><Download className="size-4" /> Export (audited)</Button>
        </div>
      </div>

      <div className="card-surface">
        <DataTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search audit trail…"
        />
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(r) => r._id}
          emptyState={<p className="p-4 text-sm text-text-muted">No audit entries found.</p>}
        />
        {result === undefined && <div className="p-4"><SkeletonText className="w-full" /></div>}
      </div>

      <p className="text-xs text-text-muted">
        <Lock className="mr-1 inline size-3" />
        Append-only — audit records are never deleted (cold archive OK per CAP-421).
        Export itself is audited (CAP-422, fail-closed).
      </p>
    </div>
  );
}
