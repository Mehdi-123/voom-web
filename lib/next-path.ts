"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "./i18n";

const subscribe = () => () => {};

/** A `next` address is only trusted when it stays inside the site for this language. */
function safeNext(lang: Locale, raw: string | null): string | null {
  if (!raw || !raw.startsWith(`/${lang}/`) || raw.startsWith("//") || raw.includes("\\")) return null;
  return raw;
}

/** Where to send the person after signing in: the `next` query when it is safe (read in the browser, so pages stay static). */
export function readNext(lang: Locale): string | null {
  return safeNext(lang, new URLSearchParams(window.location.search).get("next"));
}

/** The `?next=` suffix to carry across the login and sign-up pages ("" when there is none). */
export function useNextSuffix(lang: Locale): string {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  const next = safeNext(lang, new URLSearchParams(search).get("next"));
  return next ? `?next=${encodeURIComponent(next)}` : "";
}
