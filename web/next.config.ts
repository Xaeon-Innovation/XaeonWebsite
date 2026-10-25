import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const API_ORIGIN = (process.env.API_ORIGIN || "https://api.xaeons.com").replace(/\/+$/, "");
// Admin panel + client portal (the existing Vite app) live on their own subdomain.
const APP_ORIGIN = (process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.xaeons.com").replace(/\/+$/, "");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "api.xaeons.com", pathname: "/uploads/**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    // Browser forms call /api/v1/* on xaeons.com; Vercel forwards them to the Express API.
    return [{ source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` }];
  },
  async redirects() {
    return [
      // Old URLs → new URLs (301) so existing rankings and links carry over.
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/our-work", destination: "/work", permanent: true },
      { source: "/book-now", destination: "/book", permanent: true },
      { source: "/contact", destination: "/book", permanent: true },
      { source: "/case-studies/:slug", destination: "/work/:slug", permanent: true },
      // Accounts, client portal and admin stay on the app.
      { source: "/login", destination: `${APP_ORIGIN}/login`, permanent: false },
      { source: "/register", destination: `${APP_ORIGIN}/register`, permanent: false },
      { source: "/set-password", destination: `${APP_ORIGIN}/set-password`, permanent: false },
      { source: "/dashboard/:path*", destination: `${APP_ORIGIN}/dashboard/:path*`, permanent: false },
      { source: "/admin/:path*", destination: `${APP_ORIGIN}/admin/:path*`, permanent: false },
    ];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
