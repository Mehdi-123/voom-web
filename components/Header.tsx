import { Suspense } from "react";
import Link from "next/link";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import AccountLink from "./AccountLink";

/** A glass pill floating over the page: logo, links, language. */
export default function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const links = [
    { href: `/${lang}#cities`, label: dict.nav.cities },
    { href: `/${lang}/agencies`, label: dict.nav.agencies },
  ];

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-5">
      <div className="glass mx-auto flex max-w-5xl bg-night/80!  items-center justify-between gap-3 rounded-full py-2.5 ps-5 pe-2.5 sm:ps-6 text-white shadow-2xl shadow-black/30">
        <Link href={`/${lang}`} aria-label="Voom" className="shrink-0">
          <Logo tone="white" height={24} />
        </Link>
        <nav aria-label={dict.nav.menu} className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-white">{l.label}</Link>
          ))}
        </nav>
        {/* Desktop and tablet */}
        <div className="hidden items-center gap-2 md:flex">
          {/* The switcher reads the current address, which is only known when the page is requested */}
          <Suspense fallback={<div className="h-9 w-24" />}>
            <LanguageSwitcher current={lang} label={dict.nav.language} />
          </Suspense>
          <AccountLink lang={lang} loginLabel={dict.dash.auth.login} accountLabel={dict.nav.account} className="rounded-full bg-volt px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-volt-soft" />
        </div>
        {/* Phone: sign in stays one tap away, everything else is in the menu */}
        <div className="flex items-center gap-2 md:hidden">
          <AccountLink lang={lang} loginLabel={dict.dash.auth.login} accountLabel={dict.nav.account} className="rounded-full bg-volt px-4 py-2.5 text-sm font-bold text-white active:bg-volt-soft" />
          <MobileMenu lang={lang} links={links} loginLabel={dict.dash.auth.login} accountLabel={dict.nav.account} menuLabel={dict.nav.menu} languageLabel={dict.nav.language} />
        </div>
      </div>
    </header>
  );
}
