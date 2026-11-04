import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, Locale } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";
import Reveal from "@/components/Reveal";

type Terms = { title: string; updated: string; sections: { title: string; body: string }[] };

// The same text as the app's "Terms of use" screen
const load: Record<Locale, () => Promise<Terms>> = {
  fr: () => import("@/dictionaries/terms.fr.json").then((m) => m.default),
  ar: () => import("@/dictionaries/terms.ar.json").then((m) => m.default),
  en: () => import("@/dictionaries/terms.en.json").then((m) => m.default),
};

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const terms = await load[lang]();
  return { title: terms.title, alternates: alternatesFor("/terms", lang) };
}

export default async function TermsPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const terms = await load[lang]();

  return (
    <div className="night px-5 pb-24 pt-40">
      <div className="mx-auto max-w-3xl">
        <Reveal as="h1" variant="none" className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">{terms.title}</Reveal>
        <p className="mt-4 text-white/60">{terms.updated}</p>
        <div className="mt-12 space-y-4">
          {terms.sections.map((s) => (
            <section key={s.title} className="glass rounded-3xl p-7">
              <h2 className="font-display text-xl font-extrabold">{s.title}</h2>
              <p className="mt-3 leading-relaxed text-white/65">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
