import { Helmet } from "react-helmet-async";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import CallToAction from "../Components/CallToAction/CallToAction";
import { SERVICES } from "../data/servicesCatalog";
import styles from "./ServicesPage.module.css";

/** `/services` index — links match home marquee (`/services/:slug`). */
const Services = () => {
  return (
    <>
      <Helmet>
        <title>Services — Xaeon Software Solutions</title>
        <meta
          name="description"
          content="Explore Xaeon services: custom software, web and mobile apps, design, marketing, AI, and more."
        />
      </Helmet>

      <div className={styles.hero}>
        <video
          className={styles.heroVideo}
          src="/assets/videos/services-hero.webm"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroCaptionWrap}>
          <h1 className={styles.heroCaption}>WE BUILD BRANDS THAT LEAD</h1>
        </div>
      </div>

      <section className={styles.servicesTitleSection} aria-hidden="true">
        <img
          src="/assets/backgrounds/servicespng.webp"
          alt=""
          className={styles.servicesTitleImage}
        />
      </section>

      <div className={styles.page}>
        <ul className={styles.list}>
          {SERVICES.map((s, i) => (
            <li key={s.slug} className={styles.item}>
              <Link to={`/services/${s.slug}`} className={styles.card}>
                <span className={styles.index}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className={styles.cardMain}>
                  <span className={styles.cardTitle}>{s.title}</span>
                  <span className={styles.cardSummary}>{s.summary}</span>
                </div>
                <span className={styles.arrow} aria-hidden="true">
                  <ArrowUpRight className={styles.arrowIcon} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <CallToAction />
    </>
  );
};

export default Services;
