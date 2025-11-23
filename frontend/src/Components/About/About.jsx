import { motion } from 'framer-motion';
import styles from './About.module.css';

const AboutCard = ({ number, title, description, linkText }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true }}
    className={styles.card}
  >
    <div className={styles.cardNumber}>{number}</div>
    <h3 className={styles.cardTitle}>{title}</h3>
    <p className={styles.cardDescription}>{description}</p>
    <a href="#" className={styles.cardLink}>{linkText}</a>
  </motion.div>
);

const About = () => {
  const aboutCards = [
    {
      number: "01",
      title: "OUR MISSION",
      description: "AT XAEON, WE MERGE CREATIVITY WITH TECHNOLOGY TO CRAFT BOLD, FUTURE-READY BRAND EXPERIENCES THAT DRIVE GROWTH, CLARITY, AND LASTING IMPACT.",
      linkText: "Read More >"
    },
    {
      number: "02", 
      title: "OUR EXPERTISE",
      description: "AT XAEON, WE COMBINE EXPERTISE IN BRANDING, DESIGN, AND TECHNOLOGY TO HELP AMBITIOUS BUSINESSES SHAPE IDENTITIES, LAUNCH PRODUCTS, AND CREATE EXPERIENCES THAT RESONATE GLOBALLY.",
      linkText: "Read More >"
    },
    {
      number: "03",
      title: "OUR PROCESS",
      description: "AT XAEON, WE TURN INSIGHT INTO BOLD SOLUTIONS THAT BLEND DESIGN AND TECHNOLOGY—CRAFTING SEAMLESS, DISTINCTIVE BRAND EXPERIENCES BUILT FOR THE FUTURE.",
      linkText: "Read More >"
    }
  ];

  return (
    <section className={styles.about}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className={styles.header}
        >
          <h2 className={styles.title}>
            ABOUT <span className={styles.titleAccent} style={{ color: '#72C04F' }}>XAEON</span>
          </h2>
        </motion.div>

        <div className={styles.timelineContainer}>
          <div className={styles.timelineLine}></div>
          <div className={styles.timelineMarkers}>
            <div className={styles.marker}></div>
            <div className={styles.marker}></div>
            <div className={styles.marker}></div>
          </div>
        </div>

        <div className={styles.cardsGrid}>
          {aboutCards.map((card, index) => (
            <AboutCard
              key={index}
              number={card.number}
              title={card.title}
              description={card.description}
              linkText={card.linkText}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
