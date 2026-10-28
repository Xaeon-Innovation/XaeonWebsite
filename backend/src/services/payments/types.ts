/**
 * Payment providers sit behind this interface so the builder doesn't care which gateway is used.
 * Setup docs: docs/website-builder/payments.md
 */

export type CheckoutInput = {
  /** Builder order ref, e.g. XB-7KQ2MD; providers echo it back in webhooks. */
  ref: string;
  /** Whole currency units (EGP 8,250 → 8250). */
  amount: number;
  currency: string;
  description: string;
  customer: { name: string; email: string; phone: string };
  locale: "en" | "ar";
  /** Where the customer lands after paying (the website's success page). */
  returnUrl: string;
  /** Public URL of our webhook for this provider. */
  webhookUrl: string;
};

export type CheckoutSession = { sessionId: string; url: string };

export type WebhookRequest = {
  headers: Record<string, string | string[] | undefined>;
  /** Exact request bytes (signatures are computed over these). */
  rawBody: Buffer;
  body: unknown;
};

export type WebhookResult = {
  ref: string;
  status: "paid" | "failed" | "pending";
  sessionId?: string;
  event: string;
};

export interface PaymentProvider {
  name: string;
  /** Has its credentials configured. */
  configured(): boolean;
  supports(currency: string): boolean;
  /** Payment methods shown to the customer, e.g. ["card", "wallet"]. */
  methods(): string[];
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  /**
   * Verifies the signature and extracts the order outcome.
   * Throws WebhookSignatureError on a bad signature; returns null for events we ignore.
   */
  parseWebhook(req: WebhookRequest): WebhookResult | null;
}

export class WebhookSignatureError extends Error {}

export function header(req: WebhookRequest, name: string): string {
  const v = req.headers[name.toLowerCase()];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}
