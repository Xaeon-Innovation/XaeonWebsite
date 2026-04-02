import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "../../lib/cn";
import { IconCloud } from "../ui/IconCloud";
import {
  DEFAULT_STACK_CATEGORY_ID,
  STACK_CLOUD_LABELS,
  STACK_FILTER_TABS,
  STACK_ITEMS,
} from "./stackData";
import { getStackIcon } from "./stackIconMap";
import styles from "./OurStack.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const OurStack = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cloudPanelRef = useRef<HTMLDivElement>(null);
  const skipCloudIntroRef = useRef(true);

  const [activeCat, setActiveCat] = useState(DEFAULT_STACK_CATEGORY_ID);

  const visibleStackItems = useMemo(
    () => STACK_ITEMS.filter((item) => item.categoryId === activeCat),
    [activeCat]
  );

  const cloudSpritePx = 72;

  const cloudIcons = useMemo(
    () =>
      visibleStackItems.map((item) => {
        const Icon = getStackIcon(item.name);
        return (
          <Icon
            key={item.id}
            size={cloudSpritePx}
            className={styles.canvasCloudIcon}
            style={{ color: "#dff6c8" }}
            aria-hidden
          />
        );
      }),
    [visibleStackItems]
  );

  /** Initial layout: only default category cards participate in layout / scroll reveal. */
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const cards = section.querySelectorAll<HTMLElement>("[data-stack-card]");
    cards.forEach((c) => {
      const match = c.dataset.category === DEFAULT_STACK_CATEGORY_ID;
      c.style.display = match ? "flex" : "none";
      if (match) {
        gsap.set(c, { opacity: 0, y: 16, scale: 0.97 });
      }
    });
  }, []);

  const runFilter = useCallback((cat: string) => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = Array.from(
      section.querySelectorAll<HTMLElement>("[data-stack-card]")
    );
    const outgoing = cards.filter((c) => c.dataset.category !== cat);
    const incoming = cards.filter((c) => c.dataset.category === cat);

    gsap.killTweensOf(cards);

    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

    tl.to(outgoing, {
      opacity: 0,
      scale: 0.94,
      y: 12,
      duration: 0.42,
      stagger: 0.03,
      ease: "power2.in",
    });

    tl.add(() => {
      outgoing.forEach((c) => {
        c.style.display = "none";
      });
      incoming.forEach((c) => {
        c.style.display = "flex";
        gsap.set(c, { opacity: 0, scale: 0.96, y: 14 });
      });
    });

    tl.to(incoming, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.52,
      stagger: { each: 0.045, from: "start" },
      ease: "power3.out",
    });
  }, []);

  /** Fade / scale cloud when switching categories (skip first paint). */
  useEffect(() => {
    const el = cloudPanelRef.current;
    if (!el) return;
    if (skipCloudIntroRef.current) {
      skipCloudIntroRef.current = false;
      return;
    }
    gsap.fromTo(
      el,
      { opacity: 0.4, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" }
    );
  }, [activeCat]);

  const onTabClick = (catId: string) => {
    if (catId === activeCat) return;
    setActiveCat(catId);
    runFilter(catId);
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const cards = Array.from(
        section.querySelectorAll<HTMLElement>("[data-stack-card]")
      ).filter((c) => window.getComputedStyle(c).display !== "none");

      if (!cards.length) return;

      gsap.to(cards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          once: true,
        },
      });
    },
    { scope: sectionRef, dependencies: [] }
  );

  return (
    <section
      ref={sectionRef}
      className={styles.stack}
      id="stack"
      aria-labelledby="stack-heading"
    >
      <div className={styles.stackForeground}>
        <div className={cn("section-title-rail", styles.stackInner)}>
          <div className={styles.stackLeft}>
            <header className="section-header-spacing">
              <div className={styles.sectionLabel}>Our Stack</div>
              <h2 id="stack-heading" className={styles.sectionHeading}>
                Tools we{" "}
                <span className={styles.sectionHeadingAccent}>trust</span>
              </h2>
            </header>

            <div
              className={styles.tabs}
              role="group"
              aria-label="Technology categories"
            >
              {STACK_FILTER_TABS.map((tab) => {
                const isActive = tab.id === activeCat;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-label={`Show ${tab.label} technologies`}
                    data-active={isActive ? "true" : "false"}
                    className={cn(styles.tabBtn, isActive && styles.tabBtnActive)}
                    onClick={() => onTabClick(tab.id)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className={styles.stackGrid} role="list">
              {STACK_ITEMS.map((item) => {
                const Icon = getStackIcon(item.name);
                return (
                  <div
                    key={item.id}
                    role="listitem"
                    className={styles.stackCard}
                    data-stack-card
                    data-category={item.categoryId}
                  >
                    <div className={styles.stackIconWrap}>
                      <Icon
                        size={40}
                        className={styles.stackIcon}
                        aria-hidden
                      />
                    </div>
                    <span className={styles.stackCardName}>{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.stackRight}>
            <div ref={cloudPanelRef} className={styles.cloudPanel}>
              <IconCloud
                key={activeCat}
                icons={cloudIcons}
                className={styles.cloudCanvas}
                width={480}
                height={480}
                iconColor="#dff6c8"
                spriteSize={cloudSpritePx}
              />
            </div>
            <div className={styles.cloudLabel}>
              {STACK_CLOUD_LABELS[activeCat] ?? activeCat}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurStack;
