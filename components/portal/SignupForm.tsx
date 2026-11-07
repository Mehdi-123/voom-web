"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import { sb } from "@/lib/supabase-browser";
import { authErrorMessage } from "@/lib/auth-errors";
import { cityOptions } from "@/lib/cities";
import { maskEmail } from "@/lib/mask-email";
import { useCooldown } from "@/lib/use-cooldown";
import { fill } from "@/lib/i18n";
import CityCombobox from "@/components/CityCombobox";
import { PASSWORD_RULES, isStrongPassword } from "@/lib/password";
import { formatPhone, isValidPhone } from "@/lib/phone";
import { Checkbox, ErrorNote, Field, GhostButton, PrimaryButton, TextInput } from "./ui";
import PasswordInput from "./PasswordInput";
import OtpBoxes, { OTP_LENGTH } from "./OtpBoxes";
import Turnstile from "./Turnstile";
import { turnstileEnabled } from "@/lib/turnstile";

const MAX_FILE = 8 * 1024 * 1024;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Phase = "form" | "code" | "upload-failed";

/** Agency sign-up: four steps (agency, address, documents, account), then the email code, then the licence goes up. */
export default function SignupForm({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.dash.auth;
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<Phase>("form");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [agencyName, setAgencyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [registration, setRegistration] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resent, setResent] = useState(false);
  const [wait, startWait] = useCooldown();
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaRound, setCaptchaRound] = useState(0);

  const cleanEmail = email.trim().toLowerCase();
  const mismatch = confirm && password !== confirm ? t.mismatch : undefined;

  function validate(): boolean {
    const e: Record<string, string> = {};
    const req = (key: string, value: string) => { if (!value.trim()) e[key] = t.required; };
    if (step === 1) {
      req("agencyName", agencyName); req("ownerName", ownerName);
      if (!isValidPhone(phone)) e.phone = t.invalidPhone;
    }
    if (step === 2) { req("city", city); req("address", address); }
    if (step === 3) {
      req("registration", registration);
      if (!file) e.file = t.required;
      else if (!["image/jpeg", "image/png"].includes(file.type)) e.file = t.fileType;
      else if (file.size > MAX_FILE) e.file = t.fileTooBig;
    }
    if (step === 4) {
      if (!EMAIL.test(cleanEmail)) e.email = t.invalidEmail;
      if (!isStrongPassword(password)) e.password = t.required;
      if (password !== confirm) e.confirm = t.mismatch;
      if (!accepted) e.accepted = t.required;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /** Files the licence and the registration number once the account is signed in. */
  async function sendDocuments() {
    setLoading(true);
    setFormError(null);
    const { data } = await sb.auth.getUser();
    const user = data.user;
    if (!user || !file) { setLoading(false); setPhase("upload-failed"); return; }
    const path = `${user.id}/license.${file.type === "image/png" ? "png" : "jpg"}`;
    const upload = await sb.storage.from("agency-documents").upload(path, file, { contentType: file.type, upsert: true });
    const update = upload.error ? null : await sb.from("agencies").update({ license_path: path, registration_number: registration.trim() }).eq("user_id", user.id);
    setLoading(false);
    if (upload.error || update?.error) { setPhase("upload-failed"); return; }
    router.replace(`/${lang}/dashboard`);
  }

  async function createAccount(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setFormError(null);
    // The account is created on our server, after it confirms the bot check
    const res = await fetch("/api/verified-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signup", token: captcha, email: cleanEmail, password,
        data: { role: "agency", agencyName: agencyName.trim(), ownerName: ownerName.trim(), city, address: address.trim(), phone: formatPhone(phone), name: agencyName.trim() },
      }),
    }).catch(() => null);
    const result = (await res?.json().catch(() => null)) as { ok?: boolean; exists?: boolean; error?: { code?: string; message?: string; status?: number } } | null;
    setCaptchaRound((n) => n + 1);
    if (!result?.ok) {
      setLoading(false);
      setFormError(result?.error?.code === "captcha_failed" ? t.captchaFailed : authErrorMessage(dict, result?.error, t.registerFailed));
      return;
    }
    if (result.exists) { setLoading(false); setFormError(t.exists); return; }
    setLoading(false);
    setPhase("code");
    startWait();
  }

  async function verify(ev: FormEvent) {
    ev.preventDefault();
    setLoading(true);
    setFormError(null);
    const token = digits.join("");
    let { error } = await sb.auth.verifyOtp({ email: cleanEmail, token, type: "email" });
    if (error) ({ error } = await sb.auth.verifyOtp({ email: cleanEmail, token, type: "signup" }));
    if (error) { setLoading(false); setFormError(t.wrongCode); setDigits(Array(OTP_LENGTH).fill("")); return; }
    await sendDocuments();
  }

  async function resend() {
    if (wait > 0) return;
    const { error } = await sb.auth.signInWithOtp({ email: cleanEmail, options: { shouldCreateUser: false } });
    if (error) await sb.auth.resend({ type: "signup", email: cleanEmail });
    setResent(true);
    startWait();
  }

  if (phase === "upload-failed") {
    return (
      <div className="space-y-8">
        <ErrorNote>{t.uploadFailed}</ErrorNote>
        <PrimaryButton type="button" loading={loading} onClick={sendDocuments}>{dict.dash.common.retry}</PrimaryButton>
      </div>
    );
  }

  if (phase === "code") {
    return (
      <form onSubmit={verify} className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{t.codeTitle}</h1>
          <p className="mt-3 leading-relaxed text-fg/60">{t.codeSubtitle.replace("{email}", maskEmail(cleanEmail))}</p>
        </div>
        <OtpBoxes digits={digits} onChange={setDigits} label={t.code} />
        {formError ? <ErrorNote>{formError}</ErrorNote> : null}
        <PrimaryButton type="submit" loading={loading} disabled={digits.some((d) => !d)}>{loading ? t.verifying : t.verify}</PrimaryButton>
        {resent && wait > 0 ? <p className="text-center text-sm font-semibold text-go">{t.resent}</p> : null}
        <button type="button" onClick={resend} disabled={wait > 0} className="block w-full text-center text-sm font-semibold text-volt-soft hover:underline disabled:cursor-not-allowed disabled:text-fg/40 disabled:no-underline">{wait > 0 ? fill(t.resendIn, { s: wait }) : t.resend}</button>
      </form>
    );
  }

  const rules = [
    { ok: PASSWORD_RULES.minLength(password), label: t.passwordRules.min },
    { ok: PASSWORD_RULES.uppercase(password), label: t.passwordRules.upper },
    { ok: PASSWORD_RULES.number(password), label: t.passwordRules.number },
  ];

  return (
    <form onSubmit={step === 4 ? createAccount : (ev) => { ev.preventDefault(); if (validate()) setStep((s) => s + 1); }} className="space-y-7" noValidate>
      <div>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t.signupTitle}</h1>
        <p className="mt-3 leading-relaxed text-fg/60">{t.signupSubtitle}</p>
      </div>

      <ol className="flex gap-2 py-1" aria-label={t.steps[step - 1]}>
        {t.steps.map((label, i) => (
          <li key={label} className="flex-1">
            <span className={`block h-1.5 rounded-full ${i < step ? "bg-volt" : "bg-fg/15"}`} />
            <span className={`mt-1.5 block text-xs font-semibold ${i + 1 === step ? "text-fg" : "text-fg/40"}`}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <>
          <Field label={t.agencyName} error={errors.agencyName}><TextInput value={agencyName} onChange={(e) => setAgencyName(e.target.value)} invalid={!!errors.agencyName} autoComplete="organization" /></Field>
          <Field label={t.ownerName} error={errors.ownerName}><TextInput value={ownerName} onChange={(e) => setOwnerName(e.target.value)} invalid={!!errors.ownerName} autoComplete="name" /></Field>
          <Field label={t.phone} error={errors.phone} hint={t.phoneHint}>
            <div dir="ltr" className="flex gap-2">
              <span className="flex h-14 items-center rounded-2xl border border-fg/15 bg-fg/5 px-4 font-semibold text-fg/70">+212</span>
              <TextInput type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))} invalid={!!errors.phone} autoComplete="tel-national" placeholder="6 12 34 56 78" />
            </div>
          </Field>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div>
            <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-fg/60">{t.city}</span>
            <CityCombobox id="signup-city" options={cityOptions(lang, "name")} value={city} onChange={setCity} label={t.city} placeholder={t.cityPlaceholder} variant="auth" invalid={!!errors.city} />
            {errors.city ? <span className="mt-2.5 block text-sm text-danger">{errors.city}</span> : null}
          </div>
          <Field label={t.address} error={errors.address}><TextInput value={address} onChange={(e) => setAddress(e.target.value)} invalid={!!errors.address} autoComplete="street-address" /></Field>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Field label={t.registration} error={errors.registration}><TextInput value={registration} onChange={(e) => setRegistration(e.target.value.toUpperCase())} invalid={!!errors.registration} /></Field>
          <Field label={t.license} error={errors.file} hint={t.licenseHint}>
            <span className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-5 text-center transition-colors hover:bg-fg/5 ${errors.file ? "border-danger" : file ? "border-volt/60" : "border-fg/20"}`}>
              <input type="file" accept="image/jpeg,image/png" capture={undefined} className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {file ? <span className="break-all text-sm font-semibold text-go">✓ {file.name}</span> : null}
              <span className="rounded-full bg-fg/10 px-5 py-2 text-sm font-semibold">{file ? t.changeFile : t.chooseFile}</span>
            </span>
          </Field>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Field label={t.email} error={errors.email}><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} invalid={!!errors.email} autoComplete="email" /></Field>
          <Field label={t.password} error={errors.password}>
            <PasswordInput common={dict.dash.common} value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} autoComplete="new-password" />
            <ul className="mt-4 space-y-2">
              {rules.map((r) => (
                <li key={r.label} className={`flex items-center gap-2 text-sm ${r.ok ? "text-go" : "text-fg/45"}`}>
                  <span aria-hidden className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${r.ok ? "bg-go text-ink" : "border border-fg/30"}`}>{r.ok ? "✓" : ""}</span>
                  {r.label}
                </li>
              ))}
            </ul>
          </Field>
          <Field label={t.confirmPassword} error={errors.confirm ?? mismatch}><PasswordInput common={dict.dash.common} value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={!!(errors.confirm ?? mismatch)} autoComplete="new-password" /></Field>
          <div>
            <Checkbox checked={accepted} onChange={setAccepted} invalid={!!errors.accepted}>
              {t.accept}{" "}
              <Link href={`/${lang}/terms`} target="_blank" className="font-semibold text-volt-soft underline">↗</Link>
            </Checkbox>
            {errors.accepted ? <span className="mt-1.5 block text-sm text-danger">{errors.accepted}</span> : null}
          </div>
        </>
      ) : null}

      {step === 4 ? <Turnstile lang={lang} onToken={setCaptcha} resetKey={captchaRound} /> : null}

      {formError ? <ErrorNote>{formError}</ErrorNote> : null}

      <div className="flex gap-3 pt-3">
        {step > 1 ? <GhostButton type="button" onClick={() => { setErrors({}); setStep((s) => s - 1); }}>{dict.dash.common.back}</GhostButton> : null}
        <PrimaryButton type="submit" loading={loading} disabled={step === 4 && (!accepted || !isStrongPassword(password) || password !== confirm || (turnstileEnabled && !captcha))}>
          {step === 4 ? (loading ? t.creating : t.create) : t.next}
        </PrimaryButton>
      </div>
      <p className="pt-2 text-center text-sm leading-relaxed text-fg/60">
        {t.haveAccount}{" "}
        <Link href={`/${lang}/login`} className="font-bold text-volt-soft hover:underline">{t.login}</Link>
      </p>
    </form>
  );
}
