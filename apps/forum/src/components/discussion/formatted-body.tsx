"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type BodySegment =
  | { type: "text"; text: string }
  | { type: "code"; lang: string; code: string };

export function parseBodySegments(body: string): BodySegment[] {
  const segments: BodySegment[] = [];
  const re = /```(\w*)\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) {
      segments.push({ type: "text", text: body.slice(last, m.index) });
    }
    segments.push({ type: "code", lang: m[1] || "text", code: m[2].trimEnd() });
    last = m.index + m[0].length;
  }
  if (last < body.length) {
    segments.push({ type: "text", text: body.slice(last) });
  }
  if (segments.length === 0) {
    segments.push({ type: "text", text: body });
  }
  return segments;
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 overflow-hidden rounded-lg border border-(--border-default) bg-[hsl(240_12%_8%)] text-[hsl(0_0%_96%)]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-label-sm font-medium uppercase tracking-wide text-white/50">
        <span>{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md px-2 py-0.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-fine leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function FormattedBody({ body, className }: { body: string; className?: string }) {
  const segments = parseBodySegments(body);

  return (
    <div className={cn("text-sm leading-7 text-(--text-secondary)", className)}>
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <CodeBlock key={i} lang={seg.lang} code={seg.code} />
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {seg.text}
          </p>
        ),
      )}
    </div>
  );
}
