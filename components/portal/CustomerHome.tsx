"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sb } from "@/lib/supabase-browser";
import { fill, formatPrice } from "@/lib/i18n";
import { CalendarIcon, CarIcon, CheckIcon, CoinsIcon, ShieldIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { Initial, Loading, Stat, StatusBadge, shortDate } from "./dash-ui";
import IdentityCard from "./IdentityCard";

type Row = {
  id: string; date_from: string; date_to: string; total_days: number; total_price: number; status: string;
  cars: { make: string; model: string; year: number; images: string[] | null; agencies: { name: string } | null } | null;
};
const FILTERS = ["all", "pending", "confirmed", "active", "completed", "cancelled", "no_show"] as const;
const DAY = 86_400_000;

/** A renter's home: the next trip, how their identity check stands, a few numbers, and every booking they made. */
export default function CustomerHome() {
  const { user, renter, identity } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const m = t.me;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [today] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); });

  useEffect(() => {
    if (!user) return;
    sb.from("bookings").select("id, date_from, date_to, total_days, total_price, status, cars(make, model, year, images, agencies(name))").eq("customer_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, [user]);

  if (!rows) return <Loading />;
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const countOf = (f: (typeof FILTERS)[number]) => (f === "all" ? rows.length : rows.filter((r) => r.status === f).length);

  // The trip to look forward to: the one in progress, else the soonest confirmed one, else the soonest request still waiting for the agency
  const soonest = (status: string) => rows.filter((r) => r.status === status && new Date(r.date_to).getTime() >= today)
    .sort((a, b) => new Date(a.date_from).getTime() - new Date(b.date_from).getTime())[0];
  const trip = rows.find((r) => r.status === "active") ?? soonest("confirmed") ?? soonest("pending");
  const until = trip ? Math.round((new Date(trip.date_from).setHours(0, 0, 0, 0) - today) / DAY) : 0;
  const when = !trip ? "" : trip.status === "active" ? m.ongoing : until <= 0 ? m.todayLabel : until === 1 ? m.tomorrow : fill(m.inDays, { n: until });
  const completed = rows.filter((r) => r.status === "completed");
  const spent = completed.reduce((sum, r) => sum + r.total_price, 0);
  const photo = trip?.cars?.images?.[0];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-5">
          <Initial name={renter?.name} src={renter?.avatar_url} className="h-16 w-16 text-3xl sm:h-20 sm:w-20" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-fg/50">{dict.nav.account}</p>
            <h1 className="font-display mt-1 text-balance text-3xl font-extrabold uppercase leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-4xl">{renter?.name ?? user?.email}</h1>
            {identity?.status === "approved" ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-go/15 px-3 py-1 text-xs font-bold text-go"><CheckIcon className="h-3.5 w-3.5" /> {m.idApproved}</p>
            ) : identity?.status === "pending" ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warn/15 px-3 py-1 text-xs font-bold text-warn"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warn" /> {m.idPendingShort}</p>
            ) : null}
          </div>
        </div>
        <Link href={`/${lang}#download`} className="on-volt rounded-full bg-volt px-6 py-3 font-bold text-white shadow-lg shadow-volt/30 transition-colors hover:bg-volt-soft">{m.getApp}</Link>
      </div>

      {identity && (identity.status === "none" || identity.status === "rejected") ? <div className="mb-4"><IdentityCard /></div> : null}

      {/* The next trip as a compact card, with the numbers beside it */}
      <div className="grid gap-4 lg:grid-cols-[21rem_minmax(0,1fr)]">
        {trip ? (
          <Link href={`/${lang}/dashboard/bookings/${trip.id}`} className="on-volt group relative isolate flex flex-col justify-between gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-volt-deep to-volt-mid p-5 shadow-xl shadow-volt/15">
            {photo ? <Image src={photo} alt="" fill sizes="21rem" className="-z-10 object-cover" /> : null}
            <span aria-hidden className={`absolute inset-0 -z-10 ${photo ? "bg-black/55 backdrop-blur-[3px]" : "bg-black/20"}`} />
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[11px] font-bold uppercase tracking-wider text-white/75">{trip.status === "pending" ? m.nextPending : m.nextTitle}</span>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-ink">{when}</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-display truncate text-xl font-extrabold leading-tight tracking-tight">{trip.cars ? `${trip.cars.make} ${trip.cars.model}` : "—"}</h2>
              <p className="mt-0.5 truncate text-xs text-white/70">{trip.cars?.agencies?.name}</p>
              <p className="mt-3 flex items-center justify-between gap-2 text-sm font-semibold">
                <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {shortDate(trip.date_from, lang)} → {shortDate(trip.date_to, lang)}</span>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px]">{trip.status === "pending" ? m.waiting : t.status[trip.status as keyof typeof t.status]}</span>
              </p>
            </div>
          </Link>
        ) : (
          <div className="glass flex flex-col justify-between gap-4 rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-volt/15 text-volt-soft"><CarIcon className="h-5 w-5" /></span>
              <h2 className="font-bold leading-tight">{m.noTripTitle}</h2>
            </div>
            <p className="text-sm text-fg/60">{m.noTripText}</p>
            <Link href={`/${lang}/cars`} className="self-start rounded-full border border-fg/15 px-5 py-2 text-sm font-bold transition-colors hover:bg-fg/10">{m.browseCars}</Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label={m.statBookings} value={rows.length} icon={<CalendarIcon className="h-[18px] w-[18px]" />} />
          <Stat label={m.statCompleted} value={completed.length} tone="good" icon={<ShieldIcon className="h-[18px] w-[18px]" />} />
          <Stat label={m.statSpent} value={formatPrice(spent, lang)} icon={<CoinsIcon className="h-[18px] w-[18px]" />} />
        </div>
      </div>

      <h2 className="font-display mb-4 mt-10 text-2xl font-extrabold">{m.allBookings}</h2>
      {rows.length > 0 ? (
        <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
          {FILTERS.filter((f) => f === "all" || countOf(f) > 0).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${filter === f ? "bg-fg text-page" : "glass text-fg/75 hover:bg-fg/10"}`}>
              {f === "all" ? t.bookings.all : t.status[f]} <span className="ms-1 opacity-60">{countOf(f)}</span>
            </button>
          ))}
        </div>
      ) : null}

      {shown.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-fg/15 p-10 text-center">
          <p className="font-semibold">{m.empty}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg/55">{m.emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((b) => (
            <Link key={b.id} href={`/${lang}/dashboard/bookings/${b.id}`} className="glass grid items-center gap-3 rounded-3xl p-4 transition-colors hover:bg-fg/10 sm:grid-cols-[1.6fr_1.1fr_1fr_auto]">
              <div className="flex min-w-0 items-center gap-4">
                <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-fg/10">
                  {b.cars?.images?.[0] ? <Image src={b.cars.images[0]} alt="" fill sizes="80px" className="object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-fg/25"><CarIcon className="h-6 w-6" /></span>}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{b.cars ? `${b.cars.make} ${b.cars.model} ${b.cars.year}` : "—"}</p>
                  <p className="truncate text-sm text-fg/55">{b.cars?.agencies?.name ?? ""}</p>
                </div>
              </div>
              <p className="text-sm text-fg/70">{shortDate(b.date_from, lang)} → {shortDate(b.date_to, lang)} <span className="text-fg/45">· {b.total_days === 1 ? t.common.day : t.common.days.replace("{n}", String(b.total_days))}</span></p>
              <p className="font-display text-xl font-extrabold">{formatPrice(b.total_price, lang)}</p>
              <StatusBadge status={b.status} label={t.status[b.status as keyof typeof t.status]} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
