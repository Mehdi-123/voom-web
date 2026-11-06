import type { Locale } from "@/lib/i18n";

/** The 404 page is shown outside the dictionaries' loading, so its few texts are kept apart and ship with it. */
const notFoundText: Record<Locale, { title: string; text: string; home: string }> = {
  fr: { title: "Page introuvable", text: "Cette page n'existe pas ou a été déplacée.", home: "Retour à l'accueil" },
  en: { title: "Page not found", text: "This page does not exist or has been moved.", home: "Back to home" },
  ar: { title: "الصفحة غير موجودة", text: "هذه الصفحة غير موجودة أو تم نقلها.", home: "العودة إلى الرئيسية" },
};

export default notFoundText;
