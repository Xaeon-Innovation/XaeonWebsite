import { describe, expect, it } from "vitest";
import { computeQuote, QuoteError, type QuoteAddon, type QuotePlan } from "../src/utils/builderQuote";
import { ADDONS, PLANS } from "../scripts/builderCatalogData";

const plans: QuotePlan[] = PLANS.map((p) => ({ tier: p.tier, name: p.name.en, prices: p.prices, quoted: p.quoted }));
const addons: QuoteAddon[] = ADDONS.map((a) => ({
  key: a.key,
  name: a.name.en,
  prices: a.prices,
  quoted: a.quoted ?? false,
  discountPercent: a.discountPercent ?? 0,
  includedIn: a.includedIn ?? [],
  minPlan: a.minPlan,
}));
const catalog = { plans, addons };

describe("computeQuote", () => {
  it("Launch alone: full setup is the deposit", () => {
    const q = computeQuote({ planTier: "launch", addonKeys: [], billing: "monthly" }, catalog, "EGP");
    expect(q).toMatchObject({ currency: "EGP", setup: 7500, monthly: 650, deposit: 7500, discountTotal: 0, hasQuotedItems: false });
  });

  it("Business: 50% deposit, add-ons included in the plan cost nothing", () => {
    const q = computeQuote({ planTier: "business", addonKeys: ["blog", "booking"], billing: "monthly" }, catalog, "USD");
    const blog = q.lines.find((l) => l.key === "blog");
    expect(blog).toMatchObject({ setup: 0, included: true });
    expect(q.setup).toBe(625 + 95);
    expect(q.deposit).toBe(Math.round((625 + 95) / 2));
  });

  it("mobile app gets the 15% bundle discount and stays out of the deposit (from-price)", () => {
    const q = computeQuote({ planTier: "business", addonKeys: ["mobile-app"], billing: "monthly" }, catalog, "EGP");
    const app = q.lines.find((l) => l.key === "mobile-app")!;
    expect(app.discount).toBe(9000);
    expect(app.setup).toBe(51000);
    expect(q.discountTotal).toBe(9000);
    expect(q.hasQuotedItems).toBe(true);
    expect(q.deposit).toBe(16500 / 2);
  });

  it("annual billing charges 10 months", () => {
    const q = computeQuote({ planTier: "growth", addonKeys: [], billing: "annual" }, catalog, "AED");
    expect(q.annual).toBe(385 * 10);
  });

  it("Custom plan: no online deposit", () => {
    expect(computeQuote({ planTier: "custom", addonKeys: [], billing: "monthly" }, catalog, "EGP").deposit).toBe(0);
  });

  it("rejects unknown add-ons and add-ons above the plan", () => {
    expect(() => computeQuote({ planTier: "launch", addonKeys: ["nope"], billing: "monthly" }, catalog, "EGP")).toThrow(QuoteError);
    expect(() => computeQuote({ planTier: "launch", addonKeys: ["catalogue"], billing: "monthly" }, catalog, "EGP")).toThrow(/business/);
  });

  it("ignores duplicate add-on keys", () => {
    const q = computeQuote({ planTier: "launch", addonKeys: ["ai-content", "ai-content"], billing: "monthly" }, catalog, "EGP");
    expect(q.setup).toBe(7500 + 1500);
  });
});
