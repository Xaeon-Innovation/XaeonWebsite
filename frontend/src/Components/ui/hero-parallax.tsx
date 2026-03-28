import { useEffect, useMemo, useRef, useState } from "react";
import { useScroll, useTransform, motion, type MotionValue } from "framer-motion";
import { cn } from "../../lib/cn";
import styles from "./hero-parallax.module.css";

export type HeroParallaxProduct = {
  id?: string;
  title: string;
  link?: string;
  thumbnail: string;
};

type Props = {
  products: HeroParallaxProduct[];
  className?: string;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  onCaseClick?: (caseId: string) => void;
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

function chunkIntoRows<T>(arr: T[], rowCount: number): T[][] {
  const rows: T[][] = Array.from({ length: rowCount }, () => []);
  arr.forEach((item, idx) => rows[idx % rowCount].push(item));
  return rows;
}

function useRowTransform(
  scrollYProgress: MotionValue<number>,
  direction: 1 | -1,
  strength: number,
) {
  return useTransform(scrollYProgress, [0, 1], [0, direction * strength]);
}

function inferCaseId(product: HeroParallaxProduct): string | null {
  if (product.id) return product.id;
  const link = product.link;
  if (!link) return null;
  const hashIdx = link.indexOf("#");
  if (hashIdx === -1) return null;
  const hash = link.slice(hashIdx + 1);
  if (hash.startsWith("case-")) return hash.slice("case-".length);
  return hash || null;
}

export function HeroParallax({
  products,
  className,
  children,
  title,
  description,
  onCaseClick,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const rows = useMemo(() => {
    const safe = products.length >= 6 ? products : [...products, ...products];
    return chunkIntoRows(safe, 3);
  }, [products]);

  // make the hero longer so scroll-based parallax feels real
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start start", "end start"],
  });

  const y1 = useRowTransform(scrollYProgress, 1, 70);
  const y2 = useRowTransform(scrollYProgress, -1, 110);
  const y3 = useRowTransform(scrollYProgress, 1, 90);

  const x1 = useRowTransform(scrollYProgress, 1, 140);
  const x2 = useRowTransform(scrollYProgress, -1, 180);
  const x3 = useRowTransform(scrollYProgress, 1, 160);

  const content =
    children ??
    (
      <>
        <h1 className={styles.title}>
          {title ?? "The Ultimate development studio"}
        </h1>
        <p className={styles.subtitle}>
          {description ??
            "We build beautiful products with the latest technologies and frameworks. We are a team of passionate developers and designers that love to build amazing products."}
        </p>
      </>
    );

  const handleProductClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    product: HeroParallaxProduct,
  ) => {
    const caseId = inferCaseId(product);
    if (onCaseClick && caseId) {
      e.preventDefault();
      onCaseClick(caseId);
    }
  };

  return (
    <section
      ref={rootRef}
      className={cn(
        styles.root,
        styles.tall,
        prefersReducedMotion ? styles.reducedMotion : undefined,
        className,
      )}
    >
      <div className={styles.tilt} aria-hidden="true">
        <div className={styles.rows}>
          <motion.div
            className={styles.row}
            style={prefersReducedMotion ? undefined : { x: x1, y: y1 }}
          >
            {rows[0].map((p) => (
              <a
                className={styles.card}
                href={p.link ?? "#"}
                key={`r1-${p.title}-${p.thumbnail}`}
                tabIndex={-1}
                aria-label={p.title}
                onClick={(e) => handleProductClick(e, p)}
              >
                <img className={styles.thumb} src={p.thumbnail} alt={p.title} />
              </a>
            ))}
          </motion.div>

          <motion.div
            className={styles.row}
            style={prefersReducedMotion ? undefined : { x: x2, y: y2 }}
          >
            {rows[1].map((p) => (
              <a
                className={styles.card}
                href={p.link ?? "#"}
                key={`r2-${p.title}-${p.thumbnail}`}
                tabIndex={-1}
                aria-label={p.title}
                onClick={(e) => handleProductClick(e, p)}
              >
                <img className={styles.thumb} src={p.thumbnail} alt={p.title} />
              </a>
            ))}
          </motion.div>

          <motion.div
            className={styles.row}
            style={prefersReducedMotion ? undefined : { x: x3, y: y3 }}
          >
            {rows[2].map((p) => (
              <a
                className={styles.card}
                href={p.link ?? "#"}
                key={`r3-${p.title}-${p.thumbnail}`}
                tabIndex={-1}
                aria-label={p.title}
                onClick={(e) => handleProductClick(e, p)}
              >
                <img className={styles.thumb} src={p.thumbnail} alt={p.title} />
              </a>
            ))}
          </motion.div>
        </div>
      </div>

      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.mesh} aria-hidden="true" />
      <div className={styles.fadeBottom} aria-hidden="true" />

      <div className={styles.overlay}>
        <div className={styles.overlayInner}>{content}</div>
      </div>
    </section>
  );
}

