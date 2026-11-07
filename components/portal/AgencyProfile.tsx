"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { sb } from "@/lib/supabase-browser";
import { resizeToJpeg } from "@/lib/image";
import { formatPhone, isValidPhone, nationalNumber } from "@/lib/phone";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { Card, Initial, Loading, PageHeader, StatusBadge } from "./dash-ui";
import { ErrorNote, Field, PrimaryButton, TextInput } from "./ui";
import PasswordForm from "./PasswordForm";
import { BellIcon } from "@/components/Icons";

export default function AgencyProfile() {
  const { agency, user, refresh } = useAuth();
  const { dict } = useDash();
  const t = dict.dash;
  const p = t.profile;
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(agency?.name ?? "");
  const [phone, setPhone] = useState(agency?.phone ? nationalNumber(agency.phone.replace(/^\+212/, "")) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

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

  async function changeLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user || !agency) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) { setLogoError(t.auth.fileType); return; }
    setLogoBusy(true);
    setLogoError(null);
    try {
      const blob = await resizeToJpeg(file, 600);
      const path = `${user.id}-${Date.now()}.jpg`;
      const up = await sb.storage.from("agency-logos").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (up.error) throw up.error;
      const url = sb.storage.from("agency-logos").getPublicUrl(up.data.path).data.publicUrl;
      const [a, pr] = await Promise.all([sb.from("agencies").update({ logo_url: url }).eq("id", agency.id), sb.from("profiles").update({ avatar_url: url }).eq("id", user.id)]);
      if (a.error || pr.error) throw a.error ?? pr.error;
      await refresh();
    } catch {
      setLogoError(p.logoFailed);
    }
    setLogoBusy(false);
  }

  return (
    <>
      <PageHeader title={p.title} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {/* Logo */}
          <Card className="flex flex-wrap items-center gap-5">
            <span className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-fg/5">
              {agency.logo_url ? <Image src={agency.logo_url} alt="" fill sizes="96px" className="object-cover" /> : <Initial name={agency.name} className="h-24 w-24 !rounded-3xl text-4xl" />}
            </span>
            <div className="min-w-[12rem] flex-1">
              <p className="font-bold">{p.logo}</p>
              <p className="mt-1 text-sm text-fg/55">{p.logoHint}</p>
              {logoError ? <p className="mt-2 text-sm text-danger">{logoError}</p> : null}
            </div>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={changeLogo} />
            <button type="button" onClick={() => fileInput.current?.click()} disabled={logoBusy} className="rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-fg/10 disabled:opacity-50">{logoBusy ? t.common.saving : p.changeLogo}</button>
          </Card>

          <form onSubmit={save} className="space-y-7">
            <Field label={p.name}><TextInput value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} /></Field>
            <Field label={p.phone}>
              <div dir="ltr" className="flex gap-2">
                <span className="flex h-14 items-center rounded-2xl border border-fg/15 bg-fg/5 px-4 font-semibold text-fg/70">+212</span>
                <TextInput type="tel" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/[^\d\s]/g, "")); setSaved(false); }} />
              </div>
            </Field>
            {error ? <ErrorNote>{error}</ErrorNote> : null}
            <PrimaryButton type="submit" loading={saving} className="sm:w-auto sm:min-w-48">{saved ? `✓ ${t.common.saved}` : saving ? t.common.saving : t.common.save}</PrimaryButton>
          </form>

          <PasswordForm email={user.email ?? ""} />
        </div>

        <div className="space-y-6">
          <Card>
            <dl className="divide-y divide-fg/10">
              {[
                [p.email, user.email ?? "—"],
                [p.city, agency.city],
                [p.address, agency.address ?? "—"],
                [p.registration, agency.registration_number ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-4">
                  <dt className="text-sm text-fg/55">{label}</dt>
                  <dd className="text-end font-semibold">{value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-fg/55">{p.approval}</dt>
                <dd><StatusBadge status={agency.approval_status} label={t.status[agency.approval_status]} /></dd>
              </div>
            </dl>
          </Card>

          {/* What the website cannot do */}
          <div className="rounded-3xl border border-dashed border-fg/20 p-6">
            <p className="flex items-center gap-3 font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-volt/20 text-volt-soft"><BellIcon className="h-4 w-4" /></span>{p.appOnlyTitle}</p>
            <p className="mt-3 text-sm text-fg/60">{p.appOnlyText}</p>
            <ul className="mt-3 space-y-2 text-sm text-fg/80">
              {p.appOnlyItems.map((item) => <li key={item} className="flex gap-2"><span aria-hidden className="text-volt-soft">•</span>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
