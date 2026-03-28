import { motion } from "framer-motion";
import styles from "./ValuesSection.module.css";

type ValueCard = {
  title: string;
  description: string;
};

const VALUES: ValueCard[] = [
  {
    title: "Clarity Over Noise",
    description:
      "We focus on depth and purpose, not hype, delivering solutions that truly matter.",
  },
  {
    title: "Creative Logic",
    description:
      "Our ideas are bold yet always structured, turning imagination into practical innovation.",
  },
  {
    title: "Consistency",
    description:
      "High standards guide every step we take, ensuring reliable quality without compromise.",
  },
  {
    title: "Design with Intent",
    description:
      "Beauty means nothing without meaning; every detail serves a purpose.",
  },
  {
    title: "Built to Endure",
    description:
      "We design for the long run, not fleeting trends, creating solutions that stand the test of time.",
  },
  {
    title: "Adaptive Innovation",
    description:
      "We evolve with change, turning challenges into opportunities through smart, flexible solutions.",
  },
];

const ValuesSection = () => {
  return (
    <section className={styles.section} aria-labelledby="values-title">
      <div className={styles.inner}>
        <motion.h2
          id="values-title"
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.35 }}
        >
          VALUES
        </motion.h2>

        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.35 }}
        >
          To build distinctive, scalable, and high-performing brand and digital
          experiences that leave a lasting impression.
        </motion.p>

        <div className={styles.grid}>
          {VALUES.map((item, index) => (
            <motion.article
              key={item.title}
              className={`${styles.card} ${styles[`bg${index + 1}` as keyof typeof styles]}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: index * 0.05, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;
