 
import Link from "next/link";

/**
 * ProvenanceFooter — SLICE-P7T-11 (CAP-468/469): always rendered on
 * indexable host pages (post/tool/resource/persona). Footer links to
 * /how-we-review · /editorial-policy · /ai-disclosure (FATAL-M17-01/02).
 * Persona/AI-assisted hosts add the visible AI label + machine-readable
 * provenance (quoted: "/ai-disclosure states editorial responsibility
 * holder"). Provenance rendering generates NO Signal or Recognition
 * (contract §5 — render-only component, no event capture by design).
 */

export function ProvenanceFooter({ aiGenerated = false, aiAssisted = false }: { aiGenerated?: boolean; aiAssisted?: boolean }) {
  const isAi = aiGenerated || aiAssisted;
  return (
    <footer className="mt-8 space-y-2 border-t border-(--border-subtle) pt-4">
      {isAi ? (
        <div
          className="flex items-center gap-2 text-xs text-(--text-secondary)"
          data-ai-generated={aiGenerated ? "true" : "false"}
          data-ai-assisted={aiAssisted ? "true" : "false"}
        >
          {/* FATAL-M17-02: the visible AI label — never a subtle one */}
          <span className="rounded-full bg-(--bg-overlay) px-2 py-0.5 font-medium text-(--text-primary)">
            {aiGenerated ? "AI-generated content" : "AI-assisted content"}
          </span>
          <span>
            Created by an AI persona under our{" "}
            <Link href="/ai-disclosure" className="underline-offset-2 hover:underline">
              AI disclosure
            </Link>
            . A human editor holds editorial responsibility.
          </span>
        </div>
      ) : null}
      <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--text-muted)" aria-label="Provenance">
        <Link href="/how-we-review" className="hover:text-(--text-secondary)">How we review</Link>
        <Link href="/editorial-policy" className="hover:text-(--text-secondary)">Editorial policy</Link>
        <Link href="/ai-disclosure" className="hover:text-(--text-secondary)">AI disclosure</Link>
      </nav>
    </footer>
  );
}
