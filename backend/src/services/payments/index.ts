import { kashier } from "./kashier";
import { polar } from "./polar";
import type { PaymentProvider } from "./types";

export * from "./types";

const ALL: Record<string, PaymentProvider> = { kashier, polar };

export function getProvider(name: string): PaymentProvider | undefined {
  return ALL[name];
}

/**
 * First configured provider in PAYMENT_PROVIDERS (comma list, in priority order, e.g. "kashier,polar")
 * that accepts this currency. None → the order is saved and the team sends a payment link manually.
 */
export function providerFor(currency: string): PaymentProvider | undefined {
  const names = (process.env.PAYMENT_PROVIDERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return names
    .map((n) => ALL[n])
    .find((p): p is PaymentProvider => !!p && p.configured() && p.supports(currency));
}

export type PaymentOption = { online: boolean; provider?: string; methods: string[] };

/** What the builder tells a customer about paying in this currency (shown after they pick their country). */
export function paymentOptions(currency: string): PaymentOption {
  const p = providerFor(currency);
  return p ? { online: true, provider: p.name, methods: p.methods() } : { online: false, methods: [] };
}
