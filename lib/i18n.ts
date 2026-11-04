import type { Dictionary } from "@/dictionaries/fr";

export const LOCALES = ["fr", "ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export const hasLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/** Arabic is written right to left. */
export const directionOf = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

/** Name of each language in that language, for the language switcher. */
export const LANGUAGE_NAMES: Record<Locale, string> = { fr: "Français", ar: "العربية", en: "English" };

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import("@/dictionaries/fr").then((m) => m.default),
  ar: () => import("@/dictionaries/ar").then((m) => m.default),
  en: () => import("@/dictionaries/en").then((m) => m.default),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();

/** Replaces {name} markers in a text. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

const intlLocale: Record<Locale, string> = { fr: "fr-MA", ar: "ar-MA", en: "en-GB" };

/** 350 → "350 MAD" in the reader's number style. */
export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(amount);
}
