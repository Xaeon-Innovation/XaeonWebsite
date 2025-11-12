import { motion } from 'framer-motion';
import styles from './IntroAbout.module.css';

const IntroAbout = () => {
  return (
    <section className={styles.introAbout}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Left side - Headline */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={styles.leftContent}
          >
            <h2 className={styles.headline}>
              XAEON is a creative-technology house shaping the future of branding and digital innovation.
            </h2>
          </motion.div>

          {/* Right side - Supporting Text */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className={styles.rightContent}
          >
            <p className={styles.supportingText}>
              XAEON IS A CREATIVE-TECH BRANDING AGENCY THAT PARTNERS WITH FORWARD-THINKING BUSINESSES TO BUILD BRANDS DESIGNED FOR THE FUTURE. WE COMBINE STRATEGIC INSIGHT, DATA ANALYTICS AND ADVANCED TECHNOLOGY TO CRAFT IDENTITIES AND EXPERIENCES THAT INSPIRE CONNECTION AND DRIVE MEASURABLE GROWTH. FROM SHAPING BRAND STRATEGY AND VISUAL SYSTEMS TO DESIGNING SEAMLESS DIGITAL EXPERIENCES AND INTERACTIVE ACTIVATIONS, OUR WORK HELPS AMBITIOUS COMPANIES STAND OUT, SCALE, AND LEAD IN COMPETITIVE MARKETS.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default IntroAbout;

