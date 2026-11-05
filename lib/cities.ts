import { MOROCCAN_CITIES } from "./moroccan-cities";

/** The main cities, with a slug and a name in each language. */
export const CITIES = [
  { slug: "casablanca", name: "Casablanca", names: { fr: "Casablanca", en: "Casablanca", ar: "الدار البيضاء" } },
  { slug: "marrakech", name: "Marrakech", names: { fr: "Marrakech", en: "Marrakech", ar: "مراكش" } },
  { slug: "rabat", name: "Rabat", names: { fr: "Rabat", en: "Rabat", ar: "الرباط" } },
  { slug: "tanger", name: "Tanger", names: { fr: "Tanger", en: "Tangier", ar: "طنجة" } },
  { slug: "agadir", name: "Agadir", names: { fr: "Agadir", en: "Agadir", ar: "أكادير" } },
  { slug: "fes", name: "Fès", names: { fr: "Fès", en: "Fez", ar: "فاس" } },
  { slug: "meknes", name: "Meknès", names: { fr: "Meknès", en: "Meknes", ar: "مكناس" } },
  { slug: "oujda", name: "Oujda", names: { fr: "Oujda", en: "Oujda", ar: "وجدة" } },
  { slug: "kenitra", name: "Kénitra", names: { fr: "Kénitra", en: "Kenitra", ar: "القنيطرة" } },
  { slug: "tetouan", name: "Tétouan", names: { fr: "Tétouan", en: "Tetouan", ar: "تطوان" } },
  { slug: "essaouira", name: "Essaouira", names: { fr: "Essaouira", en: "Essaouira", ar: "الصويرة" } },
  { slug: "ouarzazate", name: "Ouarzazate", names: { fr: "Ouarzazate", en: "Ouarzazate", ar: "ورزازات" } },
] as const;

export type City = (typeof CITIES)[number];

/** "Fès" and "Fes" must find the same city: compare without accents or case. */
const plain = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function citySlugFor(name: string): string | undefined {
  return CITIES.find((c) => plain(c.name) === plain(name))?.slug;
}

/** The city's name in the reader's language; a city we have no translation for keeps the name stored with the car. */
export function localizedCityName(name: string, lang: "fr" | "ar" | "en"): string {
  const slug = citySlugFor(name);
  return CITIES.find((c) => c.slug === slug)?.names[lang] ?? name;
}

export type CityOption = { key: string; label: string };

/**
 * Every city a visitor can pick: the main cities first, then all the others an agency can sign up from (alphabetical, name as stored).
 * `key` is what the cars filter uses: the slug of a main city, the name itself for the others.
 */
export function cityOptions(lang: "fr" | "ar" | "en"): CityOption[] {
  const main = CITIES.map((c) => ({ key: c.slug, label: c.names[lang] }));
  const others = MOROCCAN_CITIES.filter((name) => !citySlugFor(name)).map((name) => ({ key: name, label: name }));
  return [...main, ...others.sort((a, b) => a.label.localeCompare(b.label, "fr"))];
}
