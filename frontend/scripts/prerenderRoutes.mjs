// Routes to prerender into dist/*.html for SEO.
// Keep this list aligned with `src/main.tsx` marketing/public routes.

export const STATIC_ROUTES = [
  "/",
  "/about-us",
  "/services",
  "/our-work",
  "/packages",
  "/blog",
  "/book-now",
  "/terms",
  "/privacy",
];

// `/services/:slug` slugs come from `src/data/servicesCatalog.ts`.
export const SERVICE_SLUGS = [
  "custom-software-solutions",
  "ai-solutions",
  "websites",
  "web-apps-development",
  "mobile-apps-development",
  "design-branding",
  "video-photography-production",
  "digital-marketing",
];

export function buildRoutesToPrerender() {
  const routes = new Set(STATIC_ROUTES);
  for (const slug of SERVICE_SLUGS) routes.add(`/services/${slug}`);
  return [...routes];
}


/**
 * Static routes plus CMS-driven pages (published case studies) so the sitemap and
 * prerender include them. Falls back to static routes if the API is unreachable.
 */
export async function buildRoutesWithContent() {
  const routes = new Set(buildRoutesToPrerender());
  const apiOrigin = (process.env.SEO_API_ORIGIN || process.env.XAEON_API_ORIGIN || "https://api.xaeons.com")
    .replace(/\/+$/, "");
  try {
    const res = await fetch(`${apiOrigin}/api/v1/site/case-studies`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      for (const slide of data.slides ?? []) {
        if (typeof slide.slug === "string" && slide.slug) routes.add(`/case-studies/${slide.slug}`);
      }
    }
  } catch (err) {
    console.warn(`[seo] could not fetch case studies from ${apiOrigin}: ${err.message}`);
  }
  return [...routes];
}
