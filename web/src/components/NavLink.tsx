"use client";

import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";

/** Header link with an active state for the current section. */
export default function NavLink({ href, children, onClick, className = "" }: { href: string; children: ReactNode; onClick?: () => void; className?: string }) {
  const pathname = usePathname();
  const section = href.split("/").slice(0, 2).join("/");
  const active = pathname === href || pathname.startsWith(`${section}/`) || pathname === section;
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`block rounded-full px-3.5 py-2 text-sm transition-colors ${
        active ? "text-fog bg-white/[0.06]" : "text-mist hover:text-fog"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
