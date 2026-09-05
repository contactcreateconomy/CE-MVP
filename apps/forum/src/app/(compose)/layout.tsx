import type { ReactNode } from "react";

import { ComposeShell } from "@/components/compose/compose-shell";

export default function ComposeLayout({ children }: { children: ReactNode }) {
  return <ComposeShell>{children}</ComposeShell>;
}
