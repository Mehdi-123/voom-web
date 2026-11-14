"use client";

import { FormEvent } from "react";
import type { Dictionary } from "@/dictionaries/fr";
import { fill } from "@/lib/i18n";
import { maskEmail } from "@/lib/mask-email";
import OtpBoxes from "./OtpBoxes";
import { ErrorNote, GhostButton, PrimaryButton, SuccessNote } from "./ui";

/**
 * The page that asks for the six-digit code sent by email: the same for a new account, an agency and a sign-in that needs its email checked.
 * The button stays available and says what is missing; "Send a new code" waits for its countdown; Back returns to the step before.
 */
export default function CodeStep({ dict, email, intro, digits, onDigits, loading, error, wait, resent, onResend, onSubmit, onBack }: {
  dict: Dictionary; email: string; /** Replaces the usual line under the title. */ intro?: string;
  digits: string[]; onDigits: (digits: string[]) => void; loading: boolean; error: string | null;
  wait: number; resent: boolean; onResend: () => void; onSubmit: (e: FormEvent) => void; onBack: () => void;
}) {
  const t = dict.dash.auth;
  const incomplete = digits.some((d) => !d);
  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <div>
        <h1 className="font-display text-3xl font-extrabold">{t.codeTitle}</h1>
        <p className="mt-3 leading-relaxed text-fg/60">{intro ? `${intro} ` : ""}{t.codeSubtitle.replace("{email}", maskEmail(email))}</p>
      </div>
      <OtpBoxes digits={digits} onChange={onDigits} label={t.code} />
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {!error && resent && wait > 0 ? <SuccessNote>{t.resent}</SuccessNote> : null}
      <PrimaryButton type="submit" loading={loading} aria-disabled={incomplete}>{loading ? t.verifying : t.verify}</PrimaryButton>
      <button type="button" onClick={onResend} disabled={wait > 0} className="block w-full text-center text-sm font-semibold text-volt-soft hover:underline disabled:cursor-not-allowed disabled:text-fg/40 disabled:no-underline">{wait > 0 ? fill(t.resendIn, { s: wait }) : t.resend}</button>
      <GhostButton type="button" onClick={onBack}>{dict.dash.common.back}</GhostButton>
    </form>
  );
}
