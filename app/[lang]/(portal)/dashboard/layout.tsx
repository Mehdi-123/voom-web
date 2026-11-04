import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import DashboardShell from "@/components/portal/DashboardShell";
import { Loading } from "@/components/portal/dash-ui";

export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  // Everything in here depends on who is signed in, which is only known in the browser
  return (
    <Suspense fallback={<div className="night min-h-screen"><Loading /></div>}>
      <DashboardShell lang={lang} dict={dict}>{children}</DashboardShell>
    </Suspense>
  );
}
