import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CtaBand from "@/components/CtaBand";
import SectionHeading from "@/components/SectionHeading";
import { getBlogPosts } from "@/lib/api";
import { authorName, blogSlug, readingMinutes } from "@/lib/blog";
import { resolveLocale, type LocaleParams } from "@/lib/page";
import { localeUrl, pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "blog" });
  return pageMetadata({ locale, path: "/blog", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function BlogPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const [t, format, posts] = await Promise.all([getTranslations(), getFormatter(), getBlogPosts()]);

  return (
    <>
      <section className="container-x flex flex-col gap-8 pb-12 pt-12 sm:pt-16">
        <Breadcrumbs
          items={[
            { name: t("common.breadcrumbHome"), href: "/", url: localeUrl(locale, "/") },
            { name: t("nav.blog"), href: "/blog", url: localeUrl(locale, "/blog") },
          ]}
        />
        <SectionHeading as="h1" eyebrow={t("blog.eyebrow")} title={t("blog.title")} intro={t("blog.intro")} />
      </section>

      <section className="container-x pb-8" aria-label={t("nav.blog")}>
        {posts.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-line p-8 text-mist">{t("blog.empty")}</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const author = authorName(post.author);
              return (
                <li key={post._id} data-reveal>
                  <Link href={`/blog/${blogSlug(post)}`} className="group flex h-full flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-ink-2 p-7 transition-colors hover:border-sage/50">
                    <p className="flex flex-wrap gap-x-3 text-sm text-haze">
                      {post.createdAt ? (
                        <time dateTime={post.createdAt}>{format.dateTime(new Date(post.createdAt), { dateStyle: "medium" })}</time>
                      ) : null}
                      <span>{t("common.minRead", { minutes: readingMinutes(post.description) })}</span>
                    </p>
                    <h2 className="font-display text-xl font-semibold text-fog group-hover:underline underline-offset-4" lang="en">{post.title}</h2>
                    <p className="line-clamp-3 text-mist" lang="en">{post.description}</p>
                    <p className="mt-auto text-sm text-mist">
                      {author ? t("blog.by", { author }) : null} <span className="font-semibold text-sage">{t("common.readArticle")}</span>
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CtaBand track="blog_cta" />
    </>
  );
}
