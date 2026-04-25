import { useEffect, useState } from "react";
import CaseSlider, { type CaseSlide } from "../Components/CaseSlider/CaseSlider";
import styles from "./OurWork.module.css";
import CallToAction from "../Components/CallToAction/CallToAction";
import { TypingAnimation } from "../Components/ui/TypingAnimation";
import api from "../lib/api";
import Seo from "../seo/Seo";

const FALLBACK_SLIDES: CaseSlide[] = [
  {
    id: "case1",
    imageSrc: "/assets/case-studies/case1.webp",
    title: "CMS",
    subtitle: "Client",
    description: "Custom software solution · web app development",
    exploreHref: "#case-case1",
  },
  {
    id: "case2",
    imageSrc: "/assets/case-studies/case2.webp",
    title: "Creative Intelligent",
    subtitle: "Client",
    description: "Branding",
    exploreHref: "#case-case2",
  },
  {
    id: "case3",
    imageSrc: "/assets/case-studies/case3.webp",
    title: "Little Medical School",
    subtitle: "Client",
    description: "Campaign",
    exploreHref: "#case-case3",
  },
  {
    id: "case4",
    imageSrc: "/assets/case-studies/case4.webp",
    title: "Sony Alpha Festival",
    subtitle: "Client",
    description: "Photography",
    exploreHref: "#case-case4",
  },
  {
    id: "case5",
    imageSrc: "/assets/case-studies/case5.webp",
    title: "Egycon",
    subtitle: "Client",
    description: "Photography",
    exploreHref: "#case-case5",
  },
  {
    id: "case6",
    imageSrc: "/assets/case-studies/case6.webp",
    title: "Winter Editorial",
    subtitle: "Client",
    description: "Photography",
    exploreHref: "#case-case6",
  },
  {
    id: "case7",
    imageSrc: "/assets/case-studies/case7.webp",
    title: "Portrait Series",
    subtitle: "Client",
    description: "Photography",
    exploreHref: "#case-case7",
  },
  {
    id: "case8",
    imageSrc: "/assets/case-studies/case8.webp",
    title: "Creative Portrait",
    subtitle: "Client",
    description: "Photography",
    exploreHref: "#case-case8",
  },
];

const OurWork = () => {
  const [slides, setSlides] = useState<CaseSlide[]>(FALLBACK_SLIDES);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ slides?: CaseSlide[] }>("/site/case-studies")
      .then((res) => {
        const list = res.data?.slides;
        if (cancelled || !Array.isArray(list) || list.length === 0) return;
        setSlides(list);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Seo
        title="Our Work — Case Studies — Xaeon Software Solutions"
        description="Explore Xaeon case studies across custom software, AI, design, branding, and digital growth."
        pathname="/our-work"
      />

      <section className={styles.blackHero} aria-label="Our work hero">
        <div className={styles.heroInner}>
          <div className={styles.heroContext}>Our Work</div>
          <h1 className={styles.heroTitleShadow}>
            <span className={styles.heroTitleCase}>Case </span>
            <TypingAnimation
              as="span"
              className={styles.heroTitleStudies}
              typeSpeed={85}
              startOnView
              showCursor
              blinkCursor
              cursorClassName={styles.heroTypingCursor}
            >
              Studies
            </TypingAnimation>
          </h1>
          <p className={styles.heroPhrase}>
            Proof over promises - scroll through the work that speaks for itself.
          </p>
        </div>
      </section>
      <CaseSlider slides={slides} />
      <CallToAction />
    </>
  );
};

export default OurWork;
