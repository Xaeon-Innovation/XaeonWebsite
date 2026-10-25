/**
 * Blog posts have no slug field yet, so URLs are "<title-slug>--<id>": readable for people and
 * search, with the id as the stable part. Changing a title keeps old links working because
 * only the id is used for lookup (the page redirects to the canonical slug).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function blogSlug(post: { _id: string; title: string }): string {
  const base = slugify(post.title);
  return base ? `${base}--${post._id}` : post._id;
}

export function idFromBlogSlug(slug: string): string | null {
  const id = slug.includes("--") ? slug.slice(slug.lastIndexOf("--") + 2) : slug;
  return /^[a-f0-9]{24}$/i.test(id) ? id : null;
}

export function readingMinutes(text: string | undefined): number {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function authorName(author: unknown): string | null {
  if (author && typeof author === "object" && "name" in author) {
    const name = (author as { name?: unknown }).name;
    return typeof name === "string" && name ? name : null;
  }
  return null;
}
