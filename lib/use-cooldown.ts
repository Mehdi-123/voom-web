"use client";

import { useCallback, useEffect, useState } from "react";

/** A countdown in whole seconds, for buttons that must wait before they can be used again. */
export function useCooldown(): [left: number, start: (seconds?: number) => void] {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  const start = useCallback((seconds = 60) => setLeft(seconds), []);
  return [left, start];
}
