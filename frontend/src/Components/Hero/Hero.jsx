import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import styles from './Hero.module.css';

const Hero = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Wait for video to be ready
      const handleCanPlay = () => {
        video.play().catch(err => {
          console.log('Video play failed:', err);
        });
      };
      
      const handleLoadStart = () => {
        console.log('Video loading started');
      };
      
      const handleLoadedData = () => {
        console.log('Video data loaded');
        video.play().catch(err => console.log('Play on load failed:', err));
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadeddata', handleLoadedData);
      
      // Try to play immediately
      const playVideo = () => {
        video.play().catch(err => {
          console.log('Immediate play failed:', err);
        });
      };
      
      playVideo();
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, []);

  return (
    <section className={styles.hero}>
      {/* Background Video */}
      <video
        ref={videoRef}
        className={styles.backgroundVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        data-autoplay
      >
        <source src="/hpvid.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark overlay with fade-out effect */}
      <div className={styles.overlay}></div>

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Main Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={styles.slogan}
          >
            <h1 className={styles.headline}>
              <span className={styles.whiteText}>BEYOND</span>
              <span className={styles.greenText}> TIME.</span>
            </h1>
            <h1 className={styles.headline}>
              <span className={styles.whiteText}>BEYOND</span>
              <span className={styles.greenText}> LIMITS.</span>
            </h1>
          </motion.div>

          {/* Call to Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.ctaContainer}
          >
            <button className={styles.ctaButton}>
              Let's Work Together
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
