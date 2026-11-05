"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CalendarIcon, ShieldIcon } from "@/components/Icons";
import { fill } from "@/lib/i18n";
import { useDash } from "./DashContext";
import { Empty, Loading, PageHeader, timeAgo } from "./dash-ui";
import type { Notice } from "./notifications";

const GOOD = new Set(["confirmed", "identity_approved", "agency_approved", "completed"]);
const BAD = new Set(["declined", "cancelled_by_customer", "no_show", "identity_rejected", "agency_rejected"]);

/** The inbox: the same notifications the app shows, and a way to jump to what they are about. */
export default function NoticesList() {
  const { lang, dict, notices } = useDash();
  const t = dict.dash.notifications;
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const { items, unread, markRead, markAllRead } = notices;

  if (!items) return <Loading />;

  const open = (n: Notice) => {
    markRead(n.id);
    const base = `/${lang}/dashboard`;
    if (n.data?.type === "review_agency" && n.data.agency_id) router.push(`${base}/review/agency/${n.data.agency_id}`);
    else if (n.data?.type === "review_customer" && n.data.user_id) router.push(`${base}/review/customer/${n.data.user_id}`);
    else if (n.booking_id) router.push(`${base}/bookings/${n.booking_id}`);
    else if (n.data?.type?.startsWith("identity_")) router.push(`${base}/profile`);
  };
  const tone = (n: Notice) => (GOOD.has(n.data?.type ?? "") ? "bg-go/15 text-go" : BAD.has(n.data?.type ?? "") ? "bg-danger/15 text-danger" : "bg-volt/20 text-volt-soft");
  const icon = (n: Notice) => (n.data?.type?.startsWith("review_") ? <ShieldIcon className="h-5 w-5" /> : n.booking_id ? <CalendarIcon className="h-5 w-5" /> : <BellIcon className="h-5 w-5" />);

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={unread > 0 ? fill(t.unread, { n: unread }) : t.allRead}
        action={unread > 0 ? <button type="button" onClick={markAllRead} className="rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-fg/10">{t.markAll}</button> : undefined}
      />
      {items.length === 0 ? <Empty>{t.empty}</Empty> : (
        <div className="space-y-3">
          {items.map((n) => (
            <button key={n.id} type="button" onClick={() => open(n)} className="glass flex w-full items-center gap-4 rounded-3xl p-5 text-start transition-colors hover:bg-fg/10">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone(n)}`}>{icon(n)}</span>
              <span className="min-w-0 flex-1">
                <span className={`block ${n.read_at ? "font-semibold text-fg/80" : "font-bold"}`}>{n.title}</span>
                <span className="block truncate text-sm text-fg/55">{n.body}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-2 text-xs text-fg/45">
                {timeAgo(n.sent_at, lang, now)}
                {n.read_at ? null : <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-volt" />}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
