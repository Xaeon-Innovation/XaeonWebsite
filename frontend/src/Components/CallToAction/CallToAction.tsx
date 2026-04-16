import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { ArrowRight, Calendar } from 'lucide-react';
import styles from './CallToAction.module.css';
import { getMeetingScheduleLink } from '../../lib/meetingSchedule';
import { useAuth } from '../../context/AuthContext';

const CallToAction = () => {
  const { user } = useAuth();
  const bookCall = getMeetingScheduleLink();
  const primaryTo = user?.role === 'user' ? '/dashboard' : '/book-now';

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
              <Link to={primaryTo} className={styles.primaryButton}>
                Start Your Project
                <ArrowRight size={20} aria-hidden />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a
                href={bookCall.href}
                className={styles.secondaryButton}
                {...(bookCall.opensInNewTab
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <Calendar size={20} aria-hidden />
                Book Call
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
