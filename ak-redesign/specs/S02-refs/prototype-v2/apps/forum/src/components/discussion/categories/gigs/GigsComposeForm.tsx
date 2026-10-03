"use client";

import { Briefcase, MapPin, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface GigsFields {
  roleTitle: string;
  employment: string;
  location: string;
  budget: string;
  duration: string;
  requiredSkills: string[];
  preferredSkills: string[];
  posterNote: string;
}

const EMPLOYMENT_OPTIONS = ["full-time", "part-time", "contract", "freelance"] as const;
const LOCATION_OPTIONS = ["remote", "hybrid", "on-site"] as const;

export function GigsComposeForm({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (fields: Record<string, unknown>) => void;
}) {
  const fields: GigsFields = useMemo(() => ({
    roleTitle: (value.roleTitle as string) ?? "",
    employment: (value.employment as string) ?? "full-time",
    location: (value.location as string) ?? "remote",
    budget: (value.budget as string) ?? "",
    duration: (value.duration as string) ?? "",
    requiredSkills: (value.requiredSkills as string[]) ?? [],
    preferredSkills: (value.preferredSkills as string[]) ?? [],
    posterNote: (value.posterNote as string) ?? "",
  }), [value]);

  const skillInputRef = useRef<HTMLInputElement>(null);
  const prefSkillInputRef = useRef<HTMLInputElement>(null);
  const [skillInput, setSkillInput] = useState("");
  const [prefSkillInput, setPrefSkillInput] = useState("");

  const emit = useCallback(
    (patch: Partial<GigsFields>) => {
      onChange({
        ...fields,
        ...patch,
        // Auto-generated defaults for new gigs posts
        isOpen: true,
        applicantCount: 0,
        processStage: "applied",
        stages: ["Applied", "Screening", "Interview", "Offer"],
      });
    },
    [fields, onChange],
  );

  const addSkill = useCallback(() => {
    const s = skillInput.trim();
    if (!s || fields.requiredSkills.includes(s)) return;
    emit({ requiredSkills: [...fields.requiredSkills, s] });
    setSkillInput("");
    skillInputRef.current?.focus();
  }, [emit, fields.requiredSkills, skillInput]);

  const removeSkill = useCallback(
    (s: string) => {
      emit({ requiredSkills: fields.requiredSkills.filter((sk) => sk !== s) });
    },
    [emit, fields.requiredSkills],
  );

  const addPrefSkill = useCallback(() => {
    const s = prefSkillInput.trim();
    if (!s || fields.preferredSkills.includes(s)) return;
    emit({ preferredSkills: [...fields.preferredSkills, s] });
    setPrefSkillInput("");
    prefSkillInputRef.current?.focus();
  }, [emit, fields.preferredSkills, prefSkillInput]);

  const removePrefSkill = useCallback(
    (s: string) => {
      emit({ preferredSkills: fields.preferredSkills.filter((sk) => sk !== s) });
    },
    [emit, fields.preferredSkills],
  );

  return (
    <div className="grid gap-3">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Role title <span className="text-(--feedback-error)">*</span>
        </label>
        <input
          type="text"
          value={fields.roleTitle}
          onChange={(e) => emit({ roleTitle: e.target.value })}
          placeholder="e.g. Senior React Developer"
          className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
            Employment type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => emit({ employment: opt })}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  fields.employment === opt
                    ? "border-(--brand-primary) bg-(--brand-primary)/15 text-(--brand-primary)"
                    : "border-(--border-default) text-(--text-secondary) hover:bg-(--bg-overlay)",
                )}
              >
                <Briefcase className="h-3 w-3" />
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
            Location
          </label>
          <div className="flex flex-wrap gap-1.5">
            {LOCATION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => emit({ location: opt })}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  fields.location === opt
                    ? "border-(--brand-primary) bg-(--brand-primary)/15 text-(--brand-primary)"
                    : "border-(--border-default) text-(--text-secondary) hover:bg-(--bg-overlay)",
                )}
              >
                <MapPin className="h-3 w-3" />
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
            Budget (optional)
          </label>
          <input
            type="text"
            value={fields.budget}
            onChange={(e) => emit({ budget: e.target.value })}
            placeholder="e.g. $5k/month"
            className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
            Duration (optional)
          </label>
          <input
            type="text"
            value={fields.duration}
            onChange={(e) => emit({ duration: e.target.value })}
            placeholder="e.g. 3 months, Ongoing"
            className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Required skills
        </label>
        <div className="flex flex-wrap gap-1.5">
          {fields.requiredSkills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-(--brand-primary)/15 px-2.5 py-1 text-xs font-medium text-(--text-primary)"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                className="ml-0.5 rounded-full p-0.5 text-(--text-muted) transition-colors hover:bg-(--bg-overlay) hover:text-(--text-primary)"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <input
            ref={skillInputRef}
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="Type a skill, press Enter"
            className="flex-1 rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-1.5 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Preferred skills (optional)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {fields.preferredSkills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full border border-(--border-default) px-2.5 py-1 text-xs text-(--text-secondary)"
            >
              {s}
              <button
                type="button"
                onClick={() => removePrefSkill(s)}
                className="ml-0.5 rounded-full p-0.5 text-(--text-muted) transition-colors hover:bg-(--bg-overlay) hover:text-(--text-primary)"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <input
            ref={prefSkillInputRef}
            type="text"
            value={prefSkillInput}
            onChange={(e) => setPrefSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPrefSkill();
              }
            }}
            placeholder="Type a skill, press Enter"
            className="flex-1 rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-1.5 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Note from you (optional)
        </label>
        <textarea
          value={fields.posterNote}
          onChange={(e) => emit({ posterNote: e.target.value })}
          placeholder="A personal note to potential applicants..."
          rows={2}
          className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active) resize-none"
        />
      </div>
    </div>
  );
}
