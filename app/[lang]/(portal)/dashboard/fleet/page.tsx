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
import { PlusIcon } from "@/components/Icons";

export default function FleetPage() {
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
        action={<Link href={`/${lang}/dashboard/fleet/new`} className="inline-flex items-center gap-2 rounded-full bg-volt px-6 py-3 font-bold shadow-lg shadow-volt/30 transition-colors hover:bg-volt-soft"><PlusIcon className="h-5 w-5" /> {t.fleet.add}</Link>}
      />
      {agency?.approval_status === "pending" ? <p className="mb-6 text-sm text-white/60">{t.fleet.reviewNote}</p> : null}
      {error ? <div className="mb-6"><ErrorNote>{error}</ErrorNote></div> : null}

      {cars.length === 0 ? (
        <Empty>{t.fleet.empty}</Empty>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cars.map((car) => (
            <div key={car.id} className="glass flex flex-col overflow-hidden rounded-3xl">
              <div className="relative aspect-[4/3] bg-white/5">
                {car.images?.[0] ? <Image src={car.images[0]} alt={`${car.make} ${car.model}`} fill sizes="(min-width: 1280px) 30vw, 50vw" className="object-cover" /> : null}
                <span className="absolute start-3 top-3"><StatusBadge status={car.is_available ? "approved" : "cancelled"} label={car.is_available ? t.fleet.visible : t.fleet.hidden} /></span>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <h2 className="font-display text-2xl font-extrabold">{car.make} {car.model}</h2>
                  <p className="text-sm text-white/55">{car.year} · {car.city}</p>
                  <p className="mt-2 font-display text-xl font-extrabold text-volt-soft">{formatPrice(car.price_per_day, lang)} <span className="text-sm font-normal text-white/50">{dict.car.perDay}</span></p>
                </div>
                {asking === car.id ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">{t.fleet.deleteConfirm}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => remove(car)} className="h-11 flex-1 rounded-xl bg-[#ff5c3a] font-bold">{t.bookings.yes}</button>
                      <GhostButton type="button" onClick={() => setAsking(null)} className="!h-11 flex-1">{t.bookings.no}</GhostButton>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link href={`/${lang}/dashboard/fleet/${car.id}`} className="flex h-11 flex-1 items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-bold transition-colors hover:bg-white/15">{t.fleet.edit}</Link>
                    <button type="button" onClick={() => toggle(car)} className="h-11 flex-1 rounded-xl border border-white/15 px-4 text-sm font-semibold transition-colors hover:bg-white/10">{car.is_available ? t.fleet.hidden : t.fleet.visible}</button>
                    <button type="button" onClick={() => setAsking(car.id)} aria-label={t.fleet.delete} className="h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold text-[#ff8a6e] transition-colors hover:bg-white/10">{t.fleet.delete}</button>
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
