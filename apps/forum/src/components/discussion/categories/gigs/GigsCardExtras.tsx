"use client";

import { Briefcase } from "lucide-react";

import type { Post } from "@/types/post";

export function GigsCardExtras({ post }: { post: Post }) {
  const body = post.categoryBody;
  if (!body || typeof body !== "object" || !Object.keys(body).length) return null;

  const roleTitle = typeof body.roleTitle === "string" ? body.roleTitle : "";
  const employment = typeof body.employment === "string" ? body.employment : "";
  const location = typeof body.location === "string" ? body.location : "";
  const budget = typeof body.budget === "string" ? body.budget : "";

  const parts: string[] = [];
  if (roleTitle) parts.push(roleTitle);
  if (employment) parts.push(employment);
  if (location) parts.push(location);
  if (budget) parts.push(budget);

  if (!parts.length) return null;

  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-(--text-secondary)">
      <Briefcase className="h-3 w-3 shrink-0 text-(--text-muted)" />
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-(--border-default)">·</span>}
          {part}
        </span>
      ))}
    </p>
  );
}
