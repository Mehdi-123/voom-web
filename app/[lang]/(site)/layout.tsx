import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/** The public pages: floating header, content, big footer. */
export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <>
      <Header lang={lang} dict={dict} />
      <main className="flex-1">{children}</main>
      <Footer lang={lang} dict={dict} />
    </>
  );
}
