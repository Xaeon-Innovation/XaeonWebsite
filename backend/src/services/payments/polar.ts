import crypto from "crypto";
import { header, WebhookSignatureError, type CheckoutInput, type PaymentProvider, type WebhookRequest } from "./types";

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

export function polarSignature(secret: string, id: string, timestamp: string, rawBody: Buffer): string {
  // Polar secrets may be given raw or with the Standard Webhooks "whsec_" base64 prefix.
  const key = secret.startsWith("whsec_") ? Buffer.from(secret.slice(6), "base64") : Buffer.from(secret, "utf8");
  return crypto.createHmac("sha256", key).update(`${id}.${timestamp}.`).update(rawBody).digest("base64");
}

export const polar: PaymentProvider = {
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

  async createCheckout(input: CheckoutInput) {
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
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Polar checkout failed (${res.status})`);
    const json = (await res.json()) as { id?: string; url?: string };
    if (!json.id || !json.url) throw new Error("Polar checkout response missing id/url");
    return { sessionId: json.id, url: json.url };
  },

  parseWebhook(req: WebhookRequest) {
    const { secret } = env();
    const id = header(req, "webhook-id");
    const timestamp = header(req, "webhook-timestamp");
    const signatures = header(req, "webhook-signature")
      .split(" ")
      .map((s) => s.split(",")[1])
      .filter(Boolean);
    if (!id || !timestamp || signatures.length === 0) throw new WebhookSignatureError("Missing webhook headers");
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) throw new WebhookSignatureError("Stale webhook");
    const expected = Buffer.from(polarSignature(secret, id, timestamp, req.rawBody));
    const ok = signatures.some((s) => {
      const given = Buffer.from(s);
      return given.length === expected.length && crypto.timingSafeEqual(given, expected);
    });
    if (!ok) throw new WebhookSignatureError("Bad Polar signature");

    const body = (req.body ?? {}) as { type?: string; data?: { id?: string; metadata?: Record<string, unknown>; checkout_id?: string } };
    if (body.type !== "order.paid") return null;
    const ref = typeof body.data?.metadata?.ref === "string" ? body.data.metadata.ref : "";
    if (!ref) return null;
    return { ref, status: "paid", sessionId: body.data?.checkout_id ?? body.data?.id, event: "polar.order.paid" };
  },
};
