import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { HelmetProvider } from "react-helmet-async";

import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import IntroVideoSplash from "../Components/IntroVideoSplash/IntroVideoSplash";

import "../App.css";

export default function MainLayout() {
  const [splashComplete, setSplashComplete] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!splashComplete) return;
    // Ensure each route starts at the hero/top.
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [location.pathname, splashComplete]);

  useEffect(() => {
    if (!splashComplete) return;

    const onScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [splashComplete]);

  return (
    <HelmetProvider>
      {!splashComplete ? (
        <IntroVideoSplash
          src="/assets/intro/video-project.mp4"
          onComplete={() => setSplashComplete(true)}
        />
      ) : (
        <>
          {/* Keep navbar outside app transform container for fixed positioning */}
          <Navbar />
          <div className="app-container min-h-screen relative">
            <main className="relative">
              <Outlet />
            </main>
            <Footer />
          </div>
          <button
            type="button"
            className={`scroll-top-btn ${showScrollTop ? "is-visible" : ""}`}
            aria-label="Scroll to top"
            onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
          >
            ^
          </button>
        </>
      )}
    </HelmetProvider>
  );
}
