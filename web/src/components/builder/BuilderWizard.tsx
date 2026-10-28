"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { trackEvent, trackLead } from "@/lib/analytics";
import { getAttribution } from "@/lib/attribution";
import {
  BUILDER_CATEGORIES,
  COUNTRIES,
  COUNTRY_MARKET,
  FONTS,
  GOALS,
  PLAN_TIERS,
  TONES,
  contrastRatio,
  estimateQuote,
  formatMoney,
  loc,
  planRank,
  type BuilderCatalog,
  type BuilderCategory,
  type Country,
  type Market,
  type PlanTier,
} from "@/lib/builder";
import { addonIcon, CATEGORY_ICONS } from "./icons";
import QuoteSummary from "./QuoteSummary";
import TemplatePreview from "./TemplatePreview";

type Draft = {
  step: number;
  category?: BuilderCategory;
  goal?: string;
  templateSlug?: string;
  brand: { businessName: string; primary: string; accent: string; font: string; tone: string; logoUrl?: string; assetUrls: string[]; notes: string };
  addonKeys: string[];
  planTier: PlanTier;
  billing: "monthly" | "annual";
  /** Chosen first; decides the currency and payment options. */
  country?: Country;
  contact: { name: string; email: string; phone: string; company: string };
};

const STORAGE_KEY = "xaeon-builder-draft-v1";
const LAST_STEP = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY: Draft = {
  step: 0,
  brand: { businessName: "", primary: "#72c04f", accent: "#1b3d50", font: "modern", tone: "professional", assetUrls: [], notes: "" },
  addonKeys: [],
  planTier: "business",
  billing: "monthly",
  contact: { name: "", email: "", phone: "", company: "" },
};

function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? ({ ...EMPTY, ...JSON.parse(raw) } as Draft) : null;
  } catch {
    return null;
  }
}

function saveDraft(d: Draft | null): void {
  try {
    if (d) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked: the wizard still works, it just won't remember */
  }
}

const input =
  "w-full rounded-xl border border-line-strong bg-ink-2 px-4 py-3 text-fog placeholder:text-haze focus:border-sage focus:outline-none aria-[invalid=true]:border-danger";
const label = "text-sm font-medium text-fog";
const cardBase = "relative flex flex-col gap-2 rounded-[var(--radius-card)] border p-5 text-start transition-colors focus-visible:outline-2 focus-visible:outline-sage";
const cardState = (on: boolean) => (on ? "border-sage bg-sage/[0.08]" : "border-line bg-ink-2 hover:border-line-strong");

export default function BuilderWizard({ catalog }: { catalog: BuilderCatalog }) {
  const t = useTranslations("builder");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [d, setD] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<"logo" | "asset" | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [terms, setTerms] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  // Restore a saved draft once, then follow ?category= deep links (category cards, product pages).
  useEffect(() => {
    const saved = loadDraft();
    // one-time hydration from browser-only storage
    if (saved) setD(saved);
  }, []);

  const deepCategory = searchParams.get("category");
  useEffect(() => {
    if (!deepCategory || !(BUILDER_CATEGORIES as readonly string[]).includes(deepCategory)) return;
    // the URL is the source of truth for the chosen category when it changes
    setD((prev) => (prev.category === deepCategory ? prev : { ...prev, category: deepCategory as BuilderCategory, templateSlug: undefined, step: prev.country ? 1 : 0 }));
  }, [deepCategory]);

  useEffect(() => {
    if (d !== EMPTY) saveDraft(d);
  }, [d]);

  const update = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));
  const brand = (patch: Partial<Draft["brand"]>) => setD((prev) => ({ ...prev, brand: { ...prev.brand, ...patch } }));
  const contact = (patch: Partial<Draft["contact"]>) => setD((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }));

  const templates = catalog.templates.filter((tp) => tp.category === d.category);
  const template = catalog.templates.find((tp) => tp.slug === d.templateSlug);
  const addons = catalog.addons.filter((a) => d.addonKeys.includes(a.key));

  // Lowest plan the template and chosen add-ons allow.
  const minTier: PlanTier = useMemo(() => {
    const needs = [template?.minPlan, ...addons.map((a) => a.minPlan)].filter(Boolean) as PlanTier[];
    return needs.reduce<PlanTier>((m, x) => (planRank(x) > planRank(m) ? x : m), "launch");
  }, [template, addons]);

  useEffect(() => {
    // keep the plan valid when the template/add-ons need more
    if (planRank(d.planTier) < planRank(minTier)) setD((prev) => ({ ...prev, planTier: minTier }));
  }, [minTier, d.planTier]);

  const market = COUNTRY_MARKET[d.country ?? "EG"];
  const payment = catalog.payments[market] ?? { online: false, methods: [] };
  const quote = estimateQuote(catalog, { planTier: d.planTier, addonKeys: d.addonKeys, market });
  // Converted charge (e.g. AED deposit paid in USD); the server recomputes it with the live rate.
  const charge =
    payment.online && payment.chargeCurrency && payment.rate && quote
      ? { currency: payment.chargeCurrency, amount: Math.round(quote.deposit * payment.rate * 100) / 100 }
      : null;

  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus({ preventScroll: true });
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [d.step]);

  if (!catalog.templates.length || !catalog.plans.length) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-line bg-ink-2 p-8">
        <p className="text-lg text-mist">{t("unavailable")}</p>
        <Link href="/book" className="inline-flex min-h-11 items-center rounded-full bg-sage px-5 py-3 text-sm font-semibold text-on-sage">{t("unavailableCta")}</Link>
      </div>
    );
  }

  const validate = (step: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (step === 0 && !d.country) e.country = t("errors.country");
    if (step === 0 && !d.category) e.category = t("errors.category");
    if (step === 1 && !template) e.template = t("errors.template");
    if (step === 2 && !d.brand.businessName.trim()) e.businessName = t("errors.businessName");
    if (step === LAST_STEP) {
      if (d.contact.name.trim().length < 2) e.name = t("errors.name");
      if (!EMAIL_RE.test(d.contact.email.trim())) e.email = t("errors.email");
      if (d.contact.phone.replace(/\D/g, "").length < 7) e.phone = t("errors.phone");
      if (!terms) e.terms = t("errors.terms");
    }
    return e;
  };

  const checkSubmit = (): Record<string, string> => {
    const e = validate(LAST_STEP);
    // A deep link can skip the first step: the country is still required.
    if (!d.country) e.country = t("errors.country");
    return e;
  };

  const goTo = (step: number) => {
    moved.current = true;
    setErrors({});
    update({ step });
  };

  const next = () => {
    const e = validate(d.step);
    setErrors(e);
    if (Object.keys(e).length) {
      rootRef.current?.querySelector<HTMLElement>(`[data-field="${Object.keys(e)[0]}"]`)?.focus();
      return;
    }
    trackEvent("builder_step", { step: d.step + 1, category: d.category });
    goTo(Math.min(d.step + 1, LAST_STEP));
  };

  const upload = async (file: File | undefined, type: "logo" | "asset") => {
    if (!file) return;
    setUploading(type);
    setErrors((prev) => ({ ...prev, upload: "" }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch("/api/v1/builder/assets", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { url?: string };
      if (!res.ok || !json.url) throw new Error(String(res.status));
      if (type === "logo") brand({ logoUrl: json.url });
      else setD((prev) => ({ ...prev, brand: { ...prev.brand, assetUrls: [...prev.brand.assetUrls, json.url!].slice(0, 5) } }));
    } catch {
      setErrors((prev) => ({ ...prev, upload: t("uploadError") }));
    } finally {
      setUploading(null);
    }
  };

  const submit = async (honeypot: string) => {
    const e = checkSubmit();
    if (e.country) {
      goTo(0);
      setErrors({ country: e.country });
      return;
    }
    setErrors(e);
    if (Object.keys(e).length) {
      rootRef.current?.querySelector<HTMLElement>(`[data-field="${Object.keys(e)[0]}"]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/v1/builder/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          website: honeypot,
          order: {
            country: d.country,
            locale,
            config: { category: d.category, goal: d.goal, templateSlug: d.templateSlug, planTier: d.planTier, addonKeys: d.addonKeys, billing: d.billing },
            brand: d.brand,
            contact: d.contact,
            attribution: getAttribution() ?? undefined,
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ref?: string; token?: string; checkoutUrl?: string };
      if (!res.ok || !json.ref) throw new Error(String(res.status));
      trackLead("builder", { category: d.category, template: d.templateSlug, plan: d.planTier, value: quote?.setup, currency: market });
      saveDraft(null);
      if (json.checkoutUrl) {
        window.location.assign(json.checkoutUrl);
        return;
      }
      router.push(`/website-builder/success?ref=${encodeURIComponent(json.ref)}&token=${encodeURIComponent(json.token ?? "")}`);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const steps = t.raw("steps") as string[];
  const err = (key: string) => (errors[key] ? <p id={`b-${key}-err`} className="text-sm text-danger">{errors[key]}</p> : null);
  const aria = (key: string) => ({ "data-field": key, "aria-invalid": errors[key] ? true : undefined, "aria-describedby": errors[key] ? `b-${key}-err` : undefined });
  const money = (n: number) => formatMoney(n, market, locale);
  const methodList = (methods: string[]) => methods.map((m) => (t.has(`paymentMethods.${m}`) ? t(`paymentMethods.${m}`) : m)).join(locale === "ar" ? "، " : ", ");
  const providerName = (p?: string) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : "");
  const planName = (tier: string) => loc(catalog.plans.find((p) => p.tier === tier)?.name, locale) || tier;

  let body: ReactNode;
  if (d.step === 0) {
    body = (
      <>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-semibold text-fog">{t("countryTitle")}</legend>
          <p className="text-sm text-mist">{t("countryBody")}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-describedby={errors.country ? "b-country-err" : undefined}>
            {COUNTRIES.map((c, i) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={d.country === c}
                data-field={i === 0 ? "country" : undefined}
                onClick={() => update({ country: c })}
                className={`rounded-full border px-4 py-2 text-sm ${d.country === c ? "border-sage bg-sage/10 text-fog" : "border-line text-mist hover:text-fog"}`}
              >
                {t(`countries.${c}`)}
              </button>
            ))}
          </div>
          {err("country")}
          {d.country && (
            <p className="text-sm text-haze">
              {t("currencyFor", { currency: market, country: t(`countries.${d.country}`) })} ·{" "}
              {payment.online
                ? payment.chargeCurrency
                  ? t("payOnlineConverted", { currency: payment.chargeCurrency, methods: methodList(payment.methods) })
                  : t("payOnlineShort", { methods: methodList(payment.methods) })
                : t("payInvoiceShort")}
            </p>
          )}
        </fieldset>
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 font-semibold text-fog">{t("categoryTitle")}</legend>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-describedby={errors.category ? "b-category-err" : undefined}>
            {BUILDER_CATEGORIES.map((c, i) => {
              const Icon = CATEGORY_ICONS[c];
              const on = d.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  data-field={i === 0 ? "category" : undefined}
                  onClick={() => update({ category: c, templateSlug: d.category === c ? d.templateSlug : undefined })}
                  className={`${cardBase} ${cardState(on)}`}
                >
                  <Icon size={22} aria-hidden className="text-sage" />
                  <span className="font-semibold text-fog">{t(`categories.${c}.title`)}</span>
                  <span className="text-sm text-mist">{t(`categories.${c}.body`)}</span>
                  {on && <Check size={18} aria-hidden className="absolute end-4 top-4 text-sage" />}
                </button>
              );
            })}
          </div>
          {err("category")}
        </fieldset>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-semibold text-fog">{t("goalTitle")}</legend>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={d.goal === g}
                onClick={() => update({ goal: d.goal === g ? undefined : g })}
                className={`rounded-full border px-4 py-2 text-sm ${d.goal === g ? "border-sage bg-sage/10 text-fog" : "border-line text-mist hover:text-fog"}`}
              >
                {t(`goals.${g}`)}
              </button>
            ))}
          </div>
        </fieldset>
      </>
    );
  } else if (d.step === 1) {
    body = (
      <>
        <p className="text-mist">{t("templateBody")}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-describedby={errors.template ? "b-template-err" : undefined}>
          {templates.map((tp, i) => {
            const on = d.templateSlug === tp.slug;
            return (
              <button
                key={tp.slug}
                type="button"
                role="radio"
                aria-checked={on}
                data-field={i === 0 ? "template" : undefined}
                onClick={() => {
                  update({ templateSlug: tp.slug, addonKeys: [...new Set([...d.addonKeys, ...tp.recommendedAddons.filter((k) => catalog.addons.some((a) => a.key === k && a.kind === "module"))])] });
                  brand({ primary: tp.defaultBrand.primary, accent: tp.defaultBrand.accent, font: tp.defaultBrand.font });
                }}
                className={`${cardBase} ${cardState(on)}`}
              >
                <span className="flex h-20 overflow-hidden rounded-lg" aria-hidden>
                  <span className="flex-[2]" style={{ background: tp.defaultBrand.primary }} />
                  <span className="flex-1" style={{ background: tp.defaultBrand.accent }} />
                </span>
                <span className="font-semibold text-fog">{loc(tp.name, locale)}</span>
                <span className="text-sm text-mist">{loc(tp.tagline, locale)}</span>
                <span className="text-xs text-haze">
                  {t("pagesIncluded")}: {tp.pages.map((p) => loc(p, locale)).join(" · ")}
                </span>
                {tp.minPlan !== "launch" && <span className="text-xs text-sage">{t("minPlan", { plan: planName(tp.minPlan) })}</span>}
                {on && <Check size={18} aria-hidden className="absolute end-4 top-4 text-sage" />}
              </button>
            );
          })}
        </div>
        {err("template")}
      </>
    );
  } else if (d.step === 2) {
    const lightPrimary = contrastRatio(d.brand.primary, "#ffffff") < 3;
    body = (
      <>
        <p className="text-mist">{t("brandBody")}</p>
        <div className="flex flex-col gap-2">
          <label htmlFor="b-businessName" className={label}>{t("businessName")}</label>
          <input id="b-businessName" className={input} value={d.brand.businessName} onChange={(e) => brand({ businessName: e.target.value })} placeholder={t("businessNamePlaceholder")} maxLength={120} autoComplete="organization" {...aria("businessName")} />
          {err("businessName")}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {(["primary", "accent"] as const).map((k) => (
            <div key={k} className="flex flex-col gap-2">
              <label htmlFor={`b-${k}`} className={label}>{t(k)}</label>
              <div className="flex items-center gap-3">
                <input id={`b-${k}`} type="color" value={d.brand[k]} onChange={(e) => brand({ [k]: e.target.value })} className="h-11 w-14 cursor-pointer rounded-lg border border-line-strong bg-ink-2 p-1" />
                <input aria-label={`${t(k)} (hex)`} className={`${input} font-mono uppercase`} dir="ltr" value={d.brand[k]} maxLength={7} onChange={(e) => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && brand({ [k]: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
        {lightPrimary && <p className="text-sm text-haze">{t("contrastHint")}</p>}
        <fieldset className="flex flex-col gap-2">
          <legend className={`${label} mb-2`}>{t("font")}</legend>
          <div className="flex flex-wrap gap-2">
            {FONTS.map((f) => (
              <button key={f} type="button" aria-pressed={d.brand.font === f} onClick={() => brand({ font: f })} className={`rounded-full border px-4 py-2 text-sm ${d.brand.font === f ? "border-sage bg-sage/10 text-fog" : "border-line text-mist hover:text-fog"}`}>
                {t(`fonts.${f}`)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className={`${label} mb-2`}>{t("tone")}</legend>
          <div className="flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <button key={tone} type="button" aria-pressed={d.brand.tone === tone} onClick={() => brand({ tone })} className={`rounded-full border px-4 py-2 text-sm ${d.brand.tone === tone ? "border-sage bg-sage/10 text-fog" : "border-line text-mist hover:text-fog"}`}>
                {t(`tones.${tone}`)}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className={label}>{t("logo")}</span>
            {d.brand.logoUrl ? (
              <span className="flex items-center gap-3 rounded-xl border border-line bg-white/95 p-3">
                <img src={d.brand.logoUrl} alt="" className="h-10 w-auto max-w-[8rem] object-contain" />
                <button type="button" onClick={() => brand({ logoUrl: undefined })} className="ms-auto inline-flex items-center gap-1 text-sm text-graphite"><X size={14} aria-hidden /> {t("remove")}</button>
              </span>
            ) : (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-strong p-4 text-sm text-mist hover:border-sage focus-within:border-sage">
                {uploading === "logo" ? <Loader2 size={18} aria-hidden className="animate-spin" /> : <ImagePlus size={18} aria-hidden />}
                <span>{uploading === "logo" ? t("uploading") : t("upload")}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" disabled={!!uploading} onChange={(e) => void upload(e.target.files?.[0], "logo")} />
              </label>
            )}
            <p className="text-xs text-haze">{d.brand.logoUrl ? t("logoHint") : t("noLogo")}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className={label}>{t("assets")}</span>
            <div className="flex flex-wrap gap-2">
              {d.brand.assetUrls.map((u) => (
                <span key={u} className="relative">
                  <img src={u} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <button type="button" aria-label={t("remove")} onClick={() => brand({ assetUrls: d.brand.assetUrls.filter((x) => x !== u) })} className="absolute -end-1.5 -top-1.5 rounded-full bg-ink p-0.5 text-fog ring-1 ring-line"><X size={12} aria-hidden /></button>
                </span>
              ))}
              {d.brand.assetUrls.length < 5 && (
                <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-line-strong text-mist hover:border-sage focus-within:border-sage" aria-label={t("upload")}>
                  {uploading === "asset" ? <Loader2 size={18} aria-hidden className="animate-spin" /> : <ImagePlus size={18} aria-hidden />}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={!!uploading} onChange={(e) => void upload(e.target.files?.[0], "asset")} />
                </label>
              )}
            </div>
            <p className="text-xs text-haze">{t("assetsHint")}</p>
          </div>
        </div>
        {errors.upload && <p role="alert" className="text-sm text-danger">{errors.upload}</p>}
        <div className="flex flex-col gap-2">
          <label htmlFor="b-notes" className={label}>{t("notes")}</label>
          <textarea id="b-notes" rows={3} className={input} value={d.brand.notes} maxLength={2000} placeholder={t("notesPlaceholder")} onChange={(e) => brand({ notes: e.target.value })} />
        </div>
      </>
    );
  } else if (d.step === 3) {
    const groups = (["module", "service"] as const).map((kind) => ({
      kind,
      items: catalog.addons
        .filter((a) => a.kind === kind)
        .sort((a, b) => Number(b.categories.includes(d.category!)) - Number(a.categories.includes(d.category!))),
    }));
    body = groups.map(({ kind, items }) =>
      items.length ? (
        <fieldset key={kind} className="flex flex-col gap-3">
          <legend className="mb-1 font-semibold text-fog">{kind === "module" ? t("modules") : t("services")}</legend>
          {kind === "service" && <p className="text-sm text-mist">{t("servicesBody")}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((a) => {
              const on = d.addonKeys.includes(a.key);
              const Icon = addonIcon(a.icon);
              const included = a.includedIn.includes(d.planTier);
              const recommended = template?.recommendedAddons.includes(a.key) || a.categories.includes(d.category!);
              const price = a.prices[market];
              return (
                <label key={a.key} className={`${cardBase} cursor-pointer ${cardState(on)}`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => update({ addonKeys: on ? d.addonKeys.filter((k) => k !== a.key) : [...d.addonKeys, a.key] })}
                  />
                  <span className="flex items-start gap-3">
                    <Icon size={20} aria-hidden className="mt-0.5 shrink-0 text-sage" />
                    <span className="flex flex-col gap-1">
                      <span className="font-semibold text-fog">{loc(a.name, locale)}</span>
                      <span className="text-sm text-mist">{loc(a.description, locale)}</span>
                    </span>
                    <span className={`ms-auto flex h-5 w-5 shrink-0 items-center justify-center rounded border ${on ? "border-sage bg-sage text-on-sage" : "border-line-strong"}`} aria-hidden>
                      {on && <Check size={14} />}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    {included ? (
                      <span className="text-sage">{t("included", { plan: planName(d.planTier) })}</span>
                    ) : price.setup > 0 ? (
                      <span className="tabular-nums text-fog">
                        {a.discountPercent > 0 && <s className="me-1.5 text-haze">{money(price.setup)}</s>}
                        {a.quoted ? t("from", { price: money(Math.round(price.setup * (1 - a.discountPercent / 100))) }) : money(Math.round(price.setup * (1 - a.discountPercent / 100)))}
                        {price.monthly > 0 && ` + ${money(price.monthly)}${t("perMonth")}`}
                      </span>
                    ) : null}
                    {a.badge && loc(a.badge, locale) && <span className="rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-on-sage">{loc(a.badge, locale)}</span>}
                    {recommended && !a.badge?.en && <span className="rounded-full border border-sage/40 px-2 py-0.5 text-xs text-sage">{t("recommended")}</span>}
                    {a.minPlan && planRank(a.minPlan) > 0 && <span className="text-xs text-haze">{t("needsPlan", { plan: planName(a.minPlan) })}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null,
    );
  } else if (d.step === 4) {
    body = (
      <>
        <p className="text-mist">{t("planBody")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-full border border-line p-0.5" role="group" aria-label={t("monthly")}>
            {(["monthly", "annual"] as const).map((b) => (
              <button key={b} type="button" aria-pressed={d.billing === b} onClick={() => update({ billing: b })} className={`rounded-full px-4 py-2 text-sm ${d.billing === b ? "bg-white/10 text-fog" : "text-haze hover:text-fog"}`}>
                {t(b)}
              </button>
            ))}
          </div>
          <p className="ms-auto text-sm text-mist">
            {t("currencyFor", { currency: market, country: t(`countries.${d.country ?? "EG"}`) })}{" "}
            <button type="button" onClick={() => goTo(0)} className="text-sage underline-offset-2 hover:underline">{t("changeCountry")}</button>
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
          {PLAN_TIERS.map((tier) => {
            const plan = catalog.plans.find((p) => p.tier === tier);
            if (!plan) return null;
            const disabled = planRank(tier) < planRank(minTier);
            const on = d.planTier === tier;
            const price = plan.prices[market];
            return (
              <button key={tier} type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => update({ planTier: tier })} className={`${cardBase} ${cardState(on)} disabled:cursor-not-allowed disabled:opacity-40`}>
                {plan.highlighted && <span className="self-start rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-on-sage">{t("popular")}</span>}
                <span className="font-display text-xl font-semibold text-fog">{loc(plan.name, locale)}</span>
                <span className="text-sm text-mist">{loc(plan.summary, locale)}</span>
                <span className="tabular-nums text-fog">
                  {plan.quoted ? t("from", { price: money(price.setup) }) : money(price.setup)} <span className="text-sm text-haze">{t("oneTime")}</span>
                </span>
                <span className="tabular-nums text-sm text-mist">
                  + {money(d.billing === "annual" ? price.monthly * 10 : price.monthly)}
                  {d.billing === "annual" ? ` / ${t("annualTotal")}` : t("perMonth")}
                </span>
                <ul className="mt-2 flex flex-col gap-1 text-sm text-mist">
                  {plan.features.map((f) => (
                    <li key={f.en} className="flex items-start gap-2"><Check size={14} aria-hidden className="mt-1 shrink-0 text-sage" /> {loc(f, locale)}</li>
                  ))}
                </ul>
                {on && <Check size={18} aria-hidden className="absolute end-4 top-4 text-sage" />}
              </button>
            );
          })}
        </div>
        {minTier !== "launch" && <p className="text-sm text-haze">{t("planTooLow")}</p>}
      </>
    );
  } else {
    body = (
      <form
        id="builder-order"
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(String(new FormData(e.currentTarget).get("website") ?? ""));
        }}
      >
        <p className="text-mist">{t("reviewBody")}</p>
        <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-sage/30 bg-sage/[0.05] p-5 text-sm">
          <p className="font-semibold text-fog">{t("paymentTitle")}</p>
          {payment.online && (quote?.deposit ?? 0) > 0 ? (
            <>
              <p className="text-mist">{t("paymentOnline", { deposit: money(quote!.deposit), provider: providerName(payment.provider) })}</p>
              {charge && (
                <p className="text-fog">
                  {t("chargedIn", { amount: formatMoney(charge.amount, charge.currency as Market, locale, 2), currency: charge.currency })}
                </p>
              )}
              <ul className="flex flex-wrap gap-2">
                {payment.methods.map((m) => (
                  <li key={m} className="rounded-full border border-line px-3 py-1 text-xs text-fog">{t.has(`paymentMethods.${m}`) ? t(`paymentMethods.${m}`) : m}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-mist">{t("paymentManual", { country: t(`countries.${d.country ?? "EG"}`) })}</p>
          )}
        </div>
        <dl className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-ink-2 p-5 text-sm sm:grid-cols-2">
          {[
            [steps[0], d.category ? t(`categories.${d.category}.title`) : "", 0],
            [steps[1], loc(template?.name, locale), 1],
            [steps[2], d.brand.businessName, 2],
            [steps[3], addons.map((a) => loc(a.name, locale)).join(", ") || "—", 3],
            [steps[4], `${planName(d.planTier)} · ${t(d.billing)}`, 4],
          ].map(([k, v, step]) => (
            <div key={String(k)} className="flex flex-col gap-0.5">
              <dt className="text-haze">{k}</dt>
              <dd className="flex items-baseline gap-2 text-fog">
                {v}
                <button type="button" onClick={() => goTo(Number(step))} className="text-xs text-sage underline-offset-2 hover:underline">✎<span className="sr-only"> {k}</span></button>
              </dd>
            </div>
          ))}
        </dl>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -start-[10000px] h-px w-px opacity-0" />
        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-3 font-semibold text-fog">{t("contactTitle")}</legend>
          {(
            [
              ["name", "name", "text"],
              ["email", "email", "email"],
              ["phone", "tel", "tel"],
              ["company", "organization", "text"],
            ] as const
          ).map(([k, auto, type]) => (
            <div key={k} className="flex flex-col gap-2">
              <label htmlFor={`b-${k}`} className={label}>{t(k)}</label>
              <input id={`b-${k}`} type={type} autoComplete={auto} dir={type === "tel" || type === "email" ? "ltr" : undefined} className={input} value={d.contact[k]} onChange={(e) => contact({ [k]: e.target.value })} {...(k === "company" ? {} : aria(k))} />
              {err(k)}
            </div>
          ))}
        </fieldset>
        <label className="flex items-start gap-3 text-sm text-mist">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-sage)]" {...aria("terms")} />
          <span>
            {t.rich("terms", {
              terms: () => <Link href="/terms" className="text-sage underline" target="_blank">{t("termsLink")}</Link>,
              privacy: () => <Link href="/privacy" className="text-sage underline" target="_blank">{t("privacyLink")}</Link>,
            })}
          </span>
        </label>
        {err("terms")}
        {status === "error" && <p role="alert" className="text-sm text-danger">{t("errors.submit")}</p>}
      </form>
    );
  }

  const titles = ["categoryTitle", "templateTitle", "brandTitle", "addonsTitle", "planTitle", "reviewTitle"] as const;
  const willPay = payment.online && (quote?.deposit ?? 0) > 0;

  return (
    <div ref={rootRef} className="scroll-mt-24">
      <ol className="mb-8 flex gap-1.5 overflow-x-auto pb-1" aria-label={t("stepOf", { current: d.step + 1, total: LAST_STEP + 1 })}>
        {steps.map((s, i) => {
          const done = i < d.step;
          return (
            <li key={s} className="min-w-[4.5rem] flex-1">
              <button
                type="button"
                disabled={i > d.step}
                onClick={() => goTo(i)}
                aria-current={i === d.step ? "step" : undefined}
                className="flex w-full flex-col gap-1.5 text-start text-xs disabled:cursor-default"
              >
                <span className={`h-1 rounded-full ${i <= d.step ? "bg-sage" : "bg-white/10"}`} />
                <span className={i === d.step ? "font-semibold text-fog" : done ? "text-mist" : "text-haze"}>{s}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <section className="flex min-w-0 flex-col gap-6" aria-labelledby="builder-step-title">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-haze">{t("stepOf", { current: d.step + 1, total: LAST_STEP + 1 })}</p>
            <h3 id="builder-step-title" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-fog outline-none sm:text-3xl">
              {t(titles[d.step])}
            </h3>
          </div>
          {body}
          <div className="flex items-center gap-3 border-t border-line pt-6">
            {d.step > 0 && (
              <button type="button" onClick={() => goTo(d.step - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-semibold text-fog hover:bg-white/5">
                <ArrowLeft size={16} aria-hidden className="rtl:rotate-180" /> {t("back")}
              </button>
            )}
            <div className="ms-auto flex items-center gap-4">
              <div className="lg:hidden"><QuoteSummary quote={quote} catalog={catalog} billing={d.billing} online={payment.online} charge={charge} compact /></div>
              {d.step < LAST_STEP ? (
                <button type="button" onClick={next} data-track={`builder_next_${d.step + 1}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-on-sage hover:bg-sage-strong">
                  {t("next")} <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
                </button>
              ) : (
                <button type="submit" form="builder-order" disabled={status === "sending"} data-track="builder_submit" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-on-sage hover:bg-sage-strong disabled:opacity-60">
                  {status === "sending" ? <Loader2 size={16} aria-hidden className="animate-spin" /> : null}
                  {status === "sending" ? t("sending") : willPay ? t("submitPay") : t("submit")}
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {d.category && <TemplatePreview template={template} category={d.category} brand={d.brand} />}
          {d.step >= 3 && <div className="hidden lg:block"><QuoteSummary quote={quote} catalog={catalog} billing={d.billing} online={payment.online} charge={charge} /></div>}
          {d.step === LAST_STEP && <div className="lg:hidden"><QuoteSummary quote={quote} catalog={catalog} billing={d.billing} online={payment.online} charge={charge} /></div>}
        </aside>
      </div>
    </div>
  );
}
