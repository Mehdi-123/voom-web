"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/dictionaries/fr";
import { fill, formatPrice, type Locale } from "@/lib/i18n";
import type { Car } from "@/lib/cars";
import { localizedCityName } from "@/lib/cities";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, FUELS, TRANSMISSIONS } from "@/lib/car-options";
import CarCard from "./CarCard";
import { CloseIcon } from "./Icons";
import RangeCalendar from "./RangeCalendar";

type Filters = { q: string; city: string; category: string; transmission: string; fuel: string; seats: number; max: number | null; from: string; to: string; sort: string };
const EMPTY: Filters = { q: "", city: "", category: "", transmission: "", fuel: "", seats: 0, max: null, from: "", to: "", sort: "new" };

const todayIso = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

/** Every car with its filters: period (free on these days), city, type, gearbox, fuel, seats, price, and a sort. The choices live in the address, so a search can be shared. */
export default function CarCatalog({ cars, lang, dict }: { cars: Car[]; lang: Locale; dict: Dictionary }) {
  const t = dict.catalog;
  const [f, setF] = useState<Filters>(EMPTY);
  const [open, setOpen] = useState(false);
  const [freeIds, setFreeIds] = useState<Set<string> | null>(null);
  const [checking, setChecking] = useState(false);
  const [periodFailed, setPeriodFailed] = useState(false);
  const [minDate] = useState(todayIso);
  const [loadedFromUrl, setLoadedFromUrl] = useState(false);

  const prices = cars.map((c) => c.price_per_day);
  const ceiling = Math.max(100, ...prices);
  const floor = Math.min(...prices, ceiling);
  const cities = useMemo(() => [...new Set(cars.map((c) => c.city))].sort(), [cars]);

  // The address carries the filters in, and out
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setF({
      q: p.get("q") ?? "", city: p.get("city") ?? "", category: p.get("cat") ?? "", transmission: p.get("trans") ?? "", fuel: p.get("fuel") ?? "",
      seats: Number(p.get("seats")) || 0, max: p.get("max") ? Number(p.get("max")) : null, from: p.get("from") ?? "", to: p.get("to") ?? "", sort: p.get("sort") ?? "new",
    });
    setLoadedFromUrl(true);
  }, []);
  useEffect(() => {
    if (!loadedFromUrl) return; // writing before reading would wipe the address
    // Browsers allow about 100 address updates per 10 seconds, and a slider fires far more: write once the person pauses
    const timer = setTimeout(() => {
      const p = new URLSearchParams();
      if (f.q) p.set("q", f.q); if (f.city) p.set("city", f.city); if (f.category) p.set("cat", f.category);
      if (f.transmission) p.set("trans", f.transmission); if (f.fuel) p.set("fuel", f.fuel); if (f.seats) p.set("seats", String(f.seats));
      if (f.max !== null) p.set("max", String(f.max)); if (f.from) p.set("from", f.from); if (f.to) p.set("to", f.to); if (f.sort !== "new") p.set("sort", f.sort);
      const qs = p.toString();
      const target = qs ? `?${qs}` : window.location.pathname;
      if (target === `${window.location.search}` || (!qs && !window.location.search)) return;
      try { window.history.replaceState(null, "", target); } catch { /* the address is only a convenience */ }
    }, 450);
    return () => clearTimeout(timer);
  }, [f, loadedFromUrl]);

  // Which cars are free on the whole period (asked of the database, which knows the bookings)
  const validPeriod = !!f.from && !!f.to && f.to >= f.from;
  useEffect(() => {
    if (!validPeriod) { setFreeIds(null); setPeriodFailed(false); return; } // eslint-disable-line react-hooks/set-state-in-effect
    let cancelled = false;
    setChecking(true);
    supabase.rpc("available_car_ids", { p_from: f.from, p_to: f.to }).then(({ data, error }) => {
      if (cancelled) return;
      setChecking(false);
      if (error || !Array.isArray(data)) { setFreeIds(null); setPeriodFailed(true); return; }
      setPeriodFailed(false);
      setFreeIds(new Set(data as string[]));
    });
    return () => { cancelled = true; };
  }, [validPeriod, f.from, f.to]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setF((cur) => ({ ...cur, [key]: value }));
  const shown = useMemo(() => {
    const needle = f.q.trim().toLowerCase();
    const list = cars.filter((c) =>
      (!needle || `${c.make} ${c.model}`.toLowerCase().includes(needle)) &&
      (!f.city || c.city === f.city) && (!f.category || c.category === f.category) &&
      (!f.transmission || c.transmission === f.transmission) && (!f.fuel || c.fuel === f.fuel) &&
      (!f.seats || c.seats >= f.seats) && (f.max === null || c.price_per_day <= f.max) &&
      (!freeIds || freeIds.has(c.id)));
    const by = { new: (a: Car, b: Car) => b.created_at.localeCompare(a.created_at), asc: (a: Car, b: Car) => a.price_per_day - b.price_per_day, desc: (a: Car, b: Car) => b.price_per_day - a.price_per_day, rating: (a: Car, b: Car) => (b.rating ?? 0) - (a.rating ?? 0) }[f.sort] ?? (() => 0);
    return [...list].sort(by);
  }, [cars, f, freeIds]);

  const active = [f.q, f.city, f.category, f.transmission, f.fuel, f.seats || "", f.max !== null ? "x" : "", f.from || f.to ? "x" : ""].filter(Boolean).length;
  const chip = (on: boolean) => `rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${on ? "border-volt bg-volt text-white" : "border-line bg-paper text-ink/75 hover:border-volt/50"}`;
  const label = "mb-2.5 block text-xs font-bold uppercase tracking-wider text-muted";
  const input = "h-12 w-full rounded-2xl border border-line bg-paper px-4 text-base text-ink outline-none transition-colors focus:border-volt";
  const labels = dict.labels;
  const count = fill(shown.length === 1 ? t.countOne : t.countMany, { count: shown.length });

  const panel = (
    <div className="space-y-7 rounded-[2rem] bg-white p-6 shadow-sm">
      <div>
        <span className={label}>{t.period}</span>
        <RangeCalendar
          from={f.from}
          to={f.to}
          min={minDate}
          lang={lang}
          labels={{ pick: t.pickDates, clear: t.clearDates, days: t.daysCount, day: t.dayCount, pickReturn: t.pickReturn, from: t.from_, to: t.to }}
          onChange={(from, to) => setF((cur) => ({ ...cur, from, to }))}
        />
        <p className="mt-2 text-xs text-muted">{checking ? t.checking : t.periodHint}</p>
        {periodFailed ? <p className="mt-2 text-xs text-[#9a6700]">{t.periodUnavailable}</p> : null}
      </div>

      {cities.length > 1 ? (
        <div>
          <span className={label}>{t.city}</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => set("city", "")} className={chip(!f.city)}>{t.allCities}</button>
            {cities.map((c) => <button key={c} type="button" onClick={() => set("city", c)} className={chip(f.city === c)}>{localizedCityName(c, lang)}</button>)}
          </div>
        </div>
      ) : null}

      <div>
        <span className={label}>{t.category}</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => set("category", "")} className={chip(!f.category)}>{t.any}</button>
          {CATEGORIES.map((c) => <button key={c} type="button" onClick={() => set("category", c)} className={chip(f.category === c)}>{labels.category[c]}</button>)}
        </div>
      </div>

      <div>
        <span className={label}>{t.transmission}</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => set("transmission", "")} className={chip(!f.transmission)}>{t.any}</button>
          {TRANSMISSIONS.map((c) => <button key={c} type="button" onClick={() => set("transmission", c)} className={chip(f.transmission === c)}>{labels.transmission[c]}</button>)}
        </div>
      </div>

      <div>
        <span className={label}>{t.fuel}</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => set("fuel", "")} className={chip(!f.fuel)}>{t.any}</button>
          {FUELS.map((c) => <button key={c} type="button" onClick={() => set("fuel", c)} className={chip(f.fuel === c)}>{labels.fuel[c]}</button>)}
        </div>
      </div>

      <div>
        <span className={label}>{t.seats}</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => set("seats", 0)} className={chip(!f.seats)}>{t.any}</button>
          {[4, 5, 7].map((n) => <button key={n} type="button" onClick={() => set("seats", n)} className={chip(f.seats === n)}>{fill(t.seatsMin, { n })}</button>)}
        </div>
      </div>

      <div>
        <span className={label}>{t.maxPrice}</span>
        <input type="range" min={floor} max={ceiling} step={10} value={f.max ?? ceiling} onChange={(e) => set("max", Number(e.target.value) >= ceiling ? null : Number(e.target.value))} aria-label={t.maxPrice} className="w-full accent-[#a259ff]" />
        <p className="mt-1 text-sm font-semibold">{f.max === null ? t.any : fill(t.upTo, { price: formatPrice(f.max, lang) })}</p>
      </div>

      {active > 0 ? <button type="button" onClick={() => setF(EMPTY)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line py-3 text-sm font-bold transition-colors hover:bg-paper"><CloseIcon className="h-4 w-4" /> {t.reset}</button> : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="mb-6 flex gap-3 lg:hidden">
        <input type="search" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder={t.search} aria-label={t.search} className={`${input} flex-1`} />
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-ink px-5 text-sm font-bold text-white">
          {open ? t.hideFilters : t.filters}{active > 0 ? <span className="rounded-full bg-volt px-2 py-0.5 text-xs">{active}</span> : null}
        </button>
      </div>

      <aside className={`${open ? "block" : "hidden"} mb-8 lg:sticky lg:top-28 lg:mb-0 lg:block`}>{panel}</aside>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-xl font-extrabold">{checking ? t.checking : count}</p>
          <input type="search" value={f.q} onChange={(e) => set("q", e.target.value)} placeholder={t.search} aria-label={t.search} className={`${input} hidden max-w-xs lg:block`} />
        </div>
        <div className="no-scrollbar -mx-5 mb-6 flex items-center gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="radiogroup" aria-label={t.sort}>
          <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted">{t.sort}</span>
          {([["new", t.sortNew], ["asc", t.sortPriceAsc], ["desc", t.sortPriceDesc], ["rating", t.sortRating]] as const).map(([value, text]) => (
            <button key={value} type="button" role="radio" aria-checked={f.sort === value} onClick={() => set("sort", value)} className={`shrink-0 ${chip(f.sort === value)}`}>{text}</button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-line bg-white p-14 text-center">
            <h2 className="font-display text-3xl font-extrabold">{t.noneTitle}</h2>
            <p className="mx-auto mt-3 max-w-md text-muted">{t.noneText}</p>
            {active > 0 ? <button type="button" onClick={() => setF(EMPTY)} className="mt-6 rounded-full bg-ink px-6 py-3 font-bold text-white">{t.reset}</button> : null}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((car) => <CarCard key={car.id} car={car} lang={lang} dict={dict} className="h-full" />)}
          </div>
        )}
      </div>
    </div>
  );
}
