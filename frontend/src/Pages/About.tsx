import AboutPageHero from "../Components/AboutPage/AboutPageHero";
import AboutUsSection from "../Components/AboutPage/AboutUsSection";
import MeetOurTeamSection from "../Components/AboutPage/MeetOurTeamSection";
import ValuesSection from "../Components/AboutPage/ValuesSection";
import CallToAction from "../Components/CallToAction/CallToAction";
import Seo from "../seo/Seo";

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
      <MeetOurTeamSection />
      <ValuesSection />
      <CallToAction />
    </>
  );
};

export default About;
