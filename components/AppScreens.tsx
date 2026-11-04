import type { Dictionary } from "@/dictionaries/fr";
import { localizedCityName } from "@/lib/cities";
import type { Locale } from "@/lib/i18n";

/** A tiny line drawing of a car, tinted by the card it sits on. */
function CarArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 52" fill="none" className={className} aria-hidden>
      <path d="M6 36v-8c0-3 2-5 5-6l14-3 12-12c2-2 4-3 7-3h26c3 0 6 1 8 3l14 12 12 3c4 1 6 4 6 7v7c0 2-2 4-4 4h-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,.18)" />
      <path d="M34 22l10-9h24l11 9z" fill="rgba(255,255,255,.4)" />
      <circle cx="32" cy="40" r="8" fill="#13121f" stroke="currentColor" strokeWidth="3" />
      <circle cx="92" cy="40" r="8" fill="#13121f" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

type Props = { dict: Dictionary; lang: Locale };

/** Screen 1 of the app: the dark header with the city, and cars to choose from. */
export function ExploreScreen({ dict, lang }: Props) {
  const m = dict.mock;
  const cars = [
    { name: m.car1, price: "250", hue: "from-[#5a39b8] to-[#a259ff]" },
    { name: m.car2, price: "320", hue: "from-[#1d6b8f] to-[#06d6a0]" },
    { name: m.car3, price: "540", hue: "from-[#8f1d5a] to-[#ff7ab8]" },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="bg-[#13121f] px-5 pb-6 pt-12 text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold">● {localizedCityName("Casablanca", lang)}</span>
        <p className="font-display mt-3 text-xl font-extrabold leading-tight">{m.explore}</p>
      </div>
      <div className="-mt-3 flex-1 space-y-3 rounded-t-3xl bg-[#f0f0f0] p-4">
        {cars.map((c) => (
          <div key={c.name} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className={`flex h-20 items-center justify-center bg-gradient-to-br text-white ${c.hue}`}><CarArt className="h-12 w-24" /></div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] font-bold">{c.name}</span>
              <span className="text-[11px] font-extrabold text-volt-mid">{c.price} MAD <span className="font-normal text-muted">{m.perDay}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Screen 2: dates chosen, the price, and the send button. */
export function RequestScreen({ dict }: Props) {
  const m = dict.mock;
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#5a39b8] to-[#a259ff] pt-8 text-white"><CarArt className="h-20 w-40" /></div>
      <div className="flex-1 space-y-4 rounded-t-3xl bg-[#f0f0f0] p-5">
        <p className="font-display -mt-1 text-lg font-extrabold">{m.car1}</p>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-xl bg-white p-3"><span className="text-muted">{m.dates}</span><p className="mt-0.5 text-sm font-bold">{m.days}</p></div>
          <div className="rounded-xl bg-white p-3"><span className="text-muted">{m.total}</span><p className="mt-0.5 text-sm font-extrabold text-volt-mid">750 MAD</p></div>
        </div>
        <div className="rounded-2xl bg-volt py-3 text-center text-xs font-bold text-white">{m.request}</div>
      </div>
    </div>
  );
}

/** Screen 3: the agency confirmed. */
export function ConfirmedScreen({ dict }: Props) {
  const m = dict.mock;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f0f0f0] px-6 text-center">
      <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-go text-white">
        <span aria-hidden className="absolute inset-0 rounded-full bg-go" style={{ animation: "pulse-ring 2.4s ease-out infinite" }} />
        <svg viewBox="0 0 24 24" className="relative h-10 w-10" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <p className="font-display text-lg font-extrabold">{m.confirmed}</p>
      <span className="rounded-full bg-go/15 px-3 py-1 text-[10px] font-bold text-[#05a07a]">✓ {m.verified}</span>
      <div className="w-full rounded-2xl bg-white p-4 text-[11px]">
        <p className="font-bold">{m.pickup}</p>
        <p className="mt-1 text-muted">{m.payOnSite} · 750 MAD</p>
      </div>
    </div>
  );
}
