"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Star } from "@/lib/builder";
import { JOIN_POINT, SKY_H, SKY_W, groupOf, layoutGalaxy } from "@/lib/galaxy";
import LazyStarfield from "@/components/hero/LazyStarfield";
import styles from "./Galaxy.module.css";

export type GalaxyLabels = {
  all: string;
  join: string;
  joinBody: string;
  readCase: string;
  visit: string;
  since: string;
  listLabel: string;
  empty: string;
  constellations: Record<string, string>;
};

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * Clients drawn as stars, grouped into constellations. SVG draws the decoration (glows, lines);
 * each star is a real button positioned over it, so it's keyboard- and screen-reader-friendly.
 * On small screens a plain list of clients is shown under the sky.
 */
export default function Galaxy({ stars, labels, joinHref = "/website-builder" }: { stars: Star[]; labels: GalaxyLabels; joinHref?: string }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const constellations = useMemo(() => layoutGalaxy(stars), [stars]);
  const groupName = (key: string) => labels.constellations[key] ?? key;
  const activeStar = constellations.flatMap((c) => c.stars).find((s) => s._id === active);

  return (
    <div className="flex flex-col gap-5">
      {constellations.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={labels.listLabel}>
          {[null, ...constellations.map((c) => c.key)].map((key) => (
            <button
              key={key ?? "all"}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`rounded-full border px-4 py-1.5 text-sm ${filter === key ? "border-sage bg-sage/10 text-fog" : "border-line text-mist hover:text-fog"}`}
            >
              {key ? groupName(key) : labels.all}
            </button>
          ))}
        </div>
      )}

      <div className={`${styles.sky} relative overflow-hidden rounded-[2rem] border border-line`} style={{ aspectRatio: `${SKY_W} / ${SKY_H}` }} onMouseLeave={() => setActive(null)}>
        <LazyStarfield className="absolute inset-0 h-full w-full opacity-60" />
        <svg viewBox={`0 0 ${SKY_W} ${SKY_H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <radialGradient id="galaxy-glow">
              <stop offset="0%" stopColor="#c6d59c" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#72c04f" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#72c04f" stopOpacity="0" />
            </radialGradient>
          </defs>
          {constellations.map((c) => {
            const dim = filter && filter !== c.key;
            return (
              <g key={c.key} className={styles.group} style={{ opacity: dim ? 0.12 : 1 }}>
                {c.path && <path d={c.path} className={styles.line} />}
                {c.stars.map((s, i) => (
                  <circle key={s._id} cx={s.x} cy={s.y} r={s.r * 4} fill="url(#galaxy-glow)" className={styles.twinkle} style={{ animationDelay: `${(i * 0.7) % 4}s` }} />
                ))}
                <text x={c.labelX} y={c.labelY} textAnchor="middle" className={styles.label}>
                  {groupName(c.key)}
                </text>
              </g>
            );
          })}
          <circle cx={JOIN_POINT.x} cy={JOIN_POINT.y} r={26} className={styles.joinRing} />
        </svg>

        {constellations.flatMap((c) =>
          c.stars.map((s) => {
            const dim = filter && filter !== c.key;
            return (
              <button
                key={s._id}
                type="button"
                className={`${styles.star} ${active === s._id ? styles.on : ""}`}
                style={{ left: pct(s.x, SKY_W), top: pct(s.y, SKY_H), width: s.r * 2 + 18, height: s.r * 2 + 18, opacity: dim ? 0.25 : 1 }}
                aria-label={`${s.name}${s.industry ? `, ${s.industry}` : ""}`}
                aria-expanded={active === s._id}
                tabIndex={dim ? -1 : 0}
                onMouseEnter={() => setActive(s._id)}
                onFocus={() => setActive(s._id)}
                onClick={() => setActive(active === s._id ? null : s._id)}
              >
                <span className={styles.core} style={{ width: s.r * 2, height: s.r * 2 }} />
              </button>
            );
          }),
        )}

        <Link href={joinHref} className={styles.join} style={{ left: pct(JOIN_POINT.x, SKY_W), top: pct(JOIN_POINT.y, SKY_H) }} data-track="galaxy_join" title={labels.joinBody}>
          <Plus size={16} aria-hidden />
          <span className={styles.joinText}>{labels.join}</span>
        </Link>

        {activeStar && (
          <div
            role="status"
            className={`${styles.card} glass`}
            style={{
              top: pct(Math.min(activeStar.y, SKY_H - 150), SKY_H),
              ...(activeStar.x > SKY_W / 2 ? { right: pct(SKY_W - activeStar.x + 24, SKY_W) } : { left: pct(activeStar.x + 24, SKY_W) }),
            }}
          >
            <div className="flex items-center gap-3">
              {activeStar.logoUrl ? (
                // plain img: CMS logo on the API origin
                <img src={activeStar.logoUrl} alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-1" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage/20 font-display font-semibold text-sage">{activeStar.name.slice(0, 1)}</span>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-fog">{activeStar.name}</p>
                <p className="truncate text-xs text-haze">{[activeStar.industry, activeStar.country, groupName(groupOf(activeStar))].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            {activeStar.highlight && <p className="text-sm text-mist">{activeStar.highlight}</p>}
            {activeStar.since && <p className="text-xs text-haze">{labels.since.replace("{year}", String(activeStar.since))}</p>}
            <div className="flex flex-wrap gap-3 text-sm">
              {activeStar.caseStudy?.slug && (
                <Link href={`/work/${activeStar.caseStudy.slug}`} className="inline-flex items-center gap-1 font-semibold text-sage hover:text-fog">
                  {labels.readCase} <ArrowUpRight size={14} aria-hidden className="rtl:-scale-x-100" />
                </Link>
              )}
              {activeStar.url && /^https?:\/\//.test(activeStar.url) && (
                <a href={activeStar.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-mist hover:text-fog">
                  {labels.visit} <ArrowUpRight size={14} aria-hidden className="rtl:-scale-x-100" />
                </a>
              )}
            </div>
          </div>
        )}

        {stars.length === 0 && <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-mist">{labels.empty}</p>}
      </div>

      {stars.length > 0 && (
        <ul className="flex flex-wrap gap-2 sm:hidden" aria-label={labels.listLabel}>
          {stars.map((s) => (
            <li key={s._id}>
              {s.caseStudy?.slug ? (
                <Link href={`/work/${s.caseStudy.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-fog">
                  <span className="text-sage" aria-hidden>✦</span> {s.name}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-mist">
                  <span className="text-sage" aria-hidden>✦</span> {s.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
