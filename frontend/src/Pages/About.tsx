import AboutPageHero from "../Components/AboutPage/AboutPageHero";
import AboutUsSection from "../Components/AboutPage/AboutUsSection";
import MeetOurTeamSection from "../Components/AboutPage/MeetOurTeamSection";
import ValuesSection from "../Components/AboutPage/ValuesSection";
import CallToAction from "../Components/CallToAction/CallToAction";
import Seo from "../seo/Seo";
import styles from "./About.module.css";

const About = () => {
  return (
    <>
      <Seo
        title="About us — Xaeon Software Solutions"
        description="Xaeon is a software and creative-technology team building scalable products: custom software, AI solutions, websites, apps, and digital growth."
        pathname="/about-us"
      />
      <AboutPageHero />
      <AboutUsSection />
      <section className={`${styles.separatorSection} ${styles.firstSeparator}`} aria-hidden>
        <img
          className={styles.separatorImage}
          src="/assets/backgrounds/about-separator.webp"
          alt=""
          loading="lazy"
        />
      </section>
      <div className={styles.teamOverlap}>
        <MeetOurTeamSection />
      </div>
      <section
        className={`${styles.separatorSection} ${styles.separatorInverted}`}
        aria-hidden
      >
        <img
          className={styles.separatorImage}
          src="/assets/backgrounds/about-separator.webp"
          alt=""
          loading="lazy"
        />
      </section>
      <ValuesSection />
      <CallToAction />
    </>
  );
};

export default About;
