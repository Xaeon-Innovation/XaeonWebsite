import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaBand from "@/components/CtaBand";
import Orbit from "@/components/Orbit";
import SectionHeading from "@/components/SectionHeading";
import { getTeam } from "@/lib/api";
import { cmsImage } from "@/lib/images";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { localeUrl, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "about" });
  return pageMetadata({ locale, path: "/about", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function AboutPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const [t, team] = await Promise.all([getTranslations(), getTeam()]);
  const values = t.raw("about.values") as { title: string; body: string }[];

  return (
    <>
      <section className="relative overflow-hidden">
        <Orbit className="pointer-events-none absolute -end-40 top-10 hidden w-[40rem] opacity-70 md:block rtl:-scale-x-100" />
        <div className="container-x relative flex flex-col gap-8 pb-16 pt-12 sm:pt-16">
          <Breadcrumbs
            items={[
              { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
              { name: t("nav.about"), href: "/about", url: localeUrl(locale, "/about") },
            ]}
          />
          <SectionHeading as="h1" eyebrow={t("about.eyebrow")} title={t("about.title")} />
          <div className="flex max-w-2xl flex-col gap-4 text-lg text-mist">
            <p>{t("about.body1")}</p>
            <p>{t("about.body2")}</p>
          </div>
        </div>
      </section>

      <section className="paper" aria-labelledby="values-title">
        <div className="container-x py-20 sm:py-24">
          <SectionHeading title={t("about.valuesTitle")} tone="light" id="values-title" />
          <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <li key={v.title} className="flex flex-col gap-2 border-t border-paper-line pt-5" data-reveal>
                <h3 className="font-sans text-lg font-semibold text-graphite">{v.title}</h3>
                <p className="text-slate">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {team.length ? (
        <section className="container-x py-20 sm:py-24" aria-labelledby="team-title">
          <SectionHeading title={t("about.teamTitle")} id="team-title" />
          <ul className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {team.map((m) => {
              const img = cmsImage(m.photoUrl);
              return (
                <li key={m._id} className="flex flex-col gap-3" data-reveal>
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-ink-3">
                    {img ? <Image src={img.src} unoptimized={img.unoptimized} alt={m.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" /> : null}
                  </span>
                  <span>
                    <span className="block font-semibold text-fog" lang="en">{m.name}</span>
                    <span className="block text-sm text-haze" lang="en">{m.role}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="container-x pb-8" aria-labelledby="offices-title">
        <h2 id="offices-title" className="mb-6 text-2xl font-semibold">{t("about.officesTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line p-6">
            <p className="font-semibold text-fog">{t("footer.alexandria")}</p>
            <p className="mt-1 text-mist">{t("footer.address")}</p>
          </div>
          <div className="rounded-2xl border border-dashed border-line p-6">
            <p className="font-semibold text-fog">UAE</p>
            <p className="mt-1 text-mist">{t("footer.uae")}</p>
          </div>
        </div>
      </section>

      <CtaBand track="about_cta" />
    </>
  );
}
