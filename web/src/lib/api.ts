import "server-only";
import type { BuilderCatalog, Star } from "./builder";

/**
 * Server-side reads from the Express API. Every call is cached by Next and refreshed in the
 * background (ISR), and every call degrades to an empty value if the API is unreachable so a
 * page never fails to render because of CMS content.
 */
const API_ORIGIN = (process.env.API_ORIGIN || "https://api.xaeons.com").replace(/\/+$/, "");
const REVALIDATE_SECONDS = 300;

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_ORIGIN}/api/v1${path}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["cms"] },
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[api] ${path} failed:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

export type ProjectType = { _id: string; title: string; stages: string[] };
export type Package = {
  _id: string;
  title: string;
  description?: string;
  discount?: number;
  project_type: ProjectType[];
  showOnWebsite?: boolean;
  sortOrder?: number;
};

export async function getPackages(): Promise<Package[]> {
  const data = await getJson<{ packages?: Package[] }>("/package", {});
  return (data.packages ?? [])
    .filter((p) => p.showOnWebsite !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function getPackage(id: string): Promise<Package | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const data = await getJson<{ package?: Package }>(`/package/${id}`, {});
  return data.package ?? null;
}

export type CaseStudySlide = {
  id: string;
  slug?: string;
  imageSrc: string;
  logoSrc?: string;
  title: string;
  subtitle: string;
  description: string;
};

export async function getCaseStudies(): Promise<CaseStudySlide[]> {
  const data = await getJson<{ slides?: CaseStudySlide[] }>("/site/case-studies", {});
  return (data.slides ?? []).filter((s) => Boolean(s.slug));
}

export type CaseStudy = {
  _id: string;
  slug: string;
  label: string;
  value: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  logoUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  introText?: string;
  showcaseImageUrls?: string[];
  dashboardImageUrl?: string;
  narrativeBefore?: string;
  lifestyleImageUrl?: string;
  narrativeAfter?: string;
  stats?: { value: string; label: string }[];
  exploreHref?: string;
  exploreLabel?: string;
  updatedAt?: string;
  createdAt?: string;
};

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const data = await getJson<{ caseStudy?: CaseStudy }>(`/site/case-studies/${slug}`, {});
  return data.caseStudy ?? null;
}

export type BlogPost = {
  _id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  /** Markdown body. */
  content?: string;
  coverImageUrl?: string;
  coverAlt?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  author?: string | { _id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
};

export async function getBlogPosts(): Promise<BlogPost[]> {
  const data = await getJson<{ blogPosts?: BlogPost[] }>("/blog-post", {});
  const date = (p: BlogPost) => new Date(p.publishedAt ?? p.createdAt ?? 0).getTime();
  return [...(data.blogPosts ?? [])].sort((a, b) => date(b) - date(a));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!slug || slug.length > 120) return null;
  const data = await getJson<{ blogPost?: BlogPost }>(`/blog-post/slug/${encodeURIComponent(slug)}`, {});
  return data.blogPost ?? null;
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const data = await getJson<{ blogPost?: BlogPost }>(`/blog-post/${id}`, {});
  return data.blogPost ?? null;
}

export type TeamMember = { _id: string; name: string; role: string; photoUrl: string };

export async function getTeam(): Promise<TeamMember[]> {
  const data = await getJson<{ teamMembers?: TeamMember[]; showSection?: boolean }>("/site/team-members", {});
  return data.showSection === false ? [] : data.teamMembers ?? [];
}

export type Testimonial = { _id: string; quote: string; name: string; role?: string; company?: string; logoUrl?: string };

export async function getTestimonials(): Promise<Testimonial[]> {
  const data = await getJson<{ testimonials?: Testimonial[] }>("/site/testimonials", {});
  return data.testimonials ?? [];
}

export type SocialLinks = {
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  emailUrl: string;
};

export async function getSocialLinks(): Promise<SocialLinks | null> {
  const data = await getJson<{ socialLinks?: SocialLinks }>("/site/social-links", {});
  return data.socialLinks ?? null;
}

export function socialProfileUrls(links: SocialLinks | null): string[] {
  if (!links) return [];
  return [links.linkedinUrl, links.facebookUrl, links.instagramUrl, links.twitterUrl].filter((u) =>
    /^https?:\/\//.test(u ?? ""),
  );
}

/** Website Builder catalog (templates, add-ons, plans). Empty lists if the API is down. */
export async function getBuilderCatalog(): Promise<BuilderCatalog> {
  const data = await getJson<Partial<BuilderCatalog>>("/builder/catalog", {});
  return { templates: data.templates ?? [], addons: data.addons ?? [], plans: data.plans ?? [], payments: data.payments ?? {} };
}

/** Published clients for the galaxy of stars. */
export async function getStars(): Promise<Star[]> {
  const data = await getJson<{ stars?: Star[] }>("/site/stars", {});
  return data.stars ?? [];
}
