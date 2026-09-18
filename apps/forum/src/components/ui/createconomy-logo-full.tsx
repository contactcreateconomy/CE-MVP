import { cn } from "@/lib/utils";
import { CreateconomyLogoMark } from "./createconomy-logo-mark";

/**
 * Full logo — STYLE-KIT §10.2 ("Full logo — Mark + \"createconomy\"
 * wordmark; usage: Landing page, auth, about, email"). §10.3 wordmark
 * spec: Geist Semibold (600), lowercase, -0.5px tracking, mark+wordmark
 * gap = 50% of mark height, vertically centered. §10.4: min digital size
 * 24px mark height / 120px full-logo width.
 */
export function CreateconomyLogoFull({
  markSize = 24,
  className,
}: {
  markSize?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("inline-flex min-w-30 items-center", className)}
      style={{ gap: markSize * 0.5 }}
    >
      <CreateconomyLogoMark size={markSize} decorative />
      <span
        className="font-semibold lowercase text-text-primary"
        style={{ letterSpacing: "-0.5px", fontSize: markSize * 0.75, lineHeight: 1 }}
      >
        createconomy
      </span>
    </div>
  );
}

/**
 * Wordmark only — STYLE-KIT §10.2 ("Wordmark only — \"createconomy\" text
 * only; usage: Legal footers, very small spaces").
 */
export function CreateconomyWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("font-semibold lowercase text-text-muted", className)}
      style={{ letterSpacing: "-0.5px" }}
    >
      createconomy
    </span>
  );
}
