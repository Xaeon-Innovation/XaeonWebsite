import { motion } from 'framer-motion';
import styles from './About.module.css';

interface AboutCardProps {
  number: string;
  title: string;
  description: string;
  linkText: string;
}

const AboutCard = ({ number, title, description, linkText }: AboutCardProps) => (
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
  const aboutCards: AboutCardProps[] = [
    {
      number: "01",
      title: "OUR MISSION",
      description: "AT XAEON, WE EMBRACE CREATIVITY AND TECHNOLOGY TO DELIVER EXCEPTIONAL DIGITAL SOLUTIONS THAT DRIVE BUSINESS GROWTH AND INNOVATION.",
      linkText: "Read More »"
    },
    {
      number: "02",
      title: "OUR VISION",
      description: "TO BE THE LEADING CREATIVE-TECHNOLOGY HOUSE THAT TRANSFORMS IDEAS INTO DIGITAL REALITY, SHAPING THE FUTURE OF BRANDING AND DIGITAL INNOVATION.",
      linkText: "Read More »"
    },
    {
      number: "03",
      title: "OUR VALUES",
      description: "WE BELIEVE IN COLLABORATION, INNOVATION, AND EXCELLENCE. EVERY PROJECT IS AN OPPORTUNITY TO PUSH BOUNDARIES AND CREATE SOMETHING EXTRAORDINARY.",
      linkText: "Read More »"
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
          <h2 className={styles.title}>ABOUT XAEON</h2>
        </motion.div>

        <div className={styles.content}>
          {/* Laptop Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={styles.imageContainer}
          >
            <div className={styles.laptopPlaceholder}>
              <div className={styles.screen}>
                <div className={styles.screenContent}>
                  <div className={styles.codeLine}></div>
                  <div className={styles.codeLine}></div>
                  <div className={styles.codeLine}></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cards Grid */}
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
      </div>
    </section>
  );
};

export default About;
