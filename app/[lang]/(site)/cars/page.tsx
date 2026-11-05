import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LOCALES, getDictionary, hasLocale } from "@/lib/i18n";
import { getCars } from "@/lib/cars";
import { alternatesFor } from "@/lib/seo";
import CarCatalog from "@/components/CarCatalog";
import Reveal from "@/components/Reveal";
import LightHeader from "@/components/LightHeader";
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

export default async function CarsPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const cars = await getCars();

  return (
    <>
      <div className="bg-paper text-ink">
        <LightHeader />
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-32 sm:pt-40">
          <Reveal as="h1" variant="none" className="font-display max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            <Words text={dict.catalog.h1} />
          </Reveal>
          <Reveal delay={400}><p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{dict.catalog.intro}</p></Reveal>
        </div>
        <section className="px-5 pb-16 sm:pb-20">
          <Suspense fallback={null}><CarCatalog cars={cars} lang={lang} dict={dict} /></Suspense>
        </section>
      </div>
    </>
  );
}
