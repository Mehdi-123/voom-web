import { ReactNode, InputHTMLAttributes, ButtonHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import type { Locale } from "@/lib/i18n";

/** Centered card on the night background, for sign in, sign up and password reset. */
export function AuthShell({ lang, children, wide = false }: { lang: Locale; children: ReactNode; wide?: boolean }) {
  return (
    <div className="night grain relative isolate flex min-h-screen flex-col items-center overflow-hidden px-5 py-12 sm:py-16">
      <Link href={`/${lang}`} aria-label="Voom" className="mb-12"><Logo tone="white" height={30} /></Link>
      <div className={`glass w-full rounded-[2rem] p-8 shadow-2xl shadow-black/40 sm:p-12 ${wide ? "max-w-2xl" : "max-w-md"}`}>{children}</div>
    </div>
  );
}

const fieldBase = "h-14 w-full rounded-2xl border border-white/15 bg-white/5 px-5 text-base text-white outline-none transition-colors placeholder:text-white/35 focus:border-volt focus:bg-white/10";

type FieldProps = { label: string; error?: string; hint?: string; children: ReactNode };
/** A label, the control, and its error or hint. */
export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-white/60">{label}</span>
      {children}
      {error ? <span className="mt-2.5 block text-sm text-[#ff7a5c]">{error}</span> : hint ? <span className="mt-2.5 block text-xs text-white/45">{hint}</span> : null}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function TextInput({ invalid, className = "", ...props }, ref) {
  return <input ref={ref} {...props} className={`${fieldBase} ${invalid ? "!border-[#ff7a5c]" : ""} ${className}`} />;
});

export function SelectInput({ children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldBase} appearance-none ${className}`}>{children}</select>;
}

export function PrimaryButton({ loading, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-volt px-6 text-base font-bold text-white shadow-lg shadow-volt/30 transition-all hover:bg-volt-soft disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`flex h-14 items-center justify-center rounded-2xl border border-white/15 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-40 ${className}`}>
      {children}
    </button>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <span aria-hidden className={`inline-block animate-spin rounded-full border-2 border-white/30 border-t-white ${className}`} />;
}

/** A red note for something that went wrong. */
export function ErrorNote({ children }: { children: ReactNode }) {
  return <p role="alert" className="rounded-2xl border border-[#ff7a5c]/40 bg-[#ff7a5c]/10 px-4 py-3 text-sm text-[#ffb1a1]">{children}</p>;
}
