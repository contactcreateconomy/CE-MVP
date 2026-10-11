"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { CreateconomyLogoFull } from "@/components/ui/createconomy-logo-full";
import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";
import { useFeedMotion, usePrefersReducedMotion, type SpringFamily } from "@/lib/motion";
import { runThemeSwitch, themeSwitchVariant } from "@/lib/theme-transition";
import { cn } from "@/lib/utils";

interface LabFoundationClientProps {
  forcedTheme?: "light" | "dark";
  variantParam: string | null;
}

const VARIANT_LABEL = { iris: "Iris (?v=a)", horizon: "Horizon (?v=b)" } as const;

export function LabFoundationClient({ forcedTheme, variantParam }: LabFoundationClientProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const variant = themeSwitchVariant(variantParam);
  const m = useFeedMotion();
  const reducedMotion = usePrefersReducedMotion();
  const [replay, setReplay] = useState(0);
  // next-themes resolves the theme on the client only — label after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const themeLabel = !mounted ? "Theme" : resolvedTheme === "dark" ? "Dark" : "Light";

  // ?theme= applies once on load; re-running it (setTheme changes identity
  // when the theme changes) would undo every toggle.
  const forcedApplied = useRef(false);
  useEffect(() => {
    if (forcedTheme && !forcedApplied.current) {
      forcedApplied.current = true;
      setTheme(forcedTheme);
    }
  }, [forcedTheme, setTheme]);

  const toggleTheme = (e: MouseEvent<HTMLButtonElement>) => {
    const to = resolvedTheme === "dark" ? "light" : "dark";
    const rect = e.currentTarget.getBoundingClientRect();
    runThemeSwitch({
      variant,
      to,
      reducedMotion,
      origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      apply: () => {
        // The view transition snapshots right after this returns, so the
        // class must flip synchronously; next-themes then persists it.
        document.documentElement.classList.toggle("dark", to === "dark");
        document.documentElement.style.colorScheme = to;
        flushSync(() => setTheme(to));
      },
    });
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-heading-sm font-semibold text-text-primary">Foundation — /lab/foundation</h1>
          <p className="text-body-sm text-text-secondary">
            FEED-B1: frost, glow at rest, motion, logo, theme switch. Dev-only page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={toggleTheme} data-testid="theme-toggle">
            {themeLabel} → switch ({variant ? VARIANT_LABEL[variant] : "instant"})
          </Button>
          <a className="text-body-sm text-text-link underline" href="?v=a">Iris</a>
          <a className="text-body-sm text-text-link underline" href="?v=b">Horizon</a>
          <a className="text-body-sm text-text-link underline" href="?">Instant</a>
        </div>
      </header>
      <p className="mt-2 font-mono text-caption text-text-muted">
        reduced motion: {reducedMotion ? "on (crossfades only)" : "off"}
      </p>

      <Section title="Frost (L-39, L-40)" note="Real blur on chrome / hero / rail / sheets; feed cards get the look without live blur. Neutral: no colour bleed.">
        <div className="relative h-[420px] overflow-hidden rounded-lg border border-border-subtle">
          <div className="lab-glass-content absolute inset-0">
            {Array.from({ length: 10 }, (_, i) => (
              <p key={i}>Content scrolling under the frost — row {i + 1}. Colour behind should soften, not tint.</p>
            ))}
          </div>
          <div className="absolute inset-x-4 top-10 grid gap-3 sm:grid-cols-2">
            <Panel cls="frost-strong" label=".frost-strong" hint="menu island, hero, sheets" />
            <Panel cls="frost-subtle" label=".frost-subtle" hint="rail widgets, tab bar" />
            <Panel cls="frost-look" label=".frost-look" hint="feed cards — no live blur" />
            <Panel cls="glass-chrome" label=".glass-chrome (today)" hint="saturate 150% — compare the tint" />
          </div>
        </div>
      </Section>

      <Section title="Glow at rest (L-38)" note="Nothing glows at rest except the active indicator and keyboard focus. Hover / press the CTAs (dark only).">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Primary — hover me</Button>
          <button
            type="button"
            className="hover:glow-cta active:glow-active focus-ring inline-flex h-9 items-center rounded-full bg-brand-primary px-5 text-body-md font-semibold text-text-inverse transition-transform duration-normal hover:-translate-y-px"
          >
            + Start Discussion
          </button>
          <span className="glow-active inline-flex h-8 items-center rounded-full bg-brand-primary px-4 text-body-sm font-semibold text-text-inverse">
            Active tab
          </span>
          <input
            className="focus-ring h-9 rounded-md border border-border-default bg-bg-surface px-3 text-body-sm text-text-primary"
            placeholder="Tab here — focus ring"
          />
        </div>
      </Section>

      <Section title="Motion (§11.2)" note="Focus pull + 50ms stagger (glide). Press the three springs. Reduced motion → crossfades only.">
        <Button size="sm" variant="secondary" onClick={() => setReplay((r) => r + 1)}>
          Replay focus pull
        </Button>
        <motion.div
          key={replay}
          className="mt-4 grid gap-3 sm:grid-cols-4"
          variants={m.stagger}
          initial="hidden"
          animate="visible"
        >
          {["Identity", "Kind chip", "Title", "Why care now"].map((t) => (
            <motion.div key={t} variants={m.focusPull} className="frost-look rounded-lg border border-border-subtle p-4">
              <p className="text-label-md font-semibold text-text-primary">{t}</p>
              <p className="mt-1 text-body-xs text-text-secondary">sharpens into place</p>
            </motion.div>
          ))}
        </motion.div>
        <div className="mt-4 flex flex-wrap gap-3">
          {(Object.keys(m.springs) as SpringFamily[]).map((family) => (
            <motion.button
              key={family}
              type="button"
              whileTap={{ scale: reducedMotion ? 1 : 0.94, opacity: reducedMotion ? 0.7 : 1 }}
              transition={m.springs[family]}
              className="focus-ring h-10 rounded-full border border-border-default bg-bg-surface px-4 text-body-sm font-medium text-text-primary"
            >
              {family}
            </motion.button>
          ))}
        </div>
      </Section>

      <Section title="Logo (L-42)" note="Real transparent gaps; dark gaps ~15% wider. Replay the 3-segment reveal.">
        <Button size="sm" variant="secondary" onClick={() => setReplay((r) => r + 1)}>
          Replay reveal
        </Button>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <CreateconomyLogoMark key={`a${replay}`} size={96} reveal />
          <CreateconomyLogoMark size={48} />
          <CreateconomyLogoMark size={24} />
          <div className="lab-glass-content rounded-lg p-4!">
            <div className="frost-strong rounded-md p-3">
              <CreateconomyLogoMark size={48} markColor="var(--text-primary)" />
            </div>
          </div>
          <CreateconomyLogoFull markSize={32} />
        </div>
      </Section>

      <Section title="Theme switch (O-04)" note="Use the header button. Iris opens a circle from the button; Horizon: dark falls from the top, light rises from the bottom. Founder picks.">
        <p className="text-body-sm text-text-secondary">
          Current: <strong className="text-text-primary">{variant ? VARIANT_LABEL[variant] : "instant (no param)"}</strong>
        </p>
      </Section>
    </main>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-heading-xs font-semibold text-text-primary">{title}</h2>
      <p className="mb-4 mt-1 text-body-sm text-text-secondary">{note}</p>
      {children}
    </section>
  );
}

function Panel({ cls, label, hint }: { cls: string; label: string; hint: string }) {
  return (
    <div className={cn(cls, "rounded-lg border border-border-subtle p-4")}>
      <p className="font-mono text-label-md font-semibold text-text-primary">{label}</p>
      <p className="mt-1 text-body-xs text-text-secondary">{hint}</p>
    </div>
  );
}
