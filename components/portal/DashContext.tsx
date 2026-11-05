"use client";

import { createContext, ReactNode, useContext } from "react";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import type { useNotices } from "./notifications";

type Value = { lang: Locale; dict: Dictionary; notices: ReturnType<typeof useNotices> };

const DashContext = createContext<Value | null>(null);

export function DashProvider({ children, ...value }: Value & { children: ReactNode }) {
  return <DashContext.Provider value={value}>{children}</DashContext.Provider>;
}

/** The page's language and its text, and the inbox, for the dashboard pages. */
export function useDash() {
  const ctx = useContext(DashContext);
  if (!ctx) throw new Error("useDash must be used inside the dashboard");
  return ctx;
}
