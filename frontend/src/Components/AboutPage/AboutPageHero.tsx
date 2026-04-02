import { useReducedMotion } from "framer-motion";
import { TypingAnimation } from "../ui/TypingAnimation";
import styles from "./AboutPageHero.module.css";

const ROTATING_WORDS = [
  "Software",
  "Products",
  "Solutions",
  "Ideas",
  "Systems",
  "Futures",
] as const;

const AboutPageHero = () => {
  const reduceMotion = useReducedMotion() ?? false;
  const staticCenter = ROTATING_WORDS[0];

  return (
    <section className={styles.hero}>
      {reduceMotion ? (
        <div className={styles.heroStaticBg} aria-hidden />
      ) : (
        <video
          className={styles.heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src="/assets/videos/about.mp4" type="video/mp4" />
        </video>
      )}

      <div className={styles.overlay} aria-hidden />

      <div className={styles.container}>
        <h1 className={styles.headlineRow}>
          <span className={styles.srOnly}>
            We Build {ROTATING_WORDS.join(", ")} That Matters. Headline cycles
            through the center words with a typing animation.
          </span>
          <div className={styles.headlineVisual} aria-hidden>
          <span className={`${styles.side} ${styles.sideLeft}`}>
            <span className={styles.sideLine}>WE</span>
            <span className={styles.sideLine}>BUILD</span>
          </span>

          <div className={styles.centerWrap}>
            <div className={styles.centerWordSlot}>
              {reduceMotion ? (
                <span className={styles.centerWordStatic}>{staticCenter}</span>
              ) : (
                <TypingAnimation
                  as="span"
                  className={styles.centerWord}
                  words={[...ROTATING_WORDS]}
                  loop
                  startOnView={false}
                  typeSpeed={85}
                  deleteSpeed={55}
                  pauseDelay={1400}
                  delay={400}
                  showCursor
                  blinkCursor
                  cursorClassName={styles.centerCursor}
                />
              )}
            </div>
          </div>

          <span className={`${styles.side} ${styles.sideRight}`}>
            <span className={styles.sideLine}>THAT</span>
            <span className={styles.sideLine}>MATTERS</span>
          </span>
          </div>
        </h1>
      </div>
    </section>
  );
};

export default AboutPageHero;
