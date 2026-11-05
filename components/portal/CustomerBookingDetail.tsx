"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/i18n";
import { StarIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { BookingProgress, Card, Initial, Loading, PageHeader, Stars, StatusBadge, shortDate } from "./dash-ui";
import { ErrorNote, GhostButton, PrimaryButton } from "./ui";

type Booking = { id: string; car_id: string; agency_id: string; date_from: string; date_to: string; total_days: number; price_per_day: number; service_fee: number; total_price: number; status: string; created_at: string; cancelled_by: string | null };
type Car = { make: string; model: string; year: number; images: string[] | null };
type Agency = { name: string; city: string; phone: string | null; address: string | null; logo_url: string | null; rating: number | null; review_count: number | null; is_verified: boolean | null };
type Review = { id: string; rating: number; comment: string | null };

// Stored as English text, like in the app; only the label on screen is translated
const REASONS = ["Plans changed", "Found a better option", "Emergency", "Booked by mistake", "Other"];

/** One of the renter's bookings: the agency, the dates, the price, where it stands, cancelling and rating. */
export default function CustomerBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash;
  const m = t.me;
  const b = t.bookings;
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [car, setCar] = useState<Car | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [rateError, setRateError] = useState<string | null>(null);
  const [rating, setRating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    const { data } = await sb.from("bookings").select("id, car_id, agency_id, date_from, date_to, total_days, price_per_day, service_fee, total_price, status, created_at, cancelled_by").eq("id", id).maybeSingle();
    if (!data) { setBooking(null); return; }
    const row = data as Booking;
    setBooking(row);
    const [c, a] = await Promise.all([
      sb.from("cars").select("make, model, year, images").eq("id", row.car_id).maybeSingle(),
      sb.from("agencies").select("name, city, phone, address, logo_url, rating, review_count, is_verified").eq("id", row.agency_id).maybeSingle(),
    ]);
    setCar((c.data as Car | null) ?? null);
    setAgency((a.data as Agency | null) ?? null);
    if (row.status === "completed" && user) {
      const { data: mine } = await sb.from("reviews").select("id, rating, comment").eq("booking_id", id).eq("author_id", user.id).eq("reviewer_type", "customer").maybeSingle();
      setReview((mine as Review | null) ?? null);
    }
  }, [id, user]);

  // fetch on mount: the state is set after the request resolves
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (booking === undefined) return <Loading />;
  if (booking === null) return <p className="text-fg/70">{b.notFound}</p>;

  async function cancel() {
    if (!reason) return;
    setBusy(true);
    setError(null);
    const { error: err } = await sb.rpc("cancel_booking", { p_booking_id: id, p_reason: reason });
    setBusy(false);
    if (err) { setError(m.cancelFailed); return; }
    setCancelling(false);
    await load();
  }

  async function sendRating() {
    if (stars === 0) { setRateError(b.pickStar); return; }
    if (!user || !booking) return;
    setRating(true);
    setRateError(null);
    const { data, error: err } = await sb.from("reviews").insert({
      booking_id: booking.id, author_id: user.id, agency_id: booking.agency_id, car_id: booking.car_id, rating: stars, comment: comment.trim() || null, reviewer_type: "customer",
    }).select("id, rating, comment").maybeSingle();
    setRating(false);
    if (err || !data) { setRateError(b.rateFailed); return; }
    setReview(data as Review);
  }

  const status = booking.status;
  const canCancel = status === "pending" || status === "confirmed";
  // A confirmed booking cancelled in the last 24h before pickup (08:00 on the first day) costs a strike
  const pickup = new Date(booking.date_from); pickup.setHours(8, 0, 0, 0);
  const late = status === "confirmed" && (pickup.getTime() - now) / 3_600_000 < 24;
  const message = { pending: m.stPending, confirmed: m.stConfirmed, active: m.stActive, completed: m.stCompleted, cancelled: m.stCancelled, no_show: m.stNoShow }[status];
  const duration = booking.total_days === 1 ? t.common.day : t.common.days.replace("{n}", String(booking.total_days));
  const photo = car?.images?.[0];
  const stopped = status === "cancelled" || status === "no_show";

  return (
    <>
      <Link href={`/${lang}/dashboard`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-fg/70 hover:text-fg"><span className="rtl:rotate-180">←</span> {m.title}</Link>
      <PageHeader title={car ? `${car.make} ${car.model}` : b.title} subtitle={car ? String(car.year) : undefined} action={<StatusBadge status={status} label={t.status[status as keyof typeof t.status]} />} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="!p-0 overflow-hidden">
            {photo ? <div className="relative aspect-[16/7] bg-fg/5"><Image src={photo} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" /></div> : null}
            <div className="space-y-5 p-6">
              <p className={`rounded-2xl px-5 py-4 font-semibold ${status === "no_show" ? "bg-danger/15 text-danger" : status === "confirmed" || status === "completed" ? "bg-go/15 text-go" : "bg-fg/10"}`}>{message}</p>
              {stopped ? null : <BookingProgress status={status} labels={[b.stepRequested, b.stepConfirmed, b.stepPickedUp, b.stepCompleted]} />}
            </div>
            <dl className="divide-y divide-fg/10 border-t border-fg/10 px-6">
              {[
                [b.period, `${shortDate(booking.date_from, lang)} → ${shortDate(booking.date_to, lang)}`],
                [b.duration, duration],
                [b.requestedOn, shortDate(booking.created_at, lang)],
                [b.reference, `#${booking.id.slice(0, 8).toUpperCase()}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-6 py-4"><dt className="text-sm text-fg/55">{label}</dt><dd className="text-end font-semibold">{value}</dd></div>
              ))}
            </dl>
          </Card>

          {agency ? (
            <Card>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-fg/60">{m.agency}</h2>
              <div className="flex items-center gap-4">
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-fg/5">
                  {agency.logo_url ? <Image src={agency.logo_url} alt="" fill sizes="56px" className="object-cover" /> : <Initial name={agency.name} className="h-14 w-14 !rounded-2xl text-2xl" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold">{agency.name}</p>
                  <p className="flex flex-wrap items-center gap-x-3 text-sm text-fg/60">
                    <span>{agency.city}</span>
                    {agency.review_count ? <span className="flex items-center gap-1"><Stars value={agency.rating ?? 0} className="h-3.5 w-3.5" />{Number(agency.rating ?? 0).toFixed(1)} ({agency.review_count})</span> : null}
                    {agency.is_verified ? <span className="font-semibold text-go">✓ {m.verified}</span> : null}
                  </p>
                </div>
              </div>
              {agency.address ? <p className="mt-4 text-sm text-fg/70"><span className="text-fg/50">{m.address}: </span>{agency.address}</p> : null}
              {agency.phone && (status === "confirmed" || status === "active") ? (
                <a href={`tel:${agency.phone.replace(/\s/g, "")}`} dir="ltr" className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-fg/5 px-5 py-3.5 font-semibold transition-colors hover:text-volt-soft"><span className="text-sm font-normal text-fg/55">{m.callAgency}</span>{agency.phone}</a>
              ) : null}
              {status === "confirmed" ? <p className="mt-4 text-sm text-fg/60">{m.pickupTip}</p> : null}
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
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

          {canCancel ? (
            cancelling ? (
              <Card className="space-y-4">
                <p className="font-bold">{m.cancelTitle}</p>
                <div className="space-y-2" role="radiogroup" aria-label={m.cancelTitle}>
                  {REASONS.map((value, i) => (
                    <button key={value} type="button" role="radio" aria-checked={reason === value} onClick={() => setReason(value)} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-start text-sm font-semibold transition-colors ${reason === value ? "border-danger bg-danger/10 text-danger" : "border-fg/15 hover:bg-fg/5"}`}>
                      <span aria-hidden className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${reason === value ? "border-danger" : "border-fg/30"}`}>{reason === value ? <span className="h-1.5 w-1.5 rounded-full bg-danger" /> : null}</span>
                      {m.reasons[i]}
                    </button>
                  ))}
                </div>
                <p className={`text-sm ${late ? "font-semibold text-danger" : "text-fg/55"}`}>{late ? m.cancelLate : m.cancelFree}</p>
                <div className="flex gap-3">
                  <PrimaryButton type="button" loading={busy} disabled={!reason} onClick={cancel} className="!bg-[#ff5c3a]">{m.cancelConfirm}</PrimaryButton>
                  <GhostButton type="button" onClick={() => { setCancelling(false); setReason(null); }} className="w-full">{m.keepIt}</GhostButton>
                </div>
              </Card>
            ) : (
              <GhostButton type="button" onClick={() => setCancelling(true)} className="w-full">{m.cancelBooking}</GhostButton>
            )
          ) : null}

          {status === "completed" ? (
            <Card className="space-y-4">
              <h2 className="font-bold">{review ? b.rateDone : m.rateTitle}</h2>
              <div className="flex gap-1" role="radiogroup" aria-label={m.rateTitle}>
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
                  <p className="text-sm text-fg/55">{m.rateHint}</p>
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
