"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import { sb } from "@/lib/supabase-browser";
import { authErrorMessage } from "@/lib/auth-errors";
import { useAuth } from "./AuthProvider";
import { readNext, useNextSuffix } from "@/lib/next-path";
import { Field, PrimaryButton, TextInput } from "./ui";
import PasswordInput from "./PasswordInput";
import { OTP_LENGTH } from "./OtpBoxes";
import CodeStep from "./CodeStep";
import { sendEmailCode, verifyEmailCode } from "@/lib/email-code";
import { useCooldown } from "@/lib/use-cooldown";
import { useStepBack } from "@/lib/use-step-back";

/** Email and password. If the email was never verified, the same card asks for the code we just sent. */
export default function LoginForm({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.dash.auth;
  const router = useRouter();
  const { ready, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; fields: ("email" | "password")[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [wait, startWait] = useCooldown();

  const cleanEmail = email.trim().toLowerCase();
  const nextSuffix = useNextSuffix(lang);
  const destination = () => readNext(lang) ?? `/${lang}/dashboard`;

  // Someone already signed in goes straight to the dashboard
  useEffect(() => {
    if (ready && user) router.replace(readNext(lang) ?? `/${lang}/dashboard`);
  }, [ready, user, lang, router]);

  // The browser keeps this page alive after a login. When the person signs out and comes back, it must be a fresh form, not one still "loading".
  useEffect(() => {
    if (!ready || user) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(false);
    setPassword("");
    setNeedsCode(false);
    setSentTo(null);
    setDigits(Array(OTP_LENGTH).fill(""));
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [ready, user]);

  // Back from the code page shows the sign-in form again, as typed
  useStepBack(needsCode, () => setNeedsCode(false));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const missing: ("email" | "password")[] = [...(cleanEmail ? [] : ["email" as const]), ...(password ? [] : ["password" as const])];
    if (missing.length) {
      setError({ message: missing.length === 2 ? t.fillBoth : missing[0] === "email" ? t.emailPlaceholder : t.password, fields: missing });
      return;
    }
    setError(null);
    setLoading(true);
    const { error: err } = await sb.auth.signInWithPassword({ email: cleanEmail, password });
    if (err) {
      if (err.code === "email_not_confirmed" || /email not confirmed/i.test(err.message)) {
        // A code is sent once a minute: coming back with the same email shows the page again without sending another
        if (sentTo !== cleanEmail || wait <= 0) { await sendEmailCode(cleanEmail); setSentTo(cleanEmail); setResent(false); startWait(); }
        setNeedsCode(true);
      } else {
        setError({ message: authErrorMessage(dict, err, t.failed), fields: ["email", "password"] });
      }
      setLoading(false);
      return;
    }
    router.replace(destination());
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (digits.some((d) => !d)) { setError({ message: t.codeIncomplete, fields: [] }); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await verifyEmailCode(cleanEmail, digits.join(""));
    setLoading(false);
    if (err) { setError({ message: t.wrongCode, fields: [] }); setDigits(Array(OTP_LENGTH).fill("")); return; }
    router.replace(destination());
  }

  async function resend() {
    if (wait > 0) return;
    await sendEmailCode(cleanEmail);
    setResent(true);
    setError(null);
    startWait();
  }

  if (needsCode) {
    return <CodeStep dict={dict} email={cleanEmail} intro={t.notVerified} digits={digits} onDigits={setDigits} loading={loading} error={error?.message ?? null} wait={wait} resent={resent} onResend={resend} onSubmit={verify} onBack={() => window.history.back()} />;
  }

  return (
    <form onSubmit={submit} className="space-y-7" noValidate>
      <div>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t.loginTitle}</h1>
        <p className="mt-3 leading-relaxed text-fg/60">{t.loginSubtitle}</p>
      </div>
      <Field label={t.email} error={error?.fields.includes("email") && !error.fields.includes("password") ? error.message : undefined}>
        <TextInput type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} placeholder={t.emailPlaceholder} autoComplete="email" autoCapitalize="none" invalid={!!error?.fields.includes("email")} />
      </Field>
      <Field label={t.password} error={error?.fields.includes("password") ? error.message : undefined}>
        <PasswordInput common={dict.dash.common} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} placeholder="••••••••" autoComplete="current-password" invalid={!!error?.fields.includes("password")} />
      </Field>
      <div className="flex justify-end pt-1">
        <Link href={`/${lang}/forgot`} className="text-sm font-semibold text-volt-soft hover:underline">{t.forgot}</Link>
      </div>
      <PrimaryButton type="submit" loading={loading}>{loading ? t.signingIn : t.login}</PrimaryButton>
      <p className="pt-2 text-center text-sm leading-relaxed text-fg/60">
        {t.noAccount}{" "}
        <Link href={`/${lang}/signup${nextSuffix}`} className="font-bold text-volt-soft hover:underline">{t.createAccount}</Link>
      </p>
    </form>
  );
}
