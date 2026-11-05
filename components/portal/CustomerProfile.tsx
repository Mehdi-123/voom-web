"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { useDash } from "./DashContext";
import { Card, Initial, Loading, PageHeader, Stars, shortDate } from "./dash-ui";

type Review = { rating: number; comment: string | null; created_at: string; agency_name: string | null; agency_city: string | null; is_mine: boolean };
type Profile = { name: string | null; avatar_url: string | null; member_since: string | null; strike_count: number; completed_rentals: number; no_shows: number; review_count: number; rating: number; reviews: Review[] };

/** What agencies know about a customer who booked with them: reliability numbers and the reviews other agencies left. */
export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang, dict } = useDash();
  const t = dict.dash.customer;
  const [data, setData] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    sb.rpc("customer_profile_for_agency", { p_customer_id: id }).then(({ data: d, error }) => setData(error || !d ? null : (d as Profile)));
  }, [id]);

  if (data === undefined) return <Loading />;
  if (data === null) return <p className="text-fg/70">{t.notAllowed}</p>;

  const strikeTone = data.strike_count === 0 ? "text-go" : data.strike_count === 1 ? "text-warn" : "text-danger";
  const stats: [string, string | number, string?][] = [
    [t.completed, data.completed_rentals],
    [t.noShows, data.no_shows, data.no_shows > 0 ? "text-danger" : undefined],
    [t.strikes, `${data.strike_count}/3`, strikeTone],
  ];

  return (
    <>
      <button type="button" onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-fg/70 hover:text-fg"><span className="rtl:rotate-180">←</span> {t.back}</button>
      <div className="flex items-center gap-5">
        <Initial name={data.name} className="mb-8 h-20 w-20 text-4xl" />
        <PageHeader title={data.name ?? t.title} subtitle={data.member_since ? `${t.memberSince} ${shortDate(data.member_since, lang)}` : undefined} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(([label, value, tone]) => (
          <div key={label} className="glass rounded-3xl p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-fg/55">{label}</p>
            <p className={`font-display mt-3 text-4xl font-extrabold ${tone ?? ""}`}>{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-fg/50">{t.strikeHint}</p>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-fg/60">{t.reviews}</h2>
          {data.review_count > 0 ? <span className="flex items-center gap-2 text-sm font-bold"><Stars value={data.rating} />{data.rating} · {data.review_count}</span> : null}
        </div>
        {data.reviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-fg/15 p-10 text-center text-fg/55">{t.noReviews}</div>
        ) : (
          <div className="space-y-3">
            {data.reviews.map((r, i) => (
              <Card key={i}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Stars value={r.rating} />
                  <span className="text-xs text-fg/50">{r.is_mine ? t.mine : [r.agency_name, r.agency_city].filter(Boolean).join(" · ")} · {shortDate(r.created_at, lang)}</span>
                </div>
                {r.comment ? <p className="mt-3 text-fg/85">{r.comment}</p> : null}
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
