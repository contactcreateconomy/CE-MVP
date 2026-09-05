"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, Bookmark, MessageSquare, Video, HelpCircle, UserPlus, UserCheck, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtCount, avatarBg } from "@/lib/format";
import { NetworkAvatarCard } from "@/components/ui/network-hover-card";
import { AIKeyTakeaways } from "./ai-key-takeaways";
import type { SeedThread } from "@/app/(app)/(content)/content/_seed";

interface PostBlockProps {
  thread: SeedThread;
  mode?: "max" | "minimal";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function InlineMarkdown({ text }: { text: string }) {
  // Process inline formatting: **bold**, *italic*, `code`, [link](url)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-[var(--text-primary)]">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] text-[var(--brand-primary)] text-fine font-mono">
              {part.slice(1, -1)}
            </code>
          );
        }
        // Match link groups from the regex capture groups
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function RichBody({ body }: { body: string }) {
  const lines = body.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Heading: **The Setup:** style (bold label followed by colon)
    if (/^\*\*[^*]+\*\*:?\s*$/.test(line.trim())) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-[var(--text-primary)] mt-5 mb-2">
          <InlineMarkdown text={line.replace(/:$/, "")} />
        </h3>
      );
      i++;
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i]?.trim() ?? "")) {
        items.push(lines[i].trim());
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1.5 pl-2 text-sm text-[var(--text-secondary)] leading-relaxed">
          {items.map((item, j) => (
            <li key={j}><InlineMarkdown text={item.replace(/^\d+\.\s/, "")} /></li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list item (- or *)
    if (/^[-*]\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i]?.trim() ?? "")) {
        items.push(lines[i].trim());
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1.5 pl-2 text-sm text-[var(--text-secondary)] leading-relaxed">
          {items.map((item, j) => (
            <li key={j}><InlineMarkdown text={item.replace(/^[-*]\s/, "")} /></li>
          ))}
        </ul>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed">
        <InlineMarkdown text={line} />
      </p>
    );
    i++;
  }

  return (
    <div className="space-y-2">
      {elements}
    </div>
  );
}

export function PostBlock({ thread, mode = "max" }: PostBlockProps) {
  const { author, stats } = thread;
  const isMinimal = mode === "minimal";
  const [isJoined, setIsJoined] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [notifyHovered, setNotifyHovered] = useState(false);

  const handleJoinClick = useCallback(() => {
    if (isJoined) {
      setIsJoined(false);
      setIsNotifying(false);
      setShowNotify(false);
    } else {
      setIsJoined(true);
      setShowNotify(true);
    }
  }, [isJoined]);

  useEffect(() => {
    if (!showNotify || isNotifying) return;
    const timer = setTimeout(() => setShowNotify(false), 4000);
    return () => clearTimeout(timer);
  }, [showNotify, isNotifying]);

  return (
    <div className="card-surface rounded-xl">
      <div className="px-6 py-6">
        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
          {thread.title}
        </h1>

        {/* Author row */}
        <div className="mt-4 flex items-center gap-4 min-w-0">
          {/* Left: profile section */}
          <div className="flex items-center gap-3.5 min-w-0">
            <NetworkAvatarCard
              authorInitials={author.initials}
              authorBgClass={avatarBg(author.id)}
              networkName="Social School"
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base font-semibold text-[var(--text-primary)]">{author.name}</span>
                {!isMinimal && (
                  <>
                    <span className="text-sm text-[var(--text-muted)]">{author.handle}</span>
                    {author.verified && (
                      <span className="text-label-sm font-medium px-2 py-0.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
                        Verified
                      </span>
                    )}
                    {author.badges.map((b) => (
                      <span
                        key={b}
                        className="text-label-sm px-2 py-0.5 rounded-full bg-[var(--bg-overlay)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                      >
                        {b}
                      </span>
                    ))}
                    {author.location && (
                      <span className="text-label-sm text-[var(--text-muted)]">{author.location}</span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[var(--text-muted)]">Social School</span>
                <span className="text-xs text-[var(--text-muted)]">·</span>
                <span className="text-xs text-[var(--text-muted)]">{fmtDate(thread.publishedAt)}</span>
                {!isMinimal && thread.updatedAt !== thread.publishedAt && (
                  <span className="text-xs text-[var(--text-muted)]">· Updated {fmtDate(thread.updatedAt)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="self-stretch w-px bg-[var(--border-subtle)] shrink-0" />

          {/* Right: CTA actions */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            onMouseEnter={() => { if (isJoined) setNotifyHovered(true); }}
            onMouseLeave={() => setNotifyHovered(false)}
          >
            <motion.button
              type="button"
              onClick={handleJoinClick}
              whileTap={{ scale: 0.95 }}
              animate={isJoined ? { scale: [1, 1.08, 1] } : {}}
              transition={isJoined ? { duration: 0.35 } : {}}
              style={{
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor: "var(--brand-primary)",
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-base font-semibold transition-all duration-normal cursor-pointer bg-transparent",
                isJoined
                  ? "text-[var(--brand-primary)] shadow-[0_0_8px_var(--brand-primary)/30]"
                  : "text-[var(--brand-primary)] hover:shadow-[0_0_12px_var(--brand-primary)/25]"
              )}
            >
              {isJoined ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isJoined ? "Joined" : "Join"}
            </motion.button>

            <AnimatePresence mode="popLayout">
              {isJoined && showNotify && !isNotifying && (
                <motion.button
                  key="notify-prompt"
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => { setIsNotifying(true); setShowNotify(false); }}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer"
                >
                  <Bell className="h-3 w-3" />
                  Get notified
                </motion.button>
              )}

              {isJoined && notifyHovered && !showNotify && (
                <motion.button
                  key="notify-toggle"
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setIsNotifying(v => !v)}
                  className={cn(
                    "flex items-center justify-center rounded-full h-7 w-7 transition-colors cursor-pointer border",
                    isNotifying
                      ? "border-[var(--brand-primary)]/30 text-[var(--brand-primary)]"
                      : "border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                  )}
                >
                  {isNotifying ? <Bell className="h-3 w-3 fill-current" /> : <BellOff className="h-3 w-3" />}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-4 mb-4 h-px bg-[var(--border-subtle)]" />

        {/* Body */}
        <RichBody body={thread.body} />

        {/* Tags */}
        {!isMinimal && thread.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {thread.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* AI Key Takeaways */}
        {!isMinimal && thread.aiTakeaways.length > 0 && (
          <div className="mt-5">
            <AIKeyTakeaways takeaways={thread.aiTakeaways} />
          </div>
        )}

        {/* Creator CTAs — max mode only */}
        {!isMinimal && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors">
              <HelpCircle className="h-3.5 w-3.5" />
              Ask a Question
            </button>
            {thread.liveSession && (
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] transition-colors">
                <Video className="h-3.5 w-3.5" />
                Live Session
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
