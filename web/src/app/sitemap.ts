import type { MetadataRoute } from "next";
import { getBlogPosts, getCaseStudies } from "@/lib/api";
import { blogSlug } from "@/lib/blog";
import { localeUrl } from "@/lib/seo";
import { SERVICE_SLUGS } from "@/lib/site";

export const revalidate = 3600;

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  ...SERVICE_SLUGS.map((s) => ({ path: `/services/${s}`, priority: 0.8, changeFrequency: "monthly" as const })),
  { path: "/products", priority: 0.7, changeFrequency: "monthly" },
  { path: "/products/polara", priority: 0.9, changeFrequency: "weekly" },
  { path: "/products/velora", priority: 0.9, changeFrequency: "weekly" },
  { path: "/website-builder", priority: 0.9, changeFrequency: "weekly" },
  { path: "/work", priority: 0.8, changeFrequency: "weekly" },
  { path: "/packages", priority: 0.8, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/book", priority: 0.9, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [caseStudies, posts] = await Promise.all([getCaseStudies(), getBlogPosts()]);
  const now = new Date();

  // Translated pages: one entry per locale, each listing its hreflang alternates.
  const translated: MetadataRoute.Sitemap = STATIC_PATHS.flatMap(({ path, priority, changeFrequency }) =>
    (["en", "ar"] as const).map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: now,
      changeFrequency,
      priority: locale === "en" ? priority : Math.max(0.1, priority - 0.1),
      alternates: { languages: { en: localeUrl("en", path), ar: localeUrl("ar", path), "x-default": localeUrl("en", path) } },
    })),
  );

  // CMS content is English-only: list the canonical English URL.
  const work: MetadataRoute.Sitemap = caseStudies.map((cs) => ({
    url: localeUrl("en", `/work/${cs.slug}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const blog: MetadataRoute.Sitemap = posts.map((p) => ({
    url: localeUrl("en", `/blog/${blogSlug(p)}`),
    lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...translated, ...work, ...blog];
}
