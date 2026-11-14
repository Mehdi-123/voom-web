"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { COUNTRIES, countryName, flagOf, type Country } from "@/lib/phone";
import { CheckIcon, ChevronDownIcon } from "@/components/Icons";
import { TextInput } from "./ui";

/** The room the open list needs, in pixels: the search box and about four countries. */
const LIST_HEIGHT = 340;

type Labels = { country: string; search: string; none: string };

/** Compared without accents or case, so "Egypte" and "égypte" find the same country. */
const plain = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** A phone number field: the country (flag and code) on a button that opens a searchable list, then the number itself. */
export default function PhoneInput({ lang, labels, country, onCountry, value, onChange, invalid, placeholder, autoComplete = "tel-national" }: {
  lang: Locale; labels: Labels; country: Country; onCountry: (c: Country) => void; value: string; onChange: (v: string) => void;
  invalid?: boolean; placeholder?: string; autoComplete?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [below, setBelow] = useState(false);

  // Morocco first, then the others by name in the reader's language
  const named = useMemo(() => {
    const all = COUNTRIES.map((c) => ({ ...c, name: countryName(c, lang) }));
    return [all[0], ...all.slice(1).sort((a, b) => a.name.localeCompare(b.name, lang))];
  }, [lang]);
  const shown = useMemo(() => {
    const needle = plain(query);
    return needle ? named.filter((c) => plain(c.name).includes(needle) || c.dial.includes(needle.replace(/^\+/, "+"))) : named;
  }, [named, query]);

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const close = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const choose = (c: Country) => { onCountry(c); setOpen(false); setQuery(""); };

  return (
    <div ref={box} dir="ltr" className="relative flex gap-2">
      <button
        type="button"
        role="combobox"
        aria-label={labels.country}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          // The list opens above the field; below only when the screen has no room above it
          if (!open && box.current) { const r = box.current.getBoundingClientRect(); setBelow(r.top < LIST_HEIGHT && window.innerHeight - r.bottom > r.top); }
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        className={`flex h-14 shrink-0 items-center gap-2 rounded-2xl border bg-fg/5 px-3.5 font-semibold text-fg/80 outline-none transition-colors hover:bg-fg/10 focus-visible:border-volt ${open ? "border-volt" : "border-fg/15"}`}
      >
        <span aria-hidden className="text-xl leading-none">{flagOf(country)}</span>
        <span className="tabular-nums">{country.dial}</span>
        <ChevronDownIcon className={`h-4 w-4 text-fg/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <TextInput type="tel" inputMode="tel" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d\s]/g, ""))} invalid={invalid} autoComplete={autoComplete} placeholder={placeholder} />

      {open ? (
        <div className={`menu-in absolute start-0 ${below ? "top-[calc(100%+0.5rem)]" : "bottom-[calc(100%+0.5rem)]"} z-30 w-80 max-w-[calc(100vw-2.5rem)] rounded-3xl border border-fg/15 bg-night p-2 text-fg shadow-2xl shadow-black/40`}>
          <input
            ref={search}
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter") { e.preventDefault(); if (shown[0]) choose(shown[0]); }
            }}
            placeholder={labels.search}
            aria-label={labels.search}
            dir="auto"
            className="mb-1 h-11 w-full rounded-2xl border border-fg/15 bg-fg/5 px-4 text-sm text-fg outline-none placeholder:text-fg/40 focus:border-volt"
          />
          <ul id={listId} role="listbox" aria-label={labels.country} className="max-h-64 overflow-y-auto">
            {shown.length === 0 ? <li className="px-4 py-3 text-sm text-fg/55">{labels.none}</li> : null}
            {shown.map((c) => {
              const on = c.iso === country.iso && c.dial === country.dial;
              return (
                <li key={`${c.iso}${c.dial}`} role="option" aria-selected={on} onClick={() => choose(c)} className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-fg/10 ${on ? "text-volt-soft" : ""}`}>
                  <span aria-hidden className="text-xl leading-none">{flagOf(c)}</span>
                  <span dir="auto" className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="tabular-nums text-fg/55">{c.dial}</span>
                  {on ? <CheckIcon className="h-4 w-4" /> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
