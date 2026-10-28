/**
 * Exchange rates for charging a deposit in a different currency than the price list
 * (e.g. Gulf prices in AED, charged in USD because Kashier only charges EGP/USD/GBP/EUR).
 * Source: Kashier's public rate endpoint (no auth), https://developers.kashier.io/docs/accept-payments/currency-conversion
 * Rates are cached for an hour; if the lookup fails, USD-pegged Gulf currencies fall back to their official peg.
 */

const TTL_MS = 60 * 60 * 1000;

/** Units of USD per 1 unit of a USD-pegged currency (central-bank pegs). */
const USD_PEGS: Record<string, number> = {
  AED: 1 / 3.6725,
  SAR: 1 / 3.75,
  QAR: 1 / 3.64,
  OMR: 1 / 0.3845,
  BHD: 1 / 0.376,
};

const cache = new Map<string, { rate: number; at: number }>();

function endpoint(): string {
  const live = process.env.KASHIER_MODE?.trim() === "live";
  return `${live ? "https://api.kashier.io" : "https://test-api.kashier.io"}/v3/payment/exchange-rate`;
}

/** 1 `from` = rate × `to`. Returns undefined when no rate is available. */
export async function getRate(from: string, to: string): Promise<number | undefined> {
  if (from === to) return 1;
  const key = `${from}>${to}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rate;

  try {
    const res = await fetch(`${endpoint()}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = (await res.json()) as { success?: boolean; rates?: Record<string, number> };
      const rate = json.rates?.[to];
      if (typeof rate === "number" && rate > 0) {
        cache.set(key, { rate, at: Date.now() });
        return rate;
      }
    }
  } catch (err) {
    console.error(`[fx] ${key} lookup failed:`, err instanceof Error ? err.message : err);
  }
  if (to === "USD" && USD_PEGS[from]) return USD_PEGS[from];
  return hit?.rate;
}

/** Charged amount in the target currency, rounded to cents. */
export function convert(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

/** For tests. */
export function resetFxCache(): void {
  cache.clear();
}
