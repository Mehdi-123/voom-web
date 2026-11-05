import type { Metadata } from "next";
import { Inter, Cairo, Bricolage_Grotesque, Righteous } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { LOCALES, directionOf, getDictionary, hasLocale } from "@/lib/i18n";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { alternatesFor } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const righteous = Righteous({ subsets: ["latin"], weight: "400", variable: "--font-righteous", display: "swap" });

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: dict.meta.siteTitle, template: `%s | ${SITE_NAME}` },
    description: dict.meta.siteDescription,
    alternates: alternatesFor("", lang),
    openGraph: { siteName: SITE_NAME, type: "website", locale: lang, title: dict.meta.siteTitle, description: dict.meta.siteDescription },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} dir={directionOf(lang)} data-scroll-behavior="smooth" className={`${inter.variable} ${cairo.variable} ${bricolage.variable} ${righteous.variable}`}>
      <body className="flex min-h-screen flex-col">
        <div className="scroll-progress" aria-hidden />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/logo-black.svg`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
