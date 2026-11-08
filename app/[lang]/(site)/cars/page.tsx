import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LOCALES, getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/dictionaries/fr";
import { getCars } from "@/lib/cars";
import { alternatesFor } from "@/lib/seo";
import CarCatalog from "@/components/CarCatalog";
import Reveal from "@/components/Reveal";
import Words from "@/components/Words";

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = (await getDictionary(lang)).catalog;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: alternatesFor("/cars", lang),
    openGraph: { title: t.metaTitle, description: t.metaDescription },
  };
}

/** The cars come from the database and are re-read as they go stale, so they load behind a placeholder while the page around them is already there. */
async function Catalog({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const cars = await getCars();
  return <CarCatalog cars={cars} lang={lang} dict={dict} />;
}

function CatalogFallback() {
  return (
    <div aria-hidden className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[2rem] bg-white" />)}
    </div>
  );
}

export default async function CarsPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <section className="night grain relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"><span className="sweep top-[45%] w-[30rem]" /><span className="sweep top-[75%] w-[20rem]" style={{ animationDelay: "2s" }} /></div>
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-36 sm:pt-44">
          <Reveal as="h1" variant="none" className="font-display max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
            <Words text={dict.catalog.h1} />
          </Reveal>
          <Reveal delay={400}><p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">{dict.catalog.intro}</p></Reveal>
        </div>
      </section>
      <section className="bg-paper px-5 py-12 text-ink sm:py-16">
        <Suspense fallback={<CatalogFallback />}><Catalog lang={lang} dict={dict} /></Suspense>
      </section>
    </>
  );
}
