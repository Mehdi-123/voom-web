import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n";
import { getCars } from "@/lib/cars";
import { SITE_URL } from "@/lib/site";

/** Every page in every language, each listing its translations so Google links them together. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cars = await getCars();
  const paths = ["", "/cars", "/agencies", ...cars.map((c) => `/cars/${c.id}`)];

  return paths.flatMap((path) =>
    LOCALES.map((lang) => ({
      url: `${SITE_URL}/${lang}${path}`,
      changeFrequency: path.startsWith("/cars") ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path === "/cars" ? 0.8 : 0.6,
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])) },
    })),
  );
}
