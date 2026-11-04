"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/i18n";
import { BookingRow } from "@/lib/portal-types";
import { useDash } from "./DashContext";
import { Card, Loading, PageHeader, StatusBadge, shortDate } from "./dash-ui";
import { ErrorNote, GhostButton, PrimaryButton } from "./ui";

type Customer = { name: string | null; phone: string | null };
type Action = { key: string; label: string; run: () => PromiseLike<{ error: { message: string } | null }>; confirm?: string; danger?: boolean };

/** One booking: who, what, when, how much, and the actions that make sense for its status. */
export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const [booking, setBooking] = useState<BookingRow | null | undefined>(undefined);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from("bookings").select("id, car_id, customer_id, date_from, date_to, total_days, price_per_day, service_fee, total_price, status, created_at, car:cars!car_id(make, model, year)").eq("id", id).maybeSingle();
    if (!data) { setBooking(null); return; }
    const row = { ...(data as unknown as BookingRow), customer: null };
    setBooking(row);
    const { data: profile } = await sb.from("profiles").select("name, phone").eq("id", row.customer_id).maybeSingle();
    setCustomer((profile as Customer | null) ?? null);
  }, [id]);

  // fetch on mount: the state is set after the request resolves
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (booking === undefined) return <Loading />;
  if (booking === null) return <p className="text-white/70">{t.bookings.notFound}</p>;

  const setStatus = (status: string) => () => sb.rpc("set_booking_status", { p_booking_id: id, p_new_status: status });
  const cancel = (reason: string) => () => sb.rpc("cancel_booking", { p_booking_id: id, p_reason: reason });

  const actions: Action[] = booking.status === "pending"
    ? [
        { key: "accept", label: t.bookings.accept, run: setStatus("confirmed") },
        { key: "decline", label: t.bookings.decline, run: cancel("agency_declined"), confirm: t.bookings.confirmDecline, danger: true },
      ]
    : booking.status === "confirmed"
      ? [
          { key: "active", label: t.bookings.markActive, run: setStatus("active") },
          { key: "noshow", label: t.bookings.noShow, run: setStatus("no_show"), confirm: t.bookings.confirmNoShow, danger: true },
          { key: "cancel", label: t.bookings.cancel, run: cancel("agency_cancelled"), confirm: t.bookings.confirmCancel, danger: true },
        ]
      : booking.status === "active"
        ? [{ key: "complete", label: t.bookings.complete, run: setStatus("completed") }]
        : [];

  async function perform(action: Action) {
    setBusy(true);
    setError(null);
    const { error: err } = await action.run();
    setBusy(false);
    setAsking(null);
    if (err) { setError(`${t.bookings.actionFailed} ${err.message}`); return; }
    await load();
  }

  const rows: [string, string][] = [
    [t.bookings.customer, customer?.name ?? t.bookings.unknownCustomer],
    [t.bookings.phone, customer?.phone ?? "—"],
    [t.bookings.car, booking.car ? `${booking.car.make} ${booking.car.model} ${booking.car.year}` : "—"],
    [t.bookings.period, `${shortDate(booking.date_from, lang)} → ${shortDate(booking.date_to, lang)} · ${booking.total_days === 1 ? t.common.day : t.common.days.replace("{n}", String(booking.total_days))}`],
    [t.bookings.pricePerDay, formatPrice(booking.price_per_day, lang)],
  ];

  return (
    <>
      <Link href={`/${lang}/dashboard/bookings`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"><span className="rtl:rotate-180">←</span> {t.nav.bookings}</Link>
      <PageHeader title={booking.car ? `${booking.car.make} ${booking.car.model}` : t.bookings.title} action={<StatusBadge status={booking.status} label={t.status[booking.status]} />} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <dl className="divide-y divide-white/10">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-6 py-4">
                <dt className="text-sm text-white/55">{label}</dt>
                <dd className="text-end font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-volt-deep to-volt-mid p-6">
            <p className="text-sm text-white/70">{t.bookings.total}</p>
            <p className="font-display mt-1 text-5xl font-extrabold">{formatPrice(booking.total_price, lang)}</p>
          </div>

          {error ? <ErrorNote>{error}</ErrorNote> : null}

          {actions.map((a) =>
            asking === a.key ? (
              <Card key={a.key} className="space-y-3">
                <p className="font-semibold">{a.confirm}</p>
                <div className="flex gap-3">
                  <PrimaryButton type="button" loading={busy} onClick={() => perform(a)} className={a.danger ? "!bg-[#ff5c3a]" : ""}>{t.bookings.yes}</PrimaryButton>
                  <GhostButton type="button" onClick={() => setAsking(null)} className="w-full">{t.bookings.no}</GhostButton>
                </div>
              </Card>
            ) : a.danger ? (
              <GhostButton key={a.key} type="button" onClick={() => setAsking(a.key)} className="w-full">{a.label}</GhostButton>
            ) : (
              <PrimaryButton key={a.key} type="button" loading={busy} onClick={() => (a.confirm ? setAsking(a.key) : perform(a))}>{a.label}</PrimaryButton>
            ),
          )}
        </div>
      </div>
    </>
  );
}
