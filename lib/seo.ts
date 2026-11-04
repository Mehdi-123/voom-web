import type { Metadata } from "next";
import { LOCALES, Locale, DEFAULT_LOCALE } from "./i18n";
import { SITE_URL } from "./site";

/** Canonical address plus the same page in every language, so Google shows the right one to each reader. */
export function alternatesFor(path: string, locale: Locale): Metadata["alternates"] {
  const url = (l: Locale) => `${SITE_URL}/${l}${path}`;
  return {
    canonical: url(locale),
    languages: { ...Object.fromEntries(LOCALES.map((l) => [l, url(l)])), "x-default": url(DEFAULT_LOCALE) },
  };
}

/** Text that goes inside a JSON-LD script: a "<" could close the tag early, so it is escaped. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
