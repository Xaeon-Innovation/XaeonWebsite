/**
 * The admin panel and client portal run on app.xaeons.com; the public website is the Next.js
 * site on xaeons.com. VITE_PUBLIC_SITE_ORIGIN overrides the detection (e.g. for staging).
 */
const host = typeof window === "undefined" ? "" : window.location.hostname;

export const IS_APP_HOST = /^app\./.test(host);

export const PUBLIC_SITE_ORIGIN = (
  import.meta.env.VITE_PUBLIC_SITE_ORIGIN || (IS_APP_HOST ? `https://${host.replace(/^app\./, "")}` : "")
).replace(/\/+$/, "");

/** Absolute link to a page on the public website (relative when served from the same host). */
export function publicSiteUrl(path = "/"): string {
  return `${PUBLIC_SITE_ORIGIN}${path}`;
}
