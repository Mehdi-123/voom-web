"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import { sb } from "@/lib/supabase-browser";
import { authErrorMessage } from "@/lib/auth-errors";
import { readNext, useNextSuffix } from "@/lib/next-path";
import { emptyDocs, hasAllDocs, uploadIdentity, type DocFiles } from "@/lib/identity-docs";
import { PASSWORD_RULES, isStrongPassword } from "@/lib/password";
import { formatPhone, isValidPhone } from "@/lib/phone";
import { turnstileEnabled } from "@/lib/turnstile";
import { Checkbox, ErrorNote, Field, GhostButton, PrimaryButton, TextInput } from "./ui";
import PasswordInput from "./PasswordInput";
import { useAuth } from "./AuthProvider";
import OtpBoxes, { OTP_LENGTH } from "./OtpBoxes";
import Turnstile from "./Turnstile";
import IdentityPhotos from "./IdentityPhotos";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Renter sign-up: who you are, then the account, then the code sent by email.
 * Identity documents are added afterwards from the account page, where their review is tracked.
 */
export default function CustomerSignupForm({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.dash.auth;
  const router = useRouter();
  const { refresh } = useAuth();
  const nextSuffix = useNextSuffix(lang);
  const [step, setStep] = useState(1);
  const [coding, setCoding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [docs, setDocs] = useState<DocFiles>(emptyDocs);
  const [accepted, setAccepted] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resent, setResent] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaRound, setCaptchaRound] = useState(0);

  const cleanEmail = email.trim().toLowerCase();
  const mismatch = confirm && password !== confirm ? t.mismatch : undefined;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!name.trim()) e.name = t.required;
      if (!isValidPhone(phone)) e.phone = t.invalidPhone;
    } else if (step === 3) {
      if (!EMAIL.test(cleanEmail)) e.email = t.invalidEmail;
      if (!isStrongPassword(password)) e.password = t.required;
      if (password !== confirm) e.confirm = t.mismatch;
      if (!accepted) e.accepted = t.required;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
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
      body: JSON.stringify({ action: "signup", token: captcha, email: cleanEmail, password, data: { role: "customer", name: name.trim(), phone: formatPhone(phone) } }),
    }).catch(() => null);
    const result = (await res?.json().catch(() => null)) as { ok?: boolean; exists?: boolean; error?: { code?: string; message?: string; status?: number } } | null;
    setCaptchaRound((n) => n + 1);
    setLoading(false);
    if (!result?.ok) {
      setFormError(result?.error?.code === "captcha_failed" ? t.captchaFailed : authErrorMessage(dict, result?.error, t.registerFailed));
      return;
    }
    if (result.exists) { setFormError(t.exists); return; }
    setCoding(true);
  }

  async function verify(ev: FormEvent) {
    ev.preventDefault();
    setLoading(true);
    setFormError(null);
    const token = digits.join("");
    let { data, error } = await sb.auth.verifyOtp({ email: cleanEmail, token, type: "email" });
    if (error) ({ data, error } = await sb.auth.verifyOtp({ email: cleanEmail, token, type: "signup" }));
    if (error) { setLoading(false); setFormError(t.wrongCode); setDigits(Array(OTP_LENGTH).fill("")); return; }
    // Documents are optional. If they were all added they go up now; if that fails the account page offers them again.
    const userId = data.user?.id ?? (await sb.auth.getSession()).data.session?.user.id;
    const sent = userId && hasAllDocs(docs) ? await uploadIdentity(userId, docs) : true;
    // The account state was read as soon as the code was accepted, before the documents were filed
    await refresh();
    router.replace((sent && readNext(lang)) || `/${lang}/dashboard`);
  }

  async function resend() {
    const { error } = await sb.auth.signInWithOtp({ email: cleanEmail, options: { shouldCreateUser: false } });
    if (error) await sb.auth.resend({ type: "signup", email: cleanEmail });
    setResent(true);
  }

  if (coding) {
    return (
      <form onSubmit={verify} className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{t.codeTitle}</h1>
          <p className="mt-3 leading-relaxed text-fg/60">{t.codeSubtitle.replace("{email}", cleanEmail)}</p>
        </div>
        <OtpBoxes digits={digits} onChange={setDigits} label={t.code} />
        {formError ? <ErrorNote>{formError}</ErrorNote> : null}
        <PrimaryButton type="submit" loading={loading} disabled={digits.some((d) => !d)}>{loading ? t.verifying : t.verify}</PrimaryButton>
        <button type="button" onClick={resend} className="block w-full text-center text-sm font-semibold text-volt-soft hover:underline">{resent ? t.resent : t.resend}</button>
      </form>
    );
  }

  const rules = [
    { ok: PASSWORD_RULES.minLength(password), label: t.passwordRules.min },
    { ok: PASSWORD_RULES.uppercase(password), label: t.passwordRules.upper },
    { ok: PASSWORD_RULES.number(password), label: t.passwordRules.number },
  ];

  return (
    <form onSubmit={step === 3 ? createAccount : (ev) => { ev.preventDefault(); if (validate()) setStep((n) => n + 1); }} className="space-y-7" noValidate>
      <div>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t.customerSignupTitle}</h1>
        <p className="mt-3 leading-relaxed text-fg/60">{t.customerSignupSubtitle}</p>
      </div>

      <ol className="flex gap-2 py-1" aria-label={t.customerSteps[step - 1]}>
        {t.customerSteps.map((label, i) => (
          <li key={label} className="flex-1">
            <span className={`block h-1.5 rounded-full ${i < step ? "bg-volt" : "bg-fg/15"}`} />
            <span className={`mt-1.5 block text-xs font-semibold ${i + 1 === step ? "text-fg" : "text-fg/40"}`}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <>
          <Field label={t.fullName} error={errors.name}><TextInput value={name} onChange={(e) => setName(e.target.value)} invalid={!!errors.name} autoComplete="name" /></Field>
          <Field label={t.phone} error={errors.phone} hint={t.phoneHint}>
            <div dir="ltr" className="flex gap-2">
              <span className="flex h-14 items-center rounded-2xl border border-fg/15 bg-fg/5 px-4 font-semibold text-fg/70">+212</span>
              <TextInput type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))} invalid={!!errors.phone} autoComplete="tel-national" placeholder="6 12 34 56 78" />
            </div>
          </Field>
        </>
      ) : step === 2 ? (
        <>
          <div>
            <h2 className="font-display text-xl font-extrabold">{t.docsTitle}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-fg/60">{t.docsText}</p>
          </div>
          <IdentityPhotos dict={dict} files={docs} onChange={setDocs} />
        </>
      ) : (
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
          <Turnstile lang={lang} onToken={setCaptcha} resetKey={captchaRound} />
        </>
      )}

      {formError ? <ErrorNote>{formError}</ErrorNote> : null}

      <div className="flex gap-3 pt-3">
        {step > 1 ? <GhostButton type="button" onClick={() => { setErrors({}); setStep((n) => n - 1); }}>{dict.dash.common.back}</GhostButton> : null}
        <PrimaryButton type="submit" loading={loading} disabled={step === 3 && (!accepted || !isStrongPassword(password) || password !== confirm || (turnstileEnabled && !captcha))}>
          {step === 3 ? (loading ? t.creating : t.create) : step === 2 && !Object.values(docs).some(Boolean) ? t.skip : t.next}
        </PrimaryButton>
      </div>
      <p className="pt-2 text-center text-sm leading-relaxed text-fg/60">
        {t.haveAccount}{" "}
        <Link href={`/${lang}/login${nextSuffix}`} className="font-bold text-volt-soft hover:underline">{t.login}</Link>
      </p>
    </form>
  );
}
