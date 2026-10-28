import { kashier } from "./kashier";
import { polar } from "./polar";
import { getRate } from "./fx";
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

/** Currency used when a provider can't charge the price-list currency (Kashier: EGP, USD, GBP, EUR only). */
const FALLBACK_CHARGE_CURRENCY = "USD";

export type PaymentPlan = {
  provider: PaymentProvider;
  /** Currency actually charged; differs from the price list when converting (e.g. AED prices → USD charge). */
  chargeCurrency: string;
  /** 1 price-list unit = rate × chargeCurrency. */
  rate: number;
};

/**
 * How a deposit priced in `currency` is paid online: directly if a provider charges that currency,
 * otherwise converted to USD at Kashier's rate. Undefined → no online payment (the team invoices).
 */
export async function paymentPlan(currency: string): Promise<PaymentPlan | undefined> {
  const direct = providerFor(currency);
  if (direct) return { provider: direct, chargeCurrency: currency, rate: 1 };
  const converted = providerFor(FALLBACK_CHARGE_CURRENCY);
  if (!converted) return undefined;
  const rate = await getRate(currency, FALLBACK_CHARGE_CURRENCY);
  return rate ? { provider: converted, chargeCurrency: FALLBACK_CHARGE_CURRENCY, rate } : undefined;
}

export type PaymentOption = {
  online: boolean;
  provider?: string;
  methods: string[];
  /** Present when the charge is converted, so the wizard can say "charged in USD, about $X". */
  chargeCurrency?: string;
  rate?: number;
};

/** What the builder tells a customer about paying in this currency (shown after they pick their country). */
export async function paymentOptions(currency: string): Promise<PaymentOption> {
  const plan = await paymentPlan(currency);
  if (!plan) return { online: false, methods: [] };
  return {
    online: true,
    provider: plan.provider.name,
    methods: plan.provider.methods(),
    ...(plan.chargeCurrency !== currency ? { chargeCurrency: plan.chargeCurrency, rate: plan.rate } : {}),
  };
}
