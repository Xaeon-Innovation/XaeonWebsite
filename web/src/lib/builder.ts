/**
 * Website Builder shared types and helpers (server + client).
 * Catalog comes from GET /api/v1/builder/catalog (backend/src/controllers/builder.controller.ts).
 * `estimateQuote` mirrors backend/src/utils/builderQuote.ts for the live estimate; the server's quote is final.
 */

export const BUILDER_CATEGORIES = [
  "clinics",
  "beauty",
  "fitness",
  "education",
  "professional",
  "real-estate",
  "restaurants",
  "home-services",
  "catalogue",
  "startups",
] as const;
export type BuilderCategory = (typeof BUILDER_CATEGORIES)[number];
export const PLAN_TIERS = ["launch", "business", "growth", "custom"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];
export const MARKETS = ["EGP", "AED", "USD"] as const;
export type Market = (typeof MARKETS)[number];
/**
 * Any ISO 3166-1 country can be chosen; it decides the pricing market. Mirrors marketFor() in
 * backend/src/models/builderShared.ts: Egypt → EGP, GCC → AED, everywhere else → USD.
 */
export const COUNTRIES = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
  "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT " +
  "MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
  "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG " +
  "UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW"
).split(" ");
/** Shown first in the country list. */
export const POPULAR_COUNTRIES = ["EG", "SA", "AE", "KW", "QA", "BH", "OM", "JO"];
const GCC = ["AE", "SA", "KW", "QA", "BH", "OM"];

export function marketFor(country: string | undefined): Market {
  if (country === "EG") return "EGP";
  return country && GCC.includes(country) ? "AED" : "USD";
}

export const GOALS = ["calls", "bookings", "leads", "sales", "catalogue"] as const;
export type Goal = (typeof GOALS)[number];
export const FONTS = ["modern", "rounded", "serif", "display"] as const;
export type FontKey = (typeof FONTS)[number];
export const TONES = ["friendly", "professional", "premium", "playful"] as const;

export type Localized = { en: string; ar: string };
export type Prices = Record<Market, { setup: number; monthly: number }>;

export type Layout = "classic" | "bold" | "minimal";
export type HeroStyle = "split" | "centered" | "banner";
export type ThemeMode = "light" | "dark";
export type CornerStyle = "sharp" | "soft" | "round";
export const PAGE_KEYS = [
  "home", "about", "services", "team", "booking", "contact", "gallery", "menu", "pricing",
  "blog", "faq", "testimonials", "products", "courses", "projects", "listings", "schedule", "careers",
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export type BuilderTemplate = {
  slug: string;
  category: BuilderCategory;
  name: Localized;
  tagline: Localized;
  previewImageUrl?: string;
  layout: Layout;
  hero: HeroStyle;
  mode: ThemeMode;
  corners: CornerStyle;
  defaultBrand: { primary: string; accent: string; font: string };
  pageKeys: PageKey[];
  defaultPages: PageKey[];
  tags: Localized[];
  goals: string[];
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
  includedPages: number;
  extraPagePrice: Record<Market, number>;
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
  pages: { count: number; included: number; extra: number };
};

export function estimateQuote(
  catalog: BuilderCatalog,
  sel: { planTier: PlanTier; addonKeys: string[]; market: Market; pageCount: number },
): QuoteEstimate | null {
  const plan = catalog.plans.find((p) => p.tier === sel.planTier);
  if (!plan) return null;
  const lines: QuoteLine[] = [
    { key: `plan:${plan.tier}`, setup: plan.prices[sel.market].setup, monthly: plan.prices[sel.market].monthly, discount: 0, included: false, quoted: plan.quoted },
  ];
  const pageCount = Math.max(1, sel.pageCount);
  const included = plan.includedPages ?? 5;
  const extra = Math.max(0, pageCount - included);
  if (extra > 0) {
    lines.push({ key: "pages:extra", setup: extra * (plan.extraPagePrice?.[sel.market] ?? 0), monthly: 0, discount: 0, included: false, quoted: plan.quoted });
  }
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
    pages: { count: pageCount, included, extra },
  };
}

/**
 * Best-value plan for what the customer picked: the cheapest first year (setup + 12 months) among fixed-price
 * plans their template and features allow. Custom ("from" pricing) is never auto-recommended.
 */
export function recommendPlan(
  catalog: BuilderCatalog,
  sel: { addonKeys: string[]; market: Market; pageCount: number; minTier: PlanTier },
): PlanTier {
  let best: { tier: PlanTier; cost: number } | null = null;
  for (const plan of catalog.plans) {
    if (plan.quoted || planRank(plan.tier) < planRank(sel.minTier)) continue;
    const q = estimateQuote(catalog, { planTier: plan.tier, addonKeys: sel.addonKeys, market: sel.market, pageCount: sel.pageCount });
    if (!q) continue;
    const cost = q.setup + q.monthly * 12;
    if (!best || cost < best.cost) best = { tier: plan.tier, cost };
  }
  return best?.tier ?? sel.minTier;
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
