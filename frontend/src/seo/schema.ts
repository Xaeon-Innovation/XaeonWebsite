import { canonicalUrl, SITE } from "./siteMeta";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.origin,
    email: "info@xaeons.com",
    sameAs: [],
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.origin,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.origin}/services/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
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

