import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { CONTACT, ELEVORA_URL, SITE_ORIGIN } from "./site";

/** Absolute URL of `path` (unprefixed, e.g. "/services") in `locale`. */
export function localeUrl(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path.replace(/\/+$/, "");
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${SITE_ORIGIN}${prefix}${clean}` || SITE_ORIGIN;
}

type PageMeta = {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  /** Article pages pass "article"; everything else is a website page. */
  type?: "website" | "article";
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  /** False for pages whose content exists only in English (CMS content). */
  translated?: boolean;
};

/** Canonical, hreflang alternates, Open Graph and Twitter tags for one page. */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  type = "website",
  image,
  publishedTime,
  modifiedTime,
  translated = true,
}: PageMeta): Metadata {
  const url = localeUrl(locale, path);
  // A page's own openGraph replaces the parent's, so always carry an image: the page's or the
  // generated brand card (app/[locale]/opengraph-image.tsx).
  const shareImage = image ?? localeUrl(locale, "/opengraph-image");
  // Untranslated CMS pages (English-only content) point every locale at the English URL.
  const canonical = translated ? url : localeUrl("en", path);
  const languages: Record<string, string> = translated
    ? { en: localeUrl("en", path), ar: localeUrl("ar", path), "x-default": localeUrl("en", path) }
    : { en: canonical, "x-default": canonical };
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: "Xaeon Software Solutions",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: translated ? [locale === "ar" ? "en_US" : "ar_EG"] : undefined,
      images: [{ url: shareImage, width: image ? undefined : 1200, height: image ? undefined : 630 }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}

/* ---------- JSON-LD ---------- */

type Json = Record<string, unknown>;
const ORG_ID = `${SITE_ORIGIN}/#organization`;

export function organizationJsonLd(sameAs: string[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORG_ID,
    name: "Xaeon Software Solutions",
    alternateName: "Xaeon",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/logo.webp`,
    image: `${SITE_ORIGIN}/logo.webp`,
    email: CONTACT.email,
    telephone: CONTACT.phoneDisplay,
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT.street,
      addressLocality: CONTACT.city,
      addressCountry: CONTACT.country,
    },
    areaServed: ["EG", "AE", "SA", "Middle East", "Worldwide"],
    knowsLanguage: ["en", "ar"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: CONTACT.email,
      telephone: CONTACT.phoneDisplay,
      availableLanguage: ["English", "Arabic"],
    },
    owns: { "@id": `${ELEVORA_URL}/#software` },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd(locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    name: "Xaeon Software Solutions",
    url: SITE_ORIGIN,
    inLanguage: locale,
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function serviceJsonLd(opts: { name: string; description: string; url: string; locale: Locale }): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.locale,
    serviceType: opts.name,
    provider: { "@id": ORG_ID },
    areaServed: ["EG", "AE", "SA", "Worldwide"],
  };
}

export function elevoraJsonLd(opts: { description: string; url: string; locale: Locale }): Json {
  return {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    "@id": `${ELEVORA_URL}/#software`,
    name: "Elevora",
    description: opts.description,
    url: ELEVORA_URL,
    sameAs: [opts.url],
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Human resources and workforce management",
    operatingSystem: "Web, iOS, Android",
    inLanguage: ["en", "ar"],
    offers: {
      "@type": "Offer",
      price: "6",
      priceCurrency: "USD",
      description: "From $6 per seat per month, 14-day free trial",
      url: `${ELEVORA_URL}/pricing`,
    },
    publisher: { "@id": ORG_ID },
  };
}

export function faqJsonLd(items: { q: string; a: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function articleJsonLd(opts: {
  type: "BlogPosting" | "Article";
  headline: string;
  description: string;
  url: string;
  image?: string;
  author?: string | null;
  datePublished?: string;
  dateModified?: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": opts.type,
    headline: opts.headline.slice(0, 110),
    description: opts.description,
    mainEntityOfPage: opts.url,
    url: opts.url,
    ...(opts.image ? { image: [opts.image] } : {}),
    author: opts.author
      ? { "@type": "Person", name: opts.author, worksFor: { "@id": ORG_ID } }
      : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    inLanguage: "en",
  };
}
