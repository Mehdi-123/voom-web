import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/dictionaries/fr";
import { formatPrice, Locale } from "@/lib/i18n";
import type { Car } from "@/lib/cars";
import { localizedCityName } from "@/lib/cities";

/** One car: a big photo, the name, the main specs and the price per day. White card, to stand out on dark pages. */
export default function CarCard({ car, lang, dict, className = "" }: { car: Car; lang: Locale; dict: Dictionary; className?: string }) {
  const photo = car.images?.[0];
  const labels = dict.labels;
  const specs = [
    labels.transmission[car.transmission as keyof typeof labels.transmission],
    labels.fuel[car.fuel as keyof typeof labels.fuel],
    `${car.seats} ${dict.car.seats.toLowerCase()}`,
  ].filter(Boolean);

  return (
    <Link
      href={`/${lang}/cars/${car.id}`}
      className={`group flex flex-col overflow-hidden rounded-[2rem] bg-white text-ink shadow-xl shadow-black/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-volt/30 ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper">
        {photo ? (
          <Image src={photo} alt={`${car.make} ${car.model} ${car.year}`} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 85vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">{dict.car.noPhoto}</div>
        )}
        <span className="absolute start-4 top-4 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {labels.category[car.category as keyof typeof labels.category] ?? car.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div>
          <h3 className="font-display text-2xl font-extrabold tracking-tight">{car.make} {car.model}</h3>
          <p className="text-sm text-muted">{car.year} · {localizedCityName(car.city, lang)}</p>
        </div>
        <p className="text-sm text-muted">{specs.join(" · ")}</p>
        <p className="mt-auto flex items-center justify-between pt-2">
          <span><span className="font-display text-2xl font-extrabold text-volt-mid">{formatPrice(car.price_per_day, lang)}</span> <span className="text-sm text-muted">{dict.car.perDay}</span></span>
          <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white transition-colors group-hover:bg-volt rtl:rotate-180">→</span>
        </p>
      </div>
    </Link>
  );
}
