# Xaeon Website Builder, Polara/Velora and the galaxy of stars

Phase 1 of the Website Builder: a **guided configurator**. It is not the multi-tenant hosting platform.

- Customers first pick their **country**, which sets the currency and payment options. Then they pick a business category, a template, their brand (colours, font, logo, images), add-ons and a plan.
- The page shows a live preview and a price, and the customer submits an order.
- Each order becomes a **builder order** plus a **CRM lead**. The customer can pay the setup deposit online if a payment provider is configured.
- Xaeon's team builds and launches the site through the normal managed delivery.

Related docs: `PLAN.md` (the approved plan), `PROGRESS.md` (status and where to resume), `DECISIONS.md`, `payments.md`, `galaxy.md`.
The original product and pricing plan is `../../Xaeon Website Builder  Product, Technical, and Pricing Plan.md`.

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
| `BuilderTemplate` | `slug`, `category`, `name`/`tagline` (en/ar), `layout` (classic/bold/minimal; drives the live preview), `defaultBrand`, `pages`, `features`, `recommendedAddons`, `minPlan` |
| `BuilderAddon` | `key`, `kind` (`module` = website feature; `service` = another Xaeon offer, e.g. mobile app −15%, Polara, Velora), `prices` per market, `quoted` ("from" price, left out of the deposit), `discountPercent`, `badge`, `includedIn` plans, `minPlan`, `categories` |
| `BuilderPlan` | `tier` (launch/business/growth/custom), `prices` per market (setup + monthly), `quoted`, `features`, `highlighted` |
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
npx ts-node scripts/seed-builder.ts --apply   # plans, 13 add-ons, 18 templates
                                               # inserts only missing items; never overwrites admin edits
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
