import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, getDictionary, hasLocale } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_LINK } from "@/lib/site";
import Reveal from "@/components/Reveal";

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = (await getDictionary(lang)).contact;
  return { title: t.title, description: t.intro, alternates: alternatesFor("/contact", lang) };
}

export default async function ContactPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = (await getDictionary(lang)).contact;

  const ways = [
    { label: t.email, value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}`, ltr: false },
    { label: t.phone, value: SUPPORT_PHONE, href: SUPPORT_PHONE_LINK, ltr: true },
  ];

  return (
    <div className="night px-5 pb-24 pt-40">
      <div className="mx-auto max-w-3xl">
        <Reveal as="h1" variant="none" className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">{t.title}</Reveal>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/65">{t.intro}</p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {ways.map((w) => (
            <a key={w.label} href={w.href} className="glass group rounded-3xl p-7 transition-colors hover:bg-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">{w.label}</p>
              <p dir={w.ltr ? "ltr" : undefined} className="font-display mt-3 break-all text-2xl font-extrabold group-hover:text-volt-soft">{w.value}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
