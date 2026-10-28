import { planRank, type Market, type PlanTier, type Prices } from "../models/builderShared";

/**
 * Website Builder price calculator. The server is the only source of truth for prices:
 * orders store the quote computed here, never numbers sent by the browser.
 * web/src/lib/builder.ts mirrors these rules for the live estimate; keep the two in step.
 */

export type QuotePlan = {
  tier: PlanTier;
  name: string;
  prices: Prices;
  quoted: boolean;
  includedPages: number;
  extraPagePrice: Record<Market, number>;
};
export type QuoteAddon = {
  key: string;
  name: string;
  prices: Prices;
  quoted: boolean;
  discountPercent: number;
  includedIn: PlanTier[];
  minPlan?: PlanTier;
};
export type QuoteConfig = { planTier: PlanTier; addonKeys: string[]; billing: "monthly" | "annual"; pageCount: number };

export type QuoteLine = {
  key: string;
  label: string;
  setup: number;
  monthly: number;
  /** Setup amount taken off by a bundle discount. */
  discount: number;
  included: boolean;
  quoted: boolean;
};

export type Quote = {
  currency: Market;
  lines: QuoteLine[];
  /** One-time total after discounts. */
  setup: number;
  /** Recurring monthly total. */
  monthly: number;
  billing: "monthly" | "annual";
  /** Annual billing: 12 months for the price of 10. */
  annual: number;
  discountTotal: number;
  /** Amount payable online now: 100% of fixed setup on Launch, otherwise 50%. "From" items are excluded. */
  deposit: number;
  /** True when part of the price is an estimate the team confirms. */
  hasQuotedItems: boolean;
  pages: { count: number; included: number; extra: number };
};

export class QuoteError extends Error {}

/** Annual billing gives two months free. */
export const ANNUAL_MONTHS_CHARGED = 10;

export function computeQuote(config: QuoteConfig, catalog: { plans: QuotePlan[]; addons: QuoteAddon[] }, market: Market): Quote {
  const plan = catalog.plans.find((p) => p.tier === config.planTier);
  if (!plan) throw new QuoteError(`Unknown plan: ${config.planTier}`);

  const lines: QuoteLine[] = [
    {
      key: `plan:${plan.tier}`,
      label: plan.name,
      setup: plan.prices[market].setup,
      monthly: plan.prices[market].monthly,
      discount: 0,
      included: false,
      quoted: plan.quoted,
    },
  ];

  // Pages beyond the plan's allowance are charged one by one.
  const pageCount = Math.max(1, Math.round(config.pageCount || 1));
  const extraPages = Math.max(0, pageCount - plan.includedPages);
  if (extraPages > 0) {
    lines.push({
      key: "pages:extra",
      label: `Extra pages (${extraPages})`,
      setup: extraPages * plan.extraPagePrice[market],
      monthly: 0,
      discount: 0,
      included: false,
      quoted: plan.quoted,
    });
  }

  const keys = [...new Set(config.addonKeys)];
  for (const key of keys) {
    const addon = catalog.addons.find((a) => a.key === key);
    if (!addon) throw new QuoteError(`Unknown add-on: ${key}`);
    if (addon.minPlan && planRank(config.planTier) < planRank(addon.minPlan)) {
      throw new QuoteError(`${addon.name} needs the ${addon.minPlan} plan or higher`);
    }
    const included = addon.includedIn.includes(config.planTier);
    const listSetup = included ? 0 : addon.prices[market].setup;
    const discount = Math.round((listSetup * addon.discountPercent) / 100);
    lines.push({
      key,
      label: addon.name,
      setup: listSetup - discount,
      monthly: included ? 0 : addon.prices[market].monthly,
      discount,
      included,
      quoted: addon.quoted,
    });
  }

  const setup = sum(lines.map((l) => l.setup));
  const monthly = sum(lines.map((l) => l.monthly));
  const fixedSetup = sum(lines.filter((l) => !l.quoted).map((l) => l.setup));
  const deposit = plan.quoted ? 0 : config.planTier === "launch" ? fixedSetup : Math.round(fixedSetup / 2);

  return {
    currency: market,
    lines,
    setup,
    monthly,
    billing: config.billing,
    annual: monthly * ANNUAL_MONTHS_CHARGED,
    discountTotal: sum(lines.map((l) => l.discount)),
    deposit,
    hasQuotedItems: lines.some((l) => l.quoted),
    pages: { count: pageCount, included: plan.includedPages, extra: extraPages },
  };
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
