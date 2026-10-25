"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAttribution = parseAttribution;
exports.attributionChannel = attributionChannel;
exports.attributionRows = attributionRows;
const STRING_FIELDS = [
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmTerm",
    "utmContent",
    "gclid",
    "fbclid",
    "referrer",
    "landingPage",
];
const MAX_LEN = 300;
/** Untrusted client input → clean attribution (strings trimmed and capped), or undefined if empty. */
function parseAttribution(raw) {
    if (!raw || typeof raw !== "object")
        return undefined;
    const input = raw;
    const out = {};
    for (const key of STRING_FIELDS) {
        const value = input[key];
        if (typeof value === "string" && value.trim() !== "") {
            out[key] = value.trim().slice(0, MAX_LEN);
        }
    }
    if (typeof input.firstSeenAt === "string") {
        const d = new Date(input.firstSeenAt);
        // Ignore garbage and anything in the future (clock skew allowance: 1 day).
        if (!Number.isNaN(d.getTime()) && d.getTime() < Date.now() + 86400000)
            out.firstSeenAt = d;
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
/** Human channel label, e.g. "google / cpc" or "Referral: linkedin.com" or "Direct". */
function attributionChannel(a) {
    if (!a)
        return "Direct";
    if (a.utmSource)
        return a.utmMedium ? `${a.utmSource} / ${a.utmMedium}` : a.utmSource;
    if (a.gclid)
        return "google / cpc";
    if (a.fbclid)
        return "facebook / paid-social";
    if (a.referrer) {
        try {
            return `Referral: ${new URL(a.referrer).hostname.replace(/^www\./, "")}`;
        }
        catch {
            return "Referral";
        }
    }
    return "Direct";
}
/** Label/value rows for staff notification emails. */
function attributionRows(a) {
    const rows = [["Lead source", attributionChannel(a)]];
    if (a?.utmCampaign)
        rows.push(["Campaign", a.utmCampaign]);
    if (a?.landingPage)
        rows.push(["Landing page", a.landingPage]);
    return rows;
}
