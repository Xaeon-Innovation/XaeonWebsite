import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Apply scroll-based reveal animations to elements marked with `data-gsap="reveal"`.
 * Keeps the setup lightweight and safe for SSR.
 */
export function initGsapScrollReveals(root: ParentNode = document): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reducedMotion) {
    return () => {};
  }

  gsap.registerPlugin(ScrollTrigger);

  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap="reveal"]'));
  const triggers: ScrollTrigger[] = [];
  const initializedEls: HTMLElement[] = [];

  for (const el of elements) {
    // If already animated, avoid duplicates (e.g. HMR).
    if (el.dataset.gsapInitialized === "true") continue;
    el.dataset.gsapInitialized = "true";
    initializedEls.push(el);

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      toggleActions: "play none none none",
      onEnter: () => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        );
      },
    });

    triggers.push(trigger);
  }

  ScrollTrigger.refresh();

  return () => {
    for (const t of triggers) t.kill();
    for (const el of initializedEls) delete el.dataset.gsapInitialized;
  };
}

