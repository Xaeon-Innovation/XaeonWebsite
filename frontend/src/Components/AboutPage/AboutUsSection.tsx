import { motion } from "framer-motion";
import styles from "./AboutUsSection.module.css";

const AboutUsSection = () => {
  return (
    <section className={styles.section} aria-labelledby="about-us-heading">
      <div className={styles.inner}>
        <h2 id="about-us-heading" className={styles.srOnly}>
          About us
        </h2>
        <div className={styles.grid}>
          <motion.div
            className={styles.graphic}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            aria-hidden
            role="presentation"
          >
            <span className={styles.abo}>ABO</span>
            <span className={styles.uLetter}>U</span>
            <span className={styles.tLetter}>T</span>
            <span className={styles.sLetter}>S</span>
          </motion.div>
          <motion.div
            className={styles.prose}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <p>
              Xaeon is a creative-technology house shaping the future of
              branding and digital innovation. We partner with ambitious brands
              to build standout identities, powerful digital experiences, and
              systems that scale.
            </p>
            <p>
              Our work is driven by clarity, precision, and the belief that
              great ideas must also be deeply engineered.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
