# Xaeon Website Builder: Product, Technical, and Pricing Plan

## Executive direction

The strongest version of this idea is **not another general-purpose Wix clone**. It should launch as a **guided, productized website service for MENA businesses**: the customer chooses an industry template, supplies branding and content, selects proven add-ons, previews the result, and pays Xaeon to configure, verify, connect the domain, and launch it.

This model matches Xaeon’s existing strengths in design, development, Arabic-first experiences, local payments, and managed delivery. It is also much faster and safer to launch than a completely unrestricted drag-and-drop builder. The recommended commercial structure is a **one-time setup fee plus a recurring care-platform subscription**, with usage-based third-party costs passed through transparently.

A critical infrastructure correction is required: **Cloudflare R2 is object storage, not the primary website deployment product**. Use Cloudflare Workers with Static Assets for sites and server logic, D1 or another database for structured content, R2 for uploaded logos/images/documents, and Cloudflare for SaaS for client domains. Cloudflare’s R2 free allowance is 10 GB-month, 1 million Class A requests, and 10 million Class B requests per month at the account level—not unlimited free hosting for every customer. Workers Static Assets can serve HTML, CSS, images, and other files with global caching, while a Worker handles dynamic routes.[^1][^2]

## Product position

### Recommended promise

> **Choose a proven website. Make it yours. Launch with Xaeon.**

The buyer is not purchasing a template alone. The buyer receives:

- A polished industry-specific starting point
- Brand adaptation using the customer’s logo, colors, fonts, imagery, and tone
- Managed technical setup and quality assurance
- Optional operational modules such as bookings, forms, email, payments, catalogues, dashboards, analytics, and WhatsApp actions
- Domain, SSL, deployment, updates, backups, and support under one relationship
- Arabic, English, or bilingual delivery designed for MENA workflows

### Initial customer scope

Launch with **six repeatable vertical packs**, not “every business type” on day one:

1. Clinics and healthcare practices
2. Training centers, schools, and education businesses
3. Professional services and consultants
4. Restaurants, cafés, and hospitality
5. Home services, construction, and contractors
6. Product catalogues and small online stores

Each vertical should contain 3–5 visually distinct templates but share the same tested components underneath. This produces 18–30 marketable choices without maintaining 30 unrelated codebases.

### What version one should avoid

- Pixel-level freeform design resembling Figma
- Arbitrary user-supplied JavaScript
- A plugin marketplace
- Full ERP, CRM, or complex ecommerce inside the base plans
- Unlimited pages, storage, email, products, or revisions
- Per-customer source-code forks
- Deployment of a separate application for every small customer

These features add disproportionate support, security, and upgrade costs. Version one should be a **constrained component system** with excellent templates and controlled configuration.

## Customer journey

1. **Select business type:** The user chooses an industry and primary objective such as calls, appointments, leads, purchases, or catalogue browsing.
2. **Choose a template:** Filters include style, light/dark, Arabic support, number of pages, catalogue, booking, and ecommerce readiness.
3. **Add the brand:** Upload logo, select or extract colors, choose fonts, provide contact details, social accounts, and WhatsApp number.
4. **Add content:** Enter text manually, upload a company profile, or let an AI assistant draft editable copy from a structured questionnaire.
5. **Select modules:** Contact form, email notifications, booking, payment, catalogue, blog, analytics, dashboard, multilingual content, and integrations.
6. **Preview:** Render a real responsive preview on a temporary Xaeon subdomain.
7. **Choose plan and pay:** Collect the setup payment or deposit and recurring subscription authorization.
8. **Secure onboarding:** Collect integration credentials through protected fields, never through WhatsApp, email, support chat, or an AI prompt.
9. **Xaeon review:** Check content, responsiveness, accessibility, SEO metadata, forms, legal pages, and integration tests.
10. **Connect domain:** Give the customer a guided DNS checklist or automate custom-hostname onboarding when possible.
11. **Publish and support:** Show status, analytics, usage, invoices, support requests, and future upgrades in the customer dashboard.

A high-converting acquisition flow is **“Build your draft free; pay only to launch.”** The draft should remain on an expiring preview domain, carry Xaeon branding, and omit production integrations until purchase.

## Platform architecture

### Recommended stack

| Layer | Recommendation | Purpose |
|---|---|---|
| Frontend and control panel | Next.js 16, React, TypeScript, Tailwind, shadcn/ui | Builder, customer dashboard, operations panel, and rendered sites |
| Visual editor | Puck | Controlled React component editing with JSON output |
| Runtime | Cloudflare Workers using vinext for new Next.js deployments | Host the multi-tenant application and dynamic routes |
| Static delivery | Workers Static Assets | Serve generated/static assets efficiently |
| Database | D1 for an all-Cloudflare MVP, or PostgreSQL if Xaeon wants richer relational tooling | Tenants, pages, versions, forms, subscriptions, domains, and module settings |
| Media | R2 | Customer logos, photos, downloadable files, and generated assets |
| Tenant domains | Cloudflare for SaaS custom hostnames | TLS and routing for customer-owned domains |
| Background work | Cloudflare Queues | Emails, publish jobs, webhook processing, image work, and retries |
| Email | Resend plus React Email | Form notifications and transactional messages |
| Authentication | Auth.js or a managed identity provider | Xaeon staff and customer accounts |
| Payments | Stripe where supported; Paymob/Fawry for Egypt; Tap for broader MENA | Customer billing and optional site checkout integrations |
| Monitoring | Cloudflare logs plus error tracking | Production visibility and support |

Cloudflare currently recommends **vinext** for new Next.js applications on Workers; OpenNext remains documented for existing deployments with compatibility gaps. Workers Paid starts at a $5 monthly account minimum and includes 10 million requests and 30 million CPU milliseconds before usage charges, so pricing should assume a paid production account rather than promise permanently free infrastructure.[^3][^4][^5]

### Multi-tenant request flow

```text
Visitor requests customer-domain.com
        ↓
Cloudflare custom hostname / TLS
        ↓
Xaeon site Worker resolves hostname
        ↓
Tenant + published site configuration loaded
        ↓
Template renderer combines:
- component tree JSON
- brand tokens
- content
- enabled modules
        ↓
Cached HTML/static assets returned
        ↓
R2 serves tenant media; Worker APIs handle forms, booking, checkout, and admin actions
```

One production deployment should serve many tenant sites. The Vercel Platforms repository is a useful reference for hostname-based multi-tenancy, tenant-specific content, shared layouts, and an admin interface, even though its storage and deployment choices should be adapted for Cloudflare.[^6]

### Core data model

- `tenants`: account, market, currency, plan, status, owner
- `users`: identity and platform role
- `tenant_members`: tenant-specific role and permissions
- `sites`: domain, locale, template, publication status
- `pages`: route, title, SEO, component-tree JSON
- `page_versions`: draft/published history and rollback
- `brand_kits`: colors, typography, logo variants, design tokens
- `templates`: category, preview, capabilities, version
- `template_versions`: immutable component-schema version
- `modules`: enabled add-ons and module configuration
- `assets`: R2 object key, MIME type, owner, dimensions, alt text
- `domains`: hostname, verification, SSL, DNS instructions
- `forms` and `submissions`: tenant-scoped forms and protected entries
- `integrations`: provider, encrypted credentials, status, last test
- `subscriptions`, `invoices`, and `usage_events`
- `audit_logs`: sensitive actions, staff access, publishing, key changes

For the MVP, a shared database with a mandatory `tenant_id` is operationally simple. Every query must derive tenant scope from the authenticated session or resolved hostname, never from a client-supplied tenant ID. Premium healthcare or regulated customers can later receive stronger isolation, including dedicated databases.

### Template contract

Every template should be assembled from registered components rather than copied as an independent project. A template manifest can follow this shape:

```ts
interface TemplateManifest {
  id: string;
  version: number;
  industries: string[];
  locales: ("en" | "ar")[];
  rtlReady: boolean;
  requiredModules: string[];
  optionalModules: string[];
  defaultBrandTokens: BrandTokens;
  pages: PageDefinition[];
  licenseRecord: LicenseRecord;
}
```

Each component should define:

- Editable fields and validation
- Responsive behavior
- Arabic/RTL behavior
- Allowed child components
- Accessibility requirements
- Design-token usage
- Data dependencies
- Module requirements
- Migration rules when its schema changes

Puck is the recommended editor because it is an MIT-licensed, embeddable React editor, stores output as JSON, works with Next.js, and lets Xaeon expose only approved components. GrapesJS is a credible alternative when raw HTML-template editing matters more than React-native components, but it creates a less controlled path for a Next.js component platform. Craft.js provides lower-level drag-and-drop primitives and therefore requires more editor engineering.[^7][^8][^9][^10][^11]

## Cloudflare deployment design

### Do not deploy sites “on R2”

Use the products according to their roles:

- **Workers Static Assets:** generated HTML, CSS, JavaScript, and shared template assets
- **Workers:** hostname resolution, tenant rendering, APIs, authentication, webhooks, and server actions
- **R2:** tenant-uploaded media and downloadable files
- **D1/PostgreSQL:** structured site and business data
- **Cloudflare for SaaS:** customer vanity domains and managed TLS

Cloudflare for SaaS is available on self-serve plans, includes 100 hostnames on Free, Pro, and Business, supports up to 50,000 on those plans, and lists $0.10 for each additional hostname. It routes customer-owned custom hostnames to a fallback origin and handles encrypted traffic. Confirm apex-domain behavior before promising that every customer can keep an external DNS provider; standard CNAME-based onboarding is simplest for `www.customer.com` or another subdomain, while advanced apex proxying is an Enterprise capability.[^12][^13]

### Publish strategy

Use two publication modes:

- **Dynamic multi-tenant mode:** Store the page JSON and render through the shared Worker. This enables instant publication and one deployment for all customers.
- **Static snapshot mode:** Generate immutable output for brochure sites, store it as a publication artifact, and update only when the customer republishes. This reduces database work and makes rollback easy.

Do not trigger a full Next.js build for every text edit. Save drafts immediately, create a version on publish, invalidate the tenant cache, and let the shared runtime serve the new version.

## Add-on architecture

### Standard modules

| Module | MVP implementation | Commercial treatment |
|---|---|---|
| Contact and lead forms | Configurable fields, spam controls, email notification, CSV export | Included with submission limits |
| Transactional email | Resend API with React Email templates | Allowance by tier; overage or client account |
| Booking | Link/embed a client-owned Cal.com account first | Setup fee; vendor charge paid by client |
| Payments | Hosted checkout or payment link using client-owned merchant account | Integration setup plus support fee |
| Product catalogue | Products, categories, enquiry/WhatsApp CTA, no checkout | Included in Growth or separate add-on |
| Ecommerce | Medusa or a dedicated commerce service for real cart/order needs | Separate higher-cost product, not a small add-on |
| Blog/CMS | Controlled posts, categories, authors, and SEO | Business tier and above |
| Analytics | Privacy-aware page and conversion events | Included; advanced reports paid |
| Light dashboard | Leads, bookings, catalogue, submissions, site settings | Growth tier |
| WhatsApp actions | Click-to-chat and templated links first | Included or low-cost add-on |
| AI copy | Structured generation with approval and usage limits | Credits or paid add-on |

Resend’s current free transactional tier includes 3,000 messages per month with a 100-message daily limit; the Pro tier begins at $20 per month for 50,000 messages. These are account-level economics, so each Xaeon tier needs a fair-usage allowance and monitoring rather than “unlimited email.” Resend’s Next.js guide and examples cover the API route and React-template pattern.[^14][^15][^16]

For booking, start with an integration instead of recreating scheduling. Cal.com offers a free individual plan with unlimited event types and calendars, while team features start at $12 per user per month on annual billing. A platform-level white-label agreement may require a custom commercial arrangement, so a client-owned account or simple embed is the safest MVP.[^17]

For Egypt, Paymob publishes 2.75% + EGP 3 per standard transaction with no monthly fee and weekly settlement. Fawry offers hosted checkout, payment links/buttons, REST APIs, cards, retail reference payments, wallets, and other local methods, but pricing should be obtained by written quote. Tap provides platform and agency integrations across MENA, including merchant onboarding, local methods, payouts, APIs, and sandbox testing. In the UAE, Stripe’s standard domestic-card price is 2.9% + AED 1 per successful transaction, with extra charges for international cards and currency conversion.[^18][^19][^20][^21][^22][^23]

### Credentials and security

Never ask a customer to paste production keys into a Claude conversation, WhatsApp chat, email, support ticket, or ordinary database field. Cloudflare supports encrypted Worker secrets and explicitly advises using secrets rather than plaintext variables for API keys and tokens.[^24]

For a multi-tenant platform, use this pattern:

1. Show provider-specific setup instructions and least-privilege permission requirements.
2. Accept credentials through an authenticated server-rendered form over TLS.
3. Encrypt each tenant credential using envelope encryption before database storage.
4. Keep the root encryption key in Cloudflare Secrets Store or an equivalent managed KMS.
5. Never return a stored credential to the browser after creation.
6. Record who created, tested, rotated, or deleted each integration.
7. Redact secrets from logs, errors, analytics, and AI context.
8. Provide “test connection,” “rotate,” and “revoke” actions.
9. Prefer OAuth or restricted tokens where providers support them.
10. Prefer hosted payment checkout so Xaeon does not directly handle card details.

Cloudflare Secrets Store provides encrypted, reusable account-level secrets for Workers, although it remains an evolving platform feature. Do not create a hardcoded Worker environment variable for every customer; keep only the platform encryption material in the secret manager and store each tenant’s encrypted payload in the application database.[^25][^26]

## Curated Claude source pack

### Core architecture

| Resource | URL | Give Claude this purpose |
|---|---|---|
| Puck | [https://github.com/puckeditor/puck](https://github.com/puckeditor/puck) | Build the controlled React page editor and JSON component tree; MIT licensed.[^7] |
| Vercel Platforms | [https://github.com/vercel/platforms](https://github.com/vercel/platforms) | Study hostname-based multi-tenancy, tenant routing, and admin structure.[^6] |
| Next.js SaaS Starter | [https://github.com/nextjs/saas-starter](https://github.com/nextjs/saas-starter) | Reuse patterns for authentication, protected dashboard routes, Stripe subscriptions, and shadcn/ui.[^27] |
| Cloudflare vinext guide | [https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) | Use the current recommended path for a new Next.js-on-Workers project.[^5] |
| OpenNext Cloudflare | [https://github.com/opennextjs/opennextjs-cloudflare](https://github.com/opennextjs/opennextjs-cloudflare) | Compatibility reference if vinext blocks a required Next.js feature.[^28] |
| Workers Static Assets | [https://developers.cloudflare.com/workers/static-assets/](https://developers.cloudflare.com/workers/static-assets/) | Build the correct frontend/static-asset deployment layer.[^2] |
| Cloudflare for SaaS | [https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/) | Implement custom domains, TLS, fallback origin, and hostname lifecycle.[^13] |
| D1 pricing and design | [https://developers.cloudflare.com/d1/platform/pricing/](https://developers.cloudflare.com/d1/platform/pricing/) | Model query/storage usage and indexing; D1 bills by rows read/written and storage.[^29] |
| R2 pricing | [https://developers.cloudflare.com/r2/pricing/](https://developers.cloudflare.com/r2/pricing/) | Model media usage and avoid treating R2 as unlimited free hosting.[^1] |

### UI and template system

| Resource | URL | Recommended use |
|---|---|---|
| shadcn/ui | [https://github.com/shadcn-ui/ui](https://github.com/shadcn-ui/ui) | Ownable component source and a common design-system base; MIT licensed.[^30] |
| shadcn GitHub registries | [https://ui.shadcn.com/docs/registry/github](https://ui.shadcn.com/docs/registry/github) | Create a private Xaeon registry containing approved site sections and dashboards.[^31] |
| Awesome shadcn/ui | [https://github.com/birobirobiro/awesome-shadcn-ui](https://github.com/birobirobiro/awesome-shadcn-ui) | Discovery list; import only items whose individual licenses and quality have been verified.[^32] |
| Vibra UI | [https://vibraui.com/](https://vibraui.com/) | Free source-based dashboard pages and components for admin interfaces.[^33] |
| Easy UI | [https://github.com/DarkInventor/easy-ui](https://github.com/DarkInventor/easy-ui) | MIT React/Next/Tailwind template inspiration; normalize components before inclusion.[^34] |
| AstroWind | [https://github.com/arthelokyo/astrowind](https://github.com/arthelokyo/astrowind) | Strong multipurpose layout and content inspiration, especially for static marketing sites.[^35] |
| Astro official themes | [https://astro.build/themes/](https://astro.build/themes/) | Discover industry categories and page structures; licenses vary by theme.[^36][^37] |
| Lucide | [https://github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide) | Consistent commercial-use icons under the ISC license.[^38] |
| GrapesJS | [https://github.com/GrapesJS/grapesjs](https://github.com/GrapesJS/grapesjs) | Alternative editor prototype if Xaeon later supports raw HTML/email templates.[^8] |
| Craft.js | [https://craft.js.org/](https://craft.js.org/) | Lower-level React editor primitives; use only if Puck becomes too restrictive.[^11] |
| ChaiBuilder | [https://www.chaibuilder.com/nextjs-website-builder](https://www.chaibuilder.com/nextjs-website-builder) | Evaluate build-versus-buy; open core is single-site, while production multi-tenancy is commercial.[^39] |

### Content and operations

| Resource | URL | Recommended use |
|---|---|---|
| Payload multi-tenant plugin | [https://www.npmjs.com/package/@payloadcms/plugin-multi-tenant](https://www.npmjs.com/package/@payloadcms/plugin-multi-tenant) | Optional tenant-aware CMS/admin foundation; test access control and upgrade behavior carefully.[^40] |
| Payload multi-tenancy | [https://payloadcms.com/multi-tenancy](https://payloadcms.com/multi-tenancy) | Reference tenant-specific content, roles, and branded domains from one codebase.[^41] |
| Resend examples | [https://resend.com/docs/examples](https://resend.com/docs/examples) | Transactional email, attachments, templates, scheduling, and Next.js examples.[^15] |
| React Email | [https://github.com/resend/react-email](https://github.com/resend/react-email) | Build branded email components shared across tenants.[^42] |
| Auth.js | [https://authjs.dev/](https://authjs.dev/) | Authentication/session reference for Next.js.[^43] |
| React Hook Form | [https://react-hook-form.com/](https://react-hook-form.com/) | Builder and onboarding forms; works with Zod and Next.js.[^44] |
| Zod | [https://zod.dev/](https://zod.dev/) | Validate template manifests, module settings, API input, and component props.[^45] |
| Cal.com | [https://cal.com/pricing](https://cal.com/pricing) | Start with customer-owned booking links or embeds; verify commercial terms before white-label embedding.[^17] |
| Medusa | [https://github.com/medusajs/medusa](https://github.com/medusajs/medusa) | Use when a customer truly needs products, cart, orders, payments, and extensible commerce modules.[^46][^47] |
| Paymob | [https://www.paymob.com/en/pricing](https://www.paymob.com/en/pricing) | Egyptian payment option and published standard pricing.[^19] |
| Fawry developer guide | [https://developer.fawrystaging.com/](https://developer.fawrystaging.com/) | Egyptian cards, wallets, retail references, links, hosted checkout, and APIs.[^20] |
| Tap developer docs | [https://developers.tap.company/](https://developers.tap.company/) | Regional MENA payment methods and API integration.[^48] |

### License gate

Claude should not be told to “download every template and add it.” Instead, require a manifest for every imported resource:

```json
{
  "sourceUrl": "",
  "license": "MIT | ISC | BSD-3-Clause | Commercial | Unknown",
  "commercialUseAllowed": true,
  "attributionRequired": false,
  "redistributionAllowed": true,
  "assetsIncluded": [],
  "reviewedBy": "",
  "reviewedAt": ""
}
```

Reject resources marked `Unknown`, templates without source licenses, demo photography without reuse rights, and paid templates whose license does not explicitly permit use across customer sites or in a site-building product. A GitHub repository being public does not automatically grant commercial redistribution rights.

## MVP roadmap

### Stage zero — product rules (1 week)

- Choose the working product name and promise
- Define the six launch industries
- Finalize plan boundaries and exclusions
- Specify template/component contracts
- Define bilingual and RTL acceptance criteria
- Create legal terms covering subscription, third-party services, content ownership, domain ownership, acceptable use, suspension, and data export

### Stage one — platform foundation (2–3 weeks)

- Tenant, user, role, site, subscription, and audit-log models
- Authentication and Xaeon operations dashboard
- Hostname resolver and tenant middleware
- R2 upload pipeline with file validation
- Draft/published page versions
- Cloudflare development, staging, and production environments
- Error tracking, logs, backups, and migrations

### Stage two — template engine (3 weeks)

- Puck editor with 20–30 approved components
- Brand tokens: colors, type scale, spacing, radius, shadows, and buttons
- Template manifest and versioning
- Mobile/tablet/desktop preview
- Arabic RTL and locale switching
- Three launch verticals with three templates each
- SEO fields and legal-page generator

### Stage three — onboarding and publishing (2 weeks)

- Guided business questionnaire
- Logo, image, and company-profile upload
- Free preview workflow
- Plan checkout and setup-payment flow
- Publishing, cache invalidation, rollback
- Temporary Xaeon subdomains
- Custom-domain verification, status, and guided DNS instructions

### Stage four — modules (2–3 weeks)

- Contact/lead forms and CSV export
- Resend email notifications
- Booking embed/link
- Analytics events
- Basic catalogue
- One payment provider per launch market
- Customer dashboard for leads, site settings, integrations, domain, invoices, and support

### Stage five — pilot (2 weeks)

- Onboard 5–10 real businesses manually
- Track time spent per setup and support category
- Fix repeated onboarding friction
- Measure preview-to-purchase, launch time, support hours, gross margin, and module adoption
- Add the next three verticals only after the first set is stable

A realistic internal estimate is **10–13 weeks for a small focused team** or **14–18 weeks for one full-time developer** to reach a controlled pilot. A true Wix-like visual builder would be a separate, much larger product.

## Pricing model

### Why hybrid pricing wins

A subscription-only model creates a long payback period while Xaeon performs real onboarding, content, brand adaptation, integration, and quality-assurance work. A one-time-only model removes recurring revenue even though Xaeon continues to provide infrastructure, security updates, domain operations, support, and product improvements.

Use:

- **Setup fee:** template configuration, brand application, content entry limits, integration configuration, QA, launch, and training
- **Subscription:** platform access, hosting, SSL, updates, backups, monitoring, support, and included usage
- **Usage charges:** excess email, storage, AI, SMS, and high-volume operations
- **Third-party fees:** domain, payment processing, premium booking, paid fonts/assets, and external software charged directly to the client when practical
- **Custom development:** separately scoped work outside registered modules and template capabilities

### Egypt pricing

| Plan | Setup fee | Monthly | Included scope |
|---|---:|---:|---|
| **Launch** | EGP 7,500 | EGP 650 | One-page site, one language, custom domain connection, brand kit, contact/WhatsApp actions, basic SEO, SSL, hosting, one user |
| **Business** | EGP 16,500 | EGP 1,550 | Up to 5 pages, blog or service CMS, two languages, forms, analytics, two users, one standard integration |
| **Growth** | EGP 29,500 | EGP 3,250 | Up to 15 pages, bilingual content, light dashboard, catalogue or booking, payment integration, five users, priority support |
| **Custom** | From EGP 60,000 | From EGP 6,500 | Bespoke modules, workflow automation, external APIs, advanced dashboards, higher limits, dedicated project scope |

### Gulf pricing

| Plan | Setup fee | Monthly | Included scope |
|---|---:|---:|---|
| **Launch** | AED 950 | AED 75 | One-page site and managed launch |
| **Business** | AED 2,250 | AED 185 | Five-page bilingual business site and one integration |
| **Growth** | AED 4,950 | AED 385 | Operational modules, light dashboard, booking/catalogue/payment integration |
| **Custom** | From AED 10,000 | From AED 750 | Bespoke workflows, integrations, and expanded support |

### International pricing

| Plan | Setup fee | Monthly | Included scope |
|---|---:|---:|---|
| **Launch** | $275 | $21 | One-page managed site |
| **Business** | $625 | $51 | Five-page business site, CMS, forms, and one standard integration |
| **Growth** | $1,350 | $105 | Bilingual-ready site, light dashboard, and operational modules |
| **Custom** | From $2,750 | From $210 | Custom engineering and higher service level |

These prices intentionally sit above bargain hosting while remaining below a normal custom agency engagement. For context, Framer’s current self-service Basic and Pro plans are listed at $10 and $30 per month, while Wix’s US annual-plan reference prices run from $17 to $159 per month depending on features. Xaeon can justify setup fees because it adds human implementation, MENA integrations, bilingual delivery, and accountable launch support rather than selling software access alone.[^49][^50]

### Add-on menu

| Add-on | One-time implementation | Recurring or usage treatment |
|---|---:|---|
| Extra standard page | EGP 1,000 / AED 140 / $40 | Included in hosting after launch |
| Additional language | 35–50% of setup fee | Translation excluded unless quoted |
| Booking connection | EGP 2,500 / AED 350 / $95 | Client pays booking vendor if required |
| Payment gateway | EGP 4,500 / AED 650 / $175 | Processor fees paid by client |
| Product catalogue | From EGP 6,000 / AED 850 / $230 | Product-count limits by plan |
| Blog/CMS | EGP 3,500 / AED 500 / $135 | Included in Business/Growth |
| Extra dashboard module | From EGP 8,000 / AED 1,150 / $310 | May raise monthly support tier |
| Email automation | From EGP 3,000 / AED 425 / $115 | Email volume passed through above allowance |
| AI content pack | Fixed credit pack | No unlimited AI usage |
| Custom integration | Scoped quotation | Maintenance priced separately |
| Done-for-you content edits | Monthly retainer | Separate from software support |

### Commercial rules

- Require 50% of the setup fee to start and 50% before production launch; charge 100% upfront for Launch when practical.
- Offer two months free on annual subscriptions, not a permanent discount.
- Include 14 days of post-launch defect correction; ongoing changes follow the subscription or content-retainer rules.
- Keep the client as registrant/owner of its domain and merchant/payment account.
- Suspend publication only after a clear grace period; always provide content/domain export procedures.
- Do not include custom code in fixed tiers.
- Define “standard integration” as an existing tested connector with unchanged provider workflow.
- Review infrastructure and vendor usage quarterly; automatically notify customers before overage charges.
- Treat VAT/tax as additional where legally applicable.
- Display Egypt pricing in EGP and Gulf/international pricing in AED/USD based on billing entity and market.

## Unit economics controls

Track these metrics from the first pilot:

- Setup labor hours per plan
- Average days from payment to launch
- Third-party cost per active tenant
- Support minutes per tenant per month
- Gross margin after payment processing and support
- Preview completion rate
- Preview-to-paid conversion rate
- Monthly churn and failed-payment rate
- Add-on attachment rate
- Average revenue per tenant
- Percentage of sites using custom work

Set internal thresholds:

- Launch should require no more than 3–5 delivery hours after the template library is mature.
- Business should target 8–12 hours.
- Growth should target 16–24 hours unless separately scoped.
- Any request that changes data models, permissions, provider flows, or reusable components enters custom-development pricing.
- If a module generates frequent support, increase its setup fee, monthly fee, or minimum plan.

## Claude implementation brief

The following brief can be pasted into Claude after placing the approved repositories and documentation in the project context:

```text
Act as the principal engineer for a multi-tenant, Arabic-first website-builder platform operated by Xaeon Software Solutions.

PRODUCT MODEL
- This is a constrained template configurator, not an unrestricted Wix clone.
- Customers choose an industry template, customize approved components, add branding/content, select modules, preview, pay, and publish.
- One shared application must serve many tenant sites by hostname.
- Support English, Arabic, RTL, responsive layouts, draft/published versions, rollback, and customer-owned domains.

MANDATORY STACK
- Next.js 16, React, TypeScript, Tailwind, shadcn/ui
- Puck for the visual editor and JSON page representation
- Cloudflare Workers using vinext for a new application
- Workers Static Assets for frontend/static files
- R2 for tenant media only
- D1 for the MVP unless a documented requirement forces PostgreSQL
- Cloudflare for SaaS custom hostnames
- Resend + React Email for transactional email
- Zod for all external and stored configuration schemas

SECURITY RULES
- Every database record containing customer data must be tenant-scoped.
- Tenant identity must come from the authenticated session or resolved hostname, never directly from request input.
- Never expose integration keys to the client after storage.
- Encrypt tenant credentials before storing them; keep only the root encryption material in a managed secret store.
- Never put secrets in source, logs, analytics, generated output, browser bundles, or AI context.
- Use hosted payment checkout; never collect raw card data.
- Add audit logs for staff access, publishing, domain changes, and integration changes.

ARCHITECTURE TASKS
1. Produce an ADR for tenancy, page storage, template versioning, publication, domains, and encrypted integrations.
2. Create the database schema and migrations.
3. Implement hostname resolution and tenant authorization tests before UI work.
4. Build a private shadcn-compatible Xaeon component registry.
5. Define TemplateManifest, BrandTokens, PageDefinition, ModuleConfig, and migration schemas in Zod.
6. Integrate Puck with only approved registered components.
7. Implement draft, preview, publish, immutable version, rollback, and cache invalidation.
8. Implement R2 uploads with MIME, size, ownership, and image-dimension validation.
9. Implement a guided onboarding wizard and temporary preview subdomain.
10. Implement custom-hostname creation, verification status, DNS instructions, retries, and deletion.
11. Add forms, Resend notifications, booking embed/link, catalogue, and one payment connector behind module interfaces.
12. Add subscription entitlements and server-side plan-limit enforcement.
13. Add unit, integration, authorization, RTL, accessibility, and end-to-end tests.

CODE QUALITY
- Do not copy a complete third-party template into production unchanged.
- Normalize all imported sections to Xaeon tokens and component contracts.
- Record source URL and license for every imported component/template.
- Reject resources without an explicit commercial-use license.
- Prefer server components and server-side authorization.
- Do not create one codebase or deployment per customer.
- Keep provider integrations behind typed adapters.
- Write small milestones and request approval after every architectural milestone.

FIRST DELIVERABLE
Return only:
1. proposed repository structure,
2. architecture decision records,
3. database schema,
4. tenant threat model,
5. implementation milestones,
6. unresolved decisions.
Do not generate the full application until these are approved.
```

## Launch strategy

Launch the builder as a **new product landing page inside xaeons.com**, not as a hidden internal tool. The first call to action should be “Build my free preview,” with secondary paths for browsing templates and requesting a managed consultation.

The best initial offer is:

> **Founding customer package:** Business plan, discounted setup for the first 10 qualified customers, normal monthly subscription, one year of price protection, and direct founder onboarding in exchange for structured feedback and permission to publish a case study.

Do not discount the recurring fee permanently. The pilot’s purpose is to validate delivery time, customer expectations, module demand, support load, and conversion before opening fully self-service sign-up.

## Final recommendation

Build **Xaeon’s productized managed-site platform first**, then gradually expose more self-service editing. Start with 9 excellent templates across three industries, a controlled Puck editor, shared multi-tenant runtime, secure modules, custom domains, and hybrid pricing. Expand to six industries only after real customers prove which layouts and add-ons repeat.

The key economic advantage is not that Cloudflare is “free.” It is that one reusable platform, one component registry, and one deployment can support many branded client sites with predictable incremental costs. Xaeon’s differentiation should remain the combination of **design quality, Arabic/MENA readiness, useful integrations, and accountable human delivery**—not the lowest monthly price.

---

## References

1. [Pricing · Cloudflare R2 docs](https://developers.cloudflare.com/r2/pricing/) - R2 charges based on the total volume of data stored, along with two classes of operations on that da...

2. [Static Assets · Cloudflare Workers docs](https://developers.cloudflare.com/workers/static-assets/) - You can upload static assets (HTML, CSS, images and other files) as part of your Worker, and Cloudfl...

3. [Pricing · Cloudflare Workers docs](https://developers.cloudflare.com/workers/platform/pricing/) - Workers plans and pricing information.

4. [OpenNext adapter · Cloudflare Workers docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) - Workers Builds requires you to configure environment variables in Build variables and secrets. This ...

5. [Next.js · Cloudflare Workers docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) - Use vinext to create or migrate a Next.js application and deploy it to Cloudflare Workers.

6. [GitHub - vercel/platforms: A full-stack Next.js app with ...](https://github.com/vercel/platforms) - Next.js Multi-Tenant Example A production-ready example of a multi-tenant application built with Nex...

7. [GitHub - puckeditor/puck: The visual editor for React.](https://github.com/puckeditor/puck) - Puck is a modular, open-source visual editor for React.js. You can use Puck to build custom drag-and...

8. [GitHub - GrapesJS/grapesjs: Free and Open source Web Builder ...](https://github.com/GrapesJS/grapesjs) - GrapesJS is a free and open source Web Builder Framework which helps building HTML templates, faster...

9. [What is it? - grapesjs.github.io](https://grapesjs.github.io/grapesjs/) - GrapesJS is an open-source, multi-purpose, Web Builder Framework which combines different tools and ...

10. [Puck - The visual editor for React](https://puckeditor.com/) - Let your users generate, review, and refine production-ready interfaces inside your application with...

11. [Build any page editor | craft.js](https://craft.js.org/) - Everything you see here, including the editor, itself is made of React components. Craft.js comes on...

12. [Plans — Cloudflare for SaaS · Cloudflare for Platforms docs](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/) - Learn what features and limits are part of various Cloudflare plans.

13. [Cloudflare for SaaS](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/) - Eligible enterprise customers can preview this product as a non-contract service, which provides ful...

14. [What is Resend Pricing](https://resend.com/docs/knowledge-base/what-is-resend-pricing) - |Plan|Price|Emails/mo|Overage per 1,000 emails|
|--|--|--|--|

15. [Examples - Resend](https://resend.com/docs/examples) - Explore sample apps for different use cases. TypeScript and JavaScript variants available. Links bel...

16. [Send emails with Next.js - Resend](https://resend.com/docs/send-with-nextjs) - Send emails with Next.js Learn how to send your first email using Next.js and the Resend Node.js SDK...

17. [Pricing | Cal.com](https://cal.com/pricing) - Start free with Cal.com’s unlimited scheduling or upgrade to Teams, Organizations, or Enterprise for...

18. [Pricing & Fees - Stripe](https://stripe.com/ae/pricing) - Find Stripe fees and pricing information. Find our processing fees for credit cards, pricing models ...

19. [Check pricing & paymob fees for POS machine & payment gateway ...](https://www.paymob.com/en/pricing) - What is your pricing? Standard pricing: 2.75% + 3 EGP per transaction. When will I receive my money?...

20. [Fawry Pay](https://developer.fawrystaging.com/) - FawryPay is the leading digital transformation & E-payments platform in Egypt, thus, we take the res...

21. [Online Payments for Platforms in MENA - Tap Payments](https://www.tap.company/en-eg/products/platforms) - Payment infrastructure for MENA platforms. Give your merchants a faster way to accept payments acros...

22. [Online Payments for Development Agencies in MENA](https://www.tap.company/en-eg/products/development-agencies) - Tap Payments provides all the payment services you need to build and grow your clients. Set up MENA ...

23. [FawryPay Online Payments](https://developer.fawrystaging.com/docs/introduction) - Start accepting payments on your website and/or mobile apps through Fawry retail network, banking ch...

24. [Secrets · Cloudflare Workers docs](https://developers.cloudflare.com/workers/configuration/secrets/) - secrets configuration property - Declare required secret names in your Wrangler configuration. Used ...

25. [Workers integration · Cloudflare Secrets Store docs](https://developers.cloudflare.com/secrets-store/integrations/workers/) - Consider the steps below to learn how to use values from your account secrets store with Cloudflare ...

26. [Overview · Cloudflare Secrets Store docs](https://developers.cloudflare.com/secrets-store/) - Use Secrets Store to encrypt and store sensitive information as secrets that are securely reusable a...

27. [nextjs/saas-starter: Get started quickly with Next.js, Postgres, Stripe ...](https://github.com/nextjs/saas-starter) - This is a starter template for building a SaaS application using Next.js with support for authentica...

28. [GitHub - opennextjs/opennextjs-cloudflare: Open Next.js ...](https://github.com/opennextjs/opennextjs-cloudflare) - OpenNext for Cloudflare is an adapter that enables the deployment of Next.js applications to Cloudfl...

29. [Pricing · Cloudflare D1 docs](https://developers.cloudflare.com/d1/platform/pricing/) - D1 pricing based on rows read, rows written, and storage with scale-to-zero billing.

30. [shadcn-ui/ui at broddin.be - GitHub](https://github.com/shadcn/ui?ref=broddin.be) - A set of beautifully designed components that you can customize, extend, and build on. Start here th...

31. [GitHub Registries - shadcn/ui](https://ui.shadcn.com/docs/registry/github) - You can now turn any GitHub repository into a registry. users can install them with the shadcn CLI. ...

32. [birobirobiro/awesome-shadcn-ui - GitHub](https://github.com/birobirobiro/awesome-shadcn-ui) - MIT-licensed shadcn registry of confirmation components built on Base UI ... Template repository for...

33. [Free shadcn/ui dashboard templates & blocks — Vibra UI](https://vibraui.com/) - 13 free shadcn/ui admin dashboard templates, 109 pages, 285 blocks and 207 components for React, Nex...

34. [Launching 50+ FREE website templates - React, Next.js, Tailwind CSS](https://dev.to/darkinventor/launching-50-free-website-templates-react-nextjs-tailwind-css-44g7) - 50+ free website templates using React, Next.js, TypeScript, Tailwind Labs CSS, Easy UI is 100% Free...

35. [astro-themes · GitHub Topics · GitHub](https://github.com/topics/astro-themes) - Astroplate is a free starter template built with Astro, TailwindCSS & TypeScript providing everythin...

36. [Themes | Astro](https://astro.build/themes/1/?categories[]=landing-page) - A polished job board and hiring template with searchable job and company directories, detailed listi...

37. [Themes | Astro](https://astro.build/themes/) - 10 production-ready Astro themes in one pack - wellness, SaaS, AI, cyber security, automotive, consu...

38. [GitHub - lucide-icons/lucide: Beautiful & consistent icon ...](https://github.com/lucide-icons/lucide) - The library aims to make it easier for designers and developers to incorporate icons into their proj...

39. [Next.js Website Builder | Multi-Tenant & Self-Hosted for SaaS ...](https://www.chaibuilder.com/nextjs-website-builder) - Embed a self-hosted, multi-tenant visual website builder directly inside your Next.js application. P...

40. [@payloadcms/plugin-multi-tenant - NPM](https://www.npmjs.com/package/@payloadcms%2Fplugin-multi-tenant) - A plugin for Payload to easily manage multiple tenants from within your admin panel. After a tenant ...

41. [Build as many tenants as needed | Multi-tenancy with Payload](https://payloadcms.com/multi-tenancy) - Serve unique, branded environments across multiple domains—all from one codebase, with Payload's adm...

42. [Setup - React Email](https://react.email/docs/contributing/development-workflow/1-setup) - 1. Clone the repository. git ; 2. Install pnpm. npm ; 3. Install all the dependencies · pnpm ; 4. Li...

43. [Auth.js | React](https://authjs.dev/reference/nextjs/react) - It includes methods for signing in, signing out, hooks, and a React Context provider to wrap your ap...

44. [React Hook Form Resolvers and Integrations](https://react-hook-form.com/integrations) - Use React Hook Form with every official schema resolver, including Zod, Yup, Valibot, ArkType, AJV a...

45. [GitHub - Intro | Zod](https://zod.dev/) - Introduction ... Using Zod, you can define schemas you can use to validate data, from a simple strin...

46. [GitHub - medusajs/medusa: The world's most flexible commerce ...](https://github.com/medusajs/medusa) - Medusa's core commerce modules are open-source and freely available on npm. Enterprise Edition featu...

47. [Ecommerce Recipe - Medusa Documentation](https://docs.medusajs.com/resources/recipes/ecommerce) - Learn how to deploy the Medusa application and Next.js Starter Storefront. Along with the extensive ...

48. [Tap API Docs 1.0](https://developers.tap.company/) - Tap is on a mission to change how businesses and consumers in the Middle East accept and make paymen...

49. [Framer: Pricing](https://www.framer.com/pricing) - Compare Framer plans for websites, teams, and enterprises. Start free, then choose the right plan fo...

50. [How much is a Wix website?](https://www.wix.com/blog/how-much-is-a-wix-website) - Discover how much a Wix website costs with flexible pricing options. Learn how much is a Wix website...

