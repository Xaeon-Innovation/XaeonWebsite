import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import ButtonLink from "@/components/ButtonLink";
import CtaBand from "@/components/CtaBand";
import SectionHeading from "@/components/SectionHeading";
import { getPackages } from "@/lib/api";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { localeUrl, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "packages" });
  return pageMetadata({ locale, path: "/packages", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function PackagesPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const [t, packages] = await Promise.all([getTranslations(), getPackages()]);

  return (
    <>
      <section className="container-x flex flex-col gap-8 pb-12 pt-12 sm:pt-16">
        <Breadcrumbs
          items={[
            { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
            { name: t("nav.packages"), href: "/packages", url: localeUrl(locale, "/packages") },
          ]}
        />
        <SectionHeading as="h1" eyebrow={t("packages.eyebrow")} title={t("packages.title")} intro={t("packages.intro")} />
      </section>

      <section className="container-x pb-8" aria-label={t("nav.packages")}>
        {packages.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-line p-8 text-mist">{t("packages.empty")}</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <li key={pkg._id} className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-ink-2 p-7" data-reveal>
                <div className="flex items-start justify-between gap-4">
                  {/* Package names and descriptions come from the CMS (English). */}
                  <h2 className="font-display text-xl font-semibold" lang="en">{pkg.title}</h2>
                  {pkg.discount ? (
                    <span className="shrink-0 rounded-full bg-sage/15 px-3 py-1 text-xs font-semibold text-sage">
                      {t("packages.save", { discount: pkg.discount })}
                    </span>
                  ) : null}
                </div>
                {pkg.description ? (
                  <div className="flex flex-col gap-3 text-sm text-mist" lang="en">
                    {pkg.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p.trim()}</p>)}
                  </div>
                ) : null}
                {pkg.project_type?.length ? (
                  <div className="flex flex-col gap-3 border-t border-line pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-haze">{t("packages.includes")}</p>
                    <ul className="flex flex-col gap-2.5">
                      {pkg.project_type.map((pt) => (
                        <li key={pt._id} className="flex items-start justify-between gap-3 text-sm">
                          <span className="inline-flex items-start gap-2 text-fog" lang="en">
                            <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-sage" /> {pt.title}
                          </span>
                          <span className="shrink-0 text-haze">{t("packages.stages", { count: pt.stages?.length ?? 0 })}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <ButtonLink
                  href={{ pathname: "/book", query: { package: pkg._id } }}
                  className="mt-auto"
                  data-track="package_discuss"
                  data-track-label={pkg.title}
                >
                  {t("packages.choose")}
                </ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CtaBand title={t("packages.customTitle")} body={t("packages.customBody")} track="packages_cta" />
    </>
  );
}
