"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Clock, MapPin, MessageCircle, Monitor, Phone, Smartphone, Star } from "lucide-react";
import { fontStack, onColor, type BuilderCategory, type BuilderTemplate, type CornerStyle, type PageKey, type ThemeMode } from "@/lib/builder";

export type PreviewBrand = {
  businessName: string;
  primary: string;
  accent: string;
  font: string;
  logoUrl?: string;
  mode?: ThemeMode;
  corners?: CornerStyle;
};

type Sample = { headline: string; sub: string; cta: string; items: string[]; role: string };
type Copy = {
  people: string[];
  story: string;
  values: string[];
  stats: string[];
  slots: string[];
  days: string[];
  form: string[];
  send: string;
  hours: string;
  tiers: string[];
  posts: string[];
  faqs: string[];
  quote: string;
  order: string;
  courseMeta: string;
  listingMeta: string;
  jobs: string[];
  apply: string;
  readMore: string;
  welcome: string;
};

const RADIUS: Record<CornerStyle, { card: number; button: number }> = {
  sharp: { card: 2, button: 2 },
  soft: { card: 10, button: 8 },
  round: { card: 18, button: 999 },
};

/**
 * Live, clickable mock of the customer's future site: their chosen pages in the template's look
 * (layout, hero, light/dark, corners) with their name, colours, font and logo. Pure HTML/CSS.
 * Decorative for screen readers: every choice is also listed as text in the wizard.
 */
export default function TemplatePreview({
  template,
  category,
  brand,
  pages,
  activePage,
  onPageChange,
}: {
  template?: BuilderTemplate;
  category: BuilderCategory;
  brand: PreviewBrand;
  pages: PageKey[];
  activePage?: PageKey;
  onPageChange?: (page: PageKey) => void;
}) {
  const t = useTranslations("builder");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [menuOpen, setMenuOpen] = useState(false);
  const sample = t.raw(`samples.${category}`) as Sample;
  const copy = t.raw("previewCopy") as Copy;
  const layout = template?.layout ?? "classic";
  const hero = template?.hero ?? "split";
  const mode = brand.mode ?? template?.mode ?? "light";
  const corners = brand.corners ?? template?.corners ?? "soft";
  const r = RADIUS[corners];
  const dark = mode === "dark";
  const name = brand.businessName.trim() || template?.name.en || t("previewName");
  const shown: PageKey[] = pages.length ? pages : ["home"];
  const page = activePage && shown.includes(activePage) ? activePage : shown[0];
  const mobile = device === "mobile";
  const pageName = (key: PageKey) => (key === "team" ? t(`teamName.${category}`) : t(`pages.${key}.name`));

  const vars = {
    "--p": brand.primary,
    "--on-p": onColor(brand.primary),
    "--a": brand.accent,
    "--on-a": onColor(brand.accent),
    "--bg": dark ? "#0e1013" : "#ffffff",
    "--fg": dark ? "#f2f3f5" : "#141414",
    "--muted": dark ? "#9aa0a8" : "#666666",
    "--card": dark ? "#181b20" : layout === "bold" ? "color-mix(in srgb, var(--a) 7%, white)" : "#f5f5f4",
    "--line": dark ? "#2a2e35" : "#e7e5e4",
    "--rc": `${r.card}px`,
    "--rb": `${r.button}px`,
    fontFamily: fontStack(brand.font),
  } as CSSProperties;

  const card = layout === "minimal" ? "border-t border-[var(--line)] pt-2" : "rounded-[var(--rc)] bg-[var(--card)] p-3";
  const btn = "inline-flex items-center gap-1 rounded-[var(--rb)] px-3 py-1.5 text-[10px] font-bold";
  const primaryBtn = { background: "var(--p)", color: "var(--on-p)" };
  const title = (text: string) => <p className={`mb-3 font-bold ${mobile ? "text-[15px]" : "text-lg"}`}>{text}</p>;
  const lines = (n: number) => (
    <span className="mt-1 flex flex-col gap-1">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="block h-1 rounded bg-[var(--line)]" style={{ width: `${90 - i * 18}%` }} />
      ))}
    </span>
  );
  const grid = (n: number) => `grid gap-2 ${mobile ? "grid-cols-1" : n >= 3 ? "grid-cols-3" : "grid-cols-2"}`;
  const img = (h: string, i = 0) => (
    <span
      className={`block w-full ${h} rounded-[var(--rc)]`}
      style={{ background: `linear-gradient(${135 + i * 40}deg, var(--p), var(--a))`, opacity: 0.55 + (i % 3) * 0.15 }}
    />
  );
  const avatar = (who: string, i: number) => (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
      style={{ background: i % 2 ? "var(--a)" : "var(--p)", color: i % 2 ? "var(--on-a)" : "var(--on-p)" }}
    >
      {who.replace(/^(Dr\.|د\.)\s*/, "").slice(0, 1)}
    </span>
  );

  const heroBlock =
    hero === "banner" ? (
      <div className="px-5 py-8" style={{ background: "var(--p)", color: "var(--on-p)" }}>
        <p className={`font-bold leading-tight ${mobile ? "text-lg" : "text-2xl"}`}>{sample.headline}</p>
        <p className="mt-2 text-[11px] opacity-85">{sample.sub}</p>
        <span className={`${btn} mt-4`} style={{ background: "var(--a)", color: "var(--on-a)" }}>{sample.cta}</span>
      </div>
    ) : hero === "centered" ? (
      <div className="px-5 py-9 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--p)" }}>{copy.welcome.replace("{name}", name)}</p>
        <p className={`mt-2 font-bold leading-tight ${mobile ? "text-lg" : "text-2xl"}`}>{sample.headline}</p>
        <p className="mx-auto mt-2 max-w-xs text-[11px] text-[var(--muted)]">{sample.sub}</p>
        <span className={`${btn} mt-4`} style={primaryBtn}>{sample.cta}</span>
      </div>
    ) : (
      <div
        className={`grid items-center gap-4 px-5 py-7 ${mobile ? "" : "grid-cols-[1.2fr_1fr]"}`}
        style={{ background: dark ? "#14171c" : "color-mix(in srgb, var(--p) 8%, white)" }}
      >
        <div>
          <p className={`font-bold leading-tight ${mobile ? "text-lg" : "text-xl"}`} style={{ color: dark ? "var(--fg)" : "var(--a)" }}>{sample.headline}</p>
          <p className="mt-2 text-[11px] text-[var(--muted)]">{sample.sub}</p>
          <span className={`${btn} mt-3`} style={primaryBtn}><Phone size={10} /> {sample.cta}</span>
        </div>
        {!mobile && img("aspect-[4/3]")}
      </div>
    );

  const services = (
    <div className={grid(3)}>
      {[...sample.items, ...sample.items].slice(0, mobile ? 3 : 6).map((item, i) => (
        <div key={`${item}-${i}`} className={card}>
          <span className="mb-1.5 block h-1.5 w-6 rounded-full" style={{ background: "var(--p)" }} />
          <p className="text-[11px] font-semibold">{item}</p>
          {lines(2)}
        </div>
      ))}
    </div>
  );

  const testimonials = (
    <div className={grid(3)}>
      {copy.people.slice(0, 3).map((who, i) => (
        <div key={who} className={card}>
          <span className="flex gap-0.5" style={{ color: "var(--p)" }}>
            {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={9} fill="currentColor" />)}
          </span>
          <p className="mt-1.5 text-[10px] italic">“{copy.quote}”</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold">{avatar(who, i)} {who}</p>
        </div>
      ))}
    </div>
  );

  const body: Record<PageKey, ReactNode> = {
    home: (
      <>
        {heroBlock}
        <div className="flex flex-col gap-5 px-5 py-5">
          {services}
          <div className="rounded-[var(--rc)] p-4 text-center" style={{ background: "var(--a)", color: "var(--on-a)" }}>
            <p className="text-[12px] font-bold">{sample.headline}</p>
            <span className={`${btn} mt-2`} style={primaryBtn}>{sample.cta}</span>
          </div>
        </div>
      </>
    ),
    about: (
      <>
        <div className={`grid items-center gap-4 ${mobile ? "" : "grid-cols-2"}`}>
          <div>
            {title(pageName("about"))}
            <p className="text-[11px] text-[var(--muted)]">{copy.story}</p>
            {lines(3)}
          </div>
          {img("aspect-[4/3]", 1)}
        </div>
        <div className={`mt-4 ${grid(3)}`}>
          {copy.values.map((v, i) => (
            <div key={v} className={card}>
              <p className="text-[18px] font-bold" style={{ color: "var(--p)" }} dir="ltr">{["12+", "3k", "4.9"][i]}</p>
              <p className="text-[10px] text-[var(--muted)]">{copy.stats[i]}</p>
              <p className="mt-1 text-[11px] font-semibold">{v}</p>
            </div>
          ))}
        </div>
      </>
    ),
    services: (
      <>
        {title(pageName("services"))}
        {services}
      </>
    ),
    team: (
      <>
        {title(pageName("team"))}
        <div className={`grid gap-2 ${mobile ? "grid-cols-2" : "grid-cols-4"}`}>
          {copy.people.map((who, i) => (
            <div key={who} className={`${card} flex flex-col items-center text-center`}>
              {avatar(who, i)}
              <p className="mt-1.5 text-[10px] font-semibold">{who}</p>
              <p className="text-[9px] text-[var(--muted)]">{sample.role}</p>
            </div>
          ))}
        </div>
      </>
    ),
    booking: (
      <>
        {title(pageName("booking"))}
        <div className={`grid gap-3 ${mobile ? "" : "grid-cols-[1.3fr_1fr]"}`}>
          <div className={card}>
            <div className="grid grid-cols-7 gap-1 text-center text-[9px]" dir="ltr">
              {Array.from({ length: 21 }).map((_, i) => (
                <span key={i} className="rounded-[var(--rb)] py-1" style={i === 9 ? primaryBtn : { color: i % 7 === 5 ? "var(--muted)" : undefined }}>
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-1 text-[10px] text-[var(--muted)]"><Clock size={10} /> {sample.items[0]}</p>
            {copy.slots.map((s, i) => (
              <span
                key={s}
                className="rounded-[var(--rb)] border border-[var(--line)] px-2 py-1 text-center text-[10px]"
                style={i === 1 ? { ...primaryBtn, borderColor: "transparent" } : undefined}
                dir="ltr"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </>
    ),
    contact: (
      <>
        {title(pageName("contact"))}
        <div className={`grid gap-3 ${mobile ? "" : "grid-cols-2"}`}>
          <div className="flex flex-col gap-1.5">
            {copy.form.map((f) => (
              <span key={f} className="rounded-[var(--rb)] border border-[var(--line)] px-2 py-1.5 text-[10px] text-[var(--muted)]">{f}</span>
            ))}
            <span className={btn} style={primaryBtn}>{copy.send}</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative h-24 rounded-[var(--rc)] bg-[var(--card)]">
              <MapPin size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: "var(--p)" }} />
            </div>
            <p className="flex items-center gap-1 text-[10px] text-[var(--muted)]"><Clock size={10} /> {copy.hours}</p>
            <p className="flex items-center gap-1 text-[10px] text-[var(--muted)]"><MessageCircle size={10} /> WhatsApp</p>
          </div>
        </div>
      </>
    ),
    gallery: (
      <>
        {title(pageName("gallery"))}
        <div className={`grid gap-2 ${mobile ? "grid-cols-2" : "grid-cols-3"}`}>
          {Array.from({ length: 6 }).map((_, i) => <span key={i}>{img(i % 3 === 0 ? "aspect-[3/4]" : "aspect-square", i)}</span>)}
        </div>
      </>
    ),
    menu: (
      <>
        {title(pageName("menu"))}
        {sample.items.map((section, si) => (
          <div key={section} className="mb-3">
            <p className="mb-1 text-[11px] font-bold" style={{ color: "var(--p)" }}>{section}</p>
            {[0, 1].map((k) => (
              <p key={k} className="flex items-baseline gap-2 text-[10px]">
                <span>{sample.items[(si + k + 1) % 3]}</span>
                <span className="flex-1 border-b border-dotted border-[var(--line)]" />
                <span className="font-semibold tabular-nums" dir="ltr">{120 + si * 40 + k * 15}</span>
              </p>
            ))}
          </div>
        ))}
      </>
    ),
    pricing: (
      <>
        {title(pageName("pricing"))}
        <div className={grid(3)}>
          {copy.tiers.map((tier, i) => (
            <div key={tier} className={`${card} text-center`} style={i === 1 ? { outline: "2px solid var(--p)" } : undefined}>
              <p className="text-[11px] font-semibold">{tier}</p>
              <p className="my-1 text-lg font-bold tabular-nums" dir="ltr">{[300, 600, 950][i]}</p>
              {lines(3)}
              <span className={`${btn} mt-2`} style={i === 1 ? primaryBtn : { border: "1px solid var(--line)" }}>{sample.cta}</span>
            </div>
          ))}
        </div>
      </>
    ),
    blog: (
      <>
        {title(pageName("blog"))}
        <div className={grid(3)}>
          {copy.posts.map((p, i) => (
            <div key={p} className={layout === "minimal" ? "" : "overflow-hidden rounded-[var(--rc)] bg-[var(--card)]"}>
              {img("aspect-video !rounded-none", i)}
              <div className="p-2">
                <p className="text-[10px] font-semibold">{p}</p>
                <p className="mt-1 text-[9px]" style={{ color: "var(--p)" }}>{copy.readMore}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
    faq: (
      <>
        {title(pageName("faq"))}
        {copy.faqs.map((q, i) => (
          <div key={q} className="border-b border-[var(--line)] py-2">
            <p className="flex items-center justify-between text-[11px] font-semibold">
              {q}
              <ChevronDown size={12} style={{ transform: i === 0 ? "rotate(180deg)" : undefined }} />
            </p>
            {i === 0 && lines(2)}
          </div>
        ))}
      </>
    ),
    testimonials: (
      <>
        {title(pageName("testimonials"))}
        {testimonials}
      </>
    ),
    products: (
      <>
        {title(pageName("products"))}
        <div className={`grid gap-2 ${mobile ? "grid-cols-2" : "grid-cols-3"}`}>
          {[...sample.items, ...sample.items].map((item, i) => (
            <div key={`${item}-${i}`} className={card}>
              {img("aspect-square", i)}
              <p className="mt-1.5 text-[10px] font-semibold">{item}</p>
              <p className="text-[10px] font-bold tabular-nums" dir="ltr" style={{ color: "var(--p)" }}>{250 + i * 90}</p>
              <span className={`${btn} mt-1 !px-2`} style={{ background: "#25d366", color: "#fff" }}><MessageCircle size={9} /> {copy.order}</span>
            </div>
          ))}
        </div>
      </>
    ),
    courses: (
      <>
        {title(pageName("courses"))}
        <div className={grid(3)}>
          {sample.items.map((c, i) => (
            <div key={c} className={card}>
              {img("aspect-video", i)}
              <p className="mt-1.5 text-[11px] font-semibold">{c}</p>
              <p className="text-[9px] text-[var(--muted)]">{copy.courseMeta}</p>
              <span className={`${btn} mt-2`} style={primaryBtn}>{sample.cta}</span>
            </div>
          ))}
        </div>
      </>
    ),
    projects: (
      <>
        {title(pageName("projects"))}
        <div className={`grid gap-2 ${mobile ? "grid-cols-1" : "grid-cols-2"}`}>
          {[...sample.items, sample.headline].slice(0, 4).map((p, i) => (
            <div key={p} className="relative">
              {img("aspect-[16/10]", i)}
              <p className="absolute bottom-2 start-2 rounded-[var(--rb)] bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">{p}</p>
            </div>
          ))}
        </div>
      </>
    ),
    listings: (
      <>
        {title(pageName("listings"))}
        <div className={grid(3)}>
          {sample.items.map((l, i) => (
            <div key={l} className={card}>
              {img("aspect-[4/3]", i)}
              <p className="mt-1.5 text-[11px] font-semibold">{l}</p>
              <p className="text-[9px] text-[var(--muted)]">{copy.listingMeta}</p>
              <p className="mt-1 text-[11px] font-bold tabular-nums" dir="ltr" style={{ color: "var(--p)" }}>{(2.4 + i * 1.1).toFixed(1)}M</p>
            </div>
          ))}
        </div>
      </>
    ),
    schedule: (
      <>
        {title(pageName("schedule"))}
        <div className="grid gap-1 text-[9px]" style={{ gridTemplateColumns: `repeat(${mobile ? 3 : 5}, minmax(0, 1fr))` }}>
          {copy.days.slice(0, mobile ? 3 : 5).map((d) => <p key={d} className="text-center font-bold">{d}</p>)}
          {Array.from({ length: (mobile ? 3 : 5) * 3 }).map((_, i) => (
            <span key={i} className="rounded-[var(--rb)] px-1 py-1.5 text-center" style={i % 4 === 1 ? primaryBtn : { background: "var(--card)" }}>
              {i % 4 === 3 ? "—" : sample.items[i % 3]}
            </span>
          ))}
        </div>
      </>
    ),
    careers: (
      <>
        {title(pageName("careers"))}
        {copy.jobs.map((j) => (
          <div key={j} className="flex items-center justify-between border-b border-[var(--line)] py-2 text-[11px]">
            <span className="font-semibold">{j}</span>
            <span className={btn} style={primaryBtn}>{copy.apply}</span>
          </div>
        ))}
      </>
    ),
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-fog">{t("preview")}</p>
        <div className="flex rounded-full border border-line p-0.5" role="group" aria-label={t("preview")}>
          {(["desktop", "mobile"] as const).map((dv) => (
            <button
              key={dv}
              type="button"
              onClick={() => setDevice(dv)}
              aria-pressed={device === dv}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${device === dv ? "bg-white/10 text-fog" : "text-haze hover:text-fog"}`}
            >
              {dv === "desktop" ? <Monitor size={13} aria-hidden /> : <Smartphone size={13} aria-hidden />}
              {t(dv)}
            </button>
          ))}
        </div>
      </div>

      {shown.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("previewPages")}>
          {shown.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={page === key}
              onClick={() => onPageChange?.(key)}
              className={`rounded-full border px-3 py-1 text-xs ${page === key ? "border-sage bg-sage/10 text-fog" : "border-line text-mist hover:text-fog"}`}
            >
              {pageName(key)}
            </button>
          ))}
        </div>
      )}

      <div aria-hidden="true" className={`mx-auto w-full select-none transition-[max-width] duration-300 ${mobile ? "max-w-[16rem]" : "max-w-full"}`}>
        <div
          className={`overflow-hidden border text-[var(--fg)] shadow-2xl shadow-black/40 ${mobile ? "rounded-[1.75rem] border-[6px] border-ink-3" : "rounded-xl border-white/10"}`}
          style={{ ...vars, background: "var(--bg)" }}
        >
          {!mobile && (
            <div className="flex items-center gap-1.5 bg-[#ececec] px-3 py-2" dir="ltr">
              <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
              <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
              <span className="h-2 w-2 rounded-full bg-[#28c840]" />
              <span className="ms-3 truncate rounded bg-white px-2 py-0.5 text-[10px] text-[#666]">
                {name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourbusiness"}.com{page === "home" ? "" : `/${page}`}
              </span>
            </div>
          )}

          <div
            className="relative flex items-center justify-between gap-2 px-4 py-2.5"
            style={layout === "bold" ? { background: "var(--a)", color: "var(--on-a)" } : { borderBottom: "1px solid var(--line)" }}
          >
            <span className="flex min-w-0 items-center gap-2">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="h-6 w-auto max-w-[5rem] object-contain" />
              ) : (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--rb)] text-[11px] font-bold" style={primaryBtn}>
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="truncate text-[12px] font-bold">{name}</span>
            </span>
            {mobile ? (
              <span className="flex cursor-pointer flex-col gap-0.5" onClick={() => setMenuOpen((o) => !o)}>
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
                <span className="h-0.5 w-4 bg-current" />
              </span>
            ) : (
              <span className="flex items-center gap-3 text-[10px]">
                {shown.slice(0, 6).map((key) => (
                  <span
                    key={key}
                    className="cursor-pointer"
                    style={{ opacity: page === key ? 1 : 0.7, fontWeight: page === key ? 700 : 400 }}
                    onClick={() => onPageChange?.(key)}
                  >
                    {pageName(key)}
                  </span>
                ))}
                <span className={btn} style={primaryBtn}>{sample.cta}</span>
              </span>
            )}
            {mobile && menuOpen && (
              <span className="absolute inset-x-0 top-full z-10 flex flex-col gap-1 bg-[var(--bg)] p-3 text-[11px] shadow-lg">
                {shown.map((key) => (
                  <span
                    key={key}
                    className="cursor-pointer"
                    onClick={() => {
                      onPageChange?.(key);
                      setMenuOpen(false);
                    }}
                  >
                    {pageName(key)}
                  </span>
                ))}
              </span>
            )}
          </div>

          {page === "home" ? body.home : <div className="px-5 py-6">{body[page]}</div>}

          <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] px-5 py-3 text-[10px] text-[var(--muted)]">
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
