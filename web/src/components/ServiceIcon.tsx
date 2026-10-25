import { Boxes, Clapperboard, Globe, LayoutDashboard, PenTool, Smartphone, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import type { ServiceSlug } from "@/lib/site";

const ICONS: Record<ServiceSlug, LucideIcon> = {
  "custom-software-solutions": Boxes,
  "ai-solutions": Sparkles,
  websites: Globe,
  "web-apps-development": LayoutDashboard,
  "mobile-apps-development": Smartphone,
  "design-branding": PenTool,
  "video-photography-production": Clapperboard,
  "digital-marketing": TrendingUp,
};

export default function ServiceIcon({ slug, size = 22, className = "" }: { slug: ServiceSlug; size?: number; className?: string }) {
  const Icon = ICONS[slug];
  return <Icon size={size} aria-hidden className={className} />;
}
