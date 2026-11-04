"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/i18n";
import { BOOKING_SELECT, BookingRow, BookingStatus } from "@/lib/portal-types";
import { useAuth } from "@/components/portal/AuthProvider";
import { useDash } from "@/components/portal/DashContext";
import { Empty, Loading, PageHeader, StatusBadge, shortDate } from "@/components/portal/dash-ui";

const FILTERS: ("all" | BookingStatus)[] = ["all", "pending", "confirmed", "active", "completed", "cancelled", "no_show"];

export default function BookingsPage() {
  const { agency } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  useEffect(() => {
    if (!agency) return;
    sb.from("bookings").select(BOOKING_SELECT).eq("agency_id", agency.id).order("created_at", { ascending: false })
      .then(({ data }) => setBookings((data ?? []) as unknown as BookingRow[]));
  }, [agency]);

  if (!bookings) return <Loading />;
  const shown = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <>
      <PageHeader title={t.bookings.title} />
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${filter === f ? "bg-white text-ink" : "glass text-white/75 hover:bg-white/10"}`}>
            {f === "all" ? t.bookings.all : t.status[f]}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty>{t.bookings.empty}</Empty>
      ) : (
        <div className="space-y-3">
          {shown.map((b) => (
            <Link key={b.id} href={`/${lang}/dashboard/bookings/${b.id}`} className="glass grid items-center gap-3 rounded-3xl p-5 transition-colors hover:bg-white/10 sm:grid-cols-[1.4fr_1.2fr_1fr_auto]">
              <div>
                <p className="font-bold">{b.customer?.name ?? t.bookings.unknownCustomer}</p>
                <p className="text-sm text-white/55">{b.car ? `${b.car.make} ${b.car.model} ${b.car.year}` : ""}</p>
              </div>
              <p className="text-sm text-white/70">{shortDate(b.date_from, lang)} → {shortDate(b.date_to, lang)}</p>
              <p className="font-display text-xl font-extrabold">{formatPrice(b.total_price, lang)}</p>
              <StatusBadge status={b.status} label={t.status[b.status]} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
