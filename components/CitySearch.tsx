"use client";

import { useRouter } from "next/navigation";
import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { CITIES } from "@/lib/cities";
import type { Locale } from "@/lib/i18n";
import { CheckIcon, ChevronDownIcon, PinIcon } from "./Icons";

/** City picker in the hero: a styled list (not the browser's own menu), then the button opens that city's page. */
export default function CitySearch({ lang, label, button }: { lang: Locale; label: string; button: string }) {
  const router = useRouter();
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const city = CITIES[selected];

  // Click or tap outside closes the list
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  // Keep the highlighted city in view while arrowing through the list
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  // Opens upward when the list would run off the bottom of the screen
  const toggle = () => {
    if (!open && box.current) setUp(window.innerHeight - box.current.getBoundingClientRect().bottom < 360);
    setActive(selected);
    setOpen((o) => !o);
  };
  const choose = (i: number) => { setSelected(i); setActive(i); setOpen(false); };

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { toggle(); return; }
      setActive((a) => (e.key === "ArrowDown" ? Math.min(a + 1, CITIES.length - 1) : Math.max(a - 1, 0)));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); router.push(`/${lang}/cities/${city.slug}`); }}
      className="glass relative flex w-full max-w-xl flex-col gap-2 rounded-[2rem] p-2 sm:flex-row sm:rounded-full"
    >
      <div ref={box} className="relative flex-1">
        <button
          type="button"
          role="combobox"
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={toggle}
          onKeyDown={onKeyDown}
          className="flex h-14 w-full items-center gap-3 rounded-full px-5 text-start transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-volt"
        >
          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-volt/20 text-volt-soft"><PinIcon className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold uppercase leading-none tracking-wider text-white/45">{label}</span>
            <span className="mt-1 block truncate text-lg font-semibold leading-none">{city.names[lang]}</span>
          </span>
          <ChevronDownIcon className={`h-5 w-5 shrink-0 text-white/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>

        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className={`menu-in absolute inset-x-0 z-30 ${up ? "bottom-[calc(100%+0.75rem)]" : "top-[calc(100%+0.75rem)]"} max-h-72 overflow-y-auto rounded-3xl border border-white/12 bg-night/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl`}
          >
            {CITIES.map((c, i) => (
              <li
                key={c.slug}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition-colors ${i === active ? "bg-white/10" : ""} ${i === selected ? "text-volt-soft" : "text-white"}`}
              >
                {c.names[lang]}
                {i === selected ? <CheckIcon className="h-4 w-4" /> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button type="submit" className="h-14 rounded-full bg-volt px-8 text-base font-bold text-white shadow-lg shadow-volt/40 transition-all hover:bg-volt-soft hover:shadow-volt/60">
        {button} →
      </button>
    </form>
  );
}
