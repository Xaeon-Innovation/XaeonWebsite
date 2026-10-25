import type { Metadata } from "next";
import { Suspense } from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookTabs from "@/components/BookTabs";
import SectionHeading from "@/components/SectionHeading";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { localeUrl, pageMetadata } from "@/lib/seo";
import { CONTACT } from "@/lib/site";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "book" });
  return pageMetadata({ locale, path: "/book", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function BookPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const t = await getTranslations();
  const contacts = [
    { icon: Phone, label: t("book.phone"), value: CONTACT.phoneDisplay, href: `tel:${CONTACT.phoneE164}`, ltr: true },
    { icon: MessageCircle, label: t("book.whatsapp"), value: CONTACT.phoneDisplay, href: `https://wa.me/${CONTACT.whatsapp}`, ltr: true },
    { icon: Mail, label: t("book.email"), value: CONTACT.email, href: `mailto:${CONTACT.email}`, ltr: true },
  ];

  return (
    <section className="container-x grid gap-12 pb-24 pt-12 sm:pt-16 lg:grid-cols-[1fr_1.35fr]">
      <div className="flex flex-col gap-8">
        <Breadcrumbs
          items={[
            { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
            { name: t("nav.book"), href: "/book", url: localeUrl(locale, "/book") },
          ]}
        />
        <SectionHeading as="h1" eyebrow={t("book.eyebrow")} title={t("book.title")} intro={t("book.intro")} />
        <div className="flex flex-col gap-4">
          <h2 className="font-sans text-base font-semibold">{t("book.direct")}</h2>
          <ul className="flex flex-col gap-3">
            {contacts.map(({ icon: Icon, label, value, href, ltr }) => (
              <li key={label}>
                <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group flex items-center gap-4 rounded-2xl border border-line p-4 hover:border-sage/50">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage/10 text-sage">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-haze">{label}</span>
                    <span className="block truncate text-fog" dir={ltr ? "ltr" : undefined}>{value}</span>
                  </span>
                </a>
              </li>
            ))}
            <li className="flex items-center gap-4 rounded-2xl border border-line p-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage/10 text-sage">
                <MapPin size={18} aria-hidden />
              </span>
              <span>
                <span className="block text-sm text-haze">{t("book.office")}</span>
                <span className="block text-fog">{t("footer.address")}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="glass self-start rounded-[2rem] p-5 sm:p-8">
        <Suspense fallback={null}>
          <BookTabs />
        </Suspense>
      </div>
    </section>
  );
}
