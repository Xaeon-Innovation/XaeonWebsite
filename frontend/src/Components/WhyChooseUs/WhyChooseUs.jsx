import { motion } from 'framer-motion';
import styles from './WhyChooseUs.module.css';

const FeatureCard = ({ title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true }}
    className={styles.card}
  >
    <h3 className={styles.cardTitle}>{title}</h3>
    <p className={styles.cardDescription}>{description}</p>
  </motion.div>
);

const WhyChooseUs = () => {
  const features = [
    {
      title: "Innovative & Technology",
      description: "Our work combines bold thinking with cutting-edge technology to deliver solutions that stand out in the digital landscape."
    },
    {
      title: "Creative Excellence",
      description: "We bring creativity and artistic vision to every project, ensuring your brand has a unique and memorable digital presence."
    },
    {
      title: "Strategic Approach",
      description: "Every solution is backed by strategic thinking and market research to ensure maximum impact and return on investment."
    },
    {
      title: "Agile Development",
      description: "We use agile methodologies to deliver projects faster, with continuous feedback and iterative improvements throughout the process."
    },
    {
      title: "24/7 Support",
      description: "Our dedicated support team is available around the clock to ensure your digital solutions run smoothly and efficiently."
    },
    {
      title: "Proven Results",
      description: "With a track record of successful projects and satisfied clients, we deliver measurable results that drive business growth."
    }
  ];

  return (
    <section className={styles.whyChooseUs}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className={styles.header}
        >
          <h2 className={styles.title}>WHY CHOOSE XAEON</h2>
        </motion.div>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
