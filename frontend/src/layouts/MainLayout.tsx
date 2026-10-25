import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { ChevronUp } from "lucide-react";

import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import IntroVideoSplash from "../Components/IntroVideoSplash/IntroVideoSplash";
import CookieConsent from "../Components/CookieConsent/CookieConsent";
import { installClickTracking, trackPageView } from "../lib/analytics";

import "../App.css";

const SPLASH_SEEN_KEY = "xaeon_intro_seen";

/**
 * The intro video only plays on a visitor's first homepage load per session. It never
 * runs for crawlers/prerender (navigator.webdriver), reduced-motion users, or deep links,
 * and the page renders underneath it so content and SEO tags are always in the DOM.
 */
function shouldShowSplash(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  if (pathname !== "/") return false;
  if (navigator.webdriver) return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return window.sessionStorage.getItem(SPLASH_SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}

function markSplashSeen(): void {
  try {
    window.sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
  } catch {
    // Storage blocked (private mode etc.): splash may show again, which is harmless.
  }
}

export default function MainLayout() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(() => shouldShowSplash(location.pathname));
  const splashComplete = !showSplash;
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!splashComplete) return;
    // Ensure each route starts at the hero/top.
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [location.pathname, splashComplete]);

  // SPA page views: wait a tick so Helmet has written the new <title>.
  useEffect(() => {
    const id = window.setTimeout(() => {
      trackPageView(location.pathname + location.search, document.title);
    }, 0);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search]);

  useEffect(() => installClickTracking(), []);

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
      {showSplash && (
        <IntroVideoSplash
          src="/assets/intro/video-project.webm"
          onComplete={() => {
            markSplashSeen();
            setShowSplash(false);
          }}
        />
      )}
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
        <ChevronUp size={20} aria-hidden="true" />
      </button>
      <CookieConsent />
    </HelmetProvider>
  );
}
