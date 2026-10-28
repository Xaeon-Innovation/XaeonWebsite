"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricesSchema = exports.LocalizedSchema = exports.CORNER_STYLES = exports.THEME_MODES = exports.HERO_STYLES = exports.TEMPLATE_LAYOUTS = exports.COUNTRIES = exports.MARKETS = exports.PLAN_TIERS = exports.PAGE_KEYS = exports.BUILDER_CATEGORIES = void 0;
exports.isCountry = isCountry;
exports.marketFor = marketFor;
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
/** Industries; the website keeps matching labels in messages/*.json → builder.categories. */
exports.BUILDER_CATEGORIES = [
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
];
/**
 * Page library: a template offers a subset of these and the customer picks which to include.
 * Names, descriptions and the preview of each page live on the website (web/src/lib/builderPages.ts).
 */
exports.PAGE_KEYS = [
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
];
exports.PLAN_TIERS = ["launch", "business", "growth", "custom"];
/** Pricing markets: Egypt (EGP), Gulf (AED), international (USD). */
exports.MARKETS = ["EGP", "AED", "USD"];
/**
 * Where the customer's business is (ISO 3166-1 alpha-2). The country decides the pricing market, and so the
 * currency and payment options: Egypt → EGP, GCC → AED (the plan's Gulf price list), everywhere else → USD.
 * The website keeps the same rules in web/src/lib/builder.ts.
 */
exports.COUNTRIES = ("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
    "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
    "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
    "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT " +
    "MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
    "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG " +
    "UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW").split(" ");
const GCC = ["AE", "SA", "KW", "QA", "BH", "OM"];
function isCountry(value) {
    return typeof value === "string" && exports.COUNTRIES.includes(value);
}
function marketFor(country) {
    if (country === "EG")
        return "EGP";
    return GCC.includes(country) ? "AED" : "USD";
}
/** Look of a template; the website's live preview renders every combination. */
exports.TEMPLATE_LAYOUTS = ["classic", "bold", "minimal"];
exports.HERO_STYLES = ["split", "centered", "banner"];
exports.THEME_MODES = ["light", "dark"];
exports.CORNER_STYLES = ["sharp", "soft", "round"];
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
