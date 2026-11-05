"use client";

import { useEffect, useState } from "react";
import { ArrowIcon } from "./Icons";

/** A round button that appears after a little scrolling and takes you back to the top. */
export default function ScrollTop({ label }: { label: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const update = () => setShown(window.scrollY > 400);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  function top() {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={top}
      aria-label={label}
      title={label}
      tabIndex={shown ? 0 : -1}
      className={`on-volt fixed bottom-5 end-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-volt text-white shadow-xl shadow-volt/40 transition-all duration-300 hover:bg-volt-soft sm:bottom-8 sm:end-8 ${shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      <ArrowIcon className="h-5 w-5 -rotate-90" />
    </button>
  );
}
