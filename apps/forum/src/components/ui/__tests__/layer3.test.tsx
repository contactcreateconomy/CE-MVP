import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";

import { Banner } from "@/components/ui/banner";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CommandPalette } from "@/components/ui/command-palette";
import { SearchableCombobox } from "@/components/ui/combobox";
import { DataTable, DataTableColumn, DataTablePagination, DataTableToolbar } from "@/components/ui/data-table";
import { DatetimePicker } from "@/components/ui/datetime-picker";
import { FileDropzone } from "@/components/ui/dropzone";
import { EmptyState } from "@/components/ui/empty-state";
import { Interstitial } from "@/components/ui/interstitial";
import { QueueBoard, type QueueCase } from "@/components/ui/queue-board";

/* Layer 3 archetype components — state coverage against the source
 * contracts (STYLE-KIT §11.10–§11.19 + consuming CONTRACT-*-FINAL §3). */

describe("Banner (§11.13)", () => {
  it("renders variants with feedback surfaces and dismiss control only when dismissible", () => {
    const onDismiss = vi.fn();
    // info/success/neutral → status; warning/error → assertive alert
    const { rerender } = render(<Banner variant="info">CMP pending</Banner>);
    expect(screen.getByRole("status").textContent).toContain("CMP pending");
    expect(screen.queryByLabelText("Dismiss")).toBeNull();

    rerender(<Banner variant="warning">Queue-load soft alert</Banner>);
    expect(screen.getByRole("alert").textContent).toContain("Queue-load soft alert");

    rerender(<Banner variant="error" onDismiss={onDismiss}>Export failed</Banner>);
    expect(screen.getByRole("alert").textContent).toContain("Export failed");
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe("Checkbox (§11.2)", () => {
  it("toggles and exposes mixed state for header select-page", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Checkbox checked={false} onCheckedChange={onChange} aria-label="Select page" />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(
      <Checkbox checked={false} indeterminate onCheckedChange={onChange} aria-label="Select page" />,
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "mixed");
  });

  it("§11.8 error state: invalid flips the border to feedback/error", () => {
    render(
      <Checkbox checked={false} invalid onCheckedChange={() => {}} aria-label="Accept terms" />,
    );
    const box = screen.getByRole("checkbox");
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box.className).toContain("border-feedback-error");
  });
});

describe("Card selected (§11.8 / §11.10 visual)", () => {
  it("renders the shared selected visual: brand 10% + 2px brand left border", () => {
    const { container, rerender } = render(<Card data-testid="c">body</Card>);
    expect(container.firstChild).not.toHaveClass("border-l-brand-primary");
    rerender(
      <Card selected data-testid="c">
        body
      </Card>,
    );
    expect(container.firstChild).toHaveClass("border-l-brand-primary", "bg-brand-primary/10");
  });
});

describe("DataTable (§11.10 / SLICE-P3-04)", () => {
  interface Row {
    id: string;
    key: string;
    value: string;
    masked: boolean;
  }
  const columns: DataTableColumn<Row>[] = [
    { key: "key", header: "Key", sortValue: (r) => r.key },
    { key: "value", header: "Value", masked: (r) => r.masked },
  ];
  const data: Row[] = [
    { key: "signal.eventWeights", value: "SEALED", masked: true, id: "1" },
    { key: "feed.page_size", value: "20", masked: false, id: "2" },
  ];

  it("renders rows, masks sealed values (audit masked-value hook), and sorts on header", async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
      />,
    );
    // desktop table renders both rows
    expect(container.querySelectorAll("tbody tr").length).toBe(2);
    // masked cell: lock affordance, not the value — renders in BOTH the
    // desktop table and the mobile stacked collapse (dual-render by design)
    expect(screen.getAllByText("•••").length).toBe(2);
    expect(screen.queryByText("SEALED")).toBeNull();

    // sort toggles aria-sort ascending → descending (client sort via sortValue)
    const keyHeader = screen.getByRole("columnheader", { name: /^Key/ });
    expect(keyHeader).toHaveAttribute("aria-sort", "none");
    fireEvent.click(screen.getByRole("button", { name: /Key/ }));
    expect(keyHeader).toHaveAttribute("aria-sort", "ascending");
    const firstKeyCell = () => container.querySelectorAll("tbody tr td")[0].textContent;
    expect(firstKeyCell()).toContain("feed.page_size");
    fireEvent.click(screen.getByRole("button", { name: /Key/ }));
    expect(keyHeader).toHaveAttribute("aria-sort", "descending");
    expect(firstKeyCell()).toContain("signal.eventWeights");
  });

  it("bulk-select: header checkbox selects the page and shows indeterminate on partial", () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        selectable
        selectedIds={["1"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(screen.getByLabelText("Select page")).toHaveAttribute("aria-checked", "mixed");
    fireEvent.click(screen.getByLabelText("Select page"));
    expect(onSelectionChange).toHaveBeenCalledWith(["1", "2"]);

    rerender(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        selectable
        selectedIds={["1", "2"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(screen.getByLabelText("Select page")).toHaveAttribute("aria-checked", "true");
  });

  it("states: loading renders 8 skeleton rows; empty renders the §11.23 empty-state; error renders Banner above last-good", () => {
    const { container, rerender } = render(
      <DataTable columns={columns} data={[]} getRowId={(r) => r.id} loading />,
    );
    expect(container.querySelectorAll("tbody tr").length).toBe(8);

    rerender(<DataTable columns={columns} data={[]} getRowId={(r) => r.id} />);
    expect(screen.getByText("No rows")).toBeDefined();

    rerender(
      <DataTable
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        error="audit write failed — export aborted (fail-closed)"
      />,
    );
    expect(
      screen.getByText(/audit write failed — export aborted \(fail-closed\)/),
    ).toBeDefined();
  });

  it("toolbar + cursor pagination footer (no page numbers)", () => {
    render(
      <>
        <DataTableToolbar searchValue="x" onSearchChange={() => {}} bulkActions={<span>Export</span>} />
        <DataTablePagination
          label="1–25 of 84"
          prevDisabled
          onNext={() => {}}
        />
      </>,
    );
    expect(screen.getByPlaceholderText("Search…")).toBeDefined();
    expect(screen.getByText("Export")).toBeDefined();
    expect(screen.getByText("1–25 of 84")).toBeDefined();
    expect(screen.getByText("Prev")).toHaveProperty("disabled", true);
    expect(screen.getByText("Next")).toHaveProperty("disabled", false);
    expect(screen.queryByText(/Page \d/)).toBeNull();
  });
});

describe("QueueBoard (§11.11 / SLICE-P3-05)", () => {
  const cases: QueueCase[] = [
    {
      id: "case-1",
      title: "Report: spam burst on showcase post",
      targetType: "post",
      severity: "s0_critical",
      statusLabel: "open",
      ageLabel: "42m",
      agedOut: true,
    },
    {
      id: "case-2",
      title: "DMCA takedown — resource #88",
      targetType: "resource",
      severity: "legal",
      statusLabel: "open",
      ageLabel: "3h",
      claimedBy: "editor_kim",
      leaseRemainingLabel: "12m lease",
    },
  ];

  it("renders polymorphic cases with severity pills and claim affordances (no per-type fork)", () => {
    render(<QueueBoard cases={cases} />);
    expect(screen.getByText("Report: spam burst on showcase post")).toBeDefined();
    expect(screen.getByText("DMCA takedown — resource #88")).toBeDefined();
    // target-type pills render as data, not forked UI
    expect(screen.getByText("post")).toBeDefined();
    expect(screen.getByText("resource")).toBeDefined();
    // unclaimed → default Claim action in slot; claimed → claimer + lease
    expect(screen.getByRole("button", { name: "Claim" })).toBeDefined();
    expect(screen.getByText("editor_kim")).toBeDefined();
    expect(screen.getByText(/12m lease/)).toBeDefined();
  });

  it("renders the contract severity enum as §11.11 semantic tones (s0→error, s1–s3→info, legal→warning)", () => {
    render(
      <QueueBoard
        cases={[
          { ...cases[0], id: "a", severity: "s0_critical", statusLabel: "s0_critical" },
          { ...cases[0], id: "b", severity: "s1_high", statusLabel: "s1_high" },
          { ...cases[0], id: "c", severity: "s3_low", statusLabel: "s3_low" },
          { ...cases[0], id: "d", severity: "resolved", statusLabel: "resolved" },
          { ...cases[0], id: "e", severity: "legal", statusLabel: "legal" },
        ]}
      />,
    );
    // error tone for s0_critical
    expect(document.querySelector(".bg-feedback-error\\/10")).not.toBeNull();
    // info tone for both s1_high and s3_low (standard collapse)
    expect(document.querySelectorAll(".bg-feedback-info\\/10").length).toBe(2);
    // warning tone for legal
    expect(document.querySelector(".bg-feedback-warning\\/10")).not.toBeNull();
    // success tone for resolved
    expect(document.querySelector(".bg-feedback-success\\/10")).not.toBeNull();
  });

  it("action slots replace the default Claim; claim-conflict renders the warning banner", () => {
    render(
      <QueueBoard
        cases={[cases[0]]}
        claimConflict="Case claimed by another moderator — returned to queue"
        renderActions={(c) => <button type="button">Renew {c.id}</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Renew case-1" })).toBeDefined();
    expect(
      screen.getByText(/Case claimed by another moderator — returned to queue/),
    ).toBeDefined();
  });

  it("empty + loading states", () => {
    const { rerender } = render(<QueueBoard cases={[]} />);
    expect(screen.getByText("Queue empty")).toBeDefined();
    rerender(<QueueBoard cases={[]} loading />);
    expect(screen.queryByText("Queue empty")).toBeNull();
  });

  it("§11.8 hover/focus: interactive cards render the target link (§11.11 targetHref)", () => {
    const { container } = render(
      <QueueBoard
        cases={[
          {
            ...cases[1],
            targetHref: "/p/some-post",
          },
        ]}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/p/some-post");
    expect(link.textContent).toContain("DMCA takedown");
    // interactive card carries the hover affordance classes
    expect(container.querySelector(".hover\\:border-border-prominent")).not.toBeNull();
  });
});

describe("CommandPalette (§11.12 / shell contract §3 F)", () => {
  const sections = [
    {
      label: "Consoles",
      items: [
        { id: "config", label: "Config Console", onSelect: vi.fn(), keywords: ["/admin/config"] },
        { id: "roles", label: "Roles & Ops Coverage", onSelect: vi.fn(), keywords: ["/admin/roles"] },
      ],
    },
  ];

  it("open + authorized-results: renders pre-authorized items only", () => {
    render(<CommandPalette open onOpenChange={() => {}} sections={sections} />);
    expect(screen.getByRole("combobox")).toBeDefined();
    expect(screen.getByText("Config Console")).toBeDefined();
    expect(screen.getByText("Roles & Ops Coverage")).toBeDefined();
    expect(screen.getByText(/Enter open/)).toBeDefined();
  });

  it("no-match state filters to zero and shows the muted result", () => {
    render(<CommandPalette open onOpenChange={() => {}} sections={sections} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz-nothing" } });
    expect(screen.getByText("No results.")).toBeDefined();
    expect(screen.queryByText("Config Console")).toBeNull();
  });

  it("keyboard: ↓ moves active, Enter selects and closes", () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <CommandPalette
        open
        onOpenChange={onOpenChange}
        sections={[{ label: "Consoles", items: [{ id: "audit", label: "Audit Log Viewer", onSelect }] }]}
      />,
    );
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("§11.8 loading state: spinner while the catalog read resolves", () => {
    render(<CommandPalette open onOpenChange={() => {}} sections={[]} loading />);
    expect(screen.getByText("Loading…")).toBeDefined();
    expect(screen.queryByText("No commands")).toBeNull();
  });
});

describe("SearchableCombobox (§11.15)", () => {
  const options = [
    { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
    { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
    { value: "America/New_York", label: "America/New_York (EST)" },
  ];

  it("opens, filters by search, and commits a single selection", () => {
    const onChange = vi.fn();
    render(<SearchableCombobox options={options} value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.change(screen.getByLabelText("Filter options"), { target: { value: "berlin" } });
    expect(screen.getByRole("option", { name: /Berlin/ })).toBeDefined();
    expect(screen.queryByRole("option", { name: /Tokyo/ })).toBeNull();
    fireEvent.click(screen.getByRole("option", { name: /Berlin/ }));
    expect(onChange).toHaveBeenCalledWith("Europe/Berlin");
  });

  it("multi-select renders tags in the trigger with dismiss", () => {
    const onValuesChange = vi.fn();
    render(
      <SearchableCombobox
        options={options}
        multiple
        values={["Asia/Tokyo", "Europe/Berlin"]}
        onValuesChange={onValuesChange}
      />,
    );
    expect(screen.getByLabelText("Remove Asia/Tokyo (JST)")).toBeDefined();
    fireEvent.click(screen.getByLabelText("Remove Asia/Tokyo (JST)"));
    expect(onValuesChange).toHaveBeenCalledWith(["Europe/Berlin"]);
  });

  it("§11.8 error + loading states", () => {
    const { rerender } = render(
      <SearchableCombobox options={options} value="" error="Invalid timezone — a valid IANA zone is required (CAP-003)" />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Invalid timezone");
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");

    rerender(
      <div>
        <SearchableCombobox options={options} value="UTC" loading />
        {/* open the panel to see the loading state */}
      </div>,
    );
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Loading…")).toBeDefined();
  });
});

describe("DatetimePicker (§11.14)", () => {
  it("desktop trigger shows the mono value; error renders helper", () => {
    render(
      <DatetimePicker
        value="2026-09-01T14:30:00+09:00"
        error="Invalid timezone — a valid IANA zone is required (CAP-003)"
      />,
    );
    expect(screen.getByText(/2026-09-01 14:30/)).toBeDefined();
    expect(
      screen.getByText(/Invalid timezone — a valid IANA zone is required/),
    ).toBeDefined();
  });
});

describe("FileDropzone (§11.17)", () => {
  it("disabled-render: present but not actionable (contribute E3)", () => {
    render(<FileDropzone disabled statusMessage="off" />);
    expect(screen.getByRole("button", { name: /Upload a file/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("idle → files added renders chips with dismiss", () => {
    const onFileRemoved = vi.fn();
    render(
      <FileDropzone
        files={[{ id: "f1", name: "ledger-basics.pdf" }]}
        onFileRemoved={onFileRemoved}
      />,
    );
    fireEvent.click(screen.getByLabelText("Remove ledger-basics.pdf"));
    expect(onFileRemoved).toHaveBeenCalledWith("f1");
  });
});

describe("Interstitial (§11.19 / go-redirect contract)", () => {
  it("disclosure variant: explicit continue only — no auto-redirect chrome", () => {
    const onContinue = vi.fn();
    render(
      <Interstitial
        title="You're leaving Createconomy"
        merchantLine="destination: example-merchant.com"
        continueLabel="Continue to merchant"
        onContinue={onContinue}
        cancelLabel="Cancel"
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("You're leaving Createconomy")).toBeDefined();
    expect(screen.getByText(/example-merchant\.com/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Continue to merchant" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("dead-link and gate-fail are distinct non-primary states", () => {
    const { rerender } = render(
      <Interstitial variant="dead-link" notice="This link doesn't exist." title="Link unavailable" />,
    );
    expect(screen.getByRole("alert").textContent).toContain("This link doesn't exist.");

    rerender(
      <Interstitial
        variant="gate-fail"
        notice="Purchase link temporarily unavailable."
        title="Link unavailable"
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Purchase link temporarily unavailable.",
    );
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
  });
});

describe("EmptyState (§11.23)", () => {
  it("compact variant for tables/palette; honest empty — no fabricated counts", () => {
    render(<EmptyState compact icon={<span />} heading="No results" />);
    expect(screen.getByText("No results")).toBeDefined();
  });
});
