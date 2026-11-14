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
import { DEFAULT_COUNTRY, formatPhone, isValidPhone, type Country } from "@/lib/phone";
import { turnstileEnabled } from "@/lib/turnstile";
import { sendEmailCode, verifyEmailCode } from "@/lib/email-code";
import { useCooldown } from "@/lib/use-cooldown";
import { useStepBack } from "@/lib/use-step-back";
import { Checkbox, ErrorNote, Field, GhostButton, PrimaryButton, TextInput } from "./ui";
import PasswordInput from "./PasswordInput";
import PhoneInput from "./PhoneInput";
import { useAuth } from "./AuthProvider";
import { OTP_LENGTH } from "./OtpBoxes";
import CodeStep from "./CodeStep";
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
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [docs, setDocs] = useState<DocFiles>(emptyDocs);
  const [accepted, setAccepted] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resent, setResent] = useState(false);
  const [wait, startWait] = useCooldown();
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaRound, setCaptchaRound] = useState(0);
  // Once a code was sent the account exists: going back and forward again shows the code page without creating it twice
  const [sentWith, setSentWith] = useState<{ email: string; password: string } | null>(null);

  const cleanEmail = email.trim().toLowerCase();
  const someDocs = Object.values(docs).some(Boolean);
  const allDocs = hasAllDocs(docs);
  const mismatch = confirm && password !== confirm ? t.mismatch : undefined;

  useStepBack(coding, () => setCoding(false));

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!name.trim()) e.name = t.required;
      if (!isValidPhone(country, phone)) e.phone = t.invalidPhone;
    } else if (step === 2) {
      if (someDocs && !allDocs) e.docs = t.docsAllOrNone;
    } else if (step === 3) {
      if (!EMAIL.test(cleanEmail)) e.email = t.invalidEmail;
      if (!password) e.password = t.required;
      else if (!isStrongPassword(password)) e.password = t.passwordWeak;
      if (!confirm) e.confirm = t.required;
      else if (password !== confirm) e.confirm = t.mismatch;
      if (!accepted) e.accepted = t.required;
      if (turnstileEnabled && !captcha && !sentWith) e.captcha = t.captchaRequired;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function createAccount(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setFormError(null);
    if (sentWith?.email === cleanEmail) { setCoding(true); return; }
    setLoading(true);
    // The account is created on our server, after it confirms the bot check
    const res = await fetch("/api/verified-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signup", token: captcha, email: cleanEmail, password, data: { role: "customer", name: name.trim(), phone: formatPhone(country, phone) } }),
    }).catch(() => null);
    const result = (await res?.json().catch(() => null)) as { ok?: boolean; exists?: boolean; error?: { code?: string; message?: string; status?: number } } | null;
    setCaptchaRound((n) => n + 1);
    setLoading(false);
    if (!result?.ok) {
      setFormError(result?.error?.code === "captcha_failed" ? t.captchaFailed : authErrorMessage(dict, result?.error, t.registerFailed));
      return;
    }
    if (result.exists) { setFormError(t.exists); return; }
    setSentWith({ email: cleanEmail, password });
    setCoding(true);
    startWait();
  }

  async function verify(ev: FormEvent) {
    ev.preventDefault();
    if (digits.some((d) => !d)) { setFormError(t.codeIncomplete); return; }
    setLoading(true);
    setFormError(null);
    const { data, error } = await verifyEmailCode(cleanEmail, digits.join(""));
    if (error) { setLoading(false); setFormError(t.wrongCode); setDigits(Array(OTP_LENGTH).fill("")); return; }
    // A password changed after going back from this page replaces the one the account was created with
    if (sentWith && password !== sentWith.password) await sb.auth.updateUser({ password });
    // Documents are optional. If they were all added they go up now; if that fails the account page offers them again.
    const userId = data.user?.id ?? (await sb.auth.getSession()).data.session?.user.id;
    const sent = userId && hasAllDocs(docs) ? await uploadIdentity(userId, docs) : true;
    // The account state was read as soon as the code was accepted, before the documents were filed
    await refresh();
    router.replace((sent && readNext(lang)) || `/${lang}/dashboard`);
  }

  async function resend() {
    if (wait > 0) return;
    await sendEmailCode(cleanEmail);
    setResent(true);
    setFormError(null);
    startWait();
  }

  if (coding) {
    return <CodeStep dict={dict} email={cleanEmail} digits={digits} onDigits={setDigits} loading={loading} error={formError} wait={wait} resent={resent} onResend={resend} onSubmit={verify} onBack={() => window.history.back()} />;
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
          <Field group label={t.phone} error={errors.phone} hint={t.phoneHint}>
            <PhoneInput lang={lang} labels={{ country: t.phoneCountry, search: t.phoneSearch, none: t.phoneNone }} country={country} onCountry={setCountry} value={phone} onChange={setPhone} invalid={!!errors.phone} placeholder={country.iso === "MA" ? "6 12 34 56 78" : undefined} />
          </Field>
        </>
      ) : step === 2 ? (
        <>
          <div>
            <h2 className="font-display text-xl font-extrabold">{t.docsTitle}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-fg/60">{t.docsText}</p>
          </div>
          <IdentityPhotos dict={dict} files={docs} onChange={setDocs} />
          {errors.docs ? <p className="text-sm font-semibold text-danger">{errors.docs}</p> : null}
        </>
      ) : (
        <>
          <Field label={t.email} error={errors.email}><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} invalid={!!errors.email} autoComplete="email" readOnly={!!sentWith} className={sentWith ? "opacity-60" : ""} /></Field>
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
          <div>
            <Turnstile lang={lang} onToken={setCaptcha} resetKey={captchaRound} />
            {errors.captcha ? <span className="mt-2 block text-sm text-danger">{errors.captcha}</span> : null}
          </div>
        </>
      )}

      {formError ? <ErrorNote>{formError}</ErrorNote> : null}

      <div className="flex gap-3 pt-3">
        {step > 1 && !sentWith ? <GhostButton type="button" onClick={() => { setErrors({}); setStep((n) => n - 1); }}>{dict.dash.common.back}</GhostButton> : null}
        <PrimaryButton type="submit" loading={loading}>
          {step === 3 ? (loading ? t.creating : t.create) : step === 2 && !someDocs ? t.skip : t.next}
        </PrimaryButton>
      </div>
      <p className="pt-2 text-center text-sm leading-relaxed text-fg/60">
        {t.haveAccount}{" "}
        <Link href={`/${lang}/login${nextSuffix}`} className="font-bold text-volt-soft hover:underline">{t.login}</Link>
      </p>
    </form>
  );
}
