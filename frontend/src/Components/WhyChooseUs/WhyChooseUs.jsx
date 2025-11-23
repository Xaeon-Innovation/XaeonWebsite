import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import styles from './WhyChooseUs.module.css';

const FeatureCard = ({ title, description, isHighlighted, index }) => {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  // Use mouse position when hovering, otherwise no gradient
  const gradientPosition = isHovering ? mousePosition : { x: 50, y: 50 };
  const shouldShowGradient = isHovering;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`${styles.card} ${isHighlighted ? styles.highlightedCard : ''} ${isHovering ? styles.hovering : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className={styles.gradientOverlay}
        style={{
          background: shouldShowGradient
            ? `radial-gradient(circle 300px at ${gradientPosition.x}% ${gradientPosition.y}%, rgba(114, 192, 79, 0.9) 0%, rgba(114, 192, 79, 0.7) 40%, transparent 60%)`
            : 'transparent'
        }}
      />
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
      </div>
    </motion.div>
  );
};

const WhyChooseUs = () => {
  const features = [
    {
      title: "Creative + Technology",
      description: "Our work combines bold creativity with advanced technology to deliver solutions that are both inspiring and practical."
    },
    {
      title: "Measurable Impact",
      description: "Every solution is engineered to deliver clarity, growth, and real business results you can track."
    },
    {
      title: "Global Perspective",
      description: "Our approach is shaped by working across industries and markets, giving us the edge to create world-class solutions."
    },
    {
      title: "Collaborative Process",
      description: "We work closely with you at every step, ensuring transparency, precision, and alignment with your goals.",
      isWide: true
    },
    {
      title: "Proven Experience",
      description: "From startups to established enterprises, we've helped ambitious brands grow, scale, and lead in competitive markets.",
      isHighlighted: true
    },
    {
      title: "End-to-End Expertise",
      description: "From brand strategy and design to software, apps, and digital campaigns, we cover the full spectrum."
    },
    {
      title: "Built to Last",
      description: "We create systems, platforms, and identities designed for long-term performance—not just short-term trends."
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
              isHighlighted={feature.isHighlighted}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
