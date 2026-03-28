export interface ServiceEntry {
  slug: string;
  title: string;
  /** Short line for listings */
  summary: string;
  /** Longer copy for the detail page */
  body: string;
}

export const SERVICES: readonly ServiceEntry[] = [
  {
    slug: "custom-software-solutions",
    title: "Custom Software Solutions",
    summary:
      "Bespoke systems aligned with your workflows — from discovery to long-term support.",
    body:
      "We design and build software around how your team actually works: integrations, automation, and secure deployments that scale with you. You get clear milestones, documented handover, and a codebase you can evolve without starting over.",
  },
  {
    slug: "ai-solutions",
    title: "AI Solutions",
    summary:
      "Practical AI features: assistants, classification, and workflow automation.",
    body:
      "We ship AI where it improves outcomes: grounded prompts, evaluation, safety, and cost controls. Integration with your data and UX, not a demo that falls apart in production.",
  },
  {
    slug: "websites",
    title: "Websites",
    summary:
      "Fast, accessible marketing sites and product pages that convert and rank.",
    body:
      "Performance-first builds, SEO-aware structure, and content workflows your team can maintain. We pair strong UX with solid technical foundations so your site stays fast after launch.",
  },
  {
    slug: "web-apps-development",
    title: "Web Apps & Development",
    summary:
      "Dashboards, portals, and internal tools with robust APIs and clear UX.",
    body:
      "Full-stack delivery: authentication, roles, data modeling, and integrations. We focus on reliability, observability, and maintainability so your web app stays dependable as usage grows.",
  },
  {
    slug: "mobile-apps-development",
    title: "Mobile Apps & Development",
    summary:
      "Native-quality experiences on iOS and Android with a shared product vision.",
    body:
      "From MVPs to production releases: offline handling, push, analytics, and store readiness. We align mobile patterns with your brand and backend so users get one coherent product.",
  },
  {
    slug: "design-branding",
    title: "Design & Branding",
    summary:
      "Visual systems, UI kits, and brand language that stay consistent everywhere.",
    body:
      "We translate positioning into usable design systems — typography, color, components, and motion — so marketing and product teams ship cohesive experiences without constant rework.",
  },
  {
    slug: "video-photography-production",
    title: "Video & Photography Production",
    summary:
      "Campaign assets, explainers, and product visuals tuned for web and social.",
    body:
      "Concept through delivery: storyboards, shoots, edit, and export specs for every channel. Assets are produced to match your site and performance budgets.",
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    summary:
      "Acquisition and nurture programs grounded in measurable outcomes.",
    body:
      "We connect analytics, landing experiences, and messaging tests so you can see what moves the needle — then iterate with clear reporting, not vanity metrics.",
  },
] as const;

export function getServiceBySlug(slug: string): ServiceEntry | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
