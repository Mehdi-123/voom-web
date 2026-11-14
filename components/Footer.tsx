import Link from "next/link";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_LINK } from "@/lib/site";

export default function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <footer className="relative overflow-hidden bg-ink text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pt-20 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-extrabold text-white">{dict.footer.tagline}</p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-white">{dict.footer.explore}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href={`/${lang}/cars`} className="hover:text-white">{dict.nav.cars}</Link></li>
            <li><Link href={`/${lang}/agencies`} className="hover:text-white">{dict.nav.agencies}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-white">{dict.footer.legal}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href={`/${lang}/terms`} className="hover:text-white">{dict.footer.terms}</Link></li>
            <li><Link href={`/${lang}/privacy`} className="hover:text-white">{dict.footer.privacy}</Link></li>
            <li><Link href={`/${lang}/contact`} className="hover:text-white">{dict.footer.contactUs}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-white">{dict.footer.contact}</h2>
          <ul className="space-y-2 text-sm">
            <li><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">{SUPPORT_EMAIL}</a></li>
            <li><a href={SUPPORT_PHONE_LINK} dir="ltr" className="hover:text-white">{SUPPORT_PHONE}</a></li>
          </ul>
        </div>
      </div>

      {/* The wordmark, as big as the screen allows */}
      <p aria-hidden dir="ltr" className="font-brand pointer-events-none select-none px-2 pb-2 pt-16 text-center text-[27vw] leading-[0.8] tracking-tight text-transparent [-webkit-text-stroke:2px_rgba(162,89,255,0.45)] sm:text-[22vw]">
        VOOM
      </p>
      <div className="relative border-t border-white/10 px-5 py-5 text-center text-xs">© Voom. {dict.footer.rights}</div>
    </footer>
  );
}
