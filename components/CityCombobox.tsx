"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import type { CityOption } from "@/lib/cities";
import { CheckIcon, ChevronDownIcon, PinIcon } from "./Icons";

type Props = {
  options: CityOption[];
  /** The chosen option's key; "" means "all" when `allLabel` is given. */
  value: string;
  onChange: (key: string) => void;
  label: string;
  /** Adds a first choice that clears the city. */
  allLabel?: string;
  /** "hero" is the big homepage search field; "field" is a regular form field. The list looks the same in both. */
  variant: "hero" | "field";
  id?: string;
};

/** A styled city list (not the browser's own menu), with arrow keys, type-ahead, and a click outside to close. */
export default function CityCombobox({ options, value, onChange, label, allLabel, variant, id }: Props) {
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const items = allLabel ? [{ key: "", label: allLabel }, ...options] : options;
  const selected = Math.max(0, items.findIndex((o) => o.key === value));
  const [active, setActive] = useState(selected);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const current = items[selected];

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
  const choose = (i: number) => { onChange(items[i].key); setActive(i); setOpen(false); };

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { toggle(); return; }
      setActive((a) => (e.key === "ArrowDown" ? Math.min(a + 1, items.length - 1) : Math.max(a - 1, 0)));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    } else if (open && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      // Type-ahead: letters typed in a row jump to the first city starting with them
      const now = Date.now();
      typed.current = { text: (now - typed.current.at > 900 ? "" : typed.current.text) + e.key.toLowerCase(), at: now };
      const hit = items.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
    }
  }

  const trigger = variant === "hero"
    ? "flex h-14 w-full items-center gap-3 rounded-full px-5 text-start transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-volt"
    : "flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 text-start text-base text-ink outline-none transition-colors hover:border-volt/50 focus-visible:border-volt";

  return (
    <div ref={box} className="relative flex-1">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={trigger}
      >
        {variant === "hero" ? (
          <>
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-volt/20 text-volt-soft"><PinIcon className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase leading-none tracking-wider text-white/45">{label}</span>
              <span className="mt-1 block truncate text-lg font-semibold leading-none">{current.label}</span>
            </span>
            <ChevronDownIcon className={`h-5 w-5 shrink-0 text-white/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
          </>
        ) : (
          <>
            <span className={`min-w-0 flex-1 truncate ${value ? "font-semibold" : ""}`}>{current.label}</span>
            <ChevronDownIcon className={`h-5 w-5 shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className={`menu-in absolute inset-x-0 z-30 ${up ? "bottom-[calc(100%+0.75rem)]" : "top-[calc(100%+0.75rem)]"} max-h-72 overflow-y-auto rounded-3xl border border-white/12 bg-night/60 p-2 text-white shadow-2xl shadow-black/50 backdrop-blur-2xl`}
        >
          {items.map((o, i) => (
            <li
              key={o.key || "all"}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === selected}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition-colors ${i === active ? "bg-white/10" : ""} ${i === selected ? "text-volt-soft" : "text-white"}`}
            >
              {o.label}
              {i === selected ? <CheckIcon className="h-4 w-4" /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
