"use client";

import { FormEvent, useState } from "react";
import { sb } from "@/lib/supabase-browser";
import { formatPhone, isValidPhone, nationalNumber } from "@/lib/phone";
import { useAuth } from "@/components/portal/AuthProvider";
import { useDash } from "@/components/portal/DashContext";
import { Card, Loading, PageHeader, StatusBadge } from "@/components/portal/dash-ui";
import { ErrorNote, Field, PrimaryButton, TextInput } from "@/components/portal/ui";

export default function ProfilePage() {
  const { agency, user, refresh } = useAuth();
  const { dict } = useDash();
  const t = dict.dash;
  const [name, setName] = useState(agency?.name ?? "");
  const [phone, setPhone] = useState(agency?.phone ? nationalNumber(agency.phone.replace(/^\+212/, "")) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!agency || !user) return <Loading />;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError(t.auth.required); return; }
    if (!isValidPhone(phone)) { setError(t.auth.invalidPhone); return; }
    setSaving(true);
    setError(null);
    const full = formatPhone(phone);
    // The agency's row is what customers and admins read; the account's own details are kept in step
    const [row, meta] = await Promise.all([
      sb.from("agencies").update({ name: name.trim(), phone: full }).eq("id", agency!.id),
      sb.auth.updateUser({ data: { agencyName: name.trim(), phone: full } }),
    ]);
    setSaving(false);
    if (row.error || meta.error) { setError(t.common.error); return; }
    setSaved(true);
    await refresh();
  }

  return (
    <>
      <PageHeader title={t.profile.title} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={save} className="space-y-5">
          <Field label={t.profile.name}><TextInput value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} /></Field>
          <Field label={t.profile.phone}>
            <div dir="ltr" className="flex gap-2">
              <span className="flex h-14 items-center rounded-2xl border border-white/15 bg-white/5 px-4 font-semibold text-white/70">+212</span>
              <TextInput type="tel" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/[^\d\s]/g, "")); setSaved(false); }} />
            </div>
          </Field>
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <PrimaryButton type="submit" loading={saving} className="sm:w-auto sm:min-w-48">{saved ? `✓ ${t.common.saved}` : saving ? t.common.saving : t.common.save}</PrimaryButton>
        </form>

        <Card>
          <dl className="divide-y divide-white/10">
            {[
              [t.profile.email, user.email ?? "—"],
              [t.profile.city, agency.city],
              [t.profile.registration, agency.registration_number ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-4">
                <dt className="text-sm text-white/55">{label}</dt>
                <dd className="text-end font-semibold">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm text-white/55">{t.profile.approval}</dt>
              <dd><StatusBadge status={agency.approval_status} label={t.status[agency.approval_status]} /></dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-white/45">{t.profile.passwordNote}</p>
        </Card>
      </div>
    </>
  );
}
