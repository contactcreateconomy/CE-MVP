"use client";

import * as React from "react";
import { Eye, LayoutGrid, Lock, Search, ShieldCheck } from "lucide-react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/ui/command-palette";
import { SearchableCombobox } from "@/components/ui/combobox";
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { DatetimePicker } from "@/components/ui/datetime-picker";
import { FileDropzone } from "@/components/ui/dropzone";
import { Interstitial } from "@/components/ui/interstitial";
import { QueueBoard, type QueueCase } from "@/components/ui/queue-board";
import { TieredLadder } from "@/components/ui/tiered-ladder";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * /kit — Layer 3 fixture demo (SLICE-P3-04/05/06 expect a
 * storybook-style demo route). Fixture data only; no real queries.
 * Manual visual pass: each archetype renders its contract states.
 */

type ConfigRow = {
  id: string;
  key: string;
  value: string;
  tier: string;
  masked: boolean;
};

const configRows: ConfigRow[] = [
  { id: "1", key: "feed.page_size", value: "20", tier: "tier1", masked: false },
  { id: "2", key: "persona.relevance_gate", value: "0.62", tier: "tier2", masked: false },
  { id: "3", key: "signal.eventWeights", value: "—", tier: "sealed", masked: true },
  { id: "4", key: "trust.weightCap", value: "—", tier: "sealed", masked: true },
  { id: "5", key: "ingest.fanout_ceiling", value: "500", tier: "tier2", masked: false },
];

const configColumns: DataTableColumn<ConfigRow>[] = [
  { key: "key", header: "Key", sortValue: (r) => r.key },
  { key: "value", header: "Value", masked: (r) => r.masked },
  { key: "tier", header: "Edit tier", sortValue: (r) => r.tier },
];

const queueCases: QueueCase[] = [
  {
    id: "case-1",
    title: "Report burst — showcase post 1204",
    targetType: "post",
    severity: "s0_critical",
    statusLabel: "s0_critical",
    ageLabel: "42m — aging threshold 1h breached",
    agedOut: true,
  },
  {
    id: "case-2",
    title: "DMCA takedown — resource #88",
    targetType: "resource",
    severity: "legal",
    statusLabel: "legal",
    ageLabel: "3h",
    claimedBy: "editor_kim",
    leaseRemainingLabel: "12m lease",
  },
  {
    id: "case-3",
    title: "Profanity hold — comment on debate thread",
    targetType: "comment",
    severity: "s2_medium",
    statusLabel: "s2_medium",
    ageLabel: "1d",
    claimedBy: "mod_dan",
    claimedByMe: true,
    leaseRemainingLabel: "4m lease",
  },
];

const paletteSections = [
  {
    label: "Consoles",
    items: [
      {
        id: "config",
        label: "Config Console",
        icon: <LayoutGrid className="size-4" />,
        keywords: ["/admin/config"],
        onSelect: () => {},
      },
      {
        id: "roles",
        label: "Roles & Ops Coverage",
        icon: <ShieldCheck className="size-4" />,
        keywords: ["/admin/roles"],
        onSelect: () => {},
      },
    ],
  },
];

const timezoneOptions = [
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Europe/Berlin",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
].map((tz) => ({ value: tz, label: tz }));

export default function KitPage() {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [timezone, setTimezone] = React.useState("");
  const [scheduledFor, setScheduledFor] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState([{ id: "f1", name: "ledger-basics.pdf" }]);

  return (
    <main className="mx-auto max-w-(--container-compose) space-y-10 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-text-primary">Layer 3 — archetype fixtures</h1>
        <p className="text-sm text-text-secondary">
          STYLE-KIT §11.10–§11.19 demo route (SLICE-P3-04/05/06). Fixture data only.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">A1 Data Table — /admin/config namespace fixture</h2>
        <div className="card-surface">
          <DataTableToolbar
            searchValue=""
            onSearchChange={() => {}}
            bulkActions={
              <Button size="sm" variant="ghost">
                Export (audited)
              </Button>
            }
          />
          <DataTable
            columns={configColumns}
            data={configRows}
            getRowId={(r) => r.id}
            selectable
            selectedIds={selected}
            onSelectionChange={setSelected}
            // §11.10: icon-only row actions → aria-label + tooltip (§9.4.2) —
            // the Tooltip primitive's first wired consumer
            renderRowActions={(row) => (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`View ${row.key}`}
                      onClick={() => {}}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open {row.key} editor</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          />
          <DataTablePagination label="5 keys · sealed keys have no editor mutation" prevDisabled nextDisabled />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">A12 Queue board — moderation case queue fixture</h2>
        <QueueBoard
          cases={queueCases}
          renderActions={(c) =>
            c.claimedBy ? (
              <Button size="xs" variant="ghost">
                Renew lease
              </Button>
            ) : (
              <Button size="sm" variant="secondary">
                Claim
              </Button>
            )
          }
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">A11 Command Palette</h2>
        <Button onClick={() => setPaletteOpen(true)}>
          <Search className="size-4" /> Open palette
        </Button>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} sections={paletteSections} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">§11.13 Banner variants</h2>
        <div className="space-y-2">
          <Banner variant="info">Analytics are granted — PostHog injection precondition met.</Banner>
          <Banner variant="warning" onDismiss={() => {}}>
            Queue-load soft alert: 250 open cases.
          </Banner>
          <Banner variant="error">Export failed its own audit write — fail-closed, no file issued.</Banner>
          <Banner variant="neutral">Operational mode: degraded.</Banner>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">§11.15 Combobox — IANA timezone</h2>
          <SearchableCombobox
            options={timezoneOptions}
            value={timezone}
            onChange={setTimezone}
            placeholder="Search timezones…"
          />
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">§11.14 Datetime — CAP-175 scheduledFor</h2>
          <DatetimePicker value={scheduledFor} onChange={setScheduledFor} withTime />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">A4 Dropzone — contribute fixture</h2>
        <FileDropzone
          files={files}
          onFileRemoved={(id) => setFiles((f) => f.filter((x) => x.id !== id))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">A8 Tiered ladder — vertical rail fixture</h2>
        <div className="card-surface max-w-sm p-4">
          <TieredLadder
            currentLevel="planet"
            assignmentStatus="active"
            progress={{ reachPct: 64, signalPct: 41, sustainedPct: 12, sustainedLabel: "4 / 30 days" }}
            rungs={[
              { level: "orbit", band: "all" },
              { level: "comet", band: "top 50%" },
              { level: "moon", band: "top 20%" },
              { level: "planet", band: "top 10%" },
              { level: "star", band: "top 3%" },
              { level: "supernova", band: "top 1%" },
              { level: "pulsar", band: "top 0.3%" },
              { level: "galaxy", band: "top 0.1%" },
              { level: "universe", band: "top 0.03%" },
              { level: "multiverse", band: "abs cap ~100" },
            ]}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">§11.10 masked-value hook preview</h2>
        <p className="inline-flex items-center gap-1 text-xs text-text-muted">
          <Lock className="size-3" /> sealed values render masked — never the raw value
        </p>
      </section>
    </main>
  );
}
