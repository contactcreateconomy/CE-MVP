import { notFound } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * /lab — dev-only variant canvas (S00 spec §4 #24, D-014 EXPLORE).
 * Production guard lands here first (T15 applies the same to /kit):
 * 404 unless running the dev server.
 */
export default function LabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return (
    <main className={cn("mx-auto max-w-xl px-4 py-10")}>
      <h1 className="text-lg font-semibold text-(--text-primary)">Lab</h1>
      <p className="mt-2 text-sm text-(--text-secondary)">
        Dev-only canvas for the redesign. Never shipped to users (404 in production).
      </p>
      <div className="mt-6">
        <a
          href="/lab/utilities"
          className="inline-flex h-9 items-center rounded-md bg-(--brand-primary) px-3 text-sm font-medium text-(--text-inverse)"
        >
          /lab/utilities — glow &amp; glass utility demos
        </a>
      </div>
    </main>
  );
}
