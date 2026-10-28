# Website Builder — progress log (RESUME POINT)

> Start here in any new session. Read `PLAN.md` (approved plan), `DECISIONS.md`, then continue from the first
> unchecked item below. Update this file after every step: tick it, note files touched, and add open TODOs.

Branch: `feature/website-builder` (created from `phase-4-content-quality`). **Phase 1 complete; not committed yet** (owner to review & commit).

## Build order

- [x] 0. graphify graph + Obsidian vault (`graphify update .`, `graphify export obsidian --dir graphify-out/obsidian`)
- [x] E1. Elevora → Polara rename (web: route, mock, seo, messages, nav, footer, hero, sitemap, llms.txt, e2e, lighthouse) + redirect
- [x] E2. Velora product page + products index lists both
- [x] A1. Backend models: BuilderTemplate, BuilderAddon, BuilderPlan, BuilderOrder, Star
- [x] A2. `utils/builderQuote.ts` + unit tests
- [x] A3. Public builder routes (catalog, assets, orders, status) + `builder` lead source + emails
- [x] A4. Admin builder routes + `scripts/seed-builder.ts`
- [x] A5. Backend tests (`test/builder.test.ts`)
- [x] B. Admin pages (templates, add-ons, plans, orders, stars) + sidebar
- [x] C1. Nav item + landing page `/website-builder`
- [x] C2. Wizard (steps, preview, quote panel, submit) + messages EN/AR
- [x] A6. Payments adapter: Kashier, Polar, none + webhook + success page
- [x] D. Galaxy of Stars (model/API done in A1; migration script, component, placements)
- [x] F. e2e + mock API + Lighthouse URLs + DEPLOY.md env vars
- [x] G. Final docs pass (README, payments.md, galaxy.md, CLAUDE.md), graphify re-run

## Done log
(newest first — date, step, files, notes)

- 2026-10-28 **Go-live + country-first payments**
  - **Production catalog seeded** (`seed-builder.ts --apply` against the prod `DB_URI`): 4 plans, 13 add-ons, 18 templates.
  - `migrate-stars.ts`: production has no published case studies or testimonials with a company yet, so 0 stars were created. Add stars in the admin.
  - **Not deployed yet:** the API (pm2 `xaeon-api`, runs `backend/dist/app.js`) and the web (Vercel) still run the old code until this branch is merged, built and restarted.
  - Country-first wizard step, with currency derived from country on the server (`COUNTRY_MARKET`) and `order.country` stored.
  - The catalog returns `payments` per market, and `KASHIER_CURRENCIES`/`KASHIER_METHODS` are configurable. The review step shows the payment options; countries without a provider get the invoice flow.
  - The admin orders table shows the country.
  - Language switcher fixed: its accessible name now contains the visible text (Lighthouse `label-content-name-mismatch` cleared).
  - Tests: backend 52 pass; e2e **110/110** on 5 browsers; Lighthouse `/website-builder` 100×4 with no failing audits.

- 2026-10-28 **G docs** — `docs/website-builder/{README,DECISIONS,payments,galaxy}.md`, root `CLAUDE.md`, `web/DEPLOY.md`
  section; graphify graph + Obsidian vault regenerated.
- 2026-10-28 **F verification** — `web/e2e/builder.spec.ts` (9 tests) + builder/stars fixtures in `e2e/mock-api.mjs`:
  **105/105 e2e pass** on chromium, firefox, webkit, iPhone 13, Pixel 7. Lighthouse (desktop, mock data):
  `/website-builder`, `/ar/website-builder`, `/products/velora`, `/work`, `/` all 100/100/100/100.
  Added `/products/velora` and `/website-builder` to `lighthouserc.json`. Pre-existing a11y note: the language
  switcher's aria-label ("Switch to Arabic") doesn't contain its visible text ("العربية").
- 2026-10-28 **D galaxy** — `backend/scripts/migrate-stars.ts`; `web/src/lib/galaxy.ts` (deterministic layout),
  `components/galaxy/{Galaxy.tsx,Galaxy.module.css,GalaxySection.tsx}`; placed on home (after testimonials), `/work`
  (before CTA) and the builder page. Admin page `StarsPage.tsx`.
- 2026-10-28 **C web** — `app/[locale]/website-builder/page.tsx` (landing + wizard + plans + cross-sells + galaxy + FAQ),
  `website-builder/success/page.tsx`; `components/builder/{BuilderWizard,TemplatePreview,QuoteSummary,OrderStatus,icons}`;
  `lib/builder.ts` (types, `estimateQuote` mirror, colour contrast helpers); `getBuilderCatalog/getStars` in `lib/api.ts`;
  messages `builder.*`, `builderPage.*`, `galaxy.*` EN/AR; `trackLead("builder")`.
- 2026-10-28 **B admin** — `frontend/src/Pages/admin/Builder{Orders,Templates,Addons,Plans}Page.tsx`, `StarsPage.tsx`,
  `lib/builderAdmin.ts`, `Components/admin/builder/{BuilderFields,BuilderTabs}.tsx`; routes in `main.tsx`; sidebar
  entries; `SOURCE_LABELS.builder`. tsc + eslint clean.

- 2026-10-28 **A1–A6 backend** — models `backend/src/models/{builderShared,builderTemplate,builderAddon,builderPlan,builderOrder,star}.model.ts`;
  `utils/builderQuote.ts`; `controllers/{builder,builderAdmin,star}.controller.ts`; `routes/{builder,builderAdmin}.routes.ts`
  (mounted `/api/v1/builder`, `/api/v1/admin/builder`, `GET /api/v1/site/stars`); `services/builderEmails.ts`;
  `services/payments/{types,kashier,polar,index}.ts`; raw body captured for `/payments/` in `app.ts`; lead source `builder`
  added to `serviceRequest.model.ts`; `builderUploadLimiter`; seed `scripts/seed-builder.ts` + data `scripts/builderCatalogData.ts`.
  Tests `test/builder.test.ts`, `test/builderQuote.test.ts` — full suite green (51 passed) against a throwaway mongo:
  `docker run -d --rm -p 127.0.0.1:27018:27017 --name xaeon-test-mongo mongo:7` then
  `TEST_DB_URI=mongodb://127.0.0.1:27018/xaeon_test npx vitest run`.
- 2026-10-28 **E1/E2** — Elevora→Polara rename across web (route `products/polara`, `PolaraMock`, `POLARA_URL` still
  `https://elevora.xaeons.com`, `polaraJsonLd`, `polara.*` messages, e2e, lighthouserc) + 301 redirects in `web/next.config.ts`.
  New `products/velora/page.tsx`, `VeloraMock.tsx`, `veloraJsonLd`, `velora.*` messages EN/AR; products index lists both;
  nav "Products" → `/products`; nav + footer + sitemap entries for `/website-builder`; hero badge → builder.
- 2026-10-28 **0** — `graphify update .` + `graphify export obsidian --dir graphify-out/obsidian` (1659 nodes). `graphify-out/` gitignored.

## Next (phase 2 ideas)
- Deploy: merge branch → `cd backend && npm run build && pm2 restart xaeon-api` (+ worker/others if they share code) and push web to Vercel. Then add/publish real client stars in admin.
- Real template screenshots (`previewImageUrl`) per template, or richer preview layouts.
- Recurring subscription billing (Polar subscriptions or Kashier tokenised payments).
- Customer portal view of their builder order (frontend `/dashboard`).
- Multi-tenant platform per original plan (Cloudflare Workers/vinext, Puck, custom domains) using `BuilderOrder.config/brand`.

## Open TODOs / needs owner input
- Kashier (main provider): set `PAYMENT_PROVIDERS=kashier`, MID/API key, `KASHIER_CURRENCIES` (add AED if enabled), `KASHIER_METHODS`; confirm exact HPP hash format + webhook signature header against current Kashier docs; need sandbox MID/API key.
- Polar: decide if used (USD/international); needs access token + webhook secret.
- Polara public domain: `POLARA_URL` currently still points to the existing Elevora app URL.
- Velora + Polara marketing copy (EN/AR) drafted by Claude — needs owner review.
- Real template preview images / designs per category.
