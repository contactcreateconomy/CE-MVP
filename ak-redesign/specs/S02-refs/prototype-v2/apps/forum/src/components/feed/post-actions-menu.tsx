"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface PostActionsMenuProps {
  onShare: () => void;
  onHide: () => void;
  onReport: () => void;
}

export function PostActionsMenu({ onShare, onHide, onReport }: PostActionsMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-(--text-secondary) transition-colors duration-200 hover:bg-(--bg-overlay) hover:text-(--text-primary)"
          aria-label="Post actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[170px] rounded-[12px] border border-(--border-default) bg-(--bg-surface) p-1 shadow-(--shadow-lg)"
        >
          <DropdownMenu.Item
            onSelect={onShare}
            className="cursor-pointer rounded-[8px] px-2 py-2 text-sm text-(--text-primary) outline-hidden transition-colors data-highlighted:bg-(--bg-overlay)"
          >
            Share
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onHide}
            className="cursor-pointer rounded-[8px] px-2 py-2 text-sm text-(--text-primary) outline-hidden transition-colors data-highlighted:bg-(--bg-overlay)"
          >
            Hide
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onReport}
            className="cursor-pointer rounded-[8px] px-2 py-2 text-sm text-(--feedback-error) outline-hidden transition-colors data-highlighted:bg-(--bg-overlay)"
          >
            Report
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
