import { Helmet } from "react-helmet-async";
import AboutPageHero from "../Components/AboutPage/AboutPageHero";
import AboutUsSection from "../Components/AboutPage/AboutUsSection";
import MeetOurTeamSection from "../Components/AboutPage/MeetOurTeamSection";
import ValuesSection from "../Components/AboutPage/ValuesSection";
import CallToAction from "../Components/CallToAction/CallToAction";
import styles from "./About.module.css";

const About = () => {
  return (
    <>
      <Helmet>
        <title>About us — Xaeon Software Solutions</title>
        <meta
          name="description"
          content="Xaeon is a creative-technology house shaping branding and digital innovation. We build identities, experiences, and systems that scale."
        />
      </Helmet>
      <AboutPageHero />
      <AboutUsSection />
      <section className={`${styles.separatorSection} ${styles.firstSeparator}`} aria-hidden>
        <img
          className={styles.separatorImage}
          src="/assets/backgrounds/about-separator.png"
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
          src="/assets/backgrounds/about-separator.png"
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
