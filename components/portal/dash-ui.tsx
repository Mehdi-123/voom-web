import { ReactNode } from "react";
import { StarIcon } from "@/components/Icons";
import { Spinner } from "./ui";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-fg/60">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl p-6 ${className}`}>{children}</div>;
}

export function Stat({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "accent" | "good" }) {
  const toneClass = tone === "accent" ? "on-volt bg-gradient-to-br from-volt-deep to-volt-mid border-transparent" : "glass";
  return (
    <div className={`rounded-3xl border border-fg/10 p-6 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-fg/60">{label}</p>
      <p className={`font-display mt-3 whitespace-nowrap text-[clamp(1.4rem,13cqw,2.25rem)] font-extrabold leading-tight tracking-tight ${tone === "good" ? "text-go" : ""}`}>{value}</p>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warn/15 text-warn",
  confirmed: "bg-volt/20 text-volt-soft",
  active: "bg-info/15 text-info",
  completed: "bg-go/15 text-go",
  approved: "bg-go/15 text-go",
  cancelled: "bg-fg/10 text-fg/60",
  no_show: "bg-[#ff5c3a]/15 text-danger",
  rejected: "bg-[#ff5c3a]/15 text-danger",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`inline-block w-fit justify-self-start rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[status] ?? "bg-fg/10"}`}>{label}</span>;
}

export function Loading() {
  return <div className="flex justify-center py-24"><Spinner className="h-8 w-8" /></div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-fg/15 p-12 text-center text-fg/60">{children}</div>;
}

/** Day and month in the reader's language, e.g. "12 nov." */
export function shortDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-GB" : "fr-MA", { day: "numeric", month: "short" });
}

/** "5 min ago", "2 days ago", in the reader's language. */
export function timeAgo(iso: string, locale: string, now: number): string {
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-MA" : locale === "en" ? "en-GB" : "fr-MA", { numeric: "auto" });
  const minutes = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

/** Five stars, filled up to the value (read only). */
export function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5 text-warn" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= Math.round(value)} className={`${className} ${i <= Math.round(value) ? "" : "text-fg/25"}`} />)}
    </span>
  );
}

/** A round badge with a person's or agency's first letter. */
export function Initial({ name, className = "h-12 w-12 text-xl" }: { name: string | null | undefined; className?: string }) {
  return <span className={`flex shrink-0 items-center justify-center rounded-full bg-volt/20 font-display font-extrabold text-volt-soft ${className}`}>{(name ?? "?").trim().charAt(0).toUpperCase() || "?"}</span>;
}

const STEPS = ["pending", "confirmed", "active", "completed"] as const;

/** Requested, confirmed, picked up, completed: how far a booking got. */
export function BookingProgress({ status, labels }: { status: string; labels: [string, string, string, string] }) {
  const index = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <ol className="flex items-start">
      {STEPS.map((step, i) => (
        <li key={step} className="flex flex-1 flex-col items-center gap-2 text-center">
          <span className="relative flex w-full items-center justify-center">
            {i > 0 ? <span aria-hidden className={`absolute end-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 ${i <= index ? "bg-go" : "bg-fg/15"}`} /> : null}
            <span className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${i <= index ? "bg-go text-white" : "border-2 border-fg/20 text-fg/40"}`}>{i <= index ? "✓" : i + 1}</span>
          </span>
          <span className={`text-xs font-semibold ${i <= index ? "" : "text-fg/45"}`}>{labels[i]}</span>
        </li>
      ))}
    </ol>
  );
}
