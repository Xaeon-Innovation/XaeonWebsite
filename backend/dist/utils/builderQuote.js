"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANNUAL_MONTHS_CHARGED = exports.QuoteError = void 0;
exports.computeQuote = computeQuote;
const builderShared_1 = require("../models/builderShared");
class QuoteError extends Error {
}
exports.QuoteError = QuoteError;
/** Annual billing gives two months free. */
exports.ANNUAL_MONTHS_CHARGED = 10;
function computeQuote(config, catalog, market) {
    const plan = catalog.plans.find((p) => p.tier === config.planTier);
    if (!plan)
        throw new QuoteError(`Unknown plan: ${config.planTier}`);
    const lines = [
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
        if (!addon)
            throw new QuoteError(`Unknown add-on: ${key}`);
        if (addon.minPlan && (0, builderShared_1.planRank)(config.planTier) < (0, builderShared_1.planRank)(addon.minPlan)) {
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
        annual: monthly * exports.ANNUAL_MONTHS_CHARGED,
        discountTotal: sum(lines.map((l) => l.discount)),
        deposit,
        hasQuotedItems: lines.some((l) => l.quoted),
        pages: { count: pageCount, included: plan.includedPages, extra: extraPages },
    };
}
function sum(values) {
    return values.reduce((a, b) => a + b, 0);
}
