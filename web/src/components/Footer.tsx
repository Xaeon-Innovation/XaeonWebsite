import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import CookieSettingsButton from "./CookieSettingsButton";
import { APP_ORIGIN, CONTACT, SERVICE_SLUGS } from "@/lib/site";
import type { SocialLinks } from "@/lib/api";

const SOCIAL_LABELS: [keyof SocialLinks, string][] = [
  ["linkedinUrl", "LinkedIn"],
  ["instagramUrl", "Instagram"],
  ["facebookUrl", "Facebook"],
  ["twitterUrl", "X"],
];

export default async function Footer({ social }: { social: SocialLinks | null }) {
  const t = await getTranslations();
  const year = new Date().getFullYear();
  const socials = SOCIAL_LABELS.filter(([key]) => /^https?:\/\//.test(social?.[key] ?? ""));

  const company = [
    { href: "/about", label: t("nav.about") },
    { href: "/work", label: t("nav.work") },
    { href: "/products/elevora", label: "Elevora" },
    { href: "/packages", label: t("nav.packages") },
    { href: "/blog", label: t("nav.blog") },
    { href: "/book", label: t("nav.book") },
  ];

  return (
    <footer className="border-t border-line bg-ink-2">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12">
        <div className="flex flex-col gap-5 md:col-span-4">
          <Image src="/logo.webp" alt="Xaeon" width={100} height={48} className="h-10 w-auto self-start" />
          <p className="max-w-sm text-mist">{t("footer.tagline")}</p>
          {socials.length ? (
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {socials.map(([key, label]) => (
                <li key={key}>
                  <a href={social![key]} target="_blank" rel="noopener noreferrer" className="text-mist hover:text-fog">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label={t("footer.explore")} className="md:col-span-3">
          <h2 className="eyebrow mb-4">{t("nav.services")}</h2>
          <ul className="flex flex-col gap-2.5 text-sm">
            {SERVICE_SLUGS.map((slug) => (
              <li key={slug}>
                <Link href={`/services/${slug}`} className="text-mist hover:text-fog">
                  {t(`services.items.${slug}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("footer.company")} className="md:col-span-2">
          <h2 className="eyebrow mb-4">{t("footer.company")}</h2>
          <ul className="flex flex-col gap-2.5 text-sm">
            {company.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-mist hover:text-fog">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={`${APP_ORIGIN}/login`} className="text-mist hover:text-fog">
                {t("nav.clientLogin")}
              </a>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-3">
          <h2 className="eyebrow mb-4">{t("footer.contact")}</h2>
          <address className="flex flex-col gap-3 text-sm not-italic text-mist">
            <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 hover:text-fog">
              <Mail size={16} aria-hidden className="text-sage" /> {CONTACT.email}
            </a>
            <a href={`tel:${CONTACT.phoneE164}`} className="inline-flex items-center gap-2 hover:text-fog" dir="ltr">
              <Phone size={16} aria-hidden className="text-sage" /> {CONTACT.phoneDisplay}
            </a>
            <p className="inline-flex items-start gap-2">
              <MapPin size={16} aria-hidden className="mt-1 shrink-0 text-sage" />
              <span>
                {t("footer.address")}
                <br />
                <span className="text-haze">{t("footer.uae")}</span>
              </span>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-6 text-sm text-haze sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.rights", { year })}</p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <li><Link href="/terms" className="hover:text-fog">{t("footer.terms")}</Link></li>
            <li><Link href="/privacy" className="hover:text-fog">{t("footer.privacy")}</Link></li>
            <li><CookieSettingsButton label={t("footer.cookies")} /></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
