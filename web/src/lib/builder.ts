/**
 * Website Builder shared types and helpers (server + client).
 * Catalog comes from GET /api/v1/builder/catalog (backend/src/controllers/builder.controller.ts).
 * `estimateQuote` mirrors backend/src/utils/builderQuote.ts for the live estimate; the server's quote is final.
 */

export const BUILDER_CATEGORIES = ["clinics", "education", "professional", "restaurants", "home-services", "catalogue"] as const;
export type BuilderCategory = (typeof BUILDER_CATEGORIES)[number];
export const PLAN_TIERS = ["launch", "business", "growth", "custom"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];
export const MARKETS = ["EGP", "AED", "USD"] as const;
export type Market = (typeof MARKETS)[number];
/** Business country → pricing market. Mirrors COUNTRY_MARKET in backend/src/models/builderShared.ts. */
export const COUNTRY_MARKET = {
  EG: "EGP",
  AE: "AED",
  SA: "AED",
  KW: "AED",
  QA: "AED",
  BH: "AED",
  OM: "AED",
  JO: "USD",
  OTHER: "USD",
} as const satisfies Record<string, Market>;
export type Country = keyof typeof COUNTRY_MARKET;
export const COUNTRIES = Object.keys(COUNTRY_MARKET) as Country[];

export const GOALS = ["calls", "bookings", "leads", "sales", "catalogue"] as const;
export type Goal = (typeof GOALS)[number];
export const FONTS = ["modern", "rounded", "serif", "display"] as const;
export type FontKey = (typeof FONTS)[number];
export const TONES = ["friendly", "professional", "premium", "playful"] as const;

export type Localized = { en: string; ar: string };
export type Prices = Record<Market, { setup: number; monthly: number }>;

export type BuilderTemplate = {
  slug: string;
  category: BuilderCategory;
  name: Localized;
  tagline: Localized;
  previewImageUrl?: string;
  layout: "classic" | "bold" | "minimal";
  defaultBrand: { primary: string; accent: string; font: string };
  pages: Localized[];
  features: Localized[];
  recommendedAddons: string[];
  minPlan: PlanTier;
};

export type BuilderAddon = {
  key: string;
  kind: "module" | "service";
  name: Localized;
  description: Localized;
  icon?: string;
  prices: Prices;
  quoted: boolean;
  discountPercent: number;
  badge?: Localized;
  includedIn: PlanTier[];
  minPlan?: PlanTier;
  categories: BuilderCategory[];
};

export type BuilderPlan = {
  tier: PlanTier;
  name: Localized;
  summary: Localized;
  prices: Prices;
  quoted: boolean;
  features: Localized[];
  highlighted: boolean;
};

/** How a customer in this market can pay the deposit (from the API's configured providers). */
export type PaymentOption = {
  online: boolean;
  provider?: string;
  methods: string[];
  /** Set when the provider can't charge the price-list currency (e.g. AED → charged in USD at Kashier's rate). */
  chargeCurrency?: string;
  rate?: number;
};

export type BuilderCatalog = {
  templates: BuilderTemplate[];
  addons: BuilderAddon[];
  plans: BuilderPlan[];
  payments: Partial<Record<Market, PaymentOption>>;
};

export function loc(value: Localized | undefined, locale: string): string {
  if (!value) return "";
  return (locale === "ar" ? value.ar || value.en : value.en || value.ar) ?? "";
}

export function planRank(tier: PlanTier): number {
  return PLAN_TIERS.indexOf(tier);
}

/** CSS font stacks for the preview. System/loaded fonts only — no extra downloads. */
export const FONT_STACKS: Record<FontKey, string> = {
  modern: "var(--font-jakarta), var(--font-plex-arabic), system-ui, sans-serif",
  rounded: "ui-rounded, 'SF Pro Rounded', 'Nunito', var(--font-plex-arabic), system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', var(--font-plex-arabic), serif",
  display: "var(--font-unbounded), var(--font-plex-arabic), system-ui, sans-serif",
};

export function fontStack(font: string): string {
  return FONT_STACKS[(FONTS as readonly string[]).includes(font) ? (font as FontKey) : "modern"];
}

/** WCAG relative luminance of a #rrggbb colour. */
export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Readable text colour on top of `bg`. */
export function onColor(bg: string): string {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#111111") ? "#ffffff" : "#111111";
}

export type QuoteLine = { key: string; setup: number; monthly: number; discount: number; included: boolean; quoted: boolean };
export type QuoteEstimate = {
  currency: Market;
  lines: QuoteLine[];
  setup: number;
  monthly: number;
  annual: number;
  deposit: number;
  discountTotal: number;
  hasQuotedItems: boolean;
};

export function estimateQuote(
  catalog: BuilderCatalog,
  sel: { planTier: PlanTier; addonKeys: string[]; market: Market },
): QuoteEstimate | null {
  const plan = catalog.plans.find((p) => p.tier === sel.planTier);
  if (!plan) return null;
  const lines: QuoteLine[] = [
    { key: `plan:${plan.tier}`, setup: plan.prices[sel.market].setup, monthly: plan.prices[sel.market].monthly, discount: 0, included: false, quoted: plan.quoted },
  ];
  for (const key of new Set(sel.addonKeys)) {
    const a = catalog.addons.find((x) => x.key === key);
    if (!a || (a.minPlan && planRank(sel.planTier) < planRank(a.minPlan))) continue;
    const included = a.includedIn.includes(sel.planTier);
    const list = included ? 0 : a.prices[sel.market].setup;
    const discount = Math.round((list * a.discountPercent) / 100);
    lines.push({ key, setup: list - discount, monthly: included ? 0 : a.prices[sel.market].monthly, discount, included, quoted: a.quoted });
  }
  const sum = (xs: number[]) => xs.reduce((x, y) => x + y, 0);
  const setup = sum(lines.map((l) => l.setup));
  const monthly = sum(lines.map((l) => l.monthly));
  const fixed = sum(lines.filter((l) => !l.quoted).map((l) => l.setup));
  return {
    currency: sel.market,
    lines,
    setup,
    monthly,
    annual: monthly * 10,
    deposit: plan.quoted ? 0 : sel.planTier === "launch" ? fixed : Math.round(fixed / 2),
    discountTotal: sum(lines.map((l) => l.discount)),
    hasQuotedItems: lines.some((l) => l.quoted),
  };
}

export function formatMoney(amount: number, currency: Market, locale: string, decimals = 0): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/* ───────────── galaxy ───────────── */

export type Star = {
  _id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
  product: "website" | "app" | "polara" | "velora" | "custom";
  constellation?: string;
  country?: string;
  since?: number;
  magnitude: number;
  highlight?: string;
  caseStudy?: { slug: string; title: string } | null;
  url?: string;
};
