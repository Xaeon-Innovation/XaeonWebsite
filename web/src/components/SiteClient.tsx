"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttribution } from "@/lib/attribution";
import { initAnalytics, installClickTracking, trackPageView } from "@/lib/analytics";

/**
 * Browser-only site behaviour: attribution capture, analytics, click tracking and scroll
 * reveals. Renders nothing.
 */
export default function SiteClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureAttribution();
    initAnalytics();
    return installClickTracking();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const qs = searchParams?.toString();
      trackPageView(pathname + (qs ? `?${qs}` : ""), document.title);
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname, searchParams]);

  // Scroll reveals: content is visible without JS; with JS, elements fade in as they enter.
  useEffect(() => {
    // Anything already on screen stays visible (no flash); only content below the fold animates.
    const all = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));
    for (const el of all) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
    }
    document.documentElement.classList.add("js");
    const els = all.filter((el) => !el.classList.contains("is-visible"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    // Safety net: never leave content hidden (e.g. screenshots, odd viewports).
    const fallback = window.setTimeout(() => els.forEach((el) => el.classList.add("is-visible")), 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [pathname]);

  return null;
}
