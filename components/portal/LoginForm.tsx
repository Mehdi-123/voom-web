"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import { sb } from "@/lib/supabase-browser";
import { authErrorMessage } from "@/lib/auth-errors";
import { useAuth } from "./AuthProvider";
import { ErrorNote, Field, PrimaryButton, TextInput } from "./ui";
import OtpBoxes, { OTP_LENGTH } from "./OtpBoxes";

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

  const cleanEmail = email.trim().toLowerCase();

  // Someone already signed in goes straight to the dashboard
  useEffect(() => {
    if (ready && user) router.replace(`/${lang}/dashboard`);
  }, [ready, user, lang, router]);

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
        await sb.auth.signInWithOtp({ email: cleanEmail, options: { shouldCreateUser: false } });
        setNeedsCode(true);
      } else {
        setError({ message: authErrorMessage(dict, err, t.failed), fields: ["email", "password"] });
      }
      setLoading(false);
      return;
    }
    router.replace(`/${lang}/dashboard`);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const token = digits.join("");
    let { error: err } = await sb.auth.verifyOtp({ email: cleanEmail, token, type: "email" });
    if (err) ({ error: err } = await sb.auth.verifyOtp({ email: cleanEmail, token, type: "signup" }));
    setLoading(false);
    if (err) { setError({ message: t.wrongCode, fields: [] }); setDigits(Array(OTP_LENGTH).fill("")); return; }
    router.replace(`/${lang}/dashboard`);
  }

  if (needsCode) {
    return (
      <form onSubmit={verify} className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{t.codeTitle}</h1>
          <p className="mt-3 leading-relaxed text-white/60">{t.notVerified}</p>
          <p className="mt-1 font-semibold">{cleanEmail}</p>
        </div>
        <OtpBoxes digits={digits} onChange={setDigits} label={t.code} />
        {error ? <ErrorNote>{error.message}</ErrorNote> : null}
        <PrimaryButton type="submit" loading={loading} disabled={digits.some((d) => !d)}>{loading ? t.verifying : t.verify}</PrimaryButton>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-7" noValidate>
      <div>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t.loginTitle}</h1>
        <p className="mt-3 leading-relaxed text-white/60">{t.loginSubtitle}</p>
      </div>
      <Field label={t.email} error={error?.fields.includes("email") && !error.fields.includes("password") ? error.message : undefined}>
        <TextInput type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} placeholder={t.emailPlaceholder} autoComplete="email" autoCapitalize="none" invalid={!!error?.fields.includes("email")} />
      </Field>
      <Field label={t.password} error={error?.fields.includes("password") ? error.message : undefined}>
        <TextInput type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} placeholder="••••••••" autoComplete="current-password" invalid={!!error?.fields.includes("password")} />
      </Field>
      <div className="flex justify-end pt-1">
        <Link href={`/${lang}/forgot`} className="text-sm font-semibold text-volt-soft hover:underline">{t.forgot}</Link>
      </div>
      <PrimaryButton type="submit" loading={loading}>{loading ? t.signingIn : t.login}</PrimaryButton>
      <p className="pt-2 text-center text-sm leading-relaxed text-white/60">
        {t.noAccount}{" "}
        <Link href={`/${lang}/signup`} className="font-bold text-volt-soft hover:underline">{t.createAccount}</Link>
      </p>
    </form>
  );
}
