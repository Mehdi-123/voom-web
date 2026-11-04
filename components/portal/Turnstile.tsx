"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { TURNSTILE_SITE_KEY, turnstileEnabled } from "@/lib/turnstile";

type Api = { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id?: string) => void };
declare global { interface Window { turnstile?: Api } }

/** The "are you a person" check. Reports a token when passed and null when it expires; renders nothing when no keys are set. */
export default function Turnstile({ lang, onToken, resetKey = 0 }: { lang: string; onToken: (token: string | null) => void; resetKey?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const callback = useRef(onToken);
  useEffect(() => { callback.current = onToken; });

  useEffect(() => {
    if (!turnstileEnabled) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !box.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        language: lang,
        callback: (token: string) => callback.current(token),
        "expired-callback": () => callback.current(null),
        "error-callback": () => callback.current(null),
      });
    };
    mount();
    const timer = window.setInterval(() => { if (window.turnstile) { mount(); window.clearInterval(timer); } }, 250);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [lang]);

  // A token works once: after a submit the page asks for a fresh one
  useEffect(() => {
    if (resetKey > 0 && widget.current) { callback.current(null); window.turnstile?.reset(widget.current); }
  }, [resetKey]);

  if (!turnstileEnabled) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={box} className="flex min-h-[65px] justify-center" />
    </>
  );
}
