# SEO / Indexing checklist (post-deploy)

## 1) Verify crawl entry points
- `https://xaeons.com/robots.txt` loads and includes `Sitemap: https://xaeons.com/sitemap.xml`
- `https://xaeons.com/sitemap.xml` loads and lists all key routes (and service pages)
- `https://xaeons.com/llms.txt` loads

## 2) Search Console + Bing Webmaster Tools
- Add property for `xaeons.com` (Domain property is preferred)
- Verify ownership (DNS TXT or your preferred method)
- Submit sitemap: `https://xaeons.com/sitemap.xml`
- Check Coverage / Pages → ensure key routes are being discovered and indexed

## 3) Validate page HTML (critical for prerender)
Pick a few URLs and view source / fetch as Googlebot:
- `/` and `/services/`
- One service detail page, e.g. `/services/ai-solutions/`

Confirm in the initial HTML (not just after JS):
- `<title>` is correct
- `<meta name="description">` exists
- `<link rel="canonical">` exists
- `application/ld+json` scripts exist

## 4) Rich results / schema validation
- Run Google Rich Results Test against:
  - `/` (Organization + WebSite)
  - `/services/ai-solutions/` (Service schema)
- Fix any warnings that are actionable (missing logo/social URLs, etc.)

## 5) Performance basics
- Run Lighthouse on `/` and `/services/`
- If LCP is high, prioritize image optimization and reduce large JS bundle warnings (code splitting)

## 6) Indexing nudges
- Request indexing for `/`, `/services/`, and 2–3 top service pages
- Track queries in Search Console → Performance → Queries

