"use client";

import { useEffect, useRef, ElementType, ReactNode } from "react";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Wait this long (ms) after entering view, to stagger neighbours */
  delay?: number;
  /** "up" rises into place, "side" slides in from the reading direction */
  variant?: "up" | "side" | "none";
};

/** Fades and moves its content into place the first time it scrolls into view. Content is visible without JavaScript. */
export default function Reveal({ children, as: Tag = "div", className = "", delay = 0, variant = "up" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.in = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const motion = variant === "up" ? "reveal" : variant === "side" ? "reveal-x" : "";
  return (
    <Tag ref={ref} className={`${motion} ${className}`} style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  );
}
