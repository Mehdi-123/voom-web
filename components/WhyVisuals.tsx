import type { ReactNode } from "react";

/** Four small illustrations for the "Why Voom" cards: a turning stamp, banknotes, an ID being scanned, a phone booking. They carry no words, so they read the same in every language. */

export function VerifiedStamp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={className}>
      <g className="why-spin" style={{ transformOrigin: "100px 100px" }}>
        <defs><path id="why-circle" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" /></defs>
        <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeOpacity=".25" strokeDasharray="3 7" />
        <text fontSize="15" fontWeight="800" fill="currentColor" fillOpacity=".85">
          <textPath href="#why-circle" textLength="486" lengthAdjust="spacing">VERIFIED · VOOM · VERIFIED · VOOM · </textPath>
        </text>
      </g>
      <circle cx="100" cy="100" r="54" fill="currentColor" fillOpacity=".12" />
      <path d="M100 66 130 77v22c0 19-12 32-30 41-18-9-30-22-30-41V77z" fill="#fff" />
      <path d="m85 101 11 11 20-23" fill="none" stroke="#6a45d6" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Note({ className = "", amount }: { className?: string; amount: string }) {
  return (
    <div className={`absolute flex h-24 w-44 items-center justify-between rounded-xl border border-white/30 bg-gradient-to-br from-go to-[#049a74] px-4 text-ink shadow-xl shadow-black/20 ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink/40 text-[11px] font-black">MAD</span>
      <span className="font-display text-3xl font-extrabold">{amount}</span>
    </div>
  );
}

export function Banknotes({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`relative h-40 w-56 ${className}`}>
      <Note amount="50" className="start-6 top-0 -rotate-6 opacity-70" />
      <Note amount="100" className="start-2 top-7 rotate-3 opacity-90" />
      <Note amount="200" className="start-8 top-14 -rotate-2" />
      <span className="absolute -end-2 -top-2 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-sm font-black text-white shadow-lg">0%</span>
    </div>
  );
}

export function IdScan({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`relative h-36 w-56 overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur ${className}`}>
      <div className="flex gap-4">
        <span className="flex h-20 w-16 items-end justify-center overflow-hidden rounded-lg bg-white/20">
          <span className="relative top-2 h-10 w-10 rounded-full bg-white/70 after:absolute after:left-1/2 after:top-9 after:h-12 after:w-16 after:-translate-x-1/2 after:rounded-full after:bg-white/70" />
        </span>
        <span className="flex flex-1 flex-col gap-2.5 pt-1">
          <i className="h-2.5 w-full rounded-full bg-white/60" />
          <i className="h-2.5 w-4/5 rounded-full bg-white/35" />
          <i className="h-2.5 w-3/5 rounded-full bg-white/35" />
        </span>
      </div>
      <i className="mt-4 block h-2.5 w-3/4 rounded-full bg-white/25" />
      <span className="why-scan absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-go/40 to-transparent" />
      <span className="absolute bottom-3 end-3 flex h-9 w-9 items-center justify-center rounded-full bg-go text-ink shadow-lg shadow-go/40">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
      </span>
    </div>
  );
}

export function PhoneBooking({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="relative mx-auto w-44 rotate-3 rounded-[1.6rem] border border-white/20 bg-ink p-2.5 shadow-2xl shadow-volt/30">
        <div className="space-y-2.5 rounded-[1.2rem] bg-white/5 p-3">
          <span className="block h-16 rounded-xl bg-gradient-to-br from-volt-mid to-volt" />
          <span className="flex justify-between gap-2"><i className="h-2.5 w-16 rounded-full bg-white/50" /><i className="h-2.5 w-8 rounded-full bg-volt-soft/70" /></span>
          <span className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((d) => <i key={d} className={`h-6 flex-1 rounded-md ${d > 0 && d < 4 ? "bg-volt/70" : "bg-white/10"}`} />)}
          </span>
          <span className="why-press flex h-9 items-center justify-center rounded-full bg-volt text-xs font-black text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          </span>
        </div>
      </div>
      <span className="float absolute start-0 top-6 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-white text-ink shadow-xl" style={{ ["--r" as string]: "-8deg" }}>
        <span className="font-display text-2xl font-extrabold leading-none">3</span>
        <span className="text-[10px] font-black uppercase tracking-wider text-muted">min</span>
      </span>
    </div>
  );
}

/** The bento card around one illustration: tone and size come from the caller. */
export function WhyCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`relative flex h-full min-h-72 flex-col justify-between gap-8 overflow-hidden rounded-[2rem] p-8 sm:p-10 ${className}`}>{children}</div>;
}
