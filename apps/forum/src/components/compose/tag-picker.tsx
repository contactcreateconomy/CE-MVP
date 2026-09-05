"use client";

/**
 * TagPicker — SLICE-P4-03 (CAP-530/534) composer tag picker.
 *
 * CONTRACT-2-compose §4 Action 7 (quoted): "Select-from-taxonomy control,
 * not free text: the picker is constrained to the controlled `tags`
 * taxonomy exposed by CAP-534 (admin-editable reference list) — members
 * select from the list; they cannot invent tags."
 *
 * Options come from `api.tags.listTaxonomy` (CAP-534, active entries,
 * sortOrder). Selection state is CONTROLLED by the parent — call
 * `api.tags.setPostTags({ postId, tagIds })` (CAP-530) when the post id
 * exists: during compose after `posts.create` returns, during edit on save.
 * Edit prefill: seed `selectedTagIds` from `api.tags.getPostTags`.
 *
 * The taxonomy `color` field is carried in the payload but not rendered —
 * chips use named tokens only (STYLE-KIT discipline); admin-set hex values
 * are data, not design tokens, and are not injected as styles.
 */

import { useQuery } from "convex/react";
import { Check } from "lucide-react";

import { api } from "@/lib/convex";
import { cn } from "@/lib/utils";
import { isConvexConfigured } from "@cemvp/convex-client";

export interface TagPickerProps {
  /** Currently selected tag ids (postTags join targets). */
  selectedTagIds: string[];
  /** Toggle one taxonomy entry in the selection. */
  onToggleTag: (tagId: string) => void;
  disabled?: boolean;
}

export function TagPicker({ selectedTagIds, onToggleTag, disabled }: TagPickerProps) {
  const taxonomy = useQuery(api.tags.listTaxonomy);

  if (!isConvexConfigured()) return null;

  if (taxonomy === undefined) {
    return <p className="text-sm text-(--text-muted)">Loading tags…</p>;
  }

  if (taxonomy.length === 0) {
    return <p className="text-sm text-(--text-muted)">No tags available yet.</p>;
  }

  const selected = new Set(selectedTagIds);

  return (
    <div role="group" aria-label="Post tags" className="flex flex-wrap gap-1.5">
      {taxonomy.map((tag: any) => /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        const isSelected = selected.has(tag._id);
        return (
          <button
            key={tag._id}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onToggleTag(tag._id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors duration-normal ease-out-cubic",
              "outline-offset-2 focus-visible:ring-2 focus-visible:ring-(--border-active)",
              isSelected
                ? "border-(--border-active) bg-(--bg-overlay) text-(--brand-primary)"
                : "border-(--border-default) bg-(--bg-surface-elevated) text-(--text-secondary) hover:border-(--border-prominent) hover:bg-(--bg-overlay) hover:text-(--text-primary)",
              disabled && "cursor-not-allowed opacity-40",
            )}
          >
            {tag.name}
            {isSelected ? <Check className="size-3" aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}
