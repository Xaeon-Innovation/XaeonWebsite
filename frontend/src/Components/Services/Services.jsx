import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Services.module.css';

const ServiceCard = ({ title, image, description }) => (
  <div className={styles.serviceCard}>
    <div className={styles.serviceImage}>
      <div className={styles.imagePlaceholder}>
        <div className={styles.imageIcon}>📱</div>
      </div>
    </div>
    <div className={styles.serviceContent}>
      <h3 className={styles.serviceTitle}>{title}</h3>
      <p className={styles.serviceDescription}>{description}</p>
    </div>
  </div>
);

const Services = () => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const services = [
    {
      title: "Photography Production",
      description: "Professional photography services for brands and businesses"
    },
    {
      title: "Mobile Apps & Development",
      description: "Custom mobile applications for iOS and Android platforms"
    },
    {
      title: "Websites & Branding",
      description: "Complete website development with custom branding solutions"
    },
    {
      title: "Web Apps & Development",
      description: "Advanced web applications with modern frameworks and technologies"
    },
    {
      title: "E-commerce Solutions",
      description: "Complete online store development with payment integration"
    },
    {
      title: "UI/UX Design",
      description: "User interface and experience design for digital products"
    },
    {
      title: "Digital Marketing",
      description: "Comprehensive digital marketing strategies and campaigns"
    },
    {
      title: "Cloud Solutions",
      description: "Scalable cloud infrastructure and deployment services"
    }
  ];

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.services}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className={styles.header}
        >
          <h2 className={styles.title}>
            Photography Production / Mobile Apps & Development / Websites & Branding / Web Apps & Development / Websites /
          </h2>
        </motion.div>

        <div className={styles.servicesContainer}>
          <button
            className={`${styles.scrollButton} ${styles.scrollLeft} ${!canScrollLeft ? styles.disabled : ''}`}
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <ChevronLeft size={24} />
          </button>

          <div
            ref={scrollRef}
            className={styles.servicesScroll}
            onScroll={checkScrollPosition}
          >
            <div className={styles.servicesGrid}>
              {services.map((service, index) => (
                <ServiceCard
                  key={index}
                  title={service.title}
                  description={service.description}
                />
              ))}
            </div>
          </div>

          <button
            className={`${styles.scrollButton} ${styles.scrollRight} ${!canScrollRight ? styles.disabled : ''}`}
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;
