import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage from "@/components/LegalPage";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "legal.terms" });
  return pageMetadata({ locale, path: "/terms", title: t("metaTitle"), description: (t.raw("sections") as { p: string[] }[])[0].p[0].slice(0, 158) });
}

export default async function Page({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  return <LegalPage locale={locale} doc="terms" />;
}
