import { Schema } from "mongoose";

/**
 * Shared vocabulary for the Website Builder (templates, add-ons, plans, orders).
 * See docs/website-builder/README.md.
 */

/** Industries; the website keeps matching labels in messages/*.json → builder.categories. */
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

/**
 * Page library: a template offers a subset of these and the customer picks which to include.
 * Names, descriptions and the preview of each page live on the website (web/src/lib/builderPages.ts).
 */
export const PAGE_KEYS = [
  "home",
  "about",
  "services",
  "team",
  "booking",
  "contact",
  "gallery",
  "menu",
  "pricing",
  "blog",
  "faq",
  "testimonials",
  "products",
  "courses",
  "projects",
  "listings",
  "schedule",
  "careers",
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const PLAN_TIERS = ["launch", "business", "growth", "custom"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

/** Pricing markets: Egypt (EGP), Gulf (AED), international (USD). */
export const MARKETS = ["EGP", "AED", "USD"] as const;
export type Market = (typeof MARKETS)[number];

/**
 * Where the customer's business is (ISO 3166-1 alpha-2). The country decides the pricing market, and so the
 * currency and payment options: Egypt → EGP, GCC → AED (the plan's Gulf price list), everywhere else → USD.
 * The website keeps the same rules in web/src/lib/builder.ts.
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
export type Country = string;

const GCC = ["AE", "SA", "KW", "QA", "BH", "OM"];

export function isCountry(value: unknown): value is Country {
  return typeof value === "string" && COUNTRIES.includes(value);
}

export function marketFor(country: Country): Market {
  if (country === "EG") return "EGP";
  return GCC.includes(country) ? "AED" : "USD";
}

/** Look of a template; the website's live preview renders every combination. */
export const TEMPLATE_LAYOUTS = ["classic", "bold", "minimal"] as const;
export const HERO_STYLES = ["split", "centered", "banner"] as const;
export const THEME_MODES = ["light", "dark"] as const;
export const CORNER_STYLES = ["sharp", "soft", "round"] as const;
export type HeroStyle = (typeof HERO_STYLES)[number];
export type ThemeMode = (typeof THEME_MODES)[number];
export type CornerStyle = (typeof CORNER_STYLES)[number];

export type TemplateLayout = (typeof TEMPLATE_LAYOUTS)[number];

export function planRank(tier: PlanTier): number {
  return PLAN_TIERS.indexOf(tier);
}

export function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return (list as readonly unknown[]).includes(value);
}

export interface Localized {
  en: string;
  ar: string;
}

export interface PricePoint {
  setup: number;
  monthly: number;
}

export type Prices = Record<Market, PricePoint>;

export const LocalizedSchema = new Schema<Localized>(
  {
    en: { type: String, trim: true, default: "" },
    ar: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const PricePointSchema = new Schema<PricePoint>(
  {
    setup: { type: Number, min: 0, default: 0 },
    monthly: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

export const PricesSchema = new Schema<Prices>(
  {
    EGP: { type: PricePointSchema, default: () => ({}) },
    AED: { type: PricePointSchema, default: () => ({}) },
    USD: { type: PricePointSchema, default: () => ({}) },
  },
  { _id: false }
);

/** Admin input → `{en, ar}` (accepts a plain string as English). */
export function toLocalized(value: unknown): Localized | undefined {
  if (typeof value === "string") return { en: value.trim(), ar: "" };
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  return {
    en: typeof v.en === "string" ? v.en.trim() : "",
    ar: typeof v.ar === "string" ? v.ar.trim() : "",
  };
}

export function toLocalizedList(value: unknown): Localized[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(toLocalized).filter((l): l is Localized => !!l && (l.en !== "" || l.ar !== ""));
}

function toMoney(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function toPrices(value: unknown): Prices | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, Record<string, unknown> | undefined>;
  return Object.fromEntries(
    MARKETS.map((m) => [m, { setup: toMoney(v[m]?.setup), monthly: toMoney(v[m]?.monthly) }])
  ) as Prices;
}

export function toStringList(value: unknown, max = 50): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max);
}
