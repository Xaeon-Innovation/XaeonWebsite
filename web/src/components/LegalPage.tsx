import { getTranslations } from "next-intl/server";
import Breadcrumbs from "./Breadcrumbs";
import type { Locale } from "@/i18n/routing";
import { localeUrl } from "@/lib/seo";

type Section = { h: string; p: string[] };

export default async function LegalPage({ locale, doc }: { locale: Locale; doc: "terms" | "privacy" }) {
  const t = await getTranslations();
  const sections = t.raw(`legal.${doc}.sections`) as Section[];
  const path = `/${doc}`;
  return (
    <>
      <section className="container-x flex flex-col gap-6 pb-12 pt-12 sm:pt-16">
        <Breadcrumbs
          items={[
            { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
            { name: t(`legal.${doc}.title`), href: path, url: localeUrl(locale, path) },
          ]}
        />
        <h1 className="text-4xl font-semibold sm:text-5xl">{t(`legal.${doc}.title`)}</h1>
        <p className="text-mist">{t("legal.updated", { date: t(`legal.${doc}.date`) })}</p>
      </section>
      <div className="paper">
        <div className="container-x py-16 sm:py-20">
          <div className="prose-x text-graphite">
            {sections.map((s, i) => (
              <section key={i}>
                {s.h ? <h2 className="font-display font-semibold">{s.h}</h2> : null}
                {s.p.map((p, j) => <p key={j}>{p}</p>)}
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
