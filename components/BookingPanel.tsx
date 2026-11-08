"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { fill, formatPrice, type Locale } from "@/lib/i18n";
import { sb } from "@/lib/supabase-browser";
import type { Dictionary } from "@/dictionaries/fr";
import RangeCalendar from "./RangeCalendar";
import { CheckIcon } from "./Icons";
import { shortDate } from "./portal/dash-ui";
import { Spinner } from "./portal/ui";

type Props = { carId: string; pricePerDay: number; minDays: number; lang: Locale; labels: Dictionary["book"] };
type Who = { kind: "guest" } | { kind: "agency" } | { kind: "customer"; identity: "none" | "pending" | "approved" | "rejected"; suspended: boolean };

const SERVICE_FEE = 0.05;
const DAY = 86_400_000;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Same rule as the app: agencies get up to 24h to answer, less when the pickup (08:00) is close, never under 2h. */
function replyWindow(from: string): number {
  const hours = (parse(from).getTime() + 8 * 3_600_000 - Date.now()) / 3_600_000;
  return Math.round(Math.min(24, Math.max(2, hours / 2)));
}

/** Days already taken for this car, as yyyy-mm-dd keys. */
async function loadBusyDays(carId: string): Promise<Set<string>> {
  const days = new Set<string>();
  const add = (from: string, to: string) => {
    for (let d = parse(from.slice(0, 10)); iso(d) <= to.slice(0, 10); d.setDate(d.getDate() + 1)) days.add(iso(d));
  };
  const { data, error } = await sb.rpc("car_busy_dates", { p_car_id: carId });
  if (!error && Array.isArray(data)) {
    (data as { date_from: string; date_to: string }[]).forEach((r) => add(r.date_from, r.date_to));
    return days;
  }
  // The function is not installed yet: a signed-in renter can still read the same ranges directly
  const [bookings, blocks] = await Promise.all([
    sb.from("bookings").select("date_from, date_to").eq("car_id", carId).in("status", ["confirmed", "active"]),
    sb.from("availability_blocks").select("blocked_from, blocked_to").eq("car_id", carId),
  ]);
  bookings.data?.forEach((b) => add(iso(new Date(b.date_from)), iso(new Date(b.date_to))));
  blocks.data?.forEach((b) => add(b.blocked_from, b.blocked_to));
  return days;
}

/** The booking card on a car page: dates, the price, and the request itself (or what is needed first: an account, verified documents). */
export default function BookingPanel({ carId, pricePerDay, minDays, lang, labels: t }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<Set<string>>(new Set());
  // The days of this renter's own requests for this car (waiting, confirmed, in progress)
  const [mine, setMine] = useState<[string, string][]>([]);
  const [who, setWho] = useState<Who | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  // Today is only known in the browser, so the calendar appears once the page is open
  const [min, setMin] = useState("");

  // Dates chosen before signing in come back in the address
  useEffect(() => {
    const today = iso(new Date());
    const q = new URLSearchParams(window.location.search);
    const f = q.get("from"), e = q.get("to");
    /* eslint-disable react-hooks/set-state-in-effect */
    setMin(today);
    if (f && e && DATE.test(f) && DATE.test(e) && f >= today && e > f && Math.round((parse(e).getTime() - parse(f).getTime()) / DAY) >= minDays) { setFrom(f); setTo(e); }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [minDays]);

  useEffect(() => { loadBusyDays(carId).then(setBusy); }, [carId]);

  useEffect(() => {
    let alive = true;
    async function identify(user: User | null) {
      if (!user) { if (alive) setWho({ kind: "guest" }); return; }
      const [agency, docs, profile, own] = await Promise.all([
        sb.from("agencies").select("id").eq("user_id", user.id).maybeSingle(),
        sb.from("customer_documents").select("status").eq("user_id", user.id).maybeSingle(),
        sb.from("profiles").select("is_suspended").eq("id", user.id).maybeSingle(),
        sb.from("bookings").select("date_from, date_to").eq("customer_id", user.id).eq("car_id", carId).in("status", ["pending", "confirmed", "active"]),
      ]);
      if (!alive) return;
      setMine((own.data ?? []).map((b) => [iso(new Date(b.date_from)), iso(new Date(b.date_to))]));
      if (agency.data) { setWho({ kind: "agency" }); return; }
      setWho({ kind: "customer", identity: (docs.data?.status as "pending" | "approved" | "rejected" | undefined) ?? "none", suspended: !!profile.data?.is_suspended });
    }
    sb.auth.getSession().then(({ data }) => identify(data.session?.user ?? null));
    const { data } = sb.auth.onAuthStateChange((_event, session) => { setTimeout(() => identify(session?.user ?? null), 0); });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [carId]);

  const hasDates = !!from && !!to;
  const days = hasDates ? Math.max(1, Math.round((parse(to).getTime() - parse(from).getTime()) / DAY)) : 0;
  const fee = Math.round(pricePerDay * days * SERVICE_FEE);
  const total = pricePerDay * days + fee;
  // One request per car and period: dates that touch one the renter already sent cannot be sent again
  const duplicate = hasDates && mine.some(([start, end]) => start <= to && end >= from);

  const nextPath = `/${lang}/cars/${carId}${hasDates ? `?from=${from}&to=${to}` : ""}`;
  const authHref = (page: "login" | "signup") => `/${lang}/${page}?next=${encodeURIComponent(nextPath)}`;

  async function send() {
    if (!hasDates || who?.kind !== "customer") return;
    if (duplicate) { setError(t.duplicate); return; }
    if (days < minDays) { setError(fill(t.minRentalError, { n: minDays })); return; }
    setSending(true);
    setError(null);
    const { data: session } = await sb.auth.getSession();
    const customer = session.session?.user;
    const { data: car } = await sb.from("cars").select("agency_id").eq("id", carId).maybeSingle();
    if (!customer || !car) { setSending(false); setError(t.failed); return; }
    const { data, error: err } = await sb.from("bookings").insert({
      car_id: carId,
      customer_id: customer.id,
      agency_id: car.agency_id,
      date_from: parse(from).toISOString(),
      date_to: parse(to).toISOString(),
      total_days: days,
      price_per_day: pricePerDay,
      service_fee: fee,
      total_price: total,
      status: "pending",
    }).select("id").single();
    setSending(false);
    if (err || !data) {
      const m = err?.message ?? "";
      if (m.includes("IDENTITY_NOT_VERIFIED")) setWho({ kind: "customer", identity: "none", suspended: false });
      else setError(m.includes("DUPLICATE_BOOKING") ? t.duplicate : m.includes("MIN_RENTAL_DAYS") ? fill(t.minRentalError, { n: minDays }) : m.includes("AGENCY_NOT_APPROVED") ? t.agencyUnavailable : /overlap|conflict|already/i.test(m) ? t.overlap : t.failed);
      return;
    }
    setSent(data.id);
  }

  const verified = who?.kind === "customer" && who.identity === "approved" && !who.suspended;
  const price = (amount: number) => formatPrice(amount, lang);
  const calLabels = { pick: t.chooseDates, clear: t.clear, days: t.days, day: t.day, pickReturn: t.pickReturn, from: t.from, to: t.to };
  const button = "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-volt px-6 text-base font-bold text-white shadow-lg shadow-volt/30 transition-colors hover:bg-volt-soft disabled:cursor-not-allowed disabled:opacity-40";
  const quiet = "flex h-14 w-full items-center justify-center rounded-2xl border border-line px-6 text-base font-bold text-ink transition-colors hover:bg-paper";

  if (sent) {
    // Request sent, answer from the agency, confirmed: the first is done, the second is where it stands
    const fills = [1, 0.5, 0];
    return (
      <section className="rounded-[2rem] border border-line bg-white p-6 text-ink sm:p-7" aria-live="polite">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-go text-white"><CheckIcon className="h-5 w-5" /></span>
          <h2 className="font-display text-2xl font-extrabold">{t.sentTitle}</h2>
        </div>
        <p className="mt-3 leading-relaxed text-muted">{t.sentText}</p>

        <dl className="mt-5 divide-y divide-line overflow-hidden rounded-2xl bg-paper text-sm">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-muted">{days === 1 ? t.day : fill(t.days, { n: days })}</dt>
            <dd className="font-semibold">{shortDate(parse(from).toISOString(), lang)} <span aria-hidden className="inline-block rtl:rotate-180">→</span> {shortDate(parse(to).toISOString(), lang)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="font-bold">{t.total}</dt>
            <dd className="font-display text-lg font-extrabold tabular-nums">{price(total)}</dd>
          </div>
        </dl>

        <ol className="mt-6 grid grid-cols-3 gap-3">
          {t.sentSteps.map((label, i) => (
            <li key={label}>
              <span className="block h-1 overflow-hidden rounded-full bg-ink/10">
                <span className="block h-full rounded-full bg-volt" style={{ width: `${fills[i] * 100}%` }} />
              </span>
              <span className={`mt-2 block text-xs leading-snug ${i === 1 ? "font-bold" : i === 2 ? "text-muted/70" : "text-muted"}`}>{label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs font-semibold text-volt-mid">{fill(t.reply, { h: replyWindow(from) })}</p>

        <Link href={`/${lang}/dashboard/bookings/${sent}`} className={`${button} mt-6`}>{t.viewBooking}</Link>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-line bg-white p-6 text-ink shadow-xl shadow-volt/10 sm:p-7">
      <h2 className="font-display text-2xl font-extrabold">{t.title}</h2>
      <p className="mt-1 text-sm text-muted">{t.minTwo}</p>
      {minDays > 1 ? <p className="mt-1 text-sm font-semibold text-volt-mid">{fill(t.minRental, { n: minDays })}</p> : null}

      <div className="mt-5">
        {min ? <RangeCalendar from={from} to={to} min={min} minNights={minDays} lang={lang} labels={calLabels} blocked={busy} onChange={(f, e) => { setFrom(f); setTo(e); setError(null); }} /> : <div className="h-[4.25rem] rounded-2xl border border-line bg-paper" />}
      </div>

      {hasDates ? (
        <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted">{days === 1 ? fill(t.priceOne, { price: price(pricePerDay) }) : fill(t.priceMany, { price: price(pricePerDay), n: days })}</dt><dd className="font-semibold tabular-nums">{price(pricePerDay * days)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">{t.fee}</dt><dd className="font-semibold tabular-nums">{price(fee)}</dd></div>
          <div className="flex justify-between gap-4 border-t border-line pt-3 text-base"><dt className="font-bold">{t.total}</dt><dd className="font-display text-xl font-extrabold tabular-nums">{price(total)}</dd></div>
        </dl>
      ) : null}

      <div className="mt-5 space-y-3">
        {who === null ? <div className="flex h-14 items-center justify-center text-volt-mid"><Spinner /></div> : null}

        {who?.kind === "guest" ? (
          <>
            <p className="text-sm leading-relaxed text-muted">{t.loginHint}</p>
            <Link href={authHref("login")} className={button}>{t.login}</Link>
            <Link href={authHref("signup")} className={quiet}>{t.signup}</Link>
          </>
        ) : null}

        {who?.kind === "agency" ? <p className="rounded-2xl bg-paper p-4 text-sm leading-relaxed text-muted">{t.agencyAccount}</p> : null}

        {who?.kind === "customer" && who.suspended ? <p className="rounded-2xl bg-paper p-4 text-sm leading-relaxed text-muted">{t.suspended}</p> : null}

        {who?.kind === "customer" && !who.suspended && who.identity !== "approved" ? (
          <div className="rounded-2xl bg-paper p-4">
            <p className="font-bold">{t.identityTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{who.identity === "pending" ? t.identityPending : t.identityText}</p>
            <Link href={`/${lang}/dashboard`} className={`${quiet} mt-4 bg-white`}>{who.identity === "pending" ? t.identityOpen : t.identityAdd}</Link>
          </div>
        ) : null}

        {verified ? (
          <>
            {error || duplicate ? <p role="alert" className="rounded-2xl bg-danger/10 p-4 text-sm font-semibold text-[#c2300f]">{error ?? t.duplicate}</p> : null}
            <button type="button" onClick={send} disabled={!hasDates || sending || duplicate} className={button}>
              {sending ? <><Spinner /> {t.sending}</> : hasDates ? t.send : t.needDates}
            </button>
            {hasDates ? <p className="text-center text-xs font-semibold text-volt-mid">{fill(t.reply, { h: replyWindow(from) })}</p> : null}
            <p className="text-center text-xs leading-relaxed text-muted">{t.payOnSite}</p>
          </>
        ) : null}
      </div>
    </section>
  );
}
