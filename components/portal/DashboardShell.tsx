"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BellIcon, CalendarIcon, CarIcon, ChevronsLeftIcon, CoinsIcon, GridIcon, LogoutIcon, MoonIcon, ShieldIcon, SunIcon, UserIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { DashProvider } from "./DashContext";
import { Loading } from "./dash-ui";
import { useNotices } from "./notifications";
import { GhostButton, PrimaryButton } from "./ui";

type NavItem = { href: string; label: string; icon: (p: { className?: string }) => ReactNode; exact?: boolean };
type Theme = "dark" | "light";

/** A value kept in the browser (the theme, the sidebar), read after the page has loaded so the server and the browser agree. */
function useStored<T extends string>(key: string, initial: T, fallback?: () => T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { const saved = localStorage.getItem(key); if (saved) setValue(saved as T); else if (fallback) setValue(fallback()); } catch { /* private window */ } }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (v: T) => { setValue(v); try { localStorage.setItem(key, v); } catch { /* private window */ } };
  return [value, set];
}

/** The private area: checks who is signed in, then shows the right menu (agency or admin) around the page. */
export default function DashboardShell({ lang, dict, children }: { lang: Locale; dict: Dictionary; children: ReactNode }) {
  const { ready, user, role, agency, renter, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const base = `/${lang}/dashboard`;
  const [confirming, setConfirming] = useState(false);
  const [theme, setTheme] = useStored<Theme>("voom-dash-theme", "dark");
  const [menu, setMenu] = useStored<"open" | "shrunk">("voom-dash-menu", "open", () => (window.innerWidth < 1280 ? "shrunk" : "open"));
  const notices = useNotices(user?.id);
  const light = theme === "light";
  const shrunk = menu === "shrunk";
  const c = dict.dash.common;

  useEffect(() => {
    if (ready && !user) router.replace(`/${lang}/login`);
  }, [ready, user, lang, router]);

  // A renter has no fleet, earnings or reviews to manage: anything else goes back to their home
  useEffect(() => {
    if (role !== "customer") return;
    const own = pathname === base || ["bookings", "notifications", "profile"].some((part) => pathname.startsWith(`${base}/${part}`));
    if (!own) router.replace(base);
  }, [role, pathname, base, router]);

  if (!ready || !user) return <div className="night min-h-screen"><Loading /></div>;

  const leave = async () => { setConfirming(false); await signOut(); router.replace(`/${lang}/login`); };
  const shell = `${light ? "dash-light" : ""} min-h-screen bg-page text-fg`;

  // A rejected agency is stopped; a pending one can already work (its cars stay hidden)
  if (role === "agency" && agency?.approval_status === "rejected") {
    return (
      <div className={`${shell} night flex flex-col items-center justify-center px-5 text-center`}>
        <h1 className="font-display text-4xl font-extrabold">{dict.dash.overview.rejectedTitle}</h1>
        <p className="mt-3 max-w-md text-fg/60">{dict.dash.overview.rejectedText}</p>
        {agency.rejection_reason ? (
          <p className="glass mt-6 max-w-md rounded-2xl p-5 text-start"><span className="block text-xs font-bold uppercase tracking-wider text-fg/50">{dict.dash.overview.reason}</span>{agency.rejection_reason}</p>
        ) : null}
        <div className="mt-8 w-56"><PrimaryButton type="button" onClick={leave}>{c.signOut}</PrimaryButton></div>
      </div>
    );
  }

  const nav: NavItem[] = role === "customer"
    ? [
        { href: base, label: dict.dash.me.title, icon: CalendarIcon, exact: true },
        { href: `${base}/notifications`, label: dict.dash.nav.notifications, icon: BellIcon },
        { href: `${base}/profile`, label: dict.dash.nav.profile, icon: UserIcon },
      ]
    : role === "admin"
    ? [
        { href: base, label: dict.dash.nav.overview, icon: GridIcon, exact: true },
        { href: `${base}/review`, label: dict.dash.nav.review, icon: ShieldIcon },
        { href: `${base}/notifications`, label: dict.dash.nav.notifications, icon: BellIcon },
      ]
    : [
        { href: base, label: dict.dash.nav.overview, icon: GridIcon, exact: true },
        { href: `${base}/bookings`, label: dict.dash.nav.bookings, icon: CalendarIcon },
        { href: `${base}/fleet`, label: dict.dash.nav.fleet, icon: CarIcon },
        { href: `${base}/earnings`, label: dict.dash.nav.earnings, icon: CoinsIcon },
        { href: `${base}/profile`, label: dict.dash.nav.profile, icon: UserIcon },
      ];
  // The phone bar has room for five: the inbox lives in the bell there
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
  const accountName = role === "admin" ? c.adminName : role === "customer" ? renter?.name ?? user.email : agency?.name;
  const logoTone = light ? "black" : "white";

  const themeButton = (
    <button type="button" onClick={() => setTheme(light ? "dark" : "light")} aria-label={light ? c.themeDark : c.themeLight} title={light ? c.themeDark : c.themeLight} className="flex h-10 w-10 items-center justify-center rounded-full bg-fg/10 transition-colors hover:bg-fg/20">
      {light ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
    </button>
  );
  const bell = (
    <Link href={`${base}/notifications`} aria-label={dict.dash.nav.notifications} title={dict.dash.nav.notifications} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-fg/10 transition-colors hover:bg-fg/20">
      <BellIcon className="h-5 w-5" />
      {notices.unread > 0 ? <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-volt px-1 text-[11px] font-bold text-white">{notices.unread > 9 ? "9+" : notices.unread}</span> : null}
    </Link>
  );

  return (
    <DashProvider lang={lang} dict={dict} notices={notices}>
      <div className={`${shell} lg:flex`}>
        {/* Desktop sidebar: can shrink to icons */}
        <aside className={`night sticky top-0 hidden h-screen shrink-0 flex-col justify-between overflow-y-auto overflow-x-hidden border-e border-fg/10 p-4 transition-[width] duration-300 ease-out lg:flex ${shrunk ? "w-[5.5rem]" : "w-[17rem]"}`}>
          <div>
            <Link href={`/${lang}`} aria-label="Voom" className={`mb-8 mt-2 flex h-10 items-center ${shrunk ? "justify-center" : "px-2"}`}>
              {shrunk ? <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-volt font-display text-2xl font-extrabold text-white">v</span> : <Logo tone={logoTone} height={28} />}
            </Link>
            <nav className="space-y-1.5">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} className={`flex h-12 items-center gap-3 rounded-2xl font-semibold transition-colors ${shrunk ? "justify-center" : "px-4"} ${isActive(item) ? "bg-volt text-white shadow-lg shadow-volt/30" : "text-fg/65 hover:bg-fg/10 hover:text-fg"}`}>
                  {item.icon({ className: "h-5 w-5 shrink-0" })}
                  {shrunk ? null : <span className="truncate">{item.label}</span>}
                </Link>
              ))}
            </nav>
          </div>
          <div className="space-y-3">
            <button type="button" onClick={() => setMenu(shrunk ? "open" : "shrunk")} title={shrunk ? c.expand : c.collapse} aria-label={shrunk ? c.expand : c.collapse} className={`flex h-11 w-full items-center gap-3 rounded-2xl text-sm font-semibold text-fg/55 transition-colors hover:bg-fg/10 hover:text-fg ${shrunk ? "justify-center" : "px-4"}`}>
              <ChevronsLeftIcon className={`h-5 w-5 shrink-0 transition-transform duration-300 ${shrunk ? "rotate-180 rtl:rotate-0" : "rtl:rotate-180"}`} />
              {shrunk ? null : <span>{c.collapse}</span>}
            </button>
            {shrunk ? null : (
              <div className="glass rounded-2xl p-4">
                <p className="truncate font-bold">{accountName}</p>
                <p className="truncate text-xs text-fg/50">{user.email}</p>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <header className="topbar sticky top-0 z-30 flex items-center justify-between gap-2 !rounded-none !border-x-0 !border-t-0 px-3 py-3 lg:hidden">
            <Link href={`/${lang}`} aria-label="Voom" className="shrink-0">
              <span className="hidden min-[420px]:block"><Logo tone={logoTone} height={24} /></span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-volt font-display text-2xl font-extrabold text-white min-[420px]:hidden">v</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <LanguageSwitcher current={lang} label={dict.nav.language} compact />
              {bell}
              {themeButton}
              <button type="button" onClick={() => setConfirming(true)} aria-label={c.signOut} className="flex h-10 w-10 items-center justify-center rounded-full bg-fg/10 transition-colors hover:bg-fg/20"><LogoutIcon className="h-5 w-5" /></button>
            </div>
          </header>

          {/* Desktop top bar: language, theme, inbox, who is signed in, and the way out */}
          <div className="topbar sticky top-0 z-30 hidden items-center justify-end gap-3 !border-x-0 !border-t-0 px-8 py-4 lg:flex">
            <LanguageSwitcher current={lang} label={dict.nav.language} />
            {themeButton}
            {bell}
            <span className="ms-2 flex items-center gap-3 text-sm text-fg/70">
              <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-volt/25 font-display font-extrabold text-volt-soft">{(accountName ?? "?").charAt(0).toUpperCase()}</span>
              <span className="max-w-56 truncate">{user.email}</span>
            </span>
            <button type="button" onClick={() => setConfirming(true)} className="flex items-center gap-2 rounded-full border border-fg/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-fg/10">
              <LogoutIcon className="h-4 w-4" /> {c.signOut}
            </button>
          </div>

          <main className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-8 lg:pb-16 lg:pt-4">{children}</main>

          {/* Mobile bottom navigation */}
          <nav aria-label={dict.dash.nav.menu} className="topbar fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full p-1.5 shadow-xl shadow-black/20 lg:hidden">
            {nav.filter((item) => nav.length < 4 || !item.href.endsWith("/notifications")).map((item) => (
              <Link key={item.href} href={item.href} className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-semibold ${isActive(item) ? "bg-volt text-white" : "text-fg/60"}`}>
                {item.icon({ className: "h-5 w-5" })}
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {confirming ? (
        <div role="dialog" aria-modal="true" aria-labelledby="signout-title" className={`${light ? "dash-light" : ""} fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm`} onClick={() => setConfirming(false)}>
          <div className="night w-full max-w-sm rounded-[2rem] border border-fg/10 p-8 text-center text-fg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-volt/20 text-volt-soft"><LogoutIcon className="h-6 w-6" /></span>
            <h2 id="signout-title" className="font-display mt-5 text-2xl font-extrabold">{c.signOutTitle}</h2>
            <p className="mt-2 text-fg/60">{c.signOutText}</p>
            <div className="mt-7 flex flex-col gap-3">
              <PrimaryButton type="button" onClick={leave}>{c.signOut}</PrimaryButton>
              <GhostButton type="button" onClick={() => setConfirming(false)} className="w-full">{c.cancel}</GhostButton>
            </div>
          </div>
        </div>
      ) : null}
    </DashProvider>
  );
}
