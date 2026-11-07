"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { sb } from "@/lib/supabase-browser";
import { resizeToJpeg } from "@/lib/image";
import { formatPhone, isValidPhone, nationalNumber } from "@/lib/phone";
import { BellIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { useDash } from "./DashContext";
import { Card, Initial, Loading, PageHeader } from "./dash-ui";
import IdentityCard from "./IdentityCard";
import PasswordForm from "./PasswordForm";
import { ErrorNote, Field, PrimaryButton, TextInput } from "./ui";

/** The renter's profile: photo, name, phone, password, and what only the app can do. */
export default function MyProfile() {
  const { user, renter, refresh } = useAuth();
  const { dict } = useDash();
  const t = dict.dash;
  const m = t.me;
  const p = t.profile;
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(renter?.name ?? "");
  const [phone, setPhone] = useState(renter?.phone ? nationalNumber(renter.phone.replace(/^\+212/, "")) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  if (!user || !renter) return <Loading />;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError(t.auth.required); return; }
    if (phone.trim() && !isValidPhone(phone)) { setError(t.auth.invalidPhone); return; }
    setSaving(true);
    setError(null);
    const full = phone.trim() ? formatPhone(phone) : "";
    const [meta, row] = await Promise.all([
      sb.auth.updateUser({ data: { name: name.trim(), phone: full } }),
      sb.from("profiles").update({ name: name.trim(), phone: full || null }).eq("id", user!.id),
    ]);
    setSaving(false);
    if (meta.error || row.error) { setError(t.common.error); return; }
    setSaved(true);
    await refresh();
  }

  async function changePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) { setPhotoError(t.auth.fileType); return; }
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const blob = await resizeToJpeg(file, 600);
      const path = `${user.id}/avatar`;
      const up = await sb.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (up.error) throw up.error;
      // The address never changes, so a version is added to make browsers fetch the new picture
      const url = `${sb.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      const { error: err } = await sb.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (err) throw err;
      await refresh();
    } catch {
      setPhotoError(m.photoFailed);
    }
    setPhotoBusy(false);
  }

  const strikeTone = renter.strike_count === 0 ? "text-go" : renter.strike_count === 1 ? "text-warn" : "text-danger";

  return (
    <>
      <PageHeader title={m.profileTitle} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card className="flex flex-wrap items-center gap-5">
            <span className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fg/5">
              {renter.avatar_url ? <Image src={renter.avatar_url} alt="" fill sizes="96px" className="object-cover" unoptimized /> : <Initial name={renter.name} className="h-24 w-24 text-4xl" />}
            </span>
            <div className="min-w-[12rem] flex-1">
              <p className="font-bold">{m.photo}</p>
              <p className="mt-1 text-sm text-fg/55">{m.photoHint}</p>
              {photoError ? <p className="mt-2 text-sm text-danger">{photoError}</p> : null}
            </div>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={changePhoto} />
            <button type="button" onClick={() => fileInput.current?.click()} disabled={photoBusy} className="rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-fg/10 disabled:opacity-50">{photoBusy ? t.common.saving : m.changePhoto}</button>
          </Card>

          <form onSubmit={save} className="space-y-7">
            <Field label={m.name}><TextInput value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} autoComplete="name" /></Field>
            <Field label={p.phone}>
              <div dir="ltr" className="flex gap-2">
                <span className="flex h-14 items-center rounded-2xl border border-fg/15 bg-fg/5 px-4 font-semibold text-fg/70">+212</span>
                <TextInput type="tel" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/[^\d\s]/g, "")); setSaved(false); }} autoComplete="tel-national" />
              </div>
            </Field>
            {error ? <ErrorNote>{error}</ErrorNote> : null}
            <PrimaryButton type="submit" loading={saving} className="sm:w-auto sm:min-w-48">{saved ? `✓ ${t.common.saved}` : saving ? t.common.saving : t.common.save}</PrimaryButton>
          </form>

          <PasswordForm email={user.email ?? ""} />
        </div>

        <div className="space-y-6">
          <IdentityCard />
          <Card>
            <dl className="divide-y divide-fg/10">
              <div className="flex justify-between gap-4 py-4"><dt className="text-sm text-fg/55">{p.email}</dt><dd className="text-end font-semibold">{user.email}</dd></div>
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-fg/55">{m.strikes}</dt><dd className={`font-display text-2xl font-extrabold ${strikeTone}`}>{renter.strike_count}/3</dd></div>
            </dl>
            <p className="mt-2 text-xs text-fg/50">{m.strikesHint}</p>
          </Card>

          <div className="rounded-3xl border border-dashed border-fg/20 p-6">
            <p className="flex items-center gap-3 font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-volt/20 text-volt-soft"><BellIcon className="h-4 w-4" /></span>{p.appOnlyTitle}</p>
            <p className="mt-3 text-sm text-fg/60">{p.appOnlyText}</p>
            <ul className="mt-3 space-y-2 text-sm text-fg/80">
              {m.appOnlyItems.map((item) => <li key={item} className="flex gap-2"><span aria-hidden className="text-volt-soft">•</span>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
