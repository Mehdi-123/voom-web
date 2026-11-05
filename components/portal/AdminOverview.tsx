"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase-browser";
import { useDash } from "./DashContext";
import { Loading, PageHeader } from "./dash-ui";
import { fill } from "@/lib/i18n";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const RING = 76;
const RING_STROKE = 8;
const RING_RADIUS = (RING - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

type Kind = "agencies" | "customers";
type Item = { kind: Kind; id: string; name: string; since: string };
type Event = Item & { type: "new" | "approved" | "rejected"; at: string };
type Overview = {
  waiting: number;
  byKind: Record<Kind, number>;
  withinDay: number;
  approvedWeek: number;
  approvedPrevWeek: number;
  avgHours: number | null;
  oldest: Item | null;
  activity: Event[];
  /** When the numbers were read, so the page's "x ago" stays consistent */
  now: number;
};

type AgencyRow = { id: string; name: string; created_at: string; approval_status?: string; reviewed_at?: string };
type CustomerRow = { user_id: string; submitted_at: string; status?: string; reviewed_at?: string; profiles: { name: string | null } | null };

/** Same numbers as the app's admin home: what waits, how fast it is handled, and what just happened. */
async function loadOverview(): Promise<Overview> {
  const since = new Date(Date.now() - 14 * DAY).toISOString();
  const [aPending, aDone, cPending, cDone] = await Promise.all([
    sb.from("agencies").select("id, name, created_at").eq("approval_status", "pending"),
    sb.from("agencies").select("id, name, approval_status, created_at, reviewed_at").neq("approval_status", "pending").gte("reviewed_at", since),
    sb.from("customer_documents").select("user_id, submitted_at, profiles(name)").eq("status", "pending"),
    sb.from("customer_documents").select("user_id, status, submitted_at, reviewed_at, profiles(name)").neq("status", "pending").gte("reviewed_at", since),
  ]);
  const aP = (aPending.data ?? []) as AgencyRow[];
  const aD = ((aDone.data ?? []) as AgencyRow[]).filter((r) => r.reviewed_at);
  const cP = (cPending.data ?? []) as unknown as CustomerRow[];
  const cD = ((cDone.data ?? []) as unknown as CustomerRow[]).filter((r) => r.reviewed_at);

  const pending: Item[] = [
    ...aP.map((r) => ({ kind: "agencies" as const, id: r.id, name: r.name, since: r.created_at })),
    ...cP.map((r) => ({ kind: "customers" as const, id: r.user_id, name: r.profiles?.name ?? "—", since: r.submitted_at })),
  ].sort((a, b) => a.since.localeCompare(b.since));

  const reviewed = [
    ...aD.map((r) => ({ kind: "agencies" as const, id: r.id, name: r.name, since: r.created_at, status: r.approval_status as "approved" | "rejected", reviewedAt: r.reviewed_at! })),
    ...cD.map((r) => ({ kind: "customers" as const, id: r.user_id, name: r.profiles?.name ?? "—", since: r.submitted_at, status: r.status as "approved" | "rejected", reviewedAt: r.reviewed_at! })),
  ];

  const now = Date.now();
  const week = reviewed.filter((r) => now - new Date(r.reviewedAt).getTime() < 7 * DAY);
  const prev = reviewed.filter((r) => now - new Date(r.reviewedAt).getTime() >= 7 * DAY);
  const hours = week.map((r) => Math.max(0, new Date(r.reviewedAt).getTime() - new Date(r.since).getTime()) / HOUR);

  const activity: Event[] = [
    ...pending.map((p) => ({ ...p, type: "new" as const, at: p.since })),
    ...reviewed.map((r) => ({ kind: r.kind, id: r.id, name: r.name, since: r.since, type: r.status, at: r.reviewedAt })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  return {
    waiting: pending.length,
    byKind: { agencies: pending.filter((p) => p.kind === "agencies").length, customers: pending.filter((p) => p.kind === "customers").length },
    withinDay: pending.length ? Math.round((100 * pending.filter((p) => now - new Date(p.since).getTime() < DAY).length) / pending.length) : 100,
    approvedWeek: week.filter((r) => r.status === "approved").length,
    approvedPrevWeek: prev.filter((r) => r.status === "approved").length,
    avgHours: hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null,
    oldest: pending[0] ?? null,
    activity,
    now,
  };
}

const CHECK = "m5 12.5 4.5 4.5L19 7.5";
const CROSS = "M6 6l12 12M18 6 6 18";
const PLUS = "M12 5v14M5 12h14";

export default function AdminOverview() {
  const { lang, dict } = useDash();
  const t = dict.dash.overview;
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => { loadOverview().then(setData); }, []);

  if (!data) return <Loading />;

  const duration = (hours: number) => (hours < 1 ? t.underHour : hours < 24 ? fill(t.waitHours, { n: Math.floor(hours) }) : fill(t.waitDays, { n: Math.floor(hours / 24) }));
  const ago = (iso: string) => { const h = Math.max(0, (data.now - new Date(iso).getTime()) / HOUR); return h < 1 ? t.justNow : duration(h); };
  const link = (item: Item) => `/${lang}/dashboard/review/${item.kind === "agencies" ? "agency" : "customer"}/${item.id}`;
  const queue = (kind: Kind) => `/${lang}/dashboard/review?kind=${kind}`;
  const diff = data.approvedWeek - data.approvedPrevWeek;
  const waitedHours = data.oldest ? (data.now - new Date(data.oldest.since).getTime()) / HOUR : 0;
  const tone = { approved: "text-go bg-go/15", rejected: "text-danger bg-[#ff5c3a]/15", new: "text-volt-soft bg-volt/20" } as const;
  const text = (e: Event) => fill(e.type === "approved" ? t.evApproved : e.type === "rejected" ? t.evRejected : t.evNew, { name: e.name });
  const heroTarget: Kind = data.byKind.customers > data.byKind.agencies ? "customers" : "agencies";

  return (
    <>
      <PageHeader title={t.adminTitle} subtitle={t.adminSubtitle} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* The number that matters, with the two queues underneath */}
        <div className="on-volt relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-volt-mid to-volt p-8 shadow-2xl shadow-volt/25 lg:col-span-2">
          <span aria-hidden className="glow-blob absolute -end-20 -top-20 -z-10 h-80 w-80" />
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-fg/75">{t.waitingForReview}</p>
              <p className="font-display mt-2 text-7xl font-extrabold leading-none tracking-tight sm:text-8xl">{data.waiting}</p>
              <p className="mt-3 text-sm text-fg/75">{fill(t.withinDay, { percent: data.withinDay })}</p>
            </div>
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox={`0 0 ${RING} ${RING}`} className="h-full w-full -rotate-90 rtl:rotate-90" aria-hidden>
                <circle cx={RING / 2} cy={RING / 2} r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth={RING_STROKE} />
                <circle cx={RING / 2} cy={RING / 2} r={RING_RADIUS} fill="none" stroke="#fff" strokeWidth={RING_STROKE} strokeLinecap="round" strokeDasharray={`${(RING_LENGTH * data.withinDay) / 100} ${RING_LENGTH}`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{data.withinDay}%</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {(["agencies", "customers"] as const).map((k) => (
              <Link key={k} href={queue(k)} className={`flex items-center gap-3 rounded-full py-2.5 pe-3 ps-5 font-bold transition-colors ${k === heroTarget ? "bg-fg text-page" : "bg-fg/15 hover:bg-fg/25"}`}>
                {t[k]}
                <span className={`min-w-7 rounded-full px-2.5 py-0.5 text-center text-sm ${k === heroTarget ? "bg-volt/20 text-volt-mid" : "bg-fg/20"}`}>{data.byKind[k]}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="glass rounded-[2rem] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-fg/55">{t.approvedWeek}</p>
            <p className="font-display mt-2 text-5xl font-extrabold tracking-tight">{data.approvedWeek}</p>
            <p className={`mt-1 text-sm font-bold ${diff >= 0 ? "text-go" : "text-danger"}`}>{fill(t.vsLastWeek, { diff: `${diff >= 0 ? "+" : ""}${diff}` })}</p>
          </div>
          <div className="glass rounded-[2rem] p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-fg/55">{t.avgReview}</p>
            <p className="font-display mt-2 text-5xl font-extrabold tracking-tight">{data.avgHours === null ? "—" : duration(data.avgHours)}</p>
            <p className="mt-1 text-sm text-fg/55">{t.target}</p>
          </div>
        </div>
      </div>

      {data.oldest && waitedHours >= 24 ? (
        <Link href={link(data.oldest)} className="mt-4 flex items-center gap-3 rounded-3xl border border-warn/35 bg-warn/10 p-5 transition-colors hover:bg-warn/15">
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-warn" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          <span className="flex-1 font-semibold">{fill(t.oldestAlert, { name: data.oldest.name, time: duration(waitedHours) })}</span>
          <span aria-hidden className="text-fg/50 rtl:rotate-180">→</span>
        </Link>
      ) : null}

      <div className="mt-10">
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-fg/55">{t.recentActivity}</h2>
          {data.activity.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-fg/15 p-10 text-center text-fg/55">{t.nothingHere}</div>
          ) : (
            <div className="glass divide-y divide-fg/10 rounded-[2rem] px-6">
              {data.activity.map((e) => (
                <Link key={`${e.kind}-${e.id}-${e.type}-${e.at}`} href={link(e)} className="flex items-center gap-4 py-4 transition-colors hover:text-volt-soft">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone[e.type]}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={e.type === "approved" ? CHECK : e.type === "rejected" ? CROSS : PLUS} /></svg>
                  </span>
                  <span className="min-w-0 flex-1 truncate">{text(e)}</span>
                  <span className="text-sm text-fg/45">{ago(e.at)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
