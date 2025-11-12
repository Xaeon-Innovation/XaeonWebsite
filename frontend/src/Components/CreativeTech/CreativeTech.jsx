import { motion } from 'framer-motion';
import laptopImage from '../../assets/laptop.png';
import styles from './CreativeTech.module.css';

const CreativeTech = () => {
  return (
    <section className={styles.creativeTech}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Left side - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={styles.leftContent}
          >
            <h2 className={styles.headline}>
              CREATIVE TECH FOR{' '}
              <span className={styles.accentText}>COMPETITIVE GROWTH</span>
            </h2>
            
            <p className={styles.description}>
              At Xaeon Software Solutions, we help ideas come to life. We build smart software, AI tools, secure systems, and creative designs that make businesses stand out. Whether it's a custom app, a strong backend, or a digital marketing campaign, our goal is simple: give you the tools to grow in today's digital world. Beyond Time, Beyond Limits.
            </p>
          </motion.div>

          {/* Right side - Laptop Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className={styles.rightContent}
          >
            <div className={styles.imageContainer}>
              <img 
                src={laptopImage} 
                alt="Laptop showcasing XAEON's creative technology" 
                className={styles.laptopImage}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CreativeTech;

