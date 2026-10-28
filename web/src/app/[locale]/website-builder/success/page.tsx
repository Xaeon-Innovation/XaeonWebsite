import type { Metadata } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import ButtonLink from "@/components/ButtonLink";
import Orbit from "@/components/Orbit";
import OrderStatus from "@/components/builder/OrderStatus";
import { resolveLocale, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "builder.success" });
  // Personal order page: never indexed.
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function BuilderSuccessPage({ params }: LocaleParams) {
  await resolveLocale(params);
  const [t, messages] = await Promise.all([getTranslations("builder.success"), getMessages()]);
  const builder = messages.builder as { success: unknown };
  return (
    <section className="container-x relative overflow-hidden py-20 sm:py-28">
      <Orbit className="pointer-events-none absolute -end-10 top-6 w-[34rem] max-w-[80%] opacity-70" />
      <div className="relative flex max-w-2xl flex-col gap-6">
        <p className="eyebrow">✦ Xaeon</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
        <NextIntlClientProvider messages={{ builder: { success: builder.success } }}>
          <Suspense fallback={null}>
            <OrderStatus />
          </Suspense>
        </NextIntlClientProvider>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/">{t("home")}</ButtonLink>
          <ButtonLink href="/work" variant="secondary">{t("explore")}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
