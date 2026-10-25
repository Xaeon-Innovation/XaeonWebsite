/**
 * Analytics: Google Analytics 4 (with Consent Mode v2) and the Meta Pixel.
 *
 * - IDs come from env (VITE_GA4_ID, VITE_META_PIXEL_ID). With neither set, everything here
 *   is a no-op and no consent banner is shown.
 * - GA4 loads with all storage denied until the visitor accepts (cookieless pings only).
 * - The Meta Pixel loads only after acceptance.
 * - Nothing runs for prerender/crawlers (navigator.webdriver).
 */
import { forgetPersistedAttribution, persistAttribution } from "./attribution";

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...args: unknown[]) => void; push?: unknown };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export type ConsentChoice = "granted" | "denied";

const GA4_ID = (import.meta.env.VITE_GA4_ID ?? "").trim();
const META_PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID ?? "").trim();
const CONSENT_KEY = "xaeon_consent";
export const CONSENT_EVENT = "xaeon:consent-change";

let initialized = false;
let pixelLoaded = false;

function isBot(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.webdriver);
}

export function analyticsEnabled(): boolean {
  return typeof window !== "undefined" && !isBot() && Boolean(GA4_ID || META_PIXEL_ID);
}

export function getConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function loadScript(src: string): void {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function loadGa4(): void {
  if (!GA4_ID) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js reads the raw `arguments` object from dataLayer.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  const granted = getConsent() === "granted";
  window.gtag("consent", "default", {
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
    analytics_storage: granted ? "granted" : "denied",
    wait_for_update: 500,
  });
  window.gtag("js", new Date());
  // Page views are sent manually on route change (this is a single-page app).
  window.gtag("config", GA4_ID, { send_page_view: false });
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`);
}

function loadMetaPixel(): void {
  if (!META_PIXEL_ID || pixelLoaded) return;
  pixelLoaded = true;
  // Standard Meta Pixel bootstrap, typed.
  const fbq: Fbq = function fbqShim(...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue!.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;
  window.fbq = fbq;
  window._fbq = fbq;
  loadScript("https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");
}

/** Call once on app start. */
export function initAnalytics(): void {
  if (initialized || !analyticsEnabled()) return;
  initialized = true;
  loadGa4();
  if (getConsent() === "granted") loadMetaPixel();
}

export function setConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage blocked: the choice applies to this page view only.
  }
  const value = choice === "granted" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
  if (choice === "granted") {
    persistAttribution();
    loadMetaPixel();
  } else {
    forgetPersistedAttribution();
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

/** Re-open the consent banner (footer "Cookie settings" link). */
export function openConsentSettings(): void {
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: "reopen" }));
}

export function trackPageView(path: string, title: string): void {
  if (!initialized) return;
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
  // The pixel sends its first PageView on load; later SPA navigations are sent here.
  if (pixelLoaded) window.fbq?.("track", "PageView");
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (!initialized) return;
  window.gtag?.("event", name, params);
}

export type LeadKind = "contact" | "service" | "package" | "booking" | "registered";

/** A submitted lead: GA4 `generate_lead` (mark it as a key event in GA4) + Meta `Lead`/`Schedule`. */
export function trackLead(kind: LeadKind, params: Record<string, unknown> = {}): void {
  if (!initialized) return;
  window.gtag?.("event", "generate_lead", { lead_type: kind, ...params });
  if (pixelLoaded) window.fbq?.("track", kind === "booking" ? "Schedule" : "Lead", { content_category: kind });
}

/**
 * Delegated click tracking: any element with `data-track="name"` (and optional
 * `data-track-label`) fires `cta_click`; tel:, mailto: and WhatsApp links fire `contact_click`.
 */
export function installClickTracking(): () => void {
  const onClick = (e: MouseEvent) => {
    if (!initialized) return;
    const target = e.target as Element | null;
    const tracked = target?.closest?.("[data-track]") as HTMLElement | null;
    if (tracked) {
      trackEvent("cta_click", {
        cta_name: tracked.dataset.track,
        cta_label: tracked.dataset.trackLabel ?? tracked.textContent?.trim().slice(0, 80),
        page_path: window.location.pathname,
      });
    }
    const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
    const href = link?.getAttribute("href") ?? "";
    const method = href.startsWith("tel:")
      ? "phone"
      : href.startsWith("mailto:")
        ? "email"
        : href.includes("wa.me/") || href.includes("api.whatsapp.com")
          ? "whatsapp"
          : null;
    if (method) {
      trackEvent("contact_click", { method, page_path: window.location.pathname });
      if (pixelLoaded) window.fbq?.("track", "Contact", { content_category: method });
    }
  };
  document.addEventListener("click", onClick, { capture: true });
  return () => document.removeEventListener("click", onClick, { capture: true });
}
