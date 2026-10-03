"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface QaFields {
  goal: string;
  environment: string[];
  tried: string;
}

export function QaComposeForm({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (fields: Record<string, unknown>) => void;
}) {
  const fields: QaFields = useMemo(() => ({
    goal: (value.goal as string) ?? "",
    environment: (value.environment as string[]) ?? [],
    tried: (value.tried as string) ?? "",
  }), [value]);

  const envInputRef = useRef<HTMLInputElement>(null);
  const [envInput, setEnvInput] = useState("");

  const emit = useCallback(
    (patch: Partial<QaFields>) => {
      onChange({ ...fields, ...patch });
    },
    [fields, onChange],
  );

  const addEnv = useCallback(() => {
    const s = envInput.trim();
    if (!s || fields.environment.includes(s)) return;
    emit({ environment: [...fields.environment, s] });
    setEnvInput("");
    envInputRef.current?.focus();
  }, [emit, fields.environment, envInput]);

  const removeEnv = useCallback(
    (s: string) => {
      emit({ environment: fields.environment.filter((e) => e !== s) });
    },
    [emit, fields.environment],
  );

  return (
    <div className="grid gap-3">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          What are you trying to achieve?
        </label>
        <textarea
          value={fields.goal}
          onChange={(e) => emit({ goal: e.target.value })}
          placeholder="e.g. Set up OAuth2 authentication with Google provider"
          rows={2}
          className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Environment
        </label>
        <div className="flex flex-wrap gap-1.5">
          {fields.environment.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-(--brand-primary)/15 px-2.5 py-1 text-xs font-medium text-(--text-primary)"
            >
              {s}
              <button
                type="button"
                onClick={() => removeEnv(s)}
                className="ml-0.5 rounded-full p-0.5 text-(--text-muted) transition-colors hover:bg-(--bg-overlay) hover:text-(--text-primary)"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <input
            ref={envInputRef}
            type="text"
            value={envInput}
            onChange={(e) => setEnvInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEnv();
              }
            }}
            placeholder="e.g. Node 20, React 19, Ubuntu 24 — press Enter"
            className={cn(
              "flex-1 rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-1.5 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)",
            )}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          What have you already tried?
        </label>
        <textarea
          value={fields.tried}
          onChange={(e) => emit({ tried: e.target.value })}
          placeholder="e.g. Checked docs, ran npm install, cleared cache..."
          rows={2}
          className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
        />
      </div>
    </div>
  );
}
