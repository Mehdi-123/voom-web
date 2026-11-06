"use client";

import Link from "next/link";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import { useNextSuffix } from "@/lib/next-path";
import { CarPlusIcon, KeyIcon } from "@/components/Icons";

/** First step of sign-up: renter or agency. A `next` address (a car the person wanted to book) follows the renter. */
export default function SignupChoice({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.dash.auth;
  const nextSuffix = useNextSuffix(lang);
  const options = [
    { href: `/${lang}/signup/customer${nextSuffix}`, icon: <KeyIcon className="h-7 w-7" />, title: t.asCustomer, text: t.asCustomerText },
    { href: `/${lang}/signup/agency`, icon: <CarPlusIcon className="h-7 w-7" />, title: t.asAgency, text: t.asAgencyText },
  ];
  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t.chooseTitle}</h1>
        <p className="mt-3 leading-relaxed text-fg/60">{t.chooseSubtitle}</p>
      </div>
      <div className="space-y-3">
        {options.map((o) => (
          <Link key={o.href} href={o.href} className="flex items-center gap-4 rounded-3xl border border-fg/15 bg-fg/5 p-5 transition-colors hover:border-volt hover:bg-fg/10">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-volt/15 text-volt-soft">{o.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold">{o.title}</span>
              <span className="mt-0.5 block text-sm text-fg/60">{o.text}</span>
            </span>
            <span aria-hidden className="text-fg/40 rtl:rotate-180">→</span>
          </Link>
        ))}
      </div>
      <p className="pt-2 text-center text-sm leading-relaxed text-fg/60">
        {t.haveAccount}{" "}
        <Link href={`/${lang}/login${nextSuffix}`} className="font-bold text-volt-soft hover:underline">{t.login}</Link>
      </p>
    </div>
  );
}
