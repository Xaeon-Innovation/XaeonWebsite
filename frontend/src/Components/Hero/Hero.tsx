import { motion, useReducedMotion } from 'framer-motion';
import styles from './Hero.module.css';
import { TypingAnimation } from '../ui/TypingAnimation';

const Hero = () => {
  const reduceMotion = useReducedMotion() ?? false;

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
          poster="/assets/backgrounds/hero-earth-mena.png"
          aria-hidden
        >
          <source src="/assets/backgrounds/hero-loop.mp4" type="video/mp4" />
        </video>
      )}
      {/* Dark overlay with fade-out effect */}
      <div className={styles.overlay}></div>

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Main Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={styles.slogan}
          >
            <div className={styles.headlineGrid}>
              <h1 className={styles.headlineRow}>
                <span className={styles.whiteWord}>BEYOND</span>
                <TypingAnimation
                  as="span"
                  className={styles.greenWord}
                  typeSpeed={110}
                  startOnView
                  showCursor
                  blinkCursor
                  cursorClassName={styles.typedCursor}
                >
                  TIME.
                </TypingAnimation>
              </h1>

              <h1 className={styles.headlineRow}>
                <span className={styles.whiteWord}>BEYOND</span>
                <TypingAnimation
                  as="span"
                  className={styles.greenWord}
                  typeSpeed={110}
                  delay={450}
                  startOnView
                  showCursor
                  blinkCursor
                  cursorClassName={styles.typedCursor}
                >
                  LIMITS.
                </TypingAnimation>
              </h1>
            </div>
          </motion.div>

          {/* Call to Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.ctaContainer}
          >
            <button className={styles.ctaButton}>
              Let's Work Together
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
