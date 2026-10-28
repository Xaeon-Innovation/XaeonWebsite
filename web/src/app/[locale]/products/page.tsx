import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaBand from "@/components/CtaBand";
import PolaraMock from "@/components/PolaraMock";
import VeloraMock from "@/components/VeloraMock";
import SectionHeading from "@/components/SectionHeading";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { localeUrl, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "products" });
  return pageMetadata({ locale, path: "/products", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function ProductsPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations();
  return (
    <>
      <section className="container-x flex flex-col gap-8 pb-12 pt-12 sm:pt-16">
        <Breadcrumbs
          items={[
            { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
            { name: t("nav.products"), href: "/products", url: localeUrl(locale, "/products") },
          ]}
        />
        <SectionHeading as="h1" eyebrow={t("products.eyebrow")} title={t("products.title")} intro={t("products.intro")} />
      </section>
      <section className="container-x pb-12" aria-label="Polara">
        <Link
          href="/products/polara"
          className="group grid items-center gap-10 overflow-hidden rounded-[2rem] border border-line bg-ink-2 p-8 transition-colors hover:border-sage/50 sm:p-12 lg:grid-cols-2"
        >
          <span className="flex flex-col gap-5">
            <span className="eyebrow">{t("products.polaraTag")}</span>
            <span className="font-display text-4xl font-semibold text-fog">Polara</span>
            <span className="text-lg text-mist">{t("products.polaraSummary")}</span>
            <span className="inline-flex items-center gap-2 font-semibold text-sage">
              {t("common.learnMore")} <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </span>
          </span>
          <PolaraMock locale={locale} />
        </Link>
      </section>
      <section className="container-x pb-12" aria-label="Velora">
        <Link
          href="/products/velora"
          className="group grid items-center gap-10 overflow-hidden rounded-[2rem] border border-line bg-ink-2 p-8 transition-colors hover:border-sage/50 sm:p-12 lg:grid-cols-2"
        >
          <span className="flex flex-col gap-5">
            <span className="eyebrow">{t("products.veloraTag")}</span>
            <span className="font-display text-4xl font-semibold text-fog">Velora</span>
            <span className="text-lg text-mist">{t("products.veloraSummary")}</span>
            <span className="inline-flex items-center gap-2 font-semibold text-sage">
              {t("common.learnMore")} <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </span>
          </span>
          <VeloraMock locale={locale} />
        </Link>
        <p className="mt-6 text-mist">{t("products.more")}</p>
      </section>
      <CtaBand track="products_cta" />
    </>
  );
}
