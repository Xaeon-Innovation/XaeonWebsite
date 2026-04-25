import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { buildRoutesToPrerender } from "./prerenderRoutes.mjs";

const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://xaeons.com").replace(/\/+$/, "");
const DIST_DIR = path.resolve(process.cwd(), "dist");

function toAbsoluteUrl(routePathname) {
  if (routePathname === "/") return `${SITE_ORIGIN}/`;
  const clean = routePathname.replace(/^\//, "").replace(/\/$/, "");
  return `${SITE_ORIGIN}/${clean}/`;
}

function buildSitemapXml({ urls }) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((loc) => {
        return (
          `  <url>\n` +
          `    <loc>${loc}</loc>\n` +
          `    <lastmod>${now}</lastmod>\n` +
          `  </url>\n`
        );
      })
      .join("") +
    `</urlset>\n`;
}

function buildRobotsTxt() {
  // Keep it simple + deterministic.
  // We disallow private areas and provide the sitemap location.
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "Disallow: /dashboard",
    "Disallow: /dashboard/",
    "",
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}

async function main() {
  await mkdir(DIST_DIR, { recursive: true });

  const publicRoutes = buildRoutesToPrerender()
    // Exclude auth/private routes explicitly (even if someone adds them later)
    .filter((r) => !r.startsWith("/admin"))
    .filter((r) => !r.startsWith("/dashboard"));

  const urls = publicRoutes.map(toAbsoluteUrl);

  const sitemapXml = buildSitemapXml({ urls });
  const robotsTxt = buildRobotsTxt();

  await writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemapXml, "utf8");
  await writeFile(path.join(DIST_DIR, "robots.txt"), robotsTxt, "utf8");

  // eslint-disable-next-line no-console
  console.log(`[seo] wrote sitemap.xml (${urls.length} URLs) + robots.txt`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seo] failed:", err);
  process.exit(1);
});

