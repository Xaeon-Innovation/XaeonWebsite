import { Helmet } from 'react-helmet-async';
import Hero from '../components/Hero/Hero';
import IntroAbout from '../components/IntroAbout/IntroAbout';
import CreativeTech from '../components/CreativeTech/CreativeTech';
import About from '../components/About/About';
import WhyChooseUs from '../components/WhyChooseUs/WhyChooseUs';
import Services from '../components/Services/Services';
import Blogs from '../components/Blogs/Blogs';
import CallToAction from '../components/CallToAction/CallToAction';

const Home = () => {
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

      <Hero />
      <IntroAbout />
      <CreativeTech />
      <About />
      <WhyChooseUs />
      <Services />
      <Blogs />
      <CallToAction />
    </>
  );
};

export default Home;