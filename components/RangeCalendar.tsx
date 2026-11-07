"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

type Labels = { pick: string; clear: string; days: string; day: string; pickReturn: string; from: string; to: string };

const LOCALE: Record<Locale, string> = { fr: "fr-MA", ar: "ar-MA", en: "en-GB" };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

/**
 * A two-click date range: first the pickup day, then the return day. Days between are soft circles, the two ends are solid,
 * like the calendar in the Voom app. Days before `min` cannot be picked, nor a return day closer than `minNights` to the pickup.
 * With `blocked` (booked days) it becomes a booking calendar, with the app's rules: a rental has at least two days and cannot cross a blocked day.
 */
export default function RangeCalendar({ from, to, min, minNights = 1, lang, labels, blocked, defaultOpen = false, onChange }: { from: string; to: string; min: string; minNights?: number; lang: Locale; labels: Labels; blocked?: Set<string>; defaultOpen?: boolean; onChange: (from: string, to: string) => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const [view, setView] = useState(() => { const d = from ? parse(from) : parse(min); d.setDate(1); return d; });
  const locale = LOCALE[lang];
  const box = useRef<HTMLDivElement>(null);

  // A click or tap anywhere else, or Escape, closes the calendar
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // weeks start on Monday
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "narrow" }));
  const waitingReturn = !!from && !to;

  const addDays = (key: string, n: number) => { const d = parse(key); d.setDate(d.getDate() + n); return iso(d); };
  const addDay = (key: string) => addDays(key, 1);
  const free = (key: string) => key >= min && !blocked?.has(key);
  // A pickup needs every day up to the earliest allowed return to be free
  const canStart = (key: string) => free(key) && (!blocked || Array.from({ length: minNights }, (_, i) => free(addDays(key, i + 1))).every(Boolean));
  // The last day reachable from the pickup without crossing a blocked day
  let lastReturn = "";
  if (blocked && waitingReturn) { lastReturn = from; for (let i = 0; i < 730 && free(addDay(lastReturn)); i++) lastReturn = addDay(lastReturn); }
  const selectable = (key: string) => {
    if (!blocked) return key >= min;
    if (waitingReturn && key > from) return free(key) && key <= lastReturn && key >= addDays(from, minNights);
    return canStart(key);
  };

  function pick(day: Date) {
    const key = iso(day);
    if (!selectable(key)) return;
    if (waitingReturn && (blocked ? key >= addDays(from, minNights) : key >= from)) { onChange(from, key); setOpen(false); return; }
    onChange(key, ""); // a new pickup (also when the day chosen is before the current one)
  }

  const fmt = (s: string) => parse(s).toLocaleDateString(locale, { day: "numeric", month: "short" });
  // Rentals are priced per night; the catalogue counts both end days
  const nights = from && to ? Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000) + (blocked ? 0 : 1) : 0;
  const monthLabel = view.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const canGoBack = first > parse(min);

  return (
    <div ref={box}>
      <div className={`relative grid grid-cols-2 overflow-hidden rounded-2xl border bg-paper transition-colors ${open ? "border-volt" : "border-line"}`}>
        {([["from", labels.from, from], ["to", labels.to, to]] as const).map(([part, label, value]) => {
          const current = open && (part === "to" ? waitingReturn : !waitingReturn);
          return (
            <button
              key={part}
              type="button"
              onClick={() => { setOpen(true); if (part === "from" && from && to) onChange("", ""); }}
              className={`px-4 py-2.5 text-start transition-colors ${part === "to" ? "border-s border-line" : ""} ${current ? "bg-white shadow-[inset_0_-2px_0_#a259ff]" : "hover:bg-white/70"}`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
              <span className={`mt-0.5 block truncate text-base ${value ? "font-bold text-ink" : "text-muted"}`}>{value ? fmt(value) : "—"}</span>
            </button>
          );
        })}
        {from ? <button type="button" onClick={(e) => { e.stopPropagation(); onChange("", ""); }} aria-label={labels.clear} title={labels.clear} className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink/10 text-sm leading-none text-ink/60 transition-colors hover:bg-ink/20 hover:text-ink">×</button> : null}
      </div>
      {nights ? <p className="mt-2 text-xs font-semibold text-volt-mid">{nights === 1 ? labels.day : fill(labels.days, { n: nights })}</p> : null}

      {open ? (
        <div className="mt-3 rounded-3xl border border-line bg-white p-4 shadow-lg shadow-black/5">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} disabled={!canGoBack} aria-label="‹" className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-paper disabled:opacity-25 disabled:hover:bg-transparent"><ChevronLeftIcon className="h-5 w-5 rtl:rotate-180" /></button>
            <span className="font-display text-base font-extrabold capitalize">{monthLabel}</span>
            <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} aria-label="›" className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-paper"><ChevronRightIcon className="h-5 w-5 rtl:rotate-180" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-bold uppercase text-muted">
            {weekdays.map((w, i) => <span key={i} className="py-1.5">{w}</span>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <span key={`gap-${i}`} />;
              const key = iso(day);
              const past = key < min;
              const taken = !!blocked?.has(key);
              const off = !selectable(key);
              const isFrom = key === from;
              const isTo = key === to;
              const between = !!from && !!to && key > from && key < to;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={off}
                  onClick={() => pick(day)}
                  aria-pressed={isFrom || isTo}
                  className="group flex aspect-square items-center justify-center disabled:cursor-not-allowed"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors ${isFrom || isTo ? "bg-volt font-bold text-white" : between ? "bg-volt/15 font-semibold text-volt-mid" : past || taken ? "text-ink/20 line-through" : off ? "text-ink/25" : key === iso(new Date()) ? "font-bold ring-1 ring-volt/50 group-hover:bg-paper" : "text-ink group-hover:bg-paper"}`}>{day.getDate()}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-muted">{waitingReturn ? labels.pickReturn : `${labels.from} → ${labels.to}`}</p>
        </div>
      ) : null}
    </div>
  );
}
