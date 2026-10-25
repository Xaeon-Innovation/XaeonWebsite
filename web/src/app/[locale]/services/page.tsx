import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaBand from "@/components/CtaBand";
import JsonLd from "@/components/JsonLd";
import SectionHeading from "@/components/SectionHeading";
import ServiceList from "@/components/ServiceList";
import ServiceReels from "@/components/ServiceReels";
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
      <div className="container-x pt-10 sm:pt-14">
        <Breadcrumbs
          items={[
            { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
            { name: t("nav.services"), href: "/services", url: localeUrl(locale, "/services") },
          ]}
        />
      </div>
      <div className="overflow-hidden border-b border-white/10 pb-6 pt-8 sm:pb-12 sm:pt-12">
        <div className="container-x">
          <ServiceReels />
        </div>
      </div>
      <section className="container-x flex flex-col gap-10 pb-8 pt-12 sm:pt-16" aria-labelledby="services-title">
        <SectionHeading as="h1" id="services-title" eyebrow={t("services.eyebrow")} title={t("services.title")} intro={t("services.intro")} />
        <ServiceList />
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
