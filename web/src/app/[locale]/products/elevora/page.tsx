import type { Metadata } from "next";
import { ArrowUpRight, Building, CalendarDays, Check, Gauge, ListChecks, MapPin, Stethoscope, Store, Truck, UserPlus, Wallet, WifiOff, Wrench, X, Map as MapIcon, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import ElevoraMock from "@/components/ElevoraMock";
import EnquiryForm from "@/components/EnquiryForm";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import ProcessSteps from "@/components/ProcessSteps";
import SectionHeading from "@/components/SectionHeading";
import { buttonClass } from "@/components/ButtonLink";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { elevoraJsonLd, localeUrl, pageMetadata } from "@/lib/seo";
import { ELEVORA_URL } from "@/lib/site";

const MODULE_ICONS: LucideIcon[] = [MapPin, MapIcon, ListChecks, Gauge, CalendarDays, UserPlus, Wallet, WifiOff];
const AUDIENCE_ICONS: LucideIcon[] = [Truck, Stethoscope, Wrench, Store];

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "elevora" });
  return pageMetadata({ locale, path: "/products/elevora", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function ElevoraPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations();
  const modules = t.raw("elevora.modules") as { title: string; body: string }[];
  const steps = t.raw("elevora.steps") as { title: string; body: string }[];
  const audience = t.raw("elevora.audience") as { title: string; body: string }[];
  const comparison = t.raw("elevora.comparison") as { topic: string; old: string; new: string }[];
  const faq = t.raw("elevora.faq") as { q: string; a: string }[];
  const badges = t.raw("elevora.badges") as string[];
  const url = localeUrl(locale, "/products/elevora");
  const trialHref = `${ELEVORA_URL}/signup?utm_source=xaeons.com&utm_medium=referral&utm_campaign=product_page`;

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
                { name: "Elevora", href: "/products/elevora", url },
              ]}
            />
            <p className="eyebrow">{t("elevora.eyebrow")}</p>
            <h1 className="text-4xl font-semibold sm:text-5xl lg:text-6xl">{t("elevora.title")}</h1>
            <p className="max-w-xl text-lg text-mist">{t("elevora.summary")}</p>
            <div className="flex flex-wrap gap-3">
              <a href={trialHref} target="_blank" rel="noopener" className={buttonClass("primary")} data-track="elevora_trial">
                {t("elevora.trial")} <ArrowUpRight size={16} aria-hidden className="rtl:-scale-x-100" />
              </a>
              <a href="#demo" className={buttonClass("secondary")} data-track="elevora_demo_jump">
                {t("elevora.demo")}
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fog">
              {badges.map((b) => (
                <li key={b} className="inline-flex items-center gap-2">
                  <Check size={16} aria-hidden className="text-sage" /> {b}
                </li>
              ))}
            </ul>
          </div>
          <ElevoraMock locale={locale} />
        </div>
      </section>

      <section className="container-x py-20 sm:py-24" aria-labelledby="modules-title">
        <SectionHeading title={t("elevora.modulesTitle")} id="modules-title" />
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

      <section className="paper" aria-labelledby="compare-title">
        <div className="container-x py-20 sm:py-24">
          <SectionHeading title={t("elevora.comparisonTitle")} tone="light" id="compare-title" />
          <div className="mt-10 overflow-x-auto rounded-[var(--radius-card)] border border-paper-line bg-white">
            <table className="w-full min-w-[36rem] text-start text-graphite">
              <thead>
                <tr className="border-b border-paper-line text-sm text-slate">
                  <th scope="col" className="p-4 text-start font-medium"><span className="sr-only">{t("elevora.compareTopic")}</span></th>
                  <th scope="col" className="p-4 text-start font-medium">{t("elevora.compareOld")}</th>
                  <th scope="col" className="p-4 text-start font-semibold text-sage-deep">Elevora</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.topic} className="border-b border-paper-line last:border-0">
                    <th scope="row" className="p-4 text-start font-semibold">{row.topic}</th>
                    <td className="p-4 text-slate">
                      <span className="inline-flex items-start gap-2"><X size={16} aria-hidden className="mt-1 shrink-0 text-slate/60" />{row.old}</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-start gap-2"><Check size={16} aria-hidden className="mt-1 shrink-0 text-sage-deep" />{row.new}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container-x py-20 sm:py-24" aria-labelledby="steps-title">
        <SectionHeading title={t("elevora.stepsTitle")} id="steps-title" />
        <div className="mt-12"><ProcessSteps steps={steps} /></div>
      </section>

      <section className="border-y border-line bg-ink-2" aria-labelledby="audience-title">
        <div className="container-x py-20 sm:py-24">
          <SectionHeading title={t("elevora.audienceTitle")} id="audience-title" />
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

      <section className="container-x py-20 sm:py-24" aria-labelledby="pricing-title">
        <div className="flex flex-col items-start gap-5 rounded-[2rem] border border-sage/30 bg-sage/[0.06] p-8 sm:p-12">
          <h2 id="pricing-title" className="text-3xl font-semibold">{t("elevora.pricingTitle")}</h2>
          <p className="max-w-2xl text-lg text-mist">{t("elevora.pricingBody")}</p>
          <a href={`${ELEVORA_URL}/pricing`} target="_blank" rel="noopener" className={buttonClass("primary")} data-track="elevora_pricing">
            {t("elevora.pricingCta")} <ArrowUpRight size={16} aria-hidden className="rtl:-scale-x-100" />
          </a>
        </div>
      </section>

      <section className="container-x pb-20" aria-labelledby="elevora-faq-title">
        <h2 id="elevora-faq-title" className="mb-8 text-2xl font-semibold">{t("elevora.faqTitle")}</h2>
        <Faq items={faq} />
      </section>

      <section id="demo" className="container-x scroll-mt-24 pb-24" aria-labelledby="demo-title">
        <div className="grid gap-12 rounded-[2rem] border border-line bg-ink-2 p-6 sm:p-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-4">
            <h2 id="demo-title" className="text-3xl font-semibold">{t("elevora.demoTitle")}</h2>
            <p className="text-lg text-mist">{t("elevora.demoBody")}</p>
          </div>
          <EnquiryForm source="product" interest="Elevora" askTeamSize idPrefix="elevora" />
        </div>
      </section>

      <JsonLd data={elevoraJsonLd({ description: t("elevora.summary"), url, locale })} />
    </>
  );
}
