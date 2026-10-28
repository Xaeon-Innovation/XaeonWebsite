"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatMoney, loc, type BuilderCatalog, type Market, type QuoteEstimate } from "@/lib/builder";

/** Running total shown beside (desktop) or under (mobile) the wizard. Mirrors the server's pricing rules. */
export default function QuoteSummary({
  quote,
  catalog,
  billing,
  compact = false,
  online = false,
}: {
  quote: QuoteEstimate | null;
  catalog: BuilderCatalog;
  billing: "monthly" | "annual";
  compact?: boolean;
  /** An online payment provider handles this currency; otherwise the team invoices. */
  online?: boolean;
}) {
  const t = useTranslations("builder");
  const locale = useLocale();
  if (!quote) return null;
  const money = (n: number) => formatMoney(n, quote.currency as Market, locale);
  const label = (key: string) =>
    key.startsWith("plan:")
      ? loc(catalog.plans.find((p) => `plan:${p.tier}` === key)?.name, locale)
      : loc(catalog.addons.find((a) => a.key === key)?.name, locale);
  const plan = catalog.plans.find((p) => `plan:${p.tier}` === quote.lines[0]?.key);
  const depositNote = quote.deposit === 0 || !online ? t("manualNote") : plan?.tier === "launch" ? t("depositNoteLaunch") : t("depositNote", { deposit: money(quote.deposit) });

  if (compact) {
    return (
      <p className="flex flex-col text-sm leading-tight" aria-live="polite">
        <span className="font-display text-lg font-semibold text-fog tabular-nums">{money(quote.setup)}</span>
        <span className="text-haze tabular-nums">
          + {money(billing === "annual" ? quote.annual : quote.monthly)}
          {billing === "annual" ? ` / ${t("annualTotal")}` : t("perMonth")}
        </span>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-ink-2 p-5" aria-live="polite">
      <p className="font-semibold text-fog">{t("summary")}</p>
      <ul className="flex flex-col gap-2 text-sm">
        {quote.lines.map((l) => (
          <li key={l.key} className="flex items-start justify-between gap-3">
            <span className="text-mist">{label(l.key)}</span>
            <span className="shrink-0 text-end tabular-nums text-fog">
              {l.included ? (
                <span className="text-sage">✓</span>
              ) : l.quoted ? (
                t("from", { price: money(l.setup) })
              ) : (
                money(l.setup)
              )}
              {l.discount > 0 && <span className="block text-xs text-sage">−{money(l.discount)}</span>}
            </span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-mist">{t("setup")}</dt>
          <dd className="font-display text-lg font-semibold text-fog tabular-nums">{money(quote.setup)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-mist">{billing === "annual" ? t("annualTotal") : t("monthlyTotal")}</dt>
          <dd className="tabular-nums text-fog">{money(billing === "annual" ? quote.annual : quote.monthly)}</dd>
        </div>
        {quote.discountTotal > 0 && (
          <div className="flex justify-between gap-3 text-sage">
            <dt>{t("savings")}</dt>
            <dd className="tabular-nums">{money(quote.discountTotal)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-line pt-2">
          <dt className="font-semibold text-fog">{online ? t("deposit") : t("depositInvoiced")}</dt>
          <dd className="font-semibold tabular-nums text-sage">{money(quote.deposit)}</dd>
        </div>
      </dl>
      <p className="text-xs text-haze">{depositNote}</p>
      {quote.hasQuotedItems && <p className="text-xs text-haze">{t("quotedNote")}</p>}
    </div>
  );
}
