import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin, Twitter, Mail } from 'lucide-react';
import styles from './Footer.module.css';

const COPYRIGHT_YEAR = 2025;

const Footer = () => {

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Email', icon: Mail, href: 'mailto:info@xaeons.com' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className={styles.logoSection}
        >
          <img
            src="/assets/backgrounds/logo.webp"
            alt="XAEON"
            className={styles.logo}
          />
        </motion.div>

        {/* Main CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className={styles.ctaSection}
        >
          <h2 className={styles.ctaHeadline}>
            Let's Build Something <span className={styles.accentText}>Timeless</span>
          </h2>
          <p className={styles.ctaDescription}>
            Whether you're rethinking your brand or launching something new Xaeon is built to help you lead with clarity, impact, and purpose.
          </p>
        </motion.div>

        {/* Contact Locations Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className={styles.contactLocations}
        >
          <div className={styles.locationBlocks}>
            <div className={styles.locationBlock}>
              <h3 className={styles.locationTitle}>Alexandria</h3>
              <p className={styles.locationAddress}>
                13 Roushdy Basha, Mustafa Kamel WA Bolkli, Sidi Gaber, Alexandria, Egypt
              </p>
            </div>
            
            <div className={styles.locationSeparator}></div>
            
            <div className={styles.locationBlock}>
              <h3 className={styles.locationTitle}>UAE</h3>
              <p className={styles.locationStatus}>soon..</p>
            </div>
          </div>
        </motion.div>

        {/* Contact Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className={styles.contactStrip}
        >
          <div className={styles.contactStripContent}>
            <span className={styles.contactLabel}>Contact us</span>
            
            <div className={styles.separator}></div>
            
            <div className={styles.socialIcons}>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className={styles.socialIcon}
                  aria-label={social.name}
                >
                  <social.icon size={14} strokeWidth={1.75} />
                </a>
              ))}
            </div>
            
            <div className={styles.separator}></div>
            
            <a href="mailto:info@xaeons.com" className={styles.contactInfo}>
              info@xaeons.com
            </a>
            
            <div className={styles.separator}></div>
            
            <a href="tel:+01015971869" className={styles.contactInfo}>
              +010-159-718-69
            </a>
          </div>
        </motion.div>

        {/* Copyright & Legal Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className={styles.copyrightSection}
        >
          <div className={styles.legalLinks}>
            <a href="/terms" className={styles.legalLink}>TERMS & CONDITIONS</a>
            <span className={styles.legalSeparator}>|</span>
            <a href="/privacy" className={styles.legalLink}>PRIVACY POLICY</a>
          </div>
          <p className={styles.copyrightText}>
            © {COPYRIGHT_YEAR} Xaeon. All Right Reserved
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;