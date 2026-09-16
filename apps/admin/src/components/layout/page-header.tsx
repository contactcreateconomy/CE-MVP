import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Page header — shadcn-admin density on STYLE-KIT type tokens.
 * Used by existing admin screens; does not add routes.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-heading-md font-semibold tracking-tight text-text-primary">{title}</h1>
        {description ? (
          <p className="text-body-sm text-text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
