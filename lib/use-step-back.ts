"use client";

import { useEffect, useRef } from "react";

/**
 * A step of a form that the browser's Back button (and the "Back" link above the card) should close, instead of leaving the page.
 * While `active`, the step has its own entry in the history; going back to it calls `onBack` and the form shows the step before.
 */
export function useStepBack(active: boolean, onBack: () => void) {
  const latest = useRef(onBack);
  useEffect(() => { latest.current = onBack; });
  useEffect(() => {
    if (!active) return;
    window.history.pushState({ step: true }, "");
    const back = () => latest.current();
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [active]);
}
