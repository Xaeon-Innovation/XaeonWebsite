import crypto from "crypto";
import { header, WebhookSignatureError, type CheckoutInput, type PaymentProvider, type WebhookRequest } from "./types";

/**
 * Kashier (Egypt) Hosted Payment Page.
 * - Checkout: redirect to payments.kashier.io with an HMAC-SHA256 "order hash" of
 *   `/?payment=<merchantId>.<orderId>.<amount>.<currency>` keyed with the payment API key.
 * - Webhook: POST JSON `{ event, data }`; `x-kashier-signature` is HMAC-SHA256 (hex, same key) of the
 *   query string built from `data[k]` for the sorted `data.signatureKeys`.
 * Env: KASHIER_MERCHANT_ID, KASHIER_API_KEY, KASHIER_MODE (test|live),
 *      KASHIER_CURRENCIES (enabled on the merchant account, default "EGP,USD"),
 *      KASHIER_METHODS (HPP allowedMethods, default "card,wallet"; e.g. add "bank_installments").
 * Verify both formats against Kashier's current docs before going live (docs/website-builder/payments.md).
 */

const HPP_URL = "https://payments.kashier.io/";
const list = (value: string | undefined, fallback: string) =>
  (value?.trim() || fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

function env() {
  return {
    merchantId: process.env.KASHIER_MERCHANT_ID?.trim() ?? "",
    apiKey: process.env.KASHIER_API_KEY?.trim() ?? "",
    mode: process.env.KASHIER_MODE?.trim() === "live" ? "live" : "test",
  };
}

function hmacHex(key: string, payload: string): string {
  return crypto.createHmac("sha256", key).update(payload).digest("hex");
}

export function kashierOrderHash(merchantId: string, orderId: string, amount: string, currency: string, apiKey: string): string {
  return hmacHex(apiKey, `/?payment=${merchantId}.${orderId}.${amount}.${currency}`);
}

/** RFC 3986 encoding, matching the `query-string` package Kashier's samples use. */
function strictEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function kashierSignaturePayload(data: Record<string, unknown>): string {
  const keys = Array.isArray(data.signatureKeys) ? (data.signatureKeys as unknown[]).filter((k): k is string => typeof k === "string") : [];
  return [...keys]
    .sort()
    .filter((k) => data[k] !== undefined && data[k] !== null)
    .map((k) => `${strictEncode(k)}=${strictEncode(String(data[k]))}`)
    .join("&");
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export const kashier: PaymentProvider = {
  name: "kashier",

  configured() {
    const { merchantId, apiKey } = env();
    return merchantId !== "" && apiKey !== "";
  },

  supports(currency) {
    return list(process.env.KASHIER_CURRENCIES, "EGP,USD").map((c) => c.toUpperCase()).includes(currency);
  },

  methods() {
    return list(process.env.KASHIER_METHODS, "card,wallet");
  },

  async createCheckout(input: CheckoutInput) {
    const { merchantId, apiKey, mode } = env();
    const amount = input.amount.toFixed(2);
    const params = new URLSearchParams({
      merchantId,
      orderId: input.ref,
      amount,
      currency: input.currency,
      hash: kashierOrderHash(merchantId, input.ref, amount, input.currency, apiKey),
      mode,
      merchantRedirect: input.returnUrl,
      serverWebhook: input.webhookUrl,
      redirectMethod: "get",
      display: input.locale,
      failureRedirect: "true",
      allowedMethods: kashier.methods().join(","),
      metaData: JSON.stringify({ ref: input.ref }),
    });
    return { sessionId: input.ref, url: `${HPP_URL}?${params.toString()}` };
  },

  parseWebhook(req: WebhookRequest) {
    const { apiKey } = env();
    const body = (req.body ?? {}) as { event?: string; data?: Record<string, unknown> };
    const data = body.data;
    if (!data || typeof data !== "object") throw new WebhookSignatureError("Missing data");
    const expected = hmacHex(apiKey, kashierSignaturePayload(data));
    if (!safeEqualHex(expected, header(req, "x-kashier-signature"))) throw new WebhookSignatureError("Bad Kashier signature");

    const event = String(body.event ?? "");
    if (event !== "pay") return null;
    const ref = String(data.merchantOrderId ?? "");
    if (!ref) return null;
    const status = String(data.status ?? data.paymentStatus ?? "").toUpperCase();
    return {
      ref,
      status: status === "SUCCESS" ? "paid" : status === "FAILURE" || status === "FAILED" ? "failed" : "pending",
      sessionId: typeof data.transactionId === "string" ? data.transactionId : undefined,
      ...(data.amount !== undefined && Number.isFinite(Number(data.amount)) ? { amount: Number(data.amount) } : {}),
      ...(typeof data.currency === "string" ? { currency: data.currency.toUpperCase() } : {}),
      event: `kashier.${event}.${status.toLowerCase()}`,
    };
  },
};
