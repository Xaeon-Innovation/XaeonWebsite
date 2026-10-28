/**
 * Shared types + form helpers for the Website Builder admin pages
 * (Pages/admin/Builder*Page.tsx, StarsPage.tsx). API: backend/src/routes/builderAdmin.routes.ts.
 */

export const BUILDER_CATEGORIES = ["clinics", "beauty", "fitness", "education", "professional", "real-estate", "restaurants", "home-services", "catalogue", "startups"] as const;
export const CATEGORY_LABELS: Record<string, string> = {
  clinics: "Clinics & healthcare",
  beauty: "Beauty & wellness",
  fitness: "Fitness & sports",
  education: "Education & training",
  professional: "Professional services",
  "real-estate": "Real estate",
  restaurants: "Restaurants & cafés",
  "home-services": "Home services & contractors",
  catalogue: "Product catalogue / store",
  startups: "Startups & tech",
};
/** Page library (same keys as backend PAGE_KEYS); the website shows each page's name, contents and preview. */
export const PAGE_KEYS = ["home", "about", "services", "team", "booking", "contact", "gallery", "menu", "pricing", "blog", "faq", "testimonials", "products", "courses", "projects", "listings", "schedule", "careers"] as const;
export const HERO_STYLES = ["split", "centered", "banner"] as const;
export const THEME_MODES = ["light", "dark"] as const;
export const CORNER_STYLES = ["sharp", "soft", "round"] as const;
export const GOAL_KEYS = ["calls", "bookings", "leads", "sales", "catalogue"] as const;
export const PLAN_TIERS = ["launch", "business", "growth", "custom"] as const;
export const MARKETS = ["EGP", "AED", "USD"] as const;
export const LAYOUTS = ["classic", "bold", "minimal"] as const;

export type Localized = { en: string; ar: string };
export type Prices = Record<(typeof MARKETS)[number], { setup: number; monthly: number }>;

export const ADMIN_BUILDER = "/admin/builder";

/** "English | Arabic" per line ⇄ Localized[] — compact bilingual list editing. */
export function linesToLocalized(text: string | undefined): Localized[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [en, ...ar] = line.split("|");
      return { en: en.trim(), ar: ar.join("|").trim() };
    });
}

export function localizedToLines(list: Localized[] | undefined): string {
  return (list ?? []).map((l) => (l.ar ? `${l.en} | ${l.ar}` : l.en)).join("\n");
}

/** Flat form fields price_EGP_setup … ⇄ Prices. */
export type PriceFields = Record<`price_${(typeof MARKETS)[number]}_${"setup" | "monthly"}`, number>;

export function pricesToFields(p: Prices | undefined): PriceFields {
  const out = {} as PriceFields;
  for (const m of MARKETS) {
    out[`price_${m}_setup`] = p?.[m]?.setup ?? 0;
    out[`price_${m}_monthly`] = p?.[m]?.monthly ?? 0;
  }
  return out;
}

export function fieldsToPrices(f: Partial<PriceFields>): Prices {
  return Object.fromEntries(
    MARKETS.map((m) => [m, { setup: Number(f[`price_${m}_setup`] ?? 0), monthly: Number(f[`price_${m}_monthly`] ?? 0) }]),
  ) as Prices;
}

export function formatPrice(p: Prices | undefined, m: (typeof MARKETS)[number] = "EGP"): string {
  if (!p?.[m]) return "—";
  const { setup, monthly } = p[m];
  return `${m} ${setup.toLocaleString()}${monthly ? ` + ${monthly.toLocaleString()}/mo` : ""}`;
}

export const ORDER_STATUSES = ["submitted", "awaiting_payment", "paid", "in_build", "launched", "cancelled"] as const;
export const ORDER_STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  submitted: { label: "Submitted", badge: "admin-badge-blue" },
  awaiting_payment: { label: "Awaiting payment", badge: "admin-badge-amber" },
  paid: { label: "Deposit paid", badge: "admin-badge-green" },
  in_build: { label: "In build", badge: "admin-badge-blue" },
  launched: { label: "Launched", badge: "admin-badge-green" },
  cancelled: { label: "Cancelled", badge: "admin-badge-gray" },
};
