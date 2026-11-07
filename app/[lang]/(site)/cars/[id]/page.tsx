import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, fill, formatPrice, getDictionary, hasLocale } from "@/lib/i18n";
import { localizedCityName } from "@/lib/cities";
import { getCar, getCars } from "@/lib/cars";
import { alternatesFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import StoreBadges from "@/components/StoreBadges";
import JsonLd from "@/components/JsonLd";
import CarGallery from "@/components/CarGallery";
import BookingPanel from "@/components/BookingPanel";
import Reveal from "@/components/Reveal";
import BackLink from "@/components/BackLink";

type Props = { params: Promise<{ lang: string; id: string }> };

// Cars are prepared in advance, but one added later is built on first visit: skip the dev-only instant-navigation check
export const instant = false;

/**
 * The cars that exist when the site is built are prepared in advance; a car added later is built the first time someone opens it.
 * With no cars yet, one placeholder keeps the route valid (it simply shows "not found").
 */
export async function generateStaticParams() {
  const ids = (await getCars()).map((c) => c.id);
  return LOCALES.flatMap((lang) => (ids.length ? ids : ["none"]).map((id) => ({ lang, id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params;
  if (!hasLocale(lang)) return {};
  const car = await getCar(id);
  if (!car) return {};
  const dict = await getDictionary(lang);
  const name = `${car.make} ${car.model} ${car.year}`;
  const description = `${name}, ${localizedCityName(car.city, lang)}. ${formatPrice(car.price_per_day, lang)} ${dict.car.perDay}. ${dict.car.bookText}`;
  return {
    title: `${name}, ${localizedCityName(car.city, lang)}`,
    description,
    alternates: alternatesFor(`/cars/${car.id}`, lang),
    openGraph: { title: name, description, images: car.images?.[0] ? [car.images[0]] : undefined },
  };
}

export default async function CarPage({ params }: Props) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const car = await getCar(id);
  if (!car) notFound();
  const dict = await getDictionary(lang);

  const name = `${car.make} ${car.model} ${car.year}`;
  const cityName = localizedCityName(car.city, lang);
  const images = car.images ?? [];
  const labels = dict.labels;
  const category = labels.category[car.category as keyof typeof labels.category] ?? car.category;
  const specs = [
    { label: dict.car.year, value: String(car.year) },
    { label: dict.car.seats, value: String(car.seats) },
    { label: dict.car.fuel, value: labels.fuel[car.fuel as keyof typeof labels.fuel] ?? car.fuel },
    { label: dict.car.transmission, value: labels.transmission[car.transmission as keyof typeof labels.transmission] ?? car.transmission },
    { label: dict.car.category, value: category },
    { label: dict.car.location, value: cityName },
  ];
  const hasReviews = (car.review_count ?? 0) > 0 && (car.rating ?? 0) > 0;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          category: "Car rental",
          image: images,
          brand: { "@type": "Brand", name: car.make },
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/${lang}/cars/${car.id}`,
            priceCurrency: "MAD",
            price: car.price_per_day,
            availability: "https://schema.org/InStock",
            priceSpecification: { "@type": "UnitPriceSpecification", price: car.price_per_day, priceCurrency: "MAD", unitText: "DAY" },
          },
          ...(hasReviews ? { aggregateRating: { "@type": "AggregateRating", ratingValue: car.rating, reviewCount: car.review_count } } : {}),
        }}
      />

      <div className="bg-paper text-ink">
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:pt-40">
        <BackLink href={`/${lang}/cars`} label={dict.dash.common.back} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2 text-sm font-semibold transition-colors hover:bg-line/60">
          <span className="rtl:rotate-180">←</span> {dict.dash.common.back}
        </BackLink>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Reveal variant="none" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <CarGallery
              images={images}
              name={name}
              labels={{ prev: dict.car.photoPrev, next: dict.car.photoNext, close: dict.car.photoClose, open: dict.car.photoOpen, count: dict.car.photoCount, noPhoto: dict.car.noPhoto }}
            />
          </Reveal>

          <aside className="space-y-6">
            <div>
              <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">{name}</h1>
              <p className="mt-3 text-lg text-muted">{cityName}</p>
              {hasReviews ? <p className="mt-2 text-sm font-semibold text-volt-mid">★ {fill(dict.car.rating, { rating: car.rating!.toFixed(1), count: car.review_count! })}</p> : null}
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-volt-deep to-volt-mid p-7 text-white">
              <p className="text-sm text-white/70">{dict.car.from}</p>
              <p className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-extrabold">{formatPrice(car.price_per_day, lang)}</span>
                <span className="text-white/70">{dict.car.perDay}</span>
              </p>
            </div>

            <BookingPanel carId={car.id} pricePerDay={car.price_per_day} minDays={car.min_rental_days ?? 1} lang={lang} labels={dict.book} />

            <dl className="grid grid-cols-2 gap-3">
              {specs.map((s) => (
                <div key={s.label} className="rounded-2xl border border-line bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{s.label}</dt>
                  <dd className="mt-1 font-bold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        {car.features && car.features.length > 0 ? (
          <section className="mt-16">
            <h2 className="font-display mb-5 text-3xl font-extrabold">{dict.car.features}</h2>
            <ul className="flex flex-wrap gap-2">
              {car.features.map((f) => (
                <li key={f} className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold">{labels.options[f] ?? f}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="night relative mt-20 text-white overflow-hidden rounded-[2.5rem] p-8 sm:p-14">
          <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{dict.car.howTitle}</h2>
          <p className="mt-4 max-w-2xl text-lg text-white/65">{dict.car.bookText}</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {dict.how.steps.map((s, i) => (
              <li key={s.title} className="glass rounded-3xl p-6">
                <span className="font-display text-5xl font-extrabold text-volt">{i + 1}</span>
                <p className="mt-2 text-lg font-semibold">{s.title}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10"><StoreBadges dict={dict} /></div>
        </section>
      </div>
      </div>
    </>
  );
}
