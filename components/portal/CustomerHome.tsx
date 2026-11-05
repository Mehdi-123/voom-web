"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sb } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/i18n";
import { CarIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { Loading, PageHeader, StatusBadge, shortDate } from "./dash-ui";
import IdentityCard from "./IdentityCard";

type Row = {
  id: string; date_from: string; date_to: string; total_days: number; total_price: number; status: string;
  cars: { make: string; model: string; year: number; images: string[] | null; agencies: { name: string } | null } | null;
};
const FILTERS = ["all", "pending", "confirmed", "active", "completed", "cancelled", "no_show"] as const;

/** A renter's home: how their identity check stands, and every booking they made. */
export default function CustomerHome() {
  const { user, renter } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const m = t.me;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  useEffect(() => {
    if (!user) return;
    sb.from("bookings").select("id, date_from, date_to, total_days, total_price, status, cars(make, model, year, images, agencies(name))").eq("customer_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, [user]);

  if (!rows) return <Loading />;
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const countOf = (f: (typeof FILTERS)[number]) => (f === "all" ? rows.length : rows.filter((r) => r.status === f).length);
  const first = renter?.name?.split(" ")[0];

  return (
    <>
      <PageHeader
        title={first ? t.overview.hello.replace("{name}", first) : m.title}
        subtitle={m.subtitle}
        action={<Link href={`/${lang}#download`} className="rounded-full bg-volt px-6 py-3 font-bold text-white shadow-lg shadow-volt/30 transition-colors hover:bg-volt-soft">{m.getApp}</Link>}
      />
      <div className="mb-8"><IdentityCard /></div>

      <h2 className="font-display mb-4 text-2xl font-extrabold">{m.title}</h2>
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
