"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Put on a page with a light top: the floating header turns light while the page is showing (globals.css).
 * The browser keeps visited pages alive in the background, so the marker marks itself off whenever its page is hidden.
 * Being in the server markup, it also gets the very first paint right.
 */
export default function LightHeader() {
  const marker = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = marker.current;
    el?.removeAttribute("data-off");
    return () => el?.setAttribute("data-off", "");
  }, []);
  return <span ref={marker} data-header-light hidden />;
}
