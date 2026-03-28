import { motion } from 'framer-motion';
import { Highlighter } from '../ui/Highlighter';
import styles from './IntroAbout.module.css';

const introHeadHighlight = {
  action: 'highlight' as const,
  color: '#ffffff',
  strokeWidth: 2,
  animationDuration: 720,
  iterations: 1,
  padding: 5,
  multiline: true,
  isView: true,
};

const introHeadUnderline = {
  ...introHeadHighlight,
  action: 'underline' as const,
  color: '#ffffff',
  strokeWidth: 2.2,
  padding: 6,
};

const introBodyHighlight = {
  ...introHeadHighlight,
  strokeWidth: 1.5,
  padding: 4,
  animationDuration: 650,
};

const introBodyUnderline = {
  ...introHeadUnderline,
  strokeWidth: 1.85,
  padding: 5,
  animationDuration: 650,
};

const IntroAbout = () => {
  return (
    <section className={styles.introAbout}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Left side - Headline */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={styles.leftContent}
          >
            <h2 className={styles.headline}>
              <span className={styles.brandName}>XAEON</span> is a{' '}
              <Highlighter {...introHeadHighlight}>
                creative technology house
              </Highlighter>{' '}
              shaping the future of{' '}
              <Highlighter {...introHeadUnderline}>
                branding and digital innovation
              </Highlighter>
              .
            </h2>
          </motion.div>

          {/* Right side - Supporting Text */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className={styles.rightContent}
          >
            <p className={styles.supportingText}>
              We partner with ambitious brands to build{' '}
              <Highlighter {...introBodyHighlight}>
                standout identities
              </Highlighter>
              ,{' '}
              <Highlighter {...introBodyHighlight}>
                powerful digital experiences
              </Highlighter>
              , and{' '}
              <Highlighter {...introBodyHighlight}>
                systems that scale
              </Highlighter>
              . Our work is driven by{' '}
              <Highlighter {...introBodyUnderline}>clarity, precision</Highlighter>
              , and the belief that great ideas must also be{' '}
              <Highlighter {...introBodyHighlight}>
                deeply engineered
              </Highlighter>
              .
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default IntroAbout;
