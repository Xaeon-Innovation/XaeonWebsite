import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans, Unbounded } from "next/font/google";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import SiteClient from "@/components/SiteClient";
import CookieConsent from "@/components/CookieConsent";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getSocialLinks, socialProfileUrls } from "@/lib/api";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/site";

const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
// One Arabic family (body + headings), regular + bold only (each weight is two files); not preloaded on
// English pages, the browser fetches it only when Arabic text is on screen.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
});

const CLIENT_NAMESPACES = ["form", "booking", "book"] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: { default: t("homeTitle"), template: `%s | Xaeon` },
    description: t("homeDescription"),
    applicationName: "Xaeon",
    authors: [{ name: "Xaeon Software Solutions", url: SITE_ORIGIN }],
    creator: "Xaeon Software Solutions",
    publisher: "Xaeon Software Solutions",
    formatDetection: { telephone: false, email: false, address: false },
    icons: { icon: "/favicon.ico" },
    robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, social, messages] = await Promise.all([getTranslations(), getSocialLinks(), getMessages()]);
  // Only ship the strings client components use; everything else renders on the server.
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.filter((ns) => ns in messages).map((ns) => [ns, messages[ns]]),
  );

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${unbounded.variable} ${jakarta.variable} ${plexArabic.variable}`}
    >
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-sage focus:px-4 focus:py-2 focus:text-on-sage"
        >
          {t("nav.skip")}
        </a>
        <NextIntlClientProvider messages={clientMessages}>
          <Header />
          <main id="main">{children}</main>
          <Footer social={social} />
          <WhatsAppButton label={t("common.whatsapp")} />
          <CookieConsent
            labels={{
              text: t("consent.text"),
              privacy: t("consent.privacy"),
              accept: t("consent.accept"),
              decline: t("consent.decline"),
              label: t("consent.label"),
            }}
          />
          <Suspense fallback={null}>
            <SiteClient />
          </Suspense>
        </NextIntlClientProvider>
        <JsonLd data={[organizationJsonLd(socialProfileUrls(social)), websiteJsonLd(locale)]} />
      </body>
    </html>
  );
}
