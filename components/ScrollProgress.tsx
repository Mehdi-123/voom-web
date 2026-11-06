"use client";

import { usePathname } from "next/navigation";

const AUTH_PAGE = /^\/[a-z]{2}\/(login|signup|forgot)(\/|$)/;

/** The thin purple line at the top that fills as you scroll. Hidden on a phone for the sign in and sign up screens. */
export default function ScrollProgress() {
  const onAuthPage = AUTH_PAGE.test(usePathname());
  return <div className={`scroll-progress ${onAuthPage ? "max-md:hidden" : ""}`} aria-hidden />;
}
