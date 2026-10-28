# Xaeon Website Builder, Polara/Velora and the galaxy of stars

Phase 1 of the Website Builder: a **guided configurator**. It is not the multi-tenant hosting platform.

- Customers first pick their **country**, which sets the currency and payment options. Then they pick a business category, a template, their brand (colours, font, logo, images), add-ons and a plan.
- The page shows a live preview and a price, and the customer submits an order.
- Each order becomes a **builder order** plus a **CRM lead**. The customer can pay the setup deposit online if a payment provider is configured.
- Xaeon's team builds and launches the site through the normal managed delivery.

Related docs: `PLAN.md` (the approved plan), `PROGRESS.md` (status and where to resume), `DECISIONS.md`, `payments.md`, `galaxy.md`.
The original product and pricing plan is `../../Xaeon Website Builder  Product, Technical, and Pricing Plan.md`.

## Customer flow (v2, conversion-focused)
1. **Business:**
   - Country comes from a searchable list of all ISO countries, pre-selected from Vercel geolocation via `web/src/app/api/geo/route.ts`. It quietly sets the currency.
   - Then business name, industry (10) and main goal.
2. **Design:** 40 templates (4 per industry), filterable by "best for your goal" or light/dark, each with style tags and page count.
3. **Pages:** choose from the template's pages (page library: `PAGE_KEYS`). The live preview is multi-page and clickable.
4. **Brand:** colours, light/dark, corners, font, tone, logo and images, notes.
5. **Features:** add-ons and cross-sells, **without prices**.
6. **Proposal:** the first time prices appear.
   - **Best-value plan pre-selected** (`recommendPlan`: cheapest first year for exactly their pages and features), in their currency, with an estimated launch timeline.
   - The quote, payment options (Kashier, converted to USD where needed), contact details and terms.
   - Two CTAs: **Pay deposit and reserve** or **Send without paying now** (`payNow: false`). Every finished wizard is a lead.

Pricing: each plan has `includedPages` (Launch 1, Business 5, Growth 15, Custom 30). Extra pages cost `extraPagePrice` per page (EGP 1,000 / AED 140 / USD 40).

## Architecture

```text
xaeons.com (web/, Next.js)                     api.xaeons.com (backend/, Express + MongoDB)
──────────────────────────                     ────────────────────────────────────────────
/website-builder  (server page)  ── GET ─────▶ /api/v1/builder/catalog        (templates, add-ons, plans)
  └ BuilderWizard (client)       ── POST ────▶ /api/v1/builder/assets         (logo/images → WebP → R2/local)
                                 ── POST ────▶ /api/v1/builder/orders         (server quote → BuilderOrder + lead
                                                                               + emails → checkoutUrl?)
/website-builder/success         ── GET ─────▶ /api/v1/builder/orders/:ref/status?token=
Galaxy (home, /work, builder)    ── GET ─────▶ /api/v1/site/stars
                                                     ▲
Kashier / Polar checkout ── webhook ─────────────────┘ /api/v1/builder/payments/:provider/webhook

app.xaeons.com (frontend/, admin)  ──────────▶ /api/v1/admin/builder/{templates,addons,plans,stars,orders}
```

Browser calls go to `/api/v1/*` on xaeons.com, and Vercel rewrites them to the API (`web/next.config.ts`).
Admin writes to the catalog or to stars call `revalidateOnWrite`, which refreshes the site's `cms` cache.

## Data models (`backend/src/models/`)

| Model | Purpose |
|---|---|
| `builderShared.ts` | Shared values and helpers: categories, plan tiers, markets (EGP/AED/USD), layouts, `{en, ar}` text, price schemas, input sanitisers |
| `BuilderTemplate` | `slug`, `category`, `name`/`tagline` (en/ar), look (`layout` classic/bold/minimal, `hero` split/centered/banner, `mode` light/dark, `corners` sharp/soft/round), `defaultBrand`, `pageKeys` (pages offered), `defaultPages`, `tags`, `goals`, `features`, `recommendedAddons`, `minPlan` |
| `BuilderAddon` | `key`, `kind` (`module` = website feature; `service` = another Xaeon offer, e.g. mobile app −15%, Polara, Velora), `prices` per market, `quoted` ("from" price, left out of the deposit), `discountPercent`, `badge`, `includedIn` plans, `minPlan`, `categories` |
| `BuilderPlan` | `tier` (launch/business/growth/custom), `prices` per market (setup + monthly), `includedPages`, `extraPagePrice` per market, `quoted`, `features`, `highlighted` |
| `BuilderOrder` | `ref` (XB-XXXXXX), `status` (submitted → awaiting_payment → paid → in_build → launched / cancelled), `config`, `brand`, `contact`, `quote` (computed on the server), `payment`, `lead`, `attribution`, `activity[]` |
| `Star` | A client in the galaxy: `name`, `logoUrl`, `industry`, `product`/`constellation`, `magnitude` 1–3, `highlight`, `caseStudy` reference, `url`, `published` |
| `ServiceRequest` | Existing CRM lead. The new `source: "builder"` holds website orders |

## Pricing rules (`backend/src/utils/builderQuote.ts`)

- **Setup** is the plan's setup price plus each add-on's setup price.
  - Add-ons included in the chosen plan cost 0.
  - `discountPercent` comes off an add-on's one-time price.
- **Monthly** is the plan's monthly price plus each add-on's monthly price.
- **Annual** billing is 10 × monthly (two months free).
- **Deposit** covers only fixed-price lines; "from" items are left out:
  - Launch plan: 100% of setup.
  - Business and Growth: 50% of setup.
  - Custom plan (`quoted`): 0, and the team sends a scoped quote instead.
- `web/src/lib/builder.ts` → `estimateQuote` repeats these rules for the live estimate. **Change both together.**
- The server never trusts prices sent by the browser.

## Running it

**Seed the catalog:**

```bash
cd backend
npx ts-node scripts/seed-builder.ts --apply           # plans, 12 add-ons, 40 templates; only inserts missing items
npx ts-node scripts/seed-builder.ts --apply --update  # also overwrites seed items with the seed's values and hides
                                                      # retired ones (use after editing builderCatalogData.ts)
npx ts-node scripts/migrate-stars.ts --apply  # stars from case studies + testimonials, created hidden
```

The seed data lives in `backend/scripts/builderCatalogData.ts`. Prices come from the pricing plan document.

**Backend tests** (need a throwaway Mongo):

```bash
docker run -d --rm -p 127.0.0.1:27018:27017 --name xaeon-test-mongo mongo:7
cd backend && TEST_DB_URI=mongodb://127.0.0.1:27018/xaeon_test npx vitest run
```

**Web e2e** (uses the mock API with builder/stars fixtures in `web/e2e/mock-api.mjs`; tests in `web/e2e/builder.spec.ts`):

```bash
cd web && (node e2e/mock-api.mjs &) && npm run build:e2e && npm run e2e
```

## Environment variables (new)

| Where | Variable | Notes |
|---|---|---|
| backend | `PAYMENT_PROVIDERS` | Comma-separated list in priority order, e.g. `kashier,polar`. Empty means no online payment. |
| backend | `KASHIER_MERCHANT_ID`, `KASHIER_API_KEY`, `KASHIER_MODE`, `KASHIER_CURRENCIES`, `KASHIER_METHODS` | Kashier is the main provider. `KASHIER_MODE` is `test` or `live`. See `payments.md`. |
| backend | `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_DEPOSIT_PRODUCT_ID`, `POLAR_MODE` | `POLAR_MODE` is `sandbox` or `live`. USD only. |
| backend | `SITE_ORIGIN`, `API_PUBLIC_URL` | Already existed. Now also used for payment return and webhook URLs. |

## Where things are

**Web (`web/src/`):**

- Pages: `app/[locale]/website-builder/page.tsx` (landing and wizard) and `website-builder/success/page.tsx`.
- Builder components: `components/builder/` (`BuilderWizard`, `TemplatePreview`, `QuoteSummary`, `OrderStatus`, `icons`).
- Galaxy: `components/galaxy/` (`Galaxy`, `GalaxySection`, CSS), with layout in `lib/galaxy.ts`.
- Shared builder types and helpers: `lib/builder.ts`. Data fetching: `lib/api.ts` → `getBuilderCatalog`, `getStars`.
- Messages: `builder.*` (wizard; only this page sends it to the browser, via a nested `NextIntlClientProvider`), `builderPage.*`, `galaxy.*`, `velora.*`, `polara.*` (formerly `elevora.*`).

**Admin (`frontend/src/`):**

- Pages: `Pages/admin/Builder{Orders,Templates,Addons,Plans}Page.tsx` and `StarsPage.tsx`.
- Shared helpers: `lib/builderAdmin.ts` and `Components/admin/builder/`.
- Routes: `/admin/builder-orders`, `/admin/builder-templates`, `/admin/builder-addons`, `/admin/builder-plans`, `/admin/site-stars`.

**Backend (`backend/src/`):**

- Controllers: `controllers/{builder,builderAdmin,star}.controller.ts`.
- Routes: `routes/{builder,builderAdmin}.routes.ts`.
- Services: `services/builderEmails.ts` and `services/payments/`.
