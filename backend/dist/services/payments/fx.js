"use strict";
/**
 * Exchange rates for charging a deposit in a different currency than the price list
 * (e.g. Gulf prices in AED, charged in USD because Kashier only charges EGP/USD/GBP/EUR).
 * Source: Kashier's public rate endpoint (no auth), https://developers.kashier.io/docs/accept-payments/currency-conversion
 * Rates are cached for an hour; if the lookup fails, USD-pegged Gulf currencies fall back to their official peg.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRate = getRate;
exports.convert = convert;
exports.resetFxCache = resetFxCache;
const TTL_MS = 60 * 60 * 1000;
/** Units of USD per 1 unit of a USD-pegged currency (central-bank pegs). */
const USD_PEGS = {
    AED: 1 / 3.6725,
    SAR: 1 / 3.75,
    QAR: 1 / 3.64,
    OMR: 1 / 0.3845,
    BHD: 1 / 0.376,
};
const cache = new Map();
function endpoint() {
    const live = process.env.KASHIER_MODE?.trim() === "live";
    return `${live ? "https://api.kashier.io" : "https://test-api.kashier.io"}/v3/payment/exchange-rate`;
}
/** 1 `from` = rate × `to`. Returns undefined when no rate is available. */
async function getRate(from, to) {
    if (from === to)
        return 1;
    const key = `${from}>${to}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS)
        return hit.rate;
    try {
        const res = await fetch(`${endpoint()}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
            signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
            const json = (await res.json());
            const rate = json.rates?.[to];
            if (typeof rate === "number" && rate > 0) {
                cache.set(key, { rate, at: Date.now() });
                return rate;
            }
        }
    }
    catch (err) {
        console.error(`[fx] ${key} lookup failed:`, err instanceof Error ? err.message : err);
    }
    if (to === "USD" && USD_PEGS[from])
        return USD_PEGS[from];
    return hit?.rate;
}
/** Charged amount in the target currency, rounded to cents. */
function convert(amount, rate) {
    return Math.round(amount * rate * 100) / 100;
}
/** For tests. */
function resetFxCache() {
    cache.clear();
}
