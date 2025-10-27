import { motion } from 'framer-motion';
import heroBg from '../../assets/backgrounds/bghome1.png';
import styles from './Hero.module.css';

const Hero = () => {
  return (
    <section 
      className={styles.hero}
      style={{ 
        backgroundImage: `url(${heroBg})`
      }}
    >
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
            <h1 className={styles.headline}>
              <span className={styles.whiteText}>BEYOND</span>
              <span className={styles.greenText}> TIME.</span>
            </h1>
            <h1 className={styles.headline}>
              <span className={styles.whiteText}>BEYOND</span>
              <span className={styles.greenText}> LIMITS.</span>
            </h1>
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
