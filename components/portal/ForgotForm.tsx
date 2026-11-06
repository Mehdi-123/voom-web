"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import { sb } from "@/lib/supabase-browser";
import { authErrorMessage } from "@/lib/auth-errors";
import { PASSWORD_RULES, isStrongPassword } from "@/lib/password";
import { ErrorNote, Field, PrimaryButton, TextInput } from "./ui";
import PasswordInput from "./PasswordInput";
import OtpBoxes, { OTP_LENGTH } from "./OtpBoxes";
import Turnstile from "./Turnstile";
import { turnstileEnabled } from "@/lib/turnstile";

/** Password recovery: the email, the 6-digit code we send, then a new password. */
export default function ForgotForm({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.dash.auth;
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaRound, setCaptchaRound] = useState(0);

  const cleanEmail = email.trim().toLowerCase();

  async function send(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/verified-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recover", token: captcha, email: cleanEmail }),
    }).catch(() => null);
    const result = (await res?.json().catch(() => null)) as { ok?: boolean; error?: { code?: string; message?: string; status?: number } } | null;
    setLoading(false);
    setCaptchaRound((n) => n + 1);
    if (!result?.ok) { setError(result?.error?.code === "captcha_failed" ? t.captchaFailed : authErrorMessage(dict, result?.error, t.sendFailed)); return; }
    setStep(2);
  }

  async function check(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await sb.auth.verifyOtp({ email: cleanEmail, token: digits.join(""), type: "recovery" });
    setLoading(false);
    if (err) { setError(t.wrongCode); setDigits(Array(OTP_LENGTH).fill("")); return; }
    setStep(3);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await sb.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(authErrorMessage(dict, err, dict.dash.common.error)); return; }
    // The code already signed the person in, so they go straight to the dashboard
    router.replace(`/${lang}/dashboard`);
  }

  const copy = step === 1 ? [t.forgotTitle, t.forgotSubtitle] : step === 2 ? [t.codeTitle, t.codeSubtitle.replace("{email}", cleanEmail)] : [t.newTitle, t.newSubtitle];
  const rules = [
    { ok: PASSWORD_RULES.minLength(password), label: t.passwordRules.min },
    { ok: PASSWORD_RULES.uppercase(password), label: t.passwordRules.upper },
    { ok: PASSWORD_RULES.number(password), label: t.passwordRules.number },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{copy[0]}</h1>
        <p className="mt-3 leading-relaxed text-fg/60">{copy[1]}</p>
      </div>

      {step === 1 ? (
        <form onSubmit={send} className="space-y-7">
          <Field label={t.email}><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} autoComplete="email" /></Field>
          <Turnstile lang={lang} onToken={setCaptcha} resetKey={captchaRound} />
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <PrimaryButton type="submit" loading={loading} disabled={!cleanEmail || (turnstileEnabled && !captcha)}>{t.sendCode}</PrimaryButton>
        </form>
      ) : null}

      {step === 2 ? (
        <form onSubmit={check} className="space-y-7">
          <OtpBoxes digits={digits} onChange={setDigits} label={t.code} />
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <PrimaryButton type="submit" loading={loading} disabled={digits.some((d) => !d)}>{t.verify}</PrimaryButton>
          <button type="button" onClick={() => send()} className="block w-full text-center text-sm font-semibold text-volt-soft hover:underline">{t.resend}</button>
        </form>
      ) : null}

      {step === 3 ? (
        <form onSubmit={save} className="space-y-7">
          <Field label={t.password}>
            <PasswordInput common={dict.dash.common} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <ul className="mt-4 space-y-2">
              {rules.map((r) => <li key={r.label} className={`text-sm ${r.ok ? "text-go" : "text-fg/45"}`}>{r.ok ? "✓" : "○"} {r.label}</li>)}
            </ul>
          </Field>
          <Field label={t.confirmPassword} error={confirm && password !== confirm ? t.mismatch : undefined}><PasswordInput common={dict.dash.common} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></Field>
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <PrimaryButton type="submit" loading={loading} disabled={!isStrongPassword(password) || password !== confirm}>{t.savePassword}</PrimaryButton>
        </form>
      ) : null}

      <p className="text-center text-sm"><Link href={`/${lang}/login`} className="font-semibold text-volt-soft hover:underline">{t.backToLogin}</Link></p>
    </div>
  );
}
