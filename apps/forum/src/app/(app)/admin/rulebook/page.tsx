"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results are untyped at the client edge until codegen push */

/**
 * Route: /admin/rulebook — SLICE-P4-06 (CAP-084/085/536/537).
 * CONTRACT-3-rulebook States 1-6a: rules list, rule edit (enable + tune,
 * bounds from configKeyRegistry — E1), out-of-bounds rejection, saved,
 * calibration-set curation (CAP-537), calibrate replay trigger (stub until
 * P4-07). H-TYPE's editor is the per-type required-field list editor
 * (structural, E2) — NOT a numeric slider.
 *
 * Layout: §12.4 admin console (via /admin layout). A1 DataTable for the
 * list; per-rule Dialog editors; calibration Card list.
 */

import { useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { FlaskConical, Play, Save, Settings2 } from "lucide-react";

import { api } from "../../../../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DataTable, DataTableToolbar, type DataTableColumn } from "@/components/ui/data-table";
import { SkeletonText } from "@/components/ui/skeleton";

interface RuleRow {
  _id: string;
  ruleKey: string;
  ruleClass: string;
  severity: string;
  enabled: boolean;
  thresholdConfig: Record<string, unknown>;
  applicablePostTypes: string[];
  ruleVersion: number;
  updatedAt: number;
}

const ACTIVE_TYPES = ["news", "review", "compare", "debate", "list", "showcase", "help", "spark"] as const;

/** Candidate field vocabulary for the H-TYPE structural editor (E2 mapping). */
const TYPE_FIELD_VOCAB: Record<string, string[]> = {
  news: ["source"],
  review: ["tool", "verdict"],
  compare: ["tools_2_to_4", "qualitativeGrid"],
  debate: ["proposition"],
  list: ["items", "mode", "intro"],
  showcase: ["metadata", "theThing", "projectUrl"],
  help: ["problemStatement"],
  spark: ["statement"],
};

export default function AdminRulebookPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<RuleRow | null>(null);
  const [editEnabled, setEditEnabled] = useState(true);
  const [numericEdits, setNumericEdits] = useState<Record<string, string>>({});
  const [typeEdits, setTypeEdits] = useState<Record<string, string[]>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [calibrateToast, setCalibrateToast] = useState<string | null>(null);

  const data = useQuery(api.rulebook.listRules);
  const examples = useQuery(api.rulebook.listCalibrationExamples);
  const setRuleConfig = useMutation(api.rulebook.setRuleConfig);
  const triggerCalibrate = useAction(api.rulebook.triggerCalibrate); // action since P4-07 (vectorSearch seams)

  const rules: RuleRow[] = useMemo(
    () =>
      ((data as any)?.rules ?? []).map((r: any) => ({
        _id: r._id,
        ruleKey: r.ruleKey,
        ruleClass: r.ruleClass,
        severity: r.severity,
        enabled: r.enabled,
        thresholdConfig: r.thresholdConfig ?? {},
        applicablePostTypes: r.applicablePostTypes ?? [],
        ruleVersion: r.ruleVersion,
        updatedAt: r.updatedAt,
      })),
    [data],
  );

  const filtered = useMemo(
    () => (search ? rules.filter((r) => r.ruleKey.toLowerCase().includes(search.toLowerCase())) : rules),
    [rules, search],
  );

  const openEdit = (rule: RuleRow) => {
    setEditing(rule);
    setEditEnabled(rule.enabled);
    setSaveError(null);
    const numeric: Record<string, string> = {};
    const typeEdits: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(rule.thresholdConfig)) {
      if (key === "requiredFieldsByType") {
        const byType = value as Record<string, string[]>;
        for (const [t, fields] of Object.entries(byType)) typeEdits[t] = [...fields];
      } else {
        numeric[key] = String(value);
      }
    }
    setNumericEdits(numeric);
    setTypeEdits(typeEdits);
  };

  const save = async () => {
    if (!editing) return;
    setSaveError(null);
    const thresholdConfig: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(numericEdits)) {
      const num = Number(raw);
      if (Number.isNaN(num)) {
        setSaveError(`${key}: not a number`);
        return;
      }
      thresholdConfig[key] = num;
    }
    if (editing.ruleKey === "H-TYPE") thresholdConfig.requiredFieldsByType = typeEdits;
    try {
      await setRuleConfig({
        ruleKey: editing.ruleKey,
        enabled: editEnabled,
        thresholdConfig,
      });
      setEditing(null);
    } catch (err) {
      // CAP-084 out-of-bounds rejection surfaces here (E1 bounds from configKeyRegistry)
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const runCalibrate = async () => {
    try {
      const result = await triggerCalibrate({});
      const r = result as { replayed?: number; drifted?: number } | null;
      setCalibrateToast(
        r && typeof r.replayed === "number"
          ? `Replay complete — ${r.replayed} example(s), ${r.drifted ?? 0} with threshold drift.`
          : "Calibration replay completed.",
      );
    } catch (err) {
      setCalibrateToast(err instanceof Error ? err.message : "Calibrate failed");
    }
    window.setTimeout(() => setCalibrateToast(null), 4000);
  };

  const columns: DataTableColumn<RuleRow>[] = [
    { key: "ruleKey", header: "Rule", cell: (r) => <span className="font-mono text-sm">{r.ruleKey}</span> },
    { key: "ruleClass", header: "Class", cell: (r) => <Badge tone={r.ruleClass === "hard" ? "error" : "info"}>{r.ruleClass}</Badge> },
    { key: "severity", header: "Severity", cell: (r) => <Badge tone="neutral">{r.severity}</Badge> },
    { key: "enabled", header: "Enabled", cell: (r) => <Badge tone={r.enabled ? "success" : "warning"}>{r.enabled ? "enabled" : "disabled"}</Badge> },
    { key: "ruleVersion", header: "v", cell: (r) => <span className="text-text-muted">v{r.ruleVersion}</span> },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(r)} aria-label={`Edit ${r.ruleKey}`}>
          <Settings2 className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[980px] space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-(--text-primary)">Qualification Thresholds &amp; Rules</h1>
        <p className="text-sm text-(--text-secondary)">
          The deterministic content-qualification gate — enable rules, tune bounded thresholds (bounds owned by the
          config registry), curate the calibration set.
        </p>
      </header>

      {data === undefined ? (
        <SkeletonText className="w-full" />
      ) : rules.length === 0 ? (
        <Banner variant="warning">
          No qualification rules found — run the deploy seeder (CAP-536): npx convex run rulebook/deploySeed
        </Banner>
      ) : (
        <Card>
          <CardHeader className="p-0 pb-2">
            <DataTableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Filter rules…" />
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={filtered} getRowId={(r) => r._id} density="compact" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Calibration</h2>
          <Button variant="secondary" size="sm" onClick={() => void runCalibrate()}>
            <Play className="size-4" />
            Run calibration replay
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <p className="text-xs text-(--text-muted)">
            The labeled set (CAP-537) the replay executes against. Snapshot sourcing joins contentCandidates when
            SLICE-P4-08 lands the M2 pipeline; labels are editable now.
          </p>
          {(examples ?? []).length === 0 ? (
            <p className="text-sm text-(--text-secondary)">No calibration examples yet.</p>
          ) : (
            <ul className="space-y-2">
              {(examples as any[]).map((ex) => (
                <li key={ex._id} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-(--border-subtle) p-2">
                  <FlaskConical className="size-4 text-(--text-muted)" aria-hidden />
                  <span className="text-xs text-(--text-muted)">snapshot {String((ex.candidateSnapshot as any)?.title ?? ex._id).slice(0, 40)}</span>
                  {Object.entries(ex.expectedOutcome as Record<string, string>).map(([ruleKey, outcome]) => (
                    <Badge key={ruleKey} tone={outcome === "pass" ? "success" : "error"}>
                      {ruleKey}: {outcome}
                    </Badge>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {calibrateToast ? (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-(--border-default) bg-(--bg-surface-elevated) px-4 py-2 text-sm text-(--text-primary) shadow-(--shadow-lg)">
          {calibrateToast}
        </div>
      ) : null}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">{editing?.ruleKey}</DialogTitle>
            <DialogDescription>
              Enable/disable + tune thresholds. Numeric bounds are validated against the config registry (E1);
              out-of-bounds values are rejected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-(--text-primary)">
              <Checkbox
                checked={editEnabled}
                onCheckedChange={setEditEnabled}
                aria-label={`${editing?.ruleKey ?? "Rule"} enabled`}
              />
              Enabled
            </label>

            {Object.keys(numericEdits).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(numericEdits).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <label htmlFor={`thr-${key}`} className="font-mono text-xs text-(--text-secondary)">
                      {key}
                    </label>
                    <Input
                      id={`thr-${key}`}
                      value={value}
                      inputMode="decimal"
                      onChange={(e) => setNumericEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {editing?.ruleKey === "H-TYPE" ? (
              <div className="space-y-2">
                <p className="text-xs text-(--text-muted)">
                  Structural contract (E2): per-type required-field list — not a numeric slider.
                </p>
                {ACTIVE_TYPES.map((type) => (
                  <div key={type} className="rounded-lg border border-(--border-subtle) p-2">
                    <p className="mb-1 text-xs font-semibold text-(--text-primary)">{type}</p>
                    <div className="flex flex-wrap gap-2">
                      {(TYPE_FIELD_VOCAB[type] ?? []).map((field) => {
                        const checked = (typeEdits[type] ?? []).includes(field);
                        return (
                          <label key={field} className="flex items-center gap-1.5 text-xs text-(--text-secondary)">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) =>
                                setTypeEdits((prev) => {
                                  const current = prev[type] ?? [];
                                  return {
                                    ...prev,
                                    [type]: v ? [...current, field] : current.filter((f) => f !== field),
                                  };
                                })
                              }
                              aria-label={`${type} requires ${field}`}
                            />
                            {field}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {saveError ? <Banner variant="error">{saveError}</Banner> : null}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void save()}>
              <Save className="size-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
