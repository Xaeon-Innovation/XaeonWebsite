import type { Metadata } from "next";
import { BarChart3, BellRing, Building, Building2, CalendarDays, Check, FileHeart, Globe, HeartPulse, Receipt, ShieldCheck, Smile, Sparkles, Stethoscope, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import ButtonLink, { buttonClass } from "@/components/ButtonLink";
import EnquiryForm from "@/components/EnquiryForm";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import ProcessSteps from "@/components/ProcessSteps";
import SectionHeading from "@/components/SectionHeading";
import VeloraMock from "@/components/VeloraMock";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { localeUrl, pageMetadata, veloraJsonLd } from "@/lib/seo";

const MODULE_ICONS: LucideIcon[] = [CalendarDays, Globe, FileHeart, Receipt, BellRing, Building2, BarChart3, ShieldCheck];
const AUDIENCE_ICONS: LucideIcon[] = [Stethoscope, Smile, HeartPulse, Sparkles];

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "velora" });
  return pageMetadata({ locale, path: "/products/velora", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function VeloraPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations();
  const modules = t.raw("velora.modules") as { title: string; body: string }[];
  const steps = t.raw("velora.steps") as { title: string; body: string }[];
  const audience = t.raw("velora.audience") as { title: string; body: string }[];
  const faq = t.raw("velora.faq") as { q: string; a: string }[];
  const badges = t.raw("velora.badges") as string[];
  const url = localeUrl(locale, "/products/velora");

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0" aria-hidden />
        <div className="container-x relative grid items-center gap-14 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-7">
            <Breadcrumbs
              items={[
                { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
                { name: t("nav.products"), href: "/products", url: localeUrl(locale, "/products") },
                { name: "Velora", href: "/products/velora", url },
              ]}
            />
            <p className="eyebrow">{t("velora.eyebrow")}</p>
            <h1 className="text-4xl font-semibold sm:text-5xl lg:text-6xl">{t("velora.title")}</h1>
            <p className="max-w-xl text-lg text-mist">{t("velora.summary")}</p>
            <div className="flex flex-wrap gap-3">
              <a href="#demo" className={buttonClass("primary")} data-track="velora_demo_jump">
                {t("velora.demo")}
              </a>
              <ButtonLink href="/website-builder?category=clinics" variant="secondary" data-track="velora_website">
                {t("velora.website")}
              </ButtonLink>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fog">
              {badges.map((b) => (
                <li key={b} className="inline-flex items-center gap-2">
                  <Check size={16} aria-hidden className="text-sage" /> {b}
                </li>
              ))}
            </ul>
          </div>
          <VeloraMock locale={locale} />
        </div>
      </section>

      <section className="container-x py-20 sm:py-24" aria-labelledby="modules-title">
        <SectionHeading title={t("velora.modulesTitle")} id="modules-title" />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m, i) => {
            const Icon = MODULE_ICONS[i] ?? Building;
            return (
              <li key={m.title} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-ink-2 p-6" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 4) * 60}ms` }}>
                <Icon size={22} aria-hidden className="text-sage" />
                <h3 className="font-sans text-lg font-semibold">{m.title}</h3>
                <p className="text-sm text-mist">{m.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="container-x pb-20 sm:pb-24" aria-labelledby="steps-title">
        <SectionHeading title={t("velora.stepsTitle")} id="steps-title" />
        <div className="mt-12"><ProcessSteps steps={steps} /></div>
      </section>

      <section className="border-y border-line bg-ink-2" aria-labelledby="audience-title">
        <div className="container-x py-20 sm:py-24">
          <SectionHeading title={t("velora.audienceTitle")} id="audience-title" />
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {audience.map((a, i) => {
              const Icon = AUDIENCE_ICONS[i] ?? Building;
              return (
                <li key={a.title} className="flex flex-col gap-3" data-reveal>
                  <Icon size={24} aria-hidden className="text-sage" />
                  <h3 className="font-sans text-lg font-semibold">{a.title}</h3>
                  <p className="text-mist">{a.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="container-x py-20 sm:py-24" aria-labelledby="website-title">
        <div className="flex flex-col items-start gap-5 rounded-[2rem] border border-sage/30 bg-sage/[0.06] p-8 sm:p-12">
          <h2 id="website-title" className="text-3xl font-semibold">{t("velora.websiteTitle")}</h2>
          <p className="max-w-2xl text-lg text-mist">{t("velora.websiteBody")}</p>
          <ButtonLink href="/website-builder?category=clinics" data-track="velora_website_cta">
            {t("velora.websiteCta")}
          </ButtonLink>
        </div>
      </section>

      <section className="container-x pb-20" aria-labelledby="velora-faq-title">
        <h2 id="velora-faq-title" className="mb-8 text-2xl font-semibold">{t("velora.faqTitle")}</h2>
        <Faq items={faq} />
      </section>

      <section id="demo" className="container-x scroll-mt-24 pb-24" aria-labelledby="demo-title">
        <div className="grid gap-12 rounded-[2rem] border border-line bg-ink-2 p-6 sm:p-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-4">
            <h2 id="demo-title" className="text-3xl font-semibold">{t("velora.demoTitle")}</h2>
            <p className="text-lg text-mist">{t("velora.demoBody")}</p>
          </div>
          <EnquiryForm source="product" interest="Velora" idPrefix="velora" />
        </div>
      </section>

      <JsonLd data={veloraJsonLd({ description: t("velora.summary"), url, locale })} />
    </>
  );
}
