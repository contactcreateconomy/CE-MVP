"use client";

import { Toast } from "@/components/ui/toast";

interface BriefToastProps {
  message: string;
  onDismiss: () => void;
}

/** §11.7 toast, info variant. Kept as a thin wrapper over the shared Toast. */
export function BriefToast({ message, onDismiss }: BriefToastProps) {
  return <Toast message={message} variant="info" onDismiss={onDismiss} />;
}
