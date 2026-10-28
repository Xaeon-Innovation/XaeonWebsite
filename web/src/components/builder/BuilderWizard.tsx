"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, CalendarClock, Check, ImagePlus, Loader2, Lock, Sparkles, X } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { trackEvent, trackLead } from "@/lib/analytics";
import { getAttribution } from "@/lib/attribution";
import {
  BUILDER_CATEGORIES,
  COUNTRIES,
  FONTS,
  GOALS,
  PLAN_TIERS,
  TONES,
  contrastRatio,
  estimateQuote,
  formatMoney,
  loc,
  marketFor,
  planRank,
  recommendPlan,
  type BuilderCatalog,
  type BuilderCategory,
  type CornerStyle,
  type Market,
  type PageKey,
  type PlanTier,
  type ThemeMode,
} from "@/lib/builder";
import CountrySelect from "./CountrySelect";
import { addonIcon, CATEGORY_ICONS, PAGE_ICONS } from "./icons";
import QuoteSummary from "./QuoteSummary";
import TemplatePreview from "./TemplatePreview";

type Draft = {
  step: number;
  country?: string;
  category?: BuilderCategory;
  goal?: string;
  templateSlug?: string;
  pages: PageKey[];
  brand: {
    businessName: string;
    primary: string;
    accent: string;
    font: string;
    mode?: ThemeMode;
    corners?: CornerStyle;
    tone: string;
    logoUrl?: string;
    assetUrls: string[];
    notes: string;
  };
  addonKeys: string[];
  /** Undefined = follow the recommended plan. */
  planTier?: PlanTier;
  billing: "monthly" | "annual";
  contact: { name: string; email: string; phone: string; company: string };
};

const STORAGE_KEY = "xaeon-builder-draft-v2";
const LAST_STEP = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEP_TITLES = ["businessTitle", "templateTitle", "pagesTitle", "brandTitle", "addonsTitle", "proposalTitle"] as const;

const EMPTY: Draft = {
  step: 0,
  pages: [],
  brand: { businessName: "", primary: "#72c04f", accent: "#1b3d50", font: "modern", tone: "professional", assetUrls: [], notes: "" },
  addonKeys: [],
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
const chip = (on: boolean) => `rounded-full border px-4 py-2 text-sm ${on ? "border-sage bg-sage/10 text-fog" : "border-line text-mist hover:text-fog"}`;

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
  const [styleFilter, setStyleFilter] = useState<"all" | "goal" | ThemeMode>("all");
  const [previewPage, setPreviewPage] = useState<PageKey>("home");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  // Restore a saved draft; otherwise pre-select the visitor's country from their location.
  useEffect(() => {
    const saved = loadDraft();
    // one-time hydration from browser-only storage
    if (saved) setD(saved);
    if (saved?.country) return;
    let cancelled = false;
    fetch("/api/geo")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { country?: string | null } | null) => {
        const geo = j?.country;
        if (!cancelled && geo && COUNTRIES.includes(geo)) setD((prev) => (prev.country ? prev : { ...prev, country: geo }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const deepCategory = searchParams.get("category");
  useEffect(() => {
    if (!deepCategory || !(BUILDER_CATEGORIES as readonly string[]).includes(deepCategory)) return;
    // the URL is the source of truth for the chosen category when it changes
    setD((prev) => (prev.category === deepCategory ? prev : { ...prev, category: deepCategory as BuilderCategory, templateSlug: undefined, pages: [], step: 0 }));
  }, [deepCategory]);

  useEffect(() => {
    if (d !== EMPTY) saveDraft(d);
  }, [d]);

  const update = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));
  const brand = (patch: Partial<Draft["brand"]>) => setD((prev) => ({ ...prev, brand: { ...prev.brand, ...patch } }));
  const contact = (patch: Partial<Draft["contact"]>) => setD((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }));

  const market: Market = marketFor(d.country);
  const payment = catalog.payments[market] ?? { online: false, methods: [] };
  const templates = catalog.templates.filter((tp) => tp.category === d.category);
  const template = catalog.templates.find((tp) => tp.slug === d.templateSlug);
  const addons = catalog.addons.filter((a) => d.addonKeys.includes(a.key));
  const pages: PageKey[] = template ? template.pageKeys.filter((k) => k === "home" || d.pages.includes(k)) : ["home"];

  // Lowest plan the template and chosen features allow, and the best-value plan for the whole selection.
  const minTier: PlanTier = useMemo(() => {
    const needs = [template?.minPlan, ...addons.map((a) => a.minPlan)].filter(Boolean) as PlanTier[];
    return needs.reduce<PlanTier>((m, x) => (planRank(x) > planRank(m) ? x : m), "launch");
  }, [template, addons]);
  const recommended = recommendPlan(catalog, { addonKeys: d.addonKeys, market, pageCount: pages.length, minTier });
  const planTier: PlanTier = d.planTier && planRank(d.planTier) >= planRank(minTier) ? d.planTier : recommended;
  const quote = estimateQuote(catalog, { planTier, addonKeys: d.addonKeys, market, pageCount: pages.length });
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
    if (step === 0) {
      if (!d.country) e.country = t("errors.country");
      if (!d.brand.businessName.trim()) e.businessName = t("errors.businessName");
      if (!d.category) e.category = t("errors.category");
    }
    if (step === 1 && !template) e.template = t("errors.template");
    if (step === LAST_STEP) {
      if (d.contact.name.trim().length < 2) e.name = t("errors.name");
      if (!EMAIL_RE.test(d.contact.email.trim())) e.email = t("errors.email");
      if (d.contact.phone.replace(/\D/g, "").length < 7) e.phone = t("errors.phone");
      if (!terms) e.terms = t("errors.terms");
    }
    return e;
  };

  const focusFirstError = (e: Record<string, string>) => {
    rootRef.current?.querySelector<HTMLElement>(`[data-field="${Object.keys(e)[0]}"]`)?.focus();
  };

  const goTo = (step: number) => {
    moved.current = true;
    setErrors({});
    update({ step });
  };

  const next = () => {
    const e = validate(d.step);
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError(e);
    trackEvent("builder_step", { step: d.step + 1, category: d.category, template: d.templateSlug });
    goTo(Math.min(d.step + 1, LAST_STEP));
  };

  const chooseTemplate = (slug: string) => {
    const tp = catalog.templates.find((x) => x.slug === slug);
    if (!tp) return;
    setPreviewPage("home");
    setD((prev) => ({
      ...prev,
      templateSlug: tp.slug,
      pages: tp.defaultPages,
      addonKeys: [...new Set([...prev.addonKeys, ...tp.recommendedAddons.filter((k) => catalog.addons.some((a) => a.key === k && a.kind === "module"))])],
      brand: { ...prev.brand, primary: tp.defaultBrand.primary, accent: tp.defaultBrand.accent, font: tp.defaultBrand.font, mode: tp.mode, corners: tp.corners },
    }));
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
      const url = json.url;
      if (type === "logo") brand({ logoUrl: url });
      else setD((prev) => ({ ...prev, brand: { ...prev.brand, assetUrls: [...prev.brand.assetUrls, url].slice(0, 5) } }));
    } catch {
      setErrors((prev) => ({ ...prev, upload: t("uploadError") }));
    } finally {
      setUploading(null);
    }
  };

  const submit = async (payNow: boolean, honeypot: string) => {
    // A deep link or an old draft can skip the first step: send people back there if it's incomplete.
    const first = validate(0);
    if (Object.keys(first).length) {
      goTo(0);
      setErrors(first);
      return;
    }
    const e = validate(LAST_STEP);
    setErrors(e);
    if (Object.keys(e).length) return focusFirstError(e);
    setStatus("sending");
    try {
      const res = await fetch("/api/v1/builder/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          website: honeypot,
          order: {
            country: d.country,
            payNow,
            locale,
            config: { category: d.category, goal: d.goal, templateSlug: d.templateSlug, pages, planTier, addonKeys: d.addonKeys, billing: d.billing },
            brand: d.brand,
            contact: d.contact,
            attribution: getAttribution() ?? undefined,
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ref?: string; token?: string; checkoutUrl?: string };
      if (!res.ok || !json.ref) throw new Error(String(res.status));
      trackLead("builder", { category: d.category, template: d.templateSlug, plan: planTier, pages: pages.length, value: quote?.setup, currency: market, pay_now: payNow });
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
  const pageName = (key: PageKey) => (key === "team" && d.category ? t(`teamName.${d.category}`) : t(`pages.${key}.name`));
  const methodList = (methods: string[]) => methods.map((m) => (t.has(`paymentMethods.${m}`) ? t(`paymentMethods.${m}`) : m)).join(locale === "ar" ? "، " : ", ");
  const providerName = (p?: string) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : "");
  const countryName = d.country ? new Intl.DisplayNames([locale], { type: "region" }).of(d.country) ?? d.country : "";
  const willPay = payment.online && (quote?.deposit ?? 0) > 0;

  let body: ReactNode;
  if (d.step === 0) {
    body = (
      <>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className={label} aria-hidden>{t("countryTitle")}</span>
            <CountrySelect
              value={d.country}
              onChange={(country) => update({ country })}
              locale={locale}
              label={t("countryTitle")}
              placeholder={t("countrySearch")}
              noResults={t("countryNone")}
              invalid={!!errors.country}
              describedBy={errors.country ? "b-country-err" : undefined}
            />
            {err("country")}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="b-businessName" className={label}>{t("businessName")}</label>
            <input id="b-businessName" className={input} value={d.brand.businessName} onChange={(e) => brand({ businessName: e.target.value })} placeholder={t("businessNamePlaceholder")} maxLength={120} autoComplete="organization" {...aria("businessName")} />
            {err("businessName")}
          </div>
        </div>
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 font-semibold text-fog">{t("categoryTitle")}</legend>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5" role="radiogroup" aria-describedby={errors.category ? "b-category-err" : undefined}>
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
                  onClick={() => update({ category: c, ...(d.category === c ? {} : { templateSlug: undefined, pages: [] }) })}
                  className={`${cardBase} !p-4 ${cardState(on)}`}
                >
                  <Icon size={20} aria-hidden className="text-sage" />
                  <span className="text-sm font-semibold text-fog">{t(`categories.${c}.title`)}</span>
                  {on && <Check size={16} aria-hidden className="absolute end-3 top-3 text-sage" />}
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
              <button key={g} type="button" aria-pressed={d.goal === g} onClick={() => update({ goal: d.goal === g ? undefined : g })} className={chip(d.goal === g)}>
                {t(`goals.${g}`)}
              </button>
            ))}
          </div>
        </fieldset>
      </>
    );
  } else if (d.step === 1) {
    const goal = d.goal;
    const shown = templates
      .filter((tp) => (styleFilter === "all" ? true : styleFilter === "goal" ? !!goal && tp.goals.includes(goal) : tp.mode === styleFilter))
      .sort((a, b) => Number(!!goal && b.goals.includes(goal)) - Number(!!goal && a.goals.includes(goal)));
    const filters: ("all" | "goal" | ThemeMode)[] = goal ? ["all", "goal", "light", "dark"] : ["all", "light", "dark"];
    body = (
      <>
        <p className="text-mist">{t("templateBody", { count: templates.length })}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterLabel")}>
          {filters.map((f) => (
            <button key={f} type="button" aria-pressed={styleFilter === f} onClick={() => setStyleFilter(f)} className={chip(styleFilter === f)}>
              {f === "goal" ? t("filterGoal", { goal: t(`goals.${goal}`) }) : t(`filters.${f}`)}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-describedby={errors.template ? "b-template-err" : undefined}>
          {shown.map((tp, i) => {
            const on = d.templateSlug === tp.slug;
            const dark = tp.mode === "dark";
            const fits = !!goal && tp.goals.includes(goal);
            return (
              <button key={tp.slug} type="button" role="radio" aria-checked={on} data-field={i === 0 ? "template" : undefined} onClick={() => chooseTemplate(tp.slug)} className={`${cardBase} ${cardState(on)}`}>
                <span
                  aria-hidden
                  className="flex h-24 flex-col gap-1.5 overflow-hidden p-2.5"
                  style={{ background: dark ? "#0e1013" : "#ffffff", borderRadius: tp.corners === "sharp" ? 3 : tp.corners === "round" ? 16 : 9 }}
                >
                  <span className="flex items-center justify-between">
                    <span className="h-2 w-10 rounded-sm" style={{ background: tp.defaultBrand.primary }} />
                    <span className="flex gap-1">
                      {[0, 1, 2].map((k) => <span key={k} className="h-1 w-4 rounded-sm" style={{ background: dark ? "#3a3f47" : "#d6d3d1" }} />)}
                    </span>
                  </span>
                  <span
                    className={`flex flex-1 items-center gap-2 rounded-sm px-2 ${tp.hero === "centered" ? "justify-center" : ""}`}
                    style={{ background: tp.hero === "banner" ? tp.defaultBrand.primary : dark ? "#181b20" : `${tp.defaultBrand.primary}18` }}
                  >
                    <span className="flex flex-col gap-1">
                      <span className="h-1.5 w-16 rounded-sm" style={{ background: tp.hero === "banner" ? "#ffffffcc" : dark ? "#e5e7eb" : tp.defaultBrand.accent }} />
                      <span className="h-1 w-12 rounded-sm" style={{ background: tp.hero === "banner" ? "#ffffff88" : dark ? "#6b7280" : "#a8a29e" }} />
                    </span>
                    {tp.hero === "split" && <span className="ms-auto h-9 w-14 rounded-sm" style={{ background: `linear-gradient(135deg, ${tp.defaultBrand.primary}, ${tp.defaultBrand.accent})` }} />}
                  </span>
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-fog">{loc(tp.name, locale)}</span>
                  <span className="text-xs text-haze">{t("pagesCount", { count: tp.pageKeys.length })}</span>
                </span>
                <span className="text-sm text-mist">{loc(tp.tagline, locale)}</span>
                <span className="flex flex-wrap gap-1.5">
                  {fits && <span className="rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-on-sage">{t("bestForGoal")}</span>}
                  {tp.tags.map((tag) => <span key={tag.en} className="rounded-full border border-line px-2 py-0.5 text-xs text-mist">{loc(tag, locale)}</span>)}
                </span>
                {on && <Check size={18} aria-hidden className="absolute end-4 top-4 text-sage" />}
              </button>
            );
          })}
        </div>
        {shown.length === 0 && <p className="text-sm text-haze">{t("noTemplates")}</p>}
        {err("template")}
      </>
    );
  } else if (d.step === 2 && template) {
    body = (
      <>
        <p className="text-mist">{t("pagesBody")}</p>
        <p className="text-sm text-fog" aria-live="polite">{t("pagesSelected", { count: pages.length })}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {template.pageKeys.map((key) => {
            const on = pages.includes(key);
            const locked = key === "home";
            const Icon = PAGE_ICONS[key];
            return (
              <label key={key} className={`${cardBase} !gap-1.5 !p-4 ${locked ? "" : "cursor-pointer"} ${cardState(on)}`} onMouseEnter={() => on && setPreviewPage(key)}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  disabled={locked}
                  onChange={() => {
                    update({ pages: on ? d.pages.filter((p) => p !== key) : [...d.pages, key] });
                    setPreviewPage(on ? "home" : key);
                  }}
                />
                <span className="flex items-center gap-3">
                  <Icon size={18} aria-hidden className="shrink-0 text-sage" />
                  <span className="font-semibold text-fog">{pageName(key)}</span>
                  <span className={`ms-auto flex h-5 w-5 shrink-0 items-center justify-center rounded border ${on ? "border-sage bg-sage text-on-sage" : "border-line-strong"}`} aria-hidden>
                    {locked ? <Lock size={11} /> : on && <Check size={14} />}
                  </span>
                </span>
                <span className="text-sm text-mist">{t(`pages.${key}.summary`)}</span>
                <span className="text-xs text-haze">{t(`pages.${key}.sections`)}</span>
              </label>
            );
          })}
        </div>
      </>
    );
  } else if (d.step === 3) {
    const lightPrimary = contrastRatio(d.brand.primary, "#ffffff") < 3;
    const mode = d.brand.mode ?? template?.mode;
    const corners = d.brand.corners ?? template?.corners;
    body = (
      <>
        <p className="text-mist">{t("brandBody")}</p>
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
        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-2">
            <legend className={`${label} mb-2`}>{t("modeLabel")}</legend>
            <div className="flex flex-wrap gap-2">
              {(["light", "dark"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => brand({ mode: m })} className={chip(mode === m)}>{t(`modes.${m}`)}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className={`${label} mb-2`}>{t("cornersLabel")}</legend>
            <div className="flex flex-wrap gap-2">
              {(["sharp", "soft", "round"] as const).map((c) => (
                <button key={c} type="button" aria-pressed={corners === c} onClick={() => brand({ corners: c })} className={chip(corners === c)}>{t(`cornerStyles.${c}`)}</button>
              ))}
            </div>
          </fieldset>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className={`${label} mb-2`}>{t("font")}</legend>
          <div className="flex flex-wrap gap-2">
            {FONTS.map((f) => <button key={f} type="button" aria-pressed={d.brand.font === f} onClick={() => brand({ font: f })} className={chip(d.brand.font === f)}>{t(`fonts.${f}`)}</button>)}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className={`${label} mb-2`}>{t("tone")}</legend>
          <div className="flex flex-wrap gap-2">
            {TONES.map((tone) => <button key={tone} type="button" aria-pressed={d.brand.tone === tone} onClick={() => brand({ tone })} className={chip(d.brand.tone === tone)}>{t(`tones.${tone}`)}</button>)}
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
  } else if (d.step === 4) {
    body = (["module", "service"] as const).map((kind) => {
      const category = d.category;
      const items = catalog.addons
        .filter((a) => a.kind === kind)
        .sort((a, b) => Number(!!category && b.categories.includes(category)) - Number(!!category && a.categories.includes(category)));
      return items.length ? (
        <fieldset key={kind} className="flex flex-col gap-3">
          <legend className="mb-1 font-semibold text-fog">{kind === "module" ? t("modules") : t("services")}</legend>
          {kind === "service" && <p className="text-sm text-mist">{t("servicesBody")}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((a) => {
              const on = d.addonKeys.includes(a.key);
              const Icon = addonIcon(a.icon);
              const suggested = template?.recommendedAddons.includes(a.key) || (!!category && a.categories.includes(category));
              return (
                <label key={a.key} className={`${cardBase} cursor-pointer ${cardState(on)}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => update({ addonKeys: on ? d.addonKeys.filter((k) => k !== a.key) : [...d.addonKeys, a.key] })} />
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
                    {a.badge && loc(a.badge, locale) && <span className="rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-on-sage">{loc(a.badge, locale)}</span>}
                    {suggested && !a.badge?.en && <span className="rounded-full border border-sage/40 px-2 py-0.5 text-xs text-sage">{t("recommended")}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null;
    });
  } else {
    body = (
      <form
        id="builder-order"
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          void submit(submitter?.value !== "later", String(new FormData(e.currentTarget).get("website") ?? ""));
        }}
      >
        <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-sage/30 bg-sage/[0.06] p-5">
          <Sparkles size={20} aria-hidden className="mt-0.5 shrink-0 text-sage" />
          <p className="text-mist">{t("proposalIntro", { name: d.brand.businessName || t("previewName"), template: loc(template?.name, locale), pages: pages.length })}</p>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 font-semibold text-fog">{t("planTitle")}</legend>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-full border border-line p-0.5" role="group" aria-label={t("billingLabel")}>
              {(["monthly", "annual"] as const).map((b) => (
                <button key={b} type="button" aria-pressed={d.billing === b} onClick={() => update({ billing: b })} className={`rounded-full px-4 py-2 text-sm ${d.billing === b ? "bg-white/10 text-fog" : "text-haze hover:text-fog"}`}>{t(b)}</button>
              ))}
            </div>
            <p className="text-sm text-haze">{t("currencyFor", { currency: market, country: countryName })}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
            {PLAN_TIERS.map((tier) => {
              const plan = catalog.plans.find((p) => p.tier === tier);
              if (!plan) return null;
              const disabled = planRank(tier) < planRank(minTier);
              const on = planTier === tier;
              const q = estimateQuote(catalog, { planTier: tier, addonKeys: d.addonKeys, market, pageCount: pages.length });
              return (
                <button key={tier} type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => update({ planTier: tier })} className={`${cardBase} ${cardState(on)} disabled:cursor-not-allowed disabled:opacity-40`}>
                  {tier === recommended && <span className="self-start rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-on-sage">{t("recommendedPlan")}</span>}
                  <span className="font-display text-xl font-semibold text-fog">{loc(plan.name, locale)}</span>
                  <span className="text-sm text-mist">{loc(plan.summary, locale)}</span>
                  {q && (
                    <span className="tabular-nums text-fog">
                      {plan.quoted ? t("from", { price: money(q.setup) }) : money(q.setup)} <span className="text-sm text-haze">{t("oneTime")}</span>
                      <span className="block text-sm text-mist">
                        + {money(d.billing === "annual" ? q.annual : q.monthly)}
                        {d.billing === "annual" ? ` / ${t("annualTotal")}` : t("perMonth")}
                      </span>
                    </span>
                  )}
                  <span className="text-xs text-haze">
                    {t("pagesIncluded", { count: plan.includedPages })}
                    {q && q.pages.extra > 0 ? ` · ${t("extraPages", { count: q.pages.extra })}` : ""}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-mist"><CalendarClock size={13} aria-hidden /> {t(`timeline.${tier}`)}</span>
                  <ul className="mt-1 flex flex-col gap-1 text-sm text-mist">
                    {plan.features.map((f) => <li key={f.en} className="flex items-start gap-2"><Check size={14} aria-hidden className="mt-1 shrink-0 text-sage" /> {loc(f, locale)}</li>)}
                  </ul>
                  {on && <Check size={18} aria-hidden className="absolute end-4 top-4 text-sage" />}
                </button>
              );
            })}
          </div>
          {minTier !== "launch" && <p className="text-sm text-haze">{t("planTooLow")}</p>}
        </fieldset>

        <div className="lg:hidden"><QuoteSummary quote={quote} catalog={catalog} billing={d.billing} online={willPay} charge={charge} /></div>

        <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-ink-2 p-5 text-sm">
          <p className="font-semibold text-fog">{t("paymentTitle")}</p>
          {willPay && quote ? (
            <>
              <p className="text-mist">{t("paymentOnline", { deposit: money(quote.deposit), provider: providerName(payment.provider) })}</p>
              {charge && <p className="text-fog">{t("chargedIn", { amount: formatMoney(charge.amount, charge.currency as Market, locale, 2), currency: charge.currency })}</p>}
              <p className="text-xs text-haze">{methodList(payment.methods)}</p>
            </>
          ) : (
            <p className="text-mist">{t("paymentManual", { country: countryName })}</p>
          )}
        </div>

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
              terms: (chunks) => <Link href="/terms" className="text-sage underline" target="_blank">{chunks}</Link>,
              privacy: (chunks) => <Link href="/privacy" className="text-sage underline" target="_blank">{chunks}</Link>,
            })}
          </span>
        </label>
        {err("terms")}
        {status === "error" && <p role="alert" className="text-sm text-danger">{t("errors.submit")}</p>}
        <p className="text-xs text-haze">{t("guarantee")}</p>
      </form>
    );
  }

  return (
    <div ref={rootRef} className="scroll-mt-24">
      <ol className="mb-8 flex gap-1.5 overflow-x-auto pb-1" aria-label={t("stepOf", { current: d.step + 1, total: LAST_STEP + 1 })}>
        {steps.map((s, i) => (
          <li key={s} className="min-w-[4.5rem] flex-1">
            <button type="button" disabled={i > d.step} onClick={() => goTo(i)} aria-current={i === d.step ? "step" : undefined} className="flex w-full flex-col gap-1.5 text-start text-xs disabled:cursor-default">
              <span className={`h-1 rounded-full ${i <= d.step ? "bg-sage" : "bg-white/10"}`} />
              <span className={i === d.step ? "font-semibold text-fog" : i < d.step ? "text-mist" : "text-haze"}>{s}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <section className="flex min-w-0 flex-col gap-6" aria-labelledby="builder-step-title">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-haze">{t("stepOf", { current: d.step + 1, total: LAST_STEP + 1 })}</p>
            <h3 id="builder-step-title" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-fog outline-none sm:text-3xl">{t(STEP_TITLES[d.step])}</h3>
          </div>
          {body}
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
            {d.step > 0 && (
              <button type="button" onClick={() => goTo(d.step - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-5 py-3 text-sm font-semibold text-fog hover:bg-white/5">
                <ArrowLeft size={16} aria-hidden className="rtl:rotate-180" /> {t("back")}
              </button>
            )}
            <div className="ms-auto flex flex-wrap items-center justify-end gap-3">
              {d.step < LAST_STEP ? (
                // Distinct keys: React must not reuse this button as the submit button (the click would submit).
                <button key="next" type="button" onClick={next} data-track={`builder_next_${d.step + 1}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-on-sage hover:bg-sage-strong">
                  {d.step === LAST_STEP - 1 ? t("seeProposal") : t("next")} <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
                </button>
              ) : (
                <>
                  {willPay && (
                    <button key="later" type="submit" form="builder-order" value="later" disabled={status === "sending"} data-track="builder_submit_later" className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-5 py-3 text-sm font-semibold text-fog hover:bg-white/5 disabled:opacity-60">
                      {t("submitLater")}
                    </button>
                  )}
                  <button key="now" type="submit" form="builder-order" value="now" disabled={status === "sending"} data-track="builder_submit" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-on-sage hover:bg-sage-strong disabled:opacity-60">
                    {status === "sending" ? <Loader2 size={16} aria-hidden className="animate-spin" /> : null}
                    {status === "sending" ? t("sending") : willPay ? t("submitPay", { deposit: money(quote?.deposit ?? 0) }) : t("submit")}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {d.category && (
            <TemplatePreview
              template={template ?? templates[0]}
              category={d.category}
              brand={d.brand}
              pages={template ? pages : ["home"]}
              activePage={previewPage}
              onPageChange={setPreviewPage}
            />
          )}
          {d.step === LAST_STEP && <div className="hidden lg:block"><QuoteSummary quote={quote} catalog={catalog} billing={d.billing} online={willPay} charge={charge} /></div>}
        </aside>
      </div>
    </div>
  );
}
