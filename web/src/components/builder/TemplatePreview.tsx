"use client";

import { useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Monitor, Phone, Smartphone, Star } from "lucide-react";
import { fontStack, loc, onColor, type BuilderCategory, type BuilderTemplate } from "@/lib/builder";

type Brand = { businessName: string; primary: string; accent: string; font: string; logoUrl?: string };

/**
 * Live mock of the customer's future site: the template's layout with their name, colours, font and logo.
 * Pure HTML/CSS (no screenshots), decorative — the choices are listed in text elsewhere in the wizard.
 */
export default function TemplatePreview({ template, category, brand }: { template?: BuilderTemplate; category: BuilderCategory; brand: Brand }) {
  const t = useTranslations("builder");
  const locale = useLocale();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const layout = template?.layout ?? "classic";
  const sample = t.raw(`samples.${category}`) as { headline: string; sub: string; cta: string; items: string[] };
  const pages = (template?.pages ?? []).slice(0, 4).map((p) => loc(p, locale));
  const name = brand.businessName.trim() || loc(template?.name, locale) || "Your business";

  const vars = {
    "--p": brand.primary,
    "--on-p": onColor(brand.primary),
    "--a": brand.accent,
    "--on-a": onColor(brand.accent),
    fontFamily: fontStack(brand.font),
  } as CSSProperties;

  const mobile = device === "mobile";
  const Logo = (
    <span className="flex min-w-0 items-center gap-2">
      {brand.logoUrl ? (
        <img src={brand.logoUrl} alt="" className="h-6 w-auto max-w-[5rem] object-contain" />
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold" style={{ background: "var(--p)", color: "var(--on-p)" }}>
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="truncate text-[12px] font-bold">{name}</span>
    </span>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-fog">{t("preview")}</p>
        <div className="flex rounded-full border border-line p-0.5" role="group" aria-label={t("preview")}>
          {(["desktop", "mobile"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              aria-pressed={device === d}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${device === d ? "bg-white/10 text-fog" : "text-haze hover:text-fog"}`}
            >
              {d === "desktop" ? <Monitor size={13} aria-hidden /> : <Smartphone size={13} aria-hidden />}
              {t(d)}
            </button>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className={`mx-auto w-full select-none transition-[max-width] duration-300 ${mobile ? "max-w-[15rem]" : "max-w-full"}`}>
        <div className={`overflow-hidden border border-white/10 bg-white text-[#111] shadow-2xl shadow-black/40 ${mobile ? "rounded-[1.75rem] border-[6px] border-ink-3" : "rounded-xl"}`} style={vars}>
          {!mobile && (
            <div className="flex items-center gap-1.5 bg-[#ececec] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
              <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
              <span className="h-2 w-2 rounded-full bg-[#28c840]" />
              <span className="ms-3 truncate rounded bg-white px-2 py-0.5 text-[10px] text-[#666]" dir="ltr">
                {name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourbusiness"}.com
              </span>
            </div>
          )}

          {/* header */}
          <div
            className="flex items-center justify-between gap-2 px-4 py-2.5"
            style={layout === "bold" ? { background: "var(--a)", color: "var(--on-a)" } : { borderBottom: "1px solid #eee" }}
          >
            {Logo}
            {mobile ? (
              <span className="flex flex-col gap-0.5"><span className="h-0.5 w-4 bg-current" /><span className="h-0.5 w-4 bg-current" /><span className="h-0.5 w-4 bg-current" /></span>
            ) : (
              <span className="flex items-center gap-3 text-[10px] opacity-80">
                {pages.map((p) => <span key={p}>{p}</span>)}
                <span className="rounded-full px-2 py-1 font-semibold" style={{ background: "var(--p)", color: "var(--on-p)" }}>{sample.cta}</span>
              </span>
            )}
          </div>

          {/* hero */}
          {layout === "bold" ? (
            <div className="px-5 py-8" style={{ background: "var(--p)", color: "var(--on-p)" }}>
              <p className={`font-bold leading-tight ${mobile ? "text-lg" : "text-2xl"}`}>{sample.headline}</p>
              <p className="mt-2 text-[11px] opacity-85">{sample.sub}</p>
              <span className="mt-4 inline-block rounded-md px-3 py-1.5 text-[11px] font-bold" style={{ background: "var(--a)", color: "var(--on-a)" }}>{sample.cta}</span>
            </div>
          ) : layout === "minimal" ? (
            <div className="px-5 py-9 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--p)" }}>{name}</p>
              <p className={`mt-2 font-semibold leading-tight ${mobile ? "text-lg" : "text-2xl"}`}>{sample.headline}</p>
              <p className="mx-auto mt-2 max-w-xs text-[11px] text-[#666]">{sample.sub}</p>
              <span className="mt-4 inline-block border-b-2 pb-0.5 text-[11px] font-semibold" style={{ borderColor: "var(--p)" }}>{sample.cta} →</span>
            </div>
          ) : (
            <div className={`grid items-center gap-4 px-5 py-7 ${mobile ? "" : "grid-cols-[1.2fr_1fr]"}`} style={{ background: "color-mix(in srgb, var(--p) 8%, white)" }}>
              <div>
                <p className={`font-bold leading-tight ${mobile ? "text-lg" : "text-xl"}`} style={{ color: "var(--a)" }}>{sample.headline}</p>
                <p className="mt-2 text-[11px] text-[#555]">{sample.sub}</p>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: "var(--p)", color: "var(--on-p)" }}>
                  <Phone size={11} /> {sample.cta}
                </span>
              </div>
              {!mobile && <div className="aspect-[4/3] rounded-lg" style={{ background: "linear-gradient(135deg, var(--p), var(--a))", opacity: 0.85 }} />}
            </div>
          )}

          {/* sections */}
          <div className={`grid gap-2 px-5 py-5 ${mobile ? "grid-cols-1" : "grid-cols-3"}`}>
            {sample.items.map((item) => (
              <div
                key={item}
                className={layout === "minimal" ? "border-t pt-2" : "rounded-lg p-3"}
                style={layout === "minimal" ? { borderColor: "#e5e5e5" } : { background: layout === "bold" ? "color-mix(in srgb, var(--a) 7%, white)" : "#f6f6f6" }}
              >
                <span className="mb-1.5 block h-1.5 w-6 rounded-full" style={{ background: "var(--p)" }} />
                <p className="text-[11px] font-semibold">{item}</p>
                <span className="mt-1 block h-1 w-4/5 rounded bg-[#ddd]" />
                <span className="mt-1 block h-1 w-3/5 rounded bg-[#e8e8e8]" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-5 pb-4 text-[10px] text-[#777]">
            <span className="flex gap-0.5" style={{ color: "var(--p)" }}>
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
            </span>
            <span>© {name}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-haze">{t("previewNote")}</p>
    </div>
  );
}
