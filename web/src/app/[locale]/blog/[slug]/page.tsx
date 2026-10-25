import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaBand from "@/components/CtaBand";
import JsonLd from "@/components/JsonLd";
import { getBlogPost, getBlogPosts } from "@/lib/api";
import { authorName, blogSlug, idFromBlogSlug, readingMinutes } from "@/lib/blog";
import { articleJsonLd, localeUrl, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return routing.locales.flatMap((locale) => posts.map((p) => ({ locale, slug: blogSlug(p) })));
}

async function load(params: Props["params"]) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const id = idFromBlogSlug(decodeURIComponent(slug));
  const post = id ? await getBlogPost(id) : null;
  if (!post) notFound();
  return { locale, slug: decodeURIComponent(slug), post };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, post } = await load(params);
  return pageMetadata({
    locale,
    path: `/blog/${blogSlug(post)}`,
    title: post.title,
    description: (post.description ?? "").replace(/\s+/g, " ").slice(0, 158),
    type: "article",
    publishedTime: post.createdAt,
    modifiedTime: post.updatedAt,
    translated: false,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug, post } = await load(params);
  // Title changed since the link was shared: send readers and crawlers to the current URL.
  const canonicalSlug = blogSlug(post);
  if (slug !== canonicalSlug) permanentRedirect(`${locale === "en" ? "" : `/${locale}`}/blog/${canonicalSlug}`);

  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);
  const author = authorName(post.author);
  const url = localeUrl(locale, `/blog/${canonicalSlug}`);

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
          <p className="flex flex-wrap gap-x-4 text-mist">
            {author ? <span>{t("blog.by", { author })}</span> : null}
            {post.createdAt ? <time dateTime={post.createdAt}>{format.dateTime(new Date(post.createdAt), { dateStyle: "long" })}</time> : null}
            <span>{t("common.minRead", { minutes: readingMinutes(post.description) })}</span>
          </p>
        </header>
        <div className="paper">
          <div className="container-x py-16 sm:py-20">
            <div className="prose-x text-lg text-graphite" lang="en">
              {(post.description ?? "").split(/\n{2,}/).map((p, i) => <p key={i}>{p.trim()}</p>)}
            </div>
          </div>
        </div>
      </article>
      <CtaBand title={t("blog.ctaTitle")} track="blog_post_cta" />
      <JsonLd
        data={articleJsonLd({
          type: "BlogPosting",
          headline: post.title,
          description: (post.description ?? "").slice(0, 300),
          url: localeUrl("en", `/blog/${canonicalSlug}`),
          author,
          datePublished: post.createdAt,
          dateModified: post.updatedAt,
        })}
      />
    </>
  );
}
