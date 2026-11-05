import { ReactNode, InputHTMLAttributes, ButtonHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import BackLink from "@/components/BackLink";
import type { Locale } from "@/lib/i18n";

/** Centered card on the night background, for sign in, sign up and password reset. */
export function AuthShell({ lang, children, wide = false, back, backHref }: { lang: Locale; children: ReactNode; wide?: boolean; back?: string; backHref?: string }) {
  return (
    <div className="night grain relative isolate flex min-h-screen flex-col items-center overflow-hidden px-5 py-8 sm:px-8 sm:py-10">
      {/* One row: the way back on the far left, the logo in the middle */}
      <div className="mb-10 grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center sm:mb-14">
        <div>
          {back ? (() => {
            const style = "inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:px-5";
            const content = <><span aria-hidden className="rtl:rotate-180">←</span><span className="hidden sm:inline">{back}</span></>;
            return backHref
              ? <Link href={backHref} aria-label={back} className={style}>{content}</Link>
              : <BackLink href={`/${lang}`} label={back} className={style}>{content}</BackLink>;
          })() : null}
        </div>
        <Link href={`/${lang}`} aria-label="Voom"><Logo tone="white" height={44} /></Link>
        <span />
      </div>
      <div className={`glass w-full rounded-[2rem] p-8 shadow-2xl shadow-black/40 sm:p-12 ${wide ? "max-w-2xl" : "max-w-md"}`}>{children}</div>
    </div>
  );
}

const fieldBase = "h-14 w-full rounded-2xl border border-fg/15 bg-fg/5 px-5 text-base text-fg outline-none transition-colors placeholder:text-fg/35 focus:border-volt focus:bg-fg/10";

type FieldProps = { label: string; error?: string; hint?: string; children: ReactNode };
/** A label, the control, and its error or hint. */
export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-fg/60">{label}</span>
      {children}
      {error ? <span className="mt-2.5 block text-sm text-danger">{error}</span> : hint ? <span className="mt-2.5 block text-xs text-fg/45">{hint}</span> : null}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function TextInput({ invalid, className = "", ...props }, ref) {
  return <input ref={ref} {...props} className={`${fieldBase} ${invalid ? "!border-danger" : ""} ${className}`} />;
});

export function SelectInput({ children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldBase} appearance-none ${className}`}>{children}</select>;
}

export function PrimaryButton({ loading, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`flex h-14 w-full items-center justify-center gap-2 on-volt rounded-2xl bg-volt px-6 text-base font-bold text-white shadow-lg shadow-volt/30 transition-all hover:bg-volt-soft disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`flex h-14 items-center justify-center rounded-2xl border border-fg/15 px-6 text-base font-semibold text-fg transition-colors hover:bg-fg/10 disabled:opacity-40 ${className}`}>
      {children}
    </button>
  );
}

/** A tick box in the brand style: a rounded square that fills with purple when checked. */
export function Checkbox({ checked, onChange, invalid, children }: { checked: boolean; onChange: (checked: boolean) => void; invalid?: boolean; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-fg/5 text-transparent transition-colors peer-checked:border-volt peer-checked:bg-volt peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-volt/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-page ${invalid ? "border-danger" : "border-fg/30 hover:border-fg/50"}`}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </span>
      <span className="text-sm leading-relaxed text-fg/80">{children}</span>
    </label>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <span aria-hidden className={`inline-block animate-spin rounded-full border-2 border-fg/30 border-t-fg ${className}`} />;
}

/** A red note for something that went wrong. */
export function ErrorNote({ children }: { children: ReactNode }) {
  return <p role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{children}</p>;
}
