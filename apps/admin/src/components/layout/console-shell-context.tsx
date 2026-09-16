"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { NavItem } from "./nav-config";

export interface ConsoleShellValue {
  navItems: NavItem[];
  openPalette: () => void;
}

const ConsoleShellContext = createContext<ConsoleShellValue | null>(null);

export function ConsoleShellProvider({
  value,
  children,
}: {
  value: ConsoleShellValue;
  children: ReactNode;
}) {
  return <ConsoleShellContext.Provider value={value}>{children}</ConsoleShellContext.Provider>;
}

export function useConsoleShell(): ConsoleShellValue {
  const ctx = useContext(ConsoleShellContext);
  if (!ctx) {
    return { navItems: [], openPalette: () => undefined };
  }
  return ctx;
}
