import type { ReactNode } from "react";

import { ContentShell } from "@/components/layout/content-shell";

export default function DiscussionsLayout({ children }: { children: ReactNode }) {
  return <ContentShell>{children}</ContentShell>;
}
