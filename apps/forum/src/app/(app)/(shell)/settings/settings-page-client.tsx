"use client";

import { useMutation, useQuery } from "convex/react";
import { Settings } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-md border border-(--border-default) bg-(--bg-surface) p-3 text-left transition-colors hover:border-(--border-active) disabled:opacity-50"
    >
      <div>
        <p className="text-sm font-semibold text-(--text-primary)">{label}</p>
        {description && <p className="mt-0.5 text-xs text-(--text-muted)">{description}</p>}
      </div>
      <div
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-normal",
          checked ? "bg-(--brand-primary)" : "bg-(--border-default)",
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-normal",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </div>
    </button>
  );
}

function ThemeSelector({
  value,
  onChange,
}: {
  value: "dark" | "light" | "system";
  onChange: (val: "dark" | "light" | "system") => void;
}) {
  const options: { key: "dark" | "light" | "system"; label: string }[] = [
    { key: "dark", label: "Dark" },
    { key: "light", label: "Light" },
    { key: "system", label: "System" },
  ];
  return (
    <div className="flex gap-1 rounded-full border border-(--border-default) bg-(--bg-surface) p-1">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            value === opt.key
              ? "bg-(--brand-primary) text-white"
              : "text-(--text-secondary) hover:text-(--text-primary)",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SettingsPageWithConvex() {
  const settings = useQuery(api.forum.queries.getViewerSettings, {});
  const updateSettings = useMutation(api.forum.mutations.updateViewerSettings);

  const handleToggle = useCallback(
    (field: "emailNotifications" | "pushNotifications" | "hideMatureContent", value: boolean) => {
      void updateSettings({ [field]: value });
    },
    [updateSettings],
  );

  const handleTheme = useCallback(
    (theme: "dark" | "light" | "system") => {
      void updateSettings({ theme });
    },
    [updateSettings],
  );

  if (settings === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
      </div>
    );
  }

  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-(--text-primary)">
            <Settings className="h-5 w-5" /> Settings
          </h1>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-(--text-primary)">Theme</p>
            <ThemeSelector value={settings.theme} onChange={handleTheme} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-(--text-primary)">Notifications</p>
            <Toggle
              label="Email notifications"
              description="Receive email alerts for new comments and upvotes"
              checked={settings.emailNotifications}
              onChange={(v) => handleToggle("emailNotifications", v)}
            />
            <Toggle
              label="Push notifications"
              description="Browser push notifications for real-time activity"
              checked={settings.pushNotifications}
              onChange={(v) => handleToggle("pushNotifications", v)}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-(--text-primary)">Content</p>
            <Toggle
              label="Hide mature content"
              description="Filter out posts flagged as mature or sensitive"
              checked={settings.hideMatureContent}
              onChange={(v) => handleToggle("hideMatureContent", v)}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function SettingsPageClient() {
  if (!isConvexConfigured()) {
    return (
      <p className="text-sm text-(--text-muted)">
        Connect Convex to load settings.
      </p>
    );
  }

  return <SettingsPageWithConvex />;
}
