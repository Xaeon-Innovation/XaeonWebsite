import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaBand from "@/components/CtaBand";
import ElevoraMock from "@/components/ElevoraMock";
import SectionHeading from "@/components/SectionHeading";
import { getCaseStudies } from "@/lib/api";
import { cmsImage } from "@/lib/images";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { localeUrl, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "work" });
  return pageMetadata({ locale, path: "/work", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function WorkPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const [t, caseStudies] = await Promise.all([getTranslations(), getCaseStudies()]);

  return (
    <>
      <section className="container-x flex flex-col gap-8 pb-12 pt-12 sm:pt-16">
        <Breadcrumbs
          items={[
            { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
            { name: t("nav.work"), href: "/work", url: localeUrl(locale, "/work") },
          ]}
        />
        <SectionHeading as="h1" eyebrow={t("work.eyebrow")} title={t("work.title")} intro={t("work.intro")} />
      </section>

      <section className="container-x pb-12" aria-label={t("nav.work")}>
        <ul className="grid gap-8 md:grid-cols-2">
          {/* Our own product leads the list: it's real, shipped work we can show in full. */}
          <li className="md:col-span-2" data-reveal>
            <Link href="/products/elevora" className="group grid items-center gap-10 rounded-[2rem] border border-line bg-ink-2 p-8 transition-colors hover:border-sage/50 sm:p-12 lg:grid-cols-2">
              <span className="flex flex-col gap-4">
                <span className="eyebrow">{t("work.ourProduct")}</span>
                <span className="font-display text-3xl font-semibold text-fog">Elevora</span>
                <span className="text-mist">{t("products.elevoraSummary")}</span>
                <span className="inline-flex items-center gap-2 font-semibold text-sage">
                  {t("common.learnMore")} <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
                </span>
              </span>
              <ElevoraMock locale={locale} />
            </Link>
          </li>
          {caseStudies.map((cs) => {
            const img = cmsImage(cs.imageSrc);
            return (
              <li key={cs.id} data-reveal>
                <Link href={`/work/${cs.slug}`} className="group flex flex-col gap-4">
                  <span className="relative block aspect-[16/10] overflow-hidden rounded-[var(--radius-card)] bg-ink-3">
                    {img ? (
                      <Image src={img.src} unoptimized={img.unoptimized} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : null}
                  </span>
                  <span className="text-sm text-sage">{cs.subtitle}</span>
                  <h2 className="font-display text-2xl font-semibold text-fog group-hover:underline underline-offset-4">{cs.title}</h2>
                  <p className="text-mist">{cs.description}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <CtaBand title={t("work.ctaTitle")} track="work_cta" />
    </>
  );
}
