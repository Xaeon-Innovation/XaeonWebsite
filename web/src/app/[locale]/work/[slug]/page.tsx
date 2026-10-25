import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaBand from "@/components/CtaBand";
import JsonLd from "@/components/JsonLd";
import { buttonClass } from "@/components/ButtonLink";
import { getCaseStudies, getCaseStudy } from "@/lib/api";
import { cmsImage } from "@/lib/images";
import { articleJsonLd, localeUrl, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const studies = await getCaseStudies();
  return routing.locales.flatMap((locale) => studies.map((cs) => ({ locale, slug: cs.slug! })));
}

async function load(params: Props["params"]) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const cs = await getCaseStudy(slug);
  if (!cs) notFound();
  return { locale, slug, cs };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, cs } = await load(params);
  const image = cmsImage(cs.heroImageUrl || cs.imageUrl)?.src;
  return pageMetadata({
    locale,
    path: `/work/${slug}`,
    title: cs.heroTitle || cs.title,
    description: (cs.introText || cs.description).slice(0, 158),
    type: "article",
    image,
    publishedTime: cs.createdAt,
    modifiedTime: cs.updatedAt,
    translated: false,
  });
}

function Paragraphs({ text, className = "" }: { text?: string; className?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className={`prose-x ${className}`}>
      {text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

function Figure({ src, alt, priority = false }: { src?: string; alt: string; priority?: boolean }) {
  const img = cmsImage(src);
  if (!img) return null;
  return (
    <figure className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] bg-paper-2">
      <Image src={img.src} unoptimized={img.unoptimized} alt={alt} fill priority={priority} sizes="(min-width: 1200px) 1200px, 100vw" className="object-cover" />
    </figure>
  );
}

export default async function CaseStudyPage({ params }: Props) {
  const { locale, slug, cs } = await load(params);
  const t = await getTranslations();
  const url = localeUrl(locale, `/work/${slug}`);
  const title = cs.heroTitle || cs.title;
  const stats = (cs.stats ?? []).filter((s) => s.value && s.label);

  return (
    <>
      <section className="container-x flex flex-col gap-6 pb-12 pt-12 sm:pt-16">
        <Breadcrumbs
          items={[
            { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
            { name: t("nav.work"), href: "/work", url: localeUrl(locale, "/work") },
            { name: cs.title, href: `/work/${slug}`, url },
          ]}
        />
        <p className="eyebrow">{cs.subtitle}</p>
        <h1 className="max-w-4xl text-4xl font-semibold sm:text-5xl" lang="en">{title}</h1>
        {cs.heroSubtitle ? <p className="max-w-2xl text-xl text-mist" lang="en">{cs.heroSubtitle}</p> : null}
      </section>

      <div className="container-x pb-12">
        <Figure src={cs.heroImageUrl || cs.imageUrl} alt={cs.title} priority />
      </div>

      <article className="paper" lang="en">
        <div className="container-x flex flex-col gap-14 py-16 sm:py-20">
          <Paragraphs text={cs.introText || cs.description} className="text-lg text-slate" />

          {stats.length ? (
            <section aria-labelledby="results-title">
              <h2 id="results-title" className="mb-6 text-2xl font-semibold text-graphite">{t("work.results")}</h2>
              <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-paper-line bg-white p-6">
                    <dt className="text-sm text-slate">{s.label}</dt>
                    <dd className="mt-2 font-display text-3xl font-semibold text-sage-deep tabular-nums">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {(cs.showcaseImageUrls ?? []).length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {(cs.showcaseImageUrls ?? []).map((src, i) => <Figure key={src} src={src} alt={`${cs.title} — ${i + 1}`} />)}
            </div>
          ) : null}

          <Paragraphs text={cs.narrativeBefore} className="text-slate" />
          <Figure src={cs.dashboardImageUrl} alt={`${cs.title} — dashboard`} />
          <Paragraphs text={cs.narrativeAfter} className="text-slate" />
          <Figure src={cs.lifestyleImageUrl} alt={cs.title} />

          {cs.exploreHref && /^https?:\/\//.test(cs.exploreHref) ? (
            <a href={cs.exploreHref} target="_blank" rel="noopener" className={buttonClass("dark", "self-start")}>
              {cs.exploreLabel || t("work.visit")} <ArrowUpRight size={16} aria-hidden className="rtl:-scale-x-100" />
            </a>
          ) : null}
        </div>
      </article>

      <CtaBand title={t("work.ctaTitle")} track="case_study_cta" />
      <JsonLd
        data={articleJsonLd({
          type: "Article",
          headline: title,
          description: cs.introText || cs.description,
          url: localeUrl("en", `/work/${slug}`),
          image: cmsImage(cs.heroImageUrl || cs.imageUrl)?.src,
          datePublished: cs.createdAt,
          dateModified: cs.updatedAt,
        })}
      />
    </>
  );
}
