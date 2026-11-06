"use client";

import { FormEvent, useState } from "react";
import { sb } from "@/lib/supabase-browser";
import { PASSWORD_RULES, isStrongPassword } from "@/lib/password";
import { useDash } from "./DashContext";
import { ErrorNote, Field, PrimaryButton } from "./ui";
import PasswordInput from "./PasswordInput";

/** Change the password: the current one is checked first, like in the app. */
export default function PasswordForm({ email }: { email: string }) {
  const { dict } = useDash();
  const t = dict.dash;
  const p = t.profile;
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setDone(false);
    if (!current) { setError(t.auth.required); return; }
    if (!isStrongPassword(password)) { setError(t.auth.required); return; }
    if (password !== confirm) { setError(p.passwordMismatch); return; }
    setBusy(true);
    setError(null);
    const check = await sb.auth.signInWithPassword({ email, password: current });
    if (check.error) { setBusy(false); setError(p.wrongPassword); return; }
    const { error: err } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (err) { setError(p.passwordFailed); return; }
    setCurrent(""); setPassword(""); setConfirm(""); setDone(true);
  }

  const rules = [
    { ok: PASSWORD_RULES.minLength(password), label: t.auth.passwordRules.min },
    { ok: PASSWORD_RULES.uppercase(password), label: t.auth.passwordRules.upper },
    { ok: PASSWORD_RULES.number(password), label: t.auth.passwordRules.number },
  ];

  return (
    <form onSubmit={submit} className="glass space-y-6 rounded-3xl p-6">
      <h2 className="font-bold">{p.security}</h2>
      <Field label={p.currentPassword}><PasswordInput common={t.common} value={current} onChange={(e) => { setCurrent(e.target.value); setDone(false); }} autoComplete="current-password" /></Field>
      <Field label={p.newPassword}>
        <PasswordInput common={t.common} value={password} onChange={(e) => { setPassword(e.target.value); setDone(false); }} autoComplete="new-password" />
        <ul className="mt-4 space-y-2">
          {rules.map((r) => (
            <li key={r.label} className={`flex items-center gap-2 text-sm ${r.ok ? "text-go" : "text-fg/45"}`}>
              <span aria-hidden className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${r.ok ? "bg-go text-white" : "border border-fg/30"}`}>{r.ok ? "✓" : ""}</span>
              {r.label}
            </li>
          ))}
        </ul>
      </Field>
      <Field label={p.confirmPassword}><PasswordInput common={t.common} value={confirm} onChange={(e) => { setConfirm(e.target.value); setDone(false); }} autoComplete="new-password" invalid={!!confirm && confirm !== password} /></Field>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <PrimaryButton type="submit" loading={busy} disabled={!current || !isStrongPassword(password) || password !== confirm} className="sm:w-auto sm:min-w-48">{done ? `✓ ${p.passwordUpdated}` : p.updatePassword}</PrimaryButton>
    </form>
  );
}
