import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import styles from "./ParallaxHeroImages.module.css";

export type ParallaxHeroImage = {
  src: string;
  alt?: string;
  depth: number;
  className?: string;
};

type Props = {
  images: ParallaxHeroImage[];
  className?: string;
  children?: React.ReactNode;
};

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return prefersReducedMotion;
}

export function ParallaxHeroImages({ images, className, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const imageEls = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const ordered = useMemo(() => {
    return [...images].sort((a, b) => a.depth - b.depth);
  }, [images]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const tick = () => {
      const ease = 0.08;
      current.current.x += (target.current.x - current.current.x) * ease;
      current.current.y += (target.current.y - current.current.y) * ease;

      const x = current.current.x;
      const y = current.current.y;
      const amplitude = 26;

      ordered.forEach((img, i) => {
        const el = imageEls.current[i];
        if (!el) return;
        const dx = x * img.depth * amplitude;
        const dy = y * img.depth * amplitude;
        el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      });

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [ordered, prefersReducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion) return;

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      target.current.x = (nx - 0.5) * 2;
      target.current.y = (ny - 0.5) * 2;
    };

    const onLeave = () => {
      target.current.x = 0;
      target.current.y = 0;
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={rootRef}
      className={cn(
        styles.root,
        prefersReducedMotion ? styles.reducedMotion : undefined,
        className,
      )}
    >
      <div className={styles.layers} aria-hidden="true">
        {ordered.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            ref={(el) => {
              imageEls.current[i] = el;
            }}
            className={cn(styles.layer, img.className)}
          >
            <img className={styles.img} src={img.src} alt={img.alt ?? ""} />
          </div>
        ))}
      </div>

      <div className={styles.mesh} aria-hidden="true" />

      <div className={styles.overlay}>
        <div className={styles.overlayInner}>{children}</div>
      </div>
    </div>
  );
}

