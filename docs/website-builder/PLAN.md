# Xaeon Website Builder + Polara/Velora + Galaxy of Stars

## Context
Xaeon wants to sell productized websites (see `Xaeon Website Builder  Product, Technical, and Pricing Plan.md`).
This phase is the **configurator**. It adds a new "Website Builder" header page with a wizard:
category → template → branding (with logo and identity uploads) → add-ons and cross-sells → plan.
It shows a live branded preview and a server-computed quote. Submitting creates a **builder order** and a CRM lead. The customer then pays the deposit online through a pluggable payment provider (**Kashier** first, **Polar** as an option). If no provider is configured, it falls back to "we'll send a payment link".
The multi-tenant hosting platform (Cloudflare Workers, Puck, custom domains) is deferred.

Same phase:
- Rename the HR product **Elevora → Polara**.
- Add the clinic product **Velora**.
- Showcase clients and case studies as an interactive **"Galaxy of Stars"**, with the call to action "Join our galaxy".

Current stack:
- `web/`: Next 16, next-intl EN/AR, Tailwind 4 `@theme` tokens. No form or animation libraries.
- `backend/`: Express 5, Mongoose, Resend, sharp, S3/R2-or-local storage, vitest+supertest.
- `frontend/`: Vite admin with react-hook-form, zod, `useResourceApi`, `FormModal`, `DataTable`.

## Step 0: Codebase graph and Obsidian vault
- `graphify update .` from the repo root (AST only, no LLM), then `graphify export obsidian --dir graphify-out/obsidian`.
- Add `graphify-out/` to `.gitignore`.
- Use `graphify god-nodes`, `graphify affected "Elevora"` and similar to confirm the touch-lists below before editing.

## Part A: Backend (`backend/src`)

**Models** (new, following the `testimonial.model.ts` pattern: `sortOrder`, `published`, index `{published, sortOrder}`). Bilingual text fields are stored as `{en, ar}`.
- `builderTemplate.model.ts`: `slug`, `category` (enum of the 6 verticals: clinics, education, professional, restaurants, home-services, catalogue), `name`, `tagline`, `previewImageUrl`, `layout` (`classic | bold | minimal`, which drives the preview renderer), `defaultBrand {primary, accent, font}`, `pages`, `features[]`, `recommendedAddons[]`, `minPlan`.
- `builderAddon.model.ts`:
  - Core fields: `key`, `kind` (`module | service`), `name`, `description`, `icon`, `prices {EGP, AED, USD}: {setup, monthly}`, `minPlan?`, `categories[]` (where it is suggested).
  - Cross-sell fields: `discountPercent?` and `badge?`.
  - `kind: "service"` covers cross-sells such as "Add a mobile app, 15% off when bundled", "Polara HR" and "Velora clinic system".
- `builderPlan.model.ts`: `tier` (launch/business/growth/custom), `prices {EGP, AED, USD}: {setup, monthly}`, `features[]`, `highlighted`.
  - The plan doc's prices are seeded through `scripts/seed-builder.ts`, along with 6 categories × 3 templates and the add-on menu.
- `builderOrder.model.ts`:
  - Identity and contents: `ref` (e.g. `XB-24A7F`), `status` (`submitted → awaiting_payment → paid → in_build → launched | cancelled`), `market` (`EGP|AED|USD`), `locale`, `config {category, templateSlug, planTier, addonKeys[], billing: monthly|annual}`.
  - Brand: `{businessName, primary, accent, font, tone, logoUrl, assetUrls[], notes}`.
  - Contact and quote: `contact {name, email, phone, company}`, `quote {setup, monthly, discounts[], deposit, currency}`. The quote is computed on the server and never trusted from the client.
  - Payment: `payment {provider, sessionId, status, paidAt, raw?}`.
  - Links and tracking: `lead` (ref ServiceRequest), `attribution`, `activity[]`.

**Shared logic**
- `utils/builderQuote.ts`: `computeQuote(config, catalog, market)`.
  - Totals are plan plus add-ons. Bundle discounts apply to service add-ons, and annual billing makes two months free.
  - The deposit is 50% of setup, or 100% for the Launch plan.
  - Unit tests in `test/builderQuote.test.ts`.
- Add `"builder"` to the `ServiceRequest.source` enum (`serviceRequest.model.ts`) and to the lead stats and labels.
  - Each order creates a lead (interest = template + plan, `value` = setup total, `currency`), so it shows up in the existing CRM, staff notification and digest.
  - Reuse `parseAttribution`, `sendEnquiryNotice`, and the `leadEmails.ts` EN/AR auto-reply (add a builder variant with the order ref and summary).

**Routes**
- `routes/builder.routes.ts` (public):
  - `GET /builder/catalog`: published templates, add-ons and plans in one payload, behind the 300s web cache.
  - `POST /builder/assets`: `publicFormLimiter`, max 3 files, image or SVG only (rasterised via the existing `processSiteImage` path with a new `brand` kind). Stored under the `builder/` key prefix through `services/storage.ts` `putObject`; returns `{url}`.
  - `POST /builder/orders`: `publicFormLimiter` + `honeypot`. Validates, computes the quote, creates the order and lead, sends emails. If a provider is configured, it creates a payment session and returns `{ref, checkoutUrl?}`.
  - `GET /builder/orders/:ref/status`: minimal public status for the return page; only the ref plus a signed token gets in.
  - `POST /builder/payments/:provider/webhook`: signature-verified; marks the order paid, logs activity, and moves the lead to `won`/`proposal`.
- `routes/builderAdmin.routes.ts`: admin CRUD for templates, add-ons and plans with `revalidateOnWrite`; orders list, detail and status `PATCH`. Mount both in `app.ts`.

**Payments** (`services/payments/`)
- `types.ts`: `PaymentProvider { createCheckout(order): {sessionId, url}; verifyWebhook(req): {orderRef, status} }`.
- `kashier.ts`: hosted payment page URL with an HMAC-SHA256 order hash (merchant ID + API key); the webhook verifies Kashier's signature header. Confirm the exact hash and webhook spec against Kashier docs during implementation.
- `polar.ts`: Polar checkout-session API plus Standard-Webhooks signature verification. Works for international USD and can later handle recurring subscriptions.
- `index.ts`: selects the provider from `PAYMENT_PROVIDER` (`kashier|polar|none`). New env vars: `KASHIER_MERCHANT_ID`, `KASHIER_API_KEY`, `KASHIER_MODE`, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`.
- This phase charges only the setup deposit; subscriptions stay manual.

**Tests**: `test/builder.test.ts`, following `crm.test.ts` (mocked email). It covers:
- Catalog only returns published items.
- The order's quote ignores client-sent prices.
- A lead is created with source `builder`.
- Webhook signature rejection and acceptance.
- Upload type and size rejection.

## Part B: Admin (`frontend/src`)
Follow `Pages/admin/TestimonialsPage.tsx` (`useResourceApi`, zod, `FormModal`, `DataTable`, `uploadSiteAsset`):
- `BuilderTemplatesPage.tsx`, `BuilderAddonsPage.tsx`, `BuilderPlansPage.tsx`: CRUD with EN/AR fields and price grids.
- `BuilderOrdersPage.tsx`:
  - The table filters by status.
  - The detail drawer shows config, brand swatches, downloadable assets, quote, payment state and a link to the lead.
  - Staff can change the status or mark an order paid manually.
- `StarsPage.tsx` (Part D).
- Register the routes in `main.tsx` and add the pages to `NAV_ITEMS` in `Components/admin/AdminSidebar.tsx`.

## Part C: Public site (`web/src`)

**Navigation**
- `components/Header.tsx` `NAV_ITEMS`:
  - Add `{ href: "/website-builder", key: "websiteBuilder" }`.
  - Change Products to `/products`, which now lists Polara and Velora.
- Messages: `nav.websiteBuilder` in `messages/en.json` and `ar.json` ("Website Builder" / "منشئ المواقع"), with a small "New" pill.
- Also add the page to `Footer.tsx` and to `STATIC_PATHS` in `app/sitemap.ts`.
- Check that the header fits at the `lg` breakpoint with 7 items.

**`app/[locale]/website-builder/page.tsx`** (server component, landing)
- Hero: "Choose a proven website. Make it yours. Launch with Xaeon.", using `LazyStarfield` and `Orbit`.
- Main call to action "Start building", plus a strip of category cards that deep-link to `?category=`.
- How it works (`ProcessSteps`), template gallery teaser, pricing tiers (from the catalog), and a cross-sell band. Example: "Add a mobile app to your website and save 15%", with Polara and Velora cards.
- A `Galaxy` section, "Join our galaxy of stars", followed by `Faq` and `CtaBand`.
- Metadata and JSON-LD (`Service` + `Offer`) through `lib/seo.ts`.

**Wizard**: `components/builder/` (client components, local state, step synced to `?step=`, draft saved to `localStorage` wrapped in try/catch)
- `BuilderWizard.tsx`: shell with a step rail, back/continue, and a sticky summary/quote panel that becomes a bottom sheet on mobile.
- `StepCategory.tsx`: the 6 verticals plus a primary goal (calls, bookings, leads, sales, catalogue).
- `StepTemplate.tsx`: filtered template cards; selecting one shows the preview.
- `StepBrand.tsx`:
  - Business name, colour pickers (primary/accent with contrast hints), font pairing chooser (3–4 curated pairs), and tone.
  - Logo and identity uploads go to `/api/v1/builder/assets`.
  - Optional notes or brand-guideline link.
- `StepAddons.tsx`: module add-ons, then a "Grow with Xaeon" cross-sell group (mobile app −15%, Polara, Velora) with discount badges.
- `StepPlan.tsx`: plan tiers, a monthly/annual toggle, and a market/currency switch (EGP/AED/USD; defaults to EGP).
- `StepReview.tsx`: summary, contact fields, terms consent, submit. Redirects to `checkoutUrl` if one is returned, otherwise to the success state.
- `TemplatePreview.tsx`:
  - Renders a mock site with three layout variants (`classic | bold | minimal`), shown in desktop and mobile frames.
  - Brand values are applied as CSS variables; the content is category-specific sample copy.
  - Same approach as `ElevoraMock.tsx`, which becomes `PolaraMock.tsx`. Supports RTL.
- `lib/builder.ts`: catalog types, a client-side `estimateQuote` for display (mirrors the server; the server stays authoritative), and categories.
- `trackLead("builder")`: add `builder` to `LeadKind` in `lib/analytics.ts`. Add `data-track` to each step's continue button.
- `app/[locale]/website-builder/success/page.tsx`: the payment return page. It polls the order status and shows "Welcome to the galaxy" with a star animation.
- Add a `builder` namespace to both message files and to `CLIENT_NAMESPACES` in `app/[locale]/layout.tsx`.
- Validation follows the hand-written pattern in `EnquiryForm.tsx`; no new form library.

**Data**: `lib/api.ts` gets `getBuilderCatalog()` and `getStars()` (same `getJson` cache and `cms` tag).

## Part D: Galaxy of Stars

**Backend**
- New `star.model.ts`:
  - Identity: `name`, `logoUrl`, `industry`, `product` (`website|app|polara|velora|custom`), `country`, `since`.
  - Rendering: `magnitude` (1–3, sets brightness and size), `constellation` (group key, default `product`).
  - Links: `caseStudy?` (ref, links to `/work/[slug]`), `testimonial?` (ref), `published`, `sortOrder`.
- Public `GET /site/stars` (in `site.routes.ts`, populates the case-study slug) and admin CRUD (`StarsPage`).
- `scripts/migrate-stars.ts` (dry run by default, `--apply`) seeds stars from existing testimonial companies/logos and published case studies.

**Web**: `components/galaxy/Galaxy.tsx` (client, lazy-loaded like `LazyStarfield`)
- Layout:
  - An SVG sky over the existing canvas `Starfield`.
  - Each client is a glowing star, placed deterministically by a seeded hash of its id.
  - Clients are grouped into labelled constellations (Polara, Velora, Websites, Apps) and joined by faint constellation lines.
  - Magnitude sets the glow radius.
- Interaction:
  - Hovering or focusing a star shows a card with logo, name, industry and a "Read case study" link.
  - The constellations can be filtered.
  - An empty "your star" slot pulses, labelled "Join our galaxy", and links to `/website-builder`.
- Accessibility and performance:
  - Stars are keyboard-focusable buttons, and a visually hidden `<ul>` lists every client.
  - Reduced motion gets a static render. The JS stays small so Lighthouse budgets hold (perf ≥ 0.9, TBT ≤ 200ms).
- Placement:
  - Home: replaces or extends the logo strip, headed "Our galaxy of stars".
  - `/work` header and the builder landing page.
  - The success page uses a single-star "you're in" variant.
- Copy: `galaxy.*` messages (EN/AR), including "Join our family of stars".

## Part E: Elevora → Polara, and the new Velora page
- Rename the route `app/[locale]/products/elevora` to `products/polara`.
  - Add a permanent redirect `/products/elevora` (and `/ar/...`) → `/products/polara` in `next.config.ts`.
- Rename these:
  - `ElevoraMock.tsx` → `PolaraMock.tsx`
  - `ELEVORA_URL` → `POLARA_URL` in `lib/site.ts` (keep the current URL value until the new domain exists; it is one constant)
  - `elevoraJsonLd` → `polaraJsonLd` (`lib/seo.ts`)
  - the `elevora.*` message namespace → `polara.*`, plus `home.elevora.*`, `products.elevora*`, `meta.homeDescription`, `home.hero.subtitle/badge`, `about.metaDescription`
- Other places to update: Footer, HeroCinematic badge, home page, products page, sitemap, `llms.txt`, `lighthouserc.json` URL, `e2e/site.spec.ts`.
- Check `backend/` and `frontend/` for "Elevora" (lead `interest` strings) and update their display labels.
- New `products/velora/page.tsx`, mirroring the Polara page structure:
  - hero, modules (appointments, patient records, billing, reminders, WhatsApp, multi-branch), audience, steps, FAQ, and a demo `EnquiryForm interest="Velora"`
  - a `VeloraMock.tsx`, plus `velora.*` messages EN/AR
- The `products/page.tsx` index lists both products and drops "More products in development".
- The home hero rotating words mention Polara and Velora where it fits.
- Velora/Polara copy is drafted by me and flagged for your review.

## Documentation, so another session can continue (kept current throughout)
- `docs/website-builder/README.md`: overview, architecture diagram (web ↔ API ↔ admin ↔ payment provider), data models, endpoints, env vars, and how to seed and test.
- `docs/website-builder/PROGRESS.md`: a checklist of every step in "Build order", ticked as each lands. Includes **what is done, what's next, and known gaps or TODOs** (e.g. Kashier hash spec to confirm, Velora copy to review, Polara domain), updated after every step.
- `docs/website-builder/DECISIONS.md`: short ADRs (configurator before platform, Mongo models in the existing API, server-authoritative quote, payment-provider adapter, Star model, Elevora→Polara redirect).
- `docs/website-builder/galaxy.md` and `docs/website-builder/payments.md`: how the galaxy layout works, and provider setup, webhooks and test mode.
- Copy this plan to `docs/website-builder/PLAN.md` and link the original product plan.
- `CLAUDE.md` at the repo root: a short repo map (web/backend/frontend, commands, conventions found above) with a pointer to `docs/website-builder/PROGRESS.md` as the resume point.
- The graphify graph and Obsidian vault are re-run (`graphify update .`) at the end so the vault reflects the new code.
- A memory note pointing future sessions to `PROGRESS.md`.

## Build order
0 graph/vault → E (rename, small and isolated) → A models, quote, catalog, seed, tests → B admin CRUD → C landing and wizard (no payment) → A payments (Kashier, then Polar) + success page → D galaxy (model, migration, component, placements) → e2e, Lighthouse, docs (`DEPLOY.md` env vars).

## Verification
- **Backend:** `cd backend && npm test`. Covers the new builder, quote, stars and webhook tests and existing suites, with Mongo in Docker per `DEPLOY.md`.
- **Seed and smoke test:** run `scripts/seed-builder.ts`, then `curl /api/v1/builder/catalog`.
- **Web:** extend `e2e/mock-api.mjs` with catalog, stars, order and asset routes, then add these to `e2e/site.spec.ts`:
  - the builder wizard end to end in EN and AR (RTL)
  - order submission with attribution
  - the redirect when a `checkoutUrl` is returned
  - the `/products/elevora` → `/products/polara` redirect
  - the Velora page h1
  - galaxy stars being focusable with list fallback
  - the nav item present on desktop and mobile
- Then run `npm run build:e2e && npm run e2e`.
- **Lighthouse:** add `/website-builder` and `/products/velora` to `lighthouserc.json` and run the budgets.
- **Payments:** Kashier test mode with sandbox keys runs a full deposit; the webhook marks the order `paid` and it shows up in admin and on the lead. With `PAYMENT_PROVIDER=none` the order ends at `awaiting_payment` and staff get the email.
- **Manual:** admin creates and edits a template, add-on and star, and the public page updates after revalidation.
