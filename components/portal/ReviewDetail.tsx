"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { Card, Loading, PageHeader, StatusBadge, shortDate } from "./dash-ui";
import { ErrorNote, Field, GhostButton, PrimaryButton } from "./ui";

type Kind = "agency" | "customer";
type Status = "pending" | "approved" | "rejected";

type Detail = {
  title: string;
  status: Status;
  reason: string | null;
  submitted: string;
  rows: [string, string | null][];
  /** Label and private path of each document photo */
  docs: { label: string; path: string }[];
  bucket: string;
};

/** One agency or one customer's documents, with Approve and Reject (a reason is required to reject). */
export default function ReviewDetail({ kind }: { kind: Kind }) {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const { lang, dict } = useDash();
  const t = dict.dash.review;
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "admin") return;
    (async () => {
      let d: Detail | null = null;
      if (kind === "agency") {
        const { data } = await sb.from("agencies").select("name, city, address, phone, email, registration_number, license_path, approval_status, rejection_reason, created_at").eq("id", id).maybeSingle();
        // The owner's name stays with the account, so an admin-only function returns it
        const { data: owner } = await sb.rpc("admin_agency_owner", { p_agency_id: id });
        if (data) d = {
          title: data.name, status: data.approval_status, reason: data.rejection_reason, submitted: data.created_at, bucket: "agency-documents",
          rows: [[t.owner, typeof owner === "string" ? owner : null], [t.registration, data.registration_number], [t.city, data.city], [t.address, data.address], [t.phone, data.phone], [t.email, data.email]],
          docs: data.license_path ? [{ label: t.business, path: data.license_path }] : [],
        };
      } else {
        const { data } = await sb.from("customer_documents").select("status, rejection_reason, submitted_at, id_front, id_back, license_front, license_back, profiles(name, phone)").eq("user_id", id).maybeSingle();
        if (data) {
          const p = (data as unknown as { profiles: { name: string | null; phone: string | null } | null }).profiles;
          d = {
            title: p?.name ?? "—", status: data.status, reason: data.rejection_reason, submitted: data.submitted_at, bucket: "customer-documents",
            rows: [[t.name, p?.name ?? null], [t.phone, p?.phone ?? null]],
            docs: [
              { label: t.docs.idFront, path: data.id_front }, { label: t.docs.idBack, path: data.id_back },
              { label: t.docs.licenseFront, path: data.license_front }, { label: t.docs.licenseBack, path: data.license_back },
            ],
          };
        }
      }
      setDetail(d);
      if (d && d.docs.length) {
        // Private photos: short-lived links, valid for five minutes
        const { data } = await sb.storage.from(d.bucket).createSignedUrls(d.docs.map((x) => x.path), 300);
        setUrls(d.docs.map((x) => data?.find((s) => s.path === x.path)?.signedUrl ?? null));
      }
    })();
  }, [id, kind, role, t]);

  if (role !== "admin") return <p className="text-fg/70">{t.notAdmin}</p>;
  if (!detail) return <Loading />;

  async function decide(status: "approved" | "rejected") {
    setBusy(true);
    setError(null);
    const { error: err } = kind === "agency"
      ? await sb.rpc("admin_set_agency_status", { p_agency_id: id, p_status: status, p_reason: status === "rejected" ? reason.trim() : null })
      : await sb.rpc("admin_set_identity_status", { p_user_id: id, p_status: status, p_reason: status === "rejected" ? reason.trim() : null });
    setBusy(false);
    if (err) { setError(`${t.couldNotSave} ${err.message}`); return; }
    router.push(`/${lang}/dashboard/review?kind=${kind === "agency" ? "agencies" : "customers"}`);
  }

  return (
    <>
      <Link href={`/${lang}/dashboard/review?kind=${kind === "agency" ? "agencies" : "customers"}`} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-fg/70 hover:text-fg"><span className="rtl:rotate-180">←</span> {t.title}</Link>
      <PageHeader title={detail.title} subtitle={`${t.submitted} ${shortDate(detail.submitted, lang)}`} action={<StatusBadge status={detail.status} label={dict.dash.status[detail.status]} />} />

      {detail.reason ? <div className="mb-6"><Card><p className="text-xs font-bold uppercase tracking-wider text-fg/50">{t.reasonLabel}</p><p className="mt-1">{detail.reason}</p></Card></div> : null}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-fg/60">{t.documents}</h2>
          {detail.docs.length === 0 ? <Card><p className="text-sm text-fg/55">{t.photoUnavailable}</p></Card> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {detail.docs.map((doc, i) => (
              <button key={doc.path} type="button" disabled={!urls[i]} onClick={() => urls[i] && setZoom(urls[i])} className="text-start">
                <span className="relative block aspect-[1.6] overflow-hidden rounded-2xl border border-fg/10 bg-fg/5">
                  {urls[i] ? /* signed, short-lived storage URLs can't go through next/image */ <img src={urls[i]!} alt={doc.label} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-sm text-fg/50">{t.photoUnavailable}</span>}
                </span>
                <span className="mt-2 block text-sm font-semibold text-fg/70">{doc.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <dl className="divide-y divide-fg/10">
              {detail.rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3.5">
                  <dt className="text-sm text-fg/55">{label}</dt>
                  <dd className="select-all text-end font-semibold">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {error ? <ErrorNote>{error}</ErrorNote> : null}

          {rejecting ? (
            <Card className="space-y-4">
              <p className="text-sm text-fg/60">{t.rejectHint}</p>
              <Field label={t.reasonLabel}>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.reasonPlaceholder} rows={3} className="w-full rounded-2xl border border-fg/15 bg-fg/5 p-4 text-fg outline-none placeholder:text-fg/35 focus:border-volt" />
              </Field>
              <PrimaryButton type="button" loading={busy} disabled={!reason.trim()} onClick={() => decide("rejected")} className="!bg-[#ff5c3a]">{t.sendRejection}</PrimaryButton>
              <GhostButton type="button" onClick={() => setRejecting(false)} className="w-full">{dict.dash.common.cancel}</GhostButton>
            </Card>
          ) : (
            <div className="flex gap-3">
              {detail.status !== "rejected" ? <GhostButton type="button" onClick={() => setRejecting(true)} className="flex-1">{t.reject}</GhostButton> : null}
              {detail.status !== "approved" ? <PrimaryButton type="button" loading={busy} onClick={() => decide("approved")} className="flex-1">{t.approve}</PrimaryButton> : null}
            </div>
          )}
        </div>
      </div>

      {zoom ? (
        <button type="button" onClick={() => setZoom(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6" aria-label={dict.dash.common.back}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
        </button>
      ) : null}
    </>
  );
}
