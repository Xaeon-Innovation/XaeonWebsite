/** Admin blog editor helpers (kept out of component files for fast refresh). */

export type BlogDraft = {
  title: string;
  slug: string;
  author: string;
  status: "draft" | "published";
  excerpt: string;
  content: string;
  tags: string;
  coverImageUrl: string;
  coverAlt: string;
  seoTitle: string;
  seoDescription: string;
};

/** Same rules as the API: Latin + Arabic letters and digits, hyphen-separated. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
