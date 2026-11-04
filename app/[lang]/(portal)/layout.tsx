import type { Metadata } from "next";
import AuthProvider from "@/components/portal/AuthProvider";

// Private pages: never listed in search results
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
