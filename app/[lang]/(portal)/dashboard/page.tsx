"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/i18n";
import { BOOKING_SELECT, BookingRow } from "@/lib/portal-types";
import { useAuth } from "@/components/portal/AuthProvider";
import { useDash } from "@/components/portal/DashContext";
import AdminOverview from "@/components/portal/AdminOverview";
import { Empty, Loading, PageHeader, Stat, StatusBadge, shortDate } from "@/components/portal/dash-ui";

export default function DashboardHome() {
  const { role } = useAuth();
  return role === "admin" ? <AdminOverview /> : <AgencyOverview />;
}

function AgencyOverview() {
  const { agency } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);

  useEffect(() => {
    if (!agency) return;
    sb.from("bookings").select(BOOKING_SELECT).eq("agency_id", agency.id).order("created_at", { ascending: false })
      .then(({ data }) => setBookings((data ?? []) as unknown as BookingRow[]));
  }, [agency]);

  if (!agency || !bookings) return <Loading />;

  const now = new Date();
  const pending = bookings.filter((b) => b.status === "pending");
  const completed = bookings.filter((b) => b.status === "completed");
  const month = completed
    .filter((b) => { const d = new Date(b.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((sum, b) => sum + b.total_price, 0);
  const total = completed.reduce((sum, b) => sum + b.total_price, 0);

  return (
    <>
      <PageHeader title={t.overview.hello.replace("{name}", agency.name)} subtitle={t.overview.subtitle} />

      {agency.approval_status === "pending" ? (
        <div className="mb-8 flex items-start gap-4 rounded-3xl border border-volt/40 bg-volt/10 p-5">
          <span aria-hidden className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#ffd166]" />
          <p className="text-white/85">{t.overview.reviewBanner}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.overview.toHandle} value={pending.length} tone="accent" />
        <Stat label={t.overview.active} value={bookings.filter((b) => b.status === "active").length} />
        <Stat label={t.overview.month} value={formatPrice(month, lang)} tone="good" />
        <Stat label={t.overview.total} value={formatPrice(total, lang)} />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{t.overview.pendingTitle}</h2>
          <Link href={`/${lang}/dashboard/bookings`} className="text-sm font-semibold text-volt-soft hover:underline">{t.common.seeAll}</Link>
        </div>
        {pending.length === 0 ? (
          <Empty>{t.overview.none}</Empty>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((b) => (
              <Link key={b.id} href={`/${lang}/dashboard/bookings/${b.id}`} className="glass flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5 transition-colors hover:bg-white/10">
                <div>
                  <p className="font-bold">{t.overview.customerCar.replace("{customer}", b.customer?.name ?? t.bookings.unknownCustomer).replace("{car}", b.car ? `${b.car.make} ${b.car.model}` : "")}</p>
                  <p className="text-sm text-white/55">{shortDate(b.date_from, lang)} → {shortDate(b.date_to, lang)} · {formatPrice(b.total_price, lang)}</p>
                </div>
                <StatusBadge status={b.status} label={t.status[b.status]} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
