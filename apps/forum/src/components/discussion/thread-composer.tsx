"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useMutation } from "convex/react";
import { Bold, Code, Italic, Link as LinkIcon, Loader2, MoreHorizontal, X } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@cemvp/auth-ui";
import { api, type Id } from "@/lib/convex";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";
import type { User } from "@/types";

import { getCategoryTemplate } from "./categories/registry";

function mockUserForComposer(authUser: { id: string; name: string; handle: string; avatar?: string } | null): User | null {
  if (!authUser) return null;
  return {
    id: authUser.id,
    name: authUser.name,
    handle: authUser.handle,
    avatar: authUser.avatar ?? "",
    bio: "",
    level: 4,
    points: 5000,
    streakDays: 1,
    role: "member",
  };
}

interface ThreadComposerProps {
  thread: DiscussionThread;
  placeholder?: string;
  onSubmit?: () => void;
  compact?: boolean;
  /** Top-level composer: controlled by parent (thread discussion context) */
  mainValue?: string;
  onMainValueChange?: (value: string | ((prev: string) => string)) => void;
  /** For inline replies — the parent comment id to nest under */
  parentId?: string;
}

export function ThreadComposer({
  thread,
  placeholder = "Add to the discussion…",
  onSubmit,
  compact,
  mainValue,
  onMainValueChange,
  parentId,
}: ThreadComposerProps) {
  const { user: authUser, authStatus, openAuthModal } = useAuth();
  const [localText, setLocalText] = useState("");
  const [dismissNudge, setDismissNudge] = useState(false);
  const [focused, setFocused] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createComment = useMutation(api.forum.mutations.createComment);

  const isMainControlled = mainValue !== undefined && onMainValueChange !== undefined;
  const text = isMainControlled ? mainValue : localText;
  const setText = isMainControlled ? onMainValueChange : setLocalText;

  const [submitting, setSubmitting] = useState(false);

  const mockUser = mockUserForComposer(authStatus === "authenticated" && authUser ? { ...authUser, id: authUser.id } : null);
  const u =
    mockUser ??
    ({
      id: "guest",
      name: "Guest",
      handle: "guest",
      avatar: "",
      bio: "",
      level: 1,
      points: 0,
      streakDays: 0,
      role: "member" as const,
    } satisfies User);

  const nudgeText = getCategoryTemplate(thread.category)?.nudge;
  const showNudge = text.trim().length >= 20 && !dismissNudge && !compact;

  const insert = useCallback(
    (wrap: string) => {
      setText((t) => `${typeof t === "string" ? t : ""}${wrap}`);
    },
    [setText],
  );

  const submit = async () => {
    const body = (typeof text === "string" ? text : "").trim();
    if (!body) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createComment({
        postId: (thread.postId ?? thread.id) as Id<"forumPosts">,
        body,
        ...(parentId ? { parentId: parentId as Id<"forumPostComments"> } : {}),
      });
      setText(() => "");
      onSubmit?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to post reply. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Not logged in: show login prompt
  if (authStatus !== "authenticated") {
    return (
      <div className="rounded-xl border border-(--border-default) bg-(--bg-surface) p-4 text-center">
        <p className="text-sm text-(--text-secondary)">Join the conversation.</p>
        <Button
          type="button"
          className="mt-3 rounded-full"
          onClick={() => openAuthModal("login")}
        >
          Login to reply
        </Button>
      </div>
    );
  }

  const toolbarActions = (
    <>
      <ToolbarIcon label="Bold" onClick={() => insert("**bold**")}>
        <Bold className="h-3.5 w-3.5" />
      </ToolbarIcon>
      <ToolbarIcon label="Italic" onClick={() => insert("_italic_")}>
        <Italic className="h-3.5 w-3.5" />
      </ToolbarIcon>
      <ToolbarIcon label="Code" onClick={() => insert("`code`")}>
        <Code className="h-3.5 w-3.5" />
      </ToolbarIcon>
      <ToolbarIcon label="Code block" onClick={() => insert("\n```\ncode\n```\n")}>
        <span className="text-micro font-mono">{"{}"}</span>
      </ToolbarIcon>
      <ToolbarIcon label="Link" onClick={() => insert("[text](url)")}>
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarIcon>
    </>
  );

  return (
    <div
      id={isMainControlled ? "thread-main-composer" : undefined}
      className={cn(compact ? "space-y-2" : "space-y-3")}
    >
      <div className="flex items-start gap-3 rounded-xl border border-(--border-default) bg-(--bg-surface) p-3">
        <UserAvatar user={u} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <textarea
            id={isMainControlled ? "main-composer-textarea" : undefined}
            value={text}
            onChange={(e) => { setText(e.target.value); setSubmitError(null); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            rows={compact ? 3 : focused ? 5 : 3}
            className="min-h-[80px] w-full resize-y rounded-lg bg-transparent px-1 py-1 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-hidden transition-[min-height] duration-normal"
          />
          {focused || text.trim() ? (
            <div className="flex flex-wrap items-center gap-1 border-t border-(--border-subtle) pt-2">
              <div className="hidden items-center gap-1 md:flex">{toolbarActions}</div>
              <div className="flex md:hidden">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-(--text-muted) hover:bg-(--bg-overlay)"
                      aria-label="Formatting"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="start"
                      className="z-dropdown min-w-45 rounded-menu border border-border-default bg-bg-surface p-1 shadow-lg"
                    >
                      <DropdownMenu.Item
                        className="cursor-pointer rounded-menu-item px-2.5 py-2 text-sm text-text-primary outline-hidden transition-colors duration-normal ease-out-cubic data-highlighted:bg-bg-overlay"
                        onSelect={() => insert("**bold**")}
                      >
                        Bold
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="cursor-pointer rounded-menu-item px-2.5 py-2 text-sm text-text-primary outline-hidden transition-colors duration-normal ease-out-cubic data-highlighted:bg-bg-overlay"
                        onSelect={() => insert("_italic_")}
                      >
                        Italic
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="cursor-pointer rounded-menu-item px-2.5 py-2 text-sm text-text-primary outline-hidden transition-colors duration-normal ease-out-cubic data-highlighted:bg-bg-overlay"
                        onSelect={() => insert("`code`")}
                      >
                        Inline code
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="cursor-pointer rounded-menu-item px-2.5 py-2 text-sm text-text-primary outline-hidden transition-colors duration-normal ease-out-cubic data-highlighted:bg-bg-overlay"
                        onSelect={() => insert("\n```\ncode\n```\n")}
                      >
                        Code block
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="cursor-pointer rounded-menu-item px-2.5 py-2 text-sm text-text-primary outline-hidden transition-colors duration-normal ease-out-cubic data-highlighted:bg-bg-overlay"
                        onSelect={() => insert("[text](url)")}
                      >
                        Link
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
              <Button
                type="button"
                size="sm"
                className="ml-auto rounded-full"
                disabled={!text.trim() || submitting}
                onClick={submit}
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Reply
              </Button>
            </div>
          ) : null}
          {submitError ? (
            <p className="text-xs text-(--feedback-error)">{submitError}</p>
          ) : null}
        </div>
      </div>
      {showNudge ? (
        <div className="flex items-start gap-2 rounded-xl border border-(--border-default) bg-(--bg-inset) p-3 text-sm text-(--text-secondary)">
          <p className="flex-1">{nudgeText}</p>
          <button type="button" className="text-(--text-muted) hover:text-(--text-primary)" aria-label="Dismiss" onClick={() => setDismissNudge(true)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ToolbarIcon({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-(--text-muted) hover:bg-(--bg-overlay) hover:text-(--text-primary)"
    >
      {children}
    </button>
  );
}
