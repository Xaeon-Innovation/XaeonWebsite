# Deploying the new public site (xaeons.com)

The public site is the Next.js app in `web/`. The existing Vite app in `frontend/` keeps the
admin panel and client portal and moves to `app.xaeons.com`. The Express API is unchanged.

## 1. Admin / client portal → app.xaeons.com
1. In Vercel, on the existing frontend project, add the domain `app.xaeons.com`.
2. Add the env var `VITE_PUBLIC_SITE_ORIGIN=https://xaeons.com` to that project and redeploy.
   Public pages on app.xaeons.com then redirect to xaeons.com and the host is not indexed.
   Also set `ENABLE_PRERENDER=false` there (the app no longer needs prerendering).
3. On the API server, set `FRONTEND_URL=https://app.xaeons.com` in `backend/.env`
   (`CORS_ORIGIN` already includes `https://app.xaeons.com`), then `pm2 restart xaeon-api`.
4. In Google Cloud Console, add `https://app.xaeons.com` to the OAuth client if it lists origins,
   then reconnect Google Calendar from Admin → Bookings.

## 2. New public site → xaeons.com
1. Create a new Vercel project from this repo with **Root Directory = `web`** (framework: Next.js).
2. Environment variables (Production):
   - `API_ORIGIN=https://api.xaeons.com`
   - `NEXT_PUBLIC_SITE_ORIGIN=https://xaeons.com`
   - `NEXT_PUBLIC_APP_ORIGIN=https://app.xaeons.com`
   - `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID` (optional; no tracking without them)
3. Deploy, check the preview URL, then move the `xaeons.com` and `www.xaeons.com` domains from the
   old project to this one (redirect `www` → apex).
4. Disable the old `vercel-prebuilt-prod.yml` workflow or point it at app.xaeons.com only, so it
   doesn't redeploy the old site onto xaeons.com.

## 3. After cutover
- Old URLs redirect permanently: `/about-us` → `/about`, `/our-work` → `/work`, `/book-now` → `/book`,
  `/case-studies/:slug` → `/work/:slug`. `/login`, `/register`, `/dashboard`, `/admin` go to app.xaeons.com.
- Submit `https://xaeons.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Check `https://xaeons.com/robots.txt` and `https://xaeons.com/llms.txt`.
- Validate a few pages in Google's Rich Results Test (Organization, Service, SoftwareApplication, FAQ).

## Content
- UI text lives in `web/messages/en.json` and `web/messages/ar.json` (keep the keys in sync).
- Case studies, blog posts, packages, team and testimonials come from the admin CMS and refresh
  on the site within 5 minutes. CMS content is English-only for now.

## Phase 3 (CRM) — one-time steps on the API server
1. Deploy the backend (`npm run build` is already committed in `dist/`), then add to `backend/.env`:
   - `APP_URL=https://app.xaeons.com` (where invite links point; use `https://xaeons.com` until the
     app subdomain is live)
   - optional `RESEND_REPLY_TO=info@xaeons.com` (where client replies to admin emails land)
2. Migrate existing requests into the pipeline (safe to run twice; dry run first):
   ```
   cd backend
   npx ts-node --transpile-only scripts/migrate-leads.ts          # shows what will change
   npx ts-node --transpile-only scripts/migrate-leads.ts --apply
   ```
3. `pm2 restart xaeon-api`. The daily follow-up digest is emailed to `BOOKING_NOTIFY_EMAILS` after
   08:00 Cairo time (set `DISABLE_JOBS=true` to turn it off).
4. Redeploy the admin (frontend) and the public site (web) so forms send the visitor's language.
