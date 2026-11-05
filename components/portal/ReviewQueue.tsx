"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { Empty, Loading, PageHeader, shortDate } from "./dash-ui";

type Kind = "agencies" | "customers";
type Status = "pending" | "approved" | "rejected";
type Row = { id: string; name: string; line: string; since: string };

const STATUSES: Status[] = ["pending", "approved", "rejected"];

/** The admin's list of agencies or customers waiting for a decision (oldest first, so nobody waits forever). */
export default function ReviewQueue() {
  const { role } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash.review;
  const params = useSearchParams();
  const [kind, setKind] = useState<Kind>(params.get("kind") === "customers" ? "customers" : "agencies");
  const [status, setStatus] = useState<Status>("pending");
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (role !== "admin") return;
    let current = true;
    const load = async () => {
      const asc = status === "pending";
      if (kind === "agencies") {
        const { data } = await sb.from("agencies").select("id, name, city, registration_number, created_at").eq("approval_status", status).order("created_at", { ascending: asc });
        if (current) setRows((data ?? []).map((a) => ({ id: a.id, name: a.name, line: [a.city, a.registration_number].filter(Boolean).join(" · "), since: a.created_at })));
      } else {
        const { data } = await sb.from("customer_documents").select("user_id, submitted_at, profiles(name, phone)").eq("status", status).order("submitted_at", { ascending: asc });
        const list = (data ?? []) as unknown as { user_id: string; submitted_at: string; profiles: { name: string | null; phone: string | null } | null }[];
        if (current) setRows(list.map((c) => ({ id: c.user_id, name: c.profiles?.name ?? "—", line: c.profiles?.phone ?? "", since: c.submitted_at })));
      }
    };
    load();
    return () => { current = false; };
  }, [kind, status, role]);

  if (role !== "admin") return <p className="text-fg/70">{t.notAdmin}</p>;

  const pill = (on: boolean) => `shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${on ? "bg-fg text-page" : "glass text-fg/75 hover:bg-fg/10"}`;

  return (
    <>
      <PageHeader title={t.title} />
      <div className="mb-3 flex gap-2">
        {(["agencies", "customers"] as const).map((k) => <button key={k} type="button" onClick={() => { setRows(null); setKind(k); }} className={pill(kind === k)}>{t[k]}</button>)}
      </div>
      <div className="mb-6 flex gap-2">
        {STATUSES.map((s) => <button key={s} type="button" onClick={() => { setRows(null); setStatus(s); }} className={pill(status === s)}>{t[s]}</button>)}
      </div>

      {rows === null ? <Loading /> : rows.length === 0 ? <Empty>{t.empty}</Empty> : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Link key={r.id} href={`/${lang}/dashboard/review/${kind === "agencies" ? "agency" : "customer"}/${r.id}`} className="glass flex items-center gap-4 rounded-3xl p-5 transition-colors hover:bg-fg/10">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-volt/20 font-display text-xl font-extrabold text-volt-soft">{r.name.charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{r.name}</p>
                <p className="truncate text-sm text-fg/55">{r.line}</p>
              </div>
              <span className="text-sm text-fg/45">{shortDate(r.since, lang)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
