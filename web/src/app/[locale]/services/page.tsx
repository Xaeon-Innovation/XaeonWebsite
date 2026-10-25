import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaBand from "@/components/CtaBand";
import JsonLd from "@/components/JsonLd";
import SectionHeading from "@/components/SectionHeading";
import ServiceGrid from "@/components/ServiceGrid";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { localeUrl, pageMetadata, serviceJsonLd } from "@/lib/seo";
import { SERVICE_SLUGS } from "@/lib/site";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "services" });
  return pageMetadata({ locale, path: "/services", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function ServicesPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations();

  return (
    <>
      <section className="container-x flex flex-col gap-8 pb-12 pt-12 sm:pt-16">
        <Breadcrumbs
          items={[
            { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
            { name: t("nav.services"), href: "/services", url: localeUrl(locale, "/services") },
          ]}
        />
        <SectionHeading as="h1" eyebrow={t("services.eyebrow")} title={t("services.title")} intro={t("services.intro")} />
      </section>
      <section className="container-x pb-8" aria-label={t("nav.services")}>
        <ServiceGrid headingLevel="h2" />
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: SERVICE_SLUGS.map((slug, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: serviceJsonLd({
              name: t(`services.items.${slug}.title`),
              description: t(`services.items.${slug}.summary`),
              url: localeUrl(locale, `/services/${slug}`),
              locale,
            }),
          })),
        }}
      />
      <CtaBand track="services_cta" />
    </>
  );
}
