import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  // English keeps today's URLs (xaeons.com/services); Arabic lives under /ar.
  localePrefix: "as-needed",
  // Always serve English at "/" — never redirect based on the browser language, so crawlers
  // and shared links land where they point. The language switcher handles /ar.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
