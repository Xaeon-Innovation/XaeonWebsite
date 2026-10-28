import type { Metadata } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { ArrowRight, Check, Smartphone, Stethoscope, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ButtonLink from "@/components/ButtonLink";
import CtaBand from "@/components/CtaBand";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import ProcessSteps from "@/components/ProcessSteps";
import SectionHeading from "@/components/SectionHeading";
import LazyStarfield from "@/components/hero/LazyStarfield";
import BuilderWizard from "@/components/builder/BuilderWizard";
import { CATEGORY_ICONS } from "@/components/builder/icons";
import GalaxySection from "@/components/galaxy/GalaxySection";
import { getBuilderCatalog } from "@/lib/api";
import { BUILDER_CATEGORIES, formatMoney, loc } from "@/lib/builder";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { localeUrl, pageMetadata, serviceJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale });
  return pageMetadata({ locale, path: "/website-builder", title: t("builderPage.metaTitle"), description: t("builder.metaDescription") });
}

export default async function WebsiteBuilderPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const [t, catalog, messages] = await Promise.all([getTranslations(), getBuilderCatalog(), getMessages()]);
  const badges = t.raw("builderPage.badges") as string[];
  const how = t.raw("builderPage.how") as { title: string; body: string }[];
  const faq = t.raw("builderPage.faq") as { q: string; a: string }[];
  const url = localeUrl(locale, "/website-builder");
  const cross = [
    { key: "crossApp", href: "/services/mobile-apps-development", Icon: Smartphone },
    { key: "crossPolara", href: "/products/polara", Icon: Users },
    { key: "crossVelora", href: "/products/velora", Icon: Stethoscope },
  ] as const;

  return (
    <>
      <section className="relative overflow-hidden">
        <LazyStarfield className="absolute inset-0 h-full w-full opacity-70" />
        <div className="container-x relative flex flex-col gap-7 pb-16 pt-12 sm:pb-20 sm:pt-16">
          <Breadcrumbs
            items={[
              { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
              { name: t("nav.websiteBuilder"), href: "/website-builder", url },
            ]}
          />
          <p className="eyebrow">{t("builderPage.eyebrow")}</p>
          <h1 className="max-w-4xl text-4xl font-semibold sm:text-5xl lg:text-6xl">{t("builderPage.title")}</h1>
          <p className="max-w-2xl text-lg text-mist">{t("builderPage.intro")}</p>
          <div className="flex flex-wrap gap-3">
            <a href="#build" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-on-sage hover:bg-sage-strong" data-track="builder_hero_start">
              {t("builderPage.start")} <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
            </a>
            <ButtonLink href="/book" variant="secondary" data-track="builder_hero_talk">{t("builderPage.talk")}</ButtonLink>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fog">
            {badges.map((b) => (
              <li key={b} className="inline-flex items-center gap-2"><Check size={16} aria-hidden className="text-sage" /> {b}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-x pb-16" aria-labelledby="categories-title">
        <h2 id="categories-title" className="mb-6 text-2xl font-semibold">{t("builderPage.categoriesTitle")}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {BUILDER_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c];
            return (
              <li key={c}>
                <Link
                  href={{ pathname: "/website-builder", query: { category: c }, hash: "build" }}
                  scroll={false}
                  className="flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-ink-2 p-4 transition-colors hover:border-sage/50"
                  data-track={`builder_category_${c}`}
                >
                  <Icon size={22} aria-hidden className="text-sage" />
                  <span className="text-sm font-semibold text-fog">{t(`builder.categories.${c}.title`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-y border-line bg-ink-2" aria-labelledby="how-title">
        <div className="container-x py-16 sm:py-20">
          <SectionHeading title={t("builderPage.howTitle")} id="how-title" />
          <div className="mt-10"><ProcessSteps steps={how} /></div>
        </div>
      </section>

      <section id="build" className="container-x scroll-mt-20 py-16 sm:py-20" aria-labelledby="build-title">
        <div className="mb-8 flex flex-col gap-2">
          <h2 id="build-title" className="text-3xl font-semibold sm:text-4xl">{t("builderPage.builderTitle")}</h2>
          <p className="text-mist">{t("builderPage.builderBody")}</p>
        </div>
        {/* Only this page ships the builder strings to the browser. */}
        <NextIntlClientProvider messages={{ builder: messages.builder }}>
          <Suspense fallback={null}>
            <BuilderWizard catalog={catalog} />
          </Suspense>
        </NextIntlClientProvider>
      </section>

      {catalog.plans.length > 0 && (
        <section className="border-y border-line bg-ink-2" aria-labelledby="plans-title">
          <div className="container-x py-16 sm:py-20">
            <SectionHeading title={t("builderPage.plansTitle")} intro={t("builderPage.plansBody")} id="plans-title" />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {catalog.plans.map((p) => (
                <li key={p.tier} className={`flex flex-col gap-3 rounded-[var(--radius-card)] border p-6 ${p.highlighted ? "border-sage/60 bg-sage/[0.06]" : "border-line"}`} data-reveal>
                  {p.highlighted && <span className="self-start rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-on-sage">{t("builder.popular")}</span>}
                  <h3 className="font-display text-xl font-semibold">{loc(p.name, locale)}</h3>
                  <p className="text-sm text-mist">{loc(p.summary, locale)}</p>
                  <p className="tabular-nums">
                    {p.quoted && <span className="text-sm text-haze">{t("builderPage.plansFrom")} </span>}
                    <span className="font-display text-2xl font-semibold text-fog">{formatMoney(p.prices.EGP.setup, "EGP", locale)}</span>
                    <span className="block text-sm text-mist">+ {formatMoney(p.prices.EGP.monthly, "EGP", locale)}{t("builder.perMonth")}</span>
                  </p>
                  <ul className="flex flex-col gap-1.5 text-sm text-mist">
                    {p.features.map((f) => (
                      <li key={f.en} className="flex items-start gap-2"><Check size={14} aria-hidden className="mt-1 shrink-0 text-sage" /> {loc(f, locale)}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="container-x py-16 sm:py-20" aria-labelledby="cross-title">
        <SectionHeading title={t("builderPage.crossTitle")} intro={t("builderPage.crossBody")} id="cross-title" />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {cross.map(({ key, href, Icon }) => (
            <li key={key}>
              <Link href={href} className="group flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-ink-2 p-6 transition-colors hover:border-sage/50" data-track={`builder_${key}`}>
                <span className="flex items-center justify-between">
                  <Icon size={24} aria-hidden className="text-sage" />
                  {key === "crossApp" && <span className="rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-on-sage">{t("builderPage.crossApp.badge")}</span>}
                </span>
                <span className="text-lg font-semibold text-fog">{t(`builderPage.${key}.title`)}</span>
                <span className="text-sm text-mist">{t(`builderPage.${key}.body`)}</span>
                <ArrowRight size={16} aria-hidden className="mt-auto text-sage transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <GalaxySection id="builder-galaxy" />

      <section className="container-x pb-12" aria-labelledby="builder-faq-title">
        <h2 id="builder-faq-title" className="mb-8 text-2xl font-semibold">{t("builderPage.faqTitle")}</h2>
        <Faq items={faq} />
      </section>

      <CtaBand track="builder_cta" />
      <JsonLd data={serviceJsonLd({ name: t("builderPage.eyebrow"), description: t("builder.metaDescription"), url, locale })} />
    </>
  );
}
