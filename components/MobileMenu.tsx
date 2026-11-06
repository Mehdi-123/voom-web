"use client";

import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Logo from "./Logo";
import AccountLink from "./AccountLink";
import LanguageSwitcher from "./LanguageSwitcher";
import type { Locale } from "@/lib/i18n";

type Props = { lang: Locale; links: { href: string; label: string }[]; loginLabel: string; accountLabel: string; menuLabel: string; languageLabel: string };

/** Phone navigation: a burger in the header that opens a full-screen menu with big links, the language and sign in. */
export default function MobileMenu({ lang, links, loginLabel, accountLabel, menuLabel, languageLabel }: Props) {
  const [open, setOpen] = useState(false);

  // The page behind must not scroll while the menu is open; Escape closes it
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={menuLabel}
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] rounded-full bg-white/10 transition-colors active:bg-white/20"
      >
        <span className="h-0.5 w-4 rounded-full bg-white" />
        <span className="h-0.5 w-2.5 self-end rounded-full bg-white ltr:me-3 rtl:ms-3" />
      </button>

      {/* Drawn on the page itself: inside the header (which blurs what is behind it) "fixed" would only cover the header */}
      {open ? createPortal(
        <div role="dialog" aria-modal="true" aria-label={menuLabel} className="menu-in night grain fixed inset-0 z-[70] flex flex-col overflow-y-auto px-5 pb-8 pt-4 text-white">
          <div className="flex items-center justify-between py-2.5 ps-3">
            <Link href={`/${lang}`} aria-label="Voom" onClick={close}><Logo tone="white" height={24} /></Link>
            <button type="button" onClick={close} aria-label={menuLabel} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <nav aria-label={menuLabel} className="mt-10 flex flex-col">
            {links.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="menu-item font-display flex items-center justify-between border-b border-white/10 py-6 text-5xl font-extrabold tracking-tight"
                style={{ animationDelay: `${120 + i * 70}ms` }}
              >
                {l.label}
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-volt-soft rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
            ))}
          </nav>

          <div className="menu-item mt-auto flex flex-col gap-6 pt-12" style={{ animationDelay: `${120 + links.length * 70}ms` }}>
            <div className="flex justify-center">
              <Suspense fallback={<div className="h-9 w-28" />}>
                <LanguageSwitcher current={lang} label={languageLabel} />
              </Suspense>
            </div>
            <AccountLink lang={lang} loginLabel={loginLabel} accountLabel={accountLabel} onClick={close} className="flex h-14 items-center justify-center rounded-2xl bg-volt text-lg font-bold shadow-lg shadow-volt/30 active:bg-volt-soft" />
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
