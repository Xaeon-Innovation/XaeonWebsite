import { Helmet } from "react-helmet-async";

import { SITE, canonicalUrl } from "./siteMeta";
import { organizationJsonLd, websiteJsonLd } from "./schema";

type SeoProps = {
  title: string;
  description?: string;
  pathname?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

export default function Seo({
  title,
  description,
  pathname = "/",
  ogType = SITE.defaultOgType,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const canonical = canonicalUrl(pathname);

  const metaDescription =
    description ||
    "Software development, AI solutions, and digital marketing for teams that need reliable delivery.";

  const ogImage = SITE.ogImageUrl || undefined;

  const jsonLdArray = [
    organizationJsonLd(),
    websiteJsonLd(),
    ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
  ];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />

      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE.name} />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}

      <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}

      {jsonLdArray.map((obj, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}

