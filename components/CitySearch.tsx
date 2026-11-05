"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cityOptions } from "@/lib/cities";
import type { Locale } from "@/lib/i18n";
import CityCombobox from "./CityCombobox";

/** City picker in the hero (all cities, or one), then the button opens the cars page, filtered when a city is chosen. */
export default function CitySearch({ lang, label, allLabel, button }: { lang: Locale; label: string; allLabel: string; button: string }) {
  const router = useRouter();
  const options = useMemo(() => cityOptions(lang), [lang]);
  const [city, setCity] = useState("");

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); router.push(city ? `/${lang}/cars?city=${encodeURIComponent(city)}` : `/${lang}/cars`); }}
      className="glass relative flex w-full max-w-xl flex-col gap-2 rounded-[2rem] p-2 sm:flex-row sm:rounded-full"
    >
      <CityCombobox options={options} value={city} onChange={setCity} label={label} allLabel={allLabel} variant="hero" blurPage />
      <button type="submit" className="h-14 rounded-full bg-volt px-8 text-base font-bold text-white shadow-lg shadow-volt/40 transition-all hover:bg-volt-soft hover:shadow-volt/60">
        {button} →
      </button>
    </form>
  );
}
