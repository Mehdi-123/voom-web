"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/i18n";
import { BOOKING_SELECT, BookingRow } from "@/lib/portal-types";
import { StarIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { BookingProgress, Card, Initial, Loading, PageHeader, StatusBadge, shortDate } from "./dash-ui";
import { ErrorNote, GhostButton, PrimaryButton } from "./ui";

type Customer = { name: string | null; phone: string | null; strike_count: number | null };
type Extra = { cancelled_by: string | null };
type Review = { id: string; rating: number; comment: string | null };
type Action = { key: string; label: string; run: () => PromiseLike<{ error: { message: string } | null }>; confirm?: string; danger?: boolean };

/** One booking: who, what, when, how much, where it stands, the actions that fit its status, and the rating once it is over. */
export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, agency } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const b = t.bookings;
  const [booking, setBooking] = useState<BookingRow | null | undefined>(undefined);
  const [extra, setExtra] = useState<Extra>({ cancelled_by: null });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [rateError, setRateError] = useState<string | null>(null);
  const [rating, setRating] = useState(false);
  const [asking, setAsking] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from("bookings").select(`${BOOKING_SELECT}, cancelled_by`).eq("id", id).maybeSingle();
    if (!data) { setBooking(null); return; }
    const row = data as unknown as BookingRow & Extra;
    setBooking({ ...row, customer: null });
    setExtra({ cancelled_by: row.cancelled_by ?? null });
    const { data: profile } = await sb.from("profiles").select("name, phone, strike_count").eq("id", row.customer_id).maybeSingle();
    setCustomer((profile as Customer | null) ?? null);
    if (row.status === "completed" && user) {
      const { data: mine } = await sb.from("reviews").select("id, rating, comment").eq("booking_id", id).eq("author_id", user.id).eq("reviewer_type", "agency").maybeSingle();
      setReview((mine as Review | null) ?? null);
    }
  }, [id, user]);

  // fetch on mount: the state is set after the request resolves
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (booking === undefined) return <Loading />;
  if (booking === null) return <p className="text-fg/70">{b.notFound}</p>;

  const setStatus = (status: string) => () => sb.rpc("set_booking_status", { p_booking_id: id, p_new_status: status });
  const cancel = (reason: string) => () => sb.rpc("cancel_booking", { p_booking_id: id, p_reason: reason });

  const actions: Action[] = booking.status === "pending"
    ? [
        { key: "accept", label: b.accept, run: setStatus("confirmed") },
        { key: "decline", label: b.decline, run: cancel("agency_declined"), confirm: b.confirmDecline, danger: true },
      ]
    : booking.status === "confirmed"
      ? [
          { key: "active", label: b.markActive, run: setStatus("active") },
          { key: "noshow", label: b.noShow, run: setStatus("no_show"), confirm: b.confirmNoShow, danger: true },
          { key: "cancel", label: b.cancel, run: cancel("agency_cancelled"), confirm: b.confirmCancel, danger: true },
        ]
      : booking.status === "active"
        ? [{ key: "complete", label: b.complete, run: setStatus("completed") }]
        : [];

  async function perform(action: Action) {
    setBusy(true);
    setError(null);
    const { error: err } = await action.run();
    setBusy(false);
    setAsking(null);
    if (err) { setError(`${b.actionFailed} ${err.message}`); return; }
    await load();
  }

  async function sendRating() {
    if (stars === 0) { setRateError(b.pickStar); return; }
    if (!user || !agency || !booking) return;
    setRating(true);
    setRateError(null);
    const { data, error: err } = await sb.from("reviews").insert({
      booking_id: booking.id, author_id: user.id, car_id: booking.car_id, rating: stars, comment: comment.trim() || null, reviewer_type: "agency",
      agency_id: agency?.id,
    }).select("id, rating, comment").maybeSingle();
    setRating(false);
    if (err || !data) { setRateError(b.rateFailed); return; }
    setReview(data as Review);
  }

  async function copyPhone() {
    if (!customer?.phone) return;
    try { await navigator.clipboard.writeText(customer.phone); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  }

  const strikes = customer?.strike_count ?? 0;
  const strikeTone = strikes === 0 ? "bg-go/15 text-go" : strikes === 1 ? "bg-warn/15 text-warn" : "bg-danger/15 text-danger";
  const photo = booking.car?.images?.[0];
  const stopped = booking.status === "cancelled" || booking.status === "no_show";
  const duration = booking.total_days === 1 ? t.common.day : t.common.days.replace("{n}", String(booking.total_days));
  const rows: [string, string][] = [
    [b.car, booking.car ? `${booking.car.make} ${booking.car.model} ${booking.car.year}` : "—"],
    [b.period, `${shortDate(booking.date_from, lang)} → ${shortDate(booking.date_to, lang)}`],
    [b.duration, duration],
    [b.requestedOn, shortDate(booking.created_at, lang)],
    [b.reference, `#${booking.id.slice(0, 8).toUpperCase()}`],
  ];

  return (
    <>
      <Link href={`/${lang}/dashboard/bookings`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-fg/70 hover:text-fg"><span className="rtl:rotate-180">←</span> {t.nav.bookings}</Link>
      <PageHeader title={booking.car ? `${booking.car.make} ${booking.car.model}` : b.title} action={<StatusBadge status={booking.status} label={t.status[booking.status]} />} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* Who is renting */}
          <Card>
            <div className="flex flex-wrap items-center gap-4">
              <Initial name={customer?.name} className="h-14 w-14 text-2xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold">{customer?.name ?? b.unknownCustomer}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${strikeTone}`}>{b.strikes}: {strikes}/3</span>
                </div>
              </div>
              <Link href={`/${lang}/dashboard/customers/${booking.customer_id}`} className="basis-full rounded-full border border-fg/15 px-5 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-fg/10 sm:basis-auto">{b.customerProfile}</Link>
            </div>
            {customer?.phone ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-fg/5 px-5 py-3.5">
                <a href={`tel:${customer.phone.replace(/\s/g, "")}`} dir="ltr" className="font-semibold hover:text-volt-soft">{customer.phone}</a>
                <button type="button" onClick={copyPhone} className="text-sm font-semibold text-volt-soft hover:underline">{copied ? `✓ ${b.copied}` : b.copy}</button>
              </div>
            ) : null}
          </Card>

          {/* The car and the dates */}
          <Card className="!p-0 overflow-hidden">
            {photo ? <div className="relative aspect-[16/7] bg-fg/5"><Image src={photo} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" /></div> : null}
            <dl className="divide-y divide-fg/10 px-6">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-6 py-4">
                  <dt className="text-sm text-fg/55">{label}</dt>
                  <dd className="text-end font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Where it stands */}
          <Card>
            <h2 className="mb-5 text-xs font-bold uppercase tracking-wider text-fg/60">{b.progress}</h2>
            {stopped ? (
              <p className={`rounded-2xl px-5 py-4 font-semibold ${booking.status === "no_show" ? "bg-danger/15 text-danger" : "bg-fg/10"}`}>
                {booking.status === "no_show" ? t.status.no_show : extra.cancelled_by === "customer" ? b.cancelledByCustomer : b.cancelledByAgency}
              </p>
            ) : (
              <BookingProgress status={booking.status} labels={[b.stepRequested, b.stepConfirmed, b.stepPickedUp, b.stepCompleted]} />
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {/* The money */}
          <div className="on-volt rounded-3xl bg-gradient-to-br from-volt-deep to-volt-mid p-6">
            <p className="text-sm text-white/70">{b.total}</p>
            <p className="font-display mt-1 text-5xl font-extrabold">{formatPrice(booking.total_price, lang)}</p>
            <dl className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-white/70">{formatPrice(booking.price_per_day, lang)} × {duration}</dt><dd className="font-semibold">{formatPrice(booking.price_per_day * booking.total_days, lang)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/70">{b.serviceFee}</dt><dd className="font-semibold">{formatPrice(booking.service_fee, lang)}</dd></div>
            </dl>
            <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/80">{b.payAtAgency}</p>
          </div>

          {error ? <ErrorNote>{error}</ErrorNote> : null}

          {actions.map((a) =>
            asking === a.key ? (
              <Card key={a.key} className="space-y-3">
                <p className="font-semibold">{a.confirm}</p>
                <div className="flex gap-3">
                  <PrimaryButton type="button" loading={busy} onClick={() => perform(a)} className={a.danger ? "!bg-[#ff5c3a]" : ""}>{b.yes}</PrimaryButton>
                  <GhostButton type="button" onClick={() => setAsking(null)} className="w-full">{b.no}</GhostButton>
                </div>
              </Card>
            ) : a.danger ? (
              <GhostButton key={a.key} type="button" onClick={() => setAsking(a.key)} className="w-full">{a.label}</GhostButton>
            ) : (
              <PrimaryButton key={a.key} type="button" loading={busy} onClick={() => (a.confirm ? setAsking(a.key) : perform(a))}>{a.label}</PrimaryButton>
            ),
          )}

          {/* Rate the customer once the rental is over */}
          {booking.status === "completed" ? (
            <Card className="space-y-4">
              <h2 className="font-bold">{review ? b.rateDone : b.rateTitle}</h2>
              <div className="flex gap-1" role="radiogroup" aria-label={b.rateTitle}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" disabled={!!review} onClick={() => { setStars(i); setRateError(null); }} role="radio" aria-checked={i <= (review?.rating ?? stars)} aria-label={`${i}`} className="p-0.5 text-warn transition-transform enabled:hover:scale-110 disabled:cursor-default">
                    <StarIcon filled={i <= (review?.rating ?? stars)} className={`h-8 w-8 ${i <= (review?.rating ?? stars) ? "" : "text-fg/25"}`} />
                  </button>
                ))}
              </div>
              {review ? (
                review.comment ? <p className="text-fg/80">{review.comment}</p> : null
              ) : (
                <>
                  <p className="text-sm text-fg/55">{b.rateHint}</p>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={500} placeholder={b.rateComment} className="w-full rounded-2xl border border-fg/15 bg-fg/5 p-4 text-base outline-none placeholder:text-fg/35 focus:border-volt" />
                  {rateError ? <ErrorNote>{rateError}</ErrorNote> : null}
                  <PrimaryButton type="button" loading={rating} onClick={sendRating}>{b.rateSend}</PrimaryButton>
                </>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
