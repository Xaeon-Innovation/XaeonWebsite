import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ButtonLink from "../ButtonLink";
import LazyStarfield from "./LazyStarfield";
import styles from "./HeroCinematic.module.css";

const STAR = "M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4 Z";
// The orbit: a wide ellipse, tilted, sweeping across the whole stage (viewBox 1600×900).
const ORBIT = "M 60 520 A 740 230 0 1 1 1540 520 A 740 230 0 1 1 60 520 Z";

/** The logo's orbit and star at stage scale; the star travels the ring (SMIL scales with the SVG). */
function OrbitStage() {
  return (
    <svg className={styles.orbit} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="hero-orbit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#72c04f" stopOpacity="0" />
          <stop offset="0.45" stopColor="#72c04f" stopOpacity="0.55" />
          <stop offset="0.8" stopColor="#c6d59c" stopOpacity="0.25" />
          <stop offset="1" stopColor="#72c04f" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hero-star-glow">
          <stop offset="0" stopColor="#8fd06b" stopOpacity="0.9" />
          <stop offset="1" stopColor="#8fd06b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform="rotate(-11 800 520)">
        <path id="hero-orbit-path" d={ORBIT} fill="none" stroke="url(#hero-orbit)" strokeWidth="2" />
        <ellipse cx="800" cy="520" rx="790" ry="270" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* Moving star + fading trail (hidden under reduced motion). */}
        <g className={styles.orbitMoving}>
          {[0.36, 0.24, 0.12].map((lag, i) => (
            <circle key={lag} r={10 - i * 3} fill="url(#hero-star-glow)" opacity={0.25 + i * 0.15}>
              <animateMotion dur="18s" repeatCount="indefinite" begin={`-${lag}s`} rotate="0">
                <mpath href="#hero-orbit-path" />
              </animateMotion>
            </circle>
          ))}
          <g>
            <circle r="42" fill="url(#hero-star-glow)" opacity="0.55" />
            <path d={STAR} fill="#8fd06b" />
            <animateMotion dur="18s" repeatCount="indefinite" rotate="0">
              <mpath href="#hero-orbit-path" />
            </animateMotion>
          </g>
        </g>

        {/* Still star for reduced motion. */}
        <g className={styles.orbitStatic} transform="translate(1290 330)">
          <circle r="42" fill="url(#hero-star-glow)" opacity="0.55" />
          <path d={STAR} fill="#8fd06b" />
        </g>
      </g>
    </svg>
  );
}

export default async function HeroCinematic() {
  const t = await getTranslations("home.hero");
  const words = t.raw("words") as string[];
  const fade = (d: number) => ({ "--d": `${d}s` }) as CSSProperties;

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.glow} aria-hidden="true" />
      <LazyStarfield className={styles.stars} />
      <OrbitStage />
      <div className={styles.grain} aria-hidden="true" />

      <div className={`container-x ${styles.content}`}>
        <Link
          href="/website-builder"
          className={`glass ${styles.fade} inline-flex max-w-full items-center gap-2 self-start rounded-full px-4 py-2 text-sm text-mist hover:text-fog`}
          style={fade(0.05)}
          data-track="hero_builder_badge"
        >
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full rounded-full bg-sage opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sage" />
          </span>
          <span className="truncate">{t("badge")}</span>
          <ArrowRight size={14} aria-hidden className="shrink-0 rtl:rotate-180" />
        </Link>

        <p className={`eyebrow ${styles.fade}`} style={fade(0.1)}>
          {t("eyebrow")}
        </p>

        <h1 id="hero-title" className={styles.title}>
          <span className={styles.line}>
            <span className={styles.lineInner}>{t("titleA")}</span>
          </span>
          <span className={styles.line}>
            <span className={`${styles.lineInner} ${styles.accent}`}>{t("titleB")}</span>
          </span>
        </h1>

        <p className={styles.build}>
          <span className="sr-only">{t("wordsSr")}</span>
          <span aria-hidden="true">{t("weBuild")}</span>
          <span className={styles.reel} aria-hidden="true">
            <span className={styles.reelList}>
              {[...words, words[0]].map((w, i) => (
                <span key={`${w}-${i}`} className={styles.reelWord}>
                  {w}
                </span>
              ))}
            </span>
          </span>
        </p>

        {/* Visible from the first frame: it's the hero's largest text (LCP), so no fade. */}
        <p className={styles.subtitle}>
          {t("subtitle")}
        </p>

        <div className={`flex flex-wrap gap-3 ${styles.fade}`} style={fade(0.65)}>
          <ButtonLink href="/book" data-track="hero_book_call">
            {t("primary")}
          </ButtonLink>
          <ButtonLink href="/services" variant="secondary" data-track="hero_services">
            {t("secondary")}
          </ButtonLink>
        </div>
      </div>

      <div className={`container-x ${styles.hud}`}>
        <div className={styles.hudSide}>
          <span>{t("est")}</span>
          <span>{t("place")}</span>
        </div>
        <a href="#services-title" className={styles.scrollCue}>
          <span>{t("scroll")}</span>
          <span className={styles.scrollLine} aria-hidden="true" />
        </a>
        <div className={`${styles.hudSide} items-end text-end`} dir="ltr">
          <span>31°12′N · 29°55′E</span>
          <span>xaeons.com</span>
        </div>
      </div>
    </section>
  );
}
