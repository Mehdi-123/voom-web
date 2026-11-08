"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Dictionary } from "@/dictionaries/fr";
import type { Locale } from "@/lib/i18n";
import Image from "next/image";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BellIcon, CalendarIcon, CarIcon, ChevronDownIcon, CoinsIcon, GlobeIcon, GridIcon, HomeIcon, LogoutIcon, MoonIcon, ShieldIcon, SunIcon, UserIcon } from "@/components/Icons";
import { useAuth } from "./AuthProvider";
import { DashProvider } from "./DashContext";
import { Initial, Loading } from "./dash-ui";
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
  const { ready, user, role, agency, renter, refresh, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const base = `/${lang}/dashboard`;
  const [confirming, setConfirming] = useState(false);
  const [account, setAccount] = useState(false);
  const [theme, setTheme] = useStored<Theme>("voom-dash-theme", "dark");
  const [hover, setHover] = useState(false);
  // The dashboard is kept alive while you visit the public site: no pointer-leave ever arrives, so start closed on the way back
  useEffect(() => () => setHover(false), []);
  const notices = useNotices(user?.id);
  // A review by an admin changes what the account can do (book, publish cars): read the account again when its notice arrives
  const reviewNotice = notices.items?.find((n) => /^(identity|agency)_(approved|rejected)$/.test(n.data?.type ?? ""))?.id;
  const knownReview = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!notices.items) return;
    const first = knownReview.current === undefined;
    if (reviewNotice && reviewNotice !== knownReview.current && !first) refresh();
    knownReview.current = reviewNotice ?? null;
  }, [notices.items, reviewNotice, refresh]);
  const light = theme === "light";
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

  const leave = async () => { setConfirming(false); setHover(false); setAccount(false); await signOut(); router.replace(`/${lang}/login`); };
  const shell = `${light ? "dash-light" : ""} min-h-screen bg-page text-fg`;
  // The sidebar is a slim icon rail that opens by itself when the pointer is on it (or a key focus is in it), and stays open while the account menu is
  const shrunk = !(hover || account);
  const soften = `${confirming ? "pointer-events-none select-none blur-[7px] brightness-75" : ""}`;

  // A rejected agency is stopped; a pending one can already work (its cars stay hidden)
  if (role === "agency" && agency?.approval_status === "rejected") {
    return (
      <div className={`${shell} night flex items-center justify-center px-5 py-10`}>
        <div className="w-full max-w-md">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          </span>
          <h1 className="font-display mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.dash.overview.rejectedTitle}</h1>
          <p className="mt-3 leading-relaxed text-fg/65">{dict.dash.overview.rejectedText}</p>
          {agency.rejection_reason ? (
            <section className="mt-7 rounded-3xl border border-danger/30 bg-danger/10 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-danger">{dict.dash.overview.reason}</p>
              <p className="mt-2 text-lg leading-relaxed [overflow-wrap:anywhere]">{agency.rejection_reason}</p>
            </section>
          ) : null}
          <div className="mt-8"><PrimaryButton type="button" onClick={leave}>{c.signOut}</PrimaryButton></div>
        </div>
      </div>
    );
  }

  const nav: NavItem[] = role === "customer"
    ? [
        { href: base, label: dict.dash.me.title, icon: CalendarIcon, exact: true },
        { href: `${base}/notifications`, label: dict.dash.nav.notifications, icon: BellIcon },
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
        { href: `${base}/notifications`, label: dict.dash.nav.notifications, icon: BellIcon },
      ];
  // The phone bar has room for five: the inbox lives in the bell there
  const phoneNav = nav.filter((item) => !item.href.endsWith("/notifications"));
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
  const accountName = role === "admin" ? c.adminName : role === "customer" ? renter?.name ?? user.email : agency?.name;
  const logoTone = light ? "black" : "white";

  const photo = role === "agency" ? agency?.logo_url : renter?.avatar_url;
  const avatar = <Initial name={accountName} src={photo} className="h-10 w-10 text-lg" />;
  const bell = (
    <Link href={`${base}/notifications`} aria-label={dict.dash.nav.notifications} title={dict.dash.nav.notifications} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-fg/10 transition-colors hover:bg-fg/20">
      <BellIcon className="h-5 w-5" />
      {notices.unread > 0 ? <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-volt px-1 text-[11px] font-bold text-white">{notices.unread > 9 ? "9+" : notices.unread}</span> : null}
    </Link>
  );

  // The account menu: who you are, your profile, language, appearance, sign out. Opens from the sidebar button (desktop) or the avatar (phone).
  const roleLabel = role === "admin" ? c.roleAdmin : role === "agency" ? c.roleAgency : c.roleCustomer;
  const row = "flex min-h-[3.25rem] items-center gap-3 rounded-2xl px-2 py-1.5";
  const rowIcon = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fg/10 text-fg/70";
  // The menu is removed from under the pointer, so no pointer-leave arrives: close the rail along with it
  const closeAccount = () => { setAccount(false); setHover(false); };
  const accountPanel = (
    <div className="space-y-1">
      <div className="mb-2 flex items-center gap-3 rounded-2xl bg-fg/5 p-3">
        <Initial name={accountName} src={photo} className="h-12 w-12 text-xl" />
        <div className="min-w-0">
          <p className="truncate font-bold">{accountName}</p>
          <p className="truncate text-xs text-fg/55">{user.email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-volt/20 px-2.5 py-0.5 text-[11px] font-bold text-volt-soft">{roleLabel}</span>
        </div>
      </div>
      <Link href={`/${lang}`} onClick={closeAccount} className={`${row} transition-colors hover:bg-fg/10 lg:hidden`}>
        <span className={rowIcon}><HomeIcon className="h-[18px] w-[18px]" /></span>
        <span className="flex-1 font-semibold">{dict.dash.nav.site}</span>
        <span aria-hidden className="text-fg/35 rtl:rotate-180">→</span>
      </Link>
      {role !== "admin" ? (
        <Link href={`${base}/profile`} onClick={closeAccount} className={`${row} transition-colors hover:bg-fg/10`}>
          <span className={rowIcon}><UserIcon className="h-[18px] w-[18px]" /></span>
          <span className="flex-1 font-semibold">{c.myProfile}</span>
          <span aria-hidden className="text-fg/35 rtl:rotate-180">→</span>
        </Link>
      ) : null}
      <div className={row}>
        <span className={rowIcon}><GlobeIcon className="h-[18px] w-[18px]" /></span>
        <span className="flex-1 font-semibold">{dict.nav.language}</span>
        <LanguageSwitcher current={lang} label={dict.nav.language} compact />
      </div>
      <div className={row}>
        <span className={rowIcon}>{light ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}</span>
        <span className="flex-1 font-semibold">{c.appearance}</span>
        <div role="radiogroup" aria-label={c.appearance} className="flex items-center rounded-full bg-fg/10 p-1">
          {([["light", c.themeLight, SunIcon], ["dark", c.themeDark, MoonIcon]] as const).map(([mode, label, Icon]) => (
            <button key={mode} type="button" role="radio" aria-checked={(mode === "light") === light} title={label} aria-label={label} onClick={() => setTheme(mode)} className={`flex h-8 w-9 items-center justify-center rounded-full transition-colors ${(mode === "light") === light ? "bg-fg text-page" : "text-fg/60 hover:text-fg"}`}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
      <div className="my-1 h-px bg-fg/10" />
      <button type="button" onClick={() => { closeAccount(); setConfirming(true); }} className={`${row} w-full text-start font-semibold text-danger transition-colors hover:bg-danger/10`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/15"><LogoutIcon className="h-[18px] w-[18px]" /></span>
        {c.signOut}
      </button>
    </div>
  );

  return (
    <DashProvider lang={lang} dict={dict} notices={notices}>
      <div className={`${shell} lg:flex`}>
        {/* Desktop sidebar: a slim rail of icons that opens over the page while the pointer is on it */}
        <div
          className={`${soften} sticky top-0 z-30 hidden h-screen w-[5.5rem] shrink-0 transition-[filter] duration-200 lg:block`}
          style={{ "--side": shrunk ? "5.5rem" : "17rem" } as React.CSSProperties}
          onMouseEnter={() => setHover(true)}
          onMouseMove={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={(e) => { if (e.target.matches(":focus-visible")) setHover(true); }}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(false); }}
        >
          <aside className={`night absolute inset-y-0 start-0 flex w-[var(--side)] flex-col justify-between overflow-y-auto overflow-x-hidden border-e border-fg/10 p-4 transition-[width,box-shadow] duration-200 ease-out ${shrunk ? "" : "shadow-2xl shadow-black/30"}`}>
            <div>
              <Link href={`/${lang}`} aria-label="Voom" onClick={() => setHover(false)} className={`mb-8 mt-2 flex h-10 items-center ${shrunk ? "justify-center" : "px-2"}`}>
                {shrunk ? <Image src={`/voom-mark-${logoTone}.svg`} alt="Voom" width={52} height={24} unoptimized className="h-6 w-auto" /> : <Logo tone={logoTone} height={28} />}
              </Link>
              <nav className="space-y-1.5">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} className={`flex h-12 items-center gap-3 rounded-2xl font-semibold transition-colors ${shrunk ? "justify-center" : "px-4"} ${isActive(item) ? "bg-volt text-white shadow-lg shadow-volt/30" : "text-fg/65 hover:bg-fg/10 hover:text-fg"}`}>
                    <span className="relative flex shrink-0">
                      {item.icon({ className: "h-5 w-5" })}
                      {shrunk && item.href.endsWith("/notifications") && notices.unread > 0 ? <span className={`absolute -end-1 -top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ${isActive(item) ? "ring-volt" : "ring-night"}`} /> : null}
                    </span>
                    {shrunk ? null : <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                    {!shrunk && item.href.endsWith("/notifications") && notices.unread > 0 ? <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive(item) ? "bg-white/25 text-white" : "bg-volt text-white"}`}>{notices.unread > 9 ? "9+" : notices.unread}</span> : null}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="space-y-2">
              {/* The website, one step away from every kind of account */}
              <Link href={`/${lang}`} title={dict.dash.nav.site} aria-label={dict.dash.nav.site} onClick={() => setHover(false)} className={`flex h-12 items-center gap-3 rounded-2xl font-semibold text-fg/65 transition-colors hover:bg-fg/10 hover:text-fg ${shrunk ? "justify-center" : "px-4"}`}>
                <HomeIcon className="h-5 w-5 shrink-0" />
                {shrunk ? null : <span className="min-w-0 flex-1 truncate">{dict.dash.nav.site}</span>}
              </Link>

  {/* The account: one calm button, everything else opens from it */}
              <button type="button" onClick={() => setAccount((o) => !o)} aria-expanded={account} title={accountName ?? undefined} className={`flex w-full items-center gap-3 rounded-2xl border border-fg/10 p-2 transition-colors hover:bg-fg/10 ${shrunk ? "justify-center" : ""} ${account ? "bg-fg/10" : ""}`}>
                {avatar}
                {shrunk ? null : (
                  <>
                    <span className="min-w-0 flex-1 text-start">
                      <span className="block truncate font-bold">{accountName}</span>
                      <span className="block truncate text-xs text-fg/50">{user.email}</span>
                    </span>
                    <ChevronDownIcon className={`h-4 w-4 shrink-0 text-fg/50 transition-transform ${account ? "" : "rotate-180"}`} />
                  </>
                )}
              </button>
            </div>
          </aside>

          {account ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => { setAccount(false); setHover(false); }} />
              <div className="menu-in glass absolute bottom-4 start-[calc(var(--side)+0.75rem)] z-50 w-80 rounded-3xl bg-night! p-3 shadow-2xl shadow-black/40">{accountPanel}</div>
            </>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {/* Phone top bar: the mark, the inbox, and one account button that holds the rest */}
          <header className={`${soften} transition-[filter] duration-200 topbar sticky top-0 z-30 flex items-center justify-between gap-2 !rounded-none !border-x-0 !border-t-0 px-4 py-3 lg:hidden`}>
            <Link href={`/${lang}`} aria-label="Voom" className="shrink-0">
              <span className="hidden min-[420px]:block"><Logo tone={logoTone} height={24} /></span>
              <Image src={`/voom-mark-${logoTone}.svg`} alt="Voom" width={52} height={24} unoptimized className="h-6 w-auto min-[420px]:hidden" />
            </Link>
            <div className="flex items-center gap-2">
              {bell}
              <button type="button" onClick={() => setAccount((o) => !o)} aria-label={accountName ?? c.adminName} aria-expanded={account} className="rounded-full ring-2 ring-transparent transition-shadow aria-expanded:ring-volt">{avatar}</button>
            </div>
          </header>
          {account ? (
            <>
              <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setAccount(false)} />
              <div className="menu-in glass fixed end-3 top-[4.25rem] z-50 w-80 rounded-3xl bg-night! p-3 shadow-2xl shadow-black/40 lg:hidden">{accountPanel}</div>
            </>
          ) : null}

          <main className={`${soften} transition-[filter] duration-200 mx-auto max-w-6xl px-4 pb-32 pt-10 sm:px-8 lg:pb-16 lg:pt-14`}>{children}</main>

          {/* Mobile bottom navigation */}
          {phoneNav.length > 1 ? <nav aria-label={dict.dash.nav.menu} className={`${soften} transition-[filter] duration-200 topbar fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full p-1.5 shadow-xl shadow-black/20 lg:hidden`}>
            {phoneNav.map((item) => (
              <Link key={item.href} href={item.href} className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-semibold ${isActive(item) ? "bg-volt text-white" : "text-fg/60"}`}>
                {item.icon({ className: "h-5 w-5" })}
                <span className="max-w-full px-0.5 text-center leading-[1.1]">{item.label}</span>
              </Link>
            ))}
          </nav> : null}
        </div>
      </div>

      {confirming ? (
        <div role="dialog" aria-modal="true" aria-labelledby="signout-title" className="scrim menu-in fixed inset-0 z-[60] flex items-center justify-center px-5" onClick={() => setConfirming(false)}>
          {/* The theme variables live on this wrapper, which must stay see-through so the blurred page shows behind the card */}
          <div className={`${light ? "dash-light" : ""} w-full max-w-sm`}>
            <div className="night rounded-[2rem] border border-fg/10 p-8 text-center text-fg shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-volt/20 text-volt-soft"><LogoutIcon className="h-6 w-6" /></span>
              <h2 id="signout-title" className="font-display mt-5 text-2xl font-extrabold">{c.signOutTitle}</h2>
              <p className="mt-2 text-fg/60">{c.signOutText}</p>
              <div className="mt-7 flex flex-col gap-3">
                <PrimaryButton type="button" onClick={leave}>{c.signOut}</PrimaryButton>
                <GhostButton type="button" onClick={() => setConfirming(false)} className="w-full">{c.cancel}</GhostButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashProvider>
  );
}
