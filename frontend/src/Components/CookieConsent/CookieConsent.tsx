import { useEffect, useState } from "react";
import { Link } from "react-router";
import { analyticsEnabled, CONSENT_EVENT, getConsent, setConsent } from "../../lib/analytics";
import styles from "./CookieConsent.module.css";

/** Bottom consent bar for analytics/marketing cookies (only when an analytics ID is configured). */
export default function CookieConsent() {
  const [open, setOpen] = useState(() => analyticsEnabled() && getConsent() === null);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setOpen(detail === "reopen" && analyticsEnabled());
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!open) return null;

  return (
    <div className={styles.bar} role="dialog" aria-live="polite" aria-label="Cookie preferences">
      <p className={styles.text}>
        We use cookies to understand how visitors find and use our site, and to measure our ads.
        Accepting lets us improve what we show you. <Link to="/privacy" className={styles.link}>Privacy policy</Link>
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={() => setConsent("denied")}>
          Decline
        </button>
        <button type="button" className={styles.primary} onClick={() => setConsent("granted")}>
          Accept
        </button>
      </div>
    </div>
  );
}
