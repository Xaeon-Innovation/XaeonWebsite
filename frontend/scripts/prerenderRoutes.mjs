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

