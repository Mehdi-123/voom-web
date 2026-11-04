import { ReactNode } from "react";
import { Spinner } from "./ui";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-white/60">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl p-6 ${className}`}>{children}</div>;
}

export function Stat({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "accent" | "good" }) {
  const toneClass = tone === "accent" ? "bg-gradient-to-br from-volt-deep to-volt-mid border-transparent" : "glass";
  return (
    <div className={`rounded-3xl border border-white/10 p-6 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-white/60">{label}</p>
      <p className={`font-display mt-3 text-4xl font-extrabold tracking-tight ${tone === "good" ? "text-go" : ""}`}>{value}</p>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#ffd166]/15 text-[#ffd166]",
  confirmed: "bg-volt/20 text-volt-soft",
  active: "bg-[#4caaff]/15 text-[#7cc0ff]",
  completed: "bg-go/15 text-go",
  approved: "bg-go/15 text-go",
  cancelled: "bg-white/10 text-white/60",
  no_show: "bg-[#ff5c3a]/15 text-[#ff8a6e]",
  rejected: "bg-[#ff5c3a]/15 text-[#ff8a6e]",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[status] ?? "bg-white/10"}`}>{label}</span>;
}

export function Loading() {
  return <div className="flex justify-center py-24"><Spinner className="h-8 w-8" /></div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center text-white/60">{children}</div>;
}

/** Day and month in the reader's language, e.g. "12 nov." */
export function shortDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-GB" : "fr-MA", { day: "numeric", month: "short" });
}
