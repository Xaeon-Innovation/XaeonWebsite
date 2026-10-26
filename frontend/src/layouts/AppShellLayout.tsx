import { Outlet } from "react-router";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/unbounded";
import { HelmetProvider } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { publicSiteUrl } from "../lib/appHost";
import styles from "./AppShellLayout.module.css";

/**
 * Minimal frame for sign-in, registration, password setup and the client portal: logo, a way
 * back to the website and a small footer. No public-site navigation.
 */
export default function AppShellLayout() {
  const year = new Date().getFullYear();
  return (
    <HelmetProvider>
      <div className={styles.shell}>
        <header className={styles.header}>
          <a href={publicSiteUrl("/")} className={styles.logo} aria-label="Xaeon website">
            <img src="/assets/backgrounds/logo.webp" alt="Xaeon" width={100} height={48} />
          </a>
          <a href={publicSiteUrl("/")} className={styles.back}>
            <ArrowLeft size={16} aria-hidden /> Back to website
          </a>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
        <footer className={styles.footer}>
          <span>© {year} Xaeon Software Solutions</span>
          <a href={publicSiteUrl("/privacy")}>Privacy</a>
          <a href={publicSiteUrl("/terms")}>Terms</a>
          <a href={publicSiteUrl("/book")}>Contact</a>
        </footer>
      </div>
    </HelmetProvider>
  );
}
