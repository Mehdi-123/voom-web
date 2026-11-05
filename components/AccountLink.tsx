"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase-browser";
import type { Locale } from "@/lib/i18n";

/** "Sign in" for visitors, "My space" for someone who is already signed in (the session lives in the browser). */
export default function AccountLink({ lang, loginLabel, accountLabel, className, onClick }: { lang: Locale; loginLabel: string; accountLabel: string; className?: string; onClick?: () => void }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = sb.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <Link href={`/${lang}/${signedIn ? "dashboard" : "login"}`} onClick={onClick} className={className}>
      {signedIn ? accountLabel : loginLabel}
    </Link>
  );
}
