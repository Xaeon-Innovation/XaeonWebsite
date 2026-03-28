import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { HeroSequence } from "../Components/HeroSequence";
import IntroAbout from "../Components/IntroAbout/IntroAbout";
import CreativeTech from "../Components/CreativeTech/CreativeTech";
import WhyChooseUs from "../Components/WhyChooseUs/WhyChooseUs";
import Services from "../Components/Services/Services";
import Blogs from "../Components/Blogs/Blogs";
import CaseStudies from "../Components/CaseStudies/CaseStudies";
import OurStack from "../Components/OurStack/OurStack";
import CallToAction from "../Components/CallToAction/CallToAction";
import { initGsapScrollReveals } from "../lib/gsapScroll";

const Home = () => {
  useEffect(() => {
    const cleanup = initGsapScrollReveals();
    return cleanup;
  }, []);

  return (
    <>
      <Helmet>
        <title>Xaeon Software Solutions - Leading Software Development Company</title>
        <meta name="description" content="Xaeon Software Solutions is a leading software development company specializing in web development, mobile apps, UI/UX design, and digital transformation solutions." />
        <meta name="keywords" content="software development, web development, mobile apps, UI/UX design, digital solutions" />
        <meta property="og:title" content="Xaeon Software Solutions - Leading Software Development Company" />
        <meta property="og:description" content="Transform your business with our innovative software solutions. Expert development team delivering cutting-edge digital products." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <HeroSequence />
      <div data-gsap="reveal">
        <IntroAbout />
      </div>
      <div data-gsap="reveal">
        <CreativeTech />
      </div>
      {/* No data-gsap wrapper: parent reveal tweens would add transforms and conflict with
          WhyChooseUs’s internal GSAP ScrollTrigger scrub (cards + SVG paths). */}
      <WhyChooseUs />
      <Services />
      {/* CaseStudies uses pinned ScrollTrigger + scrub; a parent data-gsap reveal would conflict */}
      <CaseStudies />
      <div data-gsap="reveal">
        <Blogs />
      </div>
      <div data-gsap="reveal">
        <OurStack />
      </div>
      <CallToAction />
    </>
  );
};

export default Home;