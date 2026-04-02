import { useRef, useEffect, useId } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Sparkles,
  UsersRound,
  LineChart,
  Globe2,
  ClipboardCheck,
  Check,
} from "lucide-react";
import { cn } from "../../lib/cn";
import styles from "./WhyChooseUs.module.css";

interface Feature {
  title: string;
  description: string;
  Icon: LucideIcon;
}

const FEATURES: Feature[] = [
  {
    title: "Industry-First Expertise",
    description:
      "We specialize in healthcare and education software — we know your market, your workflows, and your challenges before you explain them.",
    Icon: Building2,
  },
  {
    title: "AI That Actually Works",
    description:
      "Our solutions aren't just automated, they're intelligent. From patient reactivation to smart follow-ups, AI is built into everything we ship.",
    Icon: Sparkles,
  },
  {
    title: "One Team. Full Ownership.",
    description:
      "Design, development, AI, and deployment, all in-house. No middlemen, no delays, no excuses.",
    Icon: UsersRound,
  },
  {
    title: "Results You Can Measure",
    description:
      "We build for outcomes, not just deliverables. Expect faster payback, lower operational costs, and real business growth.",
    Icon: LineChart,
  },
  {
    title: "Made for the MENA Market",
    description:
      "Arabic-first design, local payment integrations, and WhatsApp-native workflows, built the way your customers actually operate.",
    Icon: Globe2,
  },
  {
    title: "Agile Team. Enterprise Standards.",
    description:
      "You get a responsive, founder-led team backed by full documentation, structured timelines, and professional delivery every time.",
    Icon: ClipboardCheck,
  },
];

const SCROLL_TRIGGER_ID = "why-choose-pipeline-scrub";

function readAccentColor(): string {
  if (typeof window === "undefined") return "#72c04f";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-accent")
    .trim();
  return v || "#72c04f";
}

/** Convert dot center to SVG user space (paths must use the same box as the SVG viewport). */
function dotCenterInSvgSpace(
  el: HTMLElement | null,
  svgRect: DOMRect,
  fallback: { x: number; y: number }
): { x: number; y: number } {
  if (!el) return fallback;
  const hidden = getComputedStyle(el).display === "none";
  if (hidden) return fallback;
  const r = el.getBoundingClientRect();
  if (r.width < 0.5 && r.height < 0.5) return fallback;
  return {
    x: r.left + r.width / 2 - svgRect.left,
    y: r.top + r.height / 2 - svgRect.top,
  };
}

function buildRoutes(
  wrap: HTMLElement,
  svg: SVGSVGElement,
  accent: string,
  markerEndId: string
): number {
  const cards = Array.from(
    wrap.querySelectorAll<HTMLElement>("[data-reason-card]")
  );
  const svgRect = svg.getBoundingClientRect();

  svg.querySelectorAll("[data-route-group]").forEach((g) => g.remove());

  const segments: { d: string }[] = [];

  for (let i = 0; i < cards.length - 1; i++) {
    const from = cards[i];
    const to = cards[i + 1];
    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();

    const exitEl = from.querySelector<HTMLElement>("[data-pipeline-dot='exit']");
    const entryEl = to.querySelector<HTMLElement>("[data-pipeline-dot='entry']");

    /** Same row, left card → right card (line runs in the column gap, not through cards) */
    const horizontalSegment =
      toRect.left >= fromRect.right - 12 &&
      Math.abs(fromRect.top - toRect.top) < 56;

    let exitFallback: { x: number; y: number };
    let entryFallback: { x: number; y: number };

    if (horizontalSegment) {
      exitFallback = {
        x: fromRect.right - svgRect.left,
        y: fromRect.top + fromRect.height / 2 - svgRect.top,
      };
      entryFallback = {
        x: toRect.left - svgRect.left,
        y: toRect.top + toRect.height / 2 - svgRect.top,
      };
    } else {
      /** Stacked or end-of-row → next row: bottom center → top center, stepped in the margin */
      exitFallback = {
        x: fromRect.left + fromRect.width / 2 - svgRect.left,
        y: fromRect.bottom - svgRect.top,
      };
      entryFallback = {
        x: toRect.left + toRect.width / 2 - svgRect.left,
        y: toRect.top - svgRect.top,
      };
    }

    const exitPt = dotCenterInSvgSpace(exitEl, svgRect, exitFallback);
    const entryPt = dotCenterInSvgSpace(entryEl, svgRect, entryFallback);

    const exitX = exitPt.x;
    const exitY = exitPt.y;
    const entryX = entryPt.x;
    const entryY = entryPt.y;

    let d: string;

    if (horizontalSegment) {
      d = `M ${exitX} ${exitY} L ${entryX} ${entryY}`;
    } else {
      const midY = (exitY + entryY) / 2;
      d = [
        `M ${exitX} ${exitY}`,
        `L ${exitX} ${midY}`,
        `L ${entryX} ${midY}`,
        `L ${entryX} ${entryY}`,
      ].join(" ");
    }

    segments.push({ d });
  }

  const NS = "http://www.w3.org/2000/svg";

  segments.forEach(({ d }) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("data-route-group", "");

    const glow = document.createElementNS(NS, "path");
    glow.setAttribute("d", d);
    glow.setAttribute("fill", "none");
    glow.setAttribute("stroke", accent);
    glow.setAttribute("stroke-width", "9");
    glow.setAttribute("stroke-linecap", "round");
    glow.setAttribute("stroke-linejoin", "round");
    glow.setAttribute("opacity", "0.15");
    glow.style.filter = "blur(6px)";
    glow.setAttribute("data-route-glow", "");

    const line = document.createElementNS(NS, "path");
    line.setAttribute("d", d);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", accent);
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    line.setAttribute("stroke-dasharray", "5 6");
    line.setAttribute("opacity", "0.85");
    line.setAttribute("marker-end", `url(#${markerEndId})`);
    line.setAttribute("data-route-line", "");

    g.appendChild(glow);
    g.appendChild(line);
    svg.appendChild(g);

    const len = line.getTotalLength();
    line.style.strokeDasharray = String(len);
    line.style.strokeDashoffset = String(len);
    glow.style.strokeDasharray = String(len);
    glow.style.strokeDashoffset = String(len);
  });

  return segments.length;
}

function applyStaticPipeline(svg: SVGSVGElement) {
  svg.querySelectorAll<SVGPathElement>("[data-route-line]").forEach((line) => {
    const len = line.getTotalLength();
    line.style.strokeDasharray = String(len);
    line.style.strokeDashoffset = "0";
  });
  svg.querySelectorAll<SVGPathElement>("[data-route-glow]").forEach((glow) => {
    const len = glow.getTotalLength();
    glow.style.strokeDasharray = String(len);
    glow.style.strokeDashoffset = "0";
    glow.setAttribute("opacity", "0.15");
  });
}

const WhyChooseUs = () => {
  const reduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const markerDownId = `${uid}-arrow-down`;

  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickerFnRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    const section = sectionRef.current;
    const endEl = endRef.current;
    if (!wrap || !svg || !section || !endEl) return;

    gsap.registerPlugin(ScrollTrigger);

    const teardownAnimations = () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      if (tickerFnRef.current) {
        gsap.ticker.remove(tickerFnRef.current);
        tickerFnRef.current = null;
      }
    };

    const runSetup = () => {
      teardownAnimations();

      const accent = readAccentColor();
      const n = buildRoutes(wrap, svg, accent, markerDownId);

      const cards = wrap.querySelectorAll<HTMLElement>("[data-reason-card]");

      if (reduceMotion) {
        cards.forEach((c) => c.classList.add(styles.visible));
        applyStaticPipeline(svg);
        gsap.set(endEl, { opacity: 1 });
        return;
      }

      cards.forEach((c) => c.classList.remove(styles.visible));
      /* Opacity only — y/scale would move cards after routes are measured and lines would drift off the dots */
      gsap.set(cards, { opacity: 0 });
      gsap.set(endEl, { opacity: 0 });

      const groups = svg.querySelectorAll<SVGGElement>("[data-route-group]");
      gsap.set(groups, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: SCROLL_TRIGGER_ID,
          trigger: section,
          start: "top 55%",
          end: "bottom 88%",
          scrub: 1.6,
        },
      });
      timelineRef.current = tl;

      tl.to(
        cards[0],
        {
          opacity: 1,
          duration: 0.4,
          ease: "power3.out",
          onStart: () => {
            cards[0]?.classList.add(styles.visible);
          },
        },
        0
      );

      for (let i = 0; i < n; i++) {
        const seg = groups[i];
        if (!seg) continue;
        const line = seg.querySelector<SVGPathElement>("[data-route-line]");
        const glow = seg.querySelector<SVGPathElement>("[data-route-glow]");
        if (!line || !glow) continue;
        const startAt = 0.4 + i * 2.2;

        tl.to(
          seg,
          { opacity: 1, duration: 1.6, ease: "none" },
          startAt
        );
        tl.to(
          line,
          { strokeDashoffset: 0, duration: 1.6, ease: "none" },
          startAt
        );
        tl.to(
          glow,
          { strokeDashoffset: 0, duration: 1.6, ease: "none" },
          startAt
        );

        const next = cards[i + 1];
        if (next) {
          tl.to(
            next,
            {
              opacity: 1,
              duration: 0.4,
              ease: "power3.out",
              onStart: () => {
                next.classList.add(styles.visible);
              },
            },
            startAt + 1.5
          );
        }
      }

      tl.to(endEl, { opacity: 1, duration: 0.5, ease: "power2.out" }, ">0.1");

      let offset = 0;
      const onTick = () => {
        offset -= 0.35;
        svg.querySelectorAll<SVGPathElement>("[data-route-line]").forEach(
          (line) => {
            if (parseFloat(line.style.strokeDashoffset) < 10) {
              line.style.strokeDasharray = "5 6";
              line.style.strokeDashoffset = String(offset);
            }
          }
        );
      };
      tickerFnRef.current = onTick;
      gsap.ticker.add(onTick);
    };

    const onResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        resizeTimerRef.current = null;
        runSetup();
        ScrollTrigger.refresh();
      }, 250);
    };

    const startTimer = setTimeout(() => {
      runSetup();
      ScrollTrigger.refresh();
    }, 150);

    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      clearTimeout(startTimer);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      window.removeEventListener("resize", onResize);
      teardownAnimations();
      svg.querySelectorAll("[data-route-group]").forEach((g) => g.remove());
    };
  }, [reduceMotion, markerDownId]);

  return (
    <section
      ref={sectionRef}
      className={styles.whyChooseUs}
      aria-labelledby="why-xaeon-heading"
      data-reduced-motion={reduceMotion ? "true" : "false"}
    >
      <header
        className={cn("section-title-rail", "section-header-spacing")}
      >
        <div className={styles.sectionLabel}>Why Choose Us</div>
        <h2 id="why-xaeon-heading" className={styles.heading}>
          Every reason points
          <br />
          to <span className={styles.headingAccent}>one answer</span>
        </h2>
      </header>

      <div ref={wrapRef} className={styles.pipelineWrap}>
        <svg
          ref={svgRef}
          className={styles.pipelineSvg}
          aria-hidden
        >
          <defs>
            {/*
              Arrowhead drawn along +x; orient="auto" aligns +x with path tangent so it
              points down the final vertical segment (previous triangle used +y and read as sideways).
            */}
            <marker
              id={markerDownId}
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="5"
              orient="auto"
            >
              <path
                d="M0,3 L9,5 L0,7 z"
                fill="var(--color-accent)"
                opacity="0.9"
              />
            </marker>
          </defs>
        </svg>

        {Array.from({ length: Math.ceil(FEATURES.length / 2) }, (_, row) => (
          <div className={styles.reasonRow} key={`row-${row}`}>
            {FEATURES.slice(row * 2, row * 2 + 2).map((f, col) => {
              const i = row * 2 + col;
              const { Icon } = f;
              const num = String(i + 1).padStart(2, "0");
              const isFirst = i === 0;
              const isLast = i === FEATURES.length - 1;
              const isLeftCol = col === 0;
              return (
                <article
                  key={f.title}
                  className={styles.reasonCard}
                  data-reason-card
                  data-hide-entry={isFirst ? "true" : undefined}
                  data-hide-exit={isLast ? "true" : undefined}
                  data-card-col={isLeftCol ? "left" : "right"}
                >
                  <span className={styles.reasonNum}>{num}</span>
                  <div
                    className={`${styles.dot} ${styles.dotEntry}`}
                    data-pipeline-dot="entry"
                    aria-hidden
                  />
                  <div
                    className={`${styles.dot} ${styles.dotExit}`}
                    data-pipeline-dot="exit"
                    aria-hidden
                  />
                  <div className={styles.reasonIcon}>
                    <Icon aria-hidden />
                  </div>
                  <h3 className={styles.reasonTitle}>{f.title}</h3>
                  <p className={styles.reasonDesc}>{f.description}</p>
                </article>
              );
            })}
          </div>
        ))}

        <div ref={endRef} className={styles.pipelineEnd}>
          <div className={styles.endBadge}>
            <Check aria-hidden />
            The right choice
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
