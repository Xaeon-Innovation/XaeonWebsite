import { canonicalUrl, SITE } from "./siteMeta";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.origin}/#organization`,
    name: SITE.name,
    alternateName: "Xaeon",
    url: SITE.origin,
    logo: `${SITE.origin}/assets/backgrounds/logo.webp`,
    email: "info@xaeons.com",
    telephone: "+20 101 597 1869",
    address: {
      "@type": "PostalAddress",
      streetAddress: "13 Roushdy Basha, Mustafa Kamel WA Bolkli, Sidi Gaber",
      addressLocality: "Alexandria",
      addressCountry: "EG",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "info@xaeons.com",
      telephone: "+20 101 597 1869",
      availableLanguage: ["English", "Arabic"],
    },
    // Add LinkedIn / Facebook / Instagram / Clutch profile URLs here once they're live.
    sameAs: [],
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.origin}/#website`,
    name: SITE.name,
    url: SITE.origin,
    publisher: { "@id": `${SITE.origin}/#organization` },
  };
}

export function serviceJsonLd({
  pathname,
  name,
  description,
}: {
  pathname: string;
  name: string;
  description: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: canonicalUrl(pathname),
    provider: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.origin,
    },
  };
}

export function caseStudyJsonLd({
  pathname,
  name,
  description,
  image,
}: {
  pathname: string;
  name: string;
  description: string;
  image?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name,
    description,
    url: canonicalUrl(pathname),
    ...(image ? { image } : {}),
    creator: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.origin,
    },
  };
}

