import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Facebook, Instagram, Linkedin, Twitter, Mail, type LucideIcon } from "lucide-react";
import api from "../lib/api";
import styles from "./Footer.module.css";

const COPYRIGHT_YEAR = new Date().getFullYear();

type SocialLinksPayload = {
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  emailUrl: string;
};

const FALLBACK_SOCIAL: SocialLinksPayload = {
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  twitterUrl: "",
  emailUrl: "mailto:info@xaeons.com",
};

const Footer = () => {
  const [social, setSocial] = useState<SocialLinksPayload>(FALLBACK_SOCIAL);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ socialLinks?: SocialLinksPayload }>("/site/social-links")
      .then((res) => {
        const s = res.data?.socialLinks;
        if (cancelled || !s) return;
        setSocial({
          facebookUrl: s.facebookUrl ?? "",
          instagramUrl: s.instagramUrl ?? "",
          linkedinUrl: s.linkedinUrl ?? "",
          twitterUrl: s.twitterUrl ?? "",
          emailUrl: s.emailUrl?.trim() || FALLBACK_SOCIAL.emailUrl,
        });
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const socialLinks = useMemo(() => {
    const defs: { name: string; icon: LucideIcon; key: keyof SocialLinksPayload }[] = [
      { name: "Facebook", icon: Facebook, key: "facebookUrl" },
      { name: "Instagram", icon: Instagram, key: "instagramUrl" },
      { name: "LinkedIn", icon: Linkedin, key: "linkedinUrl" },
      { name: "Twitter", icon: Twitter, key: "twitterUrl" },
      { name: "Email", icon: Mail, key: "emailUrl" },
    ];
    return defs
      .map((d) => {
        const href = social[d.key]?.trim() || "";
        if (!href) return null;
        return { name: d.name, icon: d.icon, href };
      })
      .filter(Boolean) as { name: string; icon: LucideIcon; href: string }[];
  }, [social]);

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
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={styles.socialIcon}
                  aria-label={item.name}
                  {...(item.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" as const }
                    : {})}
                >
                  <item.icon size={14} strokeWidth={1.75} />
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
            <Link to="/terms" className={styles.legalLink}>
              TERMS &amp; CONDITIONS
            </Link>
            <span className={styles.legalSeparator}>|</span>
            <Link to="/privacy" className={styles.legalLink}>
              PRIVACY POLICY
            </Link>
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
