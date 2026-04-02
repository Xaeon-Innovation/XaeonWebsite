import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import styles from "./InteractiveDotPattern.module.css";

export type DotPatternMouse = { x: number; y: number } | null;

type DotPoint = { x: number; y: number };

type InteractiveDotPatternProps = {
  /** Pointer position in the same coordinate system as this layer (section-local). */
  mouse: DotPatternMouse;
  className?: string;
  /** Grid step in px */
  spacing?: number;
  /** Base dot radius */
  baseRadius?: number;
  /** Extra radius at cursor (added to base) */
  maxRadiusBoost?: number;
  /** Distance in px at which boost falls to 0 */
  influenceRadius?: number;
  /** `brand` = site greens; `mono` = white/gray (e.g. tech grid panels). */
  variant?: "brand" | "mono";
};

/** Returns 0 when x <= edge0, 1 when x >= edge1, smooth between. */
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * SVG dot grid; dots grow and glow based on proximity to `mouse`.
 * Parent should set `pointer-events` on content above; layer is non-interactive.
 */
const PALETTES = {
  brand: {
    glowStops: [
      { o: "0%", c: "rgb(180, 240, 140)", op: "0.95" },
      { o: "70%", c: "rgb(114, 192, 79)", op: "0.45" },
      { o: "100%", c: "rgb(114, 192, 79)", op: "0" },
    ] as const,
    baseFill: "rgba(114, 192, 79, 0.42)",
    glowRgb: "114, 192, 79",
  },
  mono: {
    glowStops: [
      { o: "0%", c: "rgb(255, 255, 255)", op: "0.95" },
      { o: "65%", c: "rgb(220, 230, 240)", op: "0.5" },
      { o: "100%", c: "rgb(200, 210, 220)", op: "0" },
    ] as const,
    baseFill: "rgba(255, 255, 255, 0.22)",
    glowRgb: "255, 255, 255",
  },
} as const;

export function InteractiveDotPattern({
  mouse,
  className,
  spacing = 28,
  baseRadius = 1.1,
  maxRadiusBoost = 3.2,
  influenceRadius = 168,
  variant = "brand",
}: InteractiveDotPatternProps) {
  const gradId = useId().replace(/:/g, "");
  const palette = PALETTES[variant];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setSize({ w: Math.ceil(cr.width), h: Math.ceil(cr.height) });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setSize({ w: Math.ceil(r.width), h: Math.ceil(r.height) });
    return () => ro.disconnect();
  }, []);

  const dots: DotPoint[] = useMemo(() => {
    if (size.w < 8 || size.h < 8) return [];
    const cols = Math.ceil(size.w / spacing) + 1;
    const rows = Math.ceil(size.h / spacing) + 1;
    const out: DotPoint[] = [];
    const ox = (size.w - (cols - 1) * spacing) / 2;
    const oy = (size.h - (rows - 1) * spacing) / 2;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        out.push({ x: col * spacing + ox, y: row * spacing + oy });
      }
    }
    return out;
  }, [size.w, size.h, spacing]);

  return (
    <div
      ref={wrapRef}
      className={cn(styles.wrap, className)}
      aria-hidden
    >
      <svg
        className={styles.svg}
        width={size.w}
        height={size.h}
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            {palette.glowStops.map((s) => (
              <stop
                key={s.o}
                offset={s.o}
                stopColor={s.c}
                stopOpacity={s.op}
              />
            ))}
          </radialGradient>
        </defs>
        {dots.map((d, i) => {
          let t = 0;
          if (mouse && !reduceMotion) {
            const dist = Math.hypot(d.x - mouse.x, d.y - mouse.y);
            t = 1 - smoothstep(0, influenceRadius, dist);
            t *= t;
          }

          const r = baseRadius + t * maxRadiusBoost;
          const opacity =
            variant === "mono"
              ? 0.12 + t * 0.78
              : 0.14 + t * 0.72;
          const glow = t > 0.08;
          const filter = glow
            ? `drop-shadow(0 0 ${3 + t * 14}px rgba(${palette.glowRgb}, ${0.35 + t * 0.55}))`
            : undefined;

          return (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={r}
              fill={glow ? `url(#${gradId})` : palette.baseFill}
              opacity={opacity}
              style={{ filter }}
            />
          );
        })}
      </svg>
    </div>
  );
}
