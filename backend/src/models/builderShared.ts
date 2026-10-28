import { Schema } from "mongoose";

/**
 * Shared vocabulary for the Website Builder (templates, add-ons, plans, orders).
 * See docs/website-builder/README.md.
 */

/** Launch verticals; the website keeps matching labels in messages/*.json → builder.categories. */
export const BUILDER_CATEGORIES = ["clinics", "education", "professional", "restaurants", "home-services", "catalogue"] as const;
export type BuilderCategory = (typeof BUILDER_CATEGORIES)[number];

export const PLAN_TIERS = ["launch", "business", "growth", "custom"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

/** Pricing markets: Egypt (EGP), Gulf (AED), international (USD). */
export const MARKETS = ["EGP", "AED", "USD"] as const;
export type Market = (typeof MARKETS)[number];

/**
 * Where the customer's business is. The country decides the pricing market (and so the currency and
 * payment options): Egypt → EGP, Gulf → AED (the plan's Gulf price list), everywhere else → USD.
 * The website keeps the same list in web/src/lib/builder.ts.
 */
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

export const TEMPLATE_LAYOUTS = ["classic", "bold", "minimal"] as const;
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
