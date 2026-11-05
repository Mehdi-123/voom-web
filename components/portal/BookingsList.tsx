"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sb } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/i18n";
import { BOOKING_SELECT, BookingRow, BookingStatus } from "@/lib/portal-types";
import { useAuth } from "@/components/portal/AuthProvider";
import { useDash } from "@/components/portal/DashContext";
import { Empty, Loading, PageHeader, StatusBadge, shortDate } from "@/components/portal/dash-ui";
import { fill } from "@/lib/i18n";
import { CarIcon } from "@/components/Icons";

const FILTERS: ("all" | BookingStatus)[] = ["all", "pending", "confirmed", "active", "completed", "cancelled", "no_show"];

export default function BookingsList() {
  const { agency } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!agency) return;
    sb.from("bookings").select(BOOKING_SELECT).eq("agency_id", agency.id).order("created_at", { ascending: false })
      .then(({ data }) => setBookings((data ?? []) as unknown as BookingRow[]));
  }, [agency]);

  if (!bookings) return <Loading />;
  const needle = query.trim().toLowerCase();
  const shown = bookings
    .filter((b) => filter === "all" || b.status === filter)
    .filter((b) => !needle || `${b.customer?.name ?? ""} ${b.car?.make ?? ""} ${b.car?.model ?? ""}`.toLowerCase().includes(needle));
  const countOf = (f: (typeof FILTERS)[number]) => (f === "all" ? bookings.length : bookings.filter((b) => b.status === f).length);

  return (
    <>
      <PageHeader title={t.bookings.title} subtitle={fill(t.bookings.count, { n: bookings.length })} />
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.bookings.search} aria-label={t.bookings.search} className="mb-4 h-12 w-full rounded-2xl border border-fg/15 bg-fg/5 px-5 text-base outline-none placeholder:text-fg/40 focus:border-volt sm:max-w-md" />
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${filter === f ? "bg-fg text-page" : "glass text-fg/75 hover:bg-fg/10"}`}>
            {f === "all" ? t.bookings.all : t.status[f]} <span className="ms-1 opacity-60">{countOf(f)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty>{bookings.length === 0 ? t.bookings.empty : t.bookings.noMatch}</Empty>
      ) : (
        <div className="space-y-3">
          {shown.map((b) => (
            <Link key={b.id} href={`/${lang}/dashboard/bookings/${b.id}`} className="glass grid items-center gap-3 rounded-3xl p-4 transition-colors hover:bg-fg/10 sm:grid-cols-[1.6fr_1.1fr_1fr_auto]">
              <div className="flex min-w-0 items-center gap-4">
                <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-fg/10">
                  {b.car?.images?.[0] ? <Image src={b.car.images[0]} alt="" fill sizes="80px" className="object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-fg/25"><CarIcon className="h-6 w-6" /></span>}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{b.customer?.name ?? t.bookings.unknownCustomer}</p>
                  <p className="truncate text-sm text-fg/55">{b.car ? `${b.car.make} ${b.car.model} ${b.car.year}` : ""}</p>
                </div>
              </div>
              <p className="text-sm text-fg/70">{shortDate(b.date_from, lang)} → {shortDate(b.date_to, lang)} <span className="text-fg/45">· {b.total_days === 1 ? t.common.day : t.common.days.replace("{n}", String(b.total_days))}</span></p>
              <p className="font-display text-xl font-extrabold">{formatPrice(b.total_price, lang)}</p>
              <StatusBadge status={b.status} label={t.status[b.status]} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
