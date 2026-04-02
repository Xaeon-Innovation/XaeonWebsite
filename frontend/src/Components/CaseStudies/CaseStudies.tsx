import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "../../lib/cn";
import styles from "./CaseStudies.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type CaseStudy = {
  title: string;
  subtitle: string;
  tag: string;
  color: string;
  imageSrc: string;
};

const caseStudies: CaseStudy[] = [
  {
    title: "Brand Identity System",
    subtitle: "Branding · Design Systems",
    tag: "Branding",
    color: "#72c04f",
    imageSrc: "/assets/case-studies/case-1.jpg",
  },
  {
    title: "Digital Experience Design",
    subtitle: "UX · Product",
    tag: "UX",
    color: "#4f98a3",
    imageSrc: "/assets/case-studies/case-2.jpg",
  },
  {
    title: "Product & Platform UI",
    subtitle: "SaaS · Web",
    tag: "SaaS",
    color: "#a86fdf",
    imageSrc: "/assets/case-studies/case-3.jpg",
  },
  {
    title: "Campaign Visuals",
    subtitle: "Marketing · Creative",
    tag: "Marketing",
    color: "#fdab43",
    imageSrc: "/assets/case-studies/case-4.jpg",
  },
];

function CaseStudiesStatic() {
  return (
    <section className={styles.staticSection} aria-label="Case studies">
      <div className={styles.staticContainer}>
        <h2 className={styles.staticTitle}>Case Studies</h2>
        <div className={styles.staticGrid}>
          {caseStudies.map((cs) => (
            <article key={cs.title} className={styles.staticCard}>
              <img
                className={styles.staticImage}
                src={cs.imageSrc}
                alt={cs.title}
                loading="lazy"
              />
              <div className={styles.staticMeta}>
                <span className={styles.staticTag}>{cs.tag}</span>
                <h3 className={styles.staticCardTitle}>{cs.title}</h3>
                <p className={styles.staticCardSub}>{cs.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudiesAnimated() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const activeTagRef = useRef<HTMLDivElement>(null);
  const tagTextRef = useRef<HTMLSpanElement>(null);
  const tagDotRef = useRef<HTMLSpanElement>(null);
  const activeTitleRef = useRef<HTMLSpanElement>(null);
  const activeSubtitleRef = useRef<HTMLSpanElement>(null);
  const counterCurrentRef = useRef<HTMLSpanElement>(null);

  const imgWrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const currentIdxRef = useRef(0);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const sticky = stickyRef.current;
      const strip = stripRef.current;
      const fillEl = progressFillRef.current;
      const hintEl = hintRef.current;
      const tagEl = activeTagRef.current;
      const tagTextEl = tagTextRef.current;
      const tagDotEl = tagDotRef.current;
      const titleEl = activeTitleRef.current;
      const subtitleEl = activeSubtitleRef.current;
      const counterEl = counterCurrentRef.current;

      if (
        !section ||
        !sticky ||
        !strip ||
        !fillEl ||
        !hintEl ||
        !tagEl ||
        !tagTextEl ||
        !tagDotEl ||
        !titleEl ||
        !subtitleEl ||
        !counterEl
      ) {
        return;
      }

      const counterNode = counterEl;
      const fillNode = fillEl;
      const hintNode = hintEl;
      const tagTextNode = tagTextEl;
      const tagDotNode = tagDotEl;
      const titleNode = titleEl;
      const subtitleNode = subtitleEl;
      const tagNode = tagEl;

      let scrollTrigger: ScrollTrigger | undefined;
      let resizeTimer: ReturnType<typeof setTimeout> | undefined;

      const imgWraps = () =>
        imgWrapRefs.current.filter((el): el is HTMLDivElement => el !== null);

      function activateCase(idx: number) {
        if (idx === currentIdxRef.current) return;
        currentIdxRef.current = idx;

        const wraps = imgWraps();
        wraps.forEach((w, i) => {
          w.classList.toggle(styles.caseImgWrapActive, i === idx);
        });

        dotRefs.current.forEach((d, i) => {
          if (d) d.classList.toggle(styles.pdotActive, i === idx);
        });

        counterNode.textContent = String(idx + 1).padStart(2, "0");

        const dur = 0.35;

        gsap.to(tagNode, {
          y: "-120%",
          opacity: 0,
          duration: dur * 0.7,
          ease: "power2.in",
          onComplete() {
            tagTextNode.textContent = caseStudies[idx].tag;
            tagDotNode.style.color = caseStudies[idx].color;
            gsap.fromTo(
              tagNode,
              { y: "120%", opacity: 0 },
              { y: "0%", opacity: 1, duration: dur, ease: "power3.out" },
            );
          },
        });

        gsap.to(titleNode, {
          y: "-110%",
          duration: dur * 0.85,
          ease: "power2.in",
          onComplete() {
            titleNode.textContent = caseStudies[idx].title;
            gsap.fromTo(
              titleNode,
              { y: "110%" },
              { y: "0%", duration: dur * 1.3, ease: "power3.out" },
            );
          },
        });

        gsap.to(subtitleNode, {
          y: "-110%",
          opacity: 0,
          duration: dur * 0.75,
          ease: "power2.in",
          onComplete() {
            subtitleNode.textContent = caseStudies[idx].subtitle;
            subtitleNode.style.color = caseStudies[idx].color;
            gsap.fromTo(
              subtitleNode,
              { y: "110%", opacity: 0 },
              {
                y: "0%",
                opacity: 1,
                duration: dur * 1.2,
                ease: "power3.out",
                delay: 0.08,
              },
            );
          },
        });
      }

      function init() {
        scrollTrigger?.kill();
        scrollTrigger = undefined;

        const wraps = imgWraps();
        if (wraps.length === 0) return;

        const vw = window.innerWidth;

        requestAnimationFrame(() => {
          const firstCard = wraps[0];
          const lastCard = wraps[wraps.length - 1];
          const startX =
            vw / 2 - (firstCard.offsetLeft + firstCard.offsetWidth / 2);
          const endX =
            vw / 2 - (lastCard.offsetLeft + lastCard.offsetWidth / 2);

          gsap.set(strip, { x: startX });

          scrollTrigger = ScrollTrigger.create({
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            pin: sticky,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate(self) {
              const x = gsap.utils.interpolate(
                startX,
                endX,
                self.progress,
              );
              gsap.set(strip, { x });
              fillNode.style.width = `${self.progress * 100}%`;

              let closestIdx = 0;
              let closestDist = Infinity;
              wraps.forEach((wrap, i) => {
                const rect = wrap.getBoundingClientRect();
                const center = rect.left + rect.width / 2;
                const dist = Math.abs(center - vw / 2);
                if (dist < closestDist) {
                  closestDist = dist;
                  closestIdx = i;
                }
              });

              activateCase(closestIdx);
              if (self.progress > 0.9) {
                hintNode.classList.add(styles.scrollHintHidden);
              } else {
                hintNode.classList.remove(styles.scrollHintHidden);
              }
            },
          });

          ScrollTrigger.refresh();
        });
      }

      const onResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          init();
          ScrollTrigger.refresh();
        }, 250);
      };

      currentIdxRef.current = 0;
      titleNode.textContent = caseStudies[0].title;
      subtitleNode.textContent = caseStudies[0].subtitle;
      subtitleNode.style.color = caseStudies[0].color;
      tagTextNode.textContent = caseStudies[0].tag;
      tagDotNode.style.color = caseStudies[0].color;
      gsap.set([titleNode, subtitleNode, tagNode], { y: "0%", opacity: 1 });
      counterNode.textContent = "01";

      const loadTimer = window.setTimeout(() => {
        init();
        ScrollTrigger.refresh();
      }, 200);

      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        if (resizeTimer) clearTimeout(resizeTimer);
        clearTimeout(loadTimer);
        scrollTrigger?.kill();
      };
    },
    { scope: sectionRef, dependencies: [] },
  );

  const caseCount = caseStudies.length;

  return (
    <section
      ref={sectionRef}
      id="cases"
      className={styles.casesSection}
      style={
        {
          "--case-count": String(caseCount),
        } as CSSProperties
      }
      aria-label="Case studies"
    >
      <div ref={stickyRef} className={styles.casesSticky}>
        <div
          className={cn(
            styles.casesHeader,
            "section-title-rail",
            "section-header-spacing"
          )}
        >
          <div className={styles.sectionLabel}>Case Studies</div>
          <h2 className={styles.casesHeading}>
            Work that <span className={styles.casesHeadingAccent}>speaks</span>
          </h2>
        </div>

        <div className={styles.titleDisplay}>
          <div className={styles.tagClip}>
            <div ref={activeTagRef} className={styles.activeTag}>
              <span
                ref={tagDotRef}
                className={styles.tagDot}
                style={{ color: caseStudies[0].color }}
              />
              <span ref={tagTextRef}>{caseStudies[0].tag}</span>
            </div>
          </div>
          <div className={styles.titleClip}>
            <span ref={activeTitleRef} className={styles.activeTitle}>
              {caseStudies[0].title}
            </span>
          </div>
          <div className={styles.subClip}>
            <span
              ref={activeSubtitleRef}
              className={styles.activeSubtitle}
              style={{ color: caseStudies[0].color }}
            >
              {caseStudies[0].subtitle}
            </span>
          </div>
        </div>

        <div ref={stripRef} className={styles.imagesStrip}>
          {caseStudies.map((c, i) => (
            <div
              key={c.title}
              ref={(el) => {
                imgWrapRefs.current[i] = el;
              }}
              className={`${styles.caseImgWrap} ${i === 0 ? styles.caseImgWrapActive : ""}`}
            >
              <img
                className={styles.caseImg}
                src={c.imageSrc}
                alt={c.title}
                loading={i === 0 ? "eager" : "lazy"}
                width={1200}
                height={800}
              />
            </div>
          ))}
        </div>

        <div className={styles.progressBar}>
          <div ref={progressFillRef} className={styles.progressFill} />
        </div>
        <div className={styles.progressDots}>
          {caseStudies.map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className={`${styles.pdot} ${i === 0 ? styles.pdotActive : ""}`}
            />
          ))}
        </div>
        <div className={styles.caseCounter}>
          <span ref={counterCurrentRef} className={styles.caseCounterCurrent}>
            01
          </span>{" "}
          /{" "}
          <span>
            {String(caseStudies.length).padStart(2, "0")}
          </span>
        </div>
        <div ref={hintRef} className={styles.scrollHint}>
          Keep scrolling <span className={styles.bounce}>↓</span>
        </div>
      </div>
    </section>
  );
}

const CaseStudies = () => {
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

  if (prefersReducedMotion) {
    return <CaseStudiesStatic />;
  }

  return <CaseStudiesAnimated />;
};

export default CaseStudies;
