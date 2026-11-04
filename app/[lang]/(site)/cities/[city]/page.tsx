import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES, fill, getDictionary, hasLocale } from "@/lib/i18n";
import { CITIES, cityBySlug } from "@/lib/cities";
import { getCars } from "@/lib/cars";
import { alternatesFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import CarCard from "@/components/CarCard";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import Words from "@/components/Words";

type Props = { params: Promise<{ lang: string; city: string }> };

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => CITIES.map((c) => ({ lang, city: c.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, city: slug } = await params;
  const city = cityBySlug(slug);
  if (!hasLocale(lang) || !city) return {};
  const dict = await getDictionary(lang);
  const name = city.names[lang];
  const title = fill(dict.city.h1, { city: name });
  return {
    title,
    description: fill(dict.city.intro, { city: name }),
    alternates: alternatesFor(`/cities/${city.slug}`, lang),
    openGraph: { title, description: fill(dict.city.intro, { city: name }) },
  };
}

export default async function CityPage({ params }: Props) {
  const { lang, city: slug } = await params;
  const city = cityBySlug(slug);
  if (!hasLocale(lang) || !city) notFound();
  const dict = await getDictionary(lang);
  const name = city.names[lang];
  const cars = await getCars({ city });
  const count = fill(cars.length === 1 ? dict.city.countOne : dict.city.countMany, { count: cars.length });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Voom", item: `${SITE_URL}/${lang}` },
            { "@type": "ListItem", position: 2, name, item: `${SITE_URL}/${lang}/cities/${city.slug}` },
          ],
        }}
      />
      <section className="night grain relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"><span className="sweep top-[40%] w-[30rem]" /><span className="sweep top-[70%] w-[20rem]" style={{ animationDelay: "2s" }} /></div>
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-40 sm:pt-48">
          <Reveal as="h1" variant="none" className="font-display max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            <Words text={fill(dict.city.h1, { city: name })} />
          </Reveal>
          <Reveal delay={400}><p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">{fill(dict.city.intro, { city: name })}</p></Reveal>
          {cars.length > 0 ? <Reveal delay={550}><p className="glass mt-8 inline-block rounded-full px-5 py-2 text-sm font-semibold text-volt-soft">{count}</p></Reveal> : null}
        </div>
      </section>

      <section className="bg-paper px-5 py-20 text-ink">
        <div className="mx-auto max-w-6xl">
          {cars.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cars.map((car, i) => <Reveal key={car.id} delay={(i % 3) * 90}><CarCard car={car} lang={lang} dict={dict} className="h-full" /></Reveal>)}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-line bg-white p-14 text-center">
              <h2 className="font-display text-3xl font-extrabold">{dict.city.noneTitle}</h2>
              <p className="mx-auto mt-3 max-w-md text-muted">{fill(dict.city.noneText, { city: name })}</p>
            </div>
          )}
        </div>
      </section>

      <Faq title={fill(dict.city.faqTitle, { city: name })} items={dict.city.faq.map((f) => ({ q: fill(f.q, { city: name }), a: fill(f.a, { city: name }) }))} />

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="font-display mb-6 text-2xl font-extrabold">{dict.city.otherCities}</h2>
        <div className="flex flex-wrap gap-2">
          {CITIES.filter((c) => c.slug !== city.slug).map((c) => (
            <Link key={c.slug} href={`/${lang}/cities/${c.slug}`} className="glass rounded-full px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-volt">
              {c.names[lang]}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
