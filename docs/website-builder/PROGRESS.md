# Website Builder — progress log (RESUME POINT)

> Start here in any new session. Read `PLAN.md` (approved plan), `DECISIONS.md`, then continue from the first
> unchecked item below. Update this file after every step: tick it, note files touched, and add open TODOs.

Branch: `feature/website-builder`, fast-forwarded into `main`. **Phase 1 is LIVE** (deployed 2026-10-28, commit b9272ab).

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

- 2026-10-28 **v2 + USD conversion deployed**
  - API rebuilt and restarted. The previous `dist` is backed up in the session scratchpad.
  - Production catalog updated: 40 templates, 4 plans with page allowances, 12 add-ons; `extra-pages` hidden.
  - `main` pushed, Vercel deployed, cache revalidated.
  - Live smoke test, with no order placed:
    - geo pre-selects the country;
    - 4 Beauty templates show;
    - the proposal recommends Launch with a "Pay EGP 19,500 deposit" button;
    - no page errors.
  - **Notes:**
    - `backend/dist` is tracked in git: commit it after `npm run build`, or `git checkout main` refuses.
    - `getBuilderCatalog()` now fills defaults, so a deploy in either order can't break the wizard.

- 2026-10-28 **Wizard v2 (conversion-focused)**: see DECISIONS #11.
  - **Backend:**
    - `builderShared` gains all ISO `COUNTRIES` with `marketFor()`, 10 industries, `PAGE_KEYS`, and the style values (hero, mode, corners).
    - Templates get style, `pageKeys`, `defaultPages`, `tags` and `goals`. Plans get `includedPages` and `extraPagePrice`.
    - Orders store `config.pages`, `brand.mode` and `brand.corners`, and accept `payNow: false`. The quote prices extra pages.
    - Seed data now has 40 templates; `seed-builder.ts --update` was added.
  - **Admin:** template, plan and order pages show the new fields.
  - **Web:**
    - `CountrySelect` (searchable combobox), `/api/geo`, and the rewritten `BuilderWizard` (6 steps, prices only on the proposal).
    - Rewritten `TemplatePreview` (18 page renderers; hero, mode and corners; clickable pages), `recommendPlan()`.
    - The landing page's plans no longer show prices. New `builder.*` copy in EN/AR.
  - **Fixes found by screenshots:**
    - The preview label showed a raw message key.
    - Arriving at the proposal triggered validation, because React reused the "See my proposal" button as the submit button. Distinct keys fix it.
    - The terms links never rendered (rich-text tags).
    - Country search ranking.
  - **Results:** backend 57 pass, e2e 110/110, Lighthouse `/website-builder` EN/AR 100×4.
  - **Deployed 2026-10-28** (main 729b426). Order followed:
    1. Merge to `main` and push.
    2. Run `cd backend && npm run build && pm2 restart xaeon-api --update-env`.
    3. Run `npx ts-node scripts/seed-builder.ts --apply --update` (adds 22 templates, updates 18 plus plans and add-ons, hides `extra-pages`).
    4. Revalidate the web cache.

- 2026-10-28 **Currency conversion for non-EGP countries** (per Kashier: charges EGP/USD/GBP/EUR only)
  - Code: `services/payments/fx.ts` (Kashier rate endpoint, 1h cache, Gulf peg fallback); `paymentPlan()` (direct or convert to USD); `order.payment.{currency,rate}`; webhook amount/currency check.
  - Website: "≈ $X" in the quote and the review step.
  - Test config now blanks every payment env, so `.env` keys never reach tests.
  - Results: backend 54 pass, e2e 110/110.
  - **Committed to the feature branch; deploy pending owner OK.**
  - To activate: Kashier must enable USD, then set `KASHIER_CURRENCIES=EGP,USD`.

- 2026-10-28 **Kashier test mode on (production)**
  - The owner set `PAYMENT_PROVIDERS=kashier`, MID, Payment API key, `KASHIER_MODE=test`, `KASHIER_CURRENCIES=EGP` and `KASHIER_METHODS=card,wallet` in `backend/.env`. The secret key isn't needed.
  - API restarted and the site cache revalidated. The live catalog returns `EGP: kashier card,wallet`.
  - A dry-run checkout link (no order created) opened Kashier's HPP: "Xaeon TEST MODE, 10.00 EGP, Card / Wallet". The MID and hash are accepted.
  - **Still to verify:** a real test payment and its webhook. Claude wasn't permitted to create a production order, so the owner places one in the browser.
  - ⚠️ While `KASHIER_MODE=test`, real Egyptian customers reach the test checkout. Switch to live keys or unset `PAYMENT_PROVIDERS` before launch.

- 2026-10-28 **Deployed**
  - API: `cd backend && npm run build && pm2 restart xaeon-api --update-env`; the previous `dist` was backed up first.
  - Verified `https://api.xaeons.com/api/v1/builder/catalog` returns 200 with 18 templates, 13 add-ons and 4 plans.
  - Web and admin: pushed `main`, which Vercel built. `xaeons.com/website-builder` (EN/AR), `/products/velora` and `/products/polara` all return 200, `/products/elevora` returns 308 to Polara, and the app.xaeons.com bundle contains the builder admin routes.
  - Payments are still in invoice mode everywhere (no `PAYMENT_PROVIDERS` set).

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
- Redeploy recipe: merge to `main` + push (Vercel: web + admin); API: `cd backend && npm run build && pm2 restart xaeon-api --update-env`. Add/publish real client stars in admin.
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
