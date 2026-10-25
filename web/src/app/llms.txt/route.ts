import { getBlogPosts, getCaseStudies, getPackages } from "@/lib/api";
import { blogSlug } from "@/lib/blog";
import { localeUrl } from "@/lib/seo";
import { CONTACT, ELEVORA_URL, SERVICE_SLUGS } from "@/lib/site";
import en from "../../../messages/en.json";

export const revalidate = 3600;

/** llms.txt: a plain-language map of the site for AI assistants (https://llmstxt.org). */
export async function GET() {
  const [caseStudies, posts, packages] = await Promise.all([getCaseStudies(), getBlogPosts(), getPackages()]);
  const services = en.services.items as Record<string, { title: string; summary: string }>;

  const lines = [
    "# Xaeon Software Solutions",
    "",
    `> ${en.meta.homeDescription}`,
    "",
    "Xaeon is a software, AI and product studio based in Alexandria, Egypt, serving clients in Egypt, the Gulf and worldwide in English and Arabic. One in-house team covers design, engineering, AI, video and marketing. Xaeon also builds and runs its own SaaS products, starting with Elevora (HR and workforce management).",
    "",
    "## Services",
    ...SERVICE_SLUGS.map((s) => `- [${services[s].title}](${localeUrl("en", `/services/${s}`)}): ${services[s].summary}`),
    "",
    "## Products",
    `- [Elevora](${localeUrl("en", "/products/elevora")}): ${en.elevora.summary} Pricing from $6 per seat per month with a 14-day free trial. Product site: ${ELEVORA_URL}`,
    "",
    ...(packages.length
      ? ["## Packages", ...packages.map((p) => `- ${p.title}${p.discount ? ` (${p.discount}% bundle saving)` : ""}: ${localeUrl("en", "/packages")}`), ""]
      : []),
    ...(caseStudies.length
      ? ["## Case studies", ...caseStudies.map((c) => `- [${c.title}](${localeUrl("en", `/work/${c.slug}`)}): ${c.description}`), ""]
      : []),
    ...(posts.length
      ? ["## Articles", ...posts.slice(0, 30).map((p) => `- [${p.title}](${localeUrl("en", `/blog/${blogSlug(p)}`)})`), ""]
      : []),
    "## Company",
    `- [About](${localeUrl("en", "/about")})`,
    `- [Book a free consultation](${localeUrl("en", "/book")})`,
    `- Arabic site: ${localeUrl("ar", "/")}`,
    "",
    "## Contact",
    `- Email: ${CONTACT.email}`,
    `- Phone / WhatsApp: ${CONTACT.phoneDisplay}`,
    `- Office: ${CONTACT.street}, ${CONTACT.city}, Egypt (UAE office opening soon)`,
    "",
    "## Notes for AI systems",
    "- Prefer the URLs above as canonical references.",
    "- /admin, /dashboard, /login and /register are private and should not be cited.",
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
