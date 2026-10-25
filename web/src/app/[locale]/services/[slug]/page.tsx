import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import Breadcrumbs from "@/components/Breadcrumbs";
import ButtonLink, { buttonClass } from "@/components/ButtonLink";
import EnquiryForm from "@/components/EnquiryForm";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import ServiceGrid from "@/components/ServiceGrid";
import ServiceIcon from "@/components/ServiceIcon";
import { routing } from "@/i18n/routing";
import { localeUrl, pageMetadata, serviceJsonLd } from "@/lib/seo";
import { isServiceSlug, SERVICE_SLUGS } from "@/lib/site";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => SERVICE_SLUGS.map((slug) => ({ locale, slug })));
}
export const dynamicParams = false;

async function resolve(params: Props["params"]) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale) || !isServiceSlug(slug)) notFound();
  setRequestLocale(locale);
  return { locale, slug };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await resolve(params);
  const t = await getTranslations({ locale, namespace: "services.items" });
  return pageMetadata({
    locale,
    path: `/services/${slug}`,
    title: t(`${slug}.title`),
    description: `${t(`${slug}.summary`)} ${t(`${slug}.body`)}`.slice(0, 158),
  });
}

export default async function ServicePage({ params }: Props) {
  const { locale, slug } = await resolve(params);
  const t = await getTranslations();
  const title = t(`services.items.${slug}.title`);
  const deliverables = t.raw(`services.items.${slug}.deliverables`) as string[];
  const faq = (t.raw("faq") as { q: string; a: string }[]).slice(0, 4);
  const url = localeUrl(locale, `/services/${slug}`);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0" aria-hidden />
        <div className="container-x relative flex flex-col gap-8 pb-16 pt-12 sm:pt-16">
          <Breadcrumbs
            items={[
              { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
              { name: t("nav.services"), href: "/services", url: localeUrl(locale, "/services") },
              { name: title, href: `/services/${slug}`, url },
            ]}
          />
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sage/10 text-sage">
            <ServiceIcon slug={slug} size={28} />
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">{title}</h1>
          {/* Summary first: the quotable, factual answer to "what is this?" */}
          <p className="max-w-2xl text-xl text-fog">{t(`services.items.${slug}.summary`)}</p>
          <p className="max-w-2xl text-lg text-mist">{t(`services.items.${slug}.body`)}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/book" data-track="service_book_consultation" data-track-label={slug}>
              {t("common.bookCall")}
            </ButtonLink>
            <a href="#enquire" className={buttonClass("secondary")}>
              {t("common.sendMessage")}
            </a>
          </div>
        </div>
      </section>

      <section className="paper" aria-labelledby="deliverables-title">
        <div className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_2fr]">
          <h2 id="deliverables-title" className="text-2xl font-semibold text-graphite sm:text-3xl">
            {t("services.deliverablesTitle")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {deliverables.map((d) => (
              <li key={d} className="flex items-start gap-3 rounded-2xl border border-paper-line bg-white p-5 text-graphite">
                <Check size={20} aria-hidden className="mt-0.5 shrink-0 text-sage-deep" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="enquire" className="container-x scroll-mt-24 py-20 sm:py-24" aria-labelledby="enquire-title">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-4">
            <h2 id="enquire-title" className="text-3xl font-semibold">{t("services.ctaTitle", { service: title })}</h2>
            <p className="text-lg text-mist">{t("services.ctaBody")}</p>
          </div>
          <div className="glass rounded-[var(--radius-card)] p-6 sm:p-8">
            <EnquiryForm source="service" interest={title} idPrefix={`svc-${slug}`} />
          </div>
        </div>
      </section>

      <section className="container-x pb-20" aria-labelledby="svc-faq-title">
        <h2 id="svc-faq-title" className="mb-8 text-2xl font-semibold">{t("home.faq.title")}</h2>
        <Faq items={faq} />
      </section>

      <section className="container-x pb-24" aria-labelledby="other-title">
        <h2 id="other-title" className="mb-8 text-2xl font-semibold">{t("services.otherServices")}</h2>
        <ServiceGrid exclude={slug} />
      </section>

      <JsonLd data={serviceJsonLd({ name: title, description: t(`services.items.${slug}.body`), url, locale })} />
    </>
  );
}
