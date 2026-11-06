"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sb } from "@/lib/supabase-browser";
import { fill, formatPrice } from "@/lib/i18n";
import { BOOKING_SELECT, BookingRow } from "@/lib/portal-types";
import { useAuth } from "@/components/portal/AuthProvider";
import { useDash } from "@/components/portal/DashContext";
import { CalendarIcon, CarIcon, CoinsIcon, GridIcon, PlusIcon } from "@/components/Icons";
import AdminOverview from "@/components/portal/AdminOverview";
import CustomerHome from "@/components/portal/CustomerHome";
import { Empty, Initial, Loading, Stat, StatusBadge, shortDate } from "@/components/portal/dash-ui";
import ReviewNotice from "@/components/portal/ReviewNotice";

export default function DashboardHome() {
  const { role } = useAuth();
  return role === "admin" ? <AdminOverview /> : role === "customer" ? <CustomerHome /> : <AgencyOverview />;
}

function AgencyOverview() {
  const { agency } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const o = t.overview;
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [fleet, setFleet] = useState<{ total: number; visible: number } | null>(null);
  const [today] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); });

  useEffect(() => {
    if (!agency) return;
    sb.from("bookings").select(BOOKING_SELECT).eq("agency_id", agency.id).order("created_at", { ascending: false })
      .then(({ data }) => setBookings((data ?? []) as unknown as BookingRow[]));
    sb.from("cars").select("id, is_available").eq("agency_id", agency.id)
      .then(({ data }) => setFleet({ total: data?.length ?? 0, visible: data?.filter((c) => c.is_available).length ?? 0 }));
  }, [agency]);

  if (!agency || !bookings) return <Loading />;

  const now = new Date(today);
  const pending = bookings.filter((b) => b.status === "pending");
  const completed = bookings.filter((b) => b.status === "completed");
  const month = completed
    .filter((b) => { const d = new Date(b.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((sum, b) => sum + b.total_price, 0);
  const total = completed.reduce((sum, b) => sum + b.total_price, 0);
  const key = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const monthSum = (k: number) => completed.filter((b) => key(new Date(b.created_at)) === k).reduce((sum, b) => sum + b.total_price, 0);
  const months = Array.from({ length: 6 }, (_, i) => {
    const k = key(now) - (5 - i);
    return { k, value: monthSum(k), label: new Date(Math.floor(k / 12), k % 12, 1).toLocaleDateString(lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-MA", { month: "short" }) };
  });
  const peak = Math.max(...months.map((m) => m.value), 1);
  const diff = months[5].value - months[4].value;

  // Next handovers: confirmed bookings still to be picked up, and rentals in progress still to come back
  const upcoming = [
    ...bookings.filter((b) => b.status === "confirmed" && new Date(b.date_from).getTime() >= today).map((b) => ({ b, kind: "pickup" as const, at: b.date_from })),
    ...bookings.filter((b) => b.status === "active").map((b) => ({ b, kind: "return" as const, at: b.date_to })),
  ].sort((x, y) => new Date(x.at).getTime() - new Date(y.at).getTime()).slice(0, 5);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-5">
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-fg/5 sm:h-20 sm:w-20">
            {agency.logo_url ? <Image src={agency.logo_url} alt="" fill sizes="80px" className="object-cover" /> : <Initial name={agency.name} className="h-full w-full !rounded-2xl text-3xl" />}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-fg/50">{o.eyebrow}</p>
            <h1 className="font-display mt-1 text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{agency.name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg/60">
              <span>{agency.city}</span>
              <StatusBadge status={agency.approval_status} label={t.status[agency.approval_status]} />
            </p>
          </div>
        </div>
        <Link href={`/${lang}/dashboard/fleet/new`} className="inline-flex items-center gap-2 on-volt rounded-full bg-volt px-6 py-3 font-bold text-white shadow-lg shadow-volt/30 transition-colors hover:bg-volt-soft"><PlusIcon className="h-5 w-5" /> {o.addCar}</Link>
      </div>

      {agency.approval_status === "pending" ? <ReviewNotice title={o.reviewTitle} text={o.reviewBanner} steps={o.reviewSteps} /> : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(12.5rem,1fr))] gap-4">
        <Stat label={o.toHandle} value={pending.length} tone="accent" icon={<GridIcon className="h-[18px] w-[18px]" />} />
        <Stat label={o.active} value={bookings.filter((b) => b.status === "active").length} icon={<CalendarIcon className="h-[18px] w-[18px]" />} />
        <Stat label={o.month} value={formatPrice(month, lang)} tone="good" icon={<CoinsIcon className="h-[18px] w-[18px]" />} hint={diff === 0 ? undefined : <span className={diff > 0 ? "text-go" : "text-danger"}>{fill(t.earnings.vs, { diff: `${diff > 0 ? "+" : "−"}${formatPrice(Math.abs(diff), lang)}` })}</span>} />
        <Stat label={o.total} value={formatPrice(total, lang)} icon={<CoinsIcon className="h-[18px] w-[18px]" />} />
      </div>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold">{o.pendingTitle}</h2>
            <Link href={`/${lang}/dashboard/bookings`} className="text-sm font-semibold text-volt-soft hover:underline">{t.common.seeAll}</Link>
          </div>
          {pending.length === 0 ? (
            <Empty>{o.none}</Empty>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map((b) => (
                <Link key={b.id} href={`/${lang}/dashboard/bookings/${b.id}`} className="glass flex items-center gap-4 rounded-3xl p-4 transition-colors hover:bg-fg/10">
                  <Initial name={b.customer?.name} src={b.customer?.avatar_url} className="h-12 w-12 text-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{b.customer?.name ?? t.bookings.unknownCustomer}</p>
                    <p className="truncate text-sm text-fg/55">{b.car ? `${b.car.make} ${b.car.model}` : ""} · {shortDate(b.date_from, lang)} → {shortDate(b.date_to, lang)}</p>
                  </div>
                  <span className="font-display shrink-0 text-lg font-extrabold">{formatPrice(b.total_price, lang)}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-extrabold">{t.earnings.months}</h2>
              <Link href={`/${lang}/dashboard/earnings`} className="text-sm font-semibold text-volt-soft hover:underline">{t.common.seeAll}</Link>
            </div>
            <div className="glass rounded-3xl p-6">
              <div className="flex h-36 items-end gap-3" aria-hidden>
                {months.map((m, i) => (
                  <div key={m.k} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={formatPrice(m.value, lang)}>
                    <span className={`w-full rounded-t-lg ${i === 5 ? "bg-volt" : "bg-volt/35"}`} style={{ height: `${Math.max(m.value > 0 ? 8 : 3, (m.value / peak) * 100)}%` }} />
                    <span className="text-[11px] font-semibold capitalize text-fg/55">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div>
            <h2 className="font-display mb-4 text-2xl font-extrabold">{o.upcomingTitle}</h2>
            {upcoming.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-fg/15 p-8 text-center text-sm text-fg/55">{o.noUpcoming}</div>
            ) : (
              <div className="glass divide-y divide-fg/10 rounded-3xl px-5">
                {upcoming.map(({ b, kind, at }) => (
                  <Link key={`${b.id}-${kind}`} href={`/${lang}/dashboard/bookings/${b.id}`} className="flex items-center gap-4 py-4 transition-colors hover:text-volt-soft">
                    <span className={`flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-center ${kind === "pickup" ? "bg-go/15 text-go" : "bg-warn/15 text-warn"}`}>
                      <span className="text-[10px] font-bold uppercase leading-none">{kind === "pickup" ? o.pickupLabel : o.returnLabel}</span>
                      <span className="mt-1 text-sm font-extrabold leading-none">{shortDate(at, lang)}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{b.customer?.name ?? t.bookings.unknownCustomer}</span>
                      <span className="block truncate text-sm text-fg/55">{b.car ? `${b.car.make} ${b.car.model}` : ""}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href={`/${lang}/dashboard/fleet`} className="glass flex items-center justify-between gap-4 rounded-3xl p-5 transition-colors hover:bg-fg/10">
            <span className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-volt/20 text-volt-soft"><CarIcon className="h-6 w-6" /></span>
              <span>
                <span className="block font-bold">{t.nav.fleet}</span>
                <span className="block text-sm text-fg/55">{fleet ? `${fill(o.fleetCount, { n: fleet.total })} · ${fill(o.carsVisible, { n: fleet.visible })}` : "…"}</span>
              </span>
            </span>
            <span aria-hidden className="text-fg/40 rtl:rotate-180">→</span>
          </Link>
        </section>
      </div>
    </>
  );
}
