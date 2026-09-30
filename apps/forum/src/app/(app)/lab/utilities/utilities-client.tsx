"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LabUtilitiesClient() {
  const { setTheme, resolvedTheme } = useTheme();
  const [celebrateKey, setCelebrateKey] = React.useState(0);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-(--text-primary)">Utilities — /lab/utilities</h1>
          <p className="text-sm text-(--text-secondary)">
            Every S00-T03 utility in both themes, side by side. Dev-only page.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          Page theme: {resolvedTheme === "dark" ? "Dark" : "Light"} — toggle
        </Button>
      </header>

      <p className="mt-3 rounded-md border border-(--border-default) bg-(--bg-inset) p-3 text-xs text-(--text-secondary)">
        Each row renders twice: the <strong>forced-dark panel</strong> (a nested{" "}
        <code>.dark</code> scope) and the <strong>page-theme panel</strong> (flip it with the toggle
        above). Glow is a dark-theme material — in the light theme only <code>.focus-ring</code>{" "}
        shows (its solid ring); that is by design (D-007).
      </p>

      <div className="mt-6 space-y-8">
        <Row title=".glow-cta — primary CTA (max one per screen)">
          {(cls) => (
            <Button data-testid="glow-cta-demo" className={cn("glow-cta", cls)}>
              Primary CTA
            </Button>
          )}
        </Row>

        <Row title=".glow-active — active tab / nav item">
          {(cls) => (
            <div
              data-testid="glow-active-demo"
              className={cn(
                "glow-active inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-(--text-primary)",
                cls,
              )}
            >
              ● Active tab
            </div>
          )}
        </Row>

        <Row title=".focus-ring — keyboard focus only (Tab into the button)">
          {(cls) => (
            <Button data-testid="focus-ring-demo" variant="secondary" className={cn("focus-ring", cls)}>
              Tab to me
            </Button>
          )}
        </Row>

        <Row title=".glow-celebrate — one-shot 600 ms (click Restart to re-fire)">
          {(cls) => (
            <div className={cn("flex items-center gap-3", cls)}>
              <span
                key={celebrateKey}
                data-testid="glow-celebrate-demo"
                className="glow-celebrate inline-flex h-12 w-12 items-center justify-center rounded-full bg-(--brand-primary) text-sm font-semibold text-(--text-inverse)"
              >
                ★
              </span>
              <Button size="sm" variant="secondary" onClick={() => setCelebrateKey((k) => k + 1)}>
                Restart
              </Button>
            </div>
          )}
        </Row>

        <Row title=".pulse-live — live state only, 2000 ms pulse">
          {(cls) => (
            <div
              data-testid="pulse-live-demo"
              className={cn(
                "pulse-live inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-(--text-primary)",
                cls,
              )}
            >
              <span className="h-2 w-2 rounded-full bg-(--brand-primary)" /> Live now
            </div>
          )}
        </Row>

        <Row title=".glass-chrome — subtle glass over content" glass>
          {(cls) => <GlassDemo cls={cls} testId="glass-chrome-demo" utility="glass-chrome" label="glass-chrome bar" />}
        </Row>

        <Row title=".glass-strong — strong glass (spec exceptions only)" glass>
          {(cls) => <GlassDemo cls={cls} testId="glass-strong-demo" utility="glass-strong" label="glass-strong panel" />}
        </Row>

        <Row title="safe-area helpers — .pt-safe/.pb-safe/.pl-safe/.pr-safe">
          {() => <SafeAreaViz />}
        </Row>
      </div>
    </main>
  );
}

/** One demo row: forced-dark panel + page-theme panel side by side (stacked at narrow). */
function Row({
  title,
  glass = false,
  children,
}: {
  title: string;
  glass?: boolean;
  children: (panelClass: string) => React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-(--text-primary)">{title}</h2>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div
          data-panel="forced-dark"
          className={cn(
            "rounded-lg border border-(--border-subtle) bg-(--bg-canvas) p-4 dark",
            glass && "lab-glass-backdrop",
          )}
        >
          {children("border-transparent")}
        </div>
        <div
          data-panel="page-theme"
          className={cn(
            "rounded-lg border border-(--border-subtle) bg-(--bg-canvas) p-4",
            glass && "lab-glass-backdrop",
          )}
        >
          {children("border-transparent")}
        </div>
      </div>
    </section>
  );
}

/** Glass bar laid over a vivid gradient so the blur reads on screen. */
function GlassDemo({ cls, testId, utility, label }: { cls: string; testId: string; utility: string; label: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md", cls)}>
      <div
        aria-hidden
        className="lab-glass-underlay absolute inset-0"
      />
      <div
        data-testid={testId}
        className={cn(
          utility,
          "relative m-6 flex h-16 items-center justify-center rounded-lg border border-(--glass-border) text-sm font-medium text-(--text-primary)",
        )}
      >
        {label}
      </div>
    </div>
  );
}

/** env() inset strips, with the computed values read out. */
function SafeAreaViz() {
  const [env, setEnv] = React.useState({ top: "…", bottom: "…", left: "…", right: "…" });
  React.useEffect(() => {
    const probe = document.getElementById("lab-safe-probe");
    if (!probe) return;
    const cs = getComputedStyle(probe);
    setEnv({ top: cs.paddingTop, bottom: cs.paddingBottom, left: cs.paddingLeft, right: cs.paddingRight });
  }, []);
  return (
    <div className="space-y-2">
      <div
        id="lab-safe-probe"
        data-testid="safe-probe"
        className="pt-safe pb-safe pl-safe pr-safe rounded-lg bg-(--bg-inset) text-xs text-(--text-secondary)"
      >
        <div className="rounded border border-dashed border-(--brand-primary) px-2 py-3 text-center">
          content box (dashed edge = safe boundary; insets are the padding around it)
        </div>
      </div>
      <p className="text-xs text-(--text-secondary)">
        computed: top {env.top} · bottom {env.bottom} · left {env.left} · right {env.right} (0px on
        non-notched viewports; env() resolves per device)
      </p>
    </div>
  );
}
