import {
  Briefcase,
  CalendarDays,
  CreditCard,
  Files,
  GraduationCap,
  Hammer,
  Languages,
  LayoutDashboard,
  Mail,
  Newspaper,
  Palette,
  Plus,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Stethoscope,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { BuilderCategory } from "@/lib/builder";

export const CATEGORY_ICONS: Record<BuilderCategory, LucideIcon> = {
  clinics: Stethoscope,
  education: GraduationCap,
  professional: Briefcase,
  restaurants: UtensilsCrossed,
  "home-services": Hammer,
  catalogue: ShoppingBag,
};

/** Add-on `icon` names set in the admin → lucide icons (unknown names fall back to a plus). */
const ADDON_ICONS: Record<string, LucideIcon> = {
  calendar: CalendarDays,
  "credit-card": CreditCard,
  "shopping-bag": ShoppingBag,
  newspaper: Newspaper,
  languages: Languages,
  files: Files,
  mail: Mail,
  "layout-dashboard": LayoutDashboard,
  sparkles: Sparkles,
  smartphone: Smartphone,
  palette: Palette,
  users: Users,
  stethoscope: Stethoscope,
};

export function addonIcon(name?: string): LucideIcon {
  return (name && ADDON_ICONS[name]) || Plus;
}
