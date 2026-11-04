"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { CalendarIcon, CarIcon, GridIcon, LogoutIcon, ShieldIcon, UserIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { DashProvider } from "./DashContext";
import { Loading } from "./dash-ui";
import { GhostButton, PrimaryButton } from "./ui";

type NavItem = { href: string; label: string; icon: (p: { className?: string }) => ReactNode; exact?: boolean };

/** The private area: checks who is signed in, then shows the right menu (agency or admin) around the page. */
export default function DashboardShell({ lang, dict, children }: { lang: Locale; dict: Dictionary; children: ReactNode }) {
  const { ready, user, role, agency, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const base = `/${lang}/dashboard`;
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace(`/${lang}/login`);
  }, [ready, user, lang, router]);

  if (!ready || !user) return <div className="night min-h-screen"><Loading /></div>;

  const leave = async () => { await signOut(); router.replace(`/${lang}/login`); };

  // Customer accounts have no business here: they use the app
  if (role === "customer") {
    return (
      <div className="night flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-4xl font-extrabold">{dict.dash.auth.customerTitle}</h1>
        <p className="mt-3 max-w-md text-white/60">{dict.dash.auth.customerText}</p>
        <div className="mt-8 w-56"><PrimaryButton type="button" onClick={leave}>{dict.dash.common.signOut}</PrimaryButton></div>
      </div>
    );
  }

  // A rejected agency is stopped; a pending one can already work (its cars stay hidden)
  if (role === "agency" && agency?.approval_status === "rejected") {
    return (
      <div className="night flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-4xl font-extrabold">{dict.dash.overview.rejectedTitle}</h1>
        <p className="mt-3 max-w-md text-white/60">{dict.dash.overview.rejectedText}</p>
        {agency.rejection_reason ? (
          <p className="glass mt-6 max-w-md rounded-2xl p-5 text-start"><span className="block text-xs font-bold uppercase tracking-wider text-white/50">{dict.dash.overview.reason}</span>{agency.rejection_reason}</p>
        ) : null}
        <div className="mt-8 w-56"><PrimaryButton type="button" onClick={leave}>{dict.dash.common.signOut}</PrimaryButton></div>
      </div>
    );
  }

  const nav: NavItem[] = role === "admin"
    ? [
        { href: base, label: dict.dash.nav.overview, icon: GridIcon, exact: true },
        { href: `${base}/review`, label: dict.dash.nav.review, icon: ShieldIcon },
      ]
    : [
        { href: base, label: dict.dash.nav.overview, icon: GridIcon, exact: true },
        { href: `${base}/bookings`, label: dict.dash.nav.bookings, icon: CalendarIcon },
        { href: `${base}/fleet`, label: dict.dash.nav.fleet, icon: CarIcon },
        { href: `${base}/profile`, label: dict.dash.nav.profile, icon: UserIcon },
      ];
  const accountName = role === "admin" ? dict.dash.common.adminName : agency?.name;
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <DashProvider lang={lang} dict={dict}>
      <div className="min-h-screen bg-ink lg:grid lg:grid-cols-[17rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="night sticky top-0 hidden h-screen flex-col justify-between overflow-y-auto p-6 lg:flex">
          <div>
            <Link href={`/${lang}`} aria-label="Voom" className="mb-10 block"><Logo tone="white" height={28} /></Link>
            <nav className="space-y-1.5">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-colors ${isActive(item) ? "bg-volt text-white shadow-lg shadow-volt/30" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
                  {item.icon({ className: "h-5 w-5" })}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="space-y-4">
            <LanguageSwitcher current={lang} label={dict.nav.language} />
            <div className="glass rounded-2xl p-4">
              <p className="truncate font-bold">{accountName}</p>
              <p className="truncate text-xs text-white/50">{user.email}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Mobile top bar */}
          <header className="night sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden">
            <Link href={`/${lang}`} aria-label="Voom"><Logo tone="white" height={24} /></Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher current={lang} label={dict.nav.language} />
              <button type="button" onClick={() => setConfirming(true)} aria-label={dict.dash.common.signOut} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><LogoutIcon className="h-5 w-5" /></button>
            </div>
          </header>

          {/* Desktop top bar: who is signed in, and the way out */}
          <div className="sticky top-0 z-30 hidden items-center justify-end gap-4 bg-ink/80 px-8 py-4 backdrop-blur lg:flex">
            <span className="flex items-center gap-3 text-sm text-white/70">
              <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-volt/25 font-display font-extrabold text-volt-soft">{(accountName ?? "?").charAt(0).toUpperCase()}</span>
              <span className="max-w-56 truncate">{user.email}</span>
            </span>
            <button type="button" onClick={() => setConfirming(true)} className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10">
              <LogoutIcon className="h-4 w-4" /> {dict.dash.common.signOut}
            </button>
          </div>

          <main className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-8 lg:pb-16 lg:pt-4">{children}</main>

          {/* Mobile bottom navigation */}
          <nav aria-label={dict.dash.nav.menu} className="glass fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full p-1.5 lg:hidden">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-semibold ${isActive(item) ? "bg-volt text-white" : "text-white/60"}`}>
                {item.icon({ className: "h-5 w-5" })}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {confirming ? (
        <div role="dialog" aria-modal="true" aria-labelledby="signout-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm" onClick={() => setConfirming(false)}>
          <div className="night w-full max-w-sm rounded-[2rem] border border-white/10 p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-volt/20 text-volt-soft"><LogoutIcon className="h-6 w-6" /></span>
            <h2 id="signout-title" className="font-display mt-5 text-2xl font-extrabold">{dict.dash.common.signOutTitle}</h2>
            <p className="mt-2 text-white/60">{dict.dash.common.signOutText}</p>
            <div className="mt-7 flex flex-col gap-3">
              <PrimaryButton type="button" onClick={leave}>{dict.dash.common.signOut}</PrimaryButton>
              <GhostButton type="button" onClick={() => setConfirming(false)} className="w-full">{dict.dash.common.cancel}</GhostButton>
            </div>
          </div>
        </div>
      ) : null}
    </DashProvider>
  );
}
