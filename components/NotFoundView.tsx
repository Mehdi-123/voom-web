"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import notFoundText from "@/dictionaries/not-found";
import { DEFAULT_LOCALE, hasLocale } from "@/lib/i18n";

/** The 404 page, in the language of the address. */
export default function NotFoundView() {
  const { lang } = useParams<{ lang?: string }>();
  const locale = lang && hasLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = notFoundText[locale];
  return (
    <div className="night flex w-full flex-1 flex-col items-center justify-center px-5 py-24 text-center">
      <p className="font-display text-[8rem] font-extrabold leading-none text-volt sm:text-[10rem]">404</p>
      <h1 className="mt-3 text-2xl font-bold">{t.title}</h1>
      <p className="mt-3 max-w-md leading-relaxed text-fg/65">{t.text}</p>
      <Link href={`/${locale}`} className="mt-10 rounded-full bg-volt px-8 py-4 font-bold text-white transition-colors hover:bg-volt-soft">{t.home}</Link>
    </div>
  );
}
