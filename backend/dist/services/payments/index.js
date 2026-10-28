"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvider = getProvider;
exports.providerFor = providerFor;
exports.paymentPlan = paymentPlan;
exports.paymentOptions = paymentOptions;
const kashier_1 = require("./kashier");
const polar_1 = require("./polar");
const fx_1 = require("./fx");
__exportStar(require("./types"), exports);
const ALL = { kashier: kashier_1.kashier, polar: polar_1.polar };
function getProvider(name) {
    return ALL[name];
}
/**
 * First configured provider in PAYMENT_PROVIDERS (comma list, in priority order, e.g. "kashier,polar")
 * that accepts this currency. None → the order is saved and the team sends a payment link manually.
 */
function providerFor(currency) {
    const names = (process.env.PAYMENT_PROVIDERS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return names
        .map((n) => ALL[n])
        .find((p) => !!p && p.configured() && p.supports(currency));
}
/** Currency used when a provider can't charge the price-list currency (Kashier: EGP, USD, GBP, EUR only). */
const FALLBACK_CHARGE_CURRENCY = "USD";
/**
 * How a deposit priced in `currency` is paid online: directly if a provider charges that currency,
 * otherwise converted to USD at Kashier's rate. Undefined → no online payment (the team invoices).
 */
async function paymentPlan(currency) {
    const direct = providerFor(currency);
    if (direct)
        return { provider: direct, chargeCurrency: currency, rate: 1 };
    const converted = providerFor(FALLBACK_CHARGE_CURRENCY);
    if (!converted)
        return undefined;
    const rate = await (0, fx_1.getRate)(currency, FALLBACK_CHARGE_CURRENCY);
    return rate ? { provider: converted, chargeCurrency: FALLBACK_CHARGE_CURRENCY, rate } : undefined;
}
/** What the builder tells a customer about paying in this currency (shown after they pick their country). */
async function paymentOptions(currency) {
    const plan = await paymentPlan(currency);
    if (!plan)
        return { online: false, methods: [] };
    return {
        online: true,
        provider: plan.provider.name,
        methods: plan.provider.methods(),
        ...(plan.chargeCurrency !== currency ? { chargeCurrency: plan.chargeCurrency, rate: plan.rate } : {}),
    };
}
