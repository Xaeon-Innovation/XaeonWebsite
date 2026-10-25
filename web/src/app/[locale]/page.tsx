import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ButtonLink from "@/components/ButtonLink";
import CtaBand from "@/components/CtaBand";
import ElevoraMock from "@/components/ElevoraMock";
import Faq from "@/components/Faq";
import Orbit from "@/components/Orbit";
import ProcessSteps from "@/components/ProcessSteps";
import SectionHeading from "@/components/SectionHeading";
import ServiceGrid from "@/components/ServiceGrid";
import Testimonials from "@/components/Testimonials";
import { getCaseStudies, getTestimonials } from "@/lib/api";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { ELEVORA_URL } from "@/lib/site";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    ...pageMetadata({ locale, path: "/", title: t("homeTitle"), description: t("homeDescription") }),
    title: { absolute: t("homeTitle") },
  };
}

export default async function HomePage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const [t, caseStudies, testimonials] = await Promise.all([getTranslations(), getCaseStudies(), getTestimonials()]);
  const faq = t.raw("faq") as { q: string; a: string }[];
  const why = t.raw("home.why.items") as { title: string; body: string }[];
  const steps = t.raw("home.process.steps") as { title: string; body: string }[];
  const badges = t.raw("elevora.badges") as string[];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0" aria-hidden />
        <Orbit className="pointer-events-none absolute -end-32 top-6 hidden w-[44rem] md:block rtl:-scale-x-100" />
        <div className="container-x relative flex flex-col gap-8 pb-20 pt-16 sm:pb-28 sm:pt-24">
          <Link
            href="/products/elevora"
            className="glass inline-flex max-w-full items-center gap-2 self-start rounded-full px-4 py-2 text-sm text-mist hover:text-fog"
            data-track="hero_elevora_badge"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-sage" aria-hidden />
            <span className="truncate">{t("home.hero.badge")}</span>
            <ArrowRight size={14} aria-hidden className="shrink-0 rtl:rotate-180" />
          </Link>
          <p className="eyebrow">{t("home.hero.eyebrow")}</p>
          <h1 className="max-w-4xl text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
            <span className="block">{t("home.hero.titleA")}</span>
            <span className="block text-sage">{t("home.hero.titleB")}</span>
          </h1>
          <p className="max-w-2xl text-lg text-mist sm:text-xl">{t("home.hero.subtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/book" data-track="hero_book_call">
              {t("home.hero.primary")}
            </ButtonLink>
            <ButtonLink href="/services" variant="secondary" data-track="hero_services">
              {t("home.hero.secondary")}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container-x py-20 sm:py-28" aria-labelledby="services-title">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow={t("home.services.eyebrow")} title={t("home.services.title")} intro={t("home.services.intro")} id="services-title" />
          <ButtonLink href="/services" variant="ghost" className="self-start md:self-auto">
            {t("common.viewAll")} <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
          </ButtonLink>
        </div>
        <ServiceGrid />
      </section>

      {/* Elevora */}
      <section className="border-y border-line bg-ink-2" aria-labelledby="elevora-title">
        <div className="container-x grid items-center gap-14 py-20 sm:py-28 lg:grid-cols-2">
          <div className="flex flex-col gap-6" data-reveal>
            <p className="eyebrow">{t("home.elevora.eyebrow")}</p>
            <h2 id="elevora-title" className="text-3xl font-semibold sm:text-4xl">{t("home.elevora.title")}</h2>
            <p className="text-lg text-mist">{t("home.elevora.body")}</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fog">
              {badges.map((b) => (
                <li key={b} className="inline-flex items-center gap-2">
                  <Check size={16} aria-hidden className="text-sage" /> {b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/products/elevora" data-track="home_elevora_explore">
                {t("home.elevora.cta")}
              </ButtonLink>
              <a
                href={`${ELEVORA_URL}/signup`}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-semibold text-fog hover:border-mist"
                data-track="home_elevora_trial"
              >
                {t("home.elevora.trial")} <ArrowUpRight size={16} aria-hidden className="rtl:-scale-x-100" />
              </a>
            </div>
          </div>
          <div data-reveal>
            <ElevoraMock locale={locale} />
          </div>
        </div>
      </section>

      {/* Work */}
      <section className="container-x py-20 sm:py-28" aria-labelledby="work-title">
        <SectionHeading eyebrow={t("home.work.eyebrow")} title={t("home.work.title")} id="work-title" />
        {caseStudies.length ? (
          <ul className="mt-12 grid gap-6 md:grid-cols-2">
            {caseStudies.slice(0, 4).map((cs) => (
              <li key={cs.id} data-reveal>
                <Link href={`/work/${cs.slug}`} className="group flex flex-col gap-4">
                  <span className="relative block aspect-[16/10] overflow-hidden rounded-[var(--radius-card)] bg-ink-3">
                    <Image src={cs.imageSrc} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  </span>
                  <span className="text-sm text-sage">{cs.subtitle}</span>
                  <span className="font-display text-xl font-semibold text-fog group-hover:underline underline-offset-4">{cs.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-line p-8" data-reveal>
            <p className="max-w-2xl text-mist">{t("home.work.empty")}</p>
            <ButtonLink href="/products/elevora" variant="ghost">
              {t("home.elevora.cta")} <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
            </ButtonLink>
          </div>
        )}
      </section>

      {/* Why */}
      <section className="paper" aria-labelledby="why-title">
        <div className="container-x py-20 sm:py-28">
          <SectionHeading eyebrow={t("home.why.eyebrow")} title={t("home.why.title")} tone="light" id="why-title" />
          <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {why.map((item, i) => (
              <li key={item.title} className="flex gap-4" data-reveal style={{ ["--reveal-delay" as string]: `${(i % 2) * 80}ms` }}>
                <Check size={22} aria-hidden className="mt-1 shrink-0 text-sage-deep" />
                <div>
                  <h3 className="font-sans text-lg font-semibold text-graphite">{item.title}</h3>
                  <p className="mt-1 text-slate">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Process */}
      <section className="container-x py-20 sm:py-28" aria-labelledby="process-title">
        <SectionHeading eyebrow={t("home.process.eyebrow")} title={t("home.process.title")} id="process-title" />
        <div className="mt-12">
          <ProcessSteps steps={steps} />
        </div>
      </section>

      <Testimonials items={testimonials} eyebrow={t("home.testimonials.eyebrow")} title={t("home.testimonials.title")} />

      {/* FAQ */}
      <section className="container-x py-20 sm:py-28" aria-labelledby="faq-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <SectionHeading eyebrow={t("home.faq.eyebrow")} title={t("home.faq.title")} id="faq-title" />
          <Faq items={faq} />
        </div>
      </section>

      <CtaBand track="home_cta" />
    </>
  );
}
