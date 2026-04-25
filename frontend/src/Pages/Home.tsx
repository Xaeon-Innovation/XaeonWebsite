import { useEffect } from "react";
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
import Seo from "../seo/Seo";

const Home = () => {
  useEffect(() => {
    const cleanup = initGsapScrollReveals();
    return cleanup;
  }, []);

  return (
    <>
      <Seo
        title="Xaeon Software Solutions — Custom Software, AI, and Digital Marketing"
        description="Xaeon builds websites, web apps, mobile apps, and custom software. We deliver AI solutions and digital marketing that drive measurable growth."
        pathname="/"
      />

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