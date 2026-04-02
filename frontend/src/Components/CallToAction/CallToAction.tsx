import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { ArrowRight, Calendar } from 'lucide-react';
import styles from './CallToAction.module.css';

const CallToAction = () => {
  return (
    <section id="cta" className={styles.cta} data-gsap="reveal">
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className={styles.content}
        >
          <h2 className={styles.title}>Your Gateway to Growth Starts Here</h2>
          <p className={styles.subtitle}>
            Take the first step toward growing your business and book your meeting now.
          </p>

          <div className={styles.buttons}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/book-now" className={styles.primaryButton}>
                Start Your Project
                <ArrowRight size={20} aria-hidden />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/book-now" className={styles.secondaryButton}>
                <Calendar size={20} aria-hidden />
                Book Call
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
