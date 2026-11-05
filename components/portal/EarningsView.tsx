"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase-browser";
import { fill, formatPrice } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { Card, Empty, Loading, PageHeader, Stat, shortDate } from "./dash-ui";

type Row = { id: string; total_price: number; created_at: string; date_from: string; date_to: string; car: { make: string; model: string } | null };

const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/** What the agency earned from completed bookings, month by month (the same figures as the app's Earnings tab). */
export default function EarningsView() {
  const { agency } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash.earnings;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [now] = useState(() => new Date());

  useEffect(() => {
    if (!agency) return;
    sb.from("bookings").select("id, total_price, created_at, date_from, date_to, car:cars!car_id(make, model)").eq("agency_id", agency.id).eq("status", "completed").order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, [agency]);

  if (!rows) return <Loading />;

  const total = rows.reduce((sum, r) => sum + r.total_price, 0);
  const sumFor = (key: number) => rows.filter((r) => monthKey(new Date(r.created_at)) === key).reduce((sum, r) => sum + r.total_price, 0);
  const current = monthKey(now);
  const thisMonth = sumFor(current);
  const lastMonth = sumFor(current - 1);
  const avg = rows.length ? Math.round(total / rows.length) : 0;
  const diff = thisMonth - lastMonth;

  const months = Array.from({ length: 6 }, (_, i) => {
    const key = current - (5 - i);
    const date = new Date(Math.floor(key / 12), key % 12, 1);
    return { key, label: date.toLocaleDateString(lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-MA", { month: "short" }), value: sumFor(key) };
  });
  const max = Math.max(...months.map((m) => m.value), 1);

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="on-volt relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-volt-deep to-volt-mid p-8 shadow-2xl shadow-volt/20 lg:col-span-2">
          <span aria-hidden className="absolute -end-16 -top-16 -z-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs font-bold uppercase tracking-wider text-white/70">{t.allTime}</p>
          <p className="font-display mt-3 text-4xl font-extrabold leading-none tracking-tight [overflow-wrap:anywhere] sm:text-6xl xl:text-7xl">{formatPrice(total, lang)}</p>
          <p className="mt-4 text-sm text-white/70">{t.trips}: {rows.length}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Stat label={t.thisMonth} value={formatPrice(thisMonth, lang)} tone="good" />
          <Stat label={t.avg} value={formatPrice(avg, lang)} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="!p-7">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-fg/60">{t.months}</h2>
            <p className={`text-sm font-bold ${diff >= 0 ? "text-go" : "text-danger"}`}>{fill(t.vs, { diff: `${diff >= 0 ? "+" : "−"}${formatPrice(Math.abs(diff), lang)}` })}</p>
          </div>
          <div className="flex h-56 items-end gap-3">
            {months.map((m) => (
              <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={formatPrice(m.value, lang)}>
                <span className="text-[11px] font-semibold text-fg/55">{m.value > 0 ? Math.round(m.value).toLocaleString(lang === "en" ? "en-GB" : "fr-MA") : ""}</span>
                <span className={`w-full rounded-t-xl transition-all ${m.key === current ? "bg-volt" : "bg-volt/35"}`} style={{ height: `${Math.max(m.value > 0 ? 6 : 2, (m.value / max) * 100)}%` }} />
                <span className="text-xs font-semibold capitalize text-fg/60">{m.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-fg/45">{t.lastMonth}: {formatPrice(lastMonth, lang)}</p>
        </Card>

        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-fg/60">{t.recent}</h2>
          {rows.length === 0 ? <Empty>{t.none}</Empty> : (
            <div className="glass divide-y divide-fg/10 rounded-[2rem] px-5">
              {rows.slice(0, 7).map((r) => (
                <Link key={r.id} href={`/${lang}/dashboard/bookings/${r.id}`} className="flex items-center justify-between gap-3 py-4 transition-colors hover:text-volt-soft">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{r.car ? `${r.car.make} ${r.car.model}` : "—"}</span>
                    <span className="block text-xs text-fg/50">{shortDate(r.date_from, lang)} → {shortDate(r.date_to, lang)}</span>
                  </span>
                  <span className="font-display shrink-0 font-extrabold text-go">+{formatPrice(r.total_price, lang)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
