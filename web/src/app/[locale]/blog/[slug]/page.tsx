import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaBand from "@/components/CtaBand";
import JsonLd from "@/components/JsonLd";
import Markdown from "@/components/Markdown";
import { getBlogPost, getBlogPostBySlug, getBlogPosts } from "@/lib/api";
import { authorName, blogSlug, idFromBlogSlug, readingMinutes } from "@/lib/blog";
import { cmsImage } from "@/lib/images";
import { articleJsonLd, localeUrl, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return routing.locales.flatMap((locale) => posts.map((p) => ({ locale, slug: blogSlug(p) })));
}

/** Finds a post by its slug, or by the id inside an older "<title>--<id>" link. */
async function load(params: Props["params"]) {
  const { locale, slug: raw } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const slug = decodeURIComponent(raw);
  let post = await getBlogPostBySlug(slug.toLowerCase());
  if (!post) {
    const id = idFromBlogSlug(slug);
    post = id ? await getBlogPost(id) : null;
  }
  if (!post) notFound();
  return { locale, slug, post };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, post } = await load(params);
  const cover = cmsImage(post.coverImageUrl)?.src;
  return pageMetadata({
    locale,
    path: `/blog/${blogSlug(post)}`,
    title: post.seoTitle || post.title,
    description: (post.seoDescription || post.excerpt || "").replace(/\s+/g, " ").slice(0, 158),
    type: "article",
    image: cover,
    publishedTime: post.publishedAt ?? post.createdAt,
    modifiedTime: post.updatedAt,
    translated: false,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug, post } = await load(params);
  // Old link or changed title: send readers and crawlers to the current URL.
  const canonicalSlug = blogSlug(post);
  if (slug !== canonicalSlug) permanentRedirect(`${locale === "en" ? "" : `/${locale}`}/blog/${encodeURIComponent(canonicalSlug)}`);

  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);
  const author = authorName(post.author);
  const url = localeUrl(locale, `/blog/${canonicalSlug}`);
  const cover = cmsImage(post.coverImageUrl);
  const date = post.publishedAt ?? post.createdAt;

  return (
    <>
      <article>
        <header className="container-x flex flex-col gap-6 pb-12 pt-12 sm:pt-16">
          <Breadcrumbs
            items={[
              { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
              { name: t("nav.blog"), href: "/blog", url: localeUrl(locale, "/blog") },
              { name: post.title, href: `/blog/${canonicalSlug}`, url },
            ]}
          />
          <h1 className="max-w-4xl text-4xl font-semibold sm:text-5xl" lang="en">{post.title}</h1>
          {post.excerpt ? <p className="max-w-3xl text-xl text-mist" lang="en">{post.excerpt}</p> : null}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-mist">
            {author ? <span>{t("blog.by", { author })}</span> : null}
            {date ? <time dateTime={date}>{format.dateTime(new Date(date), { dateStyle: "long" })}</time> : null}
            <span>{t("common.minRead", { minutes: readingMinutes(post.content) })}</span>
          </p>
          {post.tags?.length ? (
            <ul className="flex flex-wrap gap-2" aria-label="Tags">
              {post.tags.map((tag) => <li key={tag} className="rounded-full bg-white/5 px-3 py-1 text-sm text-mist">#{tag}</li>)}
            </ul>
          ) : null}
        </header>
        {cover ? (
          <div className="container-x pb-12">
            <figure className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] bg-ink-3">
              <Image src={cover.src} unoptimized={cover.unoptimized} alt={post.coverAlt ?? ""} fill priority sizes="(min-width: 1216px) 1216px, 100vw" className="object-cover" />
            </figure>
          </div>
        ) : null}
        <div className="paper">
          <div className="container-x py-16 sm:py-20" lang="en">
            <Markdown source={post.content ?? ""} />
          </div>
        </div>
      </article>
      <CtaBand title={t("blog.ctaTitle")} track="blog_post_cta" />
      <JsonLd
        data={{
          ...articleJsonLd({
            type: "BlogPosting",
            headline: post.title,
            description: post.excerpt ?? "",
            url: localeUrl("en", `/blog/${canonicalSlug}`),
            image: cover?.src,
            author,
            datePublished: date,
            dateModified: post.updatedAt,
          }),
          ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}),
          wordCount: (post.content ?? "").split(/\s+/).filter(Boolean).length,
        }}
      />
    </>
  );
}
