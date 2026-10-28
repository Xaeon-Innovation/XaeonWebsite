"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.polar = void 0;
exports.polarSignature = polarSignature;
const crypto_1 = __importDefault(require("crypto"));
const types_1 = require("./types");
/**
 * Polar (polar.sh, merchant of record, USD) — useful for international customers.
 * - Checkout: POST /v1/checkouts/ for a "pay what you want" product (POLAR_DEPOSIT_PRODUCT_ID) with the
 *   deposit as `amount` (cents) and the order ref in metadata.
 * - Webhook: Standard Webhooks signature (`webhook-id`, `webhook-timestamp`, `webhook-signature: v1,<base64>`),
 *   HMAC-SHA256 of `${id}.${timestamp}.${rawBody}` keyed with the webhook secret's UTF-8 bytes.
 *   We act on `order.paid`.
 * Env: POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, POLAR_DEPOSIT_PRODUCT_ID, POLAR_MODE (sandbox|live).
 */
const TOLERANCE_SECONDS = 5 * 60;
function env() {
    return {
        token: process.env.POLAR_ACCESS_TOKEN?.trim() ?? "",
        secret: process.env.POLAR_WEBHOOK_SECRET?.trim() ?? "",
        productId: process.env.POLAR_DEPOSIT_PRODUCT_ID?.trim() ?? "",
        apiBase: process.env.POLAR_MODE?.trim() === "live" ? "https://api.polar.sh" : "https://sandbox-api.polar.sh",
    };
}
function polarSignature(secret, id, timestamp, rawBody) {
    // Polar secrets may be given raw or with the Standard Webhooks "whsec_" base64 prefix.
    const key = secret.startsWith("whsec_") ? Buffer.from(secret.slice(6), "base64") : Buffer.from(secret, "utf8");
    return crypto_1.default.createHmac("sha256", key).update(`${id}.${timestamp}.`).update(rawBody).digest("base64");
}
exports.polar = {
    name: "polar",
    configured() {
        const { token, secret, productId } = env();
        return token !== "" && secret !== "" && productId !== "";
    },
    supports(currency) {
        return currency === "USD";
    },
    methods() {
        return ["card"];
    },
    async createCheckout(input) {
        const { token, productId, apiBase } = env();
        const res = await fetch(`${apiBase}/v1/checkouts/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                products: [productId],
                amount: Math.round(input.amount * 100),
                customer_email: input.customer.email,
                customer_name: input.customer.name,
                metadata: { ref: input.ref },
                success_url: input.returnUrl,
            }),
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok)
            throw new Error(`Polar checkout failed (${res.status})`);
        const json = (await res.json());
        if (!json.id || !json.url)
            throw new Error("Polar checkout response missing id/url");
        return { sessionId: json.id, url: json.url };
    },
    parseWebhook(req) {
        const { secret } = env();
        const id = (0, types_1.header)(req, "webhook-id");
        const timestamp = (0, types_1.header)(req, "webhook-timestamp");
        const signatures = (0, types_1.header)(req, "webhook-signature")
            .split(" ")
            .map((s) => s.split(",")[1])
            .filter(Boolean);
        if (!id || !timestamp || signatures.length === 0)
            throw new types_1.WebhookSignatureError("Missing webhook headers");
        if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS)
            throw new types_1.WebhookSignatureError("Stale webhook");
        const expected = Buffer.from(polarSignature(secret, id, timestamp, req.rawBody));
        const ok = signatures.some((s) => {
            const given = Buffer.from(s);
            return given.length === expected.length && crypto_1.default.timingSafeEqual(given, expected);
        });
        if (!ok)
            throw new types_1.WebhookSignatureError("Bad Polar signature");
        const body = (req.body ?? {});
        if (body.type !== "order.paid")
            return null;
        const ref = typeof body.data?.metadata?.ref === "string" ? body.data.metadata.ref : "";
        if (!ref)
            return null;
        return { ref, status: "paid", sessionId: body.data?.checkout_id ?? body.data?.id, event: "polar.order.paid" };
    },
};
