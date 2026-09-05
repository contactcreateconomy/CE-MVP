"use client";

/**
 * Route: /admin/roles — SLICE-P3-09 + P3-10
 * A1 DataTable for role assignments + ops-coverage matrix.
 */

import { useQuery } from "convex/react";
import { UserPlus, ShieldCheck, AlertTriangle } from "lucide-react";

import { api } from "../../../../../../../convex/_generated/api";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonText } from "@/components/ui/skeleton";

interface RoleRow { _id: string; userId: string; role: string; status: string; grantedAt: number }
interface OpsRow { _id: string; slot: string; userId: string; status: string }

export default function AdminRolesPage() {
  const assignments = useQuery(api.admin.roles?.listAssignments) ?? [];
  const opsAssignments = useQuery(api.admin.roles?.listOpsAssignments) ?? [];

  const roleColumns: DataTableColumn<RoleRow>[] = [
    { key: "userId", header: "User", cell: (r) => <span className="font-mono text-xs">{r.userId}</span> },
    { key: "role", header: "Role", sortValue: (r) => r.role },
    {
      key: "status", header: "Status",
      cell: (r) => <Badge tone={r.status === "active" ? "success" : "error"}>{r.status}</Badge>,
    },
    { key: "grantedAt", header: "Granted", cell: (r) => <span className="text-xs text-text-muted">{new Date(r.grantedAt).toISOString().slice(0, 10)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Roles & Ops Coverage</h1>
        <Button size="sm" variant="secondary"><UserPlus className="size-4" /> Assign role</Button>
      </div>

      {/* Role assignments on A1 */}
      <div className="card-surface">
        <DataTable
          columns={roleColumns}
          data={assignments as unknown as RoleRow[]}
          getRowId={(r) => r._id}
          emptyState={<p className="p-4 text-sm text-text-muted">No role assignments yet.</p>}
        />
      </div>

      {/* Ops-coverage matrix (P3-10) */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-primary">Ops Coverage</h2>
        </CardHeader>
        <CardContent>
          {opsAssignments.length === 0 ? (
            <p className="text-sm text-text-muted">No ops assignments yet. 11 slots to fill before launch.</p>
          ) : (
            <div className="space-y-2">
              {(opsAssignments as unknown as OpsRow[]).map((ops) => (
                <div key={ops._id} className="flex items-center justify-between rounded-md border border-border-subtle p-2">
                  <span className="text-sm font-medium">{ops.slot.replace(/_/g, " ")}</span>
                  <Badge tone={ops.status === "filled" ? "success" : ops.status === "single_person_acknowledged" ? "warning" : "error"}>
                    {ops.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
