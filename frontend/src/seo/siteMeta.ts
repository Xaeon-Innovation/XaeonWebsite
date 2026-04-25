export const SITE = {
  origin: (import.meta.env.VITE_SITE_ORIGIN || "https://xaeons.com").replace(/\/+$/, ""),
  name: "Xaeon Software Solutions",
  defaultOgType: "website" as const,
  // If you add a real OG image later, set VITE_OG_IMAGE_URL to an absolute URL.
  ogImageUrl: (import.meta.env.VITE_OG_IMAGE_URL || "").trim(),
};

export function canonicalUrl(pathname: string) {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalized = cleanPath === "/" ? "/" : cleanPath.replace(/\/+$/, "") + "/";
  return `${SITE.origin}${normalized}`;
}

