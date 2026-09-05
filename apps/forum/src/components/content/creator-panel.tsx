"use client";

import { useState } from "react";
import { ShoppingBag, Calendar, Star, UserPlus, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtCount, avatarBg } from "@/lib/format";
import type { SeedAuthor, SeedProduct } from "@/app/(app)/(content)/content/_seed";

interface CreatorPanelProps {
  author: SeedAuthor;
  products: SeedProduct[];
  liveSession?: { title: string; scheduledAt: string; attendees: number };
  mode: "max" | "minimal";
  onToast?: (msg: string) => void;
}

function fmtSessionAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CreatorPanel({ author, products, liveSession, mode, onToast }: CreatorPanelProps) {
  const [reminded, setReminded] = useState(false);
  const [following, setFollowing] = useState(false);
  const isMinimal = mode === "minimal";

  return (
    <div className="card-surface rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border-subtle)]">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">About the Creator</p>
      </div>

      {/* Profile */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0",
              avatarBg(author.id)
            )}
          >
            {author.initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{author.name}</span>
              {author.verified && (
                <span className="text-micro font-medium px-1.5 py-0.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">{author.handle}</p>
            {author.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {author.badges.slice(0, 3).map((b) => (
                  <span
                    key={b}
                    className="text-micro px-1.5 py-0.5 rounded-full bg-[var(--bg-overlay)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-[var(--text-secondary)] leading-relaxed">{author.bio}</p>

        {/* Stats — hidden in minimal */}
        {!isMinimal && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{fmtCount(author.followers)}</p>
              <p className="text-micro text-[var(--text-muted)]">Subscribers</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{author.following}</p>
              <p className="text-micro text-[var(--text-muted)]">Following</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <p className="text-sm font-bold text-[var(--text-primary)]">{author.rating.toFixed(1)}</p>
              </div>
              <p className="text-micro text-[var(--text-muted)]">Rating</p>
            </div>
          </div>
        )}

        {/* Follow button */}
        <button
          onClick={() => { setFollowing(v => !v); onToast?.(following ? "Unfollowed" : "Following"); }}
          className={cn(
            "mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors",
            following
              ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30"
              : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
          )}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {following ? "Following" : "Follow Creator"}
        </button>

        {liveSession && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-micro font-medium text-[var(--brand-primary)] uppercase tracking-wide">Upcoming</p>
                <p className="text-xs font-semibold text-[var(--text-primary)] mt-0.5 leading-snug">{liveSession.title}</p>
                <p className="text-micro text-[var(--text-muted)] mt-1">
                  {fmtSessionAt(liveSession.scheduledAt)} · {fmtCount(liveSession.attendees)} signed up
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setReminded((v) => !v); onToast?.(reminded ? "Reminder removed" : "Reminder set"); }}
              className={cn(
                "mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                reminded
                  ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30"
                  : "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]"
              )}
            >
              <Bell className="h-3 w-3" />
              {reminded ? "Reminder set" : "Set Reminder"}
            </button>
          </div>
        )}
      </div>

      {/* Products — hidden in minimal mode */}
      {mode === "max" && products.length > 0 && (
        <div className="px-4 pb-4 border-t border-[var(--border-subtle)] pt-3">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Featured Products</p>
          <div className="space-y-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer group"
              >
                <ShoppingBag className="h-4 w-4 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{p.title}</p>
                    <span className="text-xs font-bold text-[var(--brand-primary)] flex-shrink-0">${p.price}</span>
                  </div>
                  <p className="text-micro text-[var(--text-muted)] mt-0.5 leading-relaxed line-clamp-2">{p.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-3 w-full py-2 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-[var(--brand-primary-hover)] transition-colors">
            Book a Consultation
          </button>
        </div>
      )}
    </div>
  );
}
