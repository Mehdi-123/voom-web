"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { fill } from "@/lib/i18n";
import { BellIcon, CalendarIcon, CheckIcon, CloseIcon, ShieldIcon, StarIcon } from "@/components/Icons";
import { useDash } from "./DashContext";
import { Initial, Loading, timeAgo } from "./dash-ui";
import type { Notice } from "./notifications";

const GOOD = new Set(["confirmed", "identity_approved", "agency_approved", "completed"]);
const BAD = new Set(["declined", "cancelled_by_customer", "no_show", "identity_rejected", "agency_rejected"]);

const toneOf = (type?: string) => (GOOD.has(type ?? "") ? "bg-go text-white" : BAD.has(type ?? "") ? "bg-danger text-white" : "bg-volt text-white");
const softToneOf = (type?: string) => (GOOD.has(type ?? "") ? "bg-go/15 text-go" : BAD.has(type ?? "") ? "bg-danger/15 text-danger" : "bg-volt/20 text-volt-soft");
function iconOf(type: string | undefined, className: string) {
  if (type === "confirmed" || type === "identity_approved" || type === "agency_approved") return <CheckIcon className={className} />;
  if (BAD.has(type ?? "")) return <CloseIcon className={className} />;
  if (type === "completed") return <StarIcon className={className} />;
  if (type?.startsWith("review_")) return <ShieldIcon className={className} />;
  if (type === "new_request") return <CalendarIcon className={className} />;
  return <BellIcon className={className} />;
}

/** The inbox: the same notifications the app shows, grouped by day, with the car, agency or customer picture when there is one. */
export default function NoticesList() {
  const { lang, dict, notices } = useDash();
  const t = dict.dash.notifications;
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [stamp] = useState(() => Date.now());
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const { items, unread, markRead, markAllRead } = notices;

  // Pictures for the circles: a booking shows its car, a review request shows the agency logo or the customer's photo
  const key = useMemo(() => (items ?? []).map((n) => `${n.booking_id ?? ""}|${n.data?.agency_id ?? ""}|${n.data?.user_id ?? ""}`).join(","), [items]);
  useEffect(() => {
    if (!items) return;
    const bookingIds = [...new Set(items.map((n) => n.booking_id).filter(Boolean))] as string[];
    const agencyIds = [...new Set(items.map((n) => n.data?.agency_id).filter(Boolean))] as string[];
    const userIds = [...new Set(items.map((n) => n.data?.user_id).filter(Boolean))] as string[];
    (async () => {
      const found: Record<string, string> = {};
      const [b, a, p] = await Promise.all([
        bookingIds.length ? sb.from("bookings").select("id, cars(images)").in("id", bookingIds) : Promise.resolve({ data: [] }),
        agencyIds.length ? sb.from("agencies").select("id, logo_url").in("id", agencyIds) : Promise.resolve({ data: [] }),
        userIds.length ? sb.from("profiles").select("id, avatar_url").in("id", userIds) : Promise.resolve({ data: [] }),
      ]);
      for (const row of (b.data ?? []) as unknown as { id: string; cars: { images: string[] | null } | null }[]) if (row.cars?.images?.[0]) found[`b:${row.id}`] = row.cars.images[0];
      for (const row of (a.data ?? []) as { id: string; logo_url: string | null }[]) if (row.logo_url) found[`a:${row.id}`] = row.logo_url;
      for (const row of (p.data ?? []) as { id: string; avatar_url: string | null }[]) if (row.avatar_url) found[`u:${row.id}`] = row.avatar_url;
      setPhotos(found);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!items) return <Loading />;

  const open = (n: Notice) => {
    markRead(n.id);
    const base = `/${lang}/dashboard`;
    if (n.data?.type === "review_agency" && n.data.agency_id) router.push(`${base}/review/agency/${n.data.agency_id}`);
    else if (n.data?.type === "review_customer" && n.data.user_id) router.push(`${base}/review/customer/${n.data.user_id}`);
    else if (n.booking_id) router.push(`${base}/bookings/${n.booking_id}`);
    else if (n.data?.type?.startsWith("identity_")) router.push(`${base}/profile`);
  };

  const locale = lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-MA";
  const dayStart = (iso: string) => { const d = new Date(iso); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const todayStart = dayStart(new Date().toISOString());
  const dayLabel = (iso: string) => {
    const diff = Math.round((todayStart - dayStart(iso)) / 86_400_000);
    return diff <= 0 ? t.today : diff === 1 ? t.yesterday : new Date(iso).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  };

  const shown = filter === "unread" ? items.filter((n) => !n.read_at) : items;
  const groups: { label: string; rows: Notice[] }[] = [];
  for (const n of shown) {
    const label = dayLabel(n.sent_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(n); else groups.push({ label, rows: [n] });
  }

  const chip = (on: boolean) => `rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${on ? "bg-fg text-page" : "bg-fg/10 text-fg/70 hover:bg-fg/15"}`;

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-4">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{t.title}</h1>
        {unread > 0 ? <button type="button" onClick={markAllRead} className="mt-3 text-sm font-bold text-volt-soft hover:underline">{t.markAll}</button> : null}
      </div>
      <p className="mb-5 text-fg/60">{unread > 0 ? fill(t.unread, { n: unread }) : t.allRead}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setFilter("all")} className={chip(filter === "all")}>{t.filterAll}</button>
        <button type="button" onClick={() => setFilter("unread")} className={chip(filter === "unread")}>{unread > 0 ? fill(t.unread, { n: unread }) : t.filterUnread}</button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-volt/10 text-volt"><BellIcon className="h-9 w-9" /></span>
          <p className="font-display text-xl font-extrabold">{filter === "unread" ? t.emptyUnread : t.empty}</p>
        </div>
      ) : (
        <div>
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="px-1 pb-2 pt-8 text-[11px] font-bold uppercase tracking-[0.12em] text-fg/50">{g.label}</h2>
              <div className="divide-y divide-fg/10">
                {g.rows.map((n) => {
                  const type = n.data?.type;
                  const photo = (n.booking_id && photos[`b:${n.booking_id}`]) || (n.data?.agency_id && photos[`a:${n.data.agency_id}`]) || (n.data?.user_id && photos[`u:${n.data.user_id}`]) || null;
                  const person = type === "review_customer";
                  return (
                    <button key={n.id} type="button" onClick={() => open(n)} className="-mx-3 flex w-[calc(100%+1.5rem)] items-start gap-3.5 rounded-2xl px-3 py-4 text-start transition-colors hover:bg-fg/5">
                      <span className="relative shrink-0">
                        {photo ? (
                          person
                            ? <Initial name={n.title} src={photo} className="h-11 w-11" />
                            : <span className="relative block h-11 w-11 overflow-hidden rounded-[14px] bg-fg/10"><Image src={photo} alt="" fill sizes="44px" unoptimized className="object-cover" /></span>
                        ) : (
                          <span className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${softToneOf(type)}`}>{iconOf(type, "h-5 w-5")}</span>
                        )}
                        {photo ? <span className={`absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-page ${toneOf(type)}`}>{iconOf(type, "h-3 w-3")}</span> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-3">
                          <span className="min-w-0 flex-1 truncate font-bold">{n.title}</span>
                          <span className="shrink-0 text-[11px] text-fg/50">{timeAgo(n.sent_at, lang, notices.items ? stamp : 0)}</span>
                        </span>
                        <span className="mt-1 line-clamp-3 block text-[13px] leading-5 text-fg/60">{n.body}</span>
                      </span>
                      {n.read_at ? <span className="mt-2 h-[9px] w-[9px] shrink-0" /> : <span aria-hidden className="mt-2 h-[9px] w-[9px] shrink-0 rounded-full bg-volt" />}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
