"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LANGUAGE_NAMES, LOCALES, Locale } from "@/lib/i18n";

/** Same page, other language: swaps the first part of the address. */
export default function LanguageSwitcher({ current, label, compact = false }: { current: Locale; label: string; compact?: boolean }) {
  const pathname = usePathname() ?? `/${current}`;
  const rest = pathname.replace(/^\/(fr|ar|en)(?=\/|$)/, "");

  return (
    <nav aria-label={label} className="flex items-center rounded-full bg-fg/10 p-1 text-xs font-bold">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          hrefLang={l}
          lang={l}
          title={LANGUAGE_NAMES[l]}
          aria-current={l === current ? "true" : undefined}
          className={`rounded-full ${compact ? "px-2 py-1.5 text-[11px]" : "px-3 py-1.5"} uppercase transition-colors ${l === current ? "bg-fg text-page" : "text-fg/70 hover:text-fg"}`}
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}
