export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://xaeons.com").replace(/\/+$/, "");
export const APP_ORIGIN = (process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.xaeons.com").replace(/\/+$/, "");
export const ELEVORA_URL = "https://elevora.xaeons.com";

export const CONTACT = {
  email: "info@xaeons.com",
  phoneDisplay: "+20 101 597 1869",
  phoneE164: "+201015971869",
  whatsapp: "201015971869",
  street: "13 Roushdy Basha, Mustafa Kamel WA Bolkli, Sidi Gaber",
  city: "Alexandria",
  country: "EG",
} as const;

/** Order matters: it's the order on the services page and in navigation. */
export const SERVICE_SLUGS = [
  "custom-software-solutions",
  "ai-solutions",
  "websites",
  "web-apps-development",
  "mobile-apps-development",
  "design-branding",
  "video-photography-production",
  "digital-marketing",
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export function isServiceSlug(value: string): value is ServiceSlug {
  return (SERVICE_SLUGS as readonly string[]).includes(value);
}
