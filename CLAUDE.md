# Xaeon website — repo guide

**Ongoing work:** the Website Builder, Polara/Velora and the galaxy of stars. Resume from `docs/website-builder/PROGRESS.md`.

## Apps
| Folder | What | Stack | Commands |
|---|---|---|---|
| `web/` | Public site, xaeons.com (EN at `/`, AR at `/ar`) | Next.js 16, next-intl, Tailwind 4 (tokens in `src/app/globals.css` `@theme`) | `npm run build`, `npm run typecheck`, e2e: `(node e2e/mock-api.mjs &) && npm run build:e2e && npm run e2e` |
| `backend/` | API, api.xaeons.com, mounted at `/api/v1/*` | Express 5, Mongoose, Resend, sharp, S3/R2 or local uploads | `npm run dev`, `npm run typecheck`, `TEST_DB_URI=mongodb://127.0.0.1:27018/xaeon_test npx vitest run` (start mongo:7 in Docker first) |
| `frontend/` | Admin, CRM and client portal, app.xaeons.com | Vite, React 19, react-router 7, react-hook-form + zod | `npx tsc -p tsconfig.app.json --noEmit`, `npx eslint src` |

## Conventions
- **web**
  - Every visible string is in `web/messages/{en,ar}.json`, and the two files must keep identical keys.
  - Only the namespaces listed in `CLIENT_NAMESPACES` (in `[locale]/layout.tsx`) are sent to the browser. Page-specific client strings use a nested `NextIntlClientProvider` instead (see `website-builder/page.tsx`).
  - Server data comes from `web/src/lib/api.ts` (`getJson`: 300 s ISR, `cms` tag, falls back to empty on error). The browser posts to relative `/api/v1/*` paths, which are rewritten to the API.
  - Lighthouse budgets (`web/lighthouserc.json`): performance ≥ 0.9, accessibility ≥ 0.95, SEO = 1. Avoid heavy client libraries.
- **backend**
  - Controllers whitelist fields (no mass assignment), and admin routes use `requireAuth, requireAdmin`.
  - Routers for CMS content use `revalidateOnWrite`, so the site refreshes after admin edits.
  - Public forms use `publicFormLimiter` and `honeypot`.
  - Tests mock `services/email`.
- **frontend admin pages**
  - `export function Component()`, built with `useResourceApi(endpoint, listKey, entityKey)`, `DataTable` and `FormModal`.
  - Register each page in `src/main.tsx` and in `Components/admin/AdminSidebar.tsx`.
- **Products:** the HR product is **Polara** (formerly Elevora; its app still runs at elevora.xaeons.com). The clinic system is **Velora**.
- **Knowledge graph:** run `graphify update .` and then `graphify export obsidian --dir graphify-out/obsidian`. The output (`graphify-out/`) is gitignored.
