import { Fragment, useLayoutEffect, useRef } from "react";
import { Link } from "react-router";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ServiceEntry } from "../../data/servicesCatalog";
import { SERVICES } from "../../data/servicesCatalog";
import { cn } from "../../lib/cn";
import styles from "./Services.module.css";

function titleForDisplay(title: string) {
  return title.replace(/\s*&\s*/g, " ");
}

function padIndex(n: number) {
  return String(n).padStart(2, "0");
}

/** First half of catalog on row 1, second half on row 2 — no repeated items. */
const HALF = Math.ceil(SERVICES.length / 2);
const ROW_1 = SERVICES.slice(0, HALF);
const ROW_2 = SERVICES.slice(HALF);

function Services() {
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const row1TrackRef = useRef<HTMLDivElement>(null);
  const row2TrackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const outer = outerRef.current;
    const sticky = stickyRef.current;
    const t1 = row1TrackRef.current;
    const t2 = row2TrackRef.current;
    const progressEl = progressRef.current;
    const hintEl = hintRef.current;
    if (!section || !outer || !sticky || !t1 || !t2 || !progressEl) return;

    gsap.registerPlugin(ScrollTrigger);

    if (reduceMotion) {
      gsap.set([t1, t2], { x: 0 });
      gsap.set(progressEl, { scaleX: 1, transformOrigin: "left center" });
      hintEl?.classList.add(styles.hintHidden);
      return;
    }

    const getTravel = () => t1.scrollWidth * 0.55;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer,
          start: "top top",
          end: "bottom bottom",
          pin: sticky,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate(self) {
            if (hintEl) {
              hintEl.classList.toggle(
                styles.hintHidden,
                self.progress >= 0.99
              );
            }
          },
        },
      });

      tl.fromTo(
        t1,
        { x: 0 },
        { x: () => -getTravel(), ease: "none" },
        0
      );
      tl.fromTo(
        t2,
        { x: () => -getTravel() * 0.5 },
        { x: () => getTravel() * 0.5, ease: "none" },
        0
      );
      tl.fromTo(
        progressEl,
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, ease: "none" },
        0
      );
    }, section);

    const raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    let cancelled = false;
    const fontsDone = document.fonts?.ready?.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      void fontsDone;
      window.removeEventListener("resize", onResize);
      ctx.revert();
      hintEl?.classList.remove(styles.hintHidden);
    };
  }, [reduceMotion]);

  const renderRow = (
    items: readonly ServiceEntry[],
    /** 0-based global index of `items[0]` (so numbering stays 01…N across both rows). */
    globalIndexStart: number,
    rowKey: string
  ) =>
    items.map((s, i) => {
      const n = globalIndexStart + i + 1;
      const showSep = i < items.length - 1;
      return (
        <Fragment key={`${rowKey}-${s.slug}`}>
          <Link
            to={`/services/${s.slug}`}
            className={styles.itemLink}
            aria-label={`${s.title} — service ${padIndex(n)}`}
          >
            <span className={styles.itemIndex} aria-hidden>
              {padIndex(n)}
            </span>
            <span className={styles.itemTitle}>
              {titleForDisplay(s.title).toUpperCase()}
            </span>
          </Link>
          {showSep ? (
            <span className={styles.sep} aria-hidden>
              /
            </span>
          ) : null}
        </Fragment>
      );
    });

  return (
    <section
      ref={sectionRef}
      className={styles.services}
      aria-labelledby="services-heading"
    >
      <div
        ref={outerRef}
        className={`${styles.scrollTrack} ${reduceMotion ? styles.scrollTrackReduced : ""}`}
      >
        <div
          ref={stickyRef}
          className={`${styles.stickyPanel} ${reduceMotion ? styles.stickyPanelReduced : ""}`}
        >
          <header
            className={cn(
              styles.sectionHeader,
              "section-title-rail",
              "section-header-spacing"
            )}
          >
            <div className={styles.sectionLabel}>What We Do</div>
            <h2 id="services-heading" className={styles.sectionHeading}>
              From idea to{" "}
              <span className={styles.sectionHeadingAccent}>impact</span>
            </h2>
          </header>
          <div className={styles.viewport}>
            <div className={styles.row}>
              <div ref={row1TrackRef} className={styles.track}>
                {renderRow(ROW_1, 0, "r1")}
              </div>
            </div>
            <div className={styles.row}>
              <div ref={row2TrackRef} className={styles.track}>
                {renderRow(ROW_2, HALF, "r2")}
              </div>
            </div>
          </div>

          <div className={styles.progressWrap} aria-hidden>
            <div className={styles.progressTrack}>
              <div ref={progressRef} className={styles.progressFill} />
            </div>
          </div>

          <p ref={hintRef} className={styles.scrollHint}>
            Keep scrolling ↓
          </p>
        </div>
      </div>
    </section>
  );
}

export default Services;
