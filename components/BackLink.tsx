"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** A way back: the page the person came from, or `href` when there is none (a fresh tab or a shared link). */
export default function BackLink({ href, label, className, children }: { href: string; label: string; className: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      aria-label={label}
      className={className}
      onClick={(e) => {
        if (window.history.length > 1) { e.preventDefault(); router.back(); }
      }}
    >
      {children}
    </Link>
  );
}
