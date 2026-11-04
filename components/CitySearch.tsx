"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES } from "@/lib/cities";
import type { Locale } from "@/lib/i18n";

/** City picker in the hero: opens that city's page. */
export default function CitySearch({ lang, label, button }: { lang: Locale; label: string; button: string }) {
  const router = useRouter();
  const [city, setCity] = useState<string>(CITIES[0].slug);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); router.push(`/${lang}/cities/${city}`); }}
      className="glass flex w-full max-w-xl flex-col gap-2 rounded-[2rem] p-2 sm:flex-row sm:rounded-full"
    >
      <label className="relative flex-1">
        <span className="sr-only">{label}</span>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-14 w-full appearance-none rounded-full bg-transparent px-6 text-lg font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-volt"
        >
          {CITIES.map((c) => <option key={c.slug} value={c.slug} className="bg-night text-white">{c.names[lang]}</option>)}
        </select>
        <span aria-hidden className="pointer-events-none absolute end-5 top-1/2 -translate-y-1/2 text-white/50">▾</span>
      </label>
      <button type="submit" className="h-14 rounded-full bg-volt px-8 text-base font-bold text-white shadow-lg shadow-volt/40 transition-all hover:bg-volt-soft hover:shadow-volt/60">
        {button} →
      </button>
    </form>
  );
}
