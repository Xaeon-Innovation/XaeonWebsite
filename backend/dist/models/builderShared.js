"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricesSchema = exports.LocalizedSchema = exports.TEMPLATE_LAYOUTS = exports.COUNTRIES = exports.COUNTRY_MARKET = exports.MARKETS = exports.PLAN_TIERS = exports.BUILDER_CATEGORIES = void 0;
exports.planRank = planRank;
exports.isOneOf = isOneOf;
exports.toLocalized = toLocalized;
exports.toLocalizedList = toLocalizedList;
exports.toPrices = toPrices;
exports.toStringList = toStringList;
const mongoose_1 = require("mongoose");
/**
 * Shared vocabulary for the Website Builder (templates, add-ons, plans, orders).
 * See docs/website-builder/README.md.
 */
/** Launch verticals; the website keeps matching labels in messages/*.json → builder.categories. */
exports.BUILDER_CATEGORIES = ["clinics", "education", "professional", "restaurants", "home-services", "catalogue"];
exports.PLAN_TIERS = ["launch", "business", "growth", "custom"];
/** Pricing markets: Egypt (EGP), Gulf (AED), international (USD). */
exports.MARKETS = ["EGP", "AED", "USD"];
/**
 * Where the customer's business is. The country decides the pricing market (and so the currency and
 * payment options): Egypt → EGP, Gulf → AED (the plan's Gulf price list), everywhere else → USD.
 * The website keeps the same list in web/src/lib/builder.ts.
 */
exports.COUNTRY_MARKET = {
    EG: "EGP",
    AE: "AED",
    SA: "AED",
    KW: "AED",
    QA: "AED",
    BH: "AED",
    OM: "AED",
    JO: "USD",
    OTHER: "USD",
};
exports.COUNTRIES = Object.keys(exports.COUNTRY_MARKET);
exports.TEMPLATE_LAYOUTS = ["classic", "bold", "minimal"];
function planRank(tier) {
    return exports.PLAN_TIERS.indexOf(tier);
}
function isOneOf(list, value) {
    return list.includes(value);
}
exports.LocalizedSchema = new mongoose_1.Schema({
    en: { type: String, trim: true, default: "" },
    ar: { type: String, trim: true, default: "" },
}, { _id: false });
const PricePointSchema = new mongoose_1.Schema({
    setup: { type: Number, min: 0, default: 0 },
    monthly: { type: Number, min: 0, default: 0 },
}, { _id: false });
exports.PricesSchema = new mongoose_1.Schema({
    EGP: { type: PricePointSchema, default: () => ({}) },
    AED: { type: PricePointSchema, default: () => ({}) },
    USD: { type: PricePointSchema, default: () => ({}) },
}, { _id: false });
/** Admin input → `{en, ar}` (accepts a plain string as English). */
function toLocalized(value) {
    if (typeof value === "string")
        return { en: value.trim(), ar: "" };
    if (!value || typeof value !== "object")
        return undefined;
    const v = value;
    return {
        en: typeof v.en === "string" ? v.en.trim() : "",
        ar: typeof v.ar === "string" ? v.ar.trim() : "",
    };
}
function toLocalizedList(value) {
    if (!Array.isArray(value))
        return undefined;
    return value.map(toLocalized).filter((l) => !!l && (l.en !== "" || l.ar !== ""));
}
function toMoney(value) {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}
function toPrices(value) {
    if (!value || typeof value !== "object")
        return undefined;
    const v = value;
    return Object.fromEntries(exports.MARKETS.map((m) => [m, { setup: toMoney(v[m]?.setup), monthly: toMoney(v[m]?.monthly) }]));
}
function toStringList(value, max = 50) {
    if (!Array.isArray(value))
        return undefined;
    return value
        .filter((x) => typeof x === "string")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, max);
}
