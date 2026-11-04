"use client";

import { createContext, ReactNode, useContext } from "react";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";

const DashContext = createContext<{ lang: Locale; dict: Dictionary } | null>(null);

export function DashProvider({ lang, dict, children }: { lang: Locale; dict: Dictionary; children: ReactNode }) {
  return <DashContext.Provider value={{ lang, dict }}>{children}</DashContext.Provider>;
}

/** The page's language and its text, for the dashboard pages. */
export function useDash() {
  const ctx = useContext(DashContext);
  if (!ctx) throw new Error("useDash must be used inside the dashboard");
  return ctx;
}
