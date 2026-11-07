"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sb } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/i18n";
import type { CarRow } from "@/lib/portal-types";
import { useAuth } from "@/components/portal/AuthProvider";
import { useDash } from "@/components/portal/DashContext";
import { Empty, Loading, PageHeader, StatusBadge } from "@/components/portal/dash-ui";
import { ErrorNote, GhostButton } from "@/components/portal/ui";
import { CarIcon, PlusIcon, StarIcon } from "@/components/Icons";

export default function FleetList() {
  const { agency } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const [cars, setCars] = useState<CarRow[] | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!agency) return;
    const { data } = await sb.from("cars").select("*").eq("agency_id", agency.id).order("created_at", { ascending: false });
    setCars((data ?? []) as CarRow[]);
  }, [agency]);

  // fetch on mount: the state is set after the request resolves
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function toggle(car: CarRow) {
    await sb.from("cars").update({ is_available: !car.is_available }).eq("id", car.id);
    load();
  }

  async function remove(car: CarRow) {
    setError(null);
    const { error: err } = await sb.from("cars").delete().eq("id", car.id);
    setAsking(null);
    if (err) { setError(t.fleet.deleteFailed); return; }
    load();
  }

  if (!cars) return <Loading />;

  return (
    <>
      <PageHeader
        title={t.fleet.title}
        action={<Link href={`/${lang}/dashboard/fleet/new`} className="inline-flex items-center gap-2 on-volt rounded-full bg-volt px-6 py-3 font-bold text-white shadow-lg shadow-volt/30 transition-colors hover:bg-volt-soft"><PlusIcon className="h-5 w-5" /> {t.fleet.add}</Link>}
      />
      {agency?.approval_status === "pending" ? <p className="mb-6 text-sm text-fg/60">{t.fleet.reviewNote}</p> : null}
      {error ? <div className="mb-6"><ErrorNote>{error}</ErrorNote></div> : null}

      {cars.length === 0 ? (
        <Empty>{t.fleet.empty}</Empty>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cars.map((car) => (
            <div key={car.id} className="glass flex flex-col overflow-hidden rounded-3xl">
              <div className="relative aspect-[4/3] bg-fg/5">
                {car.images?.[0] ? <Image src={car.images[0]} alt={`${car.make} ${car.model}`} fill sizes="(min-width: 1280px) 30vw, 50vw" className="object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-fg/20"><CarIcon className="h-16 w-16" /></span>}
                <span className="absolute start-3 top-3 flex rounded-full bg-page shadow-md"><StatusBadge status={car.is_available ? "approved" : "cancelled"} label={car.is_available ? t.fleet.visible : t.fleet.hidden} /></span>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <h2 className="font-display text-2xl font-extrabold">{car.make} {car.model}</h2>
                  <p className="text-sm text-fg/55">{car.year} · {car.city}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold text-fg/70">
                    {[
                      dict.labels.category[car.category as keyof typeof dict.labels.category] ?? car.category,
                      dict.labels.transmission[car.transmission as keyof typeof dict.labels.transmission],
                      dict.labels.fuel[car.fuel as keyof typeof dict.labels.fuel],
                      `${car.seats} ${dict.car.seats.toLowerCase()}`,
                    ].filter(Boolean).map((chip) => <span key={chip} className="rounded-full bg-fg/10 px-2.5 py-1">{chip}</span>)}
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-fg/60">
                    <StarIcon filled className="h-4 w-4 text-warn" />
                    {car.review_count ? `${Number(car.rating ?? 0).toFixed(1)} · ${t.fleet.reviewsCount.replace("{n}", String(car.review_count))}` : t.fleet.noRating}
                  </p>
                  <p className="mt-2 font-display text-xl font-extrabold text-volt-soft">{formatPrice(car.price_per_day, lang)} <span className="text-sm font-normal text-fg/50">{dict.car.perDay}</span></p>
                </div>
                {asking === car.id ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">{t.fleet.deleteConfirm}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => remove(car)} className="h-11 flex-1 rounded-xl bg-[#ff5c3a] font-bold text-white">{t.bookings.yes}</button>
                      <GhostButton type="button" onClick={() => setAsking(null)} className="!h-11 flex-1">{t.bookings.no}</GhostButton>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto flex flex-wrap gap-2">
                    {car.is_available && agency?.approval_status === "approved" ? <Link href={`/${lang}/cars/${car.id}`} target="_blank" className="flex h-11 w-full items-center justify-center rounded-xl border border-fg/15 px-4 text-sm font-semibold text-volt-soft transition-colors hover:bg-fg/10">{t.fleet.viewOnSite} ↗</Link> : null}
                    <Link href={`/${lang}/dashboard/fleet/${car.id}`} className="flex h-11 flex-1 items-center justify-center rounded-xl bg-fg/10 px-4 text-sm font-bold transition-colors hover:bg-fg/15">{t.fleet.edit}</Link>
                    <button type="button" onClick={() => toggle(car)} className="h-11 flex-1 rounded-xl border border-fg/15 px-4 text-sm font-semibold transition-colors hover:bg-fg/10">{car.is_available ? t.fleet.hidden : t.fleet.visible}</button>
                    <button type="button" onClick={() => setAsking(car.id)} aria-label={t.fleet.delete} className="h-11 rounded-xl border border-fg/15 px-4 text-sm font-semibold text-danger transition-colors hover:bg-fg/10">{t.fleet.delete}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
