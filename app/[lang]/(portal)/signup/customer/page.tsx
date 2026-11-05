import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { AuthShell } from "@/components/portal/ui";
import CustomerSignupForm from "@/components/portal/CustomerSignupForm";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).dash.auth.customerSignupTitle };
}

export default async function CustomerSignupPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <AuthShell lang={lang} back={dict.dash.nav.site} wide>
      <CustomerSignupForm lang={lang} dict={dict} />
    </AuthShell>
  );
}
