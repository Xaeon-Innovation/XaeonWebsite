# Website Builder — decisions (short ADRs)

## 1. Configurator first, platform later (2026-10-28)
**Decision:** Phase 1 is a guided wizard on xaeons.com. It produces an order and a CRM lead. Xaeon builds the site through managed delivery.
**Why:**
- The full multi-tenant platform (Cloudflare Workers + vinext, Puck editor, Cloudflare for SaaS domains) is a 10–18 week project.
- The configurator validates demand, pricing and add-on attach rate first, using the stack we already run.
**Later:** the platform can take the same `BuilderOrder.config` and `brand` (template slug, brand tokens, add-on keys) as its tenant input.

## 2. Catalog and orders in the existing Express/Mongo API
**Decision:** add the new models to `backend/` and manage them from the existing Vite admin, following its CRUD patterns. No new service or database.
**Why:** the team already deploys and runs this API, auth, uploads, Resend email and CRM. An order is also a lead (`ServiceRequest.source = "builder"`), so the pipeline, digest and statistics work without changes.

## 3. The server is authoritative for prices
**Decision:** `computeQuote` runs on the server for every order. The browser's `estimateQuote` is display-only. Client-sent numbers are ignored.
**Why:** anyone can tamper with prices in a browser. Both functions apply the same rules, so keep them in step.

## 4. Payment-provider adapter (Kashier first, Polar optional)
**Decision:**
- `services/payments` defines one `PaymentProvider` interface.
- `PAYMENT_PROVIDERS` picks the first configured provider that supports the order's currency.
- If none matches, the order is saved and the team sends the payment manually.
- Only the setup **deposit** is charged online; subscriptions stay manual for now.

**Why:** the owner hasn't finalised the provider. Kashier fits EGP and local wallets; Polar (merchant of record, USD) fits international customers. Webhooks are verified by signature and are idempotent.

## 5. "From" prices and cross-sells as add-ons
**Decision:** other Xaeon services (mobile app with a 15% bundle discount, Polara, Velora, brand identity) are add-ons with `kind: "service"`. Open-scope items are `quoted: true`: they appear in the estimate but are left out of the deposit.
**Why:** one catalog and one pricing path, all editable in the admin, with no special cases in the code.

## 6. Galaxy of stars: its own `Star` model
**Decision:** a dedicated `Star` collection (name, logo, product/constellation, magnitude, optional case study). Existing testimonials and case studies are not overloaded. `scripts/migrate-stars.ts` seeds stars from both as hidden drafts.
**Why:**
- Not every client has a testimonial or a case study.
- Showing a client publicly needs its own consent flag (`published`).
- Constellations group stars by product: Polara, Velora, Websites, Apps, Custom.

## 7. Elevora renamed to Polara, with permanent redirects
**Decision:**
- Every site reference changes, and the route moves to `/products/polara`.
- `/products/elevora` (EN and AR) gets a 308 redirect.
- `POLARA_URL` still points at `https://elevora.xaeons.com` until the product's new domain exists.

The clinic system is the new product **Velora** (`/products/velora`), demo-request only for now.

## 8. Builder strings ship only on the builder page
**Decision:** the `builder` message namespace goes to the browser through a nested `NextIntlClientProvider` on `/website-builder`, not through the global `CLIENT_NAMESPACES`.
**Why:** about 10 KB of wizard copy would otherwise be sent with every page and work against the Lighthouse budgets.

## 9. Country first; currency and payment options follow from it (2026-10-28, owner request)
**Decision:**
- The wizard's first question is the business country, and currency is no longer a free choice.
- Country → market: EG → EGP, Gulf → AED, everywhere else → USD.
- Payment options come from the API's configured providers for that currency. **Kashier is the main provider**, with currencies and methods set by env.

**Why:**
- Customers see the right price and the payment methods they can actually use.
- The server can't be tricked into using a cheaper market.

## 10. Non-EGP countries: keep local price lists, charge in USD through Kashier
**Decision:**
- Gulf customers see AED prices, and their deposit is charged in USD at Kashier's exchange rate.
- Customers elsewhere see USD prices and are charged in USD.

**Why:**
- Kashier charges only EGP, USD, GBP and EUR, and its local-currency display at checkout is a gated feature.
- USD is the natural card currency for Gulf and international cards, and AED, SAR and the other Gulf currencies are pegged to it, so the amount is stable.
- The converted amount is shown before payment and stored on the order, and webhooks must match it.

## 11. Conversion-focused wizard v2: price at the end, pages and multi-page preview (owner request)
**Decision:**
- Any country, searchable and geo-pre-selected; it silently sets the currency.
- No prices or currency until the final Proposal step, which pre-selects the best-value plan for the customer's exact selection.
- 40 templates across 10 industries, each with style options (hero, light/dark, corners) and selectable pages.
- The preview is multi-page and clickable. Pages beyond the plan's allowance cost extra.
- "Send without paying now" turns every finished wizard into a lead.

**Why:**
- Customers invest in designing their own site before seeing a number, a quiz-style funnel that keeps them going.
- The recommendation removes plan-choice friction.
- Page selection makes the proposal feel tailored, and it prices scope honestly.
